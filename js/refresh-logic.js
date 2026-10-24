/* Nihongo Techō – Auffrischen: Zahlen-Ausdrücke alle 14 Tage, getrennt von der Lernschlange (reine Logik) */
'use strict';
(function (App) {
  // Gespeichert in settings.refresh = { last, seen: { <id>: ms }, miss: [<id>] } – last = Ende der letzten fertigen Runde,
  // seen = wann ein Begriff zuletzt drankam, miss = beim letzten Mal nicht gewusst.
  // Lernstand, Termine und „kann ich“ bleiben unberührt: das Auffrischen kennt nur diesen eigenen Stand.
  const R = App.refreshLogic = {};
  R.GROUPS = ['Zahlen', 'Zähler', 'Tage des Monats', 'Uhrzeit', 'Minuten', 'Zeitdauer', 'Häufigkeit'];
  R.SIZE = 10;
  R.EVERY_DAYS = 14;

  R.norm = (state) => {
    const s = state && typeof state === 'object' ? state : {};
    return {
      last: Number.isFinite(s.last) ? s.last : 0,
      seen: s.seen && typeof s.seen === 'object' ? Object.assign({}, s.seen) : {},
      miss: Array.isArray(s.miss) ? s.miss.slice() : [],
    };
  };

  // Alle Ausdrücke der Gruppen – egal ob ungeprüft, in der Lernschlange oder „kann ich“
  R.pool = (items) => Array.from(items).filter((it) => it && it.type === 'phrase' && R.GROUPS.includes(it.group));

  // Noch nie aufgefrischt: gleich fällig. Sonst ab dem 14. Kalendertag nach der letzten Runde – tagesgenau wie
  // „fällig“ in der Lernschlange; setDate statt fester Millisekunden, damit die Zeitumstellung nichts verschiebt
  R.nextDue = (state) => {
    const { last } = R.norm(state);
    if (!last) return 0;
    const d = new Date(last);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + R.EVERY_DAYS);
    return d.getTime();
  };
  R.isDue = (state, now) => now >= R.nextDue(state);

  // Zuerst, was beim letzten Mal nicht saß · dann nie Gesehenes (gemischt) · dann, was am längsten her ist.
  // Zum Schluss gemischt, damit die Gruppen durcheinander kommen. Ids, die es nicht mehr gibt, fallen einfach weg.
  R.pick = (pool, state, n = R.SIZE, shuffle = (a) => a.slice()) => {
    const { seen, miss } = R.norm(state);
    const byId = new Map(pool.map((it) => [it.id, it]));
    const missed = miss.filter((id) => byId.has(id)).map((id) => byId.get(id));
    const rest = pool.filter((it) => !miss.includes(it.id));
    const fresh = shuffle(rest.filter((it) => !seen[it.id]));
    const old = shuffle(rest.filter((it) => seen[it.id])).sort((a, b) => seen[a.id] - seen[b.id]);
    return shuffle(missed.concat(fresh, old).slice(0, n));
  };

  // Eine Antwort: Zeitpunkt merken; nicht gewusst kommt in die Liste fürs nächste Mal, gewusst wieder heraus
  R.graded = (state, id, ok, now) => {
    const s = R.norm(state);
    s.seen[id] = now;
    s.miss = s.miss.filter((x) => x !== id);
    if (!ok) s.miss.push(id);
    return s;
  };
  R.finished = (state, now) => Object.assign(R.norm(state), { last: now });
})(window.App = window.App || {});
