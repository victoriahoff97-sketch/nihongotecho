/* Nihongo Techō – Lernschlange pausieren: verpasste Tage überspringen und Urlaubsmodus (reine Logik, ohne DOM) */
'use strict';
(function (App) {
  const P = App.pauseLogic = {};
  const DAY = 864e5;

  // Kalendertage (Sommerzeit-fest): Tagesbeginn, Tage verschieben, Abstand in ganzen Tagen
  P.dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  P.addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
  P.days = (a, b) => Math.round((P.dayStart(b) - P.dayStart(a)) / DAY);
  P.dayEnd = (t) => P.addDays(P.dayStart(t), 1) - 1;

  // Wirklich wiederholt (Karte bewertet) – nicht bloß eingestuft: Einstufen setzt last = checked im selben Moment
  P.reviewed = (s) => !!s && s.last > 0 && (s.reps > 0 || s.lapses > 0) && s.last !== s.checked;

  // Letzte Wiederholung vor dem Zeitpunkt before (meist: vor heute)
  P.lastReview = (recs, before) => {
    let last = 0;
    for (const s of recs) if (P.reviewed(s) && s.last < before && s.last > last) last = s.last;
    return last;
  };

  // Verpasste Tage: seit dem letzten Tag mit Wiederholungen (oder seit dem letzten Überspringen / Urlaub = anchor)
  // zählt jeder Tag, an dem etwas fällig gewesen wäre. dueBy(t) = wie viele Karten bis t fällig sind (steigt mit t).
  // Ergebnis: { n: Tage, from: erster verpasster Tag } – n = 0, wenn nichts verpasst ist.
  P.missed = (recs, now, anchor, dueBy) => {
    const today = P.dayStart(now);
    const last = P.lastReview(recs, today);
    const base = Math.max(last ? P.dayStart(last) : 0, anchor || 0);
    if (!base) return { n: 0, from: 0 };
    let lo = 1, hi = P.days(base, today) - 1; // Kandidaten: base+1 … gestern
    if (hi < lo) return { n: 0, from: 0 };
    if (!(dueBy(P.dayEnd(P.addDays(base, hi))) > 0)) return { n: 0, from: 0 };
    while (lo < hi) { // erster Tag, an dem etwas fällig war (dueBy steigt mit der Zeit)
      const mid = (lo + hi) >> 1;
      if (dueBy(P.dayEnd(P.addDays(base, mid))) > 0) hi = mid; else lo = mid + 1;
    }
    const from = P.addDays(base, lo);
    return { n: P.days(from, today), from };
  };

  // Alles um n Tage nach hinten (n < 0: nach vorn). Was heute schon wiederholt wurde, bleibt, wie es ist.
  // Liefert nur die geänderten Einträge (Kopien).
  P.shift = (recs, n, now) => {
    if (!n) return [];
    const today = P.dayStart(now), out = [];
    for (const s of recs) {
      if (!s || typeof s.due !== 'number' || !s.due) continue;
      if (P.reviewed(s) && s.last >= today) continue;
      out.push(Object.assign({}, s, { due: P.addDays(s.due, n) }));
    }
    return out;
  };

  // ---------- Urlaubsmodus ----------
  // vac = { since, until?, upTo }: since = Starttag, until = „wieder da am“ (erster normaler Tag, optional),
  // upTo = bis zu welchem Tag die Lernschlange schon angehalten ist. Ab dem Start wird nichts mehr neu fällig:
  // jeder weitere Urlaubstag schiebt alles einen Tag nach hinten. Der Rückkehrtag ist wieder ein normaler Tag.
  P.start = (now, until) => {
    const t = P.dayStart(now);
    return { since: t, until: until && P.dayStart(until) > t ? P.dayStart(until) : 0, upTo: t };
  };
  P.active = (vac) => !!(vac && vac.since);
  // Bis zu welchem Tag angehalten sein soll – höchstens bis zum Tag vor der Rückkehr
  P.target = (vac, now) => {
    const today = P.dayStart(now);
    return vac.until ? Math.min(today, P.addDays(vac.until, -1)) : today;
  };
  // Nachholen beim Öffnen: { n: Tage zu verschieben, vac: neuer Stand oder null (Urlaub vorbei), anchor }
  P.catchUp = (vac, now) => {
    const target = Math.max(P.target(vac, now), vac.upTo);
    const n = P.days(vac.upTo, target);
    const over = !!vac.until && P.dayStart(now) >= vac.until;
    return { n, vac: over ? null : Object.assign({}, vac, { upTo: target }), anchor: target };
  };
  // Von Hand beenden: heute ist wieder ein normaler Tag – angehalten bis gestern
  // (falls heute beim Öffnen schon geschoben wurde, geht das eine Stück zurück)
  P.finish = (vac, now) => {
    const target = Math.max(P.addDays(P.dayStart(now), -1), vac.since);
    return { n: P.days(vac.upTo, target), anchor: target };
  };
})(window.App = window.App || {});
