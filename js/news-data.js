/* Nihongo Techō – „Was ist neu“: kurze Notizen zu jedem Update (Anzeige: js/news.js)
   Bei jedem Update, das veröffentlicht wird, OBEN einen Eintrag ergänzen – neueste zuerst.
   id: eindeutig und nie wieder ändern (Datum, zweites Update am selben Tag z. B. „2026-10-24-2“).
   items: höchstens 5, je { t: kurzer Titel, d: ein Satz – was es ist und wo man es findet }.
   Geschrieben für Leute, die die Idee nicht hatten: Alltagssprache, kein App-Jargon. */
'use strict';
(function (App) {
  App.NEWS = [
    {
      id: '2026-11-09-suche-leeren', date: '9. November',
      items: [
        { t: 'Suche räumt sich auf', d: 'Die Suche oben wird leer, sobald du fertig bist: Treffer angetippt, daneben getippt, Esc oder auf eine andere Seite gewechselt.' },
      ],
    },
    {
      id: '2026-11-09-einstellungen', date: '9. November',
      items: [
        { t: 'Einstellungen aufgeräumt', d: 'Unter Einstellungen steht jetzt jede Einstellung in einer Zeile mit Schalter rechts – die Seite ist nur noch halb so lang. Seltenes wie Kanji, Urlaubsmodus oder Wiederherstellen klappst du bei Bedarf auf.' },
        { t: 'Quellen als Farbpunkte', d: 'Deine Quellen (Genki, Unterricht …) stehen als kleine Farbknöpfe da. Antippen, um Name oder Farbe zu ändern; Erweiterung, Android-App und Web-App findest du gesammelt unter „Geräte“.' },
      ],
    },
    {
      id: '2026-11-09-tempo', date: '9. November',
      items: [
        { t: 'Vokabeln öffnen schneller', d: 'Der Wechsel zur Vokabelliste (und von dort weg) hakt nicht mehr, auch bei tausenden Wörtern – die Karten weiter unten laden unmerklich nach.' },
      ],
    },
    {
      id: '2026-11-09-verb-import', date: '9. November',
      items: [
        { t: 'Partikeln auch für importierte Verben', d: 'Verben aus Wortlisten und geteilten Paketen zeigen jetzt beim Abfragen das Partikel-Muster (z. B. 人に会う) und ob es ein う-, る- oder unregelmäßiges Verb ist.' },
        { t: 'Muster aus deinem Satz', d: 'Steht ein Verb in keinem Paket (z. B. 散歩する), nimmt die App das Muster aus deinem Beispielsatz: 公園を散歩します → 公園を散歩する.' },
        { t: 'Verbklasse berichtigt', d: 'Selbst getippte Verben wie 片付ける wurden manchmal als う-Verb angezeigt – das ist korrigiert, auch bei schon gespeicherten.' },
      ],
    },
    {
      id: '2026-11-09-suche-stift', date: '9. November',
      items: [
        { t: 'Suchen mit dem Stift', d: 'In jedem Suchfeld (oben, in den Listen, im Forum …) sitzt rechts ein kleiner Stift: antippen, Wort hineinschreiben – die Suche startet von selbst.' },
      ],
    },
    {
      id: '2026-11-09-vergleichen', date: '9. November',
      items: [
        { t: 'Zwei Wörter vergleichen', d: 'Knopf ⇄ oben neben der Suche (oder Taste V): links steht, was du gerade siehst, rechts suchst du ein zweites Wort oder Kanji – der Unterschied ist gelb.' },
      ],
    },
    {
      id: '2026-11-09-paket-reste', date: '9. November',
      items: [
        { t: 'Keine doppelten JLPT-Wörter mehr', d: 'Alte Reste früherer JLPT-Pakete (z. B. こくせき zusätzlich zu 国籍, nur auf Englisch) räumt die App jetzt selbst auf – dein Lernstand wandert zum verbliebenen Wort.' },
      ],
    },
    {
      id: '2026-11-09-kanji-woerter', date: '9. November',
      items: [
        { t: 'Vom Kanji zur Vokabel', d: 'Auf einer Kanji-Seite unter „Wörter“: Wörter mit einem kleinen › hast du als Vokabel – antippen öffnet sie.' },
      ],
    },
    {
      id: '2026-11-09-challenge-archiv', date: '9. November',
      items: [
        { t: 'Frühere Challenges', d: 'Unten in der Täglichen Gruppen-Challenge: „Frühere Challenges ansehen“ zeigt die Aufgaben der letzten Tage mit allen Sätzen.' },
        { t: 'Furigana bleiben', d: 'Hast du die Lesung deines Satzes korrigiert und änderst danach den Text, bleibt deine Korrektur erhalten.' },
      ],
    },
    {
      id: '2026-11-09-grosses-woerterbuch', date: '9. November',
      items: [
        { t: 'Seltenere Wörter ausfüllen', d: 'Findet „Automatisch ausfüllen“ ein Wort nicht (z. B. キャンプ場), kannst du dort gleich das große Wörterbuch laden – danach füllt die App aus.' },
      ],
    },
    {
      id: '2026-11-09-forum-markieren', date: '9. November',
      items: [
        { t: 'Markieren im Forum', d: 'Auch in der Gruppe und in der Täglichen Gruppen-Challenge: Japanisches Wort markieren → „Vokabel speichern“ oder „Sätze erkennen“.' },
      ],
    },
    {
      id: '2026-11-09-furigana-korrigieren', date: '9. November',
      items: [
        { t: 'Furigana korrigieren', d: 'Falsche Lesung in der Challenge? Bei deinem Satz über „Bearbeiten“, bei anderen über den kleinen Link darunter. Alle sehen deine Korrektur.' },
      ],
    },
    {
      id: '2026-11-09-furigana-endung', date: '9. November',
      items: [
        { t: 'Richtigere Furigana', d: 'Nach Wörtern in Katakana stimmt die Lesung jetzt öfter: キャンプ場 (じょう), ドイツ人 (じん), コーヒー店 (てん).' },
      ],
    },
    {
      id: '2026-11-09-challenge-glitzer', date: '9. November',
      items: [
        { t: 'Furigana in der Challenge', d: 'Über den Sätzen in der Täglichen Gruppen-Challenge stehen jetzt Furigana – auch über deinem eigenen.' },
        { t: 'Wer heute schon dabei war', d: 'In der Challenge-Zeile erscheinen die Avatare aller, die heute geschrieben haben, mit ihrer 🔥 darunter – schon ab dem ersten Tag.' },
        { t: 'Mehr Glanz', d: 'Die Challenge-Zeile ist größer und glitzert ein bisschen, damit du sie nicht übersiehst.' },
      ],
    },
    {
      id: '2026-11-09-tour-kurz', date: '9. November',
      items: [
        { t: 'Kürzere Hilfe', d: 'Das „?“ oben erklärt jede Seite jetzt nur noch mit den wichtigsten zwei, drei Schritten.' },
      ],
    },
    {
      id: '2026-11-09-forum-kaestchen-2', date: '9. November',
      items: [
        { t: 'Themen wieder als Kästchen', d: 'Die Forum-Themen sehen wieder aus wie vorher: mit Datum, bis zu drei Zeilen Text und den Verknüpfungen.' },
        { t: 'Challenge als schmale Zeile', d: 'Die Tägliche Gruppen-Challenge ist oben nur noch eine Zeile mit dem Anstoß und deiner 🔥. Antippen klappt sie auf.' },
        { t: 'Erst schreiben, dann lesen', d: 'Die Sätze der anderen sind verwischt, bis du deinen eigenen geschrieben hast. Die Geschichte am Wochenende siehst du immer ganz.' },
      ],
    },
    {
      id: '2026-11-09-handy-woche', date: '9. November',
      items: [
        { t: 'Deine Woche auch am Handy', d: 'Auf der Handy-Startseite steht unter „Jetzt wiederholen“ die Woche Mo bis So mit 🔥 für jeden Tag mit Wiederholen und ❄️ für Joker oder Urlaub.' },
      ],
    },
    {
      id: '2026-11-09-gesamt-flamme', date: '9. November',
      items: [
        { t: 'Große 🔥 in der 今日-Karte', d: 'Neben „今日 · Heute“ zählt eine Flamme, wie viele Tage in Folge du alle To-dos geschafft hast.' },
        { t: 'Deine Woche auf einen Blick', d: 'Darunter steht Mo bis So: 🔥 für jeden geschafften Tag, ❄️ wenn Joker oder Urlaub deine Serie gehalten haben.' },
      ],
    },
    {
      id: '2026-11-09-gruppen-challenge', date: '9. November',
      items: [
        { t: 'Gruppen-Challenge', d: 'Der Satz des Tages steht jetzt als farbiges Banner oben im Forum – mit deiner Flamme groß daneben und wie viele heute schon dabei sind.' },
        { t: 'Alle Sätze auf einen Blick', d: 'Die Sätze der anderen siehst du sofort, nicht erst nach deinem eigenen. Dein Satz steht oben.' },
        { t: 'Themen übersichtlicher', d: 'Die Themen sind nach Redebedarf und Zum Zeigen sortiert, eine Zeile pro Thema. Besprochenes klappt man bei Bedarf auf, neue Themen startest du über „＋ Neues Thema“.' },
      ],
    },
    {
      id: '2026-11-09-satz-des-tages', date: '9. November',
      items: [
        { t: 'Satz des Tages im Forum', d: 'Ganz oben im Forum steht jetzt eine Karte: Jeden Tag schreibst du einen japanischen Satz, höchstens 40 Zeichen, zu einem Anstoß für alle.' },
        { t: 'Jeder Tag anders', d: 'Mo und Do ein Wort, Di eine Frage, Mi ein Grammatikmuster, Fr ein Satz über deinen Tag.' },
        { t: 'Am Wochenende eine Geschichte', d: 'Samstag und Sonntag schreibt ihr zusammen eine Geschichte: Jede macht mit einem Satz am neuesten Satz weiter.' },
        { t: '🔥 in der 今日-Karte', d: 'Ab dem zweiten Tag in Folge steht 🔥 mit der Zahl der Tage neben dem To-do. Ein grauer Hinweis erinnert an den offenen Satz des Tages.' },
        { t: 'Joker und Urlaubsmodus', d: 'Einen Tag verpasst? Pro Woche hält ein Joker deine Serie. Im Urlaubsmodus bleibt sie ebenfalls erhalten.' },
      ],
    },
    {
      id: '2026-11-08-handy-ansicht-3', date: '8. November',
      items: [
        { t: 'Üben und Anwenden am Handy', d: 'Auf der Handy-Startseite führen zwei große Felder direkt zu allen Übungen und zu Tagebuch und Smalltalk.' },
      ],
    },
    {
      id: '2026-11-08-auto-abgleich', date: '8. November',
      items: [
        { t: 'Geräte gleichen sich selbst ab', d: 'Das andere Gerät holt sich deinen neuen Stand jetzt von selbst. Gefragt wird nur noch, wenn du auf beiden etwas geändert hast.' },
      ],
    },
    {
      id: '2026-11-08-handy-ansicht-2', date: '8. November',
      items: [
        { t: 'Prognose auch am Handy', d: 'Im blauen Kasten der Handy-Startseite zeigt das kleine Balken-Symbol oben rechts, wie viele Karten in den nächsten 7 Tagen fällig werden.' },
      ],
    },
    {
      id: '2026-11-08-handy-ansicht', date: '8. November',
      items: [
        { t: 'Eigene Ansicht fürs Handy', d: 'Am Handy zeigt die Startseite jetzt nur das Wichtigste: einen Ring mit deinen fälligen Karten, Forum, Konjugieren, Lückensätze und Lesen/Hören.' },
        { t: 'Leiste unten', d: 'Unten tippst du direkt zu Grammatik, Vokabeln, Kanji und Ausdrücken. Alles andere findest du wie gewohnt im Menü ☰.' },
        { t: 'Lieber wie am Tablet?', d: 'Ganz unten im Menü ☰ stellst du die Ansicht auf „Standard“. Das gilt nur für dieses Handy, das Tablet bleibt, wie es ist.' },
      ],
    },
    {
      id: '2026-11-08-handy-menu', date: '8. November',
      items: [
        { t: 'Menü am Handy geht wieder', d: 'Am Handy war das Menü (☰ oben links) grau und ließ sich nicht antippen. Jetzt kannst du darüber wieder jede Seite öffnen.' },
      ],
    },
    {
      id: '2026-11-07-pausieren', date: '7. November',
      items: [
        { t: 'Verpasste Tage überspringen', d: 'Einen Tag nicht geschafft? Im blauen Kasten der Startseite erscheint ein Rückspul-Symbol: ein Klick, und es geht weiter, als hättest du nichts verpasst.' },
        { t: 'Urlaubsmodus', d: 'Länger weg? Unter Einstellungen › Lernen den Urlaubsmodus starten – solange wird nichts neu fällig, und danach geht es genau da weiter, wo du aufgehört hast.' },
      ],
    },
    {
      id: '2026-11-07-startseite-bereiche', date: '7. November',
      items: [
        { t: 'Startseite: Bereiche verschieben', d: 'Unten auf der Startseite „Startseite anpassen“: Jeder Bereich hat oben ↑/↓ zum Verschieben und ✕ zum Ausblenden. „Zurücksetzen“ holt alles zurück.' },
      ],
    },
    {
      id: '2026-11-07-konjugieren-auswahl', date: '7. November',
      items: [
        { t: 'Konjugieren mit Auswahl', d: 'Unter Üben › Konjugieren kannst du jetzt aus vier Antworten wählen. Die falschen sind typische Fehler wie 飲みて oder 高いでした, du musst also wirklich die Regel kennen.' },
        { t: 'Oder selbst schreiben', d: '„Schreiben“ gibt dir das Antwortfeld mit Stift oder Tastatur, die App prüft deine Form.' },
        { t: 'Start bei irgendeiner Form', d: 'Die Karte startet bei der Grundform, bei der ます-Form oder bei einer zufälligen Form, z. B. 飲みました → て-Form.' },
      ],
    },
    {
      id: '2026-11-07-forum-satz', date: '7. November',
      items: [
        { t: 'Sätze aus dem Forum sammeln', d: 'Verlinkt jemand im Forum ein Wort, das du schon hast, mit einem neuen Satz? „＋ Satz zu meiner Vokabel“ speichert ihn als weiteren Beispielsatz.' },
      ],
    },
    {
      id: '2026-11-07-forum-ausdruck', date: '7. November',
      items: [
        { t: 'Ausdrücke aus dem Forum übernehmen', d: 'Hängt jemand im Forum einen Ausdruck an, den du nicht hast, steht darunter „＋ Als Ausdruck übernehmen“ – Satz, Deutsch und Gruppe sind schon ausgefüllt.' },
      ],
    },
    {
      id: '2026-11-07-sortieren', date: '7. November',
      items: [
        { t: 'Nach Niveau sortieren', d: 'Bei Vokabeln, Grammatik und Kanji sitzt am Ende der Filterzeile ein Pfeil-Knopf: Nach Lektion, Niveau N5 → N1 oder N1 → N5. Die Wahl merkt sich jedes Gerät.' },
      ],
    },
    {
      id: '2026-11-07-import-ausdruecke', date: '7. November',
      items: [
        { t: 'Wortliste: Sätze werden Ausdrücke', d: 'Sätze über der Tabelle einer Unterrichts-PDF (z. B. mit ☞ davor) schlägt „Vokabeln importieren“ jetzt als Ausdrücke vor – übersetzt und abgefragt wie Vokabeln.' },
        { t: 'Muster mit Lücken', d: 'Freie Stellen zum Einsetzen werden zu 〇〇, z. B. „〇〇で〇〇がいちばん …です。“ Mit dem Stift daneben kannst du den Satz vor dem Übernehmen ändern.' },
      ],
    },
    {
      id: '2026-11-07-einstufen-beide', date: '7. November',
      items: [
        { t: 'Einstufen „Beide“ korrigiert', d: 'Bei „Beide“ stand „Alles eingestuft“, obwohl Deutsch → Japanisch noch offen war. Jetzt kommt die Meldung erst, wenn wirklich beide Richtungen fertig sind.' },
      ],
    },
    {
      id: '2026-11-07-zum-artikel', date: '7. November',
      items: [
        { t: 'Zurück zum Artikel', d: 'Text bei NHK Easy markiert und übernommen? Oben erscheint „↩ Zurück zu NHK Easy“ und bringt dich an dieselbe Stelle im Artikel – am PC und auf dem Tablet.' },
        { t: 'Neue Erweiterung und Tablet-App', d: 'Dafür einmal neu holen: Einstellungen › „Aus dem Browser direkt in die App“ – Erweiterung neu entpacken bzw. die Android-App neu installieren.' },
      ],
    },
    {
      id: '2026-11-07-forum-offline', date: '7. November',
      items: [
        { t: 'Forum: Hinweis ohne Internet', d: 'Wer ohne Internet der Gruppe in der Gedankenwolke beitreten will, sieht jetzt „Verbinde …“ und kurz danach einen klaren Hinweis, statt dass nichts passiert.' },
      ],
    },
    {
      id: '2026-11-07-forum-bilder', date: '7. November',
      items: [
        { t: 'Forum: bis zu 4 Bilder', d: 'An einen Beitrag oder eine Antwort in der Gedankenwolke passen jetzt bis zu 4 Bilder – über „Bild“ (auch mehrere auf einmal) oder „Einfügen“.' },
      ],
    },
    {
      id: '2026-11-07-todos', date: '7. November',
      items: [
        { t: 'Heute-Liste nur noch mit festen To-dos', d: 'Startseite › 今日: „Wenn du magst“ ist weg. Über den Stift schaltest du Punkte an oder aus, legst beliebig viele eigene To-dos an und benennst sie um.' },
        { t: 'Lernstand-Karten umsortieren', d: 'Startseite: Mit ↑ und ↓ rechts neben Vokabel-, JLPT-, Genki- und Kanji-Lernstand schiebst du eine Karte nach oben oder unten – z. B. was du schon kannst nach unten.' },
      ],
    },
    {
      id: '2026-11-07-markieren', date: '7. November',
      items: [
        { t: 'Wort markieren, direkt speichern', d: 'Markier japanischen Text irgendwo in der App, z. B. ein Wort in einem Beispielsatz – darunter erscheinen „Vokabel speichern“ und „Sätze erkennen“.' },
        { t: 'Ganz ohne Browser-Erweiterung', d: 'Bei „Vokabel speichern“ ist der Satz schon als Beispiel drin. Kennst du das Wort schon, bringt dich „Öffnen“ zu deinem Eintrag.' },
      ],
    },
    {
      id: '2026-11-07-konjugieren-zahl', date: '7. November',
      items: [
        { t: 'Konjugieren: kleine Runden', d: 'Der Knopf „Runde starten“ unter Üben › Konjugieren zeigt jetzt nur, wie viele Wörter in dieser Runde drankommen (z. B. 20), statt alle deine Verben und Adjektive.' },
      ],
    },
    {
      id: '2026-11-07-ausdruck-markieren', date: '7. November',
      items: [
        { t: 'Ausdruck aus der Handschrift', d: 'Auf dem Schreibblatt einen Satzteil mit „Erkennen“ einkreisen und im Fenster „als neuer Ausdruck“ wählen: Er wird angelegt und auf dem Blatt verknüpft.' },
        { t: 'Auch bei den Buchaufgaben', d: 'In den Genki-Aufgaben gibt es jetzt „Neuer Ausdruck“; in der getippten Antwort Text markieren → darunter ＋ Vokabel, Grammatik oder Ausdruck.' },
      ],
    },
    {
      id: '2026-11-07-luecken', date: '7. November',
      items: [
        { t: 'Lückensätze schneller ausfüllen', d: 'Üben › Lückensätze: Partikel antippen reicht – sie kommt in die markierte Lücke, dann geht es von oben nach unten weiter.' },
        { t: 'Keine versteckten Hinweise mehr', d: 'Oben stehen jetzt immer alle Partikeln je einmal, egal wie oft eine gebraucht wird. Vorlesen geht erst, wenn der Satz geprüft ist.' },
      ],
    },
    {
      id: '2026-11-07-blaettern', date: '7. November',
      items: [
        { t: 'Durch Einträge blättern', d: 'Auf jeder Vokabel-, Kanji-, Grammatik- und Ausdruck-Seite führen oben rechts Pfeile zum vorherigen und nächsten Eintrag; „4 / 52“ zeigt, wo du in der Lektion bist.' },
        { t: 'Rechte Spalte auch bei Kanji', d: 'Die Spalte „Verwandtes“ lässt sich jetzt auch bei Kanji einklappen – so wie schon bei Vokabeln und Grammatik.' },
      ],
    },
    {
      id: '2026-11-06-feinschliff', date: '6. November',
      items: [
        { t: 'Aufgeräumt und besser lesbar', d: 'Viele kleine Korrekturen: Im Dunkelmodus sind die farbigen Knöpfe jetzt gut lesbar, und beim Seitenwechsel springt die Breite nicht mehr.' },
        { t: 'Gleiche Namen überall', d: 'Seiten heißen jetzt überall gleich, z. B. „Sätze zuordnen“ und „Übersetzen“. Bei Ausdrücken siehst du alle Gruppen auf einmal, ohne seitlich zu wischen.' },
        { t: 'Besser am Handy', d: 'Vokabel- und Grammatikseiten passen jetzt aufs Handy, das Suchfeld oben ist nutzbar, und hinter dem geöffneten Menü wird die Seite abgedunkelt.' },
      ],
    },
    {
      id: '2026-11-06-muster', date: '6. November',
      items: [
        { t: 'Wendungen aus dem Tagebuch merken', d: 'Im Tagebuch und beim Smalltalk Text markieren → „＋ Ausdruck“: Lesung und Übersetzung füllen sich selbst, der Ausdruck kommt in die Lernschlange.' },
        { t: 'Ausdruck mit austauschbarem Wort', d: 'Im Ausdruck-Formular unter „Wort austauschbar machen“: Die Karte fragt dann jedes Mal mit einem anderen Wort ab, z. B. 犬の世話 statt ペットの世話.' },
        { t: 'Verben mit Partikel abfragen', d: 'Einstellungen › Lernen: Wer mag, bekommt bei Deutsch → Japanisch „jemanden treffen → 人に会う“ statt nur „会う“. Standardmäßig aus.' },
      ],
    },
    {
      id: '2026-11-06-blatt-uebersicht', date: '6. November',
      items: [
        { t: 'Blätter auf einen Blick', d: 'Bei einer Unterrichtsstunde und im Tagebuch siehst du deine Blätter jetzt als große Vorschau. Antippen öffnet das Blatt groß zum Schreiben.' },
        { t: 'Hochkant oder quer', d: 'Jedes Blatt kann hochkant oder quer sein: beim Anlegen wählen, an der Vorschau umschalten oder im Blatt über „Papier“.' },
      ],
    },
    {
      id: '2026-11-06-lueckensaetze', date: '6. November',
      items: [
        { t: 'Lückensätze: Partikeln üben', d: 'Üben › Weitere Übungen › Lückensätze: In Sätzen aus deinen Vokabeln fehlen を, に, で und Co. Du ziehst sie aus der Wortbank in die Lücken.' },
        { t: 'は oder が?', d: 'Wo in den Lückensätzen beide gehen, wird die andere Partikel gelb statt rot – mit einer kurzen Erklärung, was sich an der Bedeutung ändert.' },
      ],
    },
    {
      id: '2026-11-06-mini-player', date: '6. November',
      items: [
        { t: 'Hören im kleinen Fenster', d: 'Im Hör-Fenster oben das Symbol neben ✕: Video oder Folge läuft klein weiter, lässt sich verschieben – und du kannst nebenbei z. B. eine Vokabel anlegen.' },
      ],
    },
    {
      id: '2026-11-06-ausdruecke-aktiv', date: '6. November',
      items: [
        { t: 'Ausdrücke in beide Richtungen', d: 'Ausdrücke werden jetzt wie Vokabeln auch von Deutsch nach Japanisch abgefragt – gut für Sätze, die du auswendig lernen willst.' },
        { t: 'Beispielsatz als Ausdruck übernehmen', d: 'Auf der Seite einer Vokabel steht bei jedem Beispielsatz „＋ Ausdruck“: Der Satz kommt fertig ausgefüllt ins Formular, du wählst nur noch die Gruppe.' },
      ],
    },
    {
      id: '2026-11-05-prognose', date: '5. November',
      items: [
        { t: 'Prognose für die nächsten 7 Tage', d: 'Auf der Startseite neben „morgen kommen … dazu“: Das kleine Balken-Symbol zeigt pro Tag, wie viele Karten neu fällig werden, und wie viele es insgesamt wären.' },
      ],
    },
    {
      id: '2026-11-02-neu-sticker', date: '2. November',
      items: [
        { t: 'Neu-Sticker', d: 'Beim Schreibblatt unter „Sticker“ › Süß: „Neu“ als Stern, Schild, 新-Stempel, Keimling, Sprechblase und „新しい文法“.' },
        { t: 'Pfeile', d: 'Bunte Pfeile nach rechts und links, auch als Kritzel unter „Normal“.' },
        { t: 'Weniger doppelt', d: 'Der Reiter „Kawaii“ ist weg, weil er „Süß“ zu ähnlich war. Sticker, die schon auf deinen Blättern kleben, bleiben.' },
      ],
    },
    {
      id: '2026-11-02-gleiche-bedeutung', date: '2. November',
      items: [
        { t: 'Gleiche Bedeutung', d: 'Neuer Reiter bei den Vokabeln: Wörter, die dasselbe heißen, z. B. 着る und はく für „anziehen“ oder 学生 und 生徒.' },
        { t: 'Bedeutet ähnlich', d: 'An jeder Vokabel stehen jetzt auch die Wörter mit gleicher Bedeutung.' },
      ],
    },
    {
      id: '2026-11-02-kann-ich-2-monate', date: '2. November',
      items: [
        { t: 'Eine Wiederholung mehr', d: 'Karten gelten jetzt erst ab 2 Monaten Abstand als „Kann ich“ statt ab 3 Wochen. Mit „Gut“ also nach 1, 3, 8, 19 und 47 Tagen. Was schon auf „Kann ich“ steht, bleibt dort.' },
        { t: 'Klare Anzeige beim Bewerten', d: 'Ist eine Karte mit dem Knopf fertig, steht darunter „kann ich ✓“ statt einer Zeitangabe.' },
      ],
    },
    {
      id: '2026-11-01-runde-kann-ich', date: '1. November',
      items: [
        { t: 'Kann ich gilt sofort', d: 'Stellst du beim Wiederholen über „Eintrag öffnen“ ein Wort auf „Kann ich“, kommt seine Karte danach nicht mehr dran. Die Runde geht mit der nächsten weiter.' },
      ],
    },
    {
      id: '2026-10-29-quellen-loeschen', date: '29. Oktober',
      items: [
        { t: 'Quellen bleiben gelöscht', d: 'Quellen, die du in den Einstellungen mit dem Mülleimer entfernst (z. B. KaniWani), kommen beim nächsten Start nicht mehr zurück.' },
      ],
    },
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
