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
  // und nichts auf zwei verschiedene Wörter hindeutet (sameWord): 鳴る ist nicht なる, ～やすい nicht 安い
  const hasTilde = (it) => /[〜～~]/.test(String(it.kana || '') + String(it.kanji || ''));
  const sameWord = (packItem, ex) => {
    if (hasTilde(packItem) !== hasTilde(ex)) return false; // Wortteil (～だす) gegen eigenständiges Wort (出す)
    const lvl = App.jlptOf ? App.jlptOf(ex) : '';
    return !lvl || !packItem.level || lvl === packItem.level; // steht der Eintrag auf einer anderen JLPT-Liste, ist es ein anderes Wort
  };
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
      return (!pKanji || !exKanji) && sameWord(packItem, ex);
    });
    return m;
  };

  // Ausdrücke (type 'phrase'), die genau dieses Wort sind (gleiche Schreibung und Lesung): Zahlen, Wochentage,
  // Zeitwörter, Farben … stehen nur bei den Ausdrücken und sollen nicht noch einmal als Vokabel dazukommen
  const phraseKey = (it) => norm(App.jp.plain(it.jp || '')) + '|' + App.jp.toHira(norm(App.jp.kana(it.jp || '')));
  const phraseMatches = (packItem, existingAll) => {
    const pKey = App.vocabKey(packItem);
    // gen trägt die Kanji-Schreibung, wo der Ausdruck selbst in Kana steht (だれ / 誰)
    return existingAll.filter((ex) => ex.type === 'phrase' && (phraseKey(ex) === pKey || (ex.gen && ex.gen.kana && App.vocabKey(ex.gen) === pKey)));
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
    if (type === 'vocab') ruleMatches = vocabMatches(packItem, sameType, ambiguousReading).concat(phraseMatches(packItem, existing));
    else if (type === 'kanji') ruleMatches = kanjiMatches(packItem, sameType);
    else if (type === 'grammar') ruleMatches = grammarMatches(packItem, existing);

    ruleMatches = ruleMatches.filter((m) => !(m._pack === packId && m.id !== packItem.id));

    const byId = new Map();
    for (const m of idMatch.concat(ruleMatches)) byId.set(m.id, m);
    return [...byId.values()];
  };
  App.findMatches = findMatches;

  // Niveau nur setzen, wenn der Eintrag noch keins hat oder das Paket leichter ist (N5 bleibt N5, auch wenn
  // ein N4-Paket denselben Eintrag führt)
  const easier = (level, cur) => {
    const L = App.JLPT_LEVELS || [];
    return !L.includes(cur) || (L.includes(level) && L.indexOf(level) < L.indexOf(cur));
  };

  // Ermittelt adds/updates/removes fuer ein Level-Paket, ohne existing zu mutieren.
  // removes: eigene, unberührte Paket-Einträge (App.isRemovable, nur mit opts.ctx = { srs, sessionRefs }), deren
  // Wort inzwischen ein anderer Eintrag führt - etwa weil das Paket die Schreibung angeglichen hat (御飯 → ご飯)
  App.planMerge = (packItems, existing, opts) => {
    const { packId, level, deleted, ctx } = opts;
    const adds = [];
    const updates = [];
    const removes = [];
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
          _packTags: packItem.tags || [],
          packs: [packId],
          level,
          created: 0,
        });
        if (counts.added[type] !== undefined) counts.added[type]++;
        return;
      }

      const foreign = matches.some((m) => m._pack !== packId);
      matches.forEach((match) => {
        if (match._pack === packId) {
          // Eigener Paket-Eintrag (per findMatches garantiert: match.id === packItem.id)
          if (foreign && ctx && App.isRemovable(match, ctx)) { removes.push(match.id); return; }
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
          if (match.de !== undefined && packItem.de === undefined) merged.de = match.de; // liefert das Paket Deutsch, gilt dessen aktuelle Fassung
          // Beispielsätze: die des Pakets gelten (auch „keiner“, wenn der frühere Satz das Wort falsch zeigte).
          // Hat der Nutzer eigene ergänzt – mehr Sätze, als das Paket zuletzt lieferte (_packExN; ältere Einträge:
          // höchstens 1 je Vokabel, 2 je Grammatikpunkt) –, bleibt seine Liste.
          const packEx = Array.isArray(packItem.examples) ? packItem.examples.length : -1;
          const oldEx = match._packExN ?? (type === 'grammar' ? 2 : 1);
          if (Array.isArray(match.examples) && (packEx < 0 || match.examples.length > Math.max(packEx, oldEx))) merged.examples = match.examples;
          if (packEx >= 0) merged._packExN = packEx;
          if (match.tags || packItem.tags) {
            // eigene Tags des Nutzers bleiben, die des Pakets werden ersetzt (_packTags = Paket-Tags beim letzten
            // Schreiben). Ältere Einträge kennen _packTags noch nicht: bei Grammatik stammten alle Tags aus dem Paket
            // (früher englisch, jetzt deutsch), bei Vokabeln/Kanji hatte das Paket keine.
            const old = Array.isArray(match._packTags) ? match._packTags : (type === 'grammar' ? match.tags || [] : []);
            const own = (match.tags || []).filter((t) => !old.includes(t));
            merged.tags = [...new Set([...own, ...(packItem.tags || [])])];
          }
          merged._packTags = packItem.tags || [];
          merged.level = match.levelManual ? match.level : level;

          updates.push(merged);
          return;
        }

        // Fremder Eintrag (kein Paket-Eintrag dieses Pakets): nur level/packs ergaenzen, sonst unveraendert
        let changed = false;
        const copy = { ...match };
        if (!match.levelManual && match.level !== level && easier(level, match.level)) { copy.level = level; changed = true; }
        const packs = Array.isArray(match.packs) ? match.packs : [];
        if (!packs.includes(packId)) { copy.packs = [...packs, packId]; changed = true; }
        if (changed) {
          updates.push(copy);
          if (counts.tagged[type] !== undefined) counts.tagged[type]++;
        }
      });
    });

    return { adds, updates, removes, counts };
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

  // IDs aller Einträge, die in einer Unterrichtsstunde verwendet werden (für App.isRemovable)
  const SESSION_KEYS = ['grammarIds', 'vocabIds', 'kanjiIds', 'phraseIds'];
  App.sessionRefs = () => {
    const refs = new Set();
    App.itemsOf('session').forEach((s) => SESSION_KEYS.forEach((k) => (s[k] || []).forEach((x) => refs.add(x))));
    return refs;
  };

  // Umgekehrte Reihenfolge zu planMerge: neue Seed-Einträge (freshSeeds, noch nicht im Bestand) kommen dazu,
  // nachdem schon ein Level-Paket installiert wurde. Treffer nach denselben Regeln wie planMerge (findMatches,
  // vom Paket-Eintrag aus gesehen; eine Lesung ist mehrdeutig, wenn sie unter den Einträgen desselben Pakets
  // mehrfach vorkommt). Ergebnis, ohne die Eingaben zu verändern:
  //   del  – IDs unberührter Paket-Einträge (App.isRemovable), die dem Seed-Eintrag weichen
  //   tag  – Seed-ID → { packs, level }: was der Seed-Eintrag dafür übernimmt (als wäre er zuerst da gewesen)
  //   skip – Seed-IDs, die nicht angelegt werden, weil ein berührter Paket-Eintrag (Lernstand, bearbeitet,
  //          markiert, in einer Stunde verwendet) dasselbe Wort schon führt
  // Treffen mehrere Paket-Einträge denselben Seed-Eintrag, genügt ein berührter, damit er übersprungen wird.
  // Ausnahme Grammatik (type 'grammar'): nie skip. Ein berührter Paket-Eintrag bleibt, der Genki-Eintrag wird
  // trotzdem angelegt (ohne tag deswegen); unberührte Treffer werden wie sonst aufgenommen (del + tag).
  const ABSORB_TYPES = new Set(['vocab', 'kanji', 'grammar']);
  App.planSeedAbsorb = (freshSeeds, existing, ctx) => {
    const out = { del: [], skip: [], tag: new Map() };
    const packItems = existing.filter((it) => it && it._pack && ABSORB_TYPES.has(it.type));
    if (!packItems.length || !freshSeeds.length) return out;

    // Lesungen je Paket zählen – über alle Vokabeln, die zum Paket gehören: eigene Paket-Einträge (_pack) und
    // Einträge mit der Paket-Kennung in packs (z. B. ein Seed-Eintrag, in dem ein Paket-Eintrag schon aufgegangen
    // ist). Sonst würde eine im Paket mehrdeutige Lesung nach dem ersten Zusammenführen als eindeutig gelten.
    const readingKey = (packId, it) => packId + '|' + App.jp.toHira(norm(it.kana || ''));
    const reading = (it) => readingKey(it._pack, it);
    const readingCounts = new Map();
    existing.forEach((it) => {
      if (!it || it.type !== 'vocab') return;
      const ids = new Set(Array.isArray(it.packs) ? it.packs : []);
      if (it._pack) ids.add(it._pack);
      ids.forEach((packId) => { const k = readingKey(packId, it); readingCounts.set(k, (readingCounts.get(k) || 0) + 1); });
    });

    const hits = new Map(); // Seed-ID → treffende Paket-Einträge (in Bestands-Reihenfolge)
    packItems.forEach((p) => {
      const ambiguousReading = p.type === 'vocab' && readingCounts.get(reading(p)) > 1;
      findMatches(p, freshSeeds, p._pack, ambiguousReading).forEach((s) => {
        if (!hits.has(s.id)) hits.set(s.id, []);
        hits.get(s.id).push(p);
      });
    });

    const del = new Set();
    const skip = new Set();
    freshSeeds.forEach((s) => {
      let ps = hits.get(s.id);
      if (!ps || out.tag.has(s.id) || skip.has(s.id)) return;
      if (s.type === 'grammar' || s.type === 'phrase') {
        // Ausnahme Grammatik: berührte Paket-Einträge bleiben stehen, unterdrücken den Genki-Eintrag aber nie
        // (er trägt die ausführliche deutsche Erklärung); nur unberührte werden aufgenommen.
        // Ebenso Ausdrücke: sonst fehlte in einer Gruppe (Wochentage …) ein Eintrag
        ps = ps.filter((p) => App.isRemovable(p, ctx));
        if (!ps.length) return;
      } else if (ps.some((p) => !App.isRemovable(p, ctx))) { skip.add(s.id); return; }
      const packs = [];
      ps.forEach((p) => (Array.isArray(p.packs) && p.packs.length ? p.packs : [p._pack]).forEach((x) => { if (!packs.includes(x)) packs.push(x); }));
      const t = { packs };
      if (ps[0].level !== undefined) t.level = ps[0].level;
      out.tag.set(s.id, t);
      ps.forEach((p) => del.add(p.id));
    });
    out.skip = [...skip];
    out.del = packItems.filter((p) => del.has(p.id)).map((p) => p.id);
    return out;
  };

  // Bereinigung nach dem Zusammenlegen doppelter Seed-Einträge (map: alte ID → verbleibende ID, siehe SEED_MERGED).
  // Liefert, was zu löschen/speichern ist, ohne items oder srs zu verändern. Der Lernstand (Lesen und Schreiben)
  // geht auf den verbleibenden Eintrag über; haben beide einen, gewinnt der weiter fortgeschrittene.
  // Vom Nutzer bearbeitete Einträge bleiben stehen.
  const REF_KEYS = ['grammarIds', 'vocabIds', 'kanjiIds', 'phraseIds', 'newIds', 'links'];
  const TYPE_KEY = { vocab: 'vocabIds', grammar: 'grammarIds', kanji: 'kanjiIds', phrase: 'phraseIds' };
  const TYPED = new Set(Object.values(TYPE_KEY));

  // IDs aller Einträge, auf die irgendein Eintrag verweist (Stunden, Tagebuch, Antworten, Verknüpfungen) oder
  // an denen eine Datei hängt (itemId) – weiter gefasst als App.sessionRefs, für das Löschen ohne Zutun des Nutzers
  App.allRefs = (items, files) => {
    const refs = new Set();
    for (const it of items) for (const k of REF_KEYS) if (Array.isArray(it[k])) it[k].forEach((id) => refs.add(id));
    for (const f of files || []) if (f && f.itemId) refs.add(f.itemId);
    return refs;
  };
  App.planSeedCleanup = (map, items, srs) => {
    const out = { delItems: [], putItems: [], putSrs: [], delSrs: [] };
    const byId = new Map(items.map((it) => [it.id, it]));
    const gone = new Map();
    for (const [old, kept] of Object.entries(map || {})) {
      const o = byId.get(old);
      if (o && o._seed && !o._edited && byId.has(kept)) gone.set(old, kept);
    }
    // Den zweiten Lernstand („w:“) gibt es nur für Vokabeln (aktiv) und Kanji (schreiben). Geht eine Vokabel in einem
    // Ausdruck auf, entfällt er – auch einer, der bei einer früheren Bereinigung noch mitgewandert ist.
    const second = (id) => ['vocab', 'kanji'].includes((byId.get(id) || {}).type);
    for (const kept of new Set(Object.values(map || {}))) if (byId.has(kept) && !second(kept) && srs.has('w:' + kept)) out.delSrs.push('w:' + kept);
    if (!gone.size) return out;
    const ahead = (a, b) => (a.reps || 0) - (b.reps || 0) || (a.ivl || 0) - (b.ivl || 0);
    for (const [old, kept] of gone) {
      out.delItems.push(old);
      for (const pre of ['', 'w:']) {
        const so = srs.get(pre + old);
        if (!so) continue;
        const sk = srs.get(pre + kept);
        if ((!pre || second(kept)) && (!sk || ahead(so, sk) > 0)) out.putSrs.push({ ...so, id: pre + kept });
        out.delSrs.push(pre + old);
      }
    }
    for (const it of items) {
      if (gone.has(it.id)) continue;
      let copy = null;
      for (const k of REF_KEYS) {
        if (!Array.isArray(it[k]) || !it[k].some((id) => gone.has(id))) continue;
        copy = copy || { ...it };
        const stay = [];
        it[k].forEach((id) => {
          const to = gone.get(id) || id;
          if (to === it.id) return;
          // geht eine Vokabel in einem Ausdruck auf (Zeitwörter, Farben), wandert der Verweis nach phraseIds
          const home = gone.has(id) && TYPED.has(k) ? TYPE_KEY[(byId.get(to) || {}).type] || k : k;
          if (home === k) { if (!stay.includes(to)) stay.push(to); return; }
          if (!Array.isArray(copy[home]) || copy[home] === it[home]) copy[home] = [...(Array.isArray(it[home]) ? it[home] : [])];
          if (!copy[home].includes(to)) copy[home].push(to);
        });
        copy[k] = stay;
      }
      if (copy) out.putItems.push(copy);
    }
    return out;
  };
})(window.App);
