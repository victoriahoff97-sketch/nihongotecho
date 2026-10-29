/* Nihongo Techō – „Was ist neu“: kurze Notizen zu jedem Update (Anzeige: js/news.js)
   Bei jedem Update, das veröffentlicht wird, OBEN einen Eintrag ergänzen – neueste zuerst.
   id: eindeutig und nie wieder ändern (Datum, zweites Update am selben Tag z. B. „2026-10-24-2“).
   items: höchstens 5, je { t: kurzer Titel, d: ein Satz – was es ist und wo man es findet }.
   Geschrieben für Leute, die die Idee nicht hatten: Alltagssprache, kein App-Jargon. */
'use strict';
(function (App) {
  App.NEWS = [
    {
      id: '2026-10-29-forum-marker', date: '29. Oktober',
      items: [
        { t: 'Textmarker in der Gruppe', d: 'Markier beim Schreiben in der Gruppe ein Stück Text – oben erscheinen vier Farben zum Hinterlegen und „Label“ für ein Fähnchen wie „Partikel“.' },
        { t: 'Emojis in der Gruppe', d: 'Der 😊-Knopf über dem Schreibfeld öffnet eine kleine Emoji-Auswahl; das Emoji landet dort, wo du gerade schreibst.' },
      ],
    },
    {
      id: '2026-10-28-import-spalten', date: '28. Oktober',
      items: [
        { t: 'Vokabel-Import mit Spaltennamen', d: 'Beim Importieren einer Wortliste steht jetzt über den Spalten, was Japanisch, Deutsch und Beispielsatz ist.' },
        { t: 'Quelle wird vorgeschlagen', d: 'Der Import merkt sich, welche Quelle du zuletzt gewählt hast, und schlägt sie beim nächsten Mal von selbst vor.' },
      ],
    },
    {
      id: '2026-10-28-kanji-striche', date: '28. Oktober',
      items: [
        { t: 'Strichzahl bei Kanji berichtigt', d: 'Wer ein neues Kanji per Tastatur eintippt (z. B. „aki“ für 秋), bekam manchmal eine falsche Strichzahl. Behoben – falsche Zahlen wurden von selbst korrigiert.' },
      ],
    },
    {
      id: '2026-10-28-satz-vorschlag', date: '28. Oktober',
      items: [
        { t: 'Satz gleich vorgeschlagen', d: 'Öffnest du die Gruppe aus „Sätze zuordnen“, steht der Satz schon zum Anhängen bereit – und der Link zum Artikel kommt mit in deinen Beitrag.' },
        { t: 'Aufgeräumtes Eingabefeld', d: 'In der Gruppe stehen die Knöpfe jetzt über dem Textfeld, „Teilen“ darunter – und zum Diktieren gibt es je einen Knopf für Deutsch und 日本語.' },
      ],
    },
    {
      id: '2026-10-28-einstufen', date: '28. Oktober',
      items: [
        { t: 'Einstufen aufgeräumt', d: 'Üben › Einstufen sieht jetzt aus wie die Karteikarten: Art, Richtung, Quelle, Lektion und Niveau in einer Zeile. Mit gewählter Lektion stufst du Lektion für Lektion ein.' },
      ],
    },
    {
      id: '2026-10-28-forum-satz', date: '28. Oktober',
      items: [
        { t: 'Sätze in der Gruppe teilen', d: 'Einen interessanten Satz gefunden? In „Sätze erkennen“ die Gruppe öffnen und auf „Satz anhängen“ tippen – dazu wählst du die Vokabeln, um die es dir geht.' },
      ],
    },
    {
      id: '2026-10-28-kanji-quiz', date: '28. Oktober',
      items: [
        { t: 'Kanji-Quiz wie die Karteikarten', d: 'Üben › Kanji-Quiz hat jetzt dieselbe Auswahl wie die Karteikarten: Quelle, Lektion, Niveau, Lernstand und dieselben Startknöpfe.' },
        { t: 'Frei üben statt 10 zufällige', d: 'Frei üben geht im Kanji-Quiz alle Kanji deiner Auswahl durch – Runde für Runde, so groß wie bei „pro Runde“ eingestellt.' },
      ],
    },
    {
      id: '2026-10-28-lernschlange', date: '28. Oktober',
      items: [
        { t: 'Überall „Lernschlange“', d: 'Was du gerade lernst, heißt jetzt in der ganzen App gleich – auch bei Kanji und beim Kanji-Schreiben (früher „Lernstapel“ oder „Übe ich“).' },
      ],
    },
    {
      id: '2026-10-28-karteikarten', date: '28. Oktober',
      items: [
        { t: 'Karteikarten aufgeräumt', d: 'Üben › Karteikarten: Unter der Auswahl wählst du jetzt auch den Lernstand (Ungeprüft, Lernschlange, Kann ich). Darunter stehen alle Startknöpfe in einer Reihe.' },
        { t: 'Lernschlange üben', d: 'Neben „Wiederholen“ übt ein Knopf alles aus deiner Auswahl, was gerade in der Lernschlange ist – auch wenn heute nichts fällig ist.' },
        { t: 'Frei üben ohne Grenze', d: 'Frei üben geht jetzt die ganze Auswahl durch statt höchstens 100 Karten – in Runden so groß wie bei „pro Runde“ eingestellt.' },
      ],
    },
    {
      id: '2026-10-28-forum-herzen', date: '28. Oktober',
      items: [
        { t: 'Herzen und @ in der Gruppe', d: 'Unter jedem Beitrag und jeder Antwort gibt es ein ♡ zum Liken. Mit „@“ (Knopf oder einfach tippen) erwähnst du jemanden – die Person sieht dann „@ dich“ am Beitrag.' },
        { t: 'Ungelesenes fällt auf', d: 'Themen mit neuen Antworten sind rötlich hinterlegt. „Besprochen“ setzen nur noch, wer das Thema schrieb oder die Gruppe gründete.' },
        { t: 'Karteikarte teilen', d: 'Öffnest du die Wolke mitten in den Karteikarten, kannst du die gerade gezeigte Karte samt Beispielsatz mit einem Tipp anhängen.' },
        { t: 'Anderen Beispielsatz wählen', d: 'Bei deinem eigenen Beitrag steht neben dem Beispielsatz einer angehängten Vokabel ein kleines Zahnrad – damit wählst du einen deiner anderen Sätze.' },
        { t: 'Neue Avatare', d: 'Acht neue Motive mit Japan-Thema, z. B. Laterne, Ramen, Kimono und Hanafuda (Wolke › ⋯ › Mein Avatar).' },
      ],
    },
    {
      id: '2026-10-28-grammatik-spalte', date: '28. Oktober',
      items: [
        { t: 'Grammatik: Schon selbst benutzt', d: 'Rechts auf jeder Grammatikseite stehen jetzt deine eigenen Sätze aus Tagebuch und Smalltalk, in denen du den Punkt benutzt hast – das passende Stück ist markiert.' },
        { t: 'Grammatik: rechte Spalte aufgeräumt', d: '„Gleiche Themen“ und „Vokabeln dieser Lektion“ sind weg. In welcher Unterrichtsstunde ein Punkt dran war, steht jetzt rechts unter „Im Unterricht behandelt“.' },
      ],
    },
    {
      id: '2026-10-28-selbst-einstufen', date: '28. Oktober',
      items: [
        { t: 'Im Kopf lösen reicht', d: 'Bei „Umformen üben“ und „Welche Form?“ musst du nichts schreiben: Tippe „Lösung zeigen“ und sag selbst „Hatte ich richtig“ – dann zählt es und kommt nicht noch einmal.' },
      ],
    },
    {
      id: '2026-10-28-strichfolge', date: '28. Oktober',
      items: [
        { t: 'Strichfolge laden klappt wieder', d: 'Bei manchen Kanji (z. B. 冬) schlug „Strichfolge laden“ fehl, weil der Download-Dienst streikte. Nun lädt die App aus einer festen Version und notfalls direkt von GitHub.' },
        { t: 'Kanji-Markierungen mit mehr Platz', d: 'Unter Kanji nutzen die Markierungen jetzt die ganze Breite. Die Farberklärung (Lernstapel, kann ich …) steht rechts neben der ersten Lektions-Überschrift.' },
      ],
    },
    {
      id: '2026-10-28-startseite-zurueck', date: '28. Oktober',
      items: [
        { t: 'Startseite wie vorher', d: 'Die Startseite sieht wieder aus wie bis heute Morgen: einzelne Lernstand-Karten, Schnellaktionen und die Liste 今日 mit „Wenn du magst“.' },
      ],
    },
    {
      id: '2026-10-28-startseite-3', date: '28. Oktober',
      items: [
        { t: 'Stempelkarte sanfter', d: 'Die Karte 今日のスタンプ ist jetzt zart rosa wie die NHK-Kachel. Der rote 済-Stempel bleibt.' },
        { t: 'Unterricht und Zuletzt getrennt', d: 'Unten auf der Startseite stehen „Letzte Unterrichtsstunden“ und „Zuletzt gespeichert“ wieder als eigene Karten nebeneinander.' },
      ],
    },
    {
      id: '2026-10-28-kanji-lesung-2', date: '28. Oktober',
      items: [
        { t: 'Gleiche Lesung nach あいうえお', d: 'Unter Kanji › „同音 Gleiche Lesung“ stehen die Lesungen jetzt nach あいうえお, Kun (Hiragana) immer vor On (Katakana). Das Auswahlfeld holt Neues nach oben.' },
      ],
    },
    {
      id: '2026-10-28-startseite-2', date: '28. Oktober',
      items: [
        { t: 'Startseite: Sammlung wieder da', d: 'Die bunten Karten „Deine Sammlung“ stehen wieder auf der Startseite, direkt unter NHK Easy und Co.' },
        { t: 'Stempelkarte in Rot', d: 'Deine Tagesziele (今日のスタンプ) stehen jetzt auf einer kräftig roten Karte und brauchen etwas weniger Platz.' },
      ],
    },
    {
      id: '2026-10-28-startseite', date: '28. Oktober',
      items: [
        { t: 'Ruhigere Startseite', d: 'Dein Lernstand steht jetzt in einer Karte „Mein Lernstand“. Ein Tipp auf Vokabeln, Kanji oder Genki klappt die Zahlen und Knöpfe auf.' },
        { t: 'Tagesziele als Stempelkarte', d: 'Unter 今日のスタンプ bekommt jedes geschaffte Tagesziel einen roten 済-Stempel. Mit dem Stift daneben stellst du deine Ziele ein.' },
        { t: 'Mehr nach Wunsch', d: 'Schnellaktionen und „Deine Sammlung“ holst du unten über „Startseite anpassen“ zurück.' },
        { t: 'Gleichklang bei den Vokabeln', d: 'Gleichklang steht nicht mehr im Menü links, sondern als Reiter bei den Vokabeln neben „Dateien“.' },
      ],
    },
    {
      id: '2026-10-28-diktieren-2', date: '28. Oktober',
      items: [
        { t: 'Diktieren beim Übersetzen bleibt an', d: 'Beim Übersetzen und Grammatik-Auffrischen hört das Mikrofon wie im Tagebuch weiter zu, auch wenn du kurz überlegst – bis du „Fertig“ tippst.' },
      ],
    },
    {
      id: '2026-10-28-kanji-lesung', date: '28. Oktober',
      items: [
        { t: 'Kanji mit gleicher Lesung', d: 'Unter Kanji › „同音 Gleiche Lesung“ siehst du, welche Kanji gleich gelesen werden – etwa alle mit チ oder セイ. Ein Tipp auf eine Lesung am Kanji führt auch dorthin.' },
      ],
    },
    {
      id: '2026-10-28-bibliothek-3', date: '28. Oktober',
      items: [
        { t: 'Bibliothek aufgeräumt', d: 'Neue Notizbücher und Ordner legst du über „＋ Neu“ in ihrer Reihe an. Filter, Sortieren und „Auswählen“ stehen jetzt gesammelt bei „Dateien“.' },
      ],
    },
    {
      id: '2026-10-28-bibliothek-2', date: '28. Oktober',
      items: [
        { t: 'Notizbücher und Ordner nebeneinander', d: 'In der Bibliothek stehen „Meine Notizbücher“ und „Ordner“ jetzt in einer Reihe. Sind es mehr, wischst oder scrollst du in jedem Bereich zur Seite.' },
      ],
    },
    {
      id: '2026-10-28-grammatik', date: '28. Oktober',
      items: [
        { t: 'Grammatik auffrischen', d: 'Einmal pro Woche steht auf der Startseite „文 Grammatik 5“: fünf Sätze zu Grammatik, die du auf „kann ich“ gesetzt hast. Dein „kann ich“ bleibt dabei, wie es ist.' },
      ],
    },
    {
      id: '2026-10-28-aufgeraeumt', date: '28. Oktober',
      items: [
        { t: 'Üben: aufgeräumt', d: 'Oben stehen die Übungen, die man oft braucht. Übersetzen und Kanji-Quiz findest du unter „Weitere Übungen“, Zahlen und Zähler über „Ausdrücke“.' },
        { t: 'Gleiche Wörter für den Lernstand', d: 'Bei Vokabeln heißt der Filter jetzt wie auf den Karten „Ungeprüft“, bei Ausdrücken „Lernschlange“. So passt überall zusammen, was du siehst.' },
        { t: 'Vokabeln: weniger Knöpfe oben', d: '„Wortliste importieren“ und „Sätze zuordnen“ stecken jetzt hinter „⋯“ rechts neben „＋ Vokabel“.' },
        { t: 'Ruhigere Kanji-Seite und Einstellungen', d: 'Die Kanji-Markierungen erscheinen erst, wenn du eine vergibst. In den Einstellungen sind die Kanji-Feinheiten unter „Lernen“ eingeklappt.' },
      ],
    },
    {
      id: '2026-10-28-bibliothek', date: '28. Oktober',
      items: [
        { t: 'Bibliothek sortieren', d: 'In der Bibliothek steht ganz rechts neben den Filtern eine neue Auswahl: Dateien nach Datum, Quelle, Lektion oder Name ordnen. Das Gerät merkt sich deine Wahl.' },
        { t: 'Eigene Ordner', d: 'Bibliothek › „＋ Neuer Ordner“. Zieh Dateien auf einen Ordner oder nimm „Auswählen“ › „In Ordner“. Beim Filtern findest du auch Dateien aus Ordnern.' },
      ],
    },
    {
      id: '2026-10-28-verwandt', date: '28. Oktober',
      items: [
        { t: 'Vokabeln: rechte Spalte aufgeräumt', d: 'Bei einem Wort steht rechts nicht mehr die Grammatik derselben Lektion. Wörter mit gleichem Kanji (z. B. 並ぶ und 並べる) bleiben dort zum Vergleichen.' },
      ],
    },
    {
      id: '2026-10-28-diktieren', date: '28. Oktober',
      items: [
        { t: 'In der Gruppe diktieren', d: 'Im Schreibfeld der Gruppe gibt es jetzt „Diktieren“: sprechen statt tippen, auf Deutsch oder Japanisch (DE / 日本語 daneben). Es hört zu, bis du „Fertig“ tippst.' },
        { t: 'Vokabel-Antwort sprechen', d: 'Bei den Karteikarten Deutsch → Japanisch steht neben „Prüfen“ ein Mikrofon: Wort auf Japanisch sagen, dann prüfen. Das Antwortfeld schaltest du unter der Karte ein.' },
      ],
    },
    {
      id: '2026-10-27-gruppe', date: '27. Oktober',
      items: [
        { t: 'Die Gruppe bleibt', d: 'Manche Geräte vergaßen die Gruppe und zeigten so auch keinen roten Punkt bei Antworten. Jetzt tritt die App von selbst wieder bei.' },
      ],
    },
    {
      id: '2026-10-27-vorlesen', date: '27. Oktober',
      items: [
        { t: 'Vorlesen mit der richtigen Lesung', d: 'Der Lautsprecher-Knopf liest Wörter und Sätze jetzt so vor, wie die Lesung im Eintrag steht – 開く klingt also „aku“ und nicht mehr „hiraku“.' },
      ],
    },
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
