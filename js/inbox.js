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
    return `<div class="card sec-vocab"><h3>Aus NHK Easy direkt in die App</h3>
      <p class="muted small">Mit der Browser-Erweiterung (Chrome oder Edge am PC) markierst du Text auf NHK Easy und landest mit einem Klick bei „Sätze zuordnen“ oder im Vokabel-Formular – mit Lesung, Beispielsatz und Fundstelle.</p>
      <div class="row">${get}</div>
      <ol class="small" style="margin:10px 0 0;padding-left:20px">
        ${web ? '<li>Die heruntergeladene ZIP-Datei entpacken – an einen Ort, an dem der Ordner bleiben kann (z. B. Dokumente).</li>' : ''}
        <li>Im Browser <b>chrome://extensions</b> (Edge: <b>edge://extensions</b>) öffnen und den <b>Entwicklermodus</b> einschalten.</li>
        <li><b>Entpackte Erweiterung laden</b> antippen und den Ordner <b>extension</b> wählen.</li>
        <li>Diese App geöffnet lassen, NHK Easy neu laden und Text markieren – an der Markierung erscheinen zwei Knöpfe.</li>
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

  App.route('/eingang', (view, params, query) => {
    // Offenes Formular nicht überfahren: zurück zur vorigen Ansicht, Übergabe verfällt
    if (document.querySelector('.modal-back, .viewer')) {
      App.toast('Erst das offene Fenster schließen, dann nochmal übergeben');
      history.back();
      return;
    }
    const p = L.parse(query);
    if (!p.ok) { App.toast('Kein japanischer Text übergeben'); return land('#/'); }
    // nur Quellen, die es in den Einstellungen gibt – keine frei erfundenen Namen aus der Adresse
    if (!App.sources().some((s) => s.name === p.quelle)) p.quelle = '';
    if (p.gekuerzt) App.toast('Text war zu lang und wurde gekürzt');
    (p.ziel === 'vokabel' ? toVocab(p) : toSentences(p, p.text)).catch((e) => { console.error(e); App.toast('Übergabe hat nicht geklappt'); land('#/'); });
  });
})(window.App);
