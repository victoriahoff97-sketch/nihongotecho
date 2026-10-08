/* Nihongo Techō – Gemeinsamer Schreibbereich: eingebettete Stiftfläche + getippter Text mit Vokabel-/Grammatik-Verknüpfung
   (genutzt von Unterricht und Anwenden) */
'use strict';
(function (App) {
  const { esc, icon } = App;

  // Neue Vokabel/Grammatik anlegen; nach dem Speichern onLinked(it, true)
  App.newLinked = (type, defaults, onLinked) => App.editItem({
    type, defaults: Object.assign({}, defaults),
    onSaved: async (it) => { if (onLinked) await onLinked(it, true); },
  });

  // ---------- Handschrift ----------
  // opts: { sheets, activeId, sheetMeta(paper, n), multiSheet, onSelect(fileId), newDefaults (Objekt oder (type) => Objekt), onLinked, onUnlinked }
  // onUnlinked(itemId): die letzte Markierung eines Wortes wurde auf dem Blatt gelöst
  // Liefert { dropLinks(itemId) }: Markierungen eines Wortes vom Blatt nehmen (Verknüpfung wurde woanders entfernt)
  App.inkArea = (host, { sheets = [], activeId, sheetMeta, multiSheet = true, onSelect, newDefaults = {}, onLinked, onUnlinked } = {}) => {
    const defaultsFor = (type) => (typeof newDefaults === 'function' ? newDefaults(type) : newDefaults);
    // Treffer aus dem Nachschlagen-Fenster (nach „Erkennen“) verknüpfen: eigener Eintrag direkt, Wörterbuch-Treffer über den
    // vorbelegten Vokabel-Dialog. Liefert den Eintrag; bleibt offen, wenn der Dialog abgebrochen wird.
    const linkWord = (r) => new Promise((res) => {
      const own = r.id && App.item(r.id);
      if (own) {
        (async () => {
          // wie beim Verknüpfen im getippten Text: Fundort merken, ungeprüfte Vokabel zum Lernen vormerken
          const ctx = own.type === 'vocab' && (defaultsFor('vocab').contexts || [])[0];
          if (ctx) {
            own.contexts = (own.contexts || []).filter((c) => !(c.sessionId === ctx.sessionId && c.itemId === ctx.itemId && c.text === ctx.text)).concat(ctx);
            await App.saveItem(own, { silent: true });
          }
          if (own.type === 'vocab' && App.vocabStatus(own.id) === 'unchecked') await App.setCheck(own.id, 'learn');
          if (onLinked) await onLinked(own, false);
          res(own);
        })();
        return;
      }
      const d = r.entry ? App.dictVocabDefaults(r.entry, [r.jp, r.kana]) : { kanji: r.jp !== r.kana ? r.jp : '', kana: r.kana, de: r.meaning };
      App.editItem({
        type: 'vocab', single: true, title: 'Neue Vokabel verknüpfen', defaults: Object.assign({}, defaultsFor('vocab'), d),
        onSaved: async (it) => { if (onLinked) await onLinked(it, true); res(it); },
      });
    });
    const UL = App.uLogic;
    let ctrl = null, left = false;
    const api = { dropLinks: (itemId) => (ctrl ? ctrl.dropLinks(itemId) : Promise.all(sheets.map((f) => App.ink.dropLinks(f.id, itemId)))) };
    if (!sheets.length) {
      host.innerHTML = `<div class="card pad-lg"><h3 style="margin-top:0">Auf welchem Papier schreibst du?</h3>
        <div class="paper-pick">${UL.PAPERS.map(([k, l]) => `<button class="paper-tile" data-paper="${k}"><canvas width="120" height="170"></canvas><span>${l}</span></button>`).join('')}</div></div>`;
      host.querySelectorAll('.paper-tile canvas').forEach((cv) => App.ink.drawPaper(cv.getContext('2d'), cv.width, cv.height, cv.parentElement.dataset.paper));
      let busy = false; // Doppeltipp darf kein zweites Blatt anlegen
      host.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-paper]'); if (!b || busy) return;
        busy = true;
        const paper = b.dataset.paper;
        let f;
        try {
          f = await App.addFile(new Blob(['{}'], { type: 'application/x-notebook' }), Object.assign(sheetMeta(paper, 1), { mime: 'application/x-notebook', pages: 1 }));
          f.mime = 'application/x-notebook'; f.pagePapers = [paper]; await App.updateFile(f);
        } catch (err) { busy = false; throw err; }
        onSelect && onSelect(f.id);
      });
      return api;
    }
    const active = sheets.find((f) => f.id === activeId) || sheets[sheets.length - 1];
    host.innerHTML = `${multiSheet ? `<div class="nb-switch chips">${sheets.length > 1 ? sheets.map((f, i) => `<button class="chip ${f === active ? 'on' : ''}" data-nb="${f.id}">Blatt ${i + 1}</button>`).join('') : ''}
      <button class="chip" data-nb-new>${icon('plus')} Neues Blatt</button></div>` : ''}<div data-ink></div>`;
    if (multiSheet) {
      host.querySelectorAll('[data-nb]').forEach((b) => (b.onclick = () => onSelect && onSelect(b.dataset.nb)));
      host.querySelector('[data-nb-new]').onclick = async () => {
        const f = await App.newNotebook(Object.assign(sheetMeta(active.paper, sheets.length + 1), { askName: false }), { open: false });
        if (f && onSelect) onSelect(f.id);
      };
    }
    // Schreibfläche einbetten; beim Verlassen/Neuzeichnen sauber abbauen
    App.onLeave(() => { left = true; if (ctrl) ctrl.destroy(); });
    // Schreibfläche füllt genau den restlichen Bildschirm (nicht darüber hinaus)
    const inkEl = host.querySelector('[data-ink]');
    const fit = () => { const top = inkEl.getBoundingClientRect().top + window.scrollY; inkEl.style.minHeight = '0'; inkEl.style.height = Math.max(360, window.innerHeight - top - 16) + 'px'; };
    fit();
    window.addEventListener('resize', fit);
    App.onLeave(() => window.removeEventListener('resize', fit));
    // Werkzeug-Zustand übernehmen, wenn man gerade aus dem Vollbild dieses Blatts kommt
    const last = App.ink.lastState && App.ink.lastState.fileId === active.id ? App.ink.lastState : {};
    App.ink.mount(inkEl, active.id, {
      embedded: true, defaultTool: 'fountain', ...last,
      extraTools: [
        { id: 'vocab', label: 'Vokabel', icon: 'plus', onClick: () => App.newLinked('vocab', defaultsFor('vocab'), onLinked) },
        { id: 'grammar', label: 'Grammatik', icon: 'plus', onClick: () => App.newLinked('grammar', defaultsFor('grammar'), onLinked) },
      ],
      onLinkWord: linkWord, onUnlinkWord: onUnlinked,
      // Vollbild: eingebettete Fläche abbauen, damit sie nach dem Schließen frisch geladen wird
      onFullscreen: () => { const tools = ctrl ? ctrl.state() : {}; if (ctrl) ctrl.destroy(); App.ink.open(active.id, { ...tools, onLinkWord: linkWord, onUnlinkWord: onUnlinked }); },
    }).then((c) => { ctrl = c; if (left && c) c.destroy(); });
    return api;
  };

  // ---------- Getippt ----------
  // opts: { html, onSave(html), newDefaults, onLinked, contextInfo() → ctx, placeholder, hint, linkLabel, linkRefs }
  // linkRefs: per „Verlinken“ eingefügte Verweise zählen als verknüpft (onLinked(it, false)); Unterricht lässt es aus.
  App.typedArea = (host, { html = '', onSave, newDefaults = {}, onLinked, contextInfo, placeholder, hint = '', linkLabel, linkRefs = false } = {}) => {
    host.innerHTML = `<div data-rte></div>${hint ? `<p class="small muted">${hint}</p>` : ''}`;
    return App.rte(host.querySelector('[data-rte]'), html, onSave, {
      placeholder, linkLabel,
      onRefItem: linkRefs && onLinked ? (it) => onLinked(it, false) : undefined,
      onNewItem: (t, d, cb) => App.newLinked(t, Object.assign({}, newDefaults, d), async (it) => { cb && cb(it); if (onLinked) await onLinked(it, true); }),
      contextInfo,
      // Bestehende Vokabel verknüpfen: Kontext anhängen (gleicher Ort + Satz wird ersetzt), ggf. zum Lernen vormerken
      onLinkItem: async (it, ctx) => {
        it.contexts = (it.contexts || []).filter((c) => !(c.sessionId === ctx.sessionId && c.itemId === ctx.itemId && c.text === ctx.text)).concat(ctx);
        await App.saveItem(it, { silent: true });
        if (App.vocabStatus(it.id) === 'unchecked') await App.setCheck(it.id, 'learn');
        if (onLinked) await onLinked(it, false);
      },
    });
  };
})(window.App);
