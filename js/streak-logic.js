/* Nihongo Techō – Flammen: Streak mit Wochen-Joker und Urlaub (reine Logik, ohne DOM). Daten als 'JJJJ-MM-TT' (Ortszeit) */
'use strict';
(function (App) {
  const K = App.streakLogic = {};
  const MAX_BACK = 400, MAX_AHEAD = 60;
  // Zeichen vor der Zahl („🔥12“) – überall in der App nur über K.MARK, damit es an einer Stelle tauschbar bleibt
  K.MARK = '🔥';
  // Torii (⛩ mit zwei goldenen Funken) für Wochenleiste + Tage in Folge der To-dos; MARK (🔥) bleibt für Text-Stellen wie das Forum
  K.TORII = '<svg class="torii-ico" viewBox="0 0 28 28" aria-label="geschafft" role="img"><g transform="translate(2 4)"><path class="tk" d="M2 5.2c3.2 1 6.6 1.3 10 1.3s6.8-.3 10-1.3l-.6 2.2c-3 .7-6.2.9-9.4.9s-6.4-.2-9.4-.9z" fill="#2b2523"/><g fill="#d9472b"><rect x="3.6" y="7.6" width="16.8" height="2" rx=".4"/><rect x="3.6" y="11.2" width="16.8" height="1.7" rx=".4"/><rect x="11.1" y="8.8" width="1.8" height="2.6"/><path d="M6 8.5h2l.4 13.5H5.6zM16 8.5h2l.4 13.5h-2.8z"/></g></g><path class="sp sp1" transform="translate(0 0) scale(.75)" d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill="#f2b53a"/><path class="sp sp2" transform="translate(22.6 5.5) scale(.52)" d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill="#f2b53a"/></svg>';
  K.TORII_OPEN = '<svg class="torii-ico torii-ghost" viewBox="0 0 28 28" aria-label="heute noch offen" role="img"><g transform="translate(2 4)"><path class="tk" d="M2 5.2c3.2 1 6.6 1.3 10 1.3s6.8-.3 10-1.3l-.6 2.2c-3 .7-6.2.9-9.4.9s-6.4-.2-9.4-.9z" fill="#2b2523"/><g fill="#d9472b"><rect x="3.6" y="7.6" width="16.8" height="2" rx=".4"/><rect x="3.6" y="11.2" width="16.8" height="1.7" rx=".4"/><rect x="11.1" y="8.8" width="1.8" height="2.6"/><path d="M6 8.5h2l.4 13.5H5.6zM16 8.5h2l.4 13.5h-2.8z"/></g></g><path class="sp sp1" transform="translate(0 0) scale(.75)" d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill="#f2b53a"/><path class="sp sp2" transform="translate(22.6 5.5) scale(.52)" d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill="#f2b53a"/></svg>';
  // Wöchentlicher Joker: eisblaues Torii mit Schneestern – Urlaub bleibt ❄️
  K.JOKER = '<svg class="joker-ico" viewBox="0 0 28 28" aria-label="Joker" role="img"><g transform="translate(2 4)"><path class="tk" d="M2 5.2c3.2 1 6.6 1.3 10 1.3s6.8-.3 10-1.3l-.6 2.2c-3 .7-6.2.9-9.4.9s-6.4-.2-9.4-.9z" fill="#2f7fb8"/><g fill="#bfe6fb" stroke="#3a8cc4" stroke-width=".7" stroke-linejoin="round"><rect x="3.6" y="7.6" width="16.8" height="2" rx=".4"/><rect x="3.6" y="11.2" width="16.8" height="1.7" rx=".4"/><rect x="11.1" y="8.8" width="1.8" height="2.6"/><path d="M6 8.5h2l.4 13.5H5.6zM16 8.5h2l.4 13.5h-2.8z"/></g></g><g transform="translate(4.5 0)"><g stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity=".9"><path d="M19 1v8M15 5h8M16.2 2.2l5.6 5.6M21.8 2.2l-5.6 5.6"/></g><g stroke="#2f7fb8" stroke-width="1.5" stroke-linecap="round"><path d="M19 1v8M15 5h8M16.2 2.2l5.6 5.6M21.8 2.2l-5.6 5.6"/></g></g></svg>';

  const pad = (x) => String(x).padStart(2, '0');
  const fmt = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  // Tage verschieben (Sommerzeit-fest über setDate)
  K.addDays = (date, n) => { const d = parse(date); d.setDate(d.getDate() + n); return fmt(d); };
  // Montag der Woche als Datum
  K.weekKey = (date) => K.addDays(date, -((parse(date).getDay() + 6) % 7));

  // Zählt rückwärts ab heute (heute nur, wenn erledigt; sonst ab gestern).
  // Erledigt → n+1; Urlaub → überspringen; verpasst → Joker (einer je Woche), sonst Ende.
  K.streak = (done, off, today) => {
    let earliest = null;
    for (const d of done) if (earliest === null || d < earliest) earliest = d;
    const res = { n: 0, jokers: [] };
    if (earliest === null) return res;
    const usedWeeks = new Set();
    let d = done.has(today) ? today : K.addDays(today, -1);
    for (let i = 0; i < MAX_BACK && d >= earliest; i++, d = K.addDays(d, -1)) {
      if (done.has(d)) res.n++;
      else if (off.has(d)) continue;
      else {
        const wk = K.weekKey(d);
        if (usedWeeks.has(wk)) break;
        usedWeeks.add(wk);
        res.jokers.push(d);
      }
    }
    return res;
  };

  // Letzter Tag, an dem die Flamme ohne neue Einträge noch lebt (n ≥ 1). Tage nach heute mit futureOff(d) zählen als Urlaub.
  // null, wenn sie heute schon aus ist; höchstens heute + 60.
  K.holdUntil = (done, off, today, futureOff) => {
    if (K.streak(done, off, today).n < 1) return null;
    const offT = new Set(off);
    let last = today;
    for (let i = 1; i <= MAX_AHEAD; i++) {
      const t = K.addDays(today, i);
      if (futureOff(t)) offT.add(t);
      if (K.streak(done, offT, t).n < 1) break;
      last = t;
    }
    return last;
  };

  // Alle Urlaubstage bis heute einschließlich (Log: {from,to} inklusive; laufender Urlaub: since … heute bzw. until − 1)
  K.offDays = (vacationLog, vacation, today) => {
    const out = new Set();
    for (const v of vacationLog || []) {
      if (!v || !v.from || !v.to) continue;
      for (let d = v.from, i = 0; d <= v.to && i < 1000; i++, d = K.addDays(d, 1)) out.add(d);
    }
    if (vacation && vacation.since) {
      let end = today;
      if (vacation.until) { const e = K.addDays(fmt(new Date(vacation.until)), -1); if (e < end) end = e; }
      for (let d = fmt(new Date(vacation.since)), i = 0; d <= end && i < 1000; i++, d = K.addDays(d, 1)) out.add(d);
    }
    return out;
  };

  // Gilt der Tag (nach heute) wegen laufendem Urlaub als frei? Ohne until: alle Tage
  K.futureOff = (vacation, today) => {
    if (!vacation || !vacation.since) return () => false;
    if (!vacation.until) return () => true;
    const last = K.addDays(fmt(new Date(vacation.until)), -1);
    return (date) => date <= last;
  };
})(window.App = window.App || {});
