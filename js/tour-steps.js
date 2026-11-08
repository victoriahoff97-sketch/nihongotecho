/* Nihongo Techō – Tutorial: Texte und Ziele aller Touren (nur Daten). Browser: App.TOURS, Node: module.exports
   Je Schritt: target (CSS-Selektor, fehlt = Blase mittig), until (Rahmen reicht bis zu diesem Element), title, text, place ('right' für Ziele in der Seitenleiste),
   link { label, tour } (im letzten Schritt statt „Ganzen Rundgang zeigen“),
   unless (Schritt fällt weg, wenn dieses Element da ist), heart (als Herzstück hervorgehoben). Höchstens fünf Schritte je Tour.
   Grundsatz (Entscheidung 2026-11-08): weniger ist mehr – nur die Basics, was man ohne Erklärung nicht findet. Selbsterklärendes
   (Suche, Filter, Sortieren, Ansicht umschalten, Vorlesen …) bekommt keinen Schritt. */
'use strict';
(function (root) {
  const EXT = '[data-ext-card]';
  const BK = '#view .card:has([data-backup-auto])';
  // Richtungswahl der Karteikarten – nur bei Vokabeln und Ausdrücken, dort gibt es das Schreibfeld
  const DIRSEG = '#view [data-setup]:not(:has(.on[data-q-type="kanji"], .on[data-q-type="grammar"])) .seg:has([data-q-dir])';

  const TOURS = {
    // Erster Start, direkt nach dem Willkommensbrief: zuerst die Sicherung. choices ersetzen „Weiter“;
    // resume: nach der Sicherungs-Hilfe führt eine Leiste unten zum Rundgang zurück.
    start: [
      { target: '#backup-top', title: 'Zuerst: deine Sicherung', text: 'Alles, was du in der App anlegst, liegt nur auf diesem Gerät. Eine Sicherung schützt es. Willst du direkt eine Sicherung einrichten?',
        choices: [{ label: 'Erst mal nur angucken', tour: 'rundgang' }, { label: 'Ja, einrichten', tour: 'sicherung', resume: true }] },
    ],
    // Angebot beim ersten Start
    rundgang: [
      { target: '#nav .sec-grammar', until: '#nav .sec-phrase', place: 'right', title: 'Deine Sammlungen', text: 'Grammatik, Vokabeln, Kanji und Ausdrücke – alles, was du lernst.' },
      { target: '[data-action="quick-add"]', title: 'Neu anlegen', text: 'Ein Wort, Kanji oder eine Regel legst du von jeder Seite aus hier an.' },
      { target: '#nav .sec-session', place: 'right', title: 'Mitschreiben', text: 'Pro Unterrichtsstunde ein Blatt zum Schreiben mit dem Stift.' },
      { target: '#nav .sec-practice', place: 'right', title: 'Wiederholen', text: 'Hier übst du, was du gesammelt hast.' },
      { target: '[data-action="help"]', title: 'Hilfe', text: 'Das „?“ erklärt dir jede Seite kurz.' },
    ],
    // „?“ auf der Startseite in der Handy-Ansicht (js/view-mode.js, homeHandy in js/views.js)
    startHandy: [
      { target: '[data-hh-hero]', title: 'Heute wiederholen', heart: true, text: '„Jetzt wiederholen“ startet alles, was heute fällig ist. Der Ring zeigt, wie viel schon geschafft ist.' },
      { target: '#handy-bar', title: 'Deine Sammlungen', text: 'Unten kommst du zu Grammatik, Vokabeln, Kanji und Ausdrücken. Alles andere steht im Menü ☰.' },
    ],
    // nach „Jetzt nicht“
    hinweis: [
      { target: '[data-action="help"]', text: 'Hier findest du die Hilfe jederzeit wieder.' },
    ],

    '/': [
      { target: '#view .home-actions', text: 'Deine Schnellaktionen, z. B. ein Wort speichern oder eine Mitschrift beginnen.' },
      { target: '#view a.btn[href*="einstufen"]', text: 'Beim Einstufen sagst du Wort für Wort, ob du es schon kennst. Der Rest kommt in die Lernschlange.' },
      { target: '[data-genki-card]', title: 'Genki I freischalten', text: 'Trage hier den Code ein, den du bekommen hast. Danach ist alles aus dem Buch da.' },
    ],
    '/grammatik': [
      { target: '#view h2', text: 'Nach Lektion geordnet. Ein Tipp öffnet Erklärung und Beispiele.' },
      { target: '#view [data-new="grammar"]', text: 'Eigene Regeln aus dem Unterricht legst du hier an.' },
    ],
    '/vokabeln': [
      { target: '#view .page-head a[href*="einstufen"]', text: 'Geh neue Wörter einmal durch und sag, welche du schon kennst.' },
      { target: '#view .page-head a[href*="ueben/karten"]', text: 'Hier wiederholst du die Wörter aus deiner Lernschlange.' },
      { target: '#view [data-new="vocab"]', text: 'Eigene Wörter legst du hier an.' },
    ],
    '/kanji': [
      { target: '#view .tabs', text: 'Hier findest du auch die Hiragana- und Katakana-Tafeln.' },
      { target: '#view .page-head a[href="#/ueben/kanji"]', text: 'Im Quiz schreibst du Kanji mit dem Stift.' },
    ],
    '/ausdruecke': [
      { target: '#view .card a.btn-sm[href*="ueben/karten"]', text: 'Jede Gruppe lernst du einzeln als Karteikarten.' },
      { target: '#view [data-new="phrase"]', text: 'Eigene Ausdrücke legst du hier an.' },
    ],
    '/gleichklang': [
      { text: 'Wörter, die gleich klingen, aber anders geschrieben werden. Die Seite füllt sich von selbst.' },
    ],
    '/bedeutung': [
      { text: 'Wörter, die auf Deutsch dasselbe heißen. Die Seite füllt sich von selbst.' },
    ],
    '/ueben': [
      { target: '#view a.mode-card[href^="#/ueben/heute"]', text: 'Das Wichtigste: alles, was heute fällig ist, in einer Runde.' },
      { target: '#view a.mode-card[href="#/ueben/einstufen"]', text: 'Neues erst einstufen, damit du nichts übst, was du schon kannst.' },
    ],
    // Karteikarten und „Jetzt wiederholen“ (Auswahl oder laufende Runde). heart: als Herzstück hervorgehoben.
    // Das Schreibfeld steht je nach Lage an drei Stellen – gezeigt wird immer nur einer der drei ersten Schritte.
    karten: [
      { target: '#view .ans-mode', heart: true, title: 'Antwort selbst schreiben', text: 'Tippe den Stift an und schreib das Wort selbst. Die App prüft jedes Zeichen.' },
      { target: DIRSEG, heart: true, title: 'Antwort selbst schreiben', text: 'Wähle „DE → JP“. Dann schreibst du unter jeder Karte das Wort selbst, und die App prüft jedes Zeichen.' },
      { unless: '#view .ans-mode, ' + DIRSEG, heart: true, title: 'Antwort selbst schreiben', text: 'Bei Karten Deutsch → Japanisch schreibst du das Wort selbst, und die App prüft jedes Zeichen.' },
      { target: '#view .flash', text: 'Tippen dreht die Karte um. Danach sagst du, wie gut du es wusstest.' },
    ],
    '/anwenden': [
      { target: '#view .tabs', text: 'Japanisch selbst benutzen: Tagebuch und Fragen zum Beantworten.' },
      { target: '#view .cal-sheet', text: 'Tipp auf einen Tag, um dazu ein paar Sätze zu schreiben.' },
    ],
    '/hoeren': [
      { target: '#view .hr-half-chain', text: 'Dein Stück für heute. „Gehört“ führt die Kette weiter.' },
      { target: '#view .hr-half-shun', text: 'Shuns Podcast, sortiert nach Genki-Lektion.' },
    ],
    '/unterricht': [
      { target: '#view [data-action="new-session"]', text: 'Lege für jede Unterrichtsstunde eine Mitschrift an.' },
      { target: '#view .kb-open', text: 'Das Notizbuch zeigt alle Mitschriften eines Kurses als Buch zum Blättern.' },
    ],
    // Unterrichtsstunde: „?“ auf der Stunde – Blätter-Übersicht (geschrieben wird im Vollbild)
    stunde: [
      { target: '#view .sheet-thumb', title: 'Dein Blatt', text: 'Tipp darauf: Es geht groß auf, dort schreibst du mit dem Stift. Dort erklärt „⋯ › Hilfe“ Stifte und Erkennen.' },
    ],
    // Schreibblatt: „⋯ > Hilfe“ in jedem Blatt. Diese fünf Themen sind Pflicht (Entscheidung 2026-10-11).
    blatt: [
      { target: '.viewer-bar [data-pens]', title: 'Stifte', text: 'Tippe einen Stift an, um zu schreiben. Nochmal antippen: Dicke und Farbe einstellen.' },
      { target: '.viewer-bar [data-tool="lasso"]', title: 'Erkennen', text: 'Kreise ein geschriebenes Wort ein und tippe den passenden Vorschlag an.' },
      { target: '.viewer-bar [data-tool="lasso"]', title: 'Verknüpfen', text: 'Dann „Mit dem Wort verknüpfen“. Gibt es den Eintrag noch nicht, legst du ihn dort gleich an.' },
      { target: '.viewer-bar [data-tool="lasso"]', title: 'Wiederfinden', text: 'Verknüpfte Stellen sind farbig markiert. Ein Tipp darauf zeigt den Eintrag.' },
      { target: '.viewer-bar [data-v="paper"]', title: 'Papier', text: 'Liniert, kariert, Kanji-Raster oder blanko – für jede Seite einzeln.' },
    ],
    // Kurs-Notizbuch (#/unterricht/buch)
    notizbuch: [
      { target: '#view [data-kb-book]', text: 'Alle Mitschriften des Kurses als Buch. Blättern mit den Pfeilen oder Wischen.' },
      { target: '#view [data-kb-toc]', title: 'Inhaltsverzeichnis', text: 'Ein Tipp auf eine Zeile blättert dorthin.' },
      { title: 'Weiterschreiben', text: 'Zum Schreiben öffnest du die Stunde über den Reiter an ihrer Seite.' },
    ],
    '/bibliothek': [
      { target: '#view [data-upload="library"]', text: 'Arbeitsblätter, PDFs und Bilder aus dem Kurs legst du hier ab.' },
      { target: '#view [data-heft-new]', text: 'Ein eigenes Notizbuch mit Kapiteln für dein Lernen.' },
    ],
    '/pakete': [
      { target: '#view [data-pack-upload] h3', title: 'Paket hochladen', text: 'Hast du ein Paket als Datei bekommen, öffnest du es hier.' },
      { target: '#view .pack-card:has([data-id="n5"])', text: 'JLPT-Pakete bringen Wörter, Kanji und Grammatik einer Stufe. Du schaltest sie selbst frei.' },
      { target: '#view [data-wk-card] h3', title: 'WaniKani verknüpfen', text: 'Schlüssel bei WaniKani unter Settings → API Tokens erstellen (Lesezugriff genügt) und hier eintragen.' },
    ],
    '/einstellungen': [
      { target: '#view .card:has([data-bk]) h3', text: 'Deine Daten liegen nur auf diesem Gerät. Hier sicherst du sie – das „?“ daneben zeigt, wie.' },
      { target: EXT + ' h3', title: 'Text aus dem Browser', text: 'Mit der Erweiterung holst du japanischen Text von jeder Webseite in die App.', link: { label: 'Schritt für Schritt zeigen', tour: 'erweiterung' } },
    ],
    // Sicherungs-Hilfe („?“ an der Karte Sicherung) – je Gerät eine, gewählt in tour-logic.js (backupTourKey).
    // Immer zuerst automatisch, dann von Hand. So kurz wie möglich.
    sicherungOrdner: [
      { target: BK + ' [data-backup-auto]', title: '1. Automatisch', text: 'Tippe „Ordner wählen“ und nimm einen Ordner in Google Drive. Ab dann sichert die App von selbst.' },
      { target: BK + ' [data-backup-auto]', title: 'Nach einem Neustart', text: 'Fragt der Browser nach dem Ordner, tippe „Erlauben“. Das ist alles.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du eine Backup-Datei wieder ein.' },
    ],
    sicherungIpad: [
      { target: '#backup-top', title: 'Sichern', text: 'Auf dem iPad sicherst du von Hand: Tippe oben auf dieses Symbol. Ein Punkt daran heißt: noch nicht gesichert.' },
      { title: 'In Dateien sichern', text: 'Im Fenster, das aufgeht, wähle „In Dateien sichern“ und einen Ordner, z. B. iCloud Drive. Fertig.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du die Datei wieder ein.' },
    ],
    sicherungAndroid: [
      { target: '#backup-top', title: 'Sichern', text: 'Auf Android sicherst du von Hand: Tippe oben auf dieses Symbol. Ein Punkt daran heißt: noch nicht gesichert.' },
      { title: 'In Google Drive', text: 'Im Fenster, das aufgeht, wähle „Drive“ und tippe „Speichern“. Kommt kein Fenster: Die Datei liegt in „Downloads“ – lade sie in der Drive-App hoch.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du die Datei wieder ein – auch direkt aus Google Drive.' },
    ],
    sicherungHand: [
      { target: '#backup-top', title: 'Sichern', text: 'In diesem Browser sicherst du von Hand: Klicke oben auf dieses Symbol. Ein Punkt daran heißt: noch nicht gesichert.' },
      { title: 'Ablegen', text: 'Die Datei landet in „Downloads“. Schieb sie z. B. in Google Drive.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du die Datei wieder ein.' },
    ],
    // Gruppenfenster hinter der Gedankenwolke: „⋯ › Hilfe“
    gruppe: [
      { target: '.forum-modal .fd-card', title: 'Tägliche Gruppen-Challenge', text: 'Jeden Tag ein kurzer Satz auf Japanisch für alle. Tipp die Zeile an: dann siehst du die Sätze der anderen und schreibst deinen eigenen.' },
      { target: '.forum-modal [data-newtopic]', title: 'Neues Thema', text: 'Hier hältst du fest, was du besprechen oder zeigen willst.' },
      { target: '.forum-modal [data-list]', title: 'Eure Themen', text: 'Tipp ein Thema an, um zu antworten. Neues von den anderen hat einen roten Rand.' },
    ],
    // Browser-Erweiterung: läuft immer auf der Karte in den Einstellungen
    erweiterung: [
      { target: EXT + ' h3', title: 'Wozu?', text: 'Japanischen Text auf einer Webseite markieren und mit einem Klick in die App holen. Nur mit Chrome oder Edge am PC.' },
      { target: EXT + ' .row', title: 'Holen', text: 'Lade die Erweiterung herunter und entpacke sie an einen Ort, an dem der Ordner bleiben kann, zum Beispiel Dokumente.' },
      { target: EXT + ' ol', title: 'Einmal einrichten', text: 'Öffne im Browser chrome://extensions, schalte den Entwicklermodus ein und wähle über „Entpackte Erweiterung laden“ den Ordner aus.' },
      { target: EXT + ' ol', title: 'Benutzen', text: 'Lass die App geöffnet, lade die Webseite neu und markiere japanischen Text. An der Markierung erscheinen zwei Knöpfe.' },
    ],
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = TOURS; else root.App.TOURS = TOURS;
})(this);
