/* Nihongo Techō – „Was ist neu“: kurze Notizen zu jedem Update (Anzeige: js/news.js)
   Bei jedem Update, das veröffentlicht wird, OBEN einen Eintrag ergänzen – neueste zuerst.
   id: eindeutig und nie wieder ändern (Datum, zweites Update am selben Tag z. B. „2026-10-24-2“).
   items: höchstens 5, je { t: kurzer Titel, d: ein Satz – was es ist und wo man es findet }.
   Geschrieben für Leute, die die Idee nicht hatten: Alltagssprache, kein App-Jargon. */
'use strict';
(function (App) {
  App.NEWS = [
    {
      id: '2026-10-27-import', date: '27. Oktober',
      items: [
        { t: 'Wortlisten einfacher importieren', d: 'Vokabeln › „Importieren“: PDF aus dem Unterricht wählen, schon siehst du die Wörter. Wort, Lesung und Deutsch änderst du direkt oder schreibst Wörter dazu.' },
        { t: 'Gleich in die Lernschlange', d: 'Importierte Wörter kommen jetzt von selbst in die Lernschlange. Wer sie lieber erst einstufen will, stellt das unten vor dem Übernehmen um.' },
      ],
    },
    {
      id: '2026-10-26-auswahl-2', date: '26. Oktober',
      items: [
        { t: 'Zettel samt Schrift verschieben', d: 'Kreise mit „Auswahl“ einen Zettel oder Sticker ganz ein: Schrift und Sticker werden zusammen verschoben, vergrößert oder gelöscht.' },
      ],
    },
    {
      id: '2026-10-26-auswahl', date: '26. Oktober',
      items: [
        { t: 'Schrift auf Zetteln auswählen', d: 'Mit „Auswahl“ kreist du Schrift jetzt auch dann ein, wenn sie auf einem Zettel oder Sticker steht. Den Sticker selbst tippst du kurz an und ziehst ihn dann.' },
      ],
    },
    {
      id: '2026-10-26-unterricht-notizbuch', date: '26. Oktober',
      items: [
        { t: 'Notizbücher in deinen Farben', d: 'Buch und Reiter passen jetzt farblich zusammen und lassen sich einzeln umfärben. Wer lieber normale Seiten statt Buch mag, stellt das pro Notizbuch um.' },
        { t: 'Kanji beim Markieren verknüpfen', d: 'In der Mitschrift markierst du ein Kanji und verknüpfst es direkt – auch eins, das du noch nicht hast. Es landet bei den Kanji der Stunde.' },
        { t: 'Nur Markierungen radieren', d: 'Der Radierer hat einen Modus „nur Markierungen“: Er nimmt Markierungen und Verknüpfungen weg, deine Schrift bleibt stehen.' },
        { t: 'Leiste nicht mehr im Weg', d: 'Markierst du mit Stift oder Finger, erscheint die kleine Leiste der App unter dem Text, damit sie nicht über dem Menü des Tablets liegt.' },
        { t: 'Hausaufgaben schneller öffnen', d: 'Ein Tipp auf die ganze Zeile öffnet die Hausaufgabe. Die Stunden-Seite ist aufgeräumter.' },
      ],
    },
    {
      id: '2026-10-26-forum-plus', date: '26. Oktober',
      items: [
        { t: 'Suchen in der Gruppe', d: 'Über der Themenliste der Gedankenwolke gibt es ein Suchfeld – es findet Text, Namen und angehängte Wörter, auch in besprochenen Themen.' },
        { t: 'Kanji rechts daneben', d: 'Angehängte Kanji stehen groß rechts neben dem Beitrag, mit Bedeutung und Lesungen. Fehlt dir eins, holst du es mit „Als Kanji übernehmen“ zu dir.' },
        { t: 'Screenshots einfügen', d: 'Beim Schreiben in der Gruppe holst du ein Bild aus der Zwischenablage mit „Einfügen“ – am PC geht auch Strg+V.' },
        { t: 'Dein Avatar', d: 'Über „⋯ › Mein Avatar“ wählst du ein niedliches Motiv mit Farbe oder ein Kanji als Namensstempel – er steht neben deinem Namen.' },
      ],
    },
    {
      id: '2026-10-26-forum-kaestchen', date: '26. Oktober',
      items: [
        { t: 'Gruppe übersichtlicher', d: 'Die Gedankenwolke ist größer: Jeder Beitrag steht in einem eigenen Kästchen wie im Tagebuch, oben wählst du, welche Themen du sehen willst.' },
        { t: 'Eintrag gleich mitschicken', d: 'Öffnest du die Wolke auf einer Grammatik, Vokabel, einem Ausdruck oder Kanji, hängst du ihn mit einem Tipp an. Vokabeln sehen alle mit Deutsch und Beispielsatz.' },
      ],
    },
    {
      id: '2026-10-25-gruppe', date: '25. Oktober',
      items: [
        { t: 'Gedankenwolke für eure Gruppe', d: 'Die Wolke oben rechts sammelt, worüber ihr reden wollt und was ihr euch zeigen möchtet. Nur dieser Bereich wird geteilt. Den Code gibt dir, wer die Gruppe gründet.' },
      ],
    },
    {
      id: '2026-10-25-genki-duolingo', date: '25. Oktober',
      items: [
        { t: 'Genki nach Duolingo ohne Dopplungen', d: 'Wer erst Duolingo hatte und dann Genki freischaltet, bekommt gleiche Wörter nur einmal – der Lernstand zieht mit auf die Genki-Karte.' },
      ],
    },
    {
      id: '2026-10-25-schreibfeld-glatt', date: '25. Oktober',
      items: [
        { t: 'Schöner schreiben im Antwortfeld', d: 'Das kleine Schreibfeld unter den Karteikarten und bei den Übungen zeichnet jetzt so glatt wie das Schreibblatt – runde Striche, und fester Druck macht sie dicker.' },
      ],
    },
    {
      id: '2026-10-25-karten-hilfe', date: '25. Oktober',
      items: [
        { t: 'Hilfe zu den Karteikarten', d: 'Das „?“ oben erklärt jetzt die Karteikarten – zuerst das Schreibfeld: Tippe unter der Karte den Stift an, schreib das Wort selbst, und die App prüft jedes Zeichen.' },
      ],
    },
    {
      id: '2026-10-25-hallo', date: '25. Oktober',
      items: [
        { t: 'Ein ehrliches Wort zu den Inhalten', d: 'Wozu die App da ist und dass viele Inhalte mit KI erstellt wurden: nachzulesen unter Einstellungen › Über › „Über diese App“.' },
        { t: 'Tutorial beginnt mit der Sicherung', d: 'Wer die App neu öffnet, wird zuerst gefragt, ob die Sicherung gleich eingerichtet werden soll oder ob man sich erst mal nur umschaut.' },
      ],
    },
    {
      id: '2026-10-25-import-dubletten', date: '25. Oktober',
      items: [
        { t: 'Import: vielleicht schon vorhanden', d: 'Steht ein Wort in der Liste nur in Kana (きらい) und gibt es schon 嫌い, fragt die Vorschau: dasselbe Wort oder neu anlegen?' },
      ],
    },
    {
      id: '2026-10-25-pdf-liste', date: '25. Oktober',
      items: [
        { t: 'Vokabellisten aus dem Unterricht (PDF)', d: 'Der Vokabel-Import liest Listen mit Furigana und Beispielsätzen jetzt richtig. Fehlt das Deutsch, ergänzt die App es; bekannte Wörter bekommen den Satz dazu.' },
      ],
    },
    {
      id: '2026-10-25-zaehler-2', date: '25. Oktober',
      items: [
        { t: 'Zähler üben und abhaken', d: 'In jedem aufgeklappten Zähler (Ausdrücke › Zähler) übt „Üben“ alle Zahlen der Tabelle. Mit „Kann ich“ kommt der Zähler zum Auffrischen alle 14 Tage.' },
      ],
    },
    {
      id: '2026-10-25-filter', date: '25. Oktober',
      items: [
        { t: 'Schlankere Filter', d: 'Bei Grammatik, Vokabeln und Kanji stehen Suche und Filter in einer Zeile. „Gemerkt“ ist jetzt der Stern – antippen zeigt nur deine gemerkten Einträge.' },
      ],
    },
    {
      id: '2026-10-25-reihen', date: '25. Oktober',
      items: [
        { t: 'Startseite auf jedem Gerät ordentlich', d: 'Auf Tablet und MacBook bleiben die Kacheln der Startseite nebeneinander und werden etwas kleiner, statt einzeln umzubrechen. Nur am Handy stehen sie untereinander.' },
      ],
    },
    {
      id: '2026-10-25-zaehler', date: '25. Oktober',
      items: [
        { t: 'Zähler zum Aufklappen', d: 'Unter Ausdrücke › Zähler hat jeder Zähler (Dinge, runde Dinge, Menschen, Nächte …) eine Tabelle von 1 bis 10. Rot = unregelmäßig, Antippen liest vor.' },
      ],
    },
    {
      id: '2026-10-25-spalte', date: '25. Oktober',
      items: [
        { t: 'Rechte Spalte einklappen', d: 'Bei Grammatik, Vokabeln und Ausdrücken schiebt „Einklappen“ oben rechts die verwandten Einträge weg – die Seite wird breiter. „Verwandtes“ holt sie zurück.' },
      ],
    },
    {
      id: '2026-10-25-stifte', date: '25. Oktober',
      items: [
        { t: 'Meine Stifte', d: 'Im Schreibblatt legst du eigene Stifte an: Tippe einen Stift zweimal an und stell Art, Dicke, Deckkraft und Farbe genau ein. „Neu“ legt einen weiteren an.' },
        { t: 'Pinsel und Feder', d: 'Zwei neue Stiftarten: Der Pinsel wird bei Druck breit, die Feder schreibt schräg wie eine Kalligrafie-Feder.' },
        { t: 'Standard-Stift', d: 'Mach im Stift-Fenster einen Stift zum Standard (★) – mit ihm startet dann jedes Blatt.' },
      ],
    },
    {
      id: '2026-10-25', date: '25. Oktober',
      items: [
        { t: 'Kacheln „Heute lesen und hören“ wählen', d: 'Unter „Startseite anpassen“ (ganz unten) nimmst du NHK Easy, WaniKani oder Listening mit ✕ weg oder holst Shun und die Genki-Trainer dazu.' },
      ],
    },
    {
      id: '2026-10-24-2', date: '24. Oktober',
      items: [
        { t: 'Diktieren mit Zeit zum Überlegen', d: 'Im Tagebuch und beim Smalltalk (Getippt › Diktieren) hört die App jetzt weiter zu, auch wenn du kurz nachdenkst – bis du auf „Fertig“ tippst.' },
      ],
    },
    {
      id: '2026-10-24', date: '24. Oktober',
      items: [
        { t: 'Zeitangaben mit Zahlen', d: 'Neuer Grammatikeintrag: wann man „drei Tage“, „dreimal pro Woche“ oder „das dritte Mal“ sagt – mit Tabelle und der Übung „Welche Form?“.' },
        { t: 'Auffrischen', d: 'Alle 14 Tage erscheint auf der Startseite der Knopf „Auffrischen“: 10 Karten zu Zahlen, Uhrzeit und Zählwörtern, damit nichts verblasst.' },
        { t: 'Kein Verraten mehr', d: 'Auf Deutsch → Japanisch-Karten steht das gesuchte Wort nicht mehr in der deutschen Bedeutung, es wird zu 〜.' },
        { t: 'Bessere Aussprache', d: 'Vorlesen nimmt die natürlichste japanische Stimme deines Geräts. Eine andere wählst du unter Einstellungen › Persönlich › Stimme.' },
        { t: 'Antwort schreiben in Übungen', d: 'Bei Umformen, „Welche Form?“ und Übersetzen schreibst du die Antwort wie bei den Karteikarten mit dem Stift oder tippst sie.' },
      ],
    },
    {
      id: '2026-10-23', date: '23. Oktober',
      items: [
        { t: 'Übersetzen per Stimme', d: 'Unter Üben › Übersetzen gibt es „Diktieren“: Antwort einfach einsprechen statt schreiben.' },
        { t: 'Furigana bei Beispielsätzen', d: 'Automatisch geholte Beispielsätze zeigen jetzt die Lesung über den Kanji – auch die schon gespeicherten.' },
      ],
    },
    {
      id: '2026-10-22', date: '22. Oktober',
      items: [
        { t: 'Eigene Tagesziele', d: 'In der Karte „今日 · Heute“ auf der Startseite den Stift antippen: Ziele an- und ausschalten, Zahlen ändern, eigene Punkte ergänzen.' },
        { t: 'Verben mit Partikel und Gruppe', d: 'Jedes Verb zeigt seine Partikel (z. B. ベッドで寝る), einen Beispielsatz und ob es ein う-, る- oder unregelmäßiges Verb ist.' },
        { t: 'Mehr Formen beim Konjugieren', d: 'Unter Üben › Konjugieren jetzt auch ません/ませんでした und Adjektive in kurzer und höflicher Form.' },
        { t: 'Diktieren im Tagebuch', d: 'Im Tagebuch und beim Smalltalk kannst du unter „Getippt“ Japanisch einsprechen.' },
        { t: 'Pakete aufgeräumt', d: 'Alles, was Inhalte bringt (JLPT, WaniKani, Wörterbuch, Teilen), steht jetzt unter „Pakete“ – das Würfel-Symbol unten links.' },
      ],
    },
  ];
})(window.App);
