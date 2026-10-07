/* Nihongo Techō – Merge-Logik fuer JLPT-Level-Pakete (Paket-Vokabeln/-Kanji/-Grammatik ohne Duplikate einspielen) */
'use strict';
(function (App) {
  // Wie in core.js: JSON.stringify + 31er-Rolling-Hash (dort nicht exportiert, daher hier kopiert)
  const hash = (o) => { const s = JSON.stringify(o); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  App.hashObj = hash;

  // Leerzeichen, 〜/~ entfernen (wie App.vocabKey intern) - dort nicht exportiert
  const norm = (s) => String(s ?? '').replace(/[\s〜～~]/g, '');

  // Vokabel-Treffer in Prioritäts-Reihenfolge: (1) gleicher vocabKey, (2) gleiches Kanji (nur bei gleicher
  // Lesung oder wenn eine Seite keine Kana hat), (3) gleiche Lesung mit mind. einer Seite ohne Kanji - Regel 3
  // greift nur, wenn die Lesung innerhalb des Pakets eindeutig ist (sonst: ambiguousReading=true, kein Treffer)
  const vocabMatches = (packItem, existingVocab, ambiguousReading) => {
    const pKanji = norm(packItem.kanji || '');
    const pKanaNorm = norm(packItem.kana || '');
    const pKanaHira = App.jp.toHira(pKanaNorm);
    const pKey = App.vocabKey(packItem);

    let m = existingVocab.filter((ex) => App.vocabKey(ex) === pKey);
    if (m.length) return m;

    if (pKanji) {
      m = existingVocab.filter((ex) => {
        if (norm(ex.kanji || '') !== pKanji) return false;
        const exKanaNorm = norm(ex.kana || '');
        const exKanaHira = App.jp.toHira(exKanaNorm);
        return exKanaHira === pKanaHira || !pKanaNorm || !exKanaNorm;
      });
      if (m.length) return m;
    }

    if (ambiguousReading) return [];

    m = existingVocab.filter((ex) => {
      if (App.jp.toHira(norm(ex.kana || '')) !== pKanaHira) return false;
      const exKanji = norm(ex.kanji || '');
      return !pKanji || !exKanji;
    });
    return m;
  };

  const kanjiMatches = (packItem, existingKanji) => existingKanji.filter((ex) => ex.char === packItem.char);

  const grammarMatches = (packItem, existingAll) => {
    const ids = new Set(packItem.matches || []);
    return existingAll.filter((ex) => ex.type === 'grammar' && ids.has(ex.id));
  };

  // Alle Treffer fuer ein Paket-Element: eigene ID (gleicher Typ) plus typ-spezifische Regeln.
  // Ein anderer Eintrag DESSELBEN Pakets (_pack === packId, aber andere ID), der nur ueber Regel 2/3
  // gefunden wird, zaehlt NICHT als Treffer - sonst wuerde ein unabhaengiges Paket-Element faelschlich
  // ein anderes eigenes Paket-Element ueberschreiben (nur der exakte ID-Treffer darf als eigener Eintrag gelten).
  const findMatches = (packItem, existing, packId, ambiguousReading) => {
    const type = packItem.type;
    const sameType = existing.filter((ex) => ex.type === type);
    const idMatch = sameType.filter((ex) => ex.id === packItem.id);

    let ruleMatches = [];
    if (type === 'vocab') ruleMatches = vocabMatches(packItem, sameType, ambiguousReading);
    else if (type === 'kanji') ruleMatches = kanjiMatches(packItem, sameType);
    else if (type === 'grammar') ruleMatches = grammarMatches(packItem, existing);

    ruleMatches = ruleMatches.filter((m) => !(m._pack === packId && m.id !== packItem.id));

    const byId = new Map();
    for (const m of idMatch.concat(ruleMatches)) byId.set(m.id, m);
    return [...byId.values()];
  };

  // Ermittelt adds/updates fuer ein Level-Paket, ohne existing zu mutieren
  App.planMerge = (packItems, existing, opts) => {
    const { packId, level, deleted } = opts;
    const adds = [];
    const updates = [];
    const counts = { added: { vocab: 0, kanji: 0, grammar: 0 }, tagged: { vocab: 0, kanji: 0, grammar: 0 } };

    // Fuer Vokabel-Regel 3: Lesungen, die mehrfach im Paket vorkommen, sind mehrdeutig und
    // duerfen keinen Kana-only-Treffer ausloesen (sonst koennte ein falsches Paket-Element
    // einen bestehenden Eintrag - oder ein anderes eigenes Paket-Element - treffen)
    const readingCounts = new Map();
    packItems.forEach((pi) => {
      if (pi.type !== 'vocab') return;
      const r = App.jp.toHira(norm(pi.kana || ''));
      readingCounts.set(r, (readingCounts.get(r) || 0) + 1);
    });

    packItems.forEach((packItem) => {
      const type = packItem.type;
      const ambiguousReading = type === 'vocab' && readingCounts.get(App.jp.toHira(norm(packItem.kana || ''))) > 1;
      const matches = findMatches(packItem, existing, packId, ambiguousReading);

      if (matches.length === 0) {
        if (deleted && deleted.has(packItem.id)) return;
        adds.push({
          ...packItem,
          _pack: packId,
          _packHash: hash(packItem),
          packs: [packId],
          level,
          created: 0,
        });
        if (counts.added[type] !== undefined) counts.added[type]++;
        return;
      }

      matches.forEach((match) => {
        if (match._pack === packId) {
          // Eigener Paket-Eintrag (per findMatches garantiert: match.id === packItem.id)
          if (match._edited) return; // vom Nutzer bearbeitet: nichts tun
          const newHash = hash(packItem);
          if (match._packHash === newHash) return; // Paketinhalt unveraendert

          const merged = {
            ...match,
            ...packItem,
            id: match.id,
            created: match.created,
            _pack: packId,
            _packHash: newHash,
            packs: match.packs || [packId],
          };
          // Nutzereigene Felder ueberleben die Paket-Aktualisierung
          if (match.star !== undefined) merged.star = match.star;
          if (match.marks !== undefined) merged.marks = match.marks;
          if (match.levelManual !== undefined) merged.levelManual = match.levelManual;
          if (match.de !== undefined) merged.de = match.de;
          if (Array.isArray(match.examples) && (!Array.isArray(packItem.examples) || match.examples.length > packItem.examples.length)) {
            merged.examples = match.examples;
          }
          if (match.tags || packItem.tags) {
            merged.tags = [...new Set([...(match.tags || []), ...(packItem.tags || [])])];
          }
          merged.level = match.levelManual ? match.level : level;

          updates.push(merged);
          return;
        }

        // Fremder Eintrag (kein Paket-Eintrag dieses Pakets): nur level/packs ergaenzen, sonst unveraendert
        let changed = false;
        const copy = { ...match };
        if (!match.levelManual && match.level !== level) { copy.level = level; changed = true; }
        const packs = Array.isArray(match.packs) ? match.packs : [];
        if (!packs.includes(packId)) { copy.packs = [...packs, packId]; changed = true; }
        if (changed) {
          updates.push(copy);
          if (counts.tagged[type] !== undefined) counts.tagged[type]++;
        }
      });
    });

    return { adds, updates, counts };
  };

  // Ob ein Eintrag gefahrlos entfernt werden kann, wenn sein Paket deaktiviert wird
  App.isRemovable = (it, { srs, sessionRefs }) => {
    if (!it._pack) return false;
    if (it._edited) return false;
    if (it.star) return false;
    if (Array.isArray(it.marks) && it.marks.length) return false;
    if (srs && (srs.has(it.id) || srs.has('w:' + it.id))) return false; // Lese- oder Schreib-Stand
    if (sessionRefs && sessionRefs.has(it.id)) return false;
    return true;
  };
})(window.App);
