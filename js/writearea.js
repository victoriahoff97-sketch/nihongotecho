/* Nihongo Techō – Gemeinsamer Schreibbereich: eingebettete Stiftfläche + getippter Text mit Vokabel-/Grammatik-Verknüpfung
   (genutzt von Unterricht und Anwenden; die Wort-Verknüpfung auch vom Aufgabenblatt) */
'use strict';
(function (App) {
  const { esc, icon } = App;

  // Neue Vokabel/Grammatik anlegen; nach dem Speichern onLinked(it, true)
  App.newLinked = (type, defaults, onLinked) => App.editItem({
    type, defaults: Object.assign({}, defaults),
    onSaved: async (it) => { if (onLinked) await onLinked(it, true); },
  });

  // Kanji aus markiertem Text anlegen (fertig ausgefüllt, App.createKanji) und verknüpfen; onLinked(it, isNew) je Kanji.
  // Ein Kanji direkt, mehrere über die Auswahl mit genau diesen Zeichen vorgewählt. Kennt die App ein einzelnes Zeichen nicht,
  // öffnet das Kanji-Formular. Liefert die verknüpften Kanji ([] = nichts getan).
  App.linkKanji = async (text, defaults = {}, onLinked, { quiet = false } = {}) => {
    const cs = App.kanjiLogic.kanjiChars(text);
    const defs = () => Object.assign({}, defaults, { tags: (defaults.tags || []).slice() });
    if (!cs.length) { App.toast('In der Markierung ist kein Kanji'); return []; }
    if (cs.length === 1) {
      const ch = cs[0], had = App.kanjiByChar(ch);
      const it = had || await App.createKanji(ch, defs());
      if (!it) {
        return new Promise((res) => App.editItem({
          type: 'kanji', single: true, title: 'Neues Kanji verknüpfen', defaults: Object.assign(defs(), { char: ch }),
          onSaved: async (k) => { if (onLinked) await onLinked(k, true); res([k]); },
        }));
      }
      if (onLinked) await onLinked(it, !had);
      if (!quiet) App.toast(had ? `Kanji ${ch} verknüpft` : `Kanji ${ch} angelegt und verknüpft`);
      return [it];
    }
    const ix = (await App.kanjiIndex()) || {};
    const had = new Set();
    const selected = cs.map((c) => { const k = App.kanjiByChar(c); if (k) had.add(k.id); return k ? k.id : ix[c] ? App.pickNew(c) : null; }).filter(Boolean);
    const ids = await App.pickItems({ title: 'Kanji verknüpfen', types: ['kanji'], selected, q: cs.join(''), kanjiDefaults: defs() });
    if (!ids || !ids.length) return [];
    const items = ids.map(App.item).filter(Boolean);
    for (const it of items) if (onLinked) await onLinked(it, !had.has(it.id));
    if (!quiet) App.toast(`${items.length} Kanji verknüpft`);
    return items;
  };

  // Treffer aus dem Nachschlagen-Fenster (nach „Erkennen“) verknüpfen: eigener Eintrag (Wort oder Grammatik) direkt,
  // Wörterbuch-Treffer über den vorbelegten Vokabel-Dialog, r.create = die Eingabe als neue Vokabel/Grammatik/Kanji anlegen.
  // defaultsFor(type) → Vorgaben für neue Einträge (Vokabel: contexts[0] = Fundort).
  // Liefert den Eintrag; bleibt offen, wenn der Dialog abgebrochen wird.
  App.wordLinker = (defaultsFor, onLinked) => (r) => new Promise((res) => {
    // ein eingekreistes Kanji, das noch nicht in der Sammlung ist: fertig ausgefüllt anlegen
    if (r.create === 'kanji') { App.linkKanji(r.q, defaultsFor('kanji'), onLinked, { quiet: true }).then((l) => l[0] && res(l[0])); return; }
    if (r.create) {
      const type = r.create === 'grammar' ? 'grammar' : 'vocab';
      App.editItem({
        type, single: true, title: type === 'grammar' ? 'Neue Grammatik verknüpfen' : 'Neue Vokabel verknüpfen',
        defaults: Object.assign({}, defaultsFor(type), App.lookupLogic.newDefaults(type, r.q)),
        onSaved: async (it) => { if (onLinked) await onLinked(it, true); res(it); },
      });
      return;
    }
    const own = r.id && App.item(r.id);
    if (own) {
      (async () => {
        // wie beim Verknüpfen im getippten Text: Fundort merken, ungeprüfte Vokabel zum Lernen vormerken
        const ctx = own.type === 'vocab' && (defaultsFor('vocab').contexts || [])[0];
        if (ctx) {
          own.contexts = (own.contexts || []).filter((c) => !(c.sessionId === ctx.sessionId && c.itemId === ctx.itemId && c.exerciseId === ctx.exerciseId && c.text === ctx.text)).concat(ctx);
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

  // „＋ Vokabel / Grammatik (/ Ausdruck)“ einer Schreibfläche; menuLabel: Beschriftung im „⋯“-Menü (Vollbild) – dort steht kein „+“ davor
  const linkTools = (defaultsFor, onLinked, newPhrase) => [
    { id: 'vocab', label: 'Vokabel', menuLabel: 'Neue Vokabel', icon: 'plus', onClick: () => App.newLinked('vocab', defaultsFor('vocab'), onLinked) },
    { id: 'grammar', label: 'Grammatik', menuLabel: 'Neue Grammatik', icon: 'plus', onClick: () => App.newLinked('grammar', defaultsFor('grammar'), onLinked) },
  ].concat(newPhrase ? [{ id: 'phrase', label: 'Ausdruck', menuLabel: 'Neuer Ausdruck', icon: 'plus', onClick: () => App.newLinked('phrase', defaultsFor('phrase'), onLinked) }] : []);

  // ---------- Wohin ein Blatt gehört ----------
  // Ein Blatt, das zu einer Stunde, einer Antwort/einem Tagebucheintrag oder einer Buchaufgabe gehört, bringt seine
  // Verknüpfungen überall mit – egal ob es aus der Stunde, der Bibliothek oder der Suche geöffnet wird (ink.js, INK.open).
  // App.sheetHome(fn): fn(file) → { newDefaults (Objekt oder (type) => Objekt), onLinked, onUnlinked, newPhrase } oder nichts
  const homes = [];
  App.sheetHome = (fn) => { homes.push(fn); };
  App.sheetLinkOpts = (f) => {
    for (const fn of homes) {
      const h = f && fn(f);
      if (!h) continue;
      const defaultsFor = (type) => (typeof h.newDefaults === 'function' ? h.newDefaults(type) : h.newDefaults || {});
      return { extraTools: linkTools(defaultsFor, h.onLinked, h.newPhrase), extraInMenu: true, onLinkWord: App.wordLinker(defaultsFor, h.onLinked), onUnlinkWord: h.onUnlinked };
    }
    return null;
  };

  // ---------- Handschrift ----------
  // opts: { sheets, activeId, page (Seite ab 1, auf der das Blatt aufgeht), sheetMeta(paper, n), multiSheet, onSelect(fileId), newDefaults (Objekt oder (type) => Objekt), onLinked, onUnlinked, newPhrase }
  // newPhrase: zusätzlich „＋ Ausdruck“ in der Stiftleiste (nur wo onLinked Ausdrücke verknüpft, z. B. Unterricht)
  // onUnlinked(itemId): die letzte Markierung eines Wortes wurde auf dem Blatt gelöst
  // Liefert { dropLinks(itemId) }: Markierungen eines Wortes vom Blatt nehmen (Verknüpfung wurde woanders entfernt)
  App.inkArea = (host, { sheets = [], activeId, page, sheetMeta, multiSheet = true, onSelect, newDefaults = {}, onLinked, onUnlinked, newPhrase = false } = {}) => {
    const defaultsFor = (type) => (typeof newDefaults === 'function' ? newDefaults(type) : newDefaults);
    const linkWord = App.wordLinker(defaultsFor, onLinked);
    const UL = App.uLogic;
    let ctrl = null, left = false;
    const api = { dropLinks: (itemId) => (ctrl ? ctrl.dropLinks(itemId) : Promise.all(sheets.map((f) => App.ink.dropLinks(f.id, itemId)))) };
    if (!sheets.length) {
      host.innerHTML = `<div class="card pad-lg"><h3 style="margin-top:0">Auf welchem Papier schreibst du?</h3>
        ${App.ink.paperTiles()}</div>`;
      App.ink.drawPaperTiles(host);
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
    // Dazu entfällt der untere Seitenrand (body.ink-fit) – sonst ließe sich die ganze Seite unter der Fläche weiterscrollen
    document.body.classList.add('ink-fit');
    App.onLeave(() => document.body.classList.remove('ink-fit'));
    const inkEl = host.querySelector('[data-ink]');
    const fit = () => { const top = inkEl.getBoundingClientRect().top + window.scrollY; inkEl.style.minHeight = '0'; inkEl.style.height = Math.max(360, window.innerHeight - top - 16) + 'px'; };
    fit();
    window.addEventListener('resize', fit);
    App.onLeave(() => window.removeEventListener('resize', fit));
    // Werkzeug-Zustand übernehmen, wenn man gerade aus dem Vollbild dieses Blatts kommt
    const last = App.ink.lastState && App.ink.lastState.fileId === active.id ? App.ink.lastState : {};
    const extraTools = linkTools(defaultsFor, onLinked, newPhrase);
    App.ink.mount(inkEl, active.id, {
      embedded: true, ...last, ...(page > 1 && active.id === activeId ? { page } : {}),
      extraTools,
      onLinkWord: linkWord, onUnlinkWord: onUnlinked,
      // Vollbild: eingebettete Fläche abbauen, damit sie nach dem Schließen frisch geladen wird.
      // Die „+“-Knöpfe gehen mit – im „⋯“-Menü, damit die Leiste dort einzeilig bleibt (wie bei den Buchaufgaben)
      onFullscreen: () => { const tools = ctrl ? ctrl.state() : {}; if (ctrl) ctrl.destroy(); App.ink.open(active.id, { ...tools, extraTools, extraInMenu: true, onLinkWord: linkWord, onUnlinkWord: onUnlinked }); },
    }).then((c) => { ctrl = c; if (left && c) c.destroy(); });
    return api;
  };

  // ---------- Getippt ----------
  // opts: { html, onSave(html), newDefaults, onLinked, contextInfo() → ctx, placeholder, hint, linkLabel, linkRefs, newPhrase, markTitle }
  // linkRefs: per „Verlinken“ eingefügte Verweise zählen als verknüpft (onLinked(it, false)); Unterricht lässt es aus.
  // newPhrase / markTitle / dictate: wie bei der Handschrift „＋ Ausdruck“ · Hinweis am Markieren-Knopf · Diktieren (siehe App.rte)
  App.typedArea = (host, { html = '', onSave, newDefaults = {}, onLinked, contextInfo, placeholder, hint = '', linkLabel, linkRefs = false, newPhrase = false, markTitle, dictate } = {}) => {
    host.innerHTML = `<div data-rte></div>${hint ? `<p class="small muted">${hint}</p>` : ''}`;
    return App.rte(host.querySelector('[data-rte]'), html, onSave, {
      placeholder, linkLabel, newPhrase, markTitle, dictate, kanjiDefaults: newDefaults,
      onRefItem: linkRefs && onLinked ? (it) => onLinked(it, false) : undefined,
      onKanji: (text) => App.linkKanji(text, newDefaults, onLinked),
      onNewItem: (t, d, cb) => App.newLinked(t, Object.assign({}, newDefaults, d), async (it) => { cb && cb(it); if (onLinked) await onLinked(it, true); }),
      contextInfo,
      // Bestehende Vokabel verknüpfen: Kontext anhängen (gleicher Ort + Satz wird ersetzt), ggf. zum Lernen vormerken
      onLinkItem: async (it, ctx) => {
        it.contexts = (it.contexts || []).filter((c) => !(c.sessionId === ctx.sessionId && c.itemId === ctx.itemId && c.exerciseId === ctx.exerciseId && c.text === ctx.text)).concat(ctx);
        await App.saveItem(it, { silent: true });
        if (App.vocabStatus(it.id) === 'unchecked') await App.setCheck(it.id, 'learn');
        if (onLinked) await onLinked(it, false);
      },
    });
  };
})(window.App);
