/* Nihongo Techō – Eingang: #/eingang nimmt von außen übergebenen Text an (z. B. aus der Browser-Erweiterung für NHK Easy)
   und reicht ihn an „Sätze zuordnen“ oder das Vokabel-Formular weiter. Belegt nur vor, speichert nie. */
'use strict';
(function (App) {
  const JP = App.jp;
  const L = App.inboxLogic;
  const { icon } = App;

  // Karte in den Einstellungen: Browser-Erweiterung holen und einrichten
  App.extensionCard = () => {
    const web = L.extSource(location.protocol) === 'download';
    const get = web
      ? `<a class="btn btn-sec" href="extension.zip" download="NihongoTecho-Erweiterung.zip">${icon('download')} Erweiterung herunterladen</a>`
      : '<p class="small">Der Ordner <b>extension</b> liegt im App-Ordner (nach der Installation: <b>Dokumente\\NihongoTecho\\extension</b>).</p>';
    return `<div class="card sec-vocab" data-ext-card><h3>Aus dem Browser direkt in die App</h3>
      <p class="muted small">Mit der Browser-Erweiterung (Chrome oder Edge am PC) markierst du japanischen Text auf einer beliebigen Webseite (z. B. NHK Easy oder WaniKani) und landest mit einem Klick bei „Sätze zuordnen“ oder im Vokabel-Formular – mit Lesung, Beispielsatz und Fundstelle.</p>
      <div class="row">${get}<button class="btn btn-ghost btn-sm" data-tour="erweiterung">So geht's</button></div>
      <ol class="small" style="margin:10px 0 0;padding-left:20px">
        ${web ? '<li>Die heruntergeladene ZIP-Datei entpacken – an einen Ort, an dem der Ordner bleiben kann (z. B. Dokumente).</li>' : ''}
        <li>Im Browser <b>chrome://extensions</b> (Edge: <b>edge://extensions</b>) öffnen und den <b>Entwicklermodus</b> einschalten.</li>
        <li><b>Entpackte Erweiterung laden</b> antippen und den Ordner <b>extension</b> wählen.</li>
        <li>Diese App geöffnet lassen, die Webseite neu laden und japanischen Text markieren – an der Markierung erscheinen zwei Knöpfe.</li>
      </ol></div>`;
  };

  // Adresse ersetzen (Neuladen/„Zurück“ holt nichts ein zweites Mal herein) und die Zielseite zeichnen
  const land = (hash, then) => {
    history.replaceState(null, '', hash);
    queueMicrotask(() => { App.render(); then && then(); });
  };

  const toSentences = async (p, notated) => {
    // #/saetze zeigt die laufende Zuordnung; ersetzt wird sie nur nach Rückfrage
    history.replaceState(null, '', '#/saetze');
    if (App.sentencesBusy() && !(await App.confirm('In „Sätze zuordnen“ liegen noch erkannte Sätze. Durch den neuen Text ersetzen?', { ok: 'Ersetzen', title: 'Neuer Text übergeben' }))) return land('#/saetze');
    const readings = new Map(L.sentences(notated).filter((s) => s.kana).map((s) => [s.jp, s.kana]));
    App.sentencesPreset({ text: JP.plain(notated), src: p.quelle, ref: p.ref, readings });
    land('#/saetze');
  };

  // Grundformen des markierten Wortes (食べました → 食べる), das Wort selbst zuerst
  const baseForms = (word) => [...new Set([word, ...App.deinflect(word).map((c) => c.base)])];

  // Bester Wörterbuch-Treffer: häufige Wörter und Treffer in der Kanji-Schreibung zuerst
  const dictHit = async (word) => {
    if (!App.dict.installed()) return null;
    const cands = [{ base: word, type: null }, ...App.deinflect(word)];
    const map = await App.dict.lookup(cands.map((c) => c.base));
    let best = null;
    for (const c of cands) {
      for (const entry of map.get(c.base) || []) {
        if (c.type && !App.posMatches(entry.p || [], c.type)) continue;
        const rank = (c.base === word ? 4 : 0) + (entry.c === 1 ? 2 : 0) + ((entry.k || []).includes(c.base) ? 1 : 0);
        if (!best || rank > best.rank) best = { entry, base: c.base, rank };
      }
    }
    return best;
  };

  const toVocab = async (p) => {
    history.replaceState(null, '', '#/vokabeln');   // sofort: ein Neuzeichnen während des Nachschlagens darf nichts doppelt öffnen
    const word = JP.plain(p.text).replace(/\s+/g, '');
    const forms = baseForms(word);
    const items = [...App.store.items.values()];
    if (forms.some((f) => L.findExisting(items, f))) {
      App.toast('Schon in deinen Vokabeln – Satz als Beispiel zuordnen');
      return toSentences(p, p.satz || p.text);
    }
    const d = L.vocabDefaults(Object.assign({}, p, { text: p.text.replace(/\s+/g, '') }));
    const hit = await dictHit(word).catch(() => null);
    land('#/vokabeln', () => {
      if (hit) {
        const sameWord = hit.base === word;
        App.adoptDictEntry({ entry: hit.entry, surface: hit.base, base: sameWord ? d.kana : '' },
          { extra: { examples: d.examples, source: d.source, sourceRef: d.sourceRef } });
      } else App.editItem({ type: 'vocab', defaults: d });
    });
  };

  // Auswahlseite „Text übernehmen“: Vorschau, „Sätze erkennen“ / „Vokabel speichern“, Einfügen aus der Zwischenablage
  const choose = (view, query) => {
    const p = L.parseOpen(query);
    const given = !!(String(query.text || '').trim() || String(query.ref || '').trim());
    const open = (ziel) => App.go('#/eingang?' + new URLSearchParams({ ziel, text: p.text, ref: p.ref, quelle: p.quelle }));
    const shown = p.text.length > 300 ? p.text.slice(0, 300) + '…' : p.text;
    const sec = App.SECTIONS.vocab;
    const take = p.ok ? `<div class="card"><h3>Text übernehmen</h3>
        <p class="jp-in" style="white-space:pre-wrap;margin:6px 0">${App.esc(shown)}</p>
        ${p.ref ? `<p class="small muted">Fundstelle: ${App.esc(p.ref)}${p.quelle ? ' · ' + App.esc(p.quelle) : ''}</p>` : ''}
        <div class="row"><button class="btn btn-primary" data-sent>${icon('sparkle')} Sätze erkennen</button>
          ${L.wordLike(p.text) ? '<button class="btn btn-sec" data-word>Vokabel speichern</button>' : ''}</div></div>` : '';
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/vokabeln">Vokabeln</a> › Text übernehmen</div>
      <div class="page-head"><div class="titles"><h1>Text übernehmen <span class="jp-title">取込</span></h1>
        <p>Japanischen Text aus einer anderen App oder von einer Webseite hierher holen – über das Teilen-Menü oder die Zwischenablage.</p></div></div>
      ${take}
      <div class="card"><div class="form">
        <p class="small" data-hint>${!p.ok && given ? 'Kein japanischer Text gefunden.' : ''}</p>
        <div class="row"><button class="btn btn-sec" data-clip>Aus Zwischenablage einfügen</button></div>
        <div class="field"><label>… oder hier einfügen</label><textarea class="input jp-in" rows="5" data-paste></textarea></div>
        <div class="row"><button class="btn" data-take>Übernehmen</button></div></div></div></div>`;
    const hint = view.querySelector('[data-hint]'), area = view.querySelector('[data-paste]');
    // Erst prüfen, dann übergeben: leerer oder nicht japanischer Text kommt nie in die Adresse (Verlauf); kein neuer Verlaufseintrag
    const give = (text, emptyMsg) => {
      const c = L.checkPaste(text);
      if (c !== 'ok') { hint.textContent = c === 'leer' ? emptyMsg : 'Kein japanischer Text gefunden.'; area.focus(); return; }
      history.replaceState(null, '', location.pathname + location.search + '#/eingang?' + new URLSearchParams({ text: String(text).trim().slice(0, L.LIMIT + 1) }));
      App.render();
    };
    if (p.gekuerzt) App.toast('Text war zu lang und wurde gekürzt');
    const sent = view.querySelector('[data-sent]'), word = view.querySelector('[data-word]');
    if (sent) sent.onclick = () => open('saetze');
    if (word) word.onclick = () => open('vokabel');
    view.querySelector('[data-take]').onclick = () => give(area.value, 'Bitte erst Text einfügen.');
    view.querySelector('[data-clip]').onclick = async () => {
      let text;
      try {
        if (!(navigator.clipboard && navigator.clipboard.readText)) throw new Error('keine Zwischenablage');
        text = await navigator.clipboard.readText();
      } catch (e) {
        hint.textContent = 'Zugriff auf die Zwischenablage nicht möglich – bitte unten einfügen.';
        area.focus();
        return;
      }
      give(text, 'Zwischenablage ist leer.');
    };
  };

  // Teilen-Menü: ?titel=&text=&url= (Web Share Target) vor dem ersten Zeichnen in die Eingangs-Adresse umsetzen.
  // Synchron, wirft nie; andere Suchparameter (z. B. ?sw=1) bleiben unberührt, wenn nichts geteilt wurde.
  App.inbox = {
    bootShare() {
      try {
        const s = L.fromShare(location.search);
        if (!s) return;
        const hash = s.text || s.ref ? '#/eingang?' + new URLSearchParams({ text: s.text, ref: s.ref }) : '#/';
        history.replaceState(null, '', location.pathname + hash);
      } catch (e) { console.error('Teilen: Übernahme fehlgeschlagen', e); }
    },
  };

  App.route('/eingang', (view, params, query) => {
    // Offenes Formular nicht überfahren: zurück zur vorigen Ansicht, Übergabe verfällt
    if (document.querySelector('.modal-back, .viewer')) {
      App.toast('Erst das offene Fenster schließen, dann nochmal übergeben');
      history.back();
      return;
    }
    // ohne Ziel (Teilen-Menü, Zwischenablage): erst fragen, was mit dem Text geschehen soll
    if (!query.ziel) return choose(view, query);
    const p = L.parse(query);
    if (!p.ok) { App.toast('Kein japanischer Text übergeben'); return land('#/'); }
    // nur Quellen, die es in den Einstellungen gibt – keine frei erfundenen Namen aus der Adresse
    if (!App.sources().some((s) => s.name === p.quelle)) p.quelle = '';
    if (p.gekuerzt) App.toast('Text war zu lang und wurde gekürzt');
    (p.ziel === 'vokabel' ? toVocab(p) : toSentences(p, p.text)).catch((e) => { console.error(e); App.toast('Übergabe hat nicht geklappt'); land('#/'); });
  });
})(window.App);
