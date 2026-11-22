/* Nihongo Techō – „Durchsagen verstehen“ (Seite Hören › Durchsagen): echte YouTube-Ausschnitte mit Verständnisfragen.
   Nur Inhalte, die belegt sind: manuelle oder eingeblendete Untertitel, Standbilder oder automatische Untertitel
   (dann steht es in „note“). Was sich nicht sicher prüfen ließ, ist weggelassen. Recherche 2026-11-22.
   Felder: id (nie ändern – daran hängt der Lernstand), group, title, yt (YouTube-ID), from/to (Sekunden),
   src (wer/was), qs [{ q, a }], ja (Wortlaut, soweit belegt), note (Hinweis zur Quelle) */
'use strict';
(function (App) {
  App.DURCHSAGEN_GROUPS = [
    ['bahn', 'Bahn und U-Bahn'],
    ['shinkansen', 'Shinkansen'],
    ['flughafen', 'Flughafen'],
    ['hotel', 'Hotel und Ryokan'],
    ['schalter', 'Am Schalter'],
  ];
  App.DURCHSAGEN = [
    {
      id: 'bahnsteig-sasazuka', group: 'bahn', title: 'Bahnsteig: Der Zug fährt ein', jt: 'まもなく1番線に…',
      yt: 'Whu0cPfypiw', from: 33, to: 53, src: 'Echte Aufnahme am Bahnsteig in Tokyo (あかね的日本語教室)',
      qs: [
        { q: 'Auf welchem Gleis kommt der Zug?', a: 'Gleis 1 (1番線)' },
        { q: 'Was für ein Zug ist es, und wohin fährt er?', a: 'Ein Eilzug (急行) nach Sasazuka (笹塚行き)' },
        { q: 'Wie viele Wagen hat der Zug?', a: '10 Wagen (10両編成)' },
        { q: 'Wo hält er als Nächstes?', a: 'In Ichigaya (市ヶ谷)' },
      ],
      ja: 'まもなく1番線に、急行笹塚行きが、10両編成で到着します。ドアから離れてお待ちください。次は市ヶ谷にとまります。',
    },
    {
      id: 'yamanote-tokyo', group: 'bahn', title: 'Yamanote-Linie: Nächster Halt', jt: '次は東京',
      yt: 'ouHvxPD9-2M', from: 33, to: 51, src: 'Automatische Ansage im Zug der Yamanote-Linie (スマピカチャンネル)',
      qs: [
        { q: 'Welcher Bahnhof kommt als Nächstes?', a: 'Tokyo (東京)' },
        { q: 'Auf welcher Seite steigt man aus?', a: 'Links (お出口は左側です)' },
        { q: 'Nenne zwei Linien, in die man dort umsteigen kann.', a: 'Zum Beispiel Shinkansen, Tōkaidō-Linie, Yokosuka-Linie, Sōbu-Schnelllinie, Keiyō-Linie oder die U-Bahn Marunouchi-Linie' },
      ],
      ja: '次は東京、東京。お出口は左側です。新幹線、東海道線、横須賀線、総武快速線、京葉線、地下鉄丸ノ内線はお乗り換えです。',
    },
    {
      id: 'verspaetung-hachioji', group: 'bahn', title: 'Bahnsteig: Der Zug hat Verspätung', jt: '約5分遅れ',
      yt: 'MQr9CaWCUBs', from: 0, to: 21, src: 'Automatische Ansage am Bahnsteig, JR Yokohama-Linie (kurzes Video)',
      qs: [
        { q: 'Wie viele Minuten Verspätung hat der Zug?', a: 'Etwa 5 Minuten (約5分)' },
        { q: 'Wohin fährt der Zug, und hält er überall?', a: 'Nach Hachiōji (八王子行き), er hält an jedem Bahnhof (各駅停車)' },
        { q: 'Um wie viel Uhr sollte er laut Fahrplan abfahren?', a: 'Um 10:08 Uhr (10時8分発)' },
      ],
      ja: '今度の電車は、10時8分発、各駅停車、八王子行きです。この電車は、ただいま約5分遅れて……誠に申し訳ございません。',
      note: 'Wortlaut nach den automatischen Untertiteln von YouTube; die 5 Minuten stehen auch im Videotitel.',
    },
    {
      id: 'nasuno-abfahrt', group: 'shinkansen', title: 'Shinkansen: Ansage nach der Abfahrt', jt: 'この電車は…',
      yt: '7o2Qcwarkz4', from: 17, to: 50, src: 'Automatische Ansage im Tōhoku-Shinkansen „Nasuno“ (TSC)',
      qs: [
        { q: 'Wohin fährt der Zug?', a: 'Nach Tokyo (東京行き)' },
        { q: 'Wo hält er als Nächstes?', a: 'In Utsunomiya (宇都宮)' },
        { q: 'Wo darf man rauchen?', a: 'Nirgends – der ganze Zug ist Nichtraucher, auch Vorraum und Toiletten (全て禁煙)' },
        { q: 'Wo soll man telefonieren?', a: 'Im Vorraum zwischen den Wagen (デッキ)' },
      ],
      ja: '本日もJR東日本をご利用くださいまして、ありがとうございます。この電車は、東北新幹線なすの号東京行きです。次は、宇都宮に止まります。車内はデッキ・トイレを含めまして、全て禁煙です。お客様にお願い致します。携帯電話をご使用の際は、周りのお客様のご迷惑とならないよう、デッキをご利用ください。',
    },
    {
      id: 'nasuno-utsunomiya', group: 'shinkansen', title: 'Shinkansen: Gleich kommt der Bahnhof', jt: 'まもなく宇都宮です',
      yt: '7o2Qcwarkz4', from: 147, to: 163, src: 'Automatische Ansage im Tōhoku-Shinkansen „Nasuno“ (TSC)',
      qs: [
        { q: 'Welcher Bahnhof kommt gleich?', a: 'Utsunomiya (宇都宮)' },
        { q: 'In welche Linien kann man dort umsteigen?', a: 'Nikkō-Linie und Karasuyama-Linie (日光線・烏山線)' },
        { q: 'Wo hält der Zug danach?', a: 'In Oyama (小山)' },
      ],
      ja: 'まもなく宇都宮です。日光線・烏山線はお乗り換えです。宇都宮の次は小山に停まります。',
    },
    {
      id: 'flughafen-boarding', group: 'flughafen', title: 'Flughafen: Aufruf zum Einsteigen', jt: '搭乗のご案内',
      yt: 'xBoZfQBBrb8', from: 0, to: 82, src: 'Echte Durchsage am Flughafen Hiroshima, ANA-Flug nach Haneda (Super Eno Channel)',
      qs: [
        { q: 'Welche Uhrzeit wird zweimal genannt?', a: '13:35 Uhr (13時35分)' },
        { q: 'Wer darf zuerst einsteigen?', a: 'Wer Hilfe braucht, Familien mit kleinen Kindern und Schwangere' },
        { q: 'Welche Sitzreihen werden zum Schluss aufgerufen?', a: 'Reihe 21 bis 43 (21列から43列)' },
      ],
      ja: '……13時35分、13時35分の予定でございます。初めに、ご搭乗の際にお手伝いが必要なお客様、小さなお子様をお連れのお客様、妊娠中のお客様を事前にご案内いたします。……座席番号21列から43列、21列から43列をご利用のお客様をご案内いたします。',
      note: 'Wortlaut nach den automatischen Untertiteln von YouTube (Lücken mit …); Ziel Haneda laut Videobeschreibung.',
    },
    {
      id: 'hotel-checkin-1', group: 'hotel', title: 'Hotel: Gepäck abgeben und einchecken', jt: 'チェックインします',
      yt: 'Pcsa90SVWjY', from: 72, to: 141, src: 'Gespielter Dialog einer Japanischlehrerin, die selbst im Hotel gearbeitet hat (naru)',
      qs: [
        { q: 'Was möchte der Gast zuerst?', a: 'Das Gepäck abgeben (荷物を預けたい)' },
        { q: 'Wie viele Nächte bleibt sie – mit oder ohne Frühstück?', a: '3 Nächte ohne Frühstück (素泊まり・3泊)' },
        { q: 'Was macht das Hotel mit dem Pass?', a: 'Eine Kopie' },
        { q: 'Welches Zimmer bekommt sie, in welchem Stock?', a: 'Zimmer 1023 im 10. Stock' },
      ],
      note: 'Der japanische Wortlaut steht im Video als Untertitel – tippe „Bild zeigen“.',
    },
    {
      id: 'hotel-checkin-2', group: 'hotel', title: 'Hotel: Check-in mit Frühstück und Bezahlen', jt: '朝食付きプラン',
      yt: 'Pcsa90SVWjY', from: 443, to: 592, src: 'Gespielter Dialog einer Japanischlehrerin, die selbst im Hotel gearbeitet hat (naru) – etwas schneller',
      qs: [
        { q: 'Wie viele Nächte bleibt der Gast – mit oder ohne Frühstück?', a: '4 Nächte mit Frühstück (朝食付き・4泊)' },
        { q: 'Wie viel kostet es insgesamt?', a: '24.000 Yen' },
        { q: 'Wie bezahlt der Gast?', a: 'Mit Karte (und er möchte eine Quittung)' },
        { q: 'Welches Zimmer, welcher Stock?', a: 'Zimmer 1024 im 10. Stock' },
        { q: 'Wo gibt es Frühstück?', a: 'Im 2. Stock (朝食会場は2階)' },
        { q: 'Wo ist der Aufzug?', a: 'Links (左側)' },
      ],
      ja: '今日から朝食付きプラン、4泊でお間違いございませんか。……お会計合計で24,000円でございます。――カードでお願いします。……10階の1024号室です。……朝食会場は2階にございます。……おタバコはご遠慮ください。……エレベーターは左側にございます。',
    },
    {
      id: 'ryokan-checkin', group: 'hotel', title: 'Ryokan: Einchecken', jt: 'チェックインお願いします',
      yt: 'hOYC_2zL3lU', from: 0, to: 125, src: 'Lehrfilm der Daitō-Bunka-Universität, gedreht im Ryokan (ohne Untertitel)',
      qs: [
        { q: 'Was für ein Zimmer ist gebucht?', a: 'Ein japanisches Zimmer mit Tatami (和室)' },
        { q: 'Was soll der Gast aufschreiben?', a: 'Namen, Adresse und Beruf' },
        { q: 'Bis wann muss man auschecken?', a: 'Bis 10 Uhr morgens (午前10時)' },
        { q: 'Wann bezahlt man?', a: 'Beim Auschecken' },
      ],
      ja: '……和室で承っておりますが、間違いないでしょうか。――はい、そうです。――それではこちらにお名前、ご住所、ご職業をお願いいたします。……チェックアウトは午前10時までとなっております。宿泊料金はチェックアウト時にお支払いください。',
      note: 'Wortlaut nach den automatischen Untertiteln von YouTube.',
    },
    {
      id: 'shinkansen-fahrkarte', group: 'schalter', title: 'Fahrkarte für den Shinkansen kaufen', jt: '京都まで行きたいんですが',
      yt: 'yzZdNpWUHcw', from: 17, to: 125, src: 'Gesprochener Dialog am Fahrkartenschalter, als Zeichnung (つよぽん日本語)',
      qs: [
        { q: 'Wohin will der Kunde, und wann soll er ankommen?', a: 'Nach Kyoto, gegen 10 Uhr' },
        { q: 'Um wie viel Uhr kommt der frühere Zug (Nozomi 207) in Kyoto an?', a: 'Um 9:51 Uhr (9時51分)' },
        { q: 'Wie viele Personen fahren?', a: 'Zwei Erwachsene (大人二人)' },
        { q: 'Hin und zurück? Wann geht es zurück?', a: 'Hin und zurück (往復), zurück am 15.' },
        { q: 'Welche Plätze nimmt er für die Rückfahrt?', a: 'Ohne Reservierung (自由席)' },
      ],
      ja: '来週の火曜日に京都まで行きたいんですが、10時頃着くのってありますか。――7時48分発の博多行きのぞみ13号でしたら、京都に10時ちょうどに着きますね。――それより早く着くのはありますか。――それでしたら、7時39分発ののぞみ207号ですね。京都に9時51分に着きますが、これになさいますか。――お一人様ですか。――いえ、大人二人です。……往復でお願いします。――帰りはいつにされますか。――15日でお願いします。――往復とも指定席でよろしいでしょうか。――帰りは自由席でお願いします。',
    },
  ];
})(window.App);
