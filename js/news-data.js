/* Nihongo Techō – „Was ist neu“: kurze Notizen zu jedem Update (Anzeige: js/news.js)
   Bei jedem Update, das veröffentlicht wird, OBEN einen Eintrag ergänzen – neueste zuerst.
   id: eindeutig und nie wieder ändern (Datum, zweites Update am selben Tag z. B. „2026-10-24-2“).
   items: höchstens 5 kurze Zeilen, nur was man in der App merkt, in Alltagssprache. */
'use strict';
(function (App) {
  App.NEWS = [
    {
      id: '2026-10-24', date: '24. Oktober',
      items: [
        'Zeitangaben mit Zahlen: neuer Grammatikeintrag mit Tabelle und Übung „Welche Form?“',
        'Auffrischen: Zahlen-Ausdrücke alle 14 Tage über den Knopf auf der Startseite',
        'Deutsch → Japanisch-Karten verraten das gesuchte Wort nicht mehr (〜)',
        'Vorlesen mit der natürlichsten japanischen Stimme – wählbar unter Einstellungen',
        'Übungen: Antwort mit Stift oder Tastatur wie bei den Karteikarten',
      ],
    },
    {
      id: '2026-10-23', date: '23. Oktober',
      items: [
        'Übersetzen: Antwort per Mikrofon diktieren',
        'Beispielsätze von Tatoeba haben jetzt Furigana',
      ],
    },
    {
      id: '2026-10-22', date: '22. Oktober',
      items: [
        'Tagesliste: eigene Ziele über den Stift in der Karte',
        'Alle Verben mit Partikel-Muster, Beispielsatz und う/る-Gruppe',
        'Konjugieren: ません, ませんでした und Adjektive höflich',
        'Diktieren auf Japanisch in Tagebuch und Smalltalk',
        'WaniKani und andere Inhalte stehen jetzt unter „Pakete“',
      ],
    },
  ];
})(window.App);
