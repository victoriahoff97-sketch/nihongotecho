/* Nihongo Techō – Grammatik auffrischen: ab und zu 5 Sätze zu Grammatik, die auf „kann ich“ steht (reine Logik) */
'use strict';
(function (App) {
  // Gespeichert in settings.grammarRefresh = { last, seen: { <grammar-id>: ms }, miss: [<grammar-id>] } –
  // last = Ende der letzten fertigen Runde, seen = wann ein Punkt zuletzt drankam, miss = beim letzten Mal nicht alles gewusst.
  // Wie beim Auffrischen der Zahlen: „kann ich“, Lernstand und Lernschlange bleiben unberührt.
  // Es sammelt sich nichts an: der Knopf zeigt immer SIZE, egal wie lange die letzte Runde her ist,
  // und die Tage bis zum nächsten Mal zählen erst ab einer fertigen Runde.
  const G = App.grammarRefreshLogic = {};
  G.SIZE = 5;       // Sätze pro Runde
  G.EVERY_DAYS = 7; // Tage nach der letzten fertigen Runde
  G.MAX_POINTS = 3; // höchstens so viele Grammatikpunkte in einer Runde (meist reichen 1–2)

  G.norm = (state) => {
    const s = state && typeof state === 'object' ? state : {};
    return {
      last: Number.isFinite(s.last) ? s.last : 0,
      seen: s.seen && typeof s.seen === 'object' ? Object.assign({}, s.seen) : {},
      miss: Array.isArray(s.miss) ? s.miss.slice() : [],
    };
  };

  // Grammatik auf „kann ich“, aus der sich Sätze machen lassen (Satzmuster, Beispielsätze oder Situationen)
  G.pool = (grammar, known) => Array.from(grammar).filter((g) => g && g.type === 'grammar' && known(g)
    && ((g.patterns || []).length || (g.examples || []).length || (g.situations || []).length));

  // Noch nie aufgefrischt: gleich dran. Sonst ab dem EVERY_DAYS. Kalendertag nach der letzten fertigen Runde
  G.nextDue = (state) => {
    const { last } = G.norm(state);
    if (!last) return 0;
    const d = new Date(last);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + G.EVERY_DAYS);
    return d.getTime();
  };
  G.isDue = (state, now) => now >= G.nextDue(state);

  // Reihenfolge der Punkte: zuerst, was beim letzten Mal nicht saß · dann nie Aufgefrischtes (gemischt) · dann, was am längsten her ist
  G.order = (pool, state, shuffle = (a) => a.slice()) => {
    const { seen, miss } = G.norm(state);
    const byId = new Map(pool.map((g) => [g.id, g]));
    const missed = miss.filter((id) => byId.has(id)).map((id) => byId.get(id));
    const rest = pool.filter((g) => !miss.includes(g.id));
    const fresh = shuffle(rest.filter((g) => !seen[g.id]));
    const old = rest.filter((g) => seen[g.id]).sort((a, b) => seen[a.id] - seen[b.id]);
    return missed.concat(fresh, old);
  };

  // Punkte der Reihe nach dazunehmen, bis die Sätze für eine Runde reichen. make(points) baut die Sätze (translateLogic.build);
  // ein Punkt, aus dem allein kein Satz entsteht (z. B. kein passendes Wort), wird übersprungen.
  G.choose = (ordered, make, n = G.SIZE) => {
    const points = [];
    let exs = [];
    for (const g of ordered) {
      if (points.length >= G.MAX_POINTS || exs.length >= n) break;
      if (!make([g]).length) continue;
      points.push(g);
      exs = make(points);
    }
    return { points, exs: exs.slice(0, n) };
  };

  // Fertige Runde: results = { <grammar-id>: true (alles gewusst) | false }. Nicht Gewusstes steht nächstes Mal vorn.
  G.finished = (state, results, now) => {
    const s = G.norm(state);
    Object.entries(results).forEach(([id, ok]) => {
      s.seen[id] = now;
      s.miss = s.miss.filter((x) => x !== id);
      if (!ok) s.miss.push(id);
    });
    s.last = now;
    return s;
  };
})(window.App = window.App || {});
