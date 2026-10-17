window.SEED = window.SEED || [];
window.SEED.push(

  // ===== Smalltalk-Standardfragen N5 =====
  { id:"q-n5-01", type:"prompt", order:1, level:"N5", jp:"今日、朝ごはんに何を食べましたか。", furi:"今日[きょう]、朝[あさ]ごはんに何[なに]を食[た]べましたか。", de:"Was hast du heute gefrühstückt?", hint:"〜ました" },
  { id:"q-n5-02", type:"prompt", order:2, level:"N5", jp:"週末は何をしますか。", furi:"週末[しゅうまつ]は何[なに]をしますか。", de:"Was machst du am Wochenende?", hint:"〜ます, 〜たいです" },
  { id:"q-n5-03", type:"prompt", order:3, level:"N5", jp:"先週末は何をしましたか。", furi:"先週末[せんしゅうまつ]は何[なに]をしましたか。", de:"Was hast du letztes Wochenende gemacht?", hint:"〜て、〜" },
  { id:"q-n5-04", type:"prompt", order:4, level:"N5", jp:"昨日は何をしましたか。", furi:"昨日[きのう]は何[なに]をしましたか。", de:"Was hast du gestern gemacht?", hint:"〜てから" },
  { id:"q-n5-05", type:"prompt", order:5, level:"N5", jp:"毎朝、何時に起きますか。", furi:"毎朝[まいあさ]、何時[なんじ]に起[お]きますか。", de:"Wann stehst du morgens auf?", hint:"〜時に" },
  { id:"q-n5-06", type:"prompt", order:6, level:"N5", jp:"趣味は何ですか。", furi:"趣味[しゅみ]は何[なん]ですか。", de:"Was ist dein Hobby?", hint:"〜ことです" },
  { id:"q-n5-07", type:"prompt", order:7, level:"N5", jp:"どんな食べ物が好きですか。", furi:"どんな食[た]べ物[もの]が好[す]きですか。", de:"Welches Essen magst du?", hint:"〜が好きです" },
  { id:"q-n5-08", type:"prompt", order:8, level:"N5", jp:"家族について教えてください。", furi:"家族[かぞく]について教[おし]えてください。", de:"Erzähl von deiner Familie.", hint:"います, 〜人" },
  { id:"q-n5-09", type:"prompt", order:9, level:"N5", jp:"あなたの町はどんな町ですか。", furi:"あなたの町[まち]はどんな町[まち]ですか。", de:"Wie ist deine Stadt?", hint:"Adjektive, 〜があります" },
  { id:"q-n5-10", type:"prompt", order:10, level:"N5", jp:"好きな季節はいつですか。どうしてですか。", furi:"好[す]きな季節[きせつ]はいつですか。どうしてですか。", de:"Was ist deine Lieblingsjahreszeit und warum?", hint:"〜から" },
  { id:"q-n5-11", type:"prompt", order:11, level:"N5", jp:"今、何がほしいですか。", furi:"今[いま]、何[なに]がほしいですか。", de:"Was hättest du gerade gern?", hint:"〜がほしい" },
  { id:"q-n5-12", type:"prompt", order:12, level:"N5", jp:"日本で何をしたいですか。", furi:"日本[にほん]で何[なに]をしたいですか。", de:"Was möchtest du in Japan machen?", hint:"〜たい" },

  // ===== Smalltalk-Standardfragen N4 =====
  { id:"q-n4-01", type:"prompt", order:13, level:"N4", jp:"もし時間とお金がたくさんあったら、どこへ行って何をしたいですか。", furi:"もし時間[じかん]とお金[かね]がたくさんあったら、どこへ行[い]って何[なに]をしたいですか。", de:"Perfekter Urlaub: Wohin würdest du fahren und was machen?", hint:"〜たら" },
  { id:"q-n4-02", type:"prompt", order:14, level:"N4", jp:"子どものころ、何をするのが好きでしたか。", furi:"子[こ]どものころ、何[なに]をするのが好[す]きでしたか。", de:"Was hast du als Kind gern gemacht?", hint:"〜のが好き" },
  { id:"q-n4-03", type:"prompt", order:15, level:"N4", jp:"どうして日本語を勉強し始めましたか。", furi:"どうして日本語[にほんご]を勉強[べんきょう]し始[はじ]めましたか。", de:"Warum hast du angefangen, Japanisch zu lernen?", hint:"〜始める, 〜ので" },
  { id:"q-n4-04", type:"prompt", order:16, level:"N4", jp:"最近、どんなことを頑張っていますか。", furi:"最近[さいきん]、どんなことを頑張[がんば]っていますか。", de:"Wofür strengst du dich gerade an?", hint:"〜ている" },
  { id:"q-n4-05", type:"prompt", order:17, level:"N4", jp:"今年、やってみたいことは何ですか。", furi:"今年[ことし]、やってみたいことは何[なん]ですか。", de:"Was willst du dieses Jahr ausprobieren?", hint:"〜てみる" },
  { id:"q-n4-06", type:"prompt", order:18, level:"N4", jp:"何を作ることができますか。得意な料理は何ですか。", furi:"何[なに]を作[つく]ることができますか。得意[とくい]な料理[りょうり]は何[なん]ですか。", de:"Was kannst du kochen? Was ist dein bestes Gericht?", hint:"〜ことができる" },
  { id:"q-n4-07", type:"prompt", order:19, level:"N4", jp:"休みの日はどうやって過ごしますか。", furi:"休[やす]みの日[ひ]はどうやって過[す]ごしますか。", de:"Wie verbringst du deine freien Tage?", hint:"〜たり〜たりする" },
  { id:"q-n4-08", type:"prompt", order:20, level:"N4", jp:"今まで行った所で、一番よかった所はどこですか。", furi:"今[いま]まで行[い]った所[ところ]で、一番[いちばん]よかった所[ところ]はどこですか。", de:"Welcher Ort, an dem du warst, war der schönste?", hint:"〜た所, 一番" }

);
