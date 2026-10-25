/* Nihongo Techō – Tutorial: Texte und Ziele aller Touren (nur Daten). Browser: App.TOURS, Node: module.exports
   Je Schritt: target (CSS-Selektor, fehlt = Blase mittig), until (Rahmen reicht bis zu diesem Element), title, text, place ('right' für Ziele in der Seitenleiste),
   link { label, tour } (im letzten Schritt statt „Ganzen Rundgang zeigen“). Höchstens fünf Schritte je Tour. */
'use strict';
(function (root) {
  const EXT = '[data-ext-card]';
  const BK = '#view .card:has([data-backup-auto])';

  const TOURS = {
    // Erster Start, direkt nach dem Willkommensbrief: zuerst die Sicherung. choices ersetzen „Weiter“;
    // resume: nach der Sicherungs-Hilfe führt eine Leiste unten zum Rundgang zurück.
    start: [
      { target: '#backup-top', title: 'Zuerst: deine Sicherung', text: 'Alles, was du in der App anlegst, liegt nur auf diesem Gerät. Eine Sicherung schützt es. Willst du direkt eine Sicherung einrichten?',
        choices: [{ label: 'Erst mal nur angucken', tour: 'rundgang' }, { label: 'Ja, einrichten', tour: 'sicherung', resume: true }] },
    ],
    // Angebot beim ersten Start
    rundgang: [
      { target: '#nav .sec-grammar', until: '#nav .sec-phrase', place: 'right', title: 'Deine Sammlungen', text: 'Hier liegt alles, was du lernst, nach Art sortiert: Grammatik, Vokabeln, Kanji und Ausdrücke. Genki I ist schon drin.' },
      { target: '[data-action="quick-add"]', title: 'Schnell etwas festhalten', text: 'Ein neues Wort, ein Kanji oder eine Regel legst du von jeder Seite aus hier an.' },
      { target: '#nav .sec-session', place: 'right', title: 'Mitschreiben', text: 'Für jede Stunde gibt es ein Blatt, auf dem du mit Stift oder Tastatur schreibst.' },
      { target: '#nav .sec-practice', place: 'right', title: 'Wiederholen', text: 'Karteikarten, Kanji-Quiz und Übersetzungen aus dem, was du gesammelt hast.' },
      { target: '.foot-btn[href="#/pakete"]', place: 'right', title: 'Mehr Inhalte', text: 'Wörterbuch, JLPT-Wortlisten und WaniKani holst du hier dazu. Das „?“ oben erklärt dir jede Seite einzeln.' },
    ],
    // nach „Jetzt nicht“
    hinweis: [
      { target: '[data-action="help"]', text: 'Hier findest du die Hilfe jederzeit wieder.' },
    ],

    '/': [
      { target: '[data-welcome]', text: 'Hier richtest du die App auf diesem Gerät ein. Die Karte verschwindet, wenn alles erledigt ist.' },
      { target: '#view .home-actions', text: 'Deine Schnellaktionen, z. B. ein Wort speichern oder eine Mitschrift beginnen. Welche hier stehen und wie die Startseite aufgebaut ist, legst du unten mit „Startseite anpassen“ fest.' },
      { target: '#view .fold-btn[data-fold]', text: 'Hier siehst du, wie viel du schon kannst. Ein Tipp auf die Zeile klappt die Einzelheiten auf.' },
      { target: '#view a.btn[href*="einstufen"]', text: 'Beim Einstufen sagst du Wort für Wort, ob du es schon kennst. Was du noch lernen musst, kommt gleich in die Lernschlange.' },
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
      { target: '#view .page-head a[href*="ueben/karten"]', text: 'Hier wiederholst du die Wörter aus deiner Lernschlange.' },
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
      { target: '#view a.mode-card[href^="#/ueben/heute"]', text: 'Der Kern: Karten kommen wieder, kurz bevor du sie vergessen würdest – hier alles Fällige gemischt. Daneben „Karteikarten“: einzeln nach Art oder Lektion üben und Neues lernen.' },
      { target: '#view a.mode-card[href="#/ueben/einstufen"]', text: 'Neues erst einstufen, damit du nichts wiederholst, was du schon kannst.' },
      { target: '#view a.mode-card[href="#/ueben/kanji"]', text: 'Kanji mit dem Stift schreiben oder Lesungen erkennen.' },
      { target: '#view a.mode-card[href="#/ueben/saetze"]', text: 'Ganze Sätze, gebaut nur aus Wörtern und Grammatik, die du schon hast.' },
      { target: '#view a.mode-card[href="#/ueben/konjugieren"]', text: 'Formen bilden: Du wählst eine Mischung, zum Beispiel nur die て-Form, bildest die Formen im Kopf oder auf Papier und deckst auf.' },
    ],
    '/anwenden': [
      { target: '#view .tabs', text: 'Zwei Wege, Japanisch selbst zu benutzen: ein Tagebuch und Fragen zum Beantworten.' },
      { target: '#view .cal-sheet', text: 'Tipp auf einen Tag, um dazu einen Eintrag zu schreiben oder zu lesen.' },
      { target: '#view [data-cal-today]', text: 'Ein paar Sätze reichen. Schreiben kannst du mit Stift oder Tastatur.' },
    ],
    '/hoeren': [
      { target: '#view .hr-half-chain', text: 'Deine Hör-Kette: Ringe für das schon Gehörte, dein Stück für heute (wie auf der Startseite) und die Etappen. „Gehört“ führt die Kette weiter, eine Etappe klappt sie unten auf.' },
      { target: '#view .hr-half-shun', text: 'Shuns Podcast: die nächste Folge und ein Kästchen je Genki-Lektion – voll heißt alles gehört, hell angefangen. Ein Tipp klappt die Lektion auf.' },
      { target: '#view .hr-tabs', text: 'Hier wechselst du zwischen der ganzen Liste der Hör-Kette und allen Folgen von Shun.' },
      { target: '#view .hr-block[open]', text: 'Die ganze Reihenfolge der Kette. ▶ spielt ein Stück zum Reinhören, „Ab hier“ setzt die Kette auf dieses Stück.' },
    ],
    '/unterricht': [
      { target: '#view [data-action="new-session"]', text: 'Lege für jede Unterrichtsstunde eine Mitschrift an.' },
      { target: '#view .fold-btn[data-fold-course]', text: 'Die Stunden sind nach Kurs geordnet. Ein Tipp auf eine Stunde öffnet ihr Blatt.' },
      { target: '#view .kb-open', text: 'Das Notizbuch zeigt alle Mitschriften eines Kurses als Buch zum Blättern, mit Inhaltsverzeichnis für Stunden und Grammatik.' },
    ],
    // Schreibblatt: „?“ auf einer Unterrichtsstunde und „⋯ > Hilfe“ in jedem Blatt
    blatt: [
      { target: '.viewer-bar [data-pens]', title: 'Meine Stifte', text: 'Tippe einen Stift an, um zu schreiben. Nochmal antippen: Stiftart, Dicke, Deckkraft und Farbe einstellen oder ihn zum Standard machen. „Neu“ legt einen weiteren Stift an.' },
      { target: '.viewer-bar [data-tool="lasso"]', title: 'Erkennen', text: 'Kreise ein handgeschriebenes Wort ein. Die App schlägt vor, was dort steht – tippe den passenden Vorschlag an.' },
      { target: '.viewer-bar [data-tool="lasso"]', title: 'Verknüpfen', text: 'Im Nachschlagen-Fenster tippst du „Mit dem Wort verknüpfen“. Gibt es die Vokabel oder Grammatik noch nicht, legst du sie dort gleich an.' },
      { target: '.viewer-bar [data-tool="lasso"]', title: 'Wiederfinden', text: 'Verknüpfte Stellen sind farbig markiert: Vokabeln lila, Grammatik orange. Ein Tipp darauf zeigt den Eintrag.' },
      { target: '.viewer-bar [data-v="paper"]', title: 'Papier', text: 'Liniert, kariert, Kanji-Raster, Punkte oder blanko, für jede Seite einzeln.', link: { label: 'Sticker, Buch und Aufgaben zeigen', tour: 'blattMehr' } },
    ],
    // zweiter Teil, erreichbar über den letzten Schritt von „blatt“; „Buch“ gibt es nur im Notizblatt, „Nebeneinander“ nur bei Buchaufgaben
    blattMehr: [
      { target: '.viewer-bar [data-v="sticker"]', title: 'Sticker', text: 'Zettel, Banner und Kanji-Feld oder Sticker in drei Stufen (Kawaii, Süß, Normal): wählen, dann auf die Stelle im Blatt tippen. Mit „Auswahl“ verschieben, drehen, skalieren.' },
      { target: '.viewer-bar [data-v="book"]', text: 'Zeigt zwei Seiten nebeneinander wie in einem aufgeschlagenen Heft.' },
      { target: '.viewer-bar [data-v="split"]', title: 'Genki-Aufgaben', text: 'Aufgabe und Schreibblatt stehen nebeneinander statt untereinander. Geht im Querformat.' },
      { target: '.viewer-bar [data-v="more"]', text: 'Zoom, Drucken, „Nur Stift schreibt“ und „Blatt löschen“ liegen hier. Bei Genki-Aufgaben auch „Seiten tauschen“ und „Mit der Tastatur antworten“: ein Feld zum Tippen statt des Schreibblatts.' },
      { target: '.viewer-bar [data-tool="eraser"]', until: '.viewer-bar [data-tool="cut"]', text: 'Zwei Radierer: Der eine löscht ganze Striche, der andere nur genau unter der Spitze.' },
    ],
    // Kurs-Notizbuch (#/unterricht/buch)
    notizbuch: [
      { target: '#view [data-kb-book]', text: 'Alle Mitschriften des Kurses als ein Buch. Hier wird nur gelesen, nicht geschrieben.' },
      { target: '#view [data-kb-toc]', title: 'Inhaltsverzeichnis', text: 'Die erste Doppelseite: links die Stunden, rechts die Grammatik des Kurses. Ein Tipp auf eine Zeile blättert dorthin.' },
      { target: '#view [data-kb-toc]', text: 'Grammatik, die du auf dem Blatt verknüpft hast, springt genau zu der Stelle und ist dort hervorgehoben.' },
      { title: 'Weiterschreiben', text: 'Zum Schreiben öffnest du die Stunde über den Reiter oben an ihrer Seite („öffnen“).' },
      { target: '#view .kb-zoom', text: 'Blättern mit den Pfeilen oder Wischen. Vergrößern mit +, zwei Fingern oder Doppeltipp.' },
    ],
    '/bibliothek': [
      { target: '#view [data-upload="library"]', text: 'Lege Arbeitsblätter, PDFs und Bilder aus dem Kurs hier ab.' },
      { target: '#view [data-nb]', text: 'Oder beginne ein leeres Blatt zum Schreiben, unabhängig von einer Stunde.' },
      { target: '#view [data-heft-new]', text: 'Für dein eigenes Lernen: Lege ein Notizbuch mit Kapiteln an – mit Inhaltsverzeichnis wie im Kurs.' },
      { target: '#view .toolbar', text: 'Später findest du Dateien über Bereich und Dateityp wieder.' },
      { target: '#view [data-pick-on]', text: 'Zum Aufräumen: Markiere eine oder mehrere Dateien und lösche sie zusammen.' },
    ],
    '/pakete': [
      { target: '#view [data-pack-upload] h3', title: 'Paket hochladen', text: 'Hast du ein Paket als Datei bekommen – etwa die Unterrichtsfolien oder ein Paket von Freunden –, öffnest du es hier.' },
      { target: '#view .pack-card:has([data-id="dict-common"])', text: 'Mit dem Wörterbuch kann die App Wörter nachschlagen und beim Anlegen vorausfüllen.' },
      { target: '#view .pack-card:has([data-id="n5"])', text: 'Die JLPT-Pakete ergänzen Wörter, Kanji und Grammatik der jeweiligen Stufe. Du schaltest sie selbst frei, wenn du sie möchtest.' },
      { target: '#view [data-act="unlock"][data-id="n5"]', title: 'So schaltest du frei', text: 'Ein Tipp zeigt dir zuerst, wie viele Einträge dazukommen. Geladen wird erst, wenn du das bestätigst.' },
      { target: '#view [data-wk-card] h3', title: 'WaniKani verknüpfen', text: 'Schlüssel bei WaniKani unter Settings → API Tokens erstellen (Lesezugriff genügt) und hier eintragen. Danach wählst du die Level für Kanji zum Schreiben und für Vokabeln.' },
    ],
    '/einstellungen': [
      { target: '#view .card:has([data-s="name"]) h3', text: 'Name, Aussehen, Furigana und die Stimme, die vorliest.' },
      { target: '#view .card:has([data-s="newPerDay"]) h3', text: 'Wie du lernst: neue Karten pro Sitzung, Einstufen, Kanji-Schwerpunkt und woher die Kanji zum Schreiben kommen.' },
      { target: '#view .card:has([data-bk]) h3', text: 'Deine Daten liegen nur auf diesem Gerät. Hier sicherst du sie. Das „?“ daneben zeigt dir, wie das auf deinem Gerät geht.' },
      { target: EXT + ' h3', title: 'Text aus dem Browser', text: 'Mit der Erweiterung holst du japanischen Text von jeder Webseite in die App.', link: { label: 'Schritt für Schritt zeigen', tour: 'erweiterung' } },
    ],
    // Sicherungs-Hilfe („?“ an der Karte Sicherung) – je Gerät eine, gewählt in tour-logic.js (backupTourKey).
    // Immer zuerst automatisch, dann von Hand. So kurz wie möglich.
    sicherungOrdner: [
      { target: BK + ' [data-backup-auto]', title: '1. Automatisch', text: 'Tippe „Ordner wählen“ und nimm einen Ordner in Google Drive. Ab dann sichert die App von selbst.' },
      { target: BK + ' [data-backup-auto]', title: 'Nach einem Neustart', text: 'Fragt der Browser nach dem Ordner, tippe „Erlauben“. Das ist alles.' },
      { target: BK + ' [data-exp]', until: BK + ' [data-exp-light]', title: '2. Von Hand', text: 'Lädt eine Backup-Datei herunter. Brauchst du nur ohne Ordner.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du eine Backup-Datei wieder ein.' },
    ],
    sicherungIpad: [
      { target: BK + ' [data-backup-auto]', title: '1. Automatisch', text: 'Geht auf dem iPad leider nicht. Darum sicherst du von Hand – mit einem Tipp.' },
      { target: '#backup-top', title: '2. Von Hand', text: 'Tippe oben auf dieses Symbol. Ein Punkt daran heißt: noch nicht gesichert.' },
      { title: 'In Dateien sichern', text: 'Im Fenster, das aufgeht, wähle „In Dateien sichern“ und einen Ordner, z. B. iCloud Drive. Fertig.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du die Datei wieder ein.' },
    ],
    sicherungAndroid: [
      { target: BK + ' [data-backup-auto]', title: '1. Automatisch', text: 'Geht auf Android leider nicht. Darum sicherst du von Hand – mit einem Tipp.' },
      { target: '#backup-top', title: '2. Von Hand', text: 'Tippe oben auf dieses Symbol. Ein Punkt daran heißt: noch nicht gesichert.' },
      { title: 'In Google Drive', text: 'Im Fenster, das aufgeht, wähle „Drive“ und tippe „Speichern“. Kommt kein Fenster: Die Datei liegt in „Downloads“. Öffne die Drive-App, tippe „+“ → „Hochladen“ und wähle sie aus.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du die Datei wieder ein – auch direkt aus Google Drive.' },
    ],
    sicherungHand: [
      { target: BK + ' [data-backup-auto]', title: '1. Automatisch', text: 'Geht nur mit Chrome oder Edge am PC. In diesem Browser sicherst du von Hand.' },
      { target: '#backup-top', title: '2. Von Hand', text: 'Klicke oben auf dieses Symbol. Ein Punkt daran heißt: noch nicht gesichert.' },
      { title: 'Ablegen', text: 'Die Datei landet in „Downloads“. Schieb sie z. B. in Google Drive.' },
      { target: BK + ' label:has([data-imp])', title: 'Zurückholen', text: 'Hier spielst du die Datei wieder ein.' },
    ],
    // Browser-Erweiterung: läuft immer auf der Karte in den Einstellungen
    erweiterung: [
      { target: EXT + ' h3', title: 'Wozu?', text: 'Du liest etwas auf Japanisch im Netz, etwa bei NHK Easy, markierst ein Wort oder einen Satz und hast es mit einem Klick in der App. Geht nur mit Chrome oder Edge am PC, nicht auf Handy oder Tablet.' },
      { target: EXT + ' .row', title: 'Holen', text: 'Lade die Erweiterung herunter und entpacke sie an einen Ort, an dem der Ordner bleiben kann, zum Beispiel Dokumente.' },
      { target: EXT + ' ol', title: 'Einmal einrichten', text: 'Öffne im Browser chrome://extensions, schalte den Entwicklermodus ein und wähle über „Entpackte Erweiterung laden“ den Ordner aus.' },
      { target: EXT + ' ol', title: 'Markieren', text: 'Lass die App geöffnet, lade die Webseite neu und markiere japanischen Text. An der Markierung erscheinen zwei Knöpfe.' },
      { title: 'Übernehmen', text: 'Der eine Knopf öffnet das Vokabel-Formular, schon mit Lesung, Beispielsatz und Fundstelle. Der andere schickt ganze Sätze zu „Sätze zuordnen“.' },
    ],
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = TOURS; else root.App.TOURS = TOURS;
})(this);
