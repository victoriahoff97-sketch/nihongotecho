/* Nihongo Techō – Tutorial: Texte und Ziele aller Touren (nur Daten). Browser: App.TOURS, Node: module.exports
   Je Schritt: target (CSS-Selektor, fehlt = Blase mittig), until (Rahmen reicht bis zu diesem Element), title, text, place ('right' für Ziele in der Seitenleiste),
   link { label, tour } (im letzten Schritt statt „Ganzen Rundgang zeigen“). Höchstens fünf Schritte je Tour. */
'use strict';
(function (root) {
  const EXT = '[data-ext-card]';

  const TOURS = {
    // Angebot beim ersten Start
    rundgang: [
      { target: '#nav .sec-grammar', until: '#nav .sec-phrase', place: 'right', title: 'Deine Sammlungen', text: 'Hier liegt alles, was du lernst, nach Art sortiert: Grammatik, Vokabeln, Kanji und Ausdrücke. Genki I ist schon drin.' },
      { target: '[data-action="quick-add"]', title: 'Schnell etwas festhalten', text: 'Ein neues Wort, ein Kanji oder eine Regel legst du von jeder Seite aus hier an.' },
      { target: '#nav .sec-session', place: 'right', title: 'Mitschreiben', text: 'Für jede Stunde gibt es ein Blatt, auf dem du mit Stift oder Tastatur schreibst.' },
      { target: '#nav .sec-practice', place: 'right', title: 'Wiederholen', text: 'Karteikarten, Kanji-Quiz und Übersetzungen aus dem, was du gesammelt hast.' },
      { target: '.foot-btn[href="#/pakete"]', place: 'right', title: 'Mehr Inhalte', text: 'Wörterbuch und JLPT-Wortlisten kannst du hier dazuholen. Das „?“ oben erklärt dir jede Seite einzeln.' },
    ],
    // nach „Jetzt nicht“
    hinweis: [
      { target: '[data-action="help"]', text: 'Hier findest du die Hilfe jederzeit wieder.' },
    ],

    '/': [
      { target: '[data-welcome]', text: 'Hier richtest du die App auf diesem Gerät ein. Die Karte verschwindet, wenn alles erledigt ist.' },
      { target: '#view .home-act[data-new-vocab]', until: '#view .home-act[data-action="new-session"]', text: 'Die zwei häufigsten Handgriffe: ein Wort speichern oder eine Mitschrift beginnen.' },
      { target: '#view .fold-btn[data-fold]', text: 'Hier siehst du, wie viel du schon kannst. Ein Tipp auf die Zeile klappt die Einzelheiten auf.' },
      { target: '#view a.btn[href*="einstufen"]', text: 'Beim Einstufen sagst du Wort für Wort, ob du es schon kennst. Nur Unbekanntes kommt in den Lernstapel.' },
      { target: '[data-genki-card]', title: 'Genki I freischalten', text: 'Trage hier den Code ein, den du bekommen hast. Danach stehen Vokabeln, Kanji und Grammatik aus dem Buch bereit.' },
    ],
    '/grammatik': [
      { target: '#view .toolbar', text: 'Suche nach einer Form oder grenze nach Quelle, Lektion und Lernstand ein.' },
      { target: '#view h2', text: 'Die Einträge sind nach Lektion geordnet. Ein Tipp auf einen Eintrag öffnet Erklärung und Beispiele.' },
      { target: '#view .page-head a[href="#/karte"]', text: 'Die Lernlandkarte zeigt, welche Formen aufeinander aufbauen.' },
      { target: '#view [data-new="grammar"]', text: 'Eigene Regeln aus dem Unterricht legst du hier an.' },
    ],
    '/vokabeln': [
      { target: '#view .toolbar', text: 'Suche ein Wort oder grenze nach Lektion, Wortart und Lernstand ein.' },
      { target: '#view [data-mode="list"]', text: 'Wechsle zwischen Karten und einer kompakten Liste.' },
      { target: '#view .page-head a[href*="einstufen"]', text: 'Geh neue Wörter einmal durch und sag, welche du schon kennst.' },
      { target: '#view .page-head a[href*="ueben/karten"]', text: 'Hier wiederholst du die Wörter aus deinem Lernstapel.' },
      { target: '#view [data-new="vocab"]', text: 'Eigene Wörter legst du hier an. „Automatisch ausfüllen“ ergänzt dabei Lesung und Bedeutung.' },
    ],
    '/kanji': [
      { target: '#view .tabs', text: 'Neben den Kanji findest du hier auch die Hiragana- und Katakana-Tafeln.' },
      { target: '#view .toolbar', text: 'Suche nach Zeichen, Bedeutung oder Lesung, oder grenze nach Lektion ein.' },
      { target: '#view .chips', text: 'Mit Markierungen sortierst du Kanji selbst, etwa „Im Unterricht gelernt“ oder „Schwierig“.' },
      { target: '#view .page-head a[href="#/ueben/kanji"]', text: 'Im Quiz schreibst du Kanji mit dem Stift oder erkennst Lesungen.' },
    ],
    '/ausdruecke': [
      { target: '#view .chips', text: 'Feste Wendungen in Gruppen: Begrüßung, Zahlen, Uhrzeit, Wochentage und mehr.' },
      { target: '#view [data-speak]', text: 'Ein Tipp auf den Lautsprecher liest den Ausdruck vor.' },
      { target: '#view .card a.btn-sm[href*="ueben/karten"]', text: 'Jede Gruppe lässt sich einzeln als Karteikarten lernen.' },
      { target: '#view [data-new="phrase"]', text: 'Eigene Ausdrücke und eigene Gruppen legst du hier an.' },
    ],
    '/gleichklang': [
      { text: 'Hier sammeln sich Wörter, die gleich klingen, aber anders geschrieben werden, zum Beispiel はし (Brücke, Essstäbchen).' },
      { text: 'Die Seite füllt sich von selbst, sobald du gleich klingende Wörter lernst. Du musst nichts anlegen.' },
    ],
    '/ueben': [
      { target: '#view a.mode-card[href="#/ueben/karten"]', text: 'Der Kern: Karten kommen wieder, kurz bevor du sie vergessen würdest.' },
      { target: '#view a.mode-card[href="#/ueben/einstufen"]', text: 'Neues erst einstufen, damit du nichts wiederholst, was du schon kannst.' },
      { target: '#view a.mode-card[href="#/ueben/kanji"]', text: 'Kanji mit dem Stift schreiben oder Lesungen erkennen.' },
      { target: '#view a.mode-card[href="#/ueben/saetze"]', text: 'Ganze Sätze, gebaut nur aus Wörtern und Grammatik, die du schon hast.' },
      { target: '#view .read-strip', text: 'Zwei Trainer zu Genki auf einer fremden Seite, falls du mehr Abwechslung möchtest.' },
    ],
    '/anwenden': [
      { target: '#view .tabs', text: 'Zwei Wege, Japanisch selbst zu benutzen: ein Tagebuch und Fragen zum Beantworten.' },
      { target: '#view .cal-sheet', text: 'Tipp auf einen Tag, um dazu einen Eintrag zu schreiben oder zu lesen.' },
      { target: '#view [data-cal-today]', text: 'Ein paar Sätze reichen. Schreiben kannst du mit Stift oder Tastatur.' },
    ],
    '/unterricht': [
      { target: '#view [data-action="new-session"]', text: 'Lege für jede Unterrichtsstunde eine Mitschrift an.' },
      { target: '#view .fold-btn[data-fold-course]', text: 'Die Stunden sind nach Kurs geordnet. Ein Tipp auf eine Stunde öffnet ihr Blatt.' },
      { target: '#view .kb-open', text: 'Das Notizbuch zeigt alle Mitschriften eines Kurses hintereinander zum Blättern.' },
    ],
    // Schreibblatt: „?“ auf einer Unterrichtsstunde und „⋯ > Hilfe“ in jedem Blatt
    blatt: [
      { target: '.viewer-bar [data-tool="pen"]', until: '.viewer-bar [data-tool="marker"]', text: 'Wähle, womit du schreibst. Farbe und Strichstärke stellst du rechts daneben ein.' },
      { target: '.viewer-bar [data-tool="eraser"]', until: '.viewer-bar [data-tool="cut"]', text: 'Zwei Radierer: Der eine löscht ganze Striche, der andere nur genau unter der Spitze.' },
      { target: '.viewer-bar [data-tool="lasso"]', text: 'Kreise ein handgeschriebenes Wort ein, um es nachzuschlagen und mit einer Vokabel zu verknüpfen.' },
      { target: '.viewer-bar [data-v="paper"]', text: 'Liniert, kariert oder Kanji-Raster, für jede Seite einzeln.' },
      { target: '.viewer-bar [data-v="more"]', text: 'Zoom, Drucken und „Nur Stift schreibt“ liegen hier. Diese Hilfe auch.' },
    ],
    '/bibliothek': [
      { target: '#view [data-upload="library"]', text: 'Lege Arbeitsblätter, PDFs und Bilder aus dem Kurs hier ab.' },
      { target: '#view [data-nb]', text: 'Oder beginne ein leeres Blatt zum Schreiben, unabhängig von einer Stunde.' },
      { target: '#view .toolbar', text: 'Später findest du Dateien über Bereich und Dateityp wieder.' },
      { target: '#view [data-pick-on]', text: 'Zum Aufräumen: Markiere eine oder mehrere Dateien und lösche sie zusammen.' },
    ],
    '/pakete': [
      { target: '#view .pack-card:has([data-id="dict-common"])', text: 'Mit dem Wörterbuch kann die App Wörter nachschlagen und beim Anlegen vorausfüllen.' },
      { target: '#view .pack-card:has([data-id="n5"])', text: 'Die JLPT-Pakete ergänzen Wörter, Kanji und Grammatik der jeweiligen Stufe. Du schaltest sie selbst frei, wenn du sie möchtest.' },
      { target: '#view [data-act="unlock"][data-id="n5"]', title: 'So schaltest du frei', text: 'Ein Tipp zeigt dir zuerst, wie viele Einträge dazukommen. Geladen wird erst, wenn du das bestätigst.' },
      { target: '#view [data-storage]', text: 'Hier siehst du, wie viel Platz die App auf deinem Gerät belegt.' },
    ],
    '/einstellungen': [
      { target: '#view .card:has([data-s="name"]) h3', text: 'Name, Aussehen, Furigana und wie viele neue Karten du pro Tag möchtest.' },
      { target: '#view .card:has([data-bk]) h3', text: 'Deine Daten liegen nur auf diesem Gerät. Hier sicherst du sie, am besten regelmäßig.' },
      { target: '#view [data-wk-token]', title: 'WaniKani verknüpfen', text: 'Erstelle bei WaniKani unter Settings → API Tokens einen Schlüssel (Lesezugriff genügt), trage ihn hier ein und tippe „Verbinden“.' },
      { target: '#view [data-wk-card] h3', text: 'Danach wählst du hier die Level aus. Kanji, die du bei WaniKani bis Master gelernt hast, kommen dann zum Schreiben dran.' },
      { target: EXT + ' h3', title: 'Text aus dem Browser', text: 'Mit der Erweiterung holst du japanischen Text von jeder Webseite in die App.', link: { label: 'Schritt für Schritt zeigen', tour: 'erweiterung' } },
    ],
    // Browser-Erweiterung: läuft immer auf der Karte in den Einstellungen
    erweiterung: [
      { target: EXT + ' h3', title: 'Wozu?', text: 'Du liest etwas auf Japanisch im Netz, etwa bei NHK Easy, markierst ein Wort oder einen Satz und hast es mit einem Klick in der App. Geht mit Chrome oder Edge am PC.' },
      { target: EXT + ' .row', title: 'Holen', text: 'Lade die Erweiterung herunter und entpacke sie an einen Ort, an dem der Ordner bleiben kann, zum Beispiel Dokumente.' },
      { target: EXT + ' ol', title: 'Einmal einrichten', text: 'Öffne im Browser chrome://extensions, schalte den Entwicklermodus ein und wähle über „Entpackte Erweiterung laden“ den Ordner aus.' },
      { target: EXT + ' ol', title: 'Markieren', text: 'Lass die App geöffnet, lade die Webseite neu und markiere japanischen Text. An der Markierung erscheinen zwei Knöpfe.' },
      { title: 'Übernehmen', text: 'Der eine Knopf öffnet das Vokabel-Formular, schon mit Lesung, Beispielsatz und Fundstelle. Der andere schickt ganze Sätze zu „Sätze zuordnen“.' },
    ],
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = TOURS; else root.App.TOURS = TOURS;
})(this);
