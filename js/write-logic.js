/* Nihongo Techō – Kanji schreiben: eigener Lernstand je Kanji, getrennt vom Lesen */
'use strict';
(function (App) {
  // Der Schreib-Stand liegt im selben Speicher „srs“ wie der Lese-Stand, unter der Kennung „w:<Kanji-Id>“.
  // So bleiben Backup und Import unverändert, und Lesen und Schreiben verschieben sich nicht gegenseitig.
  const DAY = 864e5;
  const W = App.writeLogic = {};
  W.FIRST_IVL = 21; // auf Anhieb richtig geschrieben: erst nach 3 Wochen wieder
  W.id = (id) => 'w:' + id;
  W.isId = (id) => typeof id === 'string' && id.startsWith('w:');
  W.itemId = (wid) => wid.slice(2);

  // Schwerpunkt aus den Einstellungen: both = Lesen und Schreiben · read = nur Lesen · write = nur Schreiben
  W.focus = (settings) => (['read', 'write'].includes(settings && settings.kanjiFocus) ? settings.kanjiFocus : 'both');

  // Freigeschaltet fürs Schreiben ist, was man lesen kann: als „Kann ich“ eingestuft oder mit Karten schon gewusst
  W.unlocked = (srs, id) => { const s = srs.get(id); return !!s && s.check !== 'unchecked' && (s.check === 'known' || s.reps > 0); };

  // new = noch nie geschrieben · learn = übe ich · known = kann ich schreiben
  W.status = (srs, id) => {
    const s = srs.get(W.id(id));
    if (!s) return 'new';
    return s.reps > 0 && s.ivl >= W.FIRST_IVL ? 'known' : 'learn';
  };
  W.STATUS = {
    locked: { label: 'Noch nicht freigeschaltet', color: 'var(--muted)', dot: '○' },
    new: { label: 'Noch nie geschrieben', color: 'var(--muted)', dot: '○' },
    learn: { label: 'Übe ich', color: 'var(--ai)', dot: '◐' },
    known: { label: 'Kann ich schreiben', color: 'var(--matcha)', dot: '●' },
  };

  // Der erste Schreibversuch ist die Einstufung: auf Anhieb richtig → gleich ein langer Abstand
  W.firstKnown = (id, now) => ({ id: W.id(id), ivl: W.FIRST_IVL, ease: 2.6, reps: 3, lapses: 0, due: now + W.FIRST_IVL * DAY, last: now });
  W.isFirst = (srs, id) => !srs.has(W.id(id));
  // „Kann ich“ beim ersten Mal, ohne zu schreiben: wie beim Lesen – kommt nach 3–6 Wochen einmal zur Kontrolle wieder
  W.markedKnown = (id, now, rnd = Math.random()) => { const ivl = W.FIRST_IVL + Math.round(rnd * 21); return Object.assign(W.firstKnown(id, now), { ivl, due: now + ivl * DAY, check: 'known' }); };

  // Schreib-Runde: fällige (älteste zuerst) + neue = freigeschaltet, aber noch nie geschrieben (Reihenfolge der Liste)
  W.queue = (items, srs, now) => {
    const rec = (i) => srs.get(W.id(i.id));
    const due = items.filter((i) => { const s = rec(i); return s && s.due <= now; }).sort((a, b) => rec(a).due - rec(b).due);
    const fresh = items.filter((i) => !rec(i) && W.unlocked(srs, i.id));
    return { due, fresh };
  };
  W.counts = (items, srs) => {
    const c = { locked: 0, new: 0, learn: 0, known: 0, total: items.length };
    items.forEach((i) => { const st = W.status(srs, i.id); c[st === 'new' && !W.unlocked(srs, i.id) ? 'locked' : st]++; });
    return c;
  };

  // Fällige Karten insgesamt – der Schwerpunkt blendet bei Kanji die jeweils andere Seite aus
  W.dueCount = (srs, items, focus, now) => {
    let n = 0;
    srs.forEach((s) => {
      if (W.isId(s.id)) { if (focus !== 'read' && s.due <= now && items.has(W.itemId(s.id))) n++; return; }
      const it = items.get(s.id);
      if (!it || !(s.reps > 0) || s.due > now) return;
      if (focus === 'write' && it.type === 'kanji') return;
      n++;
    });
    return n;
  };

  // Bewertung eines Schreibversuchs (g: 0 falsch … 3 leicht) – braucht den Speicher der App
  App.gradeWrite = async (id, g) => {
    const S = App.store;
    if (W.isFirst(S.srs, id) && g >= 2) {
      const s = W.firstKnown(id, Date.now());
      S.srs.set(s.id, s);
      await App.db.put('srs', s);
      return s;
    }
    return App.grade(W.id(id), g);
  };
  App.markWriteKnown = async (id) => {
    const s = W.markedKnown(id, Date.now());
    App.store.srs.set(s.id, s);
    await App.db.put('srs', s);
    return s;
  };
})(window.App);
