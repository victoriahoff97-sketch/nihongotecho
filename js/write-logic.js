/* Nihongo Techō – Kanji schreiben: eigener Lernstand je Kanji, getrennt vom Lesen */
'use strict';
(function (App) {
  // Der Schreib-Stand liegt im selben Speicher „srs“ wie der Lese-Stand, unter der Kennung „w:<Kanji-Id>“.
  // So bleiben Backup und Import unverändert, und Lesen und Schreiben verschieben sich nicht gegenseitig.
  const W = App.writeLogic = {};
  W.KNOWN_IVL = 21; // ab 3 Wochen Abstand gilt ein geübtes Kanji als „kann ich schreiben“
  W.id = (id) => 'w:' + id;
  W.isId = (id) => typeof id === 'string' && id.startsWith('w:');
  W.itemId = (wid) => wid.slice(2);

  // Schwerpunkt aus den Einstellungen: both = Lesen und Schreiben · read = nur Lesen · write = nur Schreiben
  W.focus = (settings) => (['read', 'write'].includes(settings && settings.kanjiFocus) ? settings.kanjiFocus : 'both');

  // Freigeschaltet fürs Schreiben ist, was man lesen kann: als „Kann ich“ eingestuft oder mit Karten schon gewusst
  W.unlocked = (srs, id) => { const s = srs.get(id); return !!s && s.check !== 'unchecked' && (s.check === 'known' || s.reps > 0); };

  // „Kann ich“ gilt für jeden Lernstand gleich (Lesen, Schreiben, Aktiv): so eingestuft oder mit Karten bis 3 Wochen Abstand geübt.
  // Was „Kann ich“ ist, wird im Lernplan nicht mehr abgefragt – nur „Zufällig üben“ zieht weiter aus allem;
  // dort falsch Beantwortetes fällt zurück in den Stapel.
  W.isKnown = (s) => !!s && (s.check === 'known' || (s.reps > 0 && s.ivl >= W.KNOWN_IVL));

  // new = noch nie geschrieben · learn = übe ich · known = kann ich schreiben
  W.status = (srs, id) => {
    const s = srs.get(W.id(id));
    if (!s) return 'new';
    return W.isKnown(s) ? 'known' : 'learn';
  };
  W.STATUS = {
    locked: { label: 'Noch nicht freigeschaltet', color: 'var(--muted)', dot: '○' },
    new: { label: 'Noch nie geschrieben', color: 'var(--muted)', dot: '○' },
    learn: { label: 'Übe ich', color: 'var(--ai)', dot: '◐' },
    known: { label: 'Kann ich schreiben', color: 'var(--matcha)', dot: '●' },
  };

  // Der erste Schreibversuch ist die Einstufung: nach dem Vergleichen „Falsch“, „Richtig“ (kommt in den Übungsstapel)
  // oder „Kann ich schon“ = als gelernt eingestuft (check: 'known') und beim Schreiben nicht mehr abgefragt
  W.isFirst = (srs, id) => !srs.has(W.id(id));
  W.isMarkedKnown = (srs, id) => { const s = srs.get(W.id(id)); return !!s && s.check === 'known'; };
  W.markedKnown = (id, now) => ({ id: W.id(id), check: 'known', ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: now, last: now, checked: now });

  // Schreib-Runde: fällige (älteste zuerst) + neue = freigeschaltet, aber noch nie geschrieben (Reihenfolge der Liste)
  // unlockedFn(item): eigene Freischalt-Regel (z. B. WaniKani ab Master); ohne sie gilt „kann ich lesen“.
  // dueItems: woraus die fälligen kommen, wenn die Liste der neuen enger ist (Quelle in den Einstellungen) –
  // Begonnenes bleibt fällig, auch wenn es nicht zur gewählten Quelle gehört
  W.queue = (items, srs, now, unlockedFn, dueItems) => {
    const rec = (i) => srs.get(W.id(i.id));
    const ok = unlockedFn || ((i) => W.unlocked(srs, i.id));
    const due = (dueItems || items).filter((i) => { const s = rec(i); return s && !W.isKnown(s) && s.due <= now; }).sort((a, b) => rec(a).due - rec(b).due);
    const fresh = items.filter((i) => !rec(i) && ok(i));
    return { due, fresh };
  };
  // Eine Lernrunde ist entweder Wiederholen oder Neues – nie gemischt. kind: 'due' | 'new';
  // ohne Vorgabe (Direktstart) die fälligen, Neues nur, wenn nichts fällig ist
  W.round = (q, newMax, kind) => ((kind ? kind === 'new' : !q.due.length) ? q.fresh.slice(0, newMax) : q.due);
  W.counts = (items, srs, unlockedFn) => {
    const ok = unlockedFn || ((i) => W.unlocked(srs, i.id));
    const c = { locked: 0, new: 0, learn: 0, known: 0, total: items.length };
    items.forEach((i) => { const st = W.status(srs, i.id); c[st === 'new' && !ok(i) ? 'locked' : st]++; });
    return c;
  };

  // Lese-Runde (Japanisch → Deutsch): fällig ist, was schon einmal gewusst wurde und noch nicht „Kann ich“ ist.
  // Ausdrücke haben keinen Lernstand – sie bleiben im Wiederholungsplan.
  // In der Lernschlange ist auch, was beim Einstufen auf „Lernen“ gesetzt wurde (queued): es ist gleich fällig, ohne „neue lernen“.
  // Lesbar (W.unlocked) wird es dadurch nicht – das bleibt an „schon gewusst“ gebunden.
  W.inQueue = (s) => !!s && (s.reps > 0 || !!s.queued);
  W.readAsked = (it, s) => W.inQueue(s) && !(it.type !== 'phrase' && W.isKnown(s));
  W.readDue = (items, srs, now) => items.filter((i) => { const s = srs.get(i.id); return W.readAsked(i, s) && s.due <= now; }).sort((a, b) => srs.get(a.id).due - srs.get(b.id).due);

  // Fällig gilt für den ganzen Tag: Stichzeit ist das Ende des heutigen Tages, nicht die Minute.
  // So stimmt „heute“ schon morgens, und im Lauf des Tages kommt nichts Unerwartetes dazu.
  W.dayEnd = (now) => { const d = new Date(now); d.setHours(24, 0, 0, 0); return d.getTime() - 1; };

  // Gemischte Runde („Jetzt wiederholen“): alles Fällige durcheinander. entries: { it, kind: 'read' | 'active' | 'write' }.
  // Dasselbe Wort (lesen + aktiv, lesen + schreiben) kommt nie kurz hintereinander – die eine Karte verriete die andere.
  W.mixRound = (entries, shuffle, gap = 4) => {
    const out = shuffle(entries);
    for (let i = 0; i < out.length; i++) {
      const near = out.slice(Math.max(0, i - gap + 1), i).some((x) => x.it.id === out[i].it.id);
      if (!near) continue;
      const j = out.findIndex((x, k) => k > i && !out.slice(Math.max(0, i - gap + 1), i).some((y) => y.it.id === x.it.id));
      if (j < 0) { out.push(out.splice(i, 1)[0]); break; } // nichts anderes mehr da: ans Ende
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  // Fällige Karten insgesamt – der Schwerpunkt blendet bei Kanji die jeweils andere Seite aus
  W.dueCount = (srs, items, focus, now) => {
    let n = 0;
    srs.forEach((s) => {
      if (W.isId(s.id)) {
        const wi = items.get(W.itemId(s.id));
        if (!wi || s.due > now || W.isKnown(s)) return;
        // Vokabeln aktiv · Kanji schreiben – andere Einträge (Ausdrücke …) haben keinen zweiten Lernstand
        if (wi.type === 'vocab' ? W.activeAsked(srs, wi) : wi.type === 'kanji' && focus !== 'read') n++;
        return;
      }
      const it = items.get(s.id);
      if (!it || !W.readAsked(it, s) || s.due > now) return;
      if (focus === 'write' && it.type === 'kanji') return;
      n++;
    });
    return n;
  };

  // ---------- Vokabeln aktiv (Deutsch → Japanisch) ----------
  // Zweiter Lernstand je Vokabel, ebenfalls unter „w:<Id>“. Anders als beim Kanji-Schreiben läuft er wie der Lese-Stand:
  // erst einstufen („Kann ich“ wird nicht mehr abgefragt, „Lernen“ geht in den Aktiv-Lernstapel), dann Karten.
  // locked = kann ich noch nicht lesen · unchecked = aktiv noch nicht eingestuft · learn = Aktiv-Lernstapel · known = kann ich aktiv
  // needsCheck(it): wird der Eintrag überhaupt eingestuft? Eigene Wörter gehen wie beim Lesen direkt in den Lernstapel.
  // Lesbar ist auch jede aus WaniKani angelegte Vokabel (_wk): sie kommt erst in die App, wenn sie dort ab Guru sitzt
  W.readable = (srs, it) => (it.type === 'vocab' && !!it._wk) || W.unlocked(srs, it.id);
  W.activeStatus = (srs, it, needsCheck) => {
    const s = srs.get(W.id(it.id));
    if (s) return W.isKnown(s) ? 'known' : 'learn';
    if (!W.readable(srs, it)) return 'locked';
    return needsCheck(it) ? 'unchecked' : 'learn';
  };
  // Aktiv-Runde: fällige (älteste zuerst) + neue = im Aktiv-Lernstapel, aber noch nie gewusst (Reihenfolge der Liste)
  // Vorgemerkt (pre): beim Einstufen pro Lektion nicht gelesen – liegt schon im Aktiv-Lernstapel, Karten kommen erst, wenn das Wort lesbar ist
  // In der Aktiv-Lernschlange: schon gewusst – oder beim Einstufen auf „Lernen“ gesetzt (queued); Vorgemerktes erst, wenn das Wort lesbar ist
  W.activeAsked = (srs, it) => { const s = srs.get(W.id(it.id)); return !!s && (s.reps > 0 || (!!s.queued && !(s.pre && !W.readable(srs, it)))); };
  W.activeQueue = (items, srs, now, needsCheck) => {
    const rec = (i) => srs.get(W.id(i.id));
    const due = items.filter((i) => { const s = rec(i); return W.activeAsked(srs, i) && !W.isKnown(s) && s.due <= now; }).sort((a, b) => rec(a).due - rec(b).due);
    const fresh = items.filter((i) => { const s = rec(i); return !W.inQueue(s) && W.activeStatus(srs, i, needsCheck) === 'learn' && !(s && s.pre && !W.readable(srs, i)); });
    return { due, fresh };
  };
  // „Meine Lernschlange üben“ (Karteikarten, frei): alles, was gerade gelernt wird – auch was heute nicht fällig ist.
  // kind: 'read' (Lesen) · 'active' (Deutsch → Japanisch) · 'write' (Kanji schreiben)
  // Gezählt wird nur, was noch nicht „Kann ich“ ist – auch bei Ausdrücken, obwohl die im Wiederholungsplan bleiben: die Zahl soll zum Lernstand passen.
  W.learning = (items, srs, kind) => items.filter((i) => (kind === 'write' ? W.status(srs, i.id) === 'learn'
    : kind === 'active' ? W.activeAsked(srs, i) && !W.isKnown(srs.get(W.id(i.id)))
      : W.inQueue(srs.get(i.id)) && !W.isKnown(srs.get(i.id))));
  // Einstufen pro Lektion: eine Runde mischt beide Richtungen – lesen (Japanisch → Deutsch) für Ungeprüftes und
  // aktiv (de: Deutsch → Japanisch) für das, was schon lesbar ist. Dasselbe Wort steht nie zweimal in einer Runde:
  // die Gegenrichtung kommt frühestens in der nächsten. Solange beides offen ist, teilen sich die Richtungen die Runde.
  W.lessonRound = (items, srs, needsCheck, readOpen, n, shuffle) => {
    const de = items.filter((i) => W.activeStatus(srs, i, needsCheck) === 'unchecked');
    const jp = items.filter(readOpen);
    const nDe = Math.min(de.length, jp.length ? Math.max(Math.ceil(n / 2), n - jp.length) : n);
    return shuffle(de.slice(0, nDe).map((item) => ({ item, de: true })).concat(jp.slice(0, n - nDe).map((item) => ({ item, de: false }))));
  };
  W.activeCounts = (items, srs, needsCheck) => {
    const c = { locked: 0, unchecked: 0, learn: 0, known: 0, total: items.length };
    items.forEach((i) => c[W.activeStatus(srs, i, needsCheck)]++);
    return c;
  };

  // Bewertung eines Schreibversuchs (g: 0 falsch … 3 leicht) – braucht den Speicher der App
  // Als gelernt Eingestuftes bleibt beim freien Üben gelernt – außer es war falsch: dann zurück in den Übungsstapel
  App.gradeWrite = async (id, g) => {
    const s = App.store.srs.get(W.id(id));
    if (s && s.check === 'known') { if (g > 0) return s; delete s.check; }
    return App.grade(W.id(id), g);
  };
  // Schreib-Stand löschen: das Kanji gilt wieder als „noch nie geschrieben“ und kommt neu in die Schreib-Runde
  App.resetWrite = async (id) => {
    if (App.store.srs.delete(W.id(id))) await App.db.del('srs', W.id(id));
  };
  App.markWriteKnown = async (id) => {
    const s = W.markedKnown(id, Date.now());
    App.store.srs.set(s.id, s);
    await App.db.put('srs', s);
    if (App.backup && App.backup.noteChange) App.backup.noteChange();
    return s;
  };
})(window.App);
