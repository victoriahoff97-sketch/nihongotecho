/* Nihongo Techō – Backup-Erinnerung: Logik ohne DOM (Tage mit Änderungen merken, Erinnerung ab sieben Tagen) */
'use strict';
(function (App) {
  const R = App.remindLogic = {};
  R.DAYS = 7;
  // Tag (YYYY-MM-DD) anhängen, wenn er noch fehlt; höchstens DAYS Einträge, die ältesten fallen weg
  R.note = (days, today) => {
    if (!Array.isArray(days)) return [today];
    if (days.includes(today)) return days.slice(-R.DAYS);
    return days.concat(today).slice(-R.DAYS);
  };
  // Gemerkte Tage lesen (Merker `changed-days`); unlesbar oder kein Array = leer
  R.readDays = (lsGet) => { try { const d = JSON.parse(lsGet('changed-days')); return Array.isArray(d) ? d : []; } catch (e) { return []; } };
  // Heute als Tag mit Änderungen merken; steht heute schon als letzter Eintrag da, wird nichts geschrieben
  R.noteToday = (lsGet, lsSet, today) => {
    const d = R.readDays(lsGet);
    if (d[d.length - 1] === today) return;
    lsSet('changed-days', JSON.stringify(R.note(d, today)));
  };
  // Erinnern nur ohne automatische Ordner-Sicherung und nach DAYS Tagen mit Änderungen
  R.due = ({ days, backupOn } = {}) => !backupOn && Array.isArray(days) && days.length >= R.DAYS;
})(window.App);
