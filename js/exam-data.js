/* Nihongo Techō – Prüfungen: handgeschriebene Grammatik- und Hörfragen
 * Selbst verfasst für Nihongo Techō, CC-BY-SA 4.0. Keine Aufgaben aus Lehrbüchern übernommen.
 * Genki I: Fragen je Lektion (Grammatik und Wörter bis zu dieser Lektion). JLPT: Fragen je Stufe.
 * Die richtige Antwort steht immer vorn (a = 0) – gemischt wird beim Zusammenstellen der Prüfung.
 * Jedes Kanji trägt seine Lesung (学生[がくせい]); geprüft von tools/check-exam-data.mjs.
 * Bei Lückensätzen darf nur EINE Antwort passen (z. B. nie に und へ zusammen anbieten).
 */
window.EXAM_BANK = window.EXAM_BANK || [];
(function (B) {
  const ref = (stage, l, r) => (!r ? undefined : r.startsWith('g-') || r.startsWith('v-') ? r : stage === 'genki1' ? `g-g${l}-${r}` : `g-${stage}-${r}`);
  const stageOf = (l) => (typeof l === 'number' ? ['genki1', l] : [l, undefined]);
  // Grammatik: Lückensatz（　）oder Satzbau ★; de = deutscher Hinweis, wo sonst mehrere Antworten passen würden
  const G = (l, n, r, prompt, opts, de, note) => {
    const [stage, lesson] = stageOf(l);
    B.push({ id: `${stage}${lesson ? '-L' + lesson : ''}-g${n}`, part: 'grammar', stage, lesson, kind: prompt.includes('★') ? 'order' : 'gfill', prompt, opts, a: 0, ref: ref(stage, lesson, r), de, note });
  };
  // Hören: Gespräch (Zeilen „A:…“ / „B:…“), Frage auf Deutsch; ohne B-Zeile antwortet man selbst als B
  const H = (l, n, r, lines, prompt, opts, note) => {
    const [stage, lesson] = stageOf(l);
    B.push({ id: `${stage}${lesson ? '-L' + lesson : ''}-h${n}`, part: 'listening', stage, lesson, kind: 'dialog', dialog: lines.map((x) => [x[0], x.slice(2)]), prompt, opts, a: 0, ref: ref(stage, lesson, r), note });
  };
  const ANSWER = 'Was antwortet B?';

  // ======================= Genki I · Lektion 1 =======================
  G(1, 1, 'x-wa-y-desu', '私[わたし]（　）学生[がくせい]です。', ['は', 'を', 'に', 'へ']);
  G(1, 2, 'ka', '「メアリーさんは 学生[がくせい]です（　）。」「はい、そうです。」', ['か', 'を', 'の', 'に']);
  G(1, 3, 'no', 'メアリーさんは アリゾナ大学[だいがく]（　）学生[がくせい]です。', ['の', 'を', 'か', 'へ']);
  G(1, 4, 'x-wa-y-desu', '私[わたし]の 専攻[せんこう]（　）経済[けいざい]です。', ['は', 'を', 'か', 'へ']);
  G(1, 5, 'numbers-time', '「すみません、今[いま]（　）ですか。」「三時[さんじ]です。」', ['何時[なんじ]', '何歳[なんさい]', '何年生[なんねんせい]', '何番[なんばん]']);
  G(1, 6, 'numbers-time', '「たけしさんは（　）ですか。」「十九歳[じゅうきゅうさい]です。」', ['何歳[なんさい]', '何時[なんじ]', '何番[なんばん]', '何年生[なんねんせい]']);
  G(1, 7, 'numbers-time', '「電話[でんわ]番号[ばんごう]は（　）ですか。」「五[ご]一[いち]四[よん]の 三[さん]九[きゅう]八[はち]七[なな]です。」', ['何番[なんばん]', '何時[なんじ]', '何歳[なんさい]', '何年生[なんねんせい]']);
  G(1, 8, 'no', '＿＿ ＿＿ ★ ＿＿ 学生[がくせい]です。', ['東京[とうきょう]大学[だいがく]', '私[わたし]', 'は', 'の'], 'Ich bin Student an der Universität Tokio.');
  H(1, 1, 'x-wa-y-desu', ['A:はじめまして。メアリーです。アリゾナ大学[だいがく]の 学生[がくせい]です。'], 'Was stimmt?', ['Mary ist Studentin an der Universität Arizona.', 'Mary ist Lehrerin.', 'Mary ist Japanerin.', 'Mary studiert in Tokio.']);
  H(1, 2, 'numbers-time', ['A:たけしさんは 何年生[なんねんせい]ですか。', 'B:四年生[よねんせい]です。'], 'Im wievielten Studienjahr ist Takeshi?', ['im vierten', 'im ersten', 'im zweiten', 'im dritten']);
  H(1, 3, 'numbers-time', ['A:今[いま] 何時[なんじ]ですか。', 'B:一時[いちじ]半[はん]です。'], 'Wie spät ist es?', ['halb zwei (1:30)', 'ein Uhr', 'halb acht (7:30)', 'halb fünf (4:30)']);
  H(1, 4, 'x-wa-y-desu', ['A:お名前[なまえ]は？'], ANSWER, ['メアリーです。', '十九歳[じゅうきゅうさい]です。', '学生[がくせい]です。', 'アメリカです。']);
  H(1, 5, 'x-wa-y-desu', ['A:専攻[せんこう]は 何[なん]ですか。'], ANSWER, ['経済[けいざい]です。', '二年生[にねんせい]です。', '日本人[にほんじん]です。', '三時[さんじ]です。']);
  H(1, 6, 'numbers-time', ['A:電話[でんわ]番号[ばんごう]は 何番[なんばん]ですか。', 'B:三[さん]一[いち]二[に]の 六[ろく]五[ご]四[よん]八[はち]です。'], 'Wie lautet die Telefonnummer?', ['312-6548', '312-6584', '213-6548', '321-6548']);
  H(1, 7, 'ka', ['A:たけしさんは 日本人[にほんじん]ですか。'], ANSWER, ['はい、そうです。', 'いいえ、三時[さんじ]です。', 'はい、十九歳[じゅうきゅうさい]です。', 'いいえ、経済[けいざい]です。']);

  // ======================= Lektion 2 =======================
  G(2, 1, 'kore', '「（　）は 何[なん]ですか。」「それは 辞書[じしょ]です。」', ['これ', 'この', 'ここ', 'どれ'], null, 'Wer nach etwas bei sich selbst fragt, sagt これ; die Antwort sagt dann それ.');
  G(2, 2, 'kono', '「その 本[ほん]は いくらですか。」「（　）本[ほん]ですか。三千円[さんぜんえん]です。」', ['この', 'これ', 'ここ', 'どの'], null, 'Vor einem Nomen steht この, nicht これ.');
  G(2, 3, 'koko', '「トイレは（　）ですか。」「あそこです。」', ['どこ', 'どれ', 'どの', 'だれ']);
  G(2, 4, 'dareno', '「これは（　）かさですか。」「メアリーさんのです。」', ['だれの', 'だれ', 'どれ', 'どこ']);
  G(2, 5, 'mo', 'たけしさんは 日本人[にほんじん]です。ゆいさん（　）日本人[にほんじん]です。', ['も', 'を', 'に', 'か']);
  G(2, 6, 'janai', '「メアリーさんは 日本人[にほんじん]ですか。」「いいえ、日本人[にほんじん]（　）。アメリカ人[じん]です。」', ['じゃないです', 'です', 'ですか', 'ですね']);
  G(2, 7, 'ne-yo', '「あの 人[ひと]は 山下[やました]先生[せんせい]ですか。」「いいえ、あの 人[ひと]は 学生[がくせい]です（　）。」', ['よ', 'か', 'を', 'も']);
  G(2, 8, 'kono', '＿＿ ＿＿ ★ ＿＿ ですか。', ['は', 'この', 'かばん', 'いくら'], 'Wie viel kostet diese Tasche?');
  H(2, 1, 'kono', ['A:すみません。この 時計[とけい]は いくらですか。', 'B:三千円[さんぜんえん]です。'], 'Wie viel kostet die Uhr?', ['3000 Yen', '300 Yen', '3500 Yen', '13000 Yen']);
  H(2, 2, 'dareno', ['A:これは だれの かさですか。', 'B:たけしさんのです。'], 'Wem gehört der Schirm?', ['Takeshi', 'Mary', 'dem Lehrer', 'B selbst']);
  H(2, 3, 'koko', ['A:すみません、トイレは どこですか。'], ANSWER, ['あそこです。', 'それです。', '三百円[さんびゃくえん]です。', 'はい、そうです。']);
  H(2, 4, 'mo', ['A:メアリーさんは 留学生[りゅうがくせい]ですか。', 'B:はい、そうです。たけしさんも 学生[がくせい]ですよ。'], 'Was stimmt?', ['Mary ist Austauschstudentin, Takeshi ist auch Student.', 'Mary ist Lehrerin.', 'Takeshi ist kein Student.', 'Beide sind Lehrer.']);
  H(2, 5, 'janai', ['A:あれは 銀行[ぎんこう]ですか。', 'B:いいえ、銀行[ぎんこう]じゃないです。図書館[としょかん]です。'], 'Was ist das Gebäude?', ['eine Bibliothek', 'eine Bank', 'eine Post', 'ein Krankenhaus']);
  H(2, 6, 'kono', ['A:その 本[ほん]は 日本語[にほんご]の 本[ほん]ですか。'], ANSWER, ['いいえ、英語[えいご]の 本[ほん]です。', 'いいえ、あそこです。', 'はい、千円[せんえん]です。', 'いいえ、だれのです。']);

  // ======================= Lektion 3 =======================
  G(3, 1, 'wo', '毎日[まいにち] コーヒー（　）飲[の]みます。', ['を', 'で', 'に', 'へ']);
  G(3, 2, 'de', '図書館[としょかん]（　）本[ほん]を 読[よ]みます。', ['で', 'を', 'へ', 'か']);
  G(3, 3, 'ni-he', '明日[あした] 学校[がっこう]（　）行[い]きます。', ['へ', 'を', 'で', 'が'], null, 'Richtung: に oder へ – hier steht nur へ zur Wahl.');
  G(3, 4, 'time', '土曜日[どようび]（　）京都[きょうと]に 行[い]きます。', ['に', 'を', 'が', 'へ']);
  G(3, 5, 'masenka', '「いっしょに 映画[えいが]を（　）。」「いいですね。」', ['見[み]ませんか', '見[み]ません', '見[み]ます', '見[み]る']);
  G(3, 6, 'frequency', '私[わたし]は お酒[さけ]を（　）飲[の]みません。', ['あまり', 'よく', '時々[ときどき]', '毎日[まいにち]'], 'Ich trinke nicht viel Alkohol.', 'あまり steht mit der verneinten Form.');
  G(3, 7, 'masu', '「週末[しゅうまつ] 何[なに]を しますか。」「テニスを（　）。」', ['します', 'きます', 'かえります', 'いきます']);
  G(3, 8, 'masenka', '＿＿ ＿＿ ★ ＿＿ か。', ['見[み]', 'いっしょに', '映画[えいが]を', 'ません'], 'Wollen wir zusammen einen Film sehen?');
  H(3, 1, 'time', ['A:毎朝[まいあさ] 何時[なんじ]に 起[お]きますか。', 'B:七時[しちじ]ごろ 起[お]きます。'], 'Wann steht B auf?', ['gegen sieben', 'gegen acht', 'um sechs', 'gegen elf']);
  H(3, 2, 'de', ['A:週末[しゅうまつ] 何[なに]を しますか。', 'B:図書館[としょかん]で 勉強[べんきょう]します。'], 'Was macht B am Wochenende?', ['in der Bibliothek lernen', 'Tennis spielen', 'fernsehen', 'nach Kyoto fahren']);
  H(3, 3, 'masenka', ['A:土曜日[どようび]に 映画[えいが]を 見[み]ませんか。'], ANSWER, ['いいですね。', 'はい、映画[えいが]です。', 'いいえ、土曜日[どようび]です。', '七時[しちじ]です。']);
  H(3, 4, 'frequency', ['A:コーヒーを 飲[の]みますか。', 'B:いいえ、コーヒーは ぜんぜん 飲[の]みません。お茶[ちゃ]を 飲[の]みます。'], 'Was trinkt B?', ['Tee', 'Kaffee', 'Wasser', 'Bier']);
  H(3, 5, 'frequency', ['A:よく テレビを 見[み]ますか。', 'B:時々[ときどき] 見[み]ます。'], 'Wie oft sieht B fern?', ['manchmal', 'oft', 'gar nicht', 'jeden Tag']);
  H(3, 6, 'ni-he', ['A:今晩[こんばん] どこに 行[い]きますか。', 'B:うちに 帰[かえ]ります。'], 'Wohin geht B heute Abend?', ['nach Hause', 'zur Uni', 'ins Café', 'in die Bibliothek']);

  // ======================= Lektion 4 =======================
  G(4, 1, 'arimasu-imasu', 'あそこに 猫[ねこ]が（　）。', ['います', 'あります', 'です', 'します'], null, 'Lebewesen: います, Dinge: あります.');
  G(4, 2, 'position', '図書館[としょかん]は 銀行[ぎんこう]の（　）です。', ['となり', '上[うえ]', '中[なか]', '前[まえ]'], 'Die Bibliothek ist neben der Bank.');
  G(4, 3, 'deshita', '昨日[きのう]は 月曜日[げつようび]（　）。', ['でした', 'です', 'ました', 'じゃないです']);
  G(4, 4, 'mashita', '先週[せんしゅう] 京都[きょうと]で お寺[てら]を（　）。', ['見[み]ました', '見[み]ます', '見[み]ませんか', '見[み]です']);
  G(4, 5, 'mo', '月曜日[げつようび]に 学校[がっこう]に 行[い]きます。火曜日[かようび]（　）行[い]きます。', ['にも', 'もに', 'へも', 'をも']);
  G(4, 6, 'jikan', '「毎日[まいにち] 日本語[にほんご]を（　）勉強[べんきょう]しますか。」「二時間[にじかん]ぐらいです。」', ['何時間[なんじかん]', '何時[なんじ]', '何歳[なんさい]', '何年生[なんねんせい]']);
  G(4, 7, 'to', '私[わたし]は 友[とも]だち（　）昼[ひる]ご飯[はん]を 食[た]べました。', ['と', 'を', 'が', 'へ']);
  G(4, 8, 'takusan', '宿題[しゅくだい]が（　）あります。', ['たくさん', 'ぜんぜん', 'あまり', '何[なに]も']);
  G(4, 9, 'position', '私[わたし]の かさは ＿＿ ＿＿ ★ ＿＿ あります。', ['下[した]', 'つくえ', 'の', 'に'], 'Mein Schirm ist unter dem Tisch.');
  H(4, 1, 'mashita', ['A:昨日[きのう] 何[なに]を しましたか。', 'B:友[とも]だちと テニスを しました。'], 'Was hat B gestern gemacht?', ['mit Freunden Tennis gespielt', 'allein ferngesehen', 'im Café gelernt', 'einen Film gesehen']);
  H(4, 2, 'position', ['A:すみません、郵便局[ゆうびんきょく]は どこですか。', 'B:銀行[ぎんこう]の となりです。'], 'Wo ist die Post?', ['neben der Bank', 'vor der Bank', 'hinter der Uni', 'im Krankenhaus']);
  H(4, 3, 'mashita', ['A:週末[しゅうまつ]は 何[なに]を しましたか。'], ANSWER, ['京都[きょうと]に 行[い]きました。', '京都[きょうと]に 行[い]きます。', 'はい、そうでした。', '日曜日[にちようび]です。']);
  H(4, 4, 'jikan', ['A:昨日[きのう]は 何時間[なんじかん] 勉強[べんきょう]しましたか。', 'B:三時間[さんじかん]ぐらい しました。'], 'Wie lange hat B gelernt?', ['etwa drei Stunden', 'bis drei Uhr', 'etwa eine Stunde', 'gar nicht']);
  H(4, 5, 'arimasu-imasu', ['A:机[つくえ]の 上[うえ]に 何[なに]が ありますか。', 'B:辞書[じしょ]と ノートが あります。'], 'Was liegt auf dem Tisch?', ['ein Wörterbuch und ein Heft', 'eine Uhr und ein Schirm', 'ein Buch und ein Stift', 'nichts']);
  H(4, 6, 'mashita', ['A:昨日[きのう]、ロバートさんに 会[あ]いましたか。'], ANSWER, ['いいえ、会[あ]いませんでした。', 'いいえ、会[あ]いません。', 'はい、ロバートさんです。', 'はい、昨日[きのう]です。']);

  // ======================= Lektion 5 =======================
  G(5, 1, 'adj-conjugation', '昨日[きのう]の テストは（　）です。', ['やさしかった', 'やさしい', 'やさしくない', 'やさしいでした'], 'Der Test gestern war leicht.');
  G(5, 2, 'adj-conjugation', 'この 部屋[へや]は（　）じゃないです。', ['きれい', 'きれいな', 'きれく', 'きれいく'], null, 'きれい ist ein な-Adjektiv, obwohl es auf い endet.');
  G(5, 3, 'suki-kirai', '私[わたし]は 魚[さかな]（　）好[す]きです。', ['が', 'を', 'に', 'で']);
  G(5, 4, 'mashou', '「いっしょに 写真[しゃしん]を 撮[と]り（　）。」「ええ、撮[と]りましょう。」', ['ましょう', 'ました', 'ません', 'でした']);
  G(5, 5, 'counters', 'りんごを（　）ください。', ['三[みっ]つ', '三人[さんにん]', '三時[さんじ]', '三番[さんばん]'], 'Drei Äpfel, bitte.');
  G(5, 6, 'adj-conjugation', '「その 映画[えいが]は おもしろかったですか。」「いいえ、あまり（　）。」', ['おもしろくなかったです', 'おもしろくないでした', 'おもしろいじゃなかったです', 'おもしろかったです']);
  G(5, 7, 'adjectives', '京都[きょうと]は（　）町[まち]です。', ['静[しず]かな', '静[しず]か', '静[しず]かい', '静[しず]かの'], 'Kyoto ist eine ruhige Stadt.');
  G(5, 8, 'adj-conjugation', '天気[てんき]が（　）です。', ['よかった', 'いかった', 'よくた', 'いいでした'], 'Das Wetter war gut.', 'いい wird in den Formen zu よ-: よかった, よくない.');
  G(5, 9, 'suki-kirai', '＿＿ ＿＿ ★ ＿＿ ですか。', ['が', 'どんな', '食[た]べ物[もの]', '好[す]き'], 'Welches Essen magst du?');
  H(5, 1, 'adj-conjugation', ['A:旅行[りょこう]は どうでしたか。', 'B:とても 楽[たの]しかったです。でも、ホテルは あまり きれいじゃなかったです。'], 'Was stimmt?', ['Die Reise war schön, das Hotel nicht so sauber.', 'Die Reise war langweilig, das Hotel schön.', 'Reise und Hotel waren toll.', 'Die Reise war zu teuer.']);
  H(5, 2, 'suki-kirai', ['A:どんな 音楽[おんがく]が 好[す]きですか。', 'B:クラシックが 好[す]きです。ロックは きらいです。'], 'Welche Musik mag B?', ['Klassik', 'Rock', 'Jazz', 'J-Pop']);
  H(5, 3, 'mashou', ['A:明日[あした] いっしょに 海[うみ]に 行[い]きませんか。', 'B:いいですね。行[い]きましょう。'], 'Was machen die beiden morgen?', ['zusammen ans Meer fahren', 'ins Kino gehen', 'in die Berge fahren', 'einkaufen gehen']);
  H(5, 4, 'counters', ['A:すみません、コーヒーを 二[ふた]つ ください。'], 'Was bestellt A?', ['zwei Kaffee', 'einen Kaffee', 'drei Kaffee', 'zwei Tee']);
  H(5, 5, 'adjectives', ['A:日本[にほん]の 夏[なつ]は 暑[あつ]いですか。'], ANSWER, ['ええ、とても 暑[あつ]いです。', 'いいえ、暑[あつ]いじゃないです。', 'はい、夏[なつ]です。', 'ええ、元気[げんき]です。']);
  H(5, 6, 'adj-conjugation', ['A:この 本[ほん]は 高[たか]かったですか。', 'B:いいえ、安[やす]かったです。五百円[ごひゃくえん]でした。'], 'Was stimmt über das Buch?', ['500 Yen, also billig', '5000 Yen, also teuer', '500 Yen, aber teuer', '1500 Yen']);

  // ======================= Lektion 6 =======================
  G(6, 1, 'tekudasai', 'すみません、ちょっと 待[ま]って（　）。', ['ください', 'あります', 'もいいです', 'はいけません']);
  G(6, 2, 'temoii', '「ここで 写真[しゃしん]を 撮[と]っても（　）。」「はい、どうぞ。」', ['いいですか', 'ください', 'いけません', 'ましょう']);
  G(6, 3, 'tewaikenai', '教室[きょうしつ]で 食[た]べては（　）。', ['いけません', 'いいです', 'ください', 'ましょう']);
  G(6, 4, 'te-form', '窓[まど]を（　）ください。', ['開[あ]けて', '開[あ]けで', '開[あ]けって', '開[あ]けた'], 'Mach bitte das Fenster auf.');
  G(6, 5, 'te-form', 'この 本[ほん]を（　）ください。', ['読[よ]んで', '読[よ]みて', '読[よ]って', '読[よ]いて'], 'Lies bitte dieses Buch.', 'む → んで: 読む → 読んで.');
  G(6, 6, 'te-connect', '朝[あさ] 起[お]きて、シャワーを（　）、学校[がっこう]に 行[い]きます。', ['浴[あ]びて', '浴[あ]びます', '浴[あ]びた', '浴[あ]びる']);
  G(6, 7, 'kara', '明日[あした] テストが あります（　）、今晩[こんばん] 勉強[べんきょう]します。', ['から', 'と', 'を', 'に']);
  G(6, 8, 'mashouka', '「暑[あつ]いですね。窓[まど]を 開[あ]け（　）。」「ええ、お願[ねが]いします。」', ['ましょうか', 'ませんでした', 'ってください', 'ました']);
  G(6, 9, 'temoii', 'ここで ＿＿ ＿＿ ★ ＿＿ か。', ['吸[す]っても', 'たばこ', 'を', 'いいです'], 'Darf man hier rauchen?');
  H(6, 1, 'tewaikenai', ['A:すみません、ここで 写真[しゃしん]を 撮[と]っても いいですか。', 'B:いいえ、ここで 撮[と]っては いけません。'], 'Was stimmt?', ['Hier darf man nicht fotografieren.', 'Hier darf man fotografieren.', 'B macht ein Foto.', 'B bittet A um ein Foto.']);
  H(6, 2, 'mashouka', ['A:寒[さむ]いですね。窓[まど]を 閉[し]めましょうか。'], ANSWER, ['ええ、お願[ねが]いします。', 'はい、窓[まど]です。', 'いいえ、寒[さむ]かったです。', 'ええ、閉[し]めませんでした。']);
  H(6, 3, 'te-connect', ['A:明日[あした]は 何[なに]を しますか。', 'B:朝[あさ] 図書館[としょかん]で 勉強[べんきょう]して、午後[ごご] 友[とも]だちと 買[か]い物[もの]を します。'], 'Was macht B am Nachmittag?', ['mit Freunden einkaufen', 'in der Bibliothek lernen', 'fernsehen', 'schlafen']);
  H(6, 4, 'kara', ['A:どうして 昨日[きのう] 学校[がっこう]に 来[き]ませんでしたか。', 'B:アルバイトが ありましたから。'], 'Warum kam B gestern nicht?', ['B musste jobben.', 'B war krank.', 'B hat verschlafen.', 'B hatte keine Lust.']);
  H(6, 5, 'tekudasai', ['A:すみません、教科書[きょうかしょ]を 見[み]せて ください。'], 'Was möchte A?', ['das Lehrbuch sehen', 'ein Lehrbuch kaufen', 'das Lehrbuch zurückgeben', 'das Lehrbuch vorlesen']);
  H(6, 6, 'temoii', ['A:先生[せんせい]、トイレに 行[い]っても いいですか。'], ANSWER, ['ええ、いいですよ。', 'ええ、行[い]きましょう。', 'はい、トイレです。', 'いいえ、行[い]きました。']);

  // ======================= Lektion 7 =======================
  G(7, 1, 'teiru-progress', '「今[いま] 何[なに]を していますか。」「本[ほん]を（　）。」', ['読[よ]んでいます', '読[よ]みています', '読[よ]んでします', '読[よ]んであります']);
  G(7, 2, 'teiru-state', '姉[あね]は 東京[とうきょう]に（　）。', ['住[す]んでいます', '住[す]みます', '住[す]んでください', '住[す]みましょう'], 'Meine ältere Schwester wohnt in Tokio.');
  G(7, 3, 'body', 'メアリーさんは 髪[かみ]（　）長[なが]いです。', ['が', 'を', 'に', 'で']);
  G(7, 4, 'adj-te', 'この 部屋[へや]は 広[ひろ]（　）、明[あか]るいです。', ['くて', 'いで', 'いて', 'くで']);
  G(7, 5, 'adj-te', '山下[やました]先生[せんせい]は 親切[しんせつ]（　）、おもしろいです。', ['で', 'くて', 'な', 'に']);
  G(7, 6, 'stem-ni-iku', '図書館[としょかん]へ 本[ほん]を（　）行[い]きます。', ['借[か]りに', '借[か]りて', '借[か]りるに', '借[か]りを'], 'Ich gehe in die Bibliothek, um ein Buch auszuleihen.');
  G(7, 7, 'counter-people', '「兄弟[きょうだい]が いますか。」「はい、姉[あね]が（　）います。」', ['二人[ふたり]', '二[ふた]つ', '二枚[にまい]', '二時[にじ]']);
  G(7, 8, 'teiru-state', '父[ちち]は 会社[かいしゃ]で（　）。', ['働[はたら]いています', '働[はたら]いてです', '働[はたら]きています', '働[はたら]くています'], 'Mein Vater arbeitet in einer Firma.');
  G(7, 9, 'adj-te', 'ロバートさんは ＿＿ ＿＿ ★ ＿＿。', ['高[たか]くて', '背[せ]', 'が', 'かっこいいです'], 'Robert ist groß und sieht gut aus.');
  H(7, 1, 'teiru-progress', ['A:もしもし、メアリーさん、今[いま] 何[なに]を していますか。', 'B:今[いま] 友[とも]だちと 晩[ばん]ご飯[はん]を 食[た]べています。'], 'Was macht Mary gerade?', ['Sie isst mit Freunden zu Abend.', 'Sie lernt.', 'Sie sieht fern.', 'Sie kocht allein.']);
  H(7, 2, 'counter-people', ['A:ご家族[かぞく]は 何人[なんにん]ですか。', 'B:四人[よにん]です。父[ちち]と 母[はは]と 妹[いもうと]と 私[わたし]です。'], 'Was stimmt über die Familie von B?', ['vier Personen, mit jüngerer Schwester', 'drei Personen', 'vier Personen, mit älterem Bruder', 'fünf Personen']);
  H(7, 3, 'teiru-state', ['A:お姉[ねえ]さんは 結婚[けっこん]していますか。'], ANSWER, ['はい、結婚[けっこん]しています。', 'はい、結婚[けっこん]します。', 'いいえ、姉[あね]は 結婚[けっこん]です。', 'はい、結婚[けっこん]していません。']);
  H(7, 4, 'adj-te', ['A:田中[たなか]さんは どんな 人[ひと]ですか。', 'B:背[せ]が 高[たか]くて、とても 親切[しんせつ]な 人[ひと]です。'], 'Wie ist Herr/Frau Tanaka?', ['groß und sehr nett', 'klein und lustig', 'groß und streng', 'jung und ruhig']);
  H(7, 5, 'stem-ni-iku', ['A:週末[しゅうまつ] 何[なに]を しましたか。', 'B:京都[きょうと]へ 友[とも]だちに 会[あ]いに 行[い]きました。'], 'Warum ist B nach Kyoto gefahren?', ['um Freunde zu treffen', 'zum Einkaufen', 'zum Arbeiten', 'um Tempel anzusehen']);
  H(7, 6, 'teiru-state', ['A:お父[とう]さんの 仕事[しごと]は 何[なん]ですか。', 'B:父[ちち]は 高校[こうこう]で 英語[えいご]を 教[おし]えています。'], 'Was macht der Vater von B?', ['Er unterrichtet Englisch an einer Oberschule.', 'Er arbeitet in einer Firma.', 'Er ist Arzt.', 'Er studiert Englisch.']);

  // ======================= Lektion 8 =======================
  G(8, 1, 'to-omoimasu', '明日[あした] 雨[あめ]が（　）と 思[おも]います。', ['降[ふ]る', '降[ふ]ります', '降[ふ]って', '降[ふ]りに'], null, 'Vor と思います steht die Kurzform.');
  G(8, 2, 'to-itteimashita', 'たけしさんは 今日[きょう] 学校[がっこう]に（　）と 言[い]っていました。', ['こない', 'きない', 'くない', 'こらない'], 'Takeshi hat gesagt, dass er heute nicht in die Schule kommt.', '来る → 来ない（こない）.');
  G(8, 3, 'naidekudasai', 'ここで 写真[しゃしん]を 撮[と]らないで（　）。', ['ください', 'ません', 'あります', 'いけません'], 'Bitte hier keine Fotos machen.');
  G(8, 4, 'noga-suki', '私[わたし]は 料理[りょうり]を 作[つく]る（　）が 好[す]きです。', ['の', 'を', 'に', 'で']);
  G(8, 5, 'ga', '「だれ（　）この 写真[しゃしん]を 撮[と]りましたか。」「ゆいさんです。」', ['が', 'は', 'を', 'で'], null, 'Nach Fragewörtern wie だれ steht が, nicht は.');
  G(8, 6, 'nanika', '「何[なに]か 食[た]べましたか。」「いいえ、何[なに]も（　）。」', ['食[た]べませんでした', '食[た]べました', '食[た]べます', '食[た]べましたか']);
  G(8, 7, 'to-omoimasu', 'メアリーさんは 日本語[にほんご]が 上手[じょうず]（　）と 思[おも]います。', ['だ', 'です', 'な', 'の'], null, 'な-Adjektive und Nomen: 〜だと思います.');
  G(8, 8, 'informal', '「明日[あした]、ひま？」「うん、（　）。」', ['ひまだよ', 'ひまだだ', 'ひまいよ', 'ひまくない']);
  G(8, 9, 'naidekudasai', 'この 部屋[へや]で ＿＿ ＿＿ ★ ＿＿。', ['撮[と]らないで', '写真[しゃしん]', 'を', 'ください'], 'Bitte in diesem Raum keine Fotos machen.');
  H(8, 1, 'to-omoimasu', ['A:明日[あした]の 天気[てんき]は どうですか。', 'B:雨[あめ]が 降[ふ]ると 思[おも]います。'], 'Wie wird das Wetter morgen?', ['Es regnet wohl.', 'Es wird schön.', 'Es schneit.', 'B weiß es nicht.']);
  H(8, 2, 'informal', ['A:ねえ、週末[しゅうまつ] 何[なに] する？', 'B:うちで 映画[えいが]を 見[み]る。'], 'Was macht B am Wochenende?', ['zu Hause einen Film sehen', 'ins Kino gehen', 'arbeiten', 'Freunde treffen']);
  H(8, 3, 'to-itteimashita', ['A:たけしさんは パーティーに 来[き]ますか。', 'B:いいえ、来[こ]ないと 言[い]っていました。アルバイトが あるから。'], 'Warum kommt Takeshi nicht?', ['Er muss jobben.', 'Er ist krank.', 'Er hat eine Prüfung.', 'Er ist in Kyoto.']);
  H(8, 4, 'nanika', ['A:何[なに]か 飲[の]みませんか。'], ANSWER, ['じゃあ、お茶[ちゃ]を お願[ねが]いします。', 'いいえ、何[なに]も 飲[の]みます。', 'はい、何[なに]かです。', 'お茶[ちゃ]が 飲[の]みました。']);
  H(8, 5, 'noga-suki', ['A:趣味[しゅみ]は 何[なん]ですか。', 'B:写真[しゃしん]を 撮[と]るのが 好[す]きです。'], 'Was ist das Hobby von B?', ['fotografieren', 'kochen', 'lesen', 'Sport']);
  H(8, 6, 'naidekudasai', ['A:すみません、ここで 電話[でんわ]を しないで ください。'], 'Was soll man hier nicht tun?', ['telefonieren', 'essen', 'fotografieren', 'laut reden']);

  // ======================= Lektion 9 =======================
  G(9, 1, 'short-past', '昨日[きのう] 友[とも]だちと 映画[えいが]を（　）。', ['見[み]た', '見[み]った', '見[み]て', '見[み]んだ'], 'Gestern habe ich mit Freunden einen Film gesehen. (locker)');
  G(9, 2, 'mou-mada', '「もう 昼[ひる]ご飯[はん]を 食[た]べましたか。」「いいえ、まだ（　）。」', ['食[た]べていません', '食[た]べました', '食[た]べましたか', '食[た]べてください'], null, 'まだ 〜ていません = noch nicht.');
  G(9, 3, 'noun-modify', 'あそこで 本[ほん]を（　）人[ひと]は だれですか。', ['読[よ]んでいる', '読[よ]んでいます', '読[よ]むの', '読[よ]んで'], 'Wer ist die Person, die dort ein Buch liest?', 'Vor einem Nomen steht die Kurzform.');
  G(9, 4, 'quote-past', 'ロバートさんは 週末[しゅうまつ] 京都[きょうと]に（　）と 言[い]っていました。', ['行[い]った', '行[い]きました', '行[い]って', '行[い]いた'], 'Robert hat gesagt, dass er am Wochenende in Kyoto war.');
  G(9, 5, 'short-past', '昨日[きのう]は 寒[さむ]（　）。', ['かった', 'いだった', 'くた', 'いった']);
  G(9, 6, 'quote-past', '先週[せんしゅう]の テストは（　）と 思[おも]います。', ['難[むずか]しくなかった', '難[むずか]しくなかったです', '難[むずか]しいじゃなかった', '難[むずか]しかったない'], 'Ich glaube, der Test letzte Woche war nicht schwer.');
  G(9, 7, 'informal-past', '「昨日[きのう]の パーティー、どう（　）？」「楽[たの]しかったよ。」', ['だった', 'だ', 'かった', 'した']);
  G(9, 8, 'kara', '雨[あめ]が 降[ふ]った（　）、出[で]かけませんでした。', ['から', 'まで', 'を', 'と']);
  G(9, 9, 'noun-modify', 'これは ＿＿ ＿＿ ★ ＿＿ です。', ['撮[と]った', '昨日[きのう]', '私[わたし]が', '写真[しゃしん]'], 'Das ist das Foto, das ich gestern gemacht habe.');
  H(9, 1, 'informal-past', ['A:週末[しゅうまつ] 何[なに] した？', 'B:友[とも]だちと カラオケに 行[い]った。楽[たの]しかったよ。'], 'Was hat B am Wochenende gemacht?', ['mit Freunden Karaoke', 'einen Film gesehen', 'zu Hause gelernt', 'nach Kyoto gefahren']);
  H(9, 2, 'mou-mada', ['A:もう 宿題[しゅくだい]を しましたか。', 'B:いいえ、まだ していません。今晩[こんばん] します。'], 'Was stimmt?', ['B macht die Hausaufgaben heute Abend.', 'B hat sie schon gemacht.', 'B macht sie morgen.', 'B hat keine Hausaufgaben.']);
  H(9, 3, 'noun-modify', ['A:あの 赤[あか]い セーターを 着[き]ている 人[ひと]は だれですか。', 'B:ゆいさんです。'], 'Wer ist Yui?', ['die Person im roten Pullover', 'die Person mit Brille', 'die Person mit Hut', 'die Person am Telefon']);
  H(9, 4, 'kara', ['A:昨日[きのう] どうして 来[こ]なかったの？'], ANSWER, ['病気[びょうき]だったから。', '病気[びょうき]だから 行[い]った。', 'うん、病気[びょうき]だったね。', '昨日[きのう]だった。']);
  H(9, 5, 'quote-past', ['A:山下[やました]先生[せんせい]は 何[なん]と 言[い]っていましたか。', 'B:明日[あした] テストが あると 言[い]っていました。'], 'Was hat der Lehrer gesagt?', ['Morgen ist ein Test.', 'Heute fällt der Unterricht aus.', 'Die Hausaufgaben sind morgen fällig.', 'Der Test war leicht.']);
  H(9, 6, 'informal-past', ['A:京都[きょうと]、どうだった？', 'B:お寺[てら]が たくさん あって、きれいだった。でも、ちょっと 寒[さむ]かった。'], 'Was erzählt B über Kyoto?', ['viele Tempel, schön, etwas kalt', 'langweilig, aber warm', 'zu teuer', 'es hat die ganze Zeit geregnet']);

  // ======================= Lektion 10 =======================
  G(10, 1, 'yori', '東京[とうきょう]は 大阪[おおさか]（　）大[おお]きいです。', ['より', 'ほう', 'から', 'まで']);
  G(10, 2, 'yori', '「肉[にく]と 魚[さかな]と どちらが 好[す]きですか。」「魚[さかな]の（　）が 好[す]きです。」', ['ほう', 'より', 'いちばん', 'どちら']);
  G(10, 3, 'ichiban', '季節[きせつ]の 中[なか]で 春[はる]が（　）好[す]きです。', ['いちばん', 'ほう', 'より', 'どちら']);
  G(10, 4, 'adj-no', 'この かばんは 高[たか]いです。もっと 安[やす]い（　）は ありますか。', ['の', 'が', 'を', 'な']);
  G(10, 5, 'tsumori', '冬休[ふゆやす]みに 日本[にほん]へ 行[い]く（　）です。', ['つもり', 'ほう', 'より', 'まで']);
  G(10, 6, 'naru', '日本語[にほんご]が 上手[じょうず]（　）なりました。', ['に', 'く', 'で', 'を'], null, 'な-Adjektiv + になる.');
  G(10, 7, 'naru', '寒[さむ]（　）なりました。', ['く', 'に', 'い', 'で'], null, 'い-Adjektiv: い → くなる.');
  G(10, 8, 'dokoka', '「週末[しゅうまつ]、どこかに 行[い]きましたか。」「いいえ、どこにも（　）。」', ['行[い]きませんでした', '行[い]きました', '行[い]きます', '行[い]きましたか']);
  G(10, 9, 'de-means', '毎日[まいにち] バス（　）学校[がっこう]に 来[き]ます。', ['で', 'を', 'に', 'が']);
  H(10, 1, 'yori', ['A:電車[でんしゃ]と バスと どちらが 速[はや]いですか。', 'B:電車[でんしゃ]の ほうが 速[はや]いです。'], 'Was ist schneller?', ['der Zug', 'der Bus', 'beide gleich', 'das Fahrrad']);
  H(10, 2, 'tsumori', ['A:冬休[ふゆやす]みに 何[なに]を する つもりですか。', 'B:北海道[ほっかいどう]に 行[い]って、スキーを する つもりです。'], 'Was plant B?', ['in Hokkaido Ski fahren', 'zu Hause bleiben', 'nach Okinawa fahren', 'jobben']);
  H(10, 3, 'ichiban', ['A:クラスの 中[なか]で だれが いちばん 背[せ]が 高[たか]いですか。', 'B:ロバートさんが いちばん 高[たか]いです。'], 'Wer ist in der Klasse am größten?', ['Robert', 'Takeshi', 'Mary', 'der Lehrer']);
  H(10, 4, 'adj-no', ['A:この 赤[あか]い シャツは ちょっと 高[たか]いですね。', 'B:じゃあ、この 青[あお]いのは どうですか。'], 'Was schlägt B vor?', ['das blaue Hemd', 'das rote Hemd', 'eine Jacke', 'später wiederzukommen']);
  H(10, 5, 'naru', ['A:日本語[にほんご]が 上手[じょうず]に なりましたね。'], ANSWER, ['いいえ、まだまだです。', 'はい、なりましょう。', 'いいえ、上手[じょうず]に なりません。', 'はい、日本語[にほんご]です。']);
  H(10, 6, 'de-means', ['A:毎日[まいにち] どうやって 学校[がっこう]に 来[き]ますか。', 'B:自転車[じてんしゃ]で 来[き]ます。二十分[にじゅっぷん]ぐらい かかります。'], 'Wie kommt B zur Schule?', ['mit dem Fahrrad, etwa 20 Minuten', 'mit dem Bus, etwa 20 Minuten', 'mit dem Fahrrad, etwa 10 Minuten', 'zu Fuß']);

  // ======================= Lektion 11 =======================
  G(11, 1, 'tai', '日本[にほん]で 富士山[ふじさん]に 登[のぼ]り（　）です。', ['たい', 'たり', 'たこと', 'ました']);
  G(11, 2, 'tari', '週末[しゅうまつ]は 掃除[そうじ]を したり、洗濯[せんたく]を（　）します。', ['したり', 'して', 'した', 'しない']);
  G(11, 3, 'koto-ga-aru', '私[わたし]は すしを 食[た]べた（　）が あります。', ['こと', 'もの', 'の', 'ほう']);
  G(11, 4, 'koto-ga-aru', '「日本[にほん]に 行[い]った ことが ありますか。」「いいえ、一度[いちど]も（　）。」', ['ありません', 'あります', 'ありました', 'いません']);
  G(11, 5, 'ya', 'かばんの 中[なか]に 本[ほん]（　）ノートなどが あります。', ['や', 'を', 'で', 'も']);
  G(11, 6, 'tai', '今日[きょう]は 疲[つか]れたから、何[なに]も（　）。', ['したくないです', 'したいです', 'しないたいです', 'したくありたい'], 'Ich bin heute müde, deshalb will ich nichts machen.');
  G(11, 7, 'tari', '「休[やす]みの 日[ひ]に 何[なに]を しますか。」「本[ほん]を 読[よ]んだり、音楽[おんがく]を（　）します。」', ['聞[き]いたり', '聞[き]きたり', '聞[き]いて', '聞[き]いた']);
  G(11, 8, 'koto-ga-aru', '私[わたし]は 歌舞伎[かぶき]を（　）ことが ありません。', ['見[み]た', '見[み]て', '見[み]ます', '見[み]たい']);
  G(11, 9, 'koto-ga-aru', '＿＿ ＿＿ ★ ＿＿ ことが ありますか。', ['を', '日本[にほん]の', 'お酒[さけ]', '飲[の]んだ'], 'Hast du schon einmal japanischen Sake getrunken?');
  H(11, 1, 'tari', ['A:夏休[なつやす]みに 何[なに]を したいですか。', 'B:海[うみ]で 泳[およ]いだり、友[とも]だちと キャンプに 行[い]ったり したいです。'], 'Was möchte B in den Sommerferien machen?', ['schwimmen und campen', 'auf einen Berg steigen', 'jobben', 'lernen']);
  H(11, 2, 'koto-ga-aru', ['A:富士山[ふじさん]に 登[のぼ]った ことが ありますか。', 'B:いいえ、まだ ありません。でも、来年[らいねん] 登[のぼ]りたいです。'], 'Was stimmt?', ['B war noch nie oben, möchte aber nächstes Jahr hinauf.', 'B war schon zweimal oben.', 'B möchte nie hinauf.', 'B steigt dieses Jahr hinauf.']);
  H(11, 3, 'tai', ['A:将来[しょうらい] 何[なに]に なりたいですか。', 'B:先生[せんせい]に なりたいです。'], 'Was möchte B werden?', ['Lehrer/in', 'Arzt/Ärztin', 'Anwalt/Anwältin', 'Sänger/in']);
  H(11, 4, 'toka', ['A:どんな 映画[えいが]が 好[す]きですか。'], ANSWER, ['アクション映画[えいが]とか、コメディーとか。', 'はい、映画[えいが]を 見[み]たいです。', 'いいえ、好[す]きでした。', '映画[えいが]は 二時[にじ]からです。']);
  H(11, 5, 'tai', ['A:疲[つか]れましたね。', 'B:ええ、ちょっと 休[やす]みたいです。何[なに]か 飲[の]みたいですね。'], 'Was möchte B?', ['sich ausruhen und etwas trinken', 'weitergehen', 'nach Hause fahren', 'essen gehen']);
  H(11, 6, 'tari', ['A:日本[にほん]で 何[なに]を しましたか。', 'B:お寺[てら]を 見[み]たり、温泉[おんせん]に 入[はい]ったり しました。'], 'Was hat B in Japan gemacht?', ['Tempel angeschaut und im Onsen gebadet', 'eingekauft', 'den Fuji bestiegen', 'Freunde besucht']);

  // ======================= Lektion 12 =======================
  G(12, 1, 'ndesu', '「どうしたんですか。」「頭[あたま]が 痛[いた]い（　）。」', ['んです', 'ですん', 'のだです', 'んだです']);
  G(12, 2, 'sugiru', 'ゆうべ 飲[の]み（　）、頭[あたま]が 痛[いた]いです。', ['すぎて', 'すぎった', 'すぎるて', 'すぎないで']);
  G(12, 3, 'hou-ga-ii', '熱[ねつ]が ありますね。薬[くすり]を 飲[の]んだ（　）。', ['ほうが いいですよ', 'ほうが いいでした', 'より いいです', 'ので いいです']);
  G(12, 4, 'node', '病気[びょうき]（　）、学校[がっこう]を 休[やす]みます。', ['なので', 'ので', 'だので', 'なから'], null, 'Nomen + なので.');
  G(12, 5, 'nakereba', '明日[あした] テストが あるので、勉強[べんきょう]し（　）いけません。', ['なければ', 'なくて', 'ないで', 'ないでは']);
  G(12, 6, 'deshou', '明日[あした]は 雨[あめ]が 降[ふ]る（　）。', ['でしょう', 'ましょう', 'ます', 'つもりです'], 'Morgen wird es wohl regnen.');
  G(12, 7, 'sugiru', 'この 服[ふく]は 大[おお]き（　）。', ['すぎます', 'いすぎます', 'くすぎます', 'すぎるです'], 'Diese Kleidung ist zu groß.', 'い-Adjektiv: い weg + すぎる.');
  G(12, 8, 'ndesu', '「どうして 昨日[きのう] 来[こ]なかったんですか。」「アルバイトが（　）。」', ['あったんです', 'ありましたんです', 'あったでした', 'あるかったです']);
  G(12, 9, 'hou-ga-ii', '＿＿ ＿＿ ★ ＿＿ いいですよ。', ['ほう', '早[はや]く', '寝[ね]た', 'が'], 'Du solltest besser früh schlafen gehen.');
  H(12, 1, 'ndesu', ['A:元気[げんき]が ないですね。どうしたんですか。', 'B:昨日[きのう]から のどが 痛[いた]いんです。'], 'Was hat B?', ['seit gestern Halsschmerzen', 'Kopfschmerzen', 'Bauchschmerzen', 'B ist nur müde.']);
  H(12, 2, 'hou-ga-ii', ['A:熱[ねつ]が ありますね。今日[きょう]は 早[はや]く 寝[ね]た ほうが いいですよ。'], 'Was rät A?', ['heute früh schlafen gehen', 'zum Arzt gehen', 'Medizin nehmen', 'zur Arbeit gehen']);
  H(12, 3, 'deshou', ['A:明日[あした]の 天気[てんき]は どうでしょうか。', 'B:たぶん 晴[は]れるでしょう。'], 'Wie wird das Wetter morgen?', ['wahrscheinlich sonnig', 'Regen', 'Schnee', 'bewölkt']);
  H(12, 4, 'nakereba', ['A:すみません、今日[きょう]は 早[はや]く 帰[かえ]らなければ いけないんです。'], 'Was sagt A?', ['A muss heute früh nach Hause.', 'A kann heute länger bleiben.', 'A möchte früh kommen.', 'A ist krank.']);
  H(12, 5, 'sugiru', ['A:その ケーキ、食[た]べないんですか。'], ANSWER, ['ええ、甘[あま]すぎるんです。', 'ええ、甘[あま]いすぎます。', 'はい、ケーキです。', 'ええ、甘[あま]かったでしょう。']);
  H(12, 6, 'ndesu', ['A:どうして 遅[おく]れたんですか。', 'B:すみません、電車[でんしゃ]が 来[こ]なかったんです。'], 'Warum kam B zu spät?', ['Der Zug kam nicht.', 'B hat verschlafen.', 'Der Bus war voll.', 'B war krank.']);

  // Genki I gesamt: nimmt alle Fragen der Lektionen 1–12 (siehe exam-logic.js bankFor)

  // ======================= JLPT N5 =======================
  G('n5', 1, 'wo', '毎朝[まいあさ] 新聞[しんぶん]（　）読[よ]みます。', ['を', 'が', 'に', 'で']);
  G('n5', 2, 'de-place', '公園[こうえん]（　）子[こ]どもが 遊[あそ]んでいます。', ['で', 'を', 'へ', 'が']);
  G('n5', 3, 'made', '九時[くじ]から 五時[ごじ]（　）働[はたら]きます。', ['まで', 'から', 'ごろ', 'より']);
  G('n5', 4, 'dake', '財布[さいふ]に 百円[ひゃくえん]（　）あります。', ['だけ', 'しか', 'を', 'で'], 'Ich habe nur 100 Yen im Geldbeutel.', 'しか steht immer mit Verneinung: 百円しかありません.');
  G('n5', 5, 'kurai', '駅[えき]まで 歩[ある]いて 十分[じゅっぷん]（　）かかります。', ['ぐらい', 'ごろ', 'を', 'に'], null, 'ごろ für Zeitpunkte (三時ごろ), ぐらい für Mengen und Dauer.');
  G('n5', 6, 'mae-ni', '寝[ね]る（　）、歯[は]を みがきます。', ['前[まえ]に', '後[あと]で', 'ながら', 'たり']);
  G('n5', 7, 'te-kara', '宿題[しゅくだい]を（　）から、テレビを 見[み]ます。', ['して', 'した', 'する', 'し']);
  G('n5', 8, 'ga', 'どこ（　）痛[いた]いですか。', ['が', 'は', 'を', 'で']);
  G('n5', 9, 'kedo', 'この 店[みせ]は 安[やす]い（　）、あまり おいしくないです。', ['けど', 'と', 'を', 'に']);
  G('n5', 10, 'yori', '「バスと 電車[でんしゃ]と（　）が 便利[べんり]ですか。」「電車[でんしゃ]の ほうが 便利[べんり]です。」', ['どちら', 'どれ', 'どこ', 'だれ'], null, 'Bei zwei Dingen fragt man どちら, bei drei und mehr どれ.');
  G('n5', 11, 'tai', '冷[つめ]たい 水[みず]が 飲[の]み（　）です。', ['たい', 'たく', 'たり', 'ます']);
  G('n5', 12, 'naide-kudasai', '授業中[じゅぎょうちゅう]は 携帯[けいたい]を 使[つか]わないで（　）。', ['ください', 'います', 'あります', 'しません']);
  G('n5', 13, 'mada-te-imasen', '「もう 宿題[しゅくだい]を 出[だ]しましたか。」「いいえ、まだ 出[だ]して（　）。」', ['いません', 'いました', 'ください', 'みます']);
  G('n5', 14, 'hou-ga-ii', '雨[あめ]が 降[ふ]っていますから、かさを 持[も]って 行[い]った（　）いいですよ。', ['ほうが', 'より', 'のが', 'ことが']);
  G('n5', 15, 'adjective-forms', '昨日[きのう]は あまり 寒[さむ]く（　）。', ['なかったです', 'かったです', 'ないでした', 'なくてです']);
  G('n5', 16, 'nanika', '冷蔵庫[れいぞうこ]の 中[なか]に（　）ありません。', ['何[なに]も', '何[なに]か', '何[なに]が', '何[なん]で']);
  G('n5', 17, 'n-desu', '「どうして 食[た]べないんですか。」「おなかが いっぱいな（　）。」', ['んです', 'です', 'から', 'くて']);
  G('n5', 18, 'noun-modifying', 'これは 母[はは]が（　）ケーキです。', ['作[つく]った', '作[つく]りました', '作[つく]って', '作[つく]るの']);
  G('n5', 19, 'te-iru', '＿＿ ＿＿ ★ ＿＿ 人[ひと]は だれですか。', ['読[よ]んで', 'あそこで', '新聞[しんぶん]を', 'いる'], 'Wer ist die Person, die dort Zeitung liest?');
  G('n5', 20, 'noga-suki', '私[わたし]は ＿＿ ＿＿ ★ ＿＿ が 好[す]きです。', ['聞[き]く', '音楽[おんがく]', 'を', 'の'], 'Ich höre gern Musik.');
  H('n5', 1, 'te-kudasai', ['A:すみません、駅[えき]は どこですか。', 'B:この 道[みち]を まっすぐ 行[い]って、二[ふた]つ目[め]の 角[かど]を 右[みぎ]に 曲[ま]がって ください。'], 'Wie kommt man zum Bahnhof?', ['geradeaus, an der zweiten Ecke rechts', 'an der ersten Ecke rechts', 'an der zweiten Ecke links', 'zurück und dann links']);
  H('n5', 2, 'wo-kudasai', ['A:いらっしゃいませ。', 'B:りんごを 五[いつ]つと みかんを 三[みっ]つ ください。'], 'Was kauft B?', ['5 Äpfel und 3 Mandarinen', '3 Äpfel und 5 Mandarinen', '5 Äpfel und 5 Mandarinen', 'nur 3 Äpfel']);
  H('n5', 3, 'kara-from', ['A:明日[あした]の 会議[かいぎ]は 何時[なんじ]からですか。', 'B:十時[じゅうじ]からです。でも、九時[くじ]半[はん]に 来[き]て ください。'], 'Wann soll A kommen?', ['um halb zehn', 'um zehn', 'um neun', 'um halb elf']);
  H('n5', 4, null, ['A:お元気[げんき]ですか。'], ANSWER, ['はい、おかげさまで。', 'はい、いただきます。', 'いいえ、どういたしまして。', 'はい、ごちそうさまでした。']);
  H('n5', 5, null, ['A:ありがとうございました。'], ANSWER, ['いいえ、どういたしまして。', 'はい、おかげさまで。', 'いってきます。', 'いただきます。']);
  H('n5', 6, 'tai', ['A:昨日[きのう]は 何[なに]を 買[か]いましたか。', 'B:靴[くつ]を 買[か]いました。かばんも 買[か]いたかったですが、高[たか]かったです。'], 'Was hat B gekauft?', ['nur Schuhe', 'nur eine Tasche', 'Schuhe und eine Tasche', 'nichts']);
  H('n5', 7, null, ['A:田中[たなか]さんの 誕生日[たんじょうび]は いつですか。', 'B:七月[しちがつ]八日[ようか]です。'], 'Wann hat Tanaka Geburtstag?', ['am 8. Juli', 'am 7. August', 'am 4. Juli', 'am 8. Januar']);
  H('n5', 8, 'deshita', ['A:毎日[まいにち] 何時[なんじ]に 寝[ね]ますか。', 'B:たいてい 十二時[じゅうにじ]ごろ 寝[ね]ます。でも、昨日[きのう]は 二時[にじ]に 寝[ね]ました。'], 'Wann ist B gestern schlafen gegangen?', ['um zwei Uhr', 'gegen zwölf Uhr', 'um zehn Uhr', 'gar nicht']);
  H('n5', 9, 'to-quote', ['A:この 漢字[かんじ]は どう 読[よ]みますか。'], ANSWER, ['「やま」と 読[よ]みます。', '「やま」と 書[か]きます。', 'はい、読[よ]みます。', '漢字[かんじ]が 好[す]きです。']);
  H('n5', 10, 'te-mo-ii', ['A:窓[まど]を 開[あ]けても いいですか。', 'B:すみません、ちょっと 寒[さむ]いんです。'], 'Was meint B?', ['Lieber nicht öffnen, B friert.', 'Ja, A soll öffnen.', 'B öffnet selbst.', 'B macht die Tür zu.']);
  H('n5', 11, 'ga-aru', ['A:すみません、この シャツの Mサイズは ありますか。', 'B:すみません、Mは ありません。Sと Lは あります。'], 'Welche Größe gibt es nicht?', ['M', 'S', 'L', 'Alle sind da.']);
  H('n5', 12, 'te-kudasai', ['A:どうぞ、入[はい]って ください。'], ANSWER, ['では、失礼[しつれい]します。', 'いってきます。', 'ただいま。', 'おやすみなさい。']);
  H('n5', 13, 'masen-ka', ['A:週末[しゅうまつ]、いっしょに 買[か]い物[もの]に 行[い]きませんか。', 'B:すみません、土曜日[どようび]は アルバイトが あります。日曜日[にちようび]は どうですか。'], 'Was schlägt B vor?', ['den Sonntag', 'den Samstag', 'nächste Woche', 'gar nicht zu gehen']);
  H('n5', 14, 'made', ['A:先生[せんせい]、宿題[しゅくだい]は いつまでですか。', 'B:金曜日[きんようび]までに 出[だ]して ください。'], 'Bis wann sind die Hausaufgaben fällig?', ['bis Freitag', 'bis Donnerstag', 'bis Montag', 'bis heute']);
  H('n5', 15, 'mashou', ['A:駅[えき]の 前[まえ]に 新[あたら]しい レストランが できましたよ。', 'B:そうですか。じゃあ、今晩[こんばん] いっしょに 行[い]きましょう。'], 'Was machen die beiden heute Abend?', ['ins neue Restaurant gehen', 'zum Bahnhof fahren', 'zu Hause kochen', 'ins Kino gehen']);

  // ======================= JLPT N4 =======================
  G('n4', 1, 'potential', '私[わたし]は 漢字[かんじ]が 少[すこ]し（　）。', ['読[よ]めます', '読[よ]まれます', '読[よ]ませます', '読[よ]もう']);
  G('n4', 2, 'passive', '電車[でんしゃ]の 中[なか]で 足[あし]を（　）。', ['踏[ふ]まれました', '踏[ふ]めました', '踏[ふ]ませました', '踏[ふ]みられました'], 'In der Bahn hat mir jemand auf den Fuß getreten.');
  G('n4', 3, 'causative', '母[はは]は 弟[おとうと]に 野菜[やさい]を（　）。', ['食[た]べさせました', '食[た]べられました', '食[た]べさせられました', '食[た]べましょう'], 'Die Mutter ließ meinen kleinen Bruder Gemüse essen.');
  G('n4', 4, 'volitional', '「疲[つか]れたね。少[すこ]し（　）か。」「うん、そうしよう。」', ['休[やす]もう', '休[やす]め', '休[やす]もうと', '休[やす]みよう']);
  G('n4', 5, 'ba', '安[やす]けれ（　）、買[か]います。', ['ば', 'たら', 'と', 'ても']);
  G('n4', 6, 'tara', '駅[えき]に（　）、電話[でんわ]して ください。', ['着[つ]いたら', '着[つ]くと', '着[つ]いても', '着[つ]いたり'], null, 'Mit einer Bitte danach passt たら, nicht と.');
  G('n4', 7, 'te-mo', '雨[あめ]が（　）、試合[しあい]は あります。', ['降[ふ]っても', '降[ふ]ったら', '降[ふ]れば', '降[ふ]るので'], 'Auch wenn es regnet, findet das Spiel statt.');
  G('n4', 8, 'noni-although', '一生懸命[いっしょうけんめい] 勉強[べんきょう]した（　）、試験[しけん]に 落[お]ちました。', ['のに', 'ので', 'から', 'ために'], 'Obwohl ich fleißig gelernt habe, bin ich durchgefallen.');
  G('n4', 9, 'te-shimau', '大切[たいせつ]な 本[ほん]を なくして（　）。', ['しまいました', 'おきました', 'みました', 'ありました']);
  G('n4', 10, 'te-oku', '友[とも]だちが 来[く]る 前[まえ]に、部屋[へや]を 掃除[そうじ]して（　）。', ['おきます', 'みます', 'いきます', 'くれます'], 'Bevor die Freunde kommen, putze ich schon mal das Zimmer.');
  G('n4', 11, 'te-aru', '窓[まど]が 開[あ]けて（　）。', ['あります', 'います', 'おきます', 'しまいます'], null, 'Mit が + transitivem Verb: 〜てあります (jemand hat es so gelassen).');
  G('n4', 12, 'te-morau', '私[わたし]は 友[とも]だちに 引[ひ]っ越[こ]しを 手伝[てつだ]って（　）。', ['もらいました', 'くれました', 'あげました', 'しまいました'], 'Ein Freund hat mir beim Umzug geholfen.');
  G('n4', 13, 'sou-looks', 'この ケーキは（　）ですね。', ['おいしそう', 'おいしそうな', 'おいしくそう', 'おいしいそうな'], 'Dieser Kuchen sieht lecker aus.');
  G('n4', 14, 'sou-da-hearsay', '天気[てんき]予報[よほう]に よると、明日[あした]は 雪[ゆき]が（　）そうです。', ['降[ふ]る', '降[ふ]って', '降[ふ]った', '降[ふ]ろう']);
  G('n4', 15, 'kamoshirenai', '午後[ごご]から 雨[あめ]が 降[ふ]る（　）。', ['かもしれません', 'はずがありません', 'ようにします', 'ことにします'], 'Ab Nachmittag regnet es vielleicht.');
  G('n4', 16, 'you-ni-naru', '日本[にほん]に 来[き]て、納豆[なっとう]が 食[た]べられる（　）。', ['ようになりました', 'ことになりました', 'ようにしました', 'ことにしました'], 'Seit ich in Japan bin, kann ich Natto essen.');
  G('n4', 17, 'koto-ni-suru', '来年[らいねん] 日本[にほん]に 留学[りゅうがく]する（　）。', ['ことにしました', 'ようになりました', 'ところです', 'ばかりです'], 'Ich habe beschlossen, nächstes Jahr in Japan zu studieren.');
  G('n4', 18, 'ta-bakari', 'さっき 昼[ひる]ご飯[はん]を 食[た]べた（　）なので、おなかが いっぱいです。', ['ばかり', 'まま', 'ながら', 'あいだ']);
  G('n4', 19, 'nagara', '＿＿ ＿＿ ★ ＿＿ 勉強[べんきょう]します。', ['聞[き]き', '音楽[おんがく]', 'を', 'ながら'], 'Ich lerne, während ich Musik höre.');
  G('n4', 20, 'te-hoshii', '私[わたし]は ＿＿ ＿＿ ★ ＿＿。', ['元気[げんき]に', '母[はは]に', '早[はや]く', 'なって ほしいです'], 'Ich wünsche mir, dass meine Mutter bald wieder gesund wird.');
  H('n4', 1, 'g-n5-te-wa-ikenai', ['A:すみません、ここに 自転車[じてんしゃ]を 止[と]めても いいですか。', 'B:あ、ここは だめです。あちらに 駐輪場[ちゅうりんじょう]が ありますから、そこに 止[と]めて ください。'], 'Wo soll A das Fahrrad abstellen?', ['am Fahrradparkplatz dort drüben', 'genau hier', 'vor dem Laden', 'zu Hause']);
  H('n4', 2, 'g-n5-nakucha', ['A:日曜日[にちようび]、映画[えいが]を 見[み]に 行[い]かない？', 'B:行[い]きたいけど、月曜日[げつようび]に テストが あるから、勉強[べんきょう]しなきゃ。'], 'Was macht B am Sonntag?', ['lernen', 'ins Kino gehen', 'jobben', 'schlafen']);
  H('n4', 3, 'te-itadakemasen-ka', ['A:先生[せんせい]、この 言葉[ことば]の 意味[いみ]を 教[おし]えて いただけませんか。'], ANSWER, ['ええ、いいですよ。', 'いいえ、教[おし]えて いただきます。', 'はい、意味[いみ]です。', 'ええ、教[おし]えて もらいました。']);
  H('n4', 4, 'sou-da-hearsay', ['A:田中[たなか]さん、引[ひ]っ越[こ]したそうですね。', 'B:ええ、駅[えき]から 近[ちか]くて 便利[べんり]ですが、ちょっと 狭[せま]いんです。'], 'Wie ist die neue Wohnung?', ['nah am Bahnhof und praktisch, aber etwas eng', 'weit weg, aber groß', 'teuer und dunkel', 'ruhig und alt']);
  H('n4', 5, 'te-aru', ['A:会議[かいぎ]の 資料[しりょう]、もう コピーして ありますか。', 'B:いいえ、まだです。これから します。'], 'Was stimmt?', ['Die Unterlagen sind noch nicht kopiert, B macht es jetzt.', 'Die Unterlagen sind schon kopiert.', 'A soll sie kopieren.', 'Das Meeting fällt aus.']);
  H('n4', 6, 'ta-tokoro', ['A:遅[おそ]く なって すみません。'], ANSWER, ['いいえ、私[わたし]も 今[いま] 来[き]た ところです。', 'いいえ、遅[おそ]く なりました。', 'ええ、すみません。', 'はい、来[き]て ください。']);
  H('n4', 7, 'tara', ['A:お母[かあ]さん、ゲームを しても いい？', 'B:宿題[しゅくだい]が 終[お]わったら、しても いいわよ。'], 'Was sagt die Mutter?', ['Nach den Hausaufgaben darf das Kind spielen.', 'Das Kind darf gar nicht spielen.', 'Das Kind darf sofort spielen.', 'Nur am Wochenende.']);
  H('n4', 8, 'kata', ['A:この パソコン、使[つか]い方[かた]が わからないんですが…。', 'B:じゃあ、私[わたし]が やって みせましょうか。'], 'Was bietet B an?', ['es einmal vorzumachen', 'einen neuen Computer zu kaufen', 'die Anleitung vorzulesen', 'später zu helfen']);
  H('n4', 9, 'sou-da-hearsay', ['A:天気[てんき]予報[よほう]に よると、明日[あした]は 台風[たいふう]が 来[く]るそうですよ。', 'B:じゃあ、旅行[りょこう]は やめた ほうが いいですね。'], 'Was meint B?', ['Die Reise lieber absagen.', 'Trotzdem fahren.', 'Früher losfahren.', 'Einen Schirm kaufen.']);
  H('n4', 10, 'volitional', ['A:ちょっと 暑[あつ]くない？ エアコン、つけようか。'], ANSWER, ['うん、お願[ねが]い。', 'うん、つけられた。', 'ううん、暑[あつ]くなった。', 'うん、エアコンだね。']);
  H('n4', 11, 'passive', ['A:昨日[きのう]、どろぼうに 財布[さいふ]を 盗[ぬす]まれたんです。', 'B:えっ、大変[たいへん]でしたね。警察[けいさつ]に 行[い]きましたか。'], 'Was ist A passiert?', ['Ihr/Sein Geldbeutel wurde gestohlen.', 'A hat den Geldbeutel verloren.', 'A hat einen Geldbeutel gefunden.', 'A hat einen Geldbeutel geschenkt bekommen.']);
  H('n4', 12, 'ru-tokoro', ['A:鈴木[すずき]さん、今[いま] 話[はな]しても 大丈夫[だいじょうぶ]ですか。', 'B:すみません、今[いま] 出[で]かける ところなんです。三時[さんじ]ごろ 戻[もど]ります。'], 'Was macht Suzuki gerade?', ['will gerade los, zurück gegen drei', 'ist gerade zurückgekommen', 'telefoniert', 'isst zu Mittag']);
  H('n4', 13, 'you-ni-suru', ['A:日本語[にほんご]が 話[はな]せるように なりたいんです。どう したら いいですか。', 'B:毎日[まいにち] 少[すこ]しずつ 日本人[にほんじん]と 話[はな]す ように したら どうですか。'], 'Was rät B?', ['jeden Tag ein bisschen mit Japanern sprechen', 'viele Bücher lesen', 'einen Kurs besuchen', 'nach Japan ziehen']);
  H('n4', 14, 'ni-mieru', ['A:新[あたら]しい 先生[せんせい]は どんな 人[ひと]？', 'B:厳[きび]しそうに 見[み]えるけど、実[じつ]は とても 優[やさ]しいよ。'], 'Wie ist die neue Lehrkraft?', ['sieht streng aus, ist aber sehr nett', 'ist wirklich streng', 'ist sehr lustig', 'ist sehr jung']);
  H('n4', 15, null, ['A:すみません、この 電車[でんしゃ]は 新宿[しんじゅく]に 止[と]まりますか。'], ANSWER, ['いいえ、次[つぎ]の 電車[でんしゃ]に 乗[の]って ください。', 'はい、止[と]めて ください。', 'いいえ、新宿[しんじゅく]です。', 'はい、止[と]まって しまいました。']);

  // ======================= JLPT N3 =======================
  G('n3', 1, 'wake-ga-nai', 'あんなに 練習[れんしゅう]したのだから、負[ま]ける（　）。', ['わけがない', 'わけだ', 'べきだ', 'ことだ']);
  G('n3', 2, 'beki', '約束[やくそく]は 守[まも]る（　）だ。', ['べき', 'はず', 'ところ', 'まま'], 'Versprechen sollte man halten.');
  G('n3', 3, 'ni-totte', '私[わたし]（　）、家族[かぞく]が いちばん 大切[たいせつ]です。', ['にとって', 'について', 'によって', 'として']);
  G('n3', 4, 'ni-yoru-to', 'ニュース（　）、明日[あした] 台風[たいふう]が 来[く]るそうだ。', ['によると', 'にとって', 'について', 'に対[たい]して']);
  G('n3', 5, 'uchi-ni', '若[わか]い（　）、いろいろな 国[くに]へ 行[い]って みたい。', ['うちに', 'とたんに', 'たびに', 'ついでに']);
  G('n3', 6, 'tabi-ni', 'この 写真[しゃしん]を 見[み]る（　）、子[こ]どもの ころを 思[おも]い出[だ]す。', ['たびに', 'とたんに', 'ついでに', 'おかげで']);
  G('n3', 7, 'ta-totan', '家[いえ]を 出[で]た（　）、雨[あめ]が 降[ふ]り出[だ]した。', ['とたん', 'たびに', 'うちに', 'ばかり']);
  G('n3', 8, 'okage-de', '先生[せんせい]が 教[おし]えて くれた（　）、試験[しけん]に 合格[ごうかく]できた。', ['おかげで', 'せいで', 'くせに', 'わりに'], null, 'おかげで = dank (positiv), せいで = wegen (negativ).');
  G('n3', 9, 'sei-de', '寝坊[ねぼう]した（　）、電車[でんしゃ]に 乗[の]り遅[おく]れた。', ['せいで', 'おかげで', 'くせに', 'とおりに']);
  G('n3', 10, 'mama', '窓[まど]を 開[あ]けた（　）寝[ね]て しまった。', ['まま', 'ながら', 'うちに', 'たびに']);
  G('n3', 11, 'zu-ni', '朝[あさ]ご飯[はん]を 食[た]べ（　）、学校[がっこう]へ 行[い]った。', ['ずに', 'ずで', 'ないに', 'なくに'], null, '〜ずに = 〜ないで (ohne zu …).');
  G('n3', 12, 'you-to-suru', '出[で]かけよう（　）したら、電話[でんわ]が 鳴[な]った。', ['と', 'に', 'を', 'が']);
  G('n3', 13, 'wari-ni', 'この レストランは 値段[ねだん]の（　）、料理[りょうり]が おいしい。', ['わりに', 'せいで', 'くせに', 'うちに'], 'Für den Preis ist das Essen in diesem Restaurant gut.');
  G('n3', 14, 'dake-de-naku', '彼[かれ]は 英語[えいご]（　）、中国語[ちゅうごくご]も 話[はな]せる。', ['だけでなく', 'ばかり', 'ほど', 'について']);
  G('n3', 15, 'ni-tsurete', '年[とし]を とる（　）、体[からだ]が 弱[よわ]く なる。', ['につれて', 'について', 'に対[たい]して', 'によると']);
  G('n3', 16, 'hodo-nai', '今年[ことし]の 夏[なつ]は 去年[きょねん]（　）暑[あつ]くない。', ['ほど', 'まで', 'ばかり', 'ごろ']);
  G('n3', 17, 'n-datte', '「田中[たなか]さん、会社[かいしゃ]を やめる（　）。」「えっ、本当[ほんとう]？」', ['んだって', 'んだっけ', 'べきだ', 'ことにする'], 'Ich habe gehört, Tanaka kündigt.');
  G('n3', 18, 'tame-ni', '日本[にほん]の 大学[だいがく]に 入[はい]る（　）、毎日[まいにち] 勉強[べんきょう]して いる。', ['ために', 'せいで', 'わりに', 'とたんに']);
  G('n3', 19, 'ni-totte', 'この 本[ほん]は ＿＿ ＿＿ ★ ＿＿ わかりやすい。', ['とって', '子[こ]ども', 'に', 'も'], 'Dieses Buch ist auch für Kinder leicht verständlich.');
  G('n3', 20, 'furi-o-suru', '彼女[かのじょ]は ＿＿ ＿＿ ★ ＿＿ ふりを した。', ['聞[き]いて', '私[わたし]の', '話[はなし]を', 'いない'], 'Sie tat so, als würde sie mir nicht zuhören.');
  H('n3', 1, 'g-n4-kamoshirenai', ['A:来週[らいしゅう]の 飲[の]み会[かい]、参加[さんか]できる？', 'B:行[い]きたいんだけど、その 日[ひ]は 残業[ざんぎょう]しなきゃ いけないかもしれないんだ。'], 'Was sagt B?', ['B kann vielleicht nicht, wegen Überstunden.', 'B kommt sicher.', 'B hat keine Lust.', 'B ist krank.']);
  H('n3', 2, null, ['A:部長[ぶちょう]、明日[あした]の 会議[かいぎ]の 資料[しりょう]は いつまでに 用意[ようい]すれば いいですか。', 'B:明日[あした]の 朝[あさ] 九時[くじ]までに お願[ねが]いします。'], 'Bis wann braucht der Chef die Unterlagen?', ['morgen früh bis neun Uhr', 'heute Abend', 'morgen Mittag', 'übermorgen']);
  H('n3', 3, 'g-n5-hou-ga-ii', ['A:最近[さいきん] 疲[つか]れやすいんです。', 'B:寝[ね]る 前[まえ]に スマホを 見[み]るのを やめた ほうが いいですよ。'], 'Was rät B?', ['vor dem Schlafen nicht aufs Handy schauen', 'mehr Sport machen', 'früher aufstehen', 'zum Arzt gehen']);
  H('n3', 4, 'wari-ni', ['A:この 店[みせ]、安[やす]い わりに おいしいね。'], ANSWER, ['うん、また 来[こ]よう。', 'うん、高[たか]い せいだね。', 'そう、安[やす]くない くせに。', 'うん、おいしそうに なかった。']);
  H('n3', 5, 'ni-yoru-to', ['A:山田[やまだ]さんの 話[はなし]に よると、駅前[えきまえ]の 本屋[ほんや]が 来月[らいげつ] 閉[し]まるそうだよ。', 'B:え、本当[ほんとう]？ よく 行[い]って いたのに。'], 'Was stimmt?', ['Der Buchladen schließt nächsten Monat; B war oft dort.', 'Ein neuer Buchladen eröffnet.', 'B war nie in dem Laden.', 'Der Laden hat schon geschlossen.']);
  H('n3', 6, 'g-n4-sou-looks', ['A:雨[あめ]が 降[ふ]りそうだから、傘[かさ]を 持[も]って 行[い]った ほうが いいよ。', 'B:大丈夫[だいじょうぶ]。車[くるま]で 行[い]くから。'], 'Warum nimmt B keinen Schirm mit?', ['B fährt mit dem Auto.', 'Es regnet nicht.', 'B hat keinen Schirm.', 'B mag keine Schirme.']);
  H('n3', 7, 'kke', ['A:会議[かいぎ]は 何時[なんじ]からだっけ？'], ANSWER, ['二時[にじ]からだよ。', '二時[にじ]だったっけ。', 'うん、会議[かいぎ]だよ。', '二時間[にじかん]かかったよ。']);
  H('n3', 8, null, ['A:引[ひ]っ越[こ]しの 準備[じゅんび]は 進[すす]んでる？', 'B:それが、仕事[しごと]が 忙[いそが]しくて、まだ ほとんど 何[なに]も して いないんだ。'], 'Wie steht es mit dem Umzug?', ['B hat wegen der Arbeit kaum etwas vorbereitet.', 'B ist fast fertig.', 'B ist schon umgezogen.', 'Der Umzug fällt aus.']);
  H('n3', 9, 'okage-de', ['A:先輩[せんぱい]の おかげで、レポートが 間[ま]に合[あ]いました。', 'B:いや、君[きみ]が がんばった からだよ。'], 'Was sagt A?', ['A bedankt sich: Der Bericht wurde rechtzeitig fertig.', 'Der Bericht kam zu spät.', 'A bittet um Hilfe.', 'A beschwert sich.']);
  H('n3', 10, 'ta-mono-da', ['A:子[こ]どもの ころ、よく この 公園[こうえん]で 遊[あそ]んだ ものだ。'], 'Was erzählt A?', ['A hat als Kind oft in diesem Park gespielt.', 'A möchte hier spielen.', 'Der Park ist neu.', 'Hier dürfen Kinder nicht spielen.']);
  H('n3', 11, null, ['A:田中[たなか]さん、最近[さいきん] 元気[げんき]が ないね。', 'B:仕事[しごと]で 失敗[しっぱい]して、部長[ぶちょう]に 怒[おこ]られた らしいよ。'], 'Was ist mit Tanaka los?', ['Tanaka hat einen Fehler gemacht und wurde vom Chef geschimpft.', 'Tanaka ist krank.', 'Tanaka hat gekündigt.', 'Tanaka wurde befördert.']);
  H('n3', 12, null, ['A:この 書類[しょるい]、明日[あした]までに 出[だ]さなくても いいですか。', 'B:いいえ、必[かなら]ず 明日[あした]までに 出[だ]して ください。'], 'Was stimmt?', ['Das Dokument muss bis morgen abgegeben werden.', 'Es eilt nicht.', 'Bis nächste Woche reicht.', 'Es ist schon abgegeben.']);
  H('n3', 13, 'zu-ni', ['A:週末[しゅうまつ]は 何[なに]を してたの？', 'B:どこにも 出[で]かけずに、ずっと 家[いえ]で 本[ほん]を 読[よ]んで いたよ。'], 'Was hat B am Wochenende gemacht?', ['zu Hause gelesen, ohne rauszugehen', 'einen Ausflug gemacht', 'gearbeitet', 'Freunde getroffen']);
  H('n3', 14, null, ['A:新[あたら]しい 仕事[しごと]には もう 慣[な]れましたか。'], ANSWER, ['ええ、だいぶ 慣[な]れて きました。', 'ええ、慣[な]れる ところでした。', 'はい、新[あたら]しい 仕事[しごと]です。', 'いいえ、慣[な]れた ばかりです。']);
  H('n3', 15, null, ['A:駅[えき]まで 歩[ある]いて どのぐらい かかりますか。', 'B:歩[ある]くと 二十分[にじゅっぷん]ぐらいですが、バスなら 五分[ごふん]です。'], 'Was stimmt?', ['zu Fuß etwa 20 Minuten, mit dem Bus 5', 'zu Fuß 5 Minuten', 'mit dem Bus 20 Minuten', 'zu Fuß eine halbe Stunde']);
})(window.EXAM_BANK);
