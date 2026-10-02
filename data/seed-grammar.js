window.SEED = window.SEED || [];
window.SEED.push(

// ───────────── Lektion 1 ─────────────
{ id:"g-g1-x-wa-y-desu", type:"grammar", source:"Genki I", lesson:1, level:"N5",
  title:"X は Y です – „X ist Y“",
  jp:"XはYです",
  summary:"Der Grundsatz des Japanischen: Man stellt ein Thema X vor und sagt, was es ist.",
  structure:["X は Y です。", "X = Thema (は wird „wa“ gesprochen), Y = Nomen"],
  explanation:"Mit **X は Y です** sagt man „X ist Y“. X ist das *Thema* des Satzes – das, worüber man spricht. Die Partikel は wird zwar mit dem Hiragana „ha“ geschrieben, aber als **„wa“** ausgesprochen.\n\n**です** entspricht dem deutschen „sein“, ändert sich aber nie nach der Person: „ich bin“, „du bist“, „er ist“, „wir sind“ heißen alle einfach です. Es steht immer am Satzende – im Japanischen kommt das Prädikat immer zum Schluss.\n\nDas Japanische kennt **keine Artikel** und meist **keinen Plural**: 学生[がくせい] kann „ein Student“, „der Student“ oder „Studenten“ bedeuten. Auch das Thema lässt man weg, wenn es aus dem Zusammenhang klar ist: Statt 私[わたし]は学生[がくせい]です sagt man oft einfach 学生[がくせい]です。\n\nÜber sich selbst spricht man nie mit 〜さん. さん hängt man nur an die Namen anderer Personen an (ähnlich wie „Herr/Frau“).",
  examples:[
    { jp:"私[わたし]は学生[がくせい]です。", de:"Ich bin Student/Studentin." },
    { jp:"メアリーさんはアメリカ人[じん]です。", de:"Mary ist Amerikanerin." },
    { jp:"たけしさんは四年生[よねんせい]です。", de:"Takeshi ist im vierten Studienjahr." },
    { jp:"専攻[せんこう]は経済[けいざい]です。", de:"Mein Hauptfach ist Wirtschaft." },
    { jp:"私[わたし]は十九歳[じゅうきゅうさい]です。", de:"Ich bin 19 Jahre alt." }
  ],
  pitfalls:["は als Partikel wird immer „wa“ ausgesprochen, nicht „ha“.","Nie さん an den eigenen Namen hängen.","です ändert sich nicht nach Person oder Zahl."],
  tags:["satzbau","partikel","grundlagen"],
  related:["g-g1-ka","g-g1-no","g-g2-janai"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["person"]} },
      jp:"私[わたし]は{N}です。",
      de:"Ich bin {N:indef}." },
    { slots:{ F:{pos:"noun", cat:["fach"]} },
      jp:"専攻[せんこう]は{F}です。",
      de:"Mein Hauptfach ist {F:w}." }
  ]
},

{ id:"g-g1-ka", type:"grammar", source:"Genki I", lesson:1, level:"N5",
  title:"Fragesätze mit か",
  jp:"〜か",
  summary:"Ein か am Satzende macht aus einer Aussage eine Frage.",
  structure:["Aussagesatz + か。", "Fragewort (何[なん]・どこ・だれ …) an die Stelle der gesuchten Information + か"],
  explanation:"Im Japanischen bildet man eine Frage ganz einfach: Man hängt **か** an das Satzende. Die Wortstellung ändert sich dabei – anders als im Deutschen – **nicht**. Die Stimme geht am Ende leicht nach oben. Ein Fragezeichen schreibt man in höflicher Schriftsprache meist nicht, der Punkt 。 genügt.\n\n- 学生[がくせい]です。 → „Ich bin Student.“\n- 学生[がくせい]ですか。 → „Sind Sie Student?“\n\nBei **Ergänzungsfragen** setzt man das Fragewort genau an die Stelle, an der in der Antwort die Information steht: 専攻[せんこう]は**何[なん]**ですか。 – 専攻[せんこう]は**歴史[れきし]**です。 Wichtige Fragewörter: 何[なん]/何[なに] (was), だれ (wer), どこ (wo), いつ (wann), 何時[なんじ] (wie viel Uhr), 何歳[なんさい] (wie alt).\n\nAuf Ja/Nein-Fragen antwortet man mit **はい** (ja) oder **いいえ** (nein). Statt あなた (du/Sie) verwendet man lieber den Namen der Person mit さん – あなた klingt schnell zu direkt.",
  examples:[
    { jp:"メアリーさんは留学生[りゅうがくせい]ですか。", de:"Ist Mary Austauschstudentin?" },
    { jp:"専攻[せんこう]は何[なん]ですか。", de:"Was ist Ihr Hauptfach?" },
    { jp:"今[いま]何時[なんじ]ですか。", de:"Wie spät ist es jetzt?" },
    { jp:"たけしさんは何歳[なんさい]ですか。", de:"Wie alt ist Takeshi?" }
  ],
  pitfalls:["Die Wortstellung bleibt bei Fragen gleich – kein Umstellen wie im Deutschen.","あなた möglichst vermeiden, besser den Namen + さん verwenden."],
  tags:["fragen","partikel","grundlagen"],
  related:["g-g1-x-wa-y-desu","g-g2-kore"],
  patterns:[
    { slots:{ F:{pos:"noun", cat:["fach"]} },
      jp:"専攻[せんこう]は{F}ですか。",
      de:"Ist Ihr Hauptfach {F:w}?" },
    { slots:{ N:{pos:"noun", cat:["ding","lesestoff"]} },
      jp:"これは{N}ですか。",
      de:"Ist das {N:indef}?" }
  ]
},

{ id:"g-g1-no", type:"grammar", source:"Genki I", lesson:1, level:"N5",
  title:"Nomen の Nomen – Besitz und Zugehörigkeit",
  jp:"AのB",
  summary:"の verbindet zwei Nomen: A beschreibt oder besitzt B.",
  structure:["A の B (A = Besitzer/Beschreibung, B = Hauptwort)"],
  explanation:"Die Partikel **の** verbindet zwei Nomen. Das **zweite** Nomen ist das eigentliche Hauptwort, das erste beschreibt es näher. Die Reihenfolge ist also umgekehrt zu Konstruktionen wie „das Buch **von** Takeshi“ – eher wie das englische „Takeshi**'s** book“.\n\n- **Besitz**: たけしさんの本[ほん] – Takeshis Buch\n- **Zugehörigkeit**: 日本[にほん]大学[だいがく]の学生[がくせい] – Student der Universität Japan\n- **Herkunft/Art**: 日本[にほん]の車[くるま] – ein japanisches Auto (ein Auto aus Japan)\n- **Thema/Inhalt**: 日本語[にほんご]の本[ほん] – ein Japanischbuch; 経済[けいざい]の本[ほん] – ein Buch über Wirtschaft\n\nMan kann mehrere の hintereinander verwenden: 私[わたし]の友[とも]だちの傘[かさ] – der Regenschirm meines Freundes. Ist das zweite Nomen aus dem Kontext klar, darf es wegfallen: これはメアリーさんのです。 – Das ist Marys.",
  examples:[
    { jp:"私[わたし]の名前[なまえ]は山下[やました]です。", de:"Mein Name ist Yamashita." },
    { jp:"メアリーさんはアリゾナ大学[だいがく]の学生[がくせい]です。", de:"Mary ist Studentin an der University of Arizona." },
    { jp:"たけしさんの電話番号[でんわばんごう]は何番[なんばん]ですか。", de:"Wie lautet Takeshis Telefonnummer?" },
    { jp:"これは日本語[にほんご]の本[ほん]です。", de:"Das ist ein Japanischbuch." }
  ],
  pitfalls:["Reihenfolge beachten: Das Hauptwort steht HINTEN (私[わたし]の本[ほん] = mein Buch, nicht „Buch von mir“ in umgekehrter Reihenfolge).","Adjektive werden NICHT mit の angeschlossen (大[おお]きい本[ほん], nicht 大[おお]きいの本[ほん])."],
  tags:["partikel","nomen","besitz"],
  related:["g-g1-x-wa-y-desu","g-g2-dareno","g-g10-adj-no"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","kleidung"]}, L:{pos:"noun", cat:["land"]} },
      jp:"これは{L}の{N}です。",
      de:"Das ist {N:indef} aus {L:dat}." },
    { slots:{ F:{pos:"noun", cat:["fach"]} },
      jp:"それは{F}の本[ほん]です。",
      de:"Das ist ein Buch über {F:w}." }
  ]
},

{ id:"g-g1-numbers-time", type:"grammar", source:"Genki I", lesson:1, level:"N5",
  title:"Zahlen, Uhrzeit, Alter und Telefonnummern",
  jp:"〜時[じ]・〜歳[さい]・〜番[ばん]",
  summary:"Die japanischen Zahlen und wie man mit ihnen Uhrzeit, Alter und Telefonnummern angibt.",
  structure:["Zahl + 時[じ] (Uhr)", "Zahl + 時[じ]半[はん] (halb)", "Zahl + 歳[さい] (Jahre alt)", "Zahl + 年生[ねんせい] (Studienjahr)"],
  explanation:"Die Zahlen von 1 bis 10: いち, に, さん, よん (し), ご, ろく, なな (しち), はち, きゅう (く), じゅう. Größere Zahlen setzt man logisch zusammen: 11 = じゅういち, 20 = にじゅう, 35 = さんじゅうご.\n\n**Uhrzeit**: Zahl + **時[じ]**. Achtung, einige Stunden sind unregelmäßig:\n- 4時[じ] = **よ**じ\n- 7時[じ] = **しち**じ\n- 9時[じ] = **く**じ\n„Halb“ heißt **半[はん]** und steht *nach* der Stunde: 三時[さんじ]半[はん] = 3:30 (nicht „halb vier“ wie im Deutschen!). Vormittags = 午前[ごぜん], nachmittags = 午後[ごご], beide stehen *vor* der Uhrzeit.\n\n**Alter**: Zahl + **歳[さい]**. Unregelmäßig: 1歳[さい] = いっさい, 8歳[さい] = はっさい, 10歳[さい] = じゅっさい, **20 Jahre = はたち**. **Studienjahr**: 一年生[いちねんせい] (1. Jahr) bis 四年生[よねんせい].\n\n**Telefonnummern** liest man Ziffer für Ziffer; der Bindestrich wird zu の: 012-345 → ゼロいちに の さんよんご.",
  examples:[
    { jp:"今[いま]何時[なんじ]ですか。", de:"Wie spät ist es jetzt?" },
    { jp:"九時[くじ]半[はん]です。", de:"Es ist halb zehn (9:30)." },
    { jp:"午後[ごご]四時[よじ]です。", de:"Es ist vier Uhr nachmittags." },
    { jp:"私[わたし]は二十歳[はたち]です。", de:"Ich bin zwanzig Jahre alt." },
    { jp:"電話番号[でんわばんごう]は何番[なんばん]ですか。", de:"Wie ist Ihre Telefonnummer?" }
  ],
  pitfalls:["半[はん] bedeutet „+30 Minuten“: 三時半[さんじはん] = 3:30, nicht 2:30.","4 Uhr = よじ, 7 Uhr = しちじ, 9 Uhr = くじ.","20 Jahre alt = はたち."],
  tags:["zahlen","zeit","uhrzeit"],
  related:["g-g1-ka","g-g3-time","g-g5-counters"],
  patterns:[
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は何時[なんじ]からですか。",
      de:"Um wie viel Uhr beginnt {E:def}?" }
  ]
},

// ───────────── Lektion 2 ─────────────
{ id:"g-g2-kore", type:"grammar", source:"Genki I", lesson:2, level:"N5",
  title:"これ・それ・あれ・どれ – „dies, das, jenes, welches“",
  jp:"これ／それ／あれ／どれ",
  summary:"Demonstrativpronomen, die für sich allein stehen und auf Dinge zeigen.",
  structure:["これ = das hier (beim Sprecher)", "それ = das da (beim Gesprächspartner)", "あれ = das dort drüben (weit weg von beiden)", "どれ = welches? (bei drei oder mehr Dingen)"],
  explanation:"Das Japanische unterscheidet drei Entfernungen – im Deutschen sagt man meist einfach „das“:\n- **これ**: in der Nähe des Sprechers („das hier“)\n- **それ**: in der Nähe des Gesprächspartners („das da bei dir“)\n- **あれ**: weit weg von beiden („das dort drüben“)\n- **どれ**: Fragewort „welches?“\n\nDiese Wörter sind **Pronomen**: Sie stehen *allein* an der Stelle eines Nomens und können Thema oder Objekt sein – これは本[ほん]です。 Direkt vor einem Nomen darf man sie *nicht* verwenden; dafür gibt es この/その/あの/どの.\n\nMerkhilfe: **ko** = hier (nah), **so** = da (bei dir), **a** = dort (fern), **do** = Frage. Diese „ko-so-a-do“-Reihe begegnet dir noch oft (ここ/そこ/あそこ/どこ usw.).\n\nWichtig: Nach どれ steht nie は, sondern **が**: どれがいいですか。 (Fragewörter sind nie Thema.)",
  examples:[
    { jp:"これは何[なん]ですか。", de:"Was ist das (hier)?" },
    { jp:"それはメアリーさんの傘[かさ]です。", de:"Das (da bei dir) ist Marys Regenschirm." },
    { jp:"あれは図書館[としょかん]です。", de:"Das dort drüben ist die Bibliothek." },
    { jp:"どれがたけしさんのかばんですか。", de:"Welche ist Takeshis Tasche?" }
  ],
  pitfalls:["これ/それ/あれ nie direkt vor ein Nomen setzen (❌ これ本[ほん]).","Nach どれ folgt が, nicht は."],
  tags:["demonstrativ","ko-so-a-do","pronomen"],
  related:["g-g2-kono","g-g2-koko","g-g2-dareno"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","lesestoff","kleidung"]} },
      jp:"これは{N}です。",
      de:"Das ist {N:indef}." },
    { slots:{ N:{pos:"noun", cat:["ding","lesestoff","kleidung"]} },
      jp:"それは{N}ですか。",
      de:"Ist das {N:indef}?" },
    { slots:{ N:{pos:"noun", cat:["ort"]} },
      jp:"あれは{N}です。",
      de:"Das dort drüben ist {N:indef}.",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] }
  ]
},

{ id:"g-g2-kono", type:"grammar", source:"Genki I", lesson:2, level:"N5",
  title:"この・その・あの・どの + Nomen",
  jp:"この／その／あの／どの＋Nomen",
  summary:"Demonstrativbegleiter, die immer direkt vor einem Nomen stehen.",
  structure:["この + Nomen = dieses … hier", "その + Nomen = das … da", "あの + Nomen = jenes … dort drüben", "どの + Nomen = welches …?"],
  explanation:"**この, その, あの, どの** entsprechen den Pronomen これ/それ/あれ/どれ, werden aber **immer mit einem Nomen** verwendet – so wie im Deutschen „dieser Regenschirm“ statt nur „dieser“.\n\n- この時計[とけい] – diese Uhr (hier bei mir)\n- その時計[とけい] – die Uhr (da bei dir)\n- あの時計[とけい] – die Uhr dort drüben\n- どの時計[とけい] – welche Uhr?\n\nEine Endung nach Geschlecht gibt es nicht – この bleibt immer この, egal ob „dieser“, „diese“ oder „dieses“.\n\nPraktisch beim Einkaufen: この〜はいくらですか。 – „Wie viel kostet dieses …?“ Und wie bei どれ gilt: どの〜 wird mit **が** markiert, nicht mit は.",
  examples:[
    { jp:"この時計[とけい]はいくらですか。", de:"Wie viel kostet diese Uhr?" },
    { jp:"その傘[かさ]は三千円[さんぜんえん]です。", de:"Der Regenschirm (da) kostet 3000 Yen." },
    { jp:"あの人[ひと]は日本人[にほんじん]です。", de:"Die Person dort drüben ist Japaner." },
    { jp:"どの本[ほん]が日本語[にほんご]の本[ほん]ですか。", de:"Welches Buch ist das Japanischbuch?" }
  ],
  pitfalls:["この/その/あの/どの nie allein verwenden (❌ このはいくらですか → これはいくらですか).","Nach どの＋Nomen steht が, nicht は."],
  tags:["demonstrativ","ko-so-a-do","einkaufen"],
  related:["g-g2-kore","g-g2-koko"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","kleidung","lesestoff"]} },
      jp:"この{N}はいくらですか。",
      de:"Wie viel kostet {N:def} hier?" },
    { slots:{ N:{pos:"noun", cat:["ding","kleidung"]}, L:{pos:"noun", cat:["land"]} },
      jp:"あの{N}は{L}のです。",
      de:"{N:def} dort drüben ist aus {L:dat}." }
  ]
},

{ id:"g-g2-koko", type:"grammar", source:"Genki I", lesson:2, level:"N5",
  title:"ここ・そこ・あそこ・どこ – Ortsangaben",
  jp:"ここ／そこ／あそこ／どこ",
  summary:"Demonstrativwörter für Orte: hier, da, dort drüben und wo?",
  structure:["ここ = hier", "そこ = da (bei dir)", "あそこ = dort drüben", "どこ = wo?", "X はどこですか。 – Wo ist X?"],
  explanation:"Die ko-so-a-do-Reihe gibt es auch für **Orte**:\n- **ここ** – hier (beim Sprecher)\n- **そこ** – da (beim Gesprächspartner)\n- **あそこ** – dort drüben (weit weg von beiden; beachte die Form **あそこ**, nicht „あこ“)\n- **どこ** – wo?\n\nDie wichtigste Frage für den Alltag: **X はどこですか。** – „Wo ist X?“ Die Antwort: X はあそこです。 oder einfach あそこです。 Oft beginnt man höflich mit すみません (Entschuldigung).\n\nWie ein Nomen kann ここ usw. auch Thema sein: ここは図書館[としょかん]です。 – „Hier ist die Bibliothek.“ (wörtlich: „Dieser Ort ist die Bibliothek.“)",
  examples:[
    { jp:"すみません、トイレはどこですか。", de:"Entschuldigung, wo ist die Toilette?" },
    { jp:"銀行[ぎんこう]はあそこです。", de:"Die Bank ist dort drüben." },
    { jp:"ここは大学[だいがく]の図書館[としょかん]です。", de:"Hier ist die Universitätsbibliothek." },
    { jp:"メアリーさんのうちはどこですか。", de:"Wo ist Marys Zuhause?" }
  ],
  pitfalls:["„Dort drüben“ heißt あそこ, nicht „あこ“."],
  tags:["demonstrativ","ko-so-a-do","ort","fragen"],
  related:["g-g2-kore","g-g2-kono","g-g4-position"],
  patterns:[
    { slots:{ A:{pos:"noun", cat:["ort"]} },
      jp:"すみません、{A}はどこですか。",
      de:"Entschuldigung, wo ist {A:def}?",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] },
    { slots:{ A:{pos:"noun", cat:["ort"]} },
      jp:"{A}はあそこです。",
      de:"{A:def} ist dort drüben.",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] }
  ]
},

{ id:"g-g2-dareno", type:"grammar", source:"Genki I", lesson:2, level:"N5",
  title:"だれの – „wessen?“",
  jp:"だれの＋Nomen",
  summary:"Mit だれの fragt man nach dem Besitzer einer Sache.",
  structure:["だれの + Nomen + ですか。 – Wessen … ist das?", "Person + の (+ Nomen) です。 – Das ist … von Person."],
  explanation:"**だれ** bedeutet „wer“. Mit der Partikel の (siehe Lektion 1) wird daraus **だれの** – „wessen“. Wie jedes の-Attribut steht es direkt vor dem Nomen: だれの傘[かさ] – wessen Regenschirm.\n\nIn der Antwort ersetzt man だれ durch den Besitzer: それはたけしさんの傘[かさ]です。 Wenn klar ist, worum es geht, lässt man das Nomen nach の weg: たけしさんのです。 – „Das ist Takeshis.“\n\nDas funktioniert auch als Satzthema: この傘[かさ]はだれのですか。 – „Wem gehört dieser Regenschirm?“",
  examples:[
    { jp:"これはだれの傘[かさ]ですか。", de:"Wessen Regenschirm ist das?" },
    { jp:"それはたけしさんの傘[かさ]です。", de:"Das ist Takeshis Regenschirm." },
    { jp:"このかばんはだれのですか。", de:"Wem gehört diese Tasche?" },
    { jp:"メアリーさんのです。", de:"Das ist Marys." }
  ],
  tags:["fragen","besitz","partikel"],
  related:["g-g1-no","g-g2-kore"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","kleidung","lesestoff"]} },
      jp:"これはだれの{N}ですか。",
      de:"Wessen {N:w} ist das?" },
    { slots:{ N:{pos:"noun", cat:["ding","kleidung","lesestoff"]} },
      jp:"その{N}は先生[せんせい]のです。",
      de:"{N:def} gehört dem Lehrer." }
  ]
},

{ id:"g-g2-mo", type:"grammar", source:"Genki I", lesson:2, level:"N5",
  title:"Partikel も – „auch“",
  jp:"Xも",
  summary:"も ersetzt は (oder が/を) und bedeutet „auch“.",
  structure:["X も Y です。 – X ist auch Y.", "も ersetzt は, が und を"],
  explanation:"**も** heißt „auch“. Es steht nach dem Wort, auf das sich „auch“ bezieht, und **ersetzt** dabei die Partikel は: Statt たけしさんは日本人[にほんじん]です sagt man, wenn schon jemand anderes erwähnt wurde: たけしさん**も**日本人[にほんじん]です。 – „Takeshi ist auch Japaner.“\n\nMan darf **nicht** は und も zusammen verwenden (❌ たけしさんはも). Dasselbe gilt für が und を: コーヒー**を**飲[の]みます → 紅茶[こうちゃ]**も**飲[の]みます。\n\nDie Position von も bestimmt, *was* „auch“ ist: 私[わたし]**も**学生[がくせい]です (ich bin auch Student – so wie jemand anderes). Im Deutschen regelt das eher die Betonung.",
  examples:[
    { jp:"たけしさんは日本人[にほんじん]です。ゆいさんも日本人[にほんじん]です。", de:"Takeshi ist Japaner. Yui ist auch Japanerin." },
    { jp:"私[わたし]も学生[がくせい]です。", de:"Ich bin auch Student." },
    { jp:"このかばんも三千円[さんぜんえん]です。", de:"Diese Tasche kostet auch 3000 Yen." },
    { jp:"ロバートさんもイギリス人[じん]ですか。", de:"Ist Robert auch Brite?" }
  ],
  pitfalls:["Nie はも oder をも sagen – も ersetzt diese Partikel.","Bei Verneinung heißt も „auch nicht“ (→ Lektion 4)."],
  tags:["partikel","auch"],
  related:["g-g4-mo","g-g1-x-wa-y-desu"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","kleidung"]}, M:{pos:"noun", cat:["ding","kleidung"]}, L:{pos:"noun", cat:["land"]} },
      jp:"{N}は{L}のです。{M}も{L}のです。",
      de:"{N:def} ist aus {L:dat}. {M:def} ist auch aus {L:dat}." },
    { slots:{ F:{pos:"noun", cat:["fach"]} },
      jp:"私[わたし]の専攻[せんこう]も{F}です。",
      de:"Mein Hauptfach ist auch {F:w}." }
  ]
},

{ id:"g-g2-janai", type:"grammar", source:"Genki I", lesson:2, level:"N5",
  title:"X は Y じゃないです – Verneinung von です",
  jp:"XはYじゃないです",
  summary:"Die verneinte Form von です bei Nomen: „X ist nicht Y“.",
  structure:["Nomen + じゃないです (gesprochen)", "Nomen + ではありません (förmlich/schriftlich)"],
  explanation:"Die Verneinung von です lautet **じゃないです**. Sie ersetzt einfach です: 学生[がくせい]です → 学生[がくせい]じゃないです。 – „(Ich) bin kein Student.“\n\nEs gibt mehrere Varianten mit derselben Bedeutung:\n- **じゃないです** – höflich, alltäglich gesprochen\n- **じゃありません** – etwas höflicher\n- **ではありません** – förmlich, v. a. geschrieben\n\nIm Deutschen unterscheiden wir „nicht“ und „kein“ – im Japanischen gibt es nur じゃないです. Auf eine Frage antwortet man oft: いいえ、〜じゃないです。",
  examples:[
    { jp:"私[わたし]は日本人[にほんじん]じゃないです。", de:"Ich bin kein Japaner." },
    { jp:"たけしさんは留学生[りゅうがくせい]じゃないです。", de:"Takeshi ist kein Austauschstudent." },
    { jp:"いいえ、それは私[わたし]の傘[かさ]じゃないです。", de:"Nein, das ist nicht mein Regenschirm." },
    { jp:"専攻[せんこう]は歴史[れきし]ではありません。", de:"Mein Hauptfach ist nicht Geschichte." }
  ],
  pitfalls:["じゃない gilt für Nomen (und な-Adjektive). い-Adjektive werden anders verneint (→ Lektion 5)."],
  tags:["verneinung","kopula"],
  related:["g-g1-x-wa-y-desu","g-g5-adj-conjugation"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","kleidung"]}, L:{pos:"noun", cat:["land"]} },
      jp:"この{N}は{L}のじゃないです。",
      de:"{N:def} hier ist nicht aus {L:dat}." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は今日[きょう]じゃないです。",
      de:"{E:def} ist nicht heute." }
  ]
},

{ id:"g-g2-ne-yo", type:"grammar", source:"Genki I", lesson:2, level:"N5",
  title:"Satzendpartikeln ね und よ",
  jp:"〜ね／〜よ",
  summary:"ね sucht Zustimmung („…, nicht wahr?“), よ teilt neue Information mit („…, weißt du?“).",
  structure:["Satz + ね。 – Bestätigung, Zustimmung", "Satz + よ。 – Hinweis auf neue Information"],
  explanation:"Am Satzende können kleine Partikeln die Haltung des Sprechers ausdrücken.\n\n**ね** verwendet man, wenn man glaubt, dass der Gesprächspartner dasselbe weiß oder denkt. Es entspricht „…, nicht wahr?“, „…, oder?“ oder einem zustimmenden „ja, …“: いい天気[てんき]ですね。 – „Schönes Wetter, nicht wahr?“\n\n**よ** verwendet man, wenn man dem anderen etwas mitteilt, das er vermutlich *nicht* weiß. Ungefähr „…, weißt du“, „übrigens …“ oder ein betontes „doch“: これはおいしいですよ。 – „Das ist (wirklich) lecker!“\n\nVorsicht mit よ: Zu häufig verwendet wirkt es belehrend. ね dagegen wirkt freundlich und verbindend.",
  examples:[
    { jp:"このかばんは高[たか]いですね。", de:"Diese Tasche ist teuer, nicht wahr?" },
    { jp:"たけしさんは日本人[にほんじん]ですよ。", de:"Takeshi ist übrigens Japaner." },
    { jp:"それは私[わたし]の傘[かさ]ですよ。", de:"Das ist doch mein Regenschirm!" },
    { jp:"専攻[せんこう]は文学[ぶんがく]ですね。", de:"Ihr Hauptfach ist Literatur, richtig?" }
  ],
  pitfalls:["よ nicht zu oft verwenden – es kann aufdringlich wirken."],
  tags:["partikel","satzende","gespräch"],
  related:["g-g1-ka"],
  patterns:[
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は明日[あした]ですね。",
      de:"{E:def} ist morgen, nicht wahr?" },
    { slots:{ F:{pos:"noun", cat:["fach"]} },
      jp:"私[わたし]の専攻[せんこう]は{F}ですよ。",
      de:"Mein Hauptfach ist übrigens {F:w}." }
  ]
},

// ───────────── Lektion 3 ─────────────
{ id:"g-g3-verbtypes", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Verbtypen: る-Verben, う-Verben, unregelmäßige Verben",
  jp:"る動詞[どうし]／う動詞[どうし]／不規則[ふきそく]動詞[どうし]",
  summary:"Japanische Verben fallen in drei Gruppen, die unterschiedlich konjugiert werden.",
  structure:["る-Verben: る streichen (食[た]べる → 食[た]べ)", "う-Verben: letzten u-Laut zu i machen (行[い]く → 行[い]き)", "Unregelmäßig: する → し, くる → き"],
  explanation:"Im Wörterbuch stehen Verben in der **Wörterbuchform** (Grundform), die immer auf einen **u-Laut** endet: 食[た]べる, 飲[の]む, 行[い]く. Um sie zu konjugieren, musst du wissen, zu welcher Gruppe ein Verb gehört.\n\n**1. る-Verben** (ichidan): Sie enden auf **-iru** oder **-eru**. Man streicht einfach る, um den **Stamm** zu bekommen:\n- 食[た]べる → 食[た]べ(ます)\n- 見[み]る → 見[み](ます)\n- 起[お]きる → 起[お]き(ます)\n\n**2. う-Verben** (godan): alle anderen. Der letzte Laut wird von der u-Reihe in die **i-Reihe** verschoben:\n- 行[い]く → 行[い]き(ます)\n- 飲[の]む → 飲[の]み(ます)\n- 話[はな]す → 話[はな]し(ます)\n- 待[ま]つ → 待[ま]ち(ます)\n- 買[か]う → 買[か]い(ます)\n\n**3. Unregelmäßige Verben**: nur zwei – **する** (machen) → し(ます) und **くる** (kommen) → き(ます). Viele Verben werden mit する gebildet: 勉強[べんきょう]する → 勉強[べんきょう]します.\n\nAchtung: Einige Verben sehen aus wie る-Verben, sind aber **う-Verben**, z. B. **帰[かえ]る** (帰[かえ]ります), **入[はい]る**, **切[き]る**, **知[し]る**, **要[い]る**. Diese muss man auswendig lernen.",
  examples:[
    { jp:"私[わたし]は毎日[まいにち]ご飯[はん]を食[た]べます。", de:"Ich esse jeden Tag Reis. (る-Verb)" },
    { jp:"コーヒーを飲[の]みます。", de:"Ich trinke Kaffee. (う-Verb)" },
    { jp:"うちに帰[かえ]ります。", de:"Ich gehe nach Hause. (帰る ist ein う-Verb!)" },
    { jp:"日本語[にほんご]を勉強[べんきょう]します。", de:"Ich lerne Japanisch. (unregelmäßig)" }
  ],
  pitfalls:["帰[かえ]る, 入[はい]る, 切[き]る, 知[し]る sind う-Verben (帰[かえ]ります, nicht 帰[かえ]ます).","Nur Verben auf -iru/-eru KÖNNEN る-Verben sein – aber nicht alle sind es."],
  tags:["verben","konjugation","grundlagen"],
  related:["g-g3-masu","g-g6-te-form","g-g8-short-present"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"今日[きょう]は{V:masu}。",
      de:"Heute {V:ich} ich." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:masu}。",
      de:"Ich {V:ich} {O:akki}." }
  ]
},

{ id:"g-g3-masu", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Verben in der ます-Form (Präsens/Futur)",
  jp:"〜ます／〜ません",
  summary:"Höfliche Verbform für Gegenwart und Zukunft, positiv und verneint.",
  structure:["Verbstamm + ます (positiv)", "Verbstamm + ません (negativ)"],
  explanation:"Die **ます-Form** ist die höfliche Standardform der Verben. Man bildet sie aus dem Verbstamm (siehe Verbtypen) + **ます**; verneint + **ません**:\n- 食[た]べる → 食[た]べます / 食[た]べません\n- 行[い]く → 行[い]きます / 行[い]きません\n- する → します / しません\n- くる → 来[き]ます / 来[き]ません\n\nDas Japanische hat **keine eigene Zukunftsform**. Die ます-Form bezeichnet sowohl Gewohnheiten („Ich lese jeden Tag“) als auch zukünftige Handlungen („Ich lese morgen“). Ob Gegenwart oder Zukunft gemeint ist, zeigt der Kontext oder eine Zeitangabe.\n\nDie Verbform ändert sich **nicht nach der Person** – 行[い]きます kann „ich gehe“, „er geht“ oder „wir gehen“ bedeuten. Das Verb steht immer am **Satzende**.",
  examples:[
    { jp:"私[わたし]は毎日[まいにち]日本語[にほんご]を勉強[べんきょう]します。", de:"Ich lerne jeden Tag Japanisch." },
    { jp:"明日[あした]京都[きょうと]に行[い]きます。", de:"Morgen fahre ich nach Kyoto." },
    { jp:"私[わたし]はお酒[さけ]を飲[の]みません。", de:"Ich trinke keinen Alkohol." },
    { jp:"今日[きょう]はテレビを見[み]ません。", de:"Heute sehe ich nicht fern." }
  ],
  pitfalls:["ます-Form = Gegenwart UND Zukunft; es gibt kein eigenes Futur.","Das Verb steht immer ganz am Ende des Satzes."],
  tags:["verben","konjugation","höflich"],
  related:["g-g3-verbtypes","g-g4-mashita","g-g3-masenka"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"明日[あした]{O}を{V:masu}。",
      de:"Morgen {V:ich} ich {O:akki}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"毎日[まいにち]{V:masu}。",
      de:"Ich {V:ich} jeden Tag." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"明日[あした]は{V:masen}。",
      de:"Morgen {V:ich} ich nicht." }
  ]
},

{ id:"g-g3-wo", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Partikel を – direktes Objekt",
  jp:"Nomenを＋Verb",
  summary:"を markiert das direkte Objekt einer Handlung (deutsch: Akkusativ).",
  structure:["Objekt + を + Verb"],
  explanation:"Die Partikel **を** (gesprochen „o“) markiert das **direkte Objekt** – also das, womit etwas getan wird. Im Deutschen entspricht das meist dem **Akkusativ**: „Ich trinke *den Kaffee*“ → コーヒー**を**飲[の]みます。\n\nWeil die Partikeln die Rolle der Wörter anzeigen, ist die Wortstellung recht frei – nur das Verb muss am Ende stehen. 毎日[まいにち]コーヒーを飲[の]みます und コーヒーを毎日[まいにち]飲[の]みます bedeuten dasselbe.\n\nTypische Verben mit を: 食[た]べる (essen), 飲[の]む (trinken), 見[み]る (sehen), 聞[き]く (hören), 読[よ]む (lesen), 買[か]う (kaufen), する (machen). Das Zeichen を wird fast nur als Partikel verwendet.",
  examples:[
    { jp:"コーヒーを飲[の]みます。", de:"Ich trinke Kaffee." },
    { jp:"毎晩[まいばん]音楽[おんがく]を聞[き]きます。", de:"Ich höre jeden Abend Musik." },
    { jp:"図書館[としょかん]で本[ほん]を読[よ]みます。", de:"Ich lese in der Bibliothek ein Buch." },
    { jp:"週末[しゅうまつ]テニスをします。", de:"Am Wochenende spiele ich Tennis." }
  ],
  pitfalls:["を wird „o“ ausgesprochen.","Nicht jedes deutsche Akkusativobjekt ist im Japanischen ein を-Objekt (z. B. 友[とも]だちに会[あ]う = einen Freund treffen)."],
  tags:["partikel","objekt"],
  related:["g-g3-de","g-g3-ni-he","g-g3-masu"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:masu}。",
      de:"Ich {V:ich} {O:akki}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"毎晩[まいばん]{O}を{V:masu}。",
      de:"Jeden Abend {V:ich} ich {O:akki}." }
  ]
},

{ id:"g-g3-de", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Partikel で – Ort der Handlung",
  jp:"Ortで＋Verb",
  summary:"で markiert den Ort, an dem eine Handlung stattfindet.",
  structure:["Ort + で + (Objekt を) + Verb"],
  explanation:"**で** gibt an, **wo** eine Handlung stattfindet: 図書館[としょかん]**で**勉強[べんきょう]します。 – „Ich lerne *in der Bibliothek*.“ Im Deutschen verwendet man dafür „in“, „an“, „auf“ oder „bei“.\n\nWichtig ist der Unterschied zu に/へ: で steht bei **Tätigkeiten** an einem Ort (essen, lernen, arbeiten, lesen …). Für die **Richtung** (wohin?) nimmt man に oder へ, und für das bloße **Vorhandensein** (あります/います) nimmt man に (→ Lektion 4).\n\nで hat noch andere Bedeutungen, z. B. „mit/mittels“ (バスで – mit dem Bus, → Lektion 10).",
  examples:[
    { jp:"図書館[としょかん]で勉強[べんきょう]します。", de:"Ich lerne in der Bibliothek." },
    { jp:"喫茶店[きっさてん]でコーヒーを飲[の]みます。", de:"Ich trinke im Café Kaffee." },
    { jp:"うちで晩[ばん]ご飯[はん]を食[た]べます。", de:"Ich esse zu Hause zu Abend." },
    { jp:"学校[がっこう]でテニスをします。", de:"Ich spiele in der Schule Tennis." }
  ],
  pitfalls:["で = wo etwas GETAN wird; に = wo etwas IST oder wohin man geht."],
  tags:["partikel","ort"],
  related:["g-g3-wo","g-g3-ni-he","g-g4-arimasu-imasu","g-g10-de-means"],
  patterns:[
    { slots:{ P:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{P}で{O}を{V:masu}。",
      de:"{P:in} {V:ich} ich {O:akki}." },
    { slots:{ P:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["allein"]} },
      jp:"{P}で{V:masu}。",
      de:"Ich {V:ich} {P:in}." }
  ]
},

{ id:"g-g3-ni-he", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Partikeln に und へ – Ziel einer Bewegung",
  jp:"Ortに／へ＋行[い]く・来[く]る・帰[かえ]る",
  summary:"に und へ markieren das Ziel bei Bewegungsverben: „nach, zu, in“.",
  structure:["Ziel + に + 行[い]きます／来[き]ます／帰[かえ]ります", "Ziel + へ + 行[い]きます … (へ wird „e“ gesprochen)"],
  explanation:"Bei Verben der Bewegung – **行[い]く** (gehen/fahren), **来[く]る** (kommen), **帰[かえ]る** (zurückkehren, nach Hause gehen) – markiert man das **Ziel** mit **に** oder **へ**. Beide sind hier austauschbar. へ wird „e“ ausgesprochen und betont eher die Richtung.\n\nIm Deutschen hängt die Präposition vom Ziel ab: „**zur** Schule“, „**nach** Japan“, „**nach** Hause“, „**ins** Café“. Im Japanischen ist es immer に/へ: 学校[がっこう]に, 日本[にほん]に, うちに, 喫茶店[きっさてん]に.\n\n行[い]く bedeutet sowohl „gehen“ als auch „fahren“ – das Japanische unterscheidet hier nicht nach dem Verkehrsmittel.",
  examples:[
    { jp:"学校[がっこう]に行[い]きます。", de:"Ich gehe zur Schule." },
    { jp:"日本[にほん]へ行[い]きます。", de:"Ich fahre nach Japan." },
    { jp:"十一時[じゅういちじ]にうちに帰[かえ]ります。", de:"Ich gehe um 11 Uhr nach Hause." },
    { jp:"友[とも]だちが私[わたし]のうちに来[き]ます。", de:"Ein Freund kommt zu mir nach Hause." }
  ],
  pitfalls:["へ als Partikel wird „e“ ausgesprochen.","Für den Ort einer Tätigkeit nimmt man で, nicht に."],
  tags:["partikel","bewegung","ort"],
  related:["g-g3-de","g-g3-time","g-g7-stem-ni-iku"],
  patterns:[
    { slots:{ A:{pos:"noun", cat:["ort","land"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"{A}へ{V:masu}。",
      de:"Ich {V:ich} {A:zu}." },
    { slots:{ A:{pos:"noun", cat:["ort","land"]} },
      jp:"明日[あした]{A}に行[い]きます。",
      de:"Morgen gehe ich {A:zu}." }
  ]
},

{ id:"g-g3-time", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Zeitangaben und die Partikel に",
  jp:"Zeitに＋Verb",
  summary:"Konkrete Zeitpunkte (Uhrzeit, Wochentag) bekommen に, relative Zeitwörter wie 明日 nicht.",
  structure:["Uhrzeit/Wochentag + に: 七時[しちじ]に、日曜日[にちようび]に", "OHNE に: 今日[きょう], 明日[あした], 毎日[まいにち], 今[いま], 週末[しゅうまつ] …"],
  explanation:"Wenn man sagt, **wann** etwas passiert, braucht man bei **konkreten Zeitpunkten** die Partikel **に**:\n- 七時[しちじ]**に**起[お]きます。 – Ich stehe um 7 Uhr auf.\n- 日曜日[にちようび]**に**京都[きょうと]に行[い]きます。 – Am Sonntag fahre ich nach Kyoto.\n\n**Kein に** steht bei Zeitwörtern, die sich auf „jetzt“ beziehen oder regelmäßig sind:\n- 今日[きょう] (heute), 明日[あした] (morgen), 今晩[こんばん] (heute Abend)\n- 毎日[まいにち] (jeden Tag), 毎晩[まいばん] (jeden Abend), 今[いま] (jetzt)\n\nBei 週末[しゅうまつ] (Wochenende) und Tageszeiten wie 朝[あさ] (morgens) ist に optional. Die Zeitangabe steht meistens am Satzanfang oder direkt nach dem Thema. „ungefähr“ ist **ごろ**: 七時[しちじ]ごろ起[お]きます。",
  examples:[
    { jp:"毎日[まいにち]七時[しちじ]に起[お]きます。", de:"Ich stehe jeden Tag um 7 Uhr auf." },
    { jp:"土曜日[どようび]に映画[えいが]を見[み]ます。", de:"Am Samstag sehe ich einen Film." },
    { jp:"今晩[こんばん]テレビを見[み]ます。", de:"Heute Abend sehe ich fern." },
    { jp:"十二時[じゅうにじ]ごろ寝[ね]ます。", de:"Ich gehe gegen 12 Uhr schlafen." }
  ],
  pitfalls:["Kein に nach 今日[きょう], 明日[あした], 毎日[まいにち], 今[いま] (❌ 明日[あした]に).","ごろ = „ungefähr“ bei Uhrzeiten."],
  tags:["zeit","partikel"],
  related:["g-g1-numbers-time","g-g3-ni-he","g-g3-frequency"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"七時[しちじ]に{V:masu}。",
      de:"Ich {V:ich} um sieben Uhr." },
    { slots:{ A:{pos:"noun", cat:["ort","land"]} },
      jp:"日曜日[にちようび]に{A}へ行[い]きます。",
      de:"Am Sonntag gehe ich {A:zu}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"土曜日[どようび]に{O}を{V:masu}。",
      de:"Am Samstag {V:ich} ich {O:akki}." }
  ]
},

{ id:"g-g3-masenka", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Einladungen mit 〜ませんか",
  jp:"〜ませんか",
  summary:"Mit der verneinten Frage 〜ませんか lädt man höflich zu etwas ein: „Wollen wir nicht …?“",
  structure:["Verbstamm + ませんか。"],
  explanation:"Mit **〜ませんか** („… nicht?“) spricht man eine höfliche **Einladung** aus – ähnlich wie im Deutschen „Wollen wir nicht …?“ oder „Hast du Lust, … zu …?“. Wörtlich ist es eine verneinte Frage, gemeint ist aber ein Vorschlag.\n\n一緒[いっしょ]に (zusammen) passt oft dazu: 一緒[いっしょ]に映画[えいが]を見[み]ませんか。\n\nAntworten:\n- Zusage: **いいですね。** („Gute Idee!“)\n- Absage: **ちょっと…** mit zögernder Stimme. Ein direktes „Nein“ vermeidet man; oft nennt man einen Grund: 明日[あした]はちょっと…。",
  examples:[
    { jp:"一緒[いっしょ]に昼[ひる]ご飯[はん]を食[た]べませんか。", de:"Wollen wir nicht zusammen zu Mittag essen?" },
    { jp:"土曜日[どようび]に京都[きょうと]に行[い]きませんか。", de:"Wollen wir am Samstag nach Kyoto fahren?" },
    { jp:"コーヒーを飲[の]みませんか。", de:"Wollen wir einen Kaffee trinken?" },
    { jp:"ええ、いいですね。", de:"Ja, gute Idee!" }
  ],
  pitfalls:["Absagen macht man indirekt (ちょっと…), nicht mit einem harten いいえ."],
  tags:["einladung","verben","gespräch"],
  related:["g-g5-mashou","g-g6-mashouka","g-g3-masu"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"一緒[いっしょ]に{O}を{V:masenka}。",
      de:"Wollen wir zusammen {O:akki} {V:inf}?" },
    { slots:{ A:{pos:"noun", cat:["ort","land"]} },
      jp:"週末[しゅうまつ]、一緒[いっしょ]に{A}へ行[い]きませんか。",
      de:"Wollen wir am Wochenende zusammen {A:zu} gehen?",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] }
  ]
},

{ id:"g-g3-frequency", type:"grammar", source:"Genki I", lesson:3, level:"N5",
  title:"Häufigkeitsadverbien: よく・時々・あまり・ぜんぜん",
  jp:"よく／時々[ときどき]／あまり〜ません／ぜんぜん〜ません",
  summary:"Adverbien, die angeben, wie oft man etwas tut – あまり und ぜんぜん nur mit Verneinung.",
  structure:["よく + Verb-ます (oft)", "時々[ときどき] + Verb-ます (manchmal)", "あまり + Verb-ません (nicht oft)", "ぜんぜん + Verb-ません (überhaupt nie)"],
  explanation:"Diese Adverbien stehen **vor dem Verb** oder vor dem Objekt:\n- **よく** – oft: よくテレビを見[み]ます。\n- **時々[ときどき]** – manchmal: 時々[ときどき]本[ほん]を読[よ]みます。\n- **あまり** – nicht oft / nicht sehr: あまりテレビを見[み]**ません**。\n- **ぜんぜん** – überhaupt nicht / nie: ぜんぜんお酒[さけ]を飲[の]み**ません**。\n\nWichtig: **あまり** und **ぜんぜん** stehen **immer mit einer verneinten Form** (〜ません). Im Deutschen enthält „nie“ die Verneinung schon; im Japanischen braucht man sie zusätzlich am Verb.\n\nEine Antwort ohne Verb geht auch: 「よく映画[えいが]を見[み]ますか。」「いいえ、あまり。」",
  examples:[
    { jp:"私[わたし]はよく図書館[としょかん]に行[い]きます。", de:"Ich gehe oft in die Bibliothek." },
    { jp:"時々[ときどき]友[とも]だちと昼[ひる]ご飯[はん]を食[た]べます。", de:"Manchmal esse ich mit Freunden zu Mittag." },
    { jp:"たけしさんはあまり勉強[べんきょう]しません。", de:"Takeshi lernt nicht viel." },
    { jp:"私[わたし]はぜんぜんテレビを見[み]ません。", de:"Ich sehe überhaupt nicht fern." }
  ],
  pitfalls:["あまり und ぜんぜん immer mit Verneinung (❌ あまり見[み]ます)."],
  tags:["adverbien","häufigkeit","verneinung"],
  related:["g-g3-masu","g-g3-time"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"よく{O}を{V:masu}。",
      de:"Ich {V:ich} oft {O:akki}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"時々[ときどき]{O}を{V:masu}。",
      de:"Manchmal {V:ich} ich {O:akki}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"週末[しゅうまつ]はぜんぜん{V:masen}。",
      de:"Am Wochenende {V:ich} ich überhaupt nicht." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"あまり{V:masen}。",
      de:"Ich {V:ich} nicht oft." }
  ]
},

// ───────────── Lektion 4 ─────────────
{ id:"g-g4-arimasu-imasu", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"あります／います – „es gibt, sich befinden, haben“",
  jp:"Xがあります／Xがいます",
  summary:"Existenzverben: あります für Dinge, います für Menschen und Tiere.",
  structure:["Ort に Ding が あります。", "Ort に Person/Tier が います。", "X は Ort に あります／います。"],
  explanation:"Das Japanische hat zwei Verben für „es gibt / sich befinden“:\n- **あります** – für **unbelebte** Dinge, Pflanzen und Ereignisse (Buch, Bank, Party, Test)\n- **います** – für **Lebewesen**, die sich selbst bewegen (Menschen, Tiere)\n\nDas, was existiert, wird mit **が** markiert, der Ort mit **に** (nicht で!): あそこに銀行[ぎんこう]**が**あります。 – „Dort drüben gibt es eine Bank.“\n\nあります bedeutet außerdem „haben“ bei Dingen und Terminen: 明日[あした]テストがあります。 – „Morgen habe ich einen Test.“ Für Geschwister, Freunde usw. sagt man います: 妹[いもうと]がいます。 – „Ich habe eine jüngere Schwester.“\n\nVerneint: **ありません** / **いません**.",
  examples:[
    { jp:"あそこにコンビニがあります。", de:"Dort drüben gibt es einen Supermarkt." },
    { jp:"公園[こうえん]に犬[いぬ]がいます。", de:"Im Park ist ein Hund." },
    { jp:"明日[あした]日本語[にほんご]のテストがあります。", de:"Morgen habe ich einen Japanischtest." },
    { jp:"私[わたし]は兄弟[きょうだい]がいません。", de:"Ich habe keine Geschwister." },
    { jp:"時間[じかん]がありません。", de:"Ich habe keine Zeit." }
  ],
  pitfalls:["Der Ort bei あります/います bekommt に, nicht で.","Tiere und Menschen: います; Dinge und Ereignisse: あります."],
  tags:["verben","existenz","partikel"],
  related:["g-g4-position","g-g3-de","g-g7-counter-people"],
  patterns:[
    { slots:{ A:{pos:"noun", cat:["ort"]}, N:{pos:"noun", cat:["ding"]} },
      jp:"{A}に{N}があります。",
      de:"{A:in} gibt es {N:akki}." },
    { slots:{ A:{pos:"noun", cat:["ort"]}, P:{pos:"noun", cat:["person","tier"]} },
      jp:"{A}に{P}がいます。",
      de:"{A:in} ist {P:indef}." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"明日[あした]{E}があります。",
      de:"Morgen gibt es {E:akki}." }
  ]
},

{ id:"g-g4-position", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"Positionswörter: 上・下・中・前・後ろ・隣 …",
  jp:"XはYの上[うえ]／前[まえ]／隣[となり]…です",
  summary:"Lageangaben bildet man mit „Bezugsobjekt の Positionswort“.",
  structure:["X は Y の + Positionswort + です／にあります。"],
  explanation:"Um zu sagen, *wo genau* etwas ist, verwendet man ein **Positionswort** nach „Y の“:\n- 上[うえ] – auf / über\n- 下[した] – unter\n- 中[なか] – in / innen\n- 前[まえ] – vor\n- 後[うし]ろ – hinter\n- 隣[となり] – neben\n- 近[ちか]く – in der Nähe von\n- 右[みぎ] / 左[ひだり] – rechts / links\n- 間[あいだ] – zwischen (X と Y の間[あいだ])\n\nDie Reihenfolge ist umgekehrt zum Deutschen: „**auf dem Tisch**“ = 机[つくえ]**の上[うえ]** (wörtlich „des Tisches Oberseite“). Diese Wörter sind Nomen, deshalb braucht man の.\n\nAm Satzende steht entweder **です** oder, wenn man die Existenz betonen will, **にあります／にいます**: 本[ほん]は机[つくえ]の上[うえ]です／にあります。 Beides bedeutet „Das Buch ist auf dem Tisch“.",
  examples:[
    { jp:"本[ほん]は机[つくえ]の上[うえ]にあります。", de:"Das Buch liegt auf dem Tisch." },
    { jp:"銀行[ぎんこう]は図書館[としょかん]の隣[となり]です。", de:"Die Bank ist neben der Bibliothek." },
    { jp:"猫[ねこ]は椅子[いす]の下[した]にいます。", de:"Die Katze ist unter dem Stuhl." },
    { jp:"郵便局[ゆうびんきょく]は病院[びょういん]と銀行[ぎんこう]の間[あいだ]です。", de:"Die Post ist zwischen dem Krankenhaus und der Bank." }
  ],
  pitfalls:["Reihenfolge: Bezugsobjekt の Position (机[つくえ]の上[うえ]), nicht umgekehrt.","Positionswörter sind Nomen – das の nicht vergessen."],
  tags:["ort","position","nomen"],
  related:["g-g4-arimasu-imasu","g-g2-koko"],
  patterns:[
    { slots:{ A:{pos:"noun", cat:["ort"]}, B:{pos:"noun", cat:["ort"]} },
      jp:"{A}は{B}の隣[となり]です。",
      de:"{A:def} ist neben {B:dat}.",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] },
    { slots:{ A:{pos:"noun", cat:["ort"]}, B:{pos:"noun", cat:["ort"]} },
      jp:"{A}は{B}の前[まえ]です。",
      de:"{A:def} ist vor {B:dat}.",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] },
    { slots:{ A:{pos:"noun", cat:["ort"]}, B:{pos:"noun", cat:["ort"]} },
      jp:"{A}は{B}の後[うし]ろです。",
      de:"{A:def} ist hinter {B:dat}.",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] }
  ]
},

{ id:"g-g4-deshita", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"Vergangenheit von です: でした／じゃなかったです",
  jp:"〜でした／〜じゃなかったです",
  summary:"„war“ und „war nicht“ bei Nomen.",
  structure:["Nomen + でした (war)", "Nomen + じゃなかったです (war nicht)", "förmlich: Nomen + ではありませんでした"],
  explanation:"Die Vergangenheit von です ist **でした**: 学生[がくせい]でした。 – „Ich war Student.“\n\nDie verneinte Vergangenheit bildet man aus じゃないです: das い von ない wird zu **かった** → **じゃなかったです** („war nicht“). Förmlicher klingt **じゃありませんでした** bzw. **ではありませんでした**.\n\nÜbersicht:\n- Gegenwart: 〜です / 〜じゃないです\n- Vergangenheit: 〜でした / 〜じゃなかったです\n\nDiese Formen gelten für Nomen und (ab Lektion 5) für な-Adjektive. い-Adjektive haben eigene Formen.",
  examples:[
    { jp:"昨日[きのう]は月曜日[げつようび]でした。", de:"Gestern war Montag." },
    { jp:"子供[こども]の時[とき]、私[わたし]は野球[やきゅう]の選手[せんしゅ]でした。", de:"Als Kind war ich Baseballspieler." },
    { jp:"テストは昨日[きのう]じゃなかったです。", de:"Der Test war nicht gestern." },
    { jp:"パーティーは日曜日[にちようび]でしたか。", de:"War die Party am Sonntag?" }
  ],
  pitfalls:["い-Adjektive NICHT mit でした (❌ 高[たか]いでした → 高[たか]かったです, Lektion 5)."],
  tags:["vergangenheit","kopula"],
  related:["g-g2-janai","g-g4-mashita","g-g5-adj-conjugation"],
  patterns:[
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は昨日[きのう]でした。",
      de:"{E:def} war gestern." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は日曜日[にちようび]じゃなかったです。",
      de:"{E:def} war nicht am Sonntag." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は月曜日[げつようび]でしたか。",
      de:"War {E:def} am Montag?" }
  ]
},

{ id:"g-g4-mashita", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"Vergangenheit von Verben: 〜ました／〜ませんでした",
  jp:"〜ました／〜ませんでした",
  summary:"Höfliche Vergangenheitsformen der Verben.",
  structure:["Verbstamm + ました (positiv)", "Verbstamm + ませんでした (negativ)"],
  explanation:"Die Vergangenheit der ます-Form bildet man ganz regelmäßig:\n- ます → **ました**: 食[た]べました (aß / habe gegessen)\n- ません → **ませんでした**: 食[た]べませんでした (aß nicht / habe nicht gegessen)\n\nBeispiele für alle Verbtypen:\n- 行[い]く → 行[い]きました / 行[い]きませんでした\n- 見[み]る → 見[み]ました / 見[み]ませんでした\n- する → しました / しませんでした\n- くる → 来[き]ました / 来[き]ませんでした\n\nDas Japanische unterscheidet nicht zwischen Präteritum und Perfekt. Im Deutschen übersetzt man im Gespräch meist mit dem **Perfekt**: 昨日[きのう]映画[えいが]を見[み]ました。 – „Gestern habe ich einen Film gesehen.“",
  examples:[
    { jp:"昨日[きのう]、図書館[としょかん]で勉強[べんきょう]しました。", de:"Gestern habe ich in der Bibliothek gelernt." },
    { jp:"週末[しゅうまつ]に京都[きょうと]に行[い]きました。", de:"Am Wochenende bin ich nach Kyoto gefahren." },
    { jp:"今朝[けさ]、朝[あさ]ご飯[はん]を食[た]べませんでした。", de:"Heute Morgen habe ich nicht gefrühstückt." },
    { jp:"メアリーさんは先週[せんしゅう]手紙[てがみ]を書[か]きました。", de:"Mary hat letzte Woche einen Brief geschrieben." }
  ],
  tags:["verben","vergangenheit","konjugation"],
  related:["g-g3-masu","g-g4-deshita","g-g9-short-past"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"昨日[きのう]{O}を{V:mashita}。",
      de:"Gestern {V:aux} ich {O:akki} {V:pp}." },
    { slots:{ A:{pos:"noun", cat:["ort","land"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"昨日[きのう]{A}へ{V:mashita}。",
      de:"Gestern {V:aux} ich {A:zu} {V:pp}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"先週[せんしゅう]は{V:masendeshita}。",
      de:"Letzte Woche {V:aux} ich nicht {V:pp}." }
  ]
},

{ id:"g-g4-mo", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"も bei Verben und mit anderen Partikeln",
  jp:"〜も／〜にも／〜でも",
  summary:"も ersetzt は・が・を, wird aber an に・で・と angehängt.",
  structure:["Objekt + も (statt を)", "Ort + にも／へも／でも", "Person + とも"],
  explanation:"In Lektion 2 hast du も bei Nomen-Sätzen gelernt. Auch in Verbsätzen bedeutet も „auch“ – dabei gilt:\n- **は, が, を** werden durch も **ersetzt**: コーヒーを飲[の]みました。紅茶[こうちゃ]**も**飲[の]みました。\n- **Andere Partikeln** (に, へ, で, と) bleiben stehen, も wird **angehängt**: 京都[きょうと]に行[い]きました。大阪[おおさか]**にも**行[い]きました。\n\nMit einem verneinten Verb bedeutet も „auch nicht“: 私[わたし]**も**行[い]きません。 – „Ich gehe auch nicht.“\n\nIm Deutschen verschiebt man „auch“ einfach im Satz; im Japanischen steht も immer direkt hinter dem Wort, auf das es sich bezieht.",
  examples:[
    { jp:"本[ほん]を買[か]いました。雑誌[ざっし]も買[か]いました。", de:"Ich habe ein Buch gekauft. Ich habe auch eine Zeitschrift gekauft." },
    { jp:"たけしさんは東京[とうきょう]にも行[い]きました。", de:"Takeshi ist auch nach Tokio gefahren." },
    { jp:"図書館[としょかん]でも勉強[べんきょう]します。", de:"Ich lerne auch in der Bibliothek." },
    { jp:"私[わたし]も昨日[きのう]テレビを見[み]ませんでした。", de:"Ich habe gestern auch nicht ferngesehen." }
  ],
  pitfalls:["❌ をも / ❌ はも – も ersetzt diese Partikeln.","✔ にも, でも, とも – hier bleibt die Partikel stehen."],
  tags:["partikel","auch"],
  related:["g-g2-mo","g-g4-mashita"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}も{V:mashita}。",
      de:"Ich {V:aux} auch {O:akki} {V:pp}." },
    { slots:{ A:{pos:"noun", cat:["ort","land"]} },
      jp:"{A}にも行[い]きました。",
      de:"Ich bin auch {A:zu} gegangen." },
    { slots:{ P:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["allein"]} },
      jp:"{P}でも{V:masu}。",
      de:"Ich {V:ich} auch {P:in}." }
  ]
},

{ id:"g-g4-jikan", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"〜時間 – Zeitdauer in Stunden",
  jp:"〜時間[じかん]",
  summary:"Zahl + 時間 gibt an, wie viele Stunden etwas dauert.",
  structure:["Zahl + 時間[じかん] + Verb (ohne Partikel)", "〜時間半[じかんはん] = … einhalb Stunden"],
  explanation:"**時間[じかん]** nach einer Zahl bedeutet „… Stunden (lang)“. Verwechsle es nicht mit **時[じ]** (Uhrzeit):\n- 二時[にじ] – zwei Uhr\n- 二時間[にじかん] – zwei Stunden\n\nDauerangaben stehen **ohne Partikel** direkt vor dem Verb: 毎日[まいにち]三時間[さんじかん]勉強[べんきょう]します。 – „Ich lerne jeden Tag drei Stunden.“\n\nEine halbe Stunde mehr: 一時間半[いちじかんはん] (anderthalb Stunden). Ungefähr: **〜時間[じかん]ぐらい** („etwa … Stunden“). Fragewort: **何時間[なんじかん]** – „wie viele Stunden?“. Achtung: 4 Stunden = よじかん, 7 = しちじかん / ななじかん, 9 = くじかん.",
  examples:[
    { jp:"毎日[まいにち]二時間[にじかん]日本語[にほんご]を勉強[べんきょう]します。", de:"Ich lerne jeden Tag zwei Stunden Japanisch." },
    { jp:"昨日[きのう]は八時間[はちじかん]寝[ね]ました。", de:"Gestern habe ich acht Stunden geschlafen." },
    { jp:"一時間[いちじかん]ぐらい待[ま]ちました。", de:"Ich habe ungefähr eine Stunde gewartet." },
    { jp:"何時間[なんじかん]テレビを見[み]ますか。", de:"Wie viele Stunden siehst du fern?" }
  ],
  pitfalls:["時[じ] = Uhrzeit, 時間[じかん] = Dauer.","Keine Partikel nach 〜時間[じかん] (❌ 二時間[にじかん]に)."],
  tags:["zeit","dauer","zahlen"],
  related:["g-g1-numbers-time","g-g3-time"],
  patterns:[
    { slots:{ V:{pos:"verb", ids:["v-g3-neru","v-g3-benkyousuru","v-g4-matsu","v-g5-oyogu","v-g7-utau","v-g8-soujisuru","v-g8-ryourisuru","v-g9-odoru","v-g9-undousuru","v-g10-renshuusuru","v-g10-aruku"]} },
      jp:"毎日[まいにち]二時間[にじかん]{V:masu}。",
      de:"Ich {V:ich} jeden Tag zwei Stunden.",
      not:["v-g3-okiru","v-g3-kaeru","v-g3-kuru","v-g3-iku"] },
    { slots:{ V:{pos:"verb", ids:["v-g3-neru","v-g3-benkyousuru","v-g4-matsu","v-g5-oyogu","v-g7-utau","v-g8-soujisuru","v-g8-ryourisuru","v-g9-odoru","v-g9-undousuru","v-g10-renshuusuru","v-g10-aruku"]} },
      jp:"昨日[きのう]は三時間[さんじかん]{V:mashita}。",
      de:"Gestern {V:aux} ich drei Stunden {V:pp}.",
      not:["v-g3-okiru","v-g3-kaeru","v-g3-kuru","v-g3-iku"] }
  ]
},

{ id:"g-g4-takusan", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"たくさん – „viel, viele“",
  jp:"たくさん",
  summary:"たくさん drückt eine große Menge aus und steht meist direkt vor dem Verb.",
  structure:["Nomen + を + たくさん + Verb", "たくさんの + Nomen"],
  explanation:"**たくさん** bedeutet „viel“ oder „viele“. Es funktioniert meistens wie ein Adverb und steht **nach der Partikel, direkt vor dem Verb**:\n- 写真[しゃしん]を**たくさん**撮[と]りました。 – Ich habe viele Fotos gemacht.\n- 友[とも]だちが**たくさん**います。 – Ich habe viele Freunde.\n\nMan kann es auch mit の vor ein Nomen stellen (たくさんの人[ひと] – viele Menschen), die Adverb-Stellung ist aber natürlicher.\n\nDa das Japanische keinen Plural hat, übernimmt たくさん die Aufgabe, eine Menge anzuzeigen: 本[ほん]がたくさんあります = „Es gibt viele Bücher.“",
  examples:[
    { jp:"京都[きょうと]で写真[しゃしん]をたくさん撮[と]りました。", de:"In Kyoto habe ich viele Fotos gemacht." },
    { jp:"メアリーさんは友[とも]だちがたくさんいます。", de:"Mary hat viele Freunde." },
    { jp:"昨日[きのう]、コーヒーをたくさん飲[の]みました。", de:"Gestern habe ich viel Kaffee getrunken." },
    { jp:"図書館[としょかん]に本[ほん]がたくさんあります。", de:"In der Bibliothek gibt es viele Bücher." }
  ],
  tags:["menge","adverbien"],
  related:["g-g3-frequency","g-g4-arimasu-imasu"],
  patterns:[
    { slots:{ G:{pos:"noun", cat:["getraenk"]} },
      jp:"昨日[きのう]、{G}をたくさん飲[の]みました。",
      de:"Gestern habe ich viel {G:w} getrunken." },
    { slots:{ P:{pos:"noun", cat:["ort"]}, G:{pos:"noun", cat:["getraenk"]} },
      jp:"{P}で{G}をたくさん飲[の]みました。",
      de:"{P:in} habe ich viel {G:w} getrunken." }
  ]
},

{ id:"g-g4-to", type:"grammar", source:"Genki I", lesson:4, level:"N5",
  title:"Partikel と – „und“ und „mit“",
  jp:"AとB／Personと",
  summary:"と verbindet Nomen („A und B“) und nennt Begleiter („mit“).",
  structure:["Nomen A と Nomen B (und)", "Person と + Verb (mit jemandem zusammen)"],
  explanation:"**と** hat zwei wichtige Funktionen:\n\n**1. „und“ zwischen Nomen**: 本[ほん]と雑誌[ざっし]を買[か]いました。 – „Ich habe ein Buch und eine Zeitschrift gekauft.“ と verbindet **nur Nomen**, niemals Sätze oder Verben (dafür gibt es die て-Form, Lektion 6).\n\n**2. „mit“ (zusammen mit einer Person)**: 友[とも]だちと映画[えいが]を見[み]ました。 – „Ich habe mit einem Freund einen Film gesehen.“ Oft kommt 一緒[いっしょ]に dazu: 友[とも]だちと一緒[いっしょ]に.\n\nAchtung: „mit“ im Sinne eines Werkzeugs (mit Stäbchen, mit dem Bus) ist **で**, nicht と.",
  examples:[
    { jp:"パンと卵[たまご]を食[た]べました。", de:"Ich habe Brot und Eier gegessen." },
    { jp:"友[とも]だちと京都[きょうと]に行[い]きました。", de:"Ich bin mit einem Freund nach Kyoto gefahren." },
    { jp:"たけしさんとメアリーさんは学生[がくせい]です。", de:"Takeshi und Mary sind Studenten." },
    { jp:"日曜日[にちようび]に母[はは]と一緒[いっしょ]に買[か]い物[もの]をしました。", de:"Am Sonntag war ich mit meiner Mutter einkaufen." }
  ],
  pitfalls:["と verbindet nur Nomen, keine Sätze.","Werkzeug/Mittel: で (はしで食[た]べる), nicht と."],
  tags:["partikel","und","mit"],
  related:["g-g11-ya","g-g10-de-means","g-g6-te-connect"],
  patterns:[
    { slots:{ A:{pos:"noun", cat:["ort","land"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"友[とも]だちと{A}へ{V:mashita}。",
      de:"Ich {V:aux} mit einem Freund {A:zu} {V:pp}." },
    { slots:{ N:{pos:"noun", cat:["ding"]}, M:{pos:"noun", cat:["ding"]} },
      jp:"{N}と{M}を買[か]いました。",
      de:"Ich habe {N:akki} und {M:akki} gekauft." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"友[とも]だちと一緒[いっしょ]に{O}を{V:masu}。",
      de:"Ich {V:ich} mit einem Freund zusammen {O:akki}." }
  ]
},

// ───────────── Lektion 5 ─────────────
{ id:"g-g5-adjectives", type:"grammar", source:"Genki I", lesson:5, level:"N5",
  title:"Adjektive: い-Adjektive und な-Adjektive",
  jp:"い形容詞[けいようし]／な形容詞[けいようし]",
  summary:"Japanische Adjektive gibt es in zwei Gruppen, die sich vor Nomen und bei der Konjugation unterscheiden.",
  structure:["Prädikativ: X は 高[たか]い です／X は 静[しず]か です", "Vor Nomen: 高[たか]い本[ほん]／静[しず]かな町[まち]"],
  explanation:"**い-Adjektive** enden auf い: 高[たか]い (teuer, hoch), 大[おお]きい (groß), おもしろい (interessant). **な-Adjektive** bekommen vor einem Nomen ein **な**: 静[しず]か**な**町[まち] (eine ruhige Stadt), 元気[げんき]**な**人[ひと] (ein fröhlicher Mensch).\n\n**Als Prädikat** (am Satzende) folgt einfach です:\n- この本[ほん]は高[たか]いです。 – Dieses Buch ist teuer.\n- この町[まち]は静[しず]かです。 – Diese Stadt ist ruhig.\n\n**Vor einem Nomen** (attributiv):\n- い-Adjektiv direkt: 高[たか]い本[ほん]\n- な-Adjektiv mit な: 静[しず]かな町[まち]\n\nAnders als im Deutschen werden Adjektive vor Nomen **nicht nach Geschlecht oder Fall** gebeugt („ein großer Hund / eine große Katze“ – im Japanischen immer 大[おお]きい). Verstärken kann man mit **とても** (sehr), abschwächen mit **あまり〜ない** (nicht sehr).\n\nAchtung Falle: きれい (schön, sauber) und きらい (nicht mögen) sind **な-Adjektive**, obwohl sie auf い enden.",
  examples:[
    { jp:"この時計[とけい]はとても高[たか]いです。", de:"Diese Uhr ist sehr teuer." },
    { jp:"京都[きょうと]はきれいな町[まち]です。", de:"Kyoto ist eine schöne Stadt." },
    { jp:"たけしさんは元気[げんき]です。", de:"Takeshi geht es gut / ist munter." },
    { jp:"おもしろい映画[えいが]を見[み]ました。", de:"Ich habe einen interessanten Film gesehen." }
  ],
  pitfalls:["きれい, ゆうめい, きらい sind な-Adjektive.","Kein な am Satzende (❌ 静[しず]かなです)."],
  tags:["adjektive","grundlagen"],
  related:["g-g5-adj-conjugation","g-g5-suki-kirai","g-g7-adj-te"],
  patterns:[
    { slots:{ A:{pos:"adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"{N}は{A:desu}。",
      de:"{N:def} ist {A:de}." },
    { slots:{ A:{pos:"adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"この{N}はとても{A:desu}。",
      de:"{N:def} hier ist sehr {A:de}." },
    { slots:{ A:{pos:"adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"{N}は{A:desu}か。",
      de:"Ist {N:def} {A:de}?" }
  ]
},

{ id:"g-g5-adj-conjugation", type:"grammar", source:"Genki I", lesson:5, level:"N5",
  title:"Konjugation der Adjektive (Verneinung, Vergangenheit)",
  jp:"〜くないです／〜かったです／〜じゃないです／〜でした",
  summary:"い-Adjektive konjugieren selbst, な-Adjektive konjugieren wie Nomen + です.",
  structure:["い-Adj.: 高[たか]いです → 高[たか]くないです → 高[たか]かったです → 高[たか]くなかったです", "な-Adj.: 静[しず]かです → 静[しず]かじゃないです → 静[しず]かでした → 静[しず]かじゃなかったです"],
  explanation:"**い-Adjektive** tragen die Zeit und die Verneinung selbst. Man ersetzt das letzte い:\n- Gegenwart: 高[たか]**い**です – ist teuer\n- verneint: 高[たか]**くない**です – ist nicht teuer\n- Vergangenheit: 高[たか]**かった**です – war teuer\n- verneinte Vergangenheit: 高[たか]**くなかった**です – war nicht teuer\n\n**な-Adjektive** verhalten sich wie Nomen – nur です ändert sich:\n- 静[しず]かです / 静[しず]かじゃないです / 静[しず]かでした / 静[しず]かじゃなかったです\n\n**Ausnahme いい** (gut): Die Formen werden von よい gebildet: よくないです, よかったです, よくなかったです.\n\nHäufiger Fehler: ❌ 高[たか]いでした. Bei い-Adjektiven zeigt das Adjektiv selbst die Vergangenheit, です bleibt immer です.",
  examples:[
    { jp:"昨日[きのう]は暑[あつ]かったです。", de:"Gestern war es heiß." },
    { jp:"この映画[えいが]はあまりおもしろくないです。", de:"Dieser Film ist nicht sehr interessant." },
    { jp:"テストは簡単[かんたん]じゃなかったです。", de:"Der Test war nicht einfach." },
    { jp:"旅行[りょこう]はとてもよかったです。", de:"Die Reise war sehr gut." },
    { jp:"町[まち]は静[しず]かでした。", de:"Die Stadt war ruhig." }
  ],
  pitfalls:["❌ 高[たか]いでした → ✔ 高[たか]かったです.","いい → よくない, よかった (nicht いくない)."],
  tags:["adjektive","konjugation","vergangenheit"],
  related:["g-g5-adjectives","g-g4-deshita","g-g2-janai"],
  patterns:[
    { slots:{ A:{pos:"adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"{N}は{A:neg}。",
      de:"{N:def} ist nicht {A:de}." },
    { slots:{ A:{pos:"adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"{N}は{A:past}。",
      de:"{N:def} war {A:de}." },
    { slots:{ A:{pos:"adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"{N}はあまり{A:pastneg}。",
      de:"{N:def} war nicht sehr {A:de}." }
  ]
},

{ id:"g-g5-suki-kirai", type:"grammar", source:"Genki I", lesson:5, level:"N5",
  title:"好き・きらい – mögen und nicht mögen",
  jp:"Xが好[す]きです／Xがきらいです",
  summary:"Vorlieben drückt man mit den な-Adjektiven 好き und きらい aus; das Gemochte wird mit が markiert.",
  structure:["(私[わたし]は) X が 好[す]きです。", "X が きらいです。", "X が 大好[だいす]きです／大[だい]きらいです。"],
  explanation:"„Mögen“ ist im Japanischen **kein Verb**, sondern das な-Adjektiv **好[す]き**. Wörtlich heißt 私[わたし]はコーヒーが好[す]きです etwa: „Was mich angeht, Kaffee ist beliebt.“ Deshalb wird das, was man mag, mit **が** markiert – nicht mit を!\n\nAbstufungen:\n- **大好[だいす]き** – sehr gern mögen, lieben\n- **好[す]き** – mögen\n- **あまり好[す]きじゃない** – nicht besonders mögen\n- **きらい** – nicht mögen\n- **大[だい]きらい** – hassen\n\nWeil es Adjektive sind, konjugieren sie wie な-Adjektive: 好[す]きじゃないです, 好[す]きでした. Vor Nomen: 好[す]きな食[た]べ物[もの] – Lieblingsessen. Im Deutschen sagt man oft „gern“: Ich trinke gern Kaffee.",
  examples:[
    { jp:"私[わたし]は日本[にほん]の映画[えいが]が好[す]きです。", de:"Ich mag japanische Filme." },
    { jp:"たけしさんは魚[さかな]がきらいです。", de:"Takeshi mag keinen Fisch." },
    { jp:"メアリーさんは猫[ねこ]が大好[だいす]きです。", de:"Mary liebt Katzen." },
    { jp:"好[す]きな食[た]べ物[もの]は何[なん]ですか。", de:"Was ist dein Lieblingsessen?" }
  ],
  pitfalls:["Das Gemochte bekommt が, nicht を (❌ コーヒーを好[す]きです).","きらい ist ein な-Adjektiv: きらいな人[ひと], きらいじゃないです."],
  tags:["adjektive","vorlieben","partikel"],
  related:["g-g5-adjectives","g-g8-noga-suki","g-g10-yori"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["getraenk","essen","sport"]} },
      jp:"私[わたし]は{N}が好[す]きです。",
      de:"Ich mag {N:akk}." },
    { slots:{ N:{pos:"noun", cat:["getraenk","essen","sport"]} },
      jp:"{N}はあまり好[す]きじゃないです。",
      de:"Ich mag {N:akk} nicht so sehr." },
    { slots:{ N:{pos:"noun", cat:["getraenk","essen","sport","fach"]} },
      jp:"{N}が大好[だいす]きです。",
      de:"Ich liebe {N:akk}." }
  ]
},

{ id:"g-g5-mashou", type:"grammar", source:"Genki I", lesson:5, level:"N5",
  title:"〜ましょう – „Lass(t) uns …!“",
  jp:"〜ましょう",
  summary:"Mit Verbstamm + ましょう macht man einen Vorschlag: „Lass uns …!“",
  structure:["Verbstamm + ましょう。", "Verbstamm + ましょうか。 (vorsichtiger Vorschlag)"],
  explanation:"**〜ましょう** entspricht „Lass uns …!“ oder „Wollen wir …!“. Man bildet es mit dem Verbstamm: 行[い]き**ましょう**, 食[た]べ**ましょう**, し**ましょう**.\n\nUnterschied zu 〜ませんか (Lektion 3): 〜ませんか ist eine *Einladung*, bei der der andere noch ablehnen kann („Wollen wir nicht …?“). 〜ましょう ist ein *direkter Vorschlag* oder die Zustimmung zu einer Einladung:\n- A: 一緒[いっしょ]に行[い]きませんか。 – Wollen wir zusammen hingehen?\n- B: ええ、行[い]きましょう。 – Ja, lass uns gehen!\n\nMit **か** wird der Vorschlag zurückhaltender: 行[い]きましょうか。 – „Sollen wir gehen?“",
  examples:[
    { jp:"一緒[いっしょ]に写真[しゃしん]を撮[と]りましょう。", de:"Lass uns zusammen ein Foto machen!" },
    { jp:"喫茶店[きっさてん]でコーヒーを飲[の]みましょう。", de:"Lass uns im Café einen Kaffee trinken!" },
    { jp:"ええ、行[い]きましょう。", de:"Ja, lass uns gehen!" },
    { jp:"九時[くじ]に会[あ]いましょうか。", de:"Sollen wir uns um 9 Uhr treffen?" }
  ],
  tags:["vorschlag","verben","gespräch"],
  related:["g-g3-masenka","g-g6-mashouka"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"一緒[いっしょ]に{O}を{V:mashou}。",
      de:"Lass uns zusammen {O:akki} {V:inf}!" },
    { slots:{ A:{pos:"noun", cat:["ort","land"]} },
      jp:"{A}へ行[い]きましょう。",
      de:"Lass uns {A:zu} gehen!" },
    { slots:{ P:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["allein"]} },
      jp:"{P}で{V:mashou}。",
      de:"Lass uns {P:in} {V:inf}!" }
  ]
},

{ id:"g-g5-counters", type:"grammar", source:"Genki I", lesson:5, level:"N5",
  title:"Zählen mit 一つ・二つ … und Zählwörter",
  jp:"一[ひと]つ・二[ふた]つ・三[みっ]つ…",
  summary:"Dinge zählt man mit Zählwörtern; die allgemeinen Zahlen 一つ〜十 passen fast immer.",
  structure:["Nomen + を + Zahl/Zählwort + Verb", "一[ひと]つ, 二[ふた]つ, 三[みっ]つ, 四[よっ]つ, 五[いつ]つ, 六[むっ]つ, 七[なな]つ, 八[やっ]つ, 九[ここの]つ, 十[とお]"],
  explanation:"Im Japanischen zählt man Dinge mit **Zählwörtern** (Zählern) – ähnlich wie im Deutschen „zwei *Tassen* Kaffee“ oder „drei *Blatt* Papier“, nur viel häufiger. Für den Anfang sehr praktisch sind die **japanischen Zahlen**, die für fast alle Gegenstände passen:\n- 一[ひと]つ, 二[ふた]つ, 三[みっ]つ, 四[よっ]つ, 五[いつ]つ\n- 六[むっ]つ, 七[なな]つ, 八[やっ]つ, 九[ここの]つ, 十[とお]\n- Fragewort: いくつ – wie viele?\n\nDie Zahl steht **nach dem Nomen und der Partikel, direkt vor dem Verb**: りんごを**三[みっ]つ**買[か]いました。 – „Ich habe drei Äpfel gekauft.“\n\nWeitere Zähler aus Genki: **〜枚[まい]** (flache Dinge: Papier, Fotos, T-Shirts), **〜本[ほん]** (lange Dinge: Stifte, Flaschen), **〜冊[さつ]** (Bücher), **〜人[にん]** (Personen, Lektion 7). Beim Einkaufen: これを二[ふた]つください。 – „Davon bitte zwei.“",
  examples:[
    { jp:"りんごを三[みっ]つください。", de:"Drei Äpfel, bitte." },
    { jp:"コーヒーを二[ふた]つお願[ねが]いします。", de:"Zwei Kaffee, bitte." },
    { jp:"切手[きって]を五枚[ごまい]買[か]いました。", de:"Ich habe fünf Briefmarken gekauft." },
    { jp:"かばんの中[なか]に本[ほん]が二冊[にさつ]あります。", de:"In der Tasche sind zwei Bücher." }
  ],
  pitfalls:["Die Menge steht vor dem Verb, nicht vor dem Nomen (✔ 本[ほん]を二冊[にさつ]買[か]いました).","Ab 11 benutzt man die normalen Zahlen: 十一[じゅういち]."],
  tags:["zahlen","zähler","einkaufen"],
  related:["g-g1-numbers-time","g-g7-counter-people"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["getraenk","essen","ding"]} },
      jp:"{N}を一[ひと]つください。",
      de:"Ich hätte gern {N:akki}." }
  ]
},

// ───────────── Lektion 6 ─────────────
{ id:"g-g6-te-form", type:"grammar", source:"Genki I", lesson:6, level:"N5",
  title:"Die て-Form der Verben",
  jp:"〜て／〜で",
  summary:"Die て-Form ist eine Verbindungsform, auf der viele Konstruktionen aufbauen.",
  structure:["る-Verben: る → て", "う-Verben: う・つ・る → って | む・ぶ・ぬ → んで | く → いて | ぐ → いで | す → して", "Unregelmäßig: する → して, くる → きて, 行[い]く → 行[い]って"],
  explanation:"Die **て-Form** hat keine eigene Zeit, sondern verbindet Sätze und bildet viele wichtige Muster (〜てください, 〜てもいいです, 〜ています …).\n\n**る-Verben**: る durch て ersetzen – 食[た]べる → 食[た]べて, 見[み]る → 見[み]て.\n\n**う-Verben** – je nach letzter Silbe:\n- う, つ, る → **って**: 買[か]う → 買[か]って, 待[ま]つ → 待[ま]って, 帰[かえ]る → 帰[かえ]って\n- む, ぶ, ぬ → **んで**: 読[よ]む → 読[よ]んで, 遊[あそ]ぶ → 遊[あそ]んで, 死[し]ぬ → 死[し]んで\n- く → **いて**: 書[か]く → 書[か]いて\n- ぐ → **いで**: 泳[およ]ぐ → 泳[およ]いで\n- す → **して**: 話[はな]す → 話[はな]して\n\n**Unregelmäßig**: する → して, くる → 来[き]て, und die Ausnahme **行[い]く → 行[い]って** (nicht „行[い]いて“).\n\nEine Merkhilfe ist die „て-Form-Melodie“ auf die Melodie von „Clementine“ – viele Lernende singen sie. Übe die Formen, bis sie automatisch kommen!",
  examples:[
    { jp:"ちょっと待[ま]ってください。", de:"Warten Sie bitte einen Moment." },
    { jp:"朝[あさ]起[お]きて、シャワーを浴[あ]びます。", de:"Morgens stehe ich auf und dusche." },
    { jp:"教科書[きょうかしょ]を読[よ]んでください。", de:"Bitte lesen Sie das Lehrbuch." },
    { jp:"京都[きょうと]に行[い]って、お寺[てら]を見[み]ました。", de:"Ich bin nach Kyoto gefahren und habe Tempel angesehen." }
  ],
  pitfalls:["行[い]く → 行[い]って (Ausnahme!).","帰[かえ]る, 入[はい]る, 切[き]る sind う-Verben: 帰[かえ]って, 入[はい]って, 切[き]って."],
  tags:["verben","konjugation","te-form"],
  related:["g-g6-tekudasai","g-g6-te-connect","g-g7-teiru-progress","g-g3-verbtypes"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"毎朝[まいあさ]起[お]きて、{O}を{V:masu}。",
      de:"Jeden Morgen stehe ich auf und {V:ich} {O:akki}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"うちに帰[かえ]って、{O}を{V:masu}。",
      de:"Ich gehe nach Hause und {V:ich} {O:akki}." }
  ]
},

{ id:"g-g6-tekudasai", type:"grammar", source:"Genki I", lesson:6, level:"N5",
  title:"〜てください – höfliche Bitte",
  jp:"〜てください",
  summary:"て-Form + ください = „Bitte tun Sie …“",
  structure:["Verb-て + ください。"],
  explanation:"Mit **て-Form + ください** bittet man jemanden höflich, etwas zu tun: 見[み]てください。 – „Bitte sehen Sie (sich das an).“\n\nEs entspricht dem deutschen Imperativ mit „bitte“ („Lesen Sie bitte …“, „Würden Sie bitte …?“). Noch höflicher wird es mit **〜てくださいませんか** („Würden Sie mir bitte …?“).\n\nNicht verwechseln: **Nomen を ください** bedeutet „Geben Sie mir bitte …“ (水[みず]をください – Wasser, bitte), **Verb-て ください** bedeutet „Bitte tun Sie …“.\n\nGegenüber Vorgesetzten ist 〜てください manchmal zu direkt – es bleibt eine Aufforderung.",
  examples:[
    { jp:"教科書[きょうかしょ]を見[み]てください。", de:"Bitte sehen Sie ins Lehrbuch." },
    { jp:"ゆっくり話[はな]してください。", de:"Bitte sprechen Sie langsam." },
    { jp:"ここに名前[なまえ]を書[か]いてください。", de:"Bitte schreiben Sie hier Ihren Namen." },
    { jp:"ちょっと待[ま]ってください。", de:"Warten Sie bitte kurz." }
  ],
  pitfalls:["Nomen を ください = „Geben Sie mir …“; Verb-て ください = „Tun Sie bitte …“."],
  tags:["bitte","te-form","höflich"],
  related:["g-g6-te-form","g-g8-naidekudasai","g-g6-temoii"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:te}ください。",
      de:"Würden Sie bitte {O:akk} {V:inf}?" },
    { slots:{ A:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"明日[あした]{A}へ{V:te}ください。",
      de:"Würden Sie bitte morgen {A:zu} {V:inf}?" },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"ここで{V:te}ください。",
      de:"Würden Sie bitte hier {V:inf}?" }
  ]
},

{ id:"g-g6-temoii", type:"grammar", source:"Genki I", lesson:6, level:"N5",
  title:"〜てもいいです – Erlaubnis",
  jp:"〜てもいいです（か）",
  summary:"て-Form + もいいです = „man darf …“; als Frage: „Darf ich …?“",
  structure:["Verb-て + もいいです。 – Man darf …", "Verb-て + もいいですか。 – Darf ich …?"],
  explanation:"**〜てもいいです** bedeutet wörtlich „Auch wenn (man) … tut, ist es gut“ – also: „Man darf …“ / „Es ist in Ordnung, wenn …“.\n\nAls **Frage** bittet man um Erlaubnis: 写真[しゃしん]を撮[と]ってもいいですか。 – „Darf ich ein Foto machen?“\n\nMögliche Antworten:\n- Ja: **ええ、どうぞ。** („Ja, bitte.“) oder ええ、いいですよ。\n- Nein: **すみません、ちょっと…** – oder deutlich mit 〜てはいけません (siehe nächster Punkt).",
  examples:[
    { jp:"トイレに行[い]ってもいいですか。", de:"Darf ich auf die Toilette gehen?" },
    { jp:"ここで写真[しゃしん]を撮[と]ってもいいですか。", de:"Darf ich hier fotografieren?" },
    { jp:"教科書[きょうかしょ]を見[み]てもいいです。", de:"Ihr dürft ins Lehrbuch schauen." },
    { jp:"ええ、どうぞ。", de:"Ja, bitte (gern)." }
  ],
  tags:["erlaubnis","te-form"],
  related:["g-g6-tewaikenai","g-g6-tekudasai"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:te}もいいですか。",
      de:"Darf ich {O:akk} {V:inf}?" },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"ここで{V:te}もいいですか。",
      de:"Darf ich hier {V:inf}?" },
    { slots:{ A:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"明日[あした]{A}へ{V:te}もいいですか。",
      de:"Darf ich morgen {A:zu} {V:inf}?" }
  ]
},

{ id:"g-g6-tewaikenai", type:"grammar", source:"Genki I", lesson:6, level:"N5",
  title:"〜てはいけません – Verbot",
  jp:"〜てはいけません",
  summary:"て-Form + はいけません = „man darf nicht …“",
  structure:["Verb-て + はいけません。"],
  explanation:"**〜てはいけません** drückt ein **Verbot** aus: „Man darf nicht …“. Wörtlich: „Wenn man … tut, geht das nicht.“ Das は wird hier „wa“ gesprochen.\n\nEs ist das Gegenstück zu 〜てもいいです:\n- 写真[しゃしん]を撮[と]ってもいいです。 – Man darf fotografieren.\n- 写真[しゃしん]を撮[と]ってはいけません。 – Man darf nicht fotografieren.\n\nDiese Form klingt streng (Regeln, Schilder, Lehrer zu Schülern). Um jemanden höflich zu bitten, etwas nicht zu tun, verwendet man besser 〜ないでください (Lektion 8). In der Umgangssprache hört man auch 〜ちゃだめ.",
  examples:[
    { jp:"ここで写真[しゃしん]を撮[と]ってはいけません。", de:"Hier darf man nicht fotografieren." },
    { jp:"教室[きょうしつ]で食[た]べてはいけません。", de:"Im Klassenzimmer darf man nicht essen." },
    { jp:"テストの時[とき]、教科書[きょうかしょ]を見[み]てはいけません。", de:"Während des Tests darf man nicht ins Lehrbuch schauen." },
    { jp:"ここでたばこを吸[す]ってはいけません。", de:"Hier darf man nicht rauchen." }
  ],
  pitfalls:["Klingt streng – als Bitte lieber 〜ないでください verwenden."],
  tags:["verbot","te-form","regeln"],
  related:["g-g6-temoii","g-g8-naidekudasai","g-g12-nakereba"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"ここで{V:te}はいけません。",
      de:"Hier darf man nicht {V:inf}." },
    { slots:{ P:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["allein"]} },
      jp:"{P}で{V:te}はいけません。",
      de:"{P:in} darf man nicht {V:inf}." }
  ]
},

{ id:"g-g6-te-connect", type:"grammar", source:"Genki I", lesson:6, level:"N5",
  title:"Sätze mit der て-Form verbinden",
  jp:"〜て、〜",
  summary:"Mit der て-Form reiht man Handlungen aneinander: „… und (dann) …“",
  structure:["Verb-て、Verb-ます。", "Die Zeit bestimmt das letzte Verb."],
  explanation:"Mit der て-Form kann man mehrere Handlungen **in zeitlicher Reihenfolge** verbinden – wie „… und (dann) …“ im Deutschen:\n\n図書館[としょかん]に行[い]って、本[ほん]を借[か]りました。 – „Ich bin in die Bibliothek gegangen und habe ein Buch ausgeliehen.“\n\n**Nur das letzte Verb** trägt Zeit und Höflichkeit. Alle vorherigen stehen in der て-Form, egal ob der Satz in der Gegenwart oder Vergangenheit steht:\n- 起[お]きて、朝[あさ]ご飯[はん]を食[た]べ**ます**。 – Ich stehe auf und frühstücke.\n- 起[お]きて、朝[あさ]ご飯[はん]を食[た]べ**ました**。 – Ich bin aufgestanden und habe gefrühstückt.\n\nDenk daran: と kann nur Nomen verbinden – für Sätze braucht man die て-Form.",
  examples:[
    { jp:"うちに帰[かえ]って、晩[ばん]ご飯[はん]を食[た]べます。", de:"Ich gehe nach Hause und esse zu Abend." },
    { jp:"デパートに行[い]って、かばんを買[か]いました。", de:"Ich bin ins Kaufhaus gegangen und habe eine Tasche gekauft." },
    { jp:"シャワーを浴[あ]びて、寝[ね]ました。", de:"Ich habe geduscht und bin schlafen gegangen." },
    { jp:"友[とも]だちに会[あ]って、映画[えいが]を見[み]ました。", de:"Ich habe einen Freund getroffen und einen Film gesehen." }
  ],
  pitfalls:["Nur das letzte Verb zeigt die Zeit.","と verbindet keine Sätze (❌ 行[い]きますと買[か]いました)."],
  tags:["te-form","satzverbindung"],
  related:["g-g6-te-form","g-g4-to","g-g7-adj-te"],
  patterns:[
    { slots:{ A:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{A}へ行[い]って、{O}を{V:mashita}。",
      de:"Ich bin {A:zu} gegangen und {V:aux} {O:akki} {V:pp}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"}, W:{pos:"verb", cat:["objekt"]}, P:{pos:"noun", objOf:"W"} },
      jp:"昨日[きのう]は{O}を{V:te}、{P}を{W:mashita}。",
      de:"Gestern {V:aux} ich {O:akki} {V:pp} und {P:akki} {W:pp}." }
  ]
},

{ id:"g-g6-kara", type:"grammar", source:"Genki I", lesson:6, level:"N5",
  title:"〜から – Grund: „weil, deshalb“",
  jp:"（Grund）から、（Folge）",
  summary:"から nach einem Satz nennt den Grund für den folgenden Satz.",
  structure:["Grund-Satz + から、Folge-Satz。", "Folge-Satz。Grund-Satz + からです。"],
  explanation:"**から** nach einem Satz bedeutet „weil“. Wichtig: Die Reihenfolge ist **Grund → から → Folge**. Im Deutschen übersetzt man am natürlichsten mit „…, deshalb …“ oder „Weil …, …“:\n\n明日[あした]テストがありますから、今晩[こんばん]勉強[べんきょう]します。 – „Morgen habe ich einen Test, deshalb lerne ich heute Abend.“\n\nMan kann den Grund auch nachschieben: 今晩[こんばん]勉強[べんきょう]します。明日[あした]テストがありますから。 Als Antwort auf どうして (warum) sagt man: 〜からです。\n\nVor から kann die höfliche Form (ですから, ますから) oder die Kurzform stehen (→ Lektion 9). Nicht verwechseln mit から als „von/ab“ (九時[くじ]から – ab 9 Uhr).",
  examples:[
    { jp:"暑[あつ]いですから、窓[まど]を開[あ]けてください。", de:"Es ist heiß, deshalb machen Sie bitte das Fenster auf." },
    { jp:"明日[あした]テストがありますから、今晩[こんばん]勉強[べんきょう]します。", de:"Morgen habe ich einen Test, deshalb lerne ich heute Abend." },
    { jp:"今日[きょう]は忙[いそが]しいですから、パーティーに行[い]きません。", de:"Weil ich heute beschäftigt bin, gehe ich nicht zur Party." },
    { jp:"「どうして来[き]ませんでしたか。」「病気[びょうき]でしたから。」", de:"„Warum bist du nicht gekommen?“ – „Weil ich krank war.“" }
  ],
  pitfalls:["Reihenfolge: Grund から Folge – umgekehrt zu „…, weil …“ im Deutschen."],
  tags:["grund","satzverbindung","konjunktion"],
  related:["g-g9-kara","g-g12-node","g-g12-ndesu"],
  patterns:[
    { slots:{ G:{pos:"noun", cat:["getraenk"]} },
      jp:"{G}が好[す]きですから、毎日[まいにち]飲[の]みます。",
      de:"Ich mag {G:akk}, deshalb trinke ich jeden Tag {G:akki}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"今日[きょう]は暇[ひま]ですから、{O}を{V:masu}。",
      de:"Heute habe ich Zeit, deshalb {V:ich} ich {O:akki}." }
  ]
},

{ id:"g-g6-mashouka", type:"grammar", source:"Genki I", lesson:6, level:"N5",
  title:"〜ましょうか – Hilfe anbieten",
  jp:"〜ましょうか",
  summary:"Verbstamm + ましょうか bietet Hilfe an: „Soll ich …?“",
  structure:["Verbstamm + ましょうか。"],
  explanation:"In Lektion 5 hast du 〜ましょうか als zurückhaltenden Vorschlag („Sollen wir …?“) kennengelernt. Häufig bietet man damit auch **Hilfe** an: „**Soll ich** …?“\n\n荷物[にもつ]を持[も]ちましょうか。 – „Soll ich Ihr Gepäck tragen?“\n\nAntworten:\n- Annehmen: **ええ、お願[ねが]いします。** („Ja, bitte.“)\n- Ablehnen: **いいえ、大丈夫[だいじょうぶ]です。** („Nein, danke, das geht schon.“)\n\nOb „ich“ oder „wir“ gemeint ist, ergibt sich aus dem Zusammenhang.",
  examples:[
    { jp:"荷物[にもつ]を持[も]ちましょうか。", de:"Soll ich das Gepäck tragen?" },
    { jp:"窓[まど]を開[あ]けましょうか。", de:"Soll ich das Fenster öffnen?" },
    { jp:"写真[しゃしん]を撮[と]りましょうか。", de:"Soll ich ein Foto (von Ihnen) machen?" },
    { jp:"ええ、お願[ねが]いします。", de:"Ja, bitte." }
  ],
  tags:["angebot","hilfe","gespräch"],
  related:["g-g5-mashou","g-g3-masenka"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:mashou}か。",
      de:"Soll ich {O:akk} {V:inf}?" },
    { slots:{ A:{pos:"noun", cat:["ort","land"]} },
      jp:"一緒[いっしょ]に{A}へ行[い]きましょうか。",
      de:"Sollen wir zusammen {A:zu} gehen?" }
  ]
},

// ───────────── Lektion 7 ─────────────
{ id:"g-g7-teiru-progress", type:"grammar", source:"Genki I", lesson:7, level:"N5",
  title:"〜ている – laufende Handlung („gerade dabei sein“)",
  jp:"〜ています",
  summary:"て-Form + いる beschreibt eine Handlung, die gerade im Gange ist.",
  structure:["Verb-て + います。 – ist gerade dabei zu …", "Verb-て + いません。 – ist gerade nicht dabei"],
  explanation:"Mit **て-Form + いる** (höflich: **います**) beschreibt man eine Handlung, die **gerade stattfindet** – wie das englische „-ing“ oder das deutsche „gerade“ bzw. „dabei sein, zu …“:\n\n今[いま]、本[ほん]を読[よ]んでいます。 – „Ich lese gerade ein Buch.“\n\nAußerdem kann 〜ている eine **Gewohnheit über einen längeren Zeitraum** ausdrücken: 毎日[まいにち]日本語[にほんご]を勉強[べんきょう]しています。 – „Ich lerne (zurzeit) jeden Tag Japanisch.“\n\nDiese Bedeutung haben vor allem Verben, deren Handlung eine Weile dauern kann: 読[よ]む, 食[た]べる, 勉強[べんきょう]する, 待[ま]つ usw. Bei Verben, die einen Zustandswechsel beschreiben, bedeutet 〜ている etwas anderes (siehe nächster Punkt). Vergangenheit: 〜ていました (war gerade dabei).",
  examples:[
    { jp:"メアリーさんは今[いま]勉強[べんきょう]しています。", de:"Mary lernt gerade." },
    { jp:"たけしさんは喫茶店[きっさてん]でコーヒーを飲[の]んでいます。", de:"Takeshi trinkt gerade im Café Kaffee." },
    { jp:"「今[いま]何[なに]をしていますか。」「テレビを見[み]ています。」", de:"„Was machst du gerade?“ – „Ich sehe fern.“" },
    { jp:"昨日[きのう]の八時[はちじ]ごろ、晩[ばん]ご飯[はん]を食[た]べていました。", de:"Gestern gegen acht habe ich gerade zu Abend gegessen." }
  ],
  tags:["verben","te-form","verlauf"],
  related:["g-g7-teiru-state","g-g6-te-form","g-g9-mou-mada"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"今[いま]、{O}を{V:teimasu}。",
      de:"Ich {V:ich} gerade {O:akki}." },
    { slots:{ P:{pos:"noun", cat:["ort"]}, V:{pos:"verb", ids:["v-g3-benkyousuru","v-g4-matsu","v-g5-oyogu","v-g6-denwasuru","v-g7-utau","v-g9-odoru","v-g9-undousuru","v-g10-renshuusuru"]} },
      jp:"今[いま]、{P}で{V:teimasu}。",
      de:"Ich {V:ich} gerade {P:in}.",
      not:["v-g3-okiru"] }
  ]
},

{ id:"g-g7-teiru-state", type:"grammar", source:"Genki I", lesson:7, level:"N5",
  title:"〜ている – Zustand als Ergebnis",
  jp:"結婚[けっこん]しています／住[す]んでいます／知[し]っています",
  summary:"Bei Verben einer Zustandsänderung beschreibt 〜ている den daraus entstandenen Zustand.",
  structure:["結婚[けっこん]しています – ist verheiratet", "住[す]んでいます – wohnt", "知[し]っています – kennt/weiß (verneint: 知[し]りません!)"],
  explanation:"Manche Verben beschreiben einen **Moment der Veränderung**: 結婚[けっこん]する (heiraten), 太[ふと]る (zunehmen), 起[お]きる (aufwachen), 知[し]る (erfahren). Hier bedeutet 〜ている **nicht** „gerade dabei“, sondern den **Zustand danach**:\n- 結婚[けっこん]しています – ist verheiratet (hat geheiratet, und das gilt noch)\n- 太[ふと]っています – ist dick\n- 起[お]きています – ist wach\n- 知[し]っています – weiß, kennt\n- 住[す]んでいます – wohnt (Ort mit **に**!)\n- 勤[つと]めています – ist angestellt bei\n\nAuch Bewegungsverben gehören dazu: 東京[とうきょう]に行[い]っています – „ist (gerade) in Tokio“ (ist hingefahren und noch dort).\n\nBesonderheit **知[し]る**: Positiv heißt es 知[し]っています, verneint aber **知[し]りません** (nicht ❌ 知[し]っていません).",
  examples:[
    { jp:"私[わたし]の姉[あね]は結婚[けっこん]しています。", de:"Meine ältere Schwester ist verheiratet." },
    { jp:"家族[かぞく]は東京[とうきょう]に住[す]んでいます。", de:"Meine Familie wohnt in Tokio." },
    { jp:"たけしさんの電話番号[でんわばんごう]を知[し]っていますか。", de:"Kennst du Takeshis Telefonnummer?" },
    { jp:"いいえ、知[し]りません。", de:"Nein, die kenne ich nicht." },
    { jp:"父[ちち]は銀行[ぎんこう]に勤[つと]めています。", de:"Mein Vater arbeitet bei einer Bank." }
  ],
  pitfalls:["知[し]っていますか → いいえ、知[し]りません (nicht 知[し]っていません).","住[す]む: Ort mit に, nicht で."],
  tags:["verben","te-form","zustand"],
  related:["g-g7-teiru-progress","g-g7-body"],
  patterns:[
    { slots:{ L:{pos:"noun", cat:["land"]} },
      jp:"私[わたし]の家族[かぞく]は{L}に住[す]んでいます。",
      de:"Meine Familie wohnt {L:in}." },
    { slots:{ P:{pos:"noun", cat:["person"]} },
      jp:"あの{P}を知[し]っていますか。",
      de:"Kennen Sie {P:akk} dort drüben?" }
  ]
},

{ id:"g-g7-body", type:"grammar", source:"Genki I", lesson:7, level:"N5",
  title:"Personen beschreiben: X は Y が Adjektiv",
  jp:"XはYが〜です",
  summary:"Körpermerkmale beschreibt man mit „Person は Körperteil が Adjektiv“.",
  structure:["Person は 髪[かみ] が 長[なが]いです。 – hat lange Haare", "Person は 背[せ] が 高[たか]いです。 – ist groß", "Person は 目[め] が 大[おお]きいです。 – hat große Augen"],
  explanation:"Um jemanden zu beschreiben, benutzt man eine Doppel-Konstruktion: Die **Person** ist das Thema (**は**), das **Körperteil** ist das Subjekt (**が**), und am Ende steht ein **Adjektiv**:\n\nメアリーさんは**髪[かみ]が**長[なが]いです。 – wörtlich: „Was Mary betrifft, die Haare sind lang“ → „Mary hat lange Haare.“\n\nWichtige Ausdrücke:\n- 背[せ]が高[たか]い / 低[ひく]い – groß / klein (Körpergröße)\n- 髪[かみ]が長[なが]い / 短[みじか]い – lange / kurze Haare\n- 目[め]が大[おお]きい – große Augen\n- 頭[あたま]がいい – klug\n\nIm Deutschen verwendet man dafür oft „haben“ – im Japanischen braucht man kein Verb. Auch Kleidung beschreibt man mit 〜ている: 眼鏡[めがね]をかけています (trägt eine Brille), T-シャツを着[き]ています (trägt ein T-Shirt).",
  examples:[
    { jp:"メアリーさんは髪[かみ]が短[みじか]いです。", de:"Mary hat kurze Haare." },
    { jp:"たけしさんは背[せ]が高[たか]いです。", de:"Takeshi ist groß." },
    { jp:"ゆいさんは頭[あたま]がいいです。", de:"Yui ist klug." },
    { jp:"兄[あに]は眼鏡[めがね]をかけています。", de:"Mein älterer Bruder trägt eine Brille." }
  ],
  tags:["beschreibung","körper","adjektive"],
  related:["g-g5-adjectives","g-g7-teiru-state","g-g8-ga"],
  patterns:[
    { slots:{ P:{pos:"noun", cat:["person","familie"]} },
      jp:"{P}は髪[かみ]が長[なが]いです。",
      de:"{P:def} hat lange Haare." },
    { slots:{ P:{pos:"noun", cat:["person","familie"]} },
      jp:"{P}は背[せ]が高[たか]いです。",
      de:"{P:def} ist groß." },
    { slots:{ P:{pos:"noun", cat:["person","familie"]} },
      jp:"{P}は目[め]が大[おお]きいです。",
      de:"{P:def} hat große Augen." }
  ]
},

{ id:"g-g7-adj-te", type:"grammar", source:"Genki I", lesson:7, level:"N5",
  title:"Adjektive und Nomen mit て verbinden",
  jp:"〜くて／〜で",
  summary:"Mehrere Eigenschaften verbindet man mit der て-Form: い-Adj. → 〜くて, な-Adj./Nomen → 〜で.",
  structure:["い-Adj.: 安[やす]い → 安[やす]くて", "な-Adj.: 静[しず]か → 静[しず]かで", "Nomen: 日本人[にほんじん] → 日本人[にほんじん]で", "いい → よくて"],
  explanation:"Wie Verben haben auch Adjektive und Nomen eine **て-Form**, mit der man Sätze verbindet – „… und …“:\n- **い-Adjektive**: い → **くて**: 安[やす]い → 安[やす]**くて**, おもしろい → おもしろ**くて**; Ausnahme いい → **よくて**\n- **な-Adjektive**: + **で**: きれい → きれい**で**, 元気[げんき] → 元気[げんき]**で**\n- **Nomen**: + **で**: 学生[がくせい] → 学生[がくせい]**で**\n\nBeispiel: この部屋[へや]は**広[ひろ]くて**、**きれいで**、静[しず]かです。 – „Dieses Zimmer ist geräumig, sauber und ruhig.“\n\nWie bei Verben zeigt nur das **letzte** Wort die Zeit: 広[ひろ]くて、きれいでした (war geräumig und sauber). Verbinde am besten Eigenschaften mit ähnlicher Wertung (positiv + positiv). Gegensätze („billig, aber schlecht“) verbindet man mit が oder けど.",
  examples:[
    { jp:"このレストランは安[やす]くて、おいしいです。", de:"Dieses Restaurant ist billig und lecker." },
    { jp:"京都[きょうと]は静[しず]かで、きれいな町[まち]です。", de:"Kyoto ist eine ruhige und schöne Stadt." },
    { jp:"たけしさんは日本人[にほんじん]で、二十二歳[にじゅうにさい]です。", de:"Takeshi ist Japaner und 22 Jahre alt." },
    { jp:"昨日[きのう]のパーティーは楽[たの]しくて、よかったです。", de:"Die Party gestern war lustig und schön." }
  ],
  pitfalls:["いい → よくて (nicht いくて).","Für Gegensätze nicht て verwenden, sondern が/けど."],
  tags:["adjektive","te-form","satzverbindung"],
  related:["g-g6-te-connect","g-g5-adj-conjugation","g-g5-adjectives"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","kleidung"]} },
      jp:"この{N}は安[やす]くて、いいです。",
      de:"{N:def} hier ist billig und gut." },
    { slots:{ A:{pos:"noun", cat:["ort"]} },
      jp:"{A}は静[しず]かで、きれいです。",
      de:"{A:def} ist ruhig und sauber.",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は楽[たの]しくて、よかったです。",
      de:"{E:def} war lustig und schön." }
  ]
},

{ id:"g-g7-stem-ni-iku", type:"grammar", source:"Genki I", lesson:7, level:"N5",
  title:"Verbstamm + に行く – hingehen, um etwas zu tun",
  jp:"〜に行[い]く／〜に来[く]る／〜に帰[かえ]る",
  summary:"Verbstamm + に + Bewegungsverb gibt den Zweck einer Bewegung an.",
  structure:["Ort に／へ + Verbstamm + に 行[い]きます。", "Ort に／へ + Nomen (Tätigkeit) + に 行[い]きます。"],
  explanation:"Um zu sagen, **wozu** man irgendwohin geht, setzt man den **Verbstamm** (die Form vor ます) + **に** vor ein Bewegungsverb (行[い]く, 来[く]る, 帰[かえ]る):\n\n喫茶店[きっさてん]にコーヒーを**飲[の]みに**行[い]きます。 – „Ich gehe ins Café, um Kaffee zu trinken.“\n\nIm Deutschen sagt man oft einfach „Ich gehe Kaffee trinken“ oder „…, um … zu …“. Bei する-Nomen kann man auch das Nomen direkt nehmen: 買[か]い物[もの]に行[い]きます (einkaufen gehen), 勉強[べんきょう]に来[き]ました (zum Lernen gekommen).\n\nDer Zielort steht mit に oder へ; das Objekt der Absicht mit を. Oft steht der Ort vorne: 図書館[としょかん]に本[ほん]を借[か]りに行[い]きます。",
  examples:[
    { jp:"デパートにかばんを買[か]いに行[い]きます。", de:"Ich gehe ins Kaufhaus, um eine Tasche zu kaufen." },
    { jp:"友[とも]だちが私[わたし]のうちに遊[あそ]びに来[き]ました。", de:"Ein Freund ist zu mir zu Besuch gekommen." },
    { jp:"メアリーさんは日本[にほん]に日本語[にほんご]を勉強[べんきょう]しに来[き]ました。", de:"Mary ist nach Japan gekommen, um Japanisch zu lernen." },
    { jp:"昼[ひる]ご飯[はん]を食[た]べにうちに帰[かえ]ります。", de:"Ich gehe zum Mittagessen nach Hause." }
  ],
  tags:["zweck","bewegung","verben"],
  related:["g-g3-ni-he","g-g11-tai"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:stem}に行[い]きます。",
      de:"Ich gehe {O:akki} {V:inf}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"昨日[きのう]、{O}を{V:stem}に行[い]きました。",
      de:"Gestern bin ich {O:akki} {V:inf} gegangen." }
  ]
},

{ id:"g-g7-counter-people", type:"grammar", source:"Genki I", lesson:7, level:"N5",
  title:"Personen zählen: 〜人",
  jp:"一人[ひとり]・二人[ふたり]・三人[さんにん]…",
  summary:"Menschen zählt man mit dem Zählwort 〜人[にん]; 1 und 2 sind unregelmäßig.",
  structure:["一人[ひとり], 二人[ふたり], 三人[さんにん], 四人[よにん], 五人[ごにん] …", "Fragewort: 何人[なんにん]"],
  explanation:"Personen zählt man mit **〜人[にん]**. Die ersten beiden sind unregelmäßig und sehr wichtig:\n- 1 Person: **一人[ひとり]**\n- 2 Personen: **二人[ふたり]**\n- 3: 三人[さんにん], 4: **四人[よにん]**, 5: 五人[ごにん], 6: 六人[ろくにん], 7: 七人[しちにん／ななにん], 8: 八人[はちにん], 9: 九人[きゅうにん], 10: 十人[じゅうにん]\n- Wie viele? **何人[なんにん]**\n\nWie alle Zählwörter steht die Zahl **nach der Partikel, direkt vor dem Verb**: 学生[がくせい]が三人[さんにん]います。 – „Es gibt drei Studenten.“\n\n一人[ひとり]で bedeutet „allein“: 一人[ひとり]で住[す]んでいます – Ich wohne allein.",
  examples:[
    { jp:"私[わたし]は兄弟[きょうだい]が二人[ふたり]います。", de:"Ich habe zwei Geschwister." },
    { jp:"このクラスに学生[がくせい]が何人[なんにん]いますか。", de:"Wie viele Studenten sind in dieser Klasse?" },
    { jp:"十五人[じゅうごにん]います。", de:"Es sind fünfzehn." },
    { jp:"姉[あね]は東京[とうきょう]に一人[ひとり]で住[す]んでいます。", de:"Meine ältere Schwester wohnt allein in Tokio." }
  ],
  pitfalls:["1 = ひとり, 2 = ふたり, 4 = よにん.","Die Zahl steht vor dem Verb: 学生[がくせい]が三人[さんにん]います."],
  tags:["zahlen","zähler","personen"],
  related:["g-g5-counters","g-g4-arimasu-imasu"],
  patterns:[
    { slots:{ A:{pos:"noun", cat:["ort"]} },
      jp:"{A}に学生[がくせい]が三人[さんにん]います。",
      de:"{A:in} sind drei Studenten.",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] },
    { slots:{ L:{pos:"noun", cat:["land"]} },
      jp:"{L}に友[とも]だちが二人[ふたり]います。",
      de:"{L:in} habe ich zwei Freunde." }
  ]
},

// ───────────── Lektion 8 ─────────────
{ id:"g-g8-short-present", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"Kurzformen im Präsens (Wörterbuchform und ない-Form)",
  jp:"〜る／〜ない・〜だ／〜じゃない",
  summary:"Die informellen „Kurzformen“ sind die Grundlage für lockere Sprache und viele Satzmuster.",
  structure:["Verb positiv: Wörterbuchform (食[た]べる, 行[い]く)", "Verb negativ: ない-Form (食[た]べない, 行[い]かない)", "い-Adj.: 高[たか]い / 高[たか]くない", "な-Adj./Nomen: 静[しず]かだ / 静[しず]かじゃない"],
  explanation:"Jede höfliche Form hat eine **Kurzform** (informelle Form). Positiv ist das bei Verben die **Wörterbuchform**. Die **Verneinung** bildet man so:\n\n**る-Verben**: る → **ない**: 食[た]べる → 食[た]べない, 見[み]る → 見[み]ない\n\n**う-Verben**: letzter u-Laut → **a-Laut + ない**:\n- 書[か]く → 書[か]かない, 飲[の]む → 飲[の]まない, 話[はな]す → 話[はな]さない\n- **う → わ**: 買[か]う → 買[か]わない (nicht „買[か]あない“)\n\n**Unregelmäßig**: する → しない, くる → こない, **ある → ない** (!)\n\n**Adjektive und Nomen**:\n- い-Adj.: 高[たか]い / 高[たか]くない (einfach ohne です)\n- な-Adj.: 静[しず]か**だ** / 静[しず]かじゃない\n- Nomen: 学生[がくせい]**だ** / 学生[がくせい]じゃない\n\nKurzformen braucht man für lockere Gespräche mit Freunden und Familie und vor vielen Ausdrücken wie 〜と思[おも]います oder 〜ないでください.",
  examples:[
    { jp:"毎日[まいにち]日本語[にほんご]を勉強[べんきょう]する。", de:"Ich lerne jeden Tag Japanisch. (informell)" },
    { jp:"今日[きょう]は学校[がっこう]に行[い]かない。", de:"Heute gehe ich nicht zur Schule. (informell)" },
    { jp:"明日[あした]は雨[あめ]だ。", de:"Morgen regnet es. (informell)" },
    { jp:"お金[かね]がない。", de:"Ich habe kein Geld. (informell)" }
  ],
  pitfalls:["う-Verben auf う: 買[か]う → 買[か]わない (わ, nicht あ).","ある → ない (nicht „あらない“)."],
  tags:["kurzform","konjugation","informell"],
  related:["g-g8-informal","g-g9-short-past","g-g3-verbtypes"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"毎日[まいにち]{O}を{V:dict}。",
      de:"Ich {V:ich} jeden Tag {O:akki}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"今日[きょう]は{V:nai}。",
      de:"Heute {V:ich} ich nicht." },
    { slots:{ A:{pos:"noun", cat:["ort","land"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"明日[あした]{A}に{V:dict}。",
      de:"Morgen {V:ich} ich {A:zu}." }
  ]
},

{ id:"g-g8-informal", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"Informelle Sprache (Umgangssprache unter Freunden)",
  jp:"〜？／〜ね（だ・です weglassen）",
  summary:"Unter Freunden und in der Familie verwendet man Kurzformen statt です/ます.",
  structure:["Frage: Kurzform + ？ (ohne か)", "Nomen/な-Adj. + ？ (だ fällt bei Fragen weg)", "Partikeln は・を oft weggelassen"],
  explanation:"Mit Freunden, Familie und Jüngeren spricht man **informell** – mit Kurzformen statt です/ます. Das ist ungefähr wie der Unterschied zwischen „du“ und „Sie“ im Deutschen.\n\nWichtige Merkmale:\n- **Kurzformen** statt ます: 行[い]きます → 行[い]く\n- **Fragen** ohne か, nur mit steigender Intonation: 行[い]く？ – Gehst du hin?\n- **だ fällt oft weg**, besonders in Fragen: 学生[がくせい]？ (nicht ❌ 学生[がくせい]だか)\n- **Partikeln** wie は und を werden oft weggelassen: コーヒー、飲[の]む？\n- **Ja/Nein**: うん (ja), ううん (nein)\n\nGegenüber Lehrern, Vorgesetzten und Fremden bleibt man bei です/ます! Wer zu früh informell spricht, wirkt unhöflich.",
  examples:[
    { jp:"「明日[あした]、ひま？」「うん、ひま。」", de:"„Hast du morgen Zeit?“ – „Ja, hab ich.“" },
    { jp:"コーヒー、飲[の]む？", de:"Trinkst du einen Kaffee?" },
    { jp:"「今日[きょう]、学校[がっこう]に行[い]く？」「ううん、行[い]かない。」", de:"„Gehst du heute zur Schule?“ – „Nein.“" },
    { jp:"この映画[えいが]、おもしろいね。", de:"Der Film ist lustig, oder?" }
  ],
  pitfalls:["Nur mit Freunden/Familie – bei Lehrern und Fremden höflich bleiben.","In Fragen kein だ: ✔ 学生[がくせい]？ ❌ 学生[がくせい]だ？"],
  tags:["informell","gespräch","kurzform"],
  related:["g-g8-short-present","g-g9-informal-past"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["getraenk","essen","sport"]} },
      jp:"{N}、好[す]き？",
      de:"Magst du {N:akk}?" },
    { slots:{ A:{pos:"i-adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"この{N}、{A:attr}ね。",
      de:"{N:def} hier ist {A:de}, oder?" },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"明日[あした]、一緒[いっしょ]に{O}を{V:nai}？",
      de:"Wollen wir morgen zusammen {O:akki} {V:inf}?" }
  ]
},

{ id:"g-g8-to-omoimasu", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"〜と思います – „Ich glaube, dass …“",
  jp:"（Kurzform）と思[おも]います",
  summary:"Kurzform + と思います drückt eine Vermutung oder Meinung aus.",
  structure:["Kurzform + と思[おも]います。", "Nomen/な-Adj. + だと思[おも]います。", "Verneinte Vermutung: 〜ないと思[おも]います。"],
  explanation:"Mit **〜と思[おも]います** sagt man, was man **glaubt oder vermutet**: „Ich glaube, dass …“ / „Ich denke, …“. Vor と steht immer die **Kurzform**:\n- 明日[あした]は雨[あめ]が降[ふ]る**と思[おも]います**。 – Ich glaube, morgen regnet es.\n- たけしさんは来[こ]ない**と思[おも]います**。 – Ich glaube, Takeshi kommt nicht.\n- このテストは難[むずか]しい**と思[おも]います**。 – Ich finde, der Test ist schwer.\n\nBei **Nomen und な-Adjektiven** muss **だ** stehen: 先生[せんせい]は元気[げんき]**だ**と思[おも]います。\n\nUm eine Meinung zu verneinen, verneint man meist den Inhalt: 〜**ない**と思[おも]います („Ich glaube, dass … nicht …“) – ähnlich wie im Deutschen „Ich glaube nicht, dass …“. Nach der Meinung eines anderen fragt man: 〜についてどう思[おも]いますか。",
  examples:[
    { jp:"明日[あした]は暑[あつ]いと思[おも]います。", de:"Ich glaube, morgen wird es heiß." },
    { jp:"メアリーさんは今日[きょう]来[く]ると思[おも]います。", de:"Ich glaube, Mary kommt heute." },
    { jp:"たけしさんはたばこを吸[す]わないと思[おも]います。", de:"Ich glaube nicht, dass Takeshi raucht." },
    { jp:"あの人[ひと]は学生[がくせい]だと思[おも]います。", de:"Ich glaube, die Person dort ist Student." }
  ],
  pitfalls:["Nomen/な-Adj.: だ nicht vergessen (✔ 学生[がくせい]だと思[おも]います).","Nicht 思[おも]いません für „glaube nicht, dass“ – besser den Inhalt verneinen."],
  tags:["meinung","vermutung","kurzform","zitat"],
  related:["g-g8-to-itteimashita","g-g9-quote-past","g-g12-deshou"],
  patterns:[
    { slots:{ A:{pos:"i-adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"この{N}は{A:attr}と思[おも]います。",
      de:"Ich finde, {N:def} hier ist {A:de}." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は明日[あした]だと思[おも]います。",
      de:"Ich glaube, {E:def} ist morgen." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は今日[きょう]じゃないと思[おも]います。",
      de:"Ich glaube, {E:def} ist nicht heute." }
  ]
},

{ id:"g-g8-to-itteimashita", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"〜と言っていました – Rede wiedergeben",
  jp:"（Kurzform）と言[い]っていました",
  summary:"Kurzform + と言っていました gibt wieder, was jemand gesagt hat.",
  structure:["Person は + Kurzform + と言[い]っていました。"],
  explanation:"Mit **〜と言[い]っていました** gibt man wieder, was eine andere Person gesagt hat – „X hat gesagt, dass …“. Vor と steht wie bei と思[おも]います die **Kurzform** (bei Nomen/な-Adj. mit だ).\n\nたけしさんは明日[あした]テストがある**と言[い]っていました**。 – „Takeshi hat gesagt, dass morgen ein Test ist.“\n\nMan verwendet 言[い]っていました (statt 言[い]いました), wenn man eine Aussage **als Information weitergibt**. Die Zeitform im zitierten Teil richtet sich nach der ursprünglichen Aussage – im Deutschen verwendet man dagegen oft den Konjunktiv („… sei …“) oder einfach „dass …“.",
  examples:[
    { jp:"メアリーさんは今日[きょう]忙[いそが]しいと言[い]っていました。", de:"Mary hat gesagt, dass sie heute beschäftigt ist." },
    { jp:"先生[せんせい]は明日[あした]テストがあると言[い]っていました。", de:"Der Lehrer hat gesagt, dass morgen ein Test ist." },
    { jp:"たけしさんはパーティーに来[こ]ないと言[い]っていました。", de:"Takeshi hat gesagt, dass er nicht zur Party kommt." },
    { jp:"ゆいさんはお母[かあ]さんが先生[せんせい]だと言[い]っていました。", de:"Yui hat gesagt, dass ihre Mutter Lehrerin ist." }
  ],
  tags:["zitat","kurzform","indirekte rede"],
  related:["g-g8-to-omoimasu","g-g9-quote-past"],
  patterns:[
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"先生[せんせい]は{E}は明日[あした]だと言[い]っていました。",
      de:"Der Lehrer hat gesagt, dass {E:def} morgen ist." },
    { slots:{ A:{pos:"i-adj", cat:["beschreibung"]}, N:{pos:"noun", cat:["ort","ding","essen","person"], subjOf:"A"} },
      jp:"友[とも]だちはあの{N}は{A:attr}と言[い]っていました。",
      de:"Ein Freund hat gesagt, dass {N:def} dort {A:de} ist." }
  ]
},

{ id:"g-g8-naidekudasai", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"〜ないでください – „Bitte nicht …“",
  jp:"〜ないでください",
  summary:"ない-Form + でください = höfliche Bitte, etwas nicht zu tun.",
  structure:["Verb-ない + でください。"],
  explanation:"Das Gegenstück zu 〜てください: Mit **ない-Form + でください** bittet man jemanden, etwas **nicht** zu tun.\n- 見[み]る → 見[み]ない → 見[み]**ないでください** – Bitte nicht hinsehen.\n- 行[い]く → 行[い]かない → 行[い]か**ないでください** – Bitte geh nicht.\n\nIm Vergleich zu 〜てはいけません (Verbot, streng) ist 〜ないでください eine **Bitte** und klingt freundlicher. Unter Freunden sagt man einfach 〜ないで: 行[い]かないで！ – „Geh nicht!“",
  examples:[
    { jp:"ここで写真[しゃしん]を撮[と]らないでください。", de:"Bitte hier nicht fotografieren." },
    { jp:"教科書[きょうかしょ]を見[み]ないでください。", de:"Bitte nicht ins Lehrbuch schauen." },
    { jp:"明日[あした]のパーティーに遅[おく]れないでください。", de:"Bitte kommen Sie morgen nicht zu spät zur Party." },
    { jp:"心配[しんぱい]しないでください。", de:"Machen Sie sich bitte keine Sorgen." }
  ],
  tags:["bitte","verneinung","kurzform"],
  related:["g-g6-tekudasai","g-g6-tewaikenai","g-g8-short-present"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:nai}でください。",
      de:"Bitte {O:akk} nicht {V:inf}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"ここで{V:nai}でください。",
      de:"Bitte hier nicht {V:inf}." }
  ]
},

{ id:"g-g8-noga-suki", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"Verb + のが好き／上手 – etwas gern / gut tun",
  jp:"〜のが好[す]きです／〜のが上手[じょうず]です",
  summary:"Mit の wird ein Verb zum Nomen; so kann man sagen, dass man etwas gern oder gut tut.",
  structure:["Wörterbuchform + のが好[す]きです／きらいです", "Wörterbuchform + のが上手[じょうず]です／下手[へた]です"],
  explanation:"好[す]き, きらい, 上手[じょうず] (gut in etwas) und 下手[へた] (schlecht in etwas) stehen nach einem **Nomen mit が**. Will man sagen, dass man eine **Tätigkeit** gern tut, macht man das Verb mit **の** zu einem Nomen – ähnlich wie im Deutschen „das Lesen“:\n\n本[ほん]を読[よ]む**のが**好[す]きです。 – „Ich lese gern Bücher.“ (wörtlich: „Das Bücherlesen ist mir lieb.“)\n\nVor の steht die **Wörterbuchform**. Weitere Beispiele:\n- 料理[りょうり]を作[つく]るのが上手[じょうず]です。 – kann gut kochen\n- 歌[うた]を歌[うた]うのが下手[へた]です。 – kann schlecht singen\n\n上手[じょうず] verwendet man nicht für sich selbst (klingt eingebildet) – über sich sagt man lieber 得意[とくい] oder bescheiden 下手[へた].",
  examples:[
    { jp:"私[わたし]は音楽[おんがく]を聞[き]くのが好[す]きです。", de:"Ich höre gern Musik." },
    { jp:"たけしさんは料理[りょうり]を作[つく]るのが上手[じょうず]です。", de:"Takeshi kann gut kochen." },
    { jp:"私[わたし]は早[はや]く起[お]きるのがきらいです。", de:"Ich stehe nicht gern früh auf." },
    { jp:"メアリーさんは泳[およ]ぐのが下手[へた]です。", de:"Mary kann nicht gut schwimmen." }
  ],
  pitfalls:["Vor の die Wörterbuchform (nicht ます-Form).","Mit が, nicht を: 読[よ]むのが好[す]き."],
  tags:["nominalisierung","vorlieben","kurzform"],
  related:["g-g5-suki-kirai","g-g8-short-present"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:dict}のが好[す]きです。",
      de:"Ich {V:ich} gern {O:akki}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"{V:dict}のがあまり好[す]きじゃないです。",
      de:"Ich {V:ich} nicht so gern." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"友[とも]だちと{O}を{V:dict}のが大好[だいす]きです。",
      de:"Ich {V:ich} sehr gern mit Freunden {O:akki}." }
  ]
},

{ id:"g-g8-ga", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"Partikel が – Subjekt bei Fragewörtern und neuer Information",
  jp:"だれが〜／何[なに]が〜",
  summary:"Fragewörter als Subjekt werden immer mit が markiert, ebenso die Antwort darauf.",
  structure:["Fragewort + が + Prädikat？", "Antwort: X + が + Prädikat。／X です。"],
  explanation:"**は** markiert bekannte Themen, **が** markiert oft **neue, wichtige Information**. Ein **Fragewort** (だれ, 何[なに], どれ, どこ) kann niemals Thema sein, weil man die Antwort ja noch nicht kennt. Deshalb steht nach einem Fragewort als Subjekt immer **が**:\n\n**だれが**行[い]きますか。 – „Wer geht hin?“\n\nIn der Antwort bekommt das neue Element ebenfalls **が**: メアリーさん**が**行[い]きます。 – „*Mary* geht hin.“ (Im Deutschen würde man „Mary“ betonen.)\n\nVergleich:\n- メアリーさんは行[い]きます。 – Mary geht (Thema: Mary; was macht sie?)\n- メアリーさんが行[い]きます。 – *Mary* ist es, die geht.",
  examples:[
    { jp:"だれがこの料理[りょうり]を作[つく]りましたか。", de:"Wer hat dieses Essen gemacht?" },
    { jp:"たけしさんが作[つく]りました。", de:"Takeshi hat es gemacht." },
    { jp:"どの人[ひと]が山下[やました]先生[せんせい]ですか。", de:"Welche Person ist Professor Yamashita?" },
    { jp:"何[なに]がおいしいですか。", de:"Was ist lecker?" }
  ],
  pitfalls:["Nie は nach einem Fragewort (❌ だれは)."],
  tags:["partikel","subjekt","fragen"],
  related:["g-g2-kore","g-g8-nanika","g-g7-body"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"だれが{O}を{V:mashita}か。",
      de:"Wer hat {O:akk} {V:pp}?" },
    { slots:{ A:{pos:"noun", cat:["ort","land"]} },
      jp:"だれが{A}へ行[い]きますか。",
      de:"Wer geht {A:zu}?" }
  ]
},

{ id:"g-g8-nanika", type:"grammar", source:"Genki I", lesson:8, level:"N5",
  title:"何か und 何も – „etwas“ und „nichts“",
  jp:"何[なに]か／何[なに]も〜ない",
  summary:"何か = etwas (in Fragen und positiven Sätzen), 何も + Verneinung = nichts.",
  structure:["何[なに]か + positives Verb (etwas)", "何[なに]も + verneintes Verb (nichts)", "Partikeln は・が・を entfallen"],
  explanation:"Hängt man **か** an das Fragewort 何[なに], entsteht **何[なに]か** – „etwas“: 何[なに]か食[た]べましたか。 – „Hast du etwas gegessen?“\n\nMit **も** und einem **verneinten** Verb entsteht **何[なに]も〜ない** – „nichts“: 何[なに]も食[た]べませんでした。 – „Ich habe nichts gegessen.“ Im Deutschen reicht „nichts“ als Verneinung; im Japanischen muss **zusätzlich das Verb verneint** sein.\n\nDie Partikeln は, が, を fallen bei 何[なに]か und 何[なに]も weg (何[なに]かを ist möglich, meist entfällt を aber).\n\nDas gleiche Prinzip gilt für andere Fragewörter: だれか (jemand) / だれも〜ない (niemand), どこか (irgendwo) / どこにも〜ない (nirgendwo, → Lektion 10).",
  examples:[
    { jp:"何[なに]か飲[の]みませんか。", de:"Wollen wir etwas trinken?" },
    { jp:"朝[あさ]は何[なに]も食[た]べませんでした。", de:"Morgens habe ich nichts gegessen." },
    { jp:"週末[しゅうまつ]、何[なに]かしましたか。", de:"Hast du am Wochenende etwas gemacht?" },
    { jp:"いいえ、何[なに]もしませんでした。", de:"Nein, ich habe nichts gemacht." }
  ],
  pitfalls:["何[なに]も immer mit Verneinung (❌ 何[なに]も食[た]べました)."],
  tags:["pronomen","verneinung","unbestimmt"],
  related:["g-g10-dokoka","g-g8-ga","g-g3-frequency"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]} },
      jp:"昨日[きのう]は何[なに]も{V:masendeshita}。",
      de:"Gestern {V:aux} ich nichts {V:pp}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]} },
      jp:"何[なに]か{V:mashita}か。",
      de:"Haben Sie etwas {V:pp}?" },
    { slots:{ V:{pos:"verb", cat:["objekt"]} },
      jp:"何[なに]か{V:masenka}。",
      de:"Wollen wir etwas {V:inf}?" }
  ]
},

// ───────────── Lektion 9 ─────────────
{ id:"g-g9-short-past", type:"grammar", source:"Genki I", lesson:9, level:"N5",
  title:"Kurzformen der Vergangenheit (た-Form und なかった-Form)",
  jp:"〜た／〜なかった",
  summary:"Die informelle Vergangenheit: た-Form (positiv) und なかった-Form (negativ).",
  structure:["Verb: て → た, で → だ (食[た]べて → 食[た]べた, 読[よ]んで → 読[よ]んだ)", "Verb negativ: ない → なかった", "い-Adj.: 高[たか]かった / 高[たか]くなかった", "な-Adj./Nomen: 静[しず]かだった / 静[しず]かじゃなかった"],
  explanation:"Die **た-Form** (Kurzform der Vergangenheit) ist ganz einfach, wenn man die て-Form kann: Man ersetzt **て → た** und **で → だ**:\n- 食[た]べて → 食[た]べ**た**\n- 行[い]って → 行[い]っ**た**\n- 読[よ]んで → 読[よ]ん**だ**\n- して → し**た**, 来[き]て → 来[き]**た**\n\n**Verneinung**: ない → **なかった**: 食[た]べない → 食[た]べ**なかった**, 行[い]かない → 行[い]か**なかった**\n\n**Adjektive und Nomen**:\n- い-Adj.: 高[たか]かった / 高[たか]くなかった (wie in der höflichen Form, nur ohne です)\n- な-Adj.: 静[しず]か**だった** / 静[しず]かじゃ**なかった**\n- Nomen: 学生[がくせい]**だった** / 学生[がくせい]じゃ**なかった**\n\nDie た-Form ist wichtig für lockere Sprache, für Zitate (〜たと思[おも]います) und viele weitere Muster wie 〜たことがある (Lektion 11).",
  examples:[
    { jp:"昨日[きのう]、映画[えいが]を見[み]た。", de:"Gestern habe ich einen Film gesehen. (informell)" },
    { jp:"週末[しゅうまつ]はどこにも行[い]かなかった。", de:"Am Wochenende bin ich nirgendwohin gegangen. (informell)" },
    { jp:"テストは難[むずか]しかった。", de:"Der Test war schwer. (informell)" },
    { jp:"子供[こども]の時[とき]、元気[げんき]だった。", de:"Als Kind war ich munter. (informell)" }
  ],
  pitfalls:["た-Form = て-Form mit た/だ – Fehler in der て-Form übertragen sich.","な-Adj./Nomen: だった, nicht „かった“."],
  tags:["kurzform","vergangenheit","konjugation"],
  related:["g-g8-short-present","g-g6-te-form","g-g9-informal-past","g-g11-koto-ga-aru"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"昨日[きのう]、{O}を{V:ta}。",
      de:"Gestern {V:aux} ich {O:akki} {V:pp}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"昨日[きのう]は{V:nakatta}。",
      de:"Gestern {V:aux} ich nicht {V:pp}." },
    { slots:{ A:{pos:"noun", cat:["ort","land"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"先週[せんしゅう]、{A}に{V:ta}。",
      de:"Letzte Woche {V:aux} ich {A:zu} {V:pp}." }
  ]
},

{ id:"g-g9-informal-past", type:"grammar", source:"Genki I", lesson:9, level:"N5",
  title:"Vergangenheit in informeller Sprache",
  jp:"〜た？／どうだった？",
  summary:"Mit た-Formen erzählt und fragt man unter Freunden von Vergangenem.",
  structure:["Frage: た-Form + ？", "Wie war …? → 〜、どうだった？"],
  explanation:"In lockeren Gesprächen verwendet man die **た-Form** statt 〜ました und **だった** statt でした. Fragen enden wie im Präsens ohne か, nur mit steigender Stimme:\n- 昨日[きのう]、何[なに]した？ – Was hast du gestern gemacht?\n- 映画[えいが]、見[み]た？ – Hast du den Film gesehen?\n\nBesonders nützlich ist **どうだった？** – „Wie war's?“: 旅行[りょこう]、どうだった？ – „Wie war die Reise?“ Antwort z. B. 楽[たの]しかった！ (Es war lustig!).\n\nAuch hier gilt: Partikeln fallen oft weg, und bei Nomen/な-Adjektiven kann in Fragen das だった bleiben (元気[げんき]だった？ – Ging es dir gut?).",
  examples:[
    { jp:"「昨日[きのう]、何[なに]した？」「友[とも]だちと遊[あそ]んだ。」", de:"„Was hast du gestern gemacht?“ – „Ich habe mit Freunden abgehangen.“" },
    { jp:"「パーティー、どうだった？」「すごく楽[たの]しかった。」", de:"„Wie war die Party?“ – „Total lustig.“" },
    { jp:"宿題[しゅくだい]、もうした？", de:"Hast du die Hausaufgaben schon gemacht?" },
    { jp:"ううん、まだ。", de:"Nein, noch nicht." }
  ],
  tags:["informell","vergangenheit","gespräch"],
  related:["g-g9-short-past","g-g8-informal"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"昨日[きのう]、{O}を{V:ta}？",
      de:"Hast du gestern {O:akki} {V:pp}?" },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}、どうだった？",
      de:"Wie war {E:def}?" }
  ]
},

{ id:"g-g9-quote-past", type:"grammar", source:"Genki I", lesson:9, level:"N5",
  title:"〜と思います／〜と言っていました mit Vergangenheit",
  jp:"〜たと思[おも]います／〜たと言[い]っていました",
  summary:"Vor と思います und と言っていました können auch Kurzformen der Vergangenheit stehen.",
  structure:["た-Form/なかった-Form + と思[おも]います", "た-Form/なかった-Form + と言[い]っていました", "Nomen/な-Adj. + だった + と…"],
  explanation:"In Lektion 8 hast du 〜と思[おも]います und 〜と言[い]っていました mit Präsens-Kurzformen gelernt. Geht es um etwas **Vergangenes**, steht vor と einfach die **Kurzform der Vergangenheit**:\n- たけしさんはもう帰[かえ]っ**た**と思[おも]います。 – Ich glaube, Takeshi ist schon nach Hause gegangen.\n- テストは難[むずか]しかった**と思[おも]います**。 – Ich finde, der Test war schwer.\n- メアリーさんは昨日[きのう]勉強[べんきょう]し**なかった**と言[い]っていました。 – Mary hat gesagt, dass sie gestern nicht gelernt hat.\n\nBei Nomen und な-Adjektiven: 〜**だった**と思[おも]います. Die Zeitform richtet sich immer nach dem Zeitpunkt des Geschehens im zitierten Satz.",
  examples:[
    { jp:"メアリーさんは昨日[きのう]のパーティーに行[い]かなかったと思[おも]います。", de:"Ich glaube, Mary ist gestern nicht zur Party gegangen." },
    { jp:"旅行[りょこう]は楽[たの]しかったと思[おも]います。", de:"Ich glaube, die Reise hat Spaß gemacht." },
    { jp:"たけしさんは子供[こども]の時[とき]、野球[やきゅう]が好[す]きだったと言[い]っていました。", de:"Takeshi hat gesagt, dass er als Kind gern Baseball mochte." },
    { jp:"先生[せんせい]は宿題[しゅくだい]が多[おお]かったと言[い]っていました。", de:"Der Lehrer hat gesagt, dass es viele Hausaufgaben waren." }
  ],
  tags:["zitat","meinung","vergangenheit","kurzform"],
  related:["g-g8-to-omoimasu","g-g8-to-itteimashita","g-g9-short-past"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"先生[せんせい]は昨日[きのう]{O}を{V:ta}と言[い]っていました。",
      de:"Der Lehrer hat gesagt, dass er gestern {O:akki} {V:pp} hat." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"{E}は楽[たの]しかったと思[おも]います。",
      de:"Ich glaube, {E:def} hat Spaß gemacht." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"友[とも]だちは{E}は昨日[きのう]だったと言[い]っていました。",
      de:"Ein Freund hat gesagt, dass {E:def} gestern war." }
  ]
},

{ id:"g-g9-noun-modify", type:"grammar", source:"Genki I", lesson:9, level:"N5",
  title:"Nomen durch Verbphrasen näher bestimmen (Relativsätze)",
  jp:"（Kurzform-Satz）＋Nomen",
  summary:"Ein Satz in der Kurzform direkt vor einem Nomen beschreibt dieses Nomen – wie ein deutscher Relativsatz.",
  structure:["Kurzform-Verbphrase + Nomen", "めがねをかけている人[ひと] – die Person, die eine Brille trägt"],
  explanation:"Im Japanischen gibt es keine Relativpronomen wie „der, die, das, welcher“. Stattdessen stellt man einen **ganzen Satz in der Kurzform direkt vor das Nomen**:\n\n- **眼鏡[めがね]をかけている**人[ひと] – die Person, **die eine Brille trägt**\n- **昨日[きのう]買[か]った**本[ほん] – das Buch, **das ich gestern gekauft habe**\n- **京都[きょうと]に住[す]んでいる**友[とも]だち – ein Freund, **der in Kyoto wohnt**\n\nDie Reihenfolge ist also umgekehrt zum Deutschen: **Beschreibung zuerst, Nomen am Ende**. Das ganze Gebilde verhält sich wie ein Nomen und kann Thema, Objekt usw. sein.\n\nDas Subjekt innerhalb der Beschreibung bekommt が (nicht は): **私[わたし]が**作[つく]ったケーキ – der Kuchen, den ich gebacken habe. Sehr häufig ist die Frage **どの人[ひと]ですか** („Welche Person?“) mit der Antwort 〜ている人[ひと]です.",
  examples:[
    { jp:"あそこで本[ほん]を読[よ]んでいる人[ひと]はたけしさんです。", de:"Die Person, die dort drüben ein Buch liest, ist Takeshi." },
    { jp:"これは昨日[きのう]買[か]ったかばんです。", de:"Das ist die Tasche, die ich gestern gekauft habe." },
    { jp:"京都[きょうと]に住[す]んでいる友[とも]だちに会[あ]いました。", de:"Ich habe einen Freund getroffen, der in Kyoto wohnt." },
    { jp:"私[わたし]が作[つく]ったケーキを食[た]べてください。", de:"Bitte essen Sie den Kuchen, den ich gebacken habe." }
  ],
  pitfalls:["Das Subjekt im Relativsatz bekommt が, nicht は.","Vor dem Nomen steht die Kurzform, nicht die ます-Form."],
  tags:["relativsatz","kurzform","satzbau"],
  related:["g-g9-short-past","g-g7-teiru-progress","g-g8-short-present"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"これは昨日[きのう]{V:ta}{O}です。",
      de:"{O:akk} hier {V:aux} ich gestern {V:pp}." }
  ]
},

{ id:"g-g9-mou-mada", type:"grammar", source:"Genki I", lesson:9, level:"N5",
  title:"もう〜ました／まだ〜ていません – „schon“ und „noch nicht“",
  jp:"もう〜ました／まだ〜ていません",
  summary:"もう + Vergangenheit = schon getan; まだ + 〜ていません = noch nicht getan.",
  structure:["もう + Verb-ました。 – schon …", "まだ + Verb-て + いません。 – noch nicht …"],
  explanation:"**もう〜ました** bedeutet „schon …“: もう宿題[しゅくだい]をしました。 – „Ich habe die Hausaufgaben schon gemacht.“\n\n**„Noch nicht“** bildet man mit **まだ + 〜ていません** – nicht mit der Vergangenheit! Die Idee: Der Zustand „nicht getan“ dauert noch an.\n- まだ宿題[しゅくだい]をしていません。 – Ich habe die Hausaufgaben noch nicht gemacht.\n- ❌ まだ宿題[しゅくだい]をしませんでした (das hieße „habe (damals) nicht gemacht“)\n\nKurze Antwort auf もう〜ましたか: いいえ、**まだです**。 – „Nein, noch nicht.“ Informell: ううん、まだ。",
  examples:[
    { jp:"もう昼[ひる]ご飯[はん]を食[た]べましたか。", de:"Hast du schon zu Mittag gegessen?" },
    { jp:"いいえ、まだ食[た]べていません。", de:"Nein, ich habe noch nicht gegessen." },
    { jp:"メアリーさんはもう帰[かえ]りました。", de:"Mary ist schon nach Hause gegangen." },
    { jp:"その映画[えいが]はまだ見[み]ていません。", de:"Den Film habe ich noch nicht gesehen." }
  ],
  pitfalls:["„noch nicht“ = まだ〜ていません, nicht まだ〜ませんでした."],
  tags:["zeit","adverbien","te-form"],
  related:["g-g7-teiru-progress","g-g4-mashita"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"もう{O}を{V:mashita}か。",
      de:"Haben Sie {O:akk} schon {V:pp}?" },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}はまだ{V:te}いません。",
      de:"{O:akk} {V:aux} ich noch nicht {V:pp}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"まだ{V:te}いません。",
      de:"Ich {V:aux} noch nicht {V:pp}." }
  ]
},

{ id:"g-g9-kara", type:"grammar", source:"Genki I", lesson:9, level:"N5",
  title:"〜から mit Kurzformen – Grund angeben",
  jp:"（Kurzform）から、〜",
  summary:"Vor から (weil) kann auch die Kurzform stehen – im höflichen Satz wie im lockeren Gespräch.",
  structure:["Kurzform + から、höflicher Hauptsatz", "Nomen/な-Adj. + だから"],
  explanation:"Das 〜から aus Lektion 6 kann man auch mit **Kurzformen** verwenden. Das ist sogar sehr häufig: Der Nebensatz steht in der Kurzform, nur der **Hauptsatz am Ende** bestimmt die Höflichkeit.\n\n- 明日[あした]テストが**ある**から、今晩[こんばん]勉強[べんきょう]します。\n- 昨日[きのう]は忙[いそが]し**かった**から、宿題[しゅくだい]をしませんでした。\n- 今日[きょう]は日曜日[にちようび]**だ**から、学校[がっこう]に行[い]きません。\n\nBei **Nomen und な-Adjektiven** muss **だ** (Gegenwart) bzw. **だった** (Vergangenheit) stehen: 暇[ひま]**だ**から, 病気[びょうき]**だった**から.\n\nIm Deutschen gibt man solche Sätze gut mit „…, deshalb …“ oder „Weil …, …“ wieder.",
  examples:[
    { jp:"昨日[きのう]は忙[いそが]しかったから、どこにも行[い]きませんでした。", de:"Gestern war ich beschäftigt, deshalb bin ich nirgendwohin gegangen." },
    { jp:"雨[あめ]だから、うちにいます。", de:"Weil es regnet, bleibe ich zu Hause." },
    { jp:"お金[かね]がないから、何[なに]も買[か]いません。", de:"Weil ich kein Geld habe, kaufe ich nichts." },
    { jp:"テストが難[むずか]しかったから、疲[つか]れました。", de:"Der Test war schwer, deshalb bin ich müde." }
  ],
  pitfalls:["Nomen/な-Adj. brauchen だ vor から (✔ 暇[ひま]だから, ❌ 暇[ひま]から)."],
  tags:["grund","kurzform","satzverbindung"],
  related:["g-g6-kara","g-g12-node","g-g9-short-past"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"昨日[きのう]は暇[ひま]だったから、{O}を{V:mashita}。",
      de:"Gestern hatte ich Zeit, deshalb {V:aux} ich {O:akki} {V:pp}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"昨日[きのう]は忙[いそが]しかったから、{V:masendeshita}。",
      de:"Gestern war ich beschäftigt, deshalb {V:aux} ich nicht {V:pp}." },
    { slots:{ G:{pos:"noun", cat:["getraenk"]} },
      jp:"{G}が好[す]きだから、よく飲[の]みます。",
      de:"Weil ich {G:akk} mag, trinke ich oft {G:akki}." }
  ]
},

// ───────────── Lektion 10 ─────────────
{ id:"g-g10-yori", type:"grammar", source:"Genki I", lesson:10, level:"N5",
  title:"Vergleich zweier Dinge: より・のほうが",
  jp:"AはBより〜／AとBとどちらが〜／Aのほうが〜",
  summary:"Vergleiche bildet man mit より („als“) und のほうが („eher A“) – das Adjektiv selbst bleibt unverändert.",
  structure:["A は B より + Adjektiv です。 – A ist …er als B.", "A と B と どちらが + Adjektiv ですか。 – Was ist …er, A oder B?", "A のほうが + Adjektiv です。 – A ist …er."],
  explanation:"Im Japanischen gibt es **keine Steigerungsform** wie „größer“ oder „schneller“. Das Adjektiv bleibt gleich, und die Partikel **より** („als“) zeigt den Vergleich:\n\n東京[とうきょう]は大阪[おおさか]**より**大[おお]きいです。 – „Tokio ist größer als Osaka.“\n\n**Fragen**: A と B と **どちらが** 〜ですか。 – „Was ist …er, A oder B?“ (Umgangssprachlich auch どっち.)\n\n**Antwort**: A **のほうが** 〜です。 – „A ist …er.“ Man kann beides kombinieren: A のほうが B より〜です.\n\nEs funktioniert auch mit 好[す]き: 犬[いぬ]と猫[ねこ]とどちらが好[す]きですか。 – 猫[ねこ]のほうが好[す]きです。 („Ich mag Katzen lieber.“) Sind beide gleich: どちらも〜です (beide sind …).",
  examples:[
    { jp:"日本[にほん]はアメリカより小[ちい]さいです。", de:"Japan ist kleiner als Amerika." },
    { jp:"コーヒーと紅茶[こうちゃ]とどちらが好[す]きですか。", de:"Was magst du lieber, Kaffee oder Tee?" },
    { jp:"紅茶[こうちゃ]のほうが好[す]きです。", de:"Ich mag Tee lieber." },
    { jp:"電車[でんしゃ]のほうがバスより速[はや]いです。", de:"Der Zug ist schneller als der Bus." }
  ],
  pitfalls:["Das Adjektiv wird nicht gesteigert – der Vergleich steckt in より/のほうが.","Bei der Frage heißt es どちら (von zweien), nicht どれ."],
  tags:["vergleich","adjektive","partikel"],
  related:["g-g10-ichiban","g-g5-suki-kirai","g-g5-adjectives"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding"]}, M:{pos:"noun", cat:["ding"]} },
      jp:"{N}は{M}より高[たか]いです。",
      de:"{N:def} ist teurer als {M:def}." },
    { slots:{ L:{pos:"noun", cat:["land"]}, K:{pos:"noun", cat:["land"]} },
      jp:"{L}は{K}より大[おお]きいです。",
      de:"{L:def} ist größer als {K:def}." },
    { slots:{ N:{pos:"noun", cat:["getraenk"]}, M:{pos:"noun", cat:["getraenk"]} },
      jp:"{N}と{M}とどちらが好[す]きですか。",
      de:"Was mögen Sie lieber, {N:akk} oder {M:akk}?" },
    { slots:{ N:{pos:"noun", cat:["getraenk","essen","sport"]}, M:{pos:"noun", cat:["getraenk","essen","sport"]} },
      jp:"{M}より{N}のほうが好[す]きです。",
      de:"Ich mag {N:akk} lieber als {M:akk}." }
  ]
},

{ id:"g-g10-ichiban", type:"grammar", source:"Genki I", lesson:10, level:"N5",
  title:"Superlativ mit いちばん",
  jp:"〜の中[なか]でAがいちばん〜",
  summary:"いちばん („Nummer eins“) vor dem Adjektiv bildet den Superlativ: „am …sten“.",
  structure:["Gruppe の中[なか]で A が いちばん + Adjektiv です。", "Frage: Gruppe の中[なか]で 何[なに]／どこ／だれ が いちばん〜ですか。"],
  explanation:"**いちばん** (wörtlich „Nummer eins“) vor einem Adjektiv macht daraus einen **Superlativ**: いちばん大[おお]きい – „am größten“.\n\nDie **Vergleichsgruppe** nennt man mit **〜の中[なか]で** („unter …“): 日本[にほん]の町[まち]の中[なか]で, 家族[かぞく]の中[なか]で. Das Element, das am …sten ist, bekommt **が**:\n\n家族[かぞく]の中[なか]で父[ちち]**がいちばん**背[せ]が高[たか]いです。 – „In meiner Familie ist mein Vater am größten.“\n\nFragen nach dem Superlativ verwenden je nach Sache **何[なに]** (Dinge), **どこ** (Orte), **だれ** (Personen), **いつ** (Zeit) – immer mit が: 季節[きせつ]の中[なか]で**いつが**いちばん好[す]きですか。 („Welche Jahreszeit magst du am liebsten?“)",
  examples:[
    { jp:"日本[にほん]の町[まち]の中[なか]で京都[きょうと]がいちばん好[す]きです。", de:"Von den japanischen Städten mag ich Kyoto am liebsten." },
    { jp:"クラスの中[なか]でだれがいちばん背[せ]が高[たか]いですか。", de:"Wer ist in der Klasse am größten?" },
    { jp:"食[た]べ物[もの]の中[なか]で何[なに]がいちばん好[す]きですか。", de:"Was ist dein Lieblingsessen (von allen Speisen)?" },
    { jp:"一年[いちねん]の中[なか]で八月[はちがつ]がいちばん暑[あつ]いです。", de:"Im Jahr ist der August am heißesten." }
  ],
  tags:["vergleich","superlativ","adjektive"],
  related:["g-g10-yori","g-g5-suki-kirai"],
  patterns:[
    { slots:{ S:{pos:"noun", cat:["sport"], not:["v-g3-supootsu"]} },
      jp:"スポーツの中[なか]で{S}がいちばん好[す]きです。",
      de:"Von allen Sportarten mag ich {S:akk} am liebsten." },
    { slots:{ G:{pos:"noun", cat:["getraenk"]} },
      jp:"飲[の]み物[もの]の中[なか]で{G}がいちばん好[す]きです。",
      de:"Von allen Getränken mag ich {G:akk} am liebsten." },
    { slots:{ F:{pos:"noun", cat:["fach"]} },
      jp:"授業[じゅぎょう]の中[なか]で{F}がいちばんおもしろいです。",
      de:"Von allen Kursen ist {F:w} am interessantesten." }
  ]
},

{ id:"g-g10-adj-no", type:"grammar", source:"Genki I", lesson:10, level:"N5",
  title:"Adjektiv/Nomen + の – „der/die/das …e“",
  jp:"〜の（=もの）",
  summary:"の nach einem Adjektiv oder Nomen ersetzt ein bereits bekanntes Nomen: „der blaue“, „der von Mary“.",
  structure:["い-Adj. + の: 高[たか]いの (der teure)", "な-Adj. + なの: 静[しず]かなの (der ruhige)", "Nomen + の: メアリーさんの (der von Mary)"],
  explanation:"Wenn klar ist, worüber man spricht, muss man das Nomen nicht wiederholen. Stattdessen setzt man **の** hinter das Adjektiv – ähnlich wie im Deutschen „der rote“ oder englisch „the red one“:\n\n「どんなかばんがほしいですか。」「**黒[くろ]いの**がほしいです。」 – „Was für eine Tasche möchtest du?“ – „Eine schwarze.“\n\n- **い-Adjektive**: direkt + の: 安[やす]いの, 大[おお]きいの\n- **な-Adjektive**: mit な: きれい**な**の, 静[しず]か**な**の\n- **Nomen**: + の: 私[わたし]の (meiner), 日本[にほん]の (der japanische)\n\nDieses の ist wie ein Pronomen und kann mit allen Partikeln stehen: 高[たか]いの**を**買[か]いました, 赤[あか]いの**は**いくらですか.",
  examples:[
    { jp:"このシャツは小[ちい]さいです。大[おお]きいのはありますか。", de:"Dieses Hemd ist zu klein. Haben Sie ein größeres?" },
    { jp:"私[わたし]は安[やす]いのを買[か]いました。", de:"Ich habe das billige gekauft." },
    { jp:"「どの傘[かさ]ですか。」「その青[あお]いのです。」", de:"„Welcher Regenschirm?“ – „Der blaue da.“" },
    { jp:"この辞書[じしょ]はたけしさんのです。", de:"Dieses Wörterbuch ist Takeshis." }
  ],
  pitfalls:["な-Adjektive brauchen な vor の (きれいなの).","い-Adjektive ohne な (❌ 高[たか]いなの)."],
  tags:["adjektive","nomen","pronomen"],
  related:["g-g1-no","g-g5-adjectives"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["kleidung","ding"]} },
      jp:"この{N}は高[たか]いです。安[やす]いのはありますか。",
      de:"{N:def} hier ist teuer. Gibt es auch ein billigeres Modell?" }
  ]
},

{ id:"g-g10-tsumori", type:"grammar", source:"Genki I", lesson:10, level:"N5",
  title:"〜つもりだ – Absicht, Plan",
  jp:"〜つもりです",
  summary:"Wörterbuchform/ない-Form + つもりです = „vorhaben, zu …“",
  structure:["Wörterbuchform + つもりです。 – habe vor zu …", "ない-Form + つもりです。 – habe vor, nicht zu …", "Vergangenheit: 〜つもりでした (hatte vor, aber …)"],
  explanation:"Mit **〜つもりです** drückt man einen **Plan** oder eine **feste Absicht** aus: „Ich habe vor, … zu …“ / „Ich will …“. Davor steht die **Kurzform im Präsens**:\n- 週末[しゅうまつ]京都[きょうと]に行[い]く**つもりです**。 – Am Wochenende will ich nach Kyoto fahren.\n- 今晩[こんばん]は勉強[べんきょう]しない**つもりです**。 – Heute Abend habe ich vor, nicht zu lernen.\n\nIn der **Vergangenheit** (〜つもりでした) bedeutet es, dass man etwas vorhatte, es aber nicht getan hat: 行[い]くつもりでしたが、行[い]きませんでした。\n\nUnterschied zu 〜たい: 〜たいです ist ein *Wunsch* („ich möchte“), 〜つもりです ein *Plan* („ich habe vor“). Nach den Plänen von Vorgesetzten fragt man nicht mit つもり – das wirkt unhöflich.",
  examples:[
    { jp:"夏休[なつやす]みに日本[にほん]へ行[い]くつもりです。", de:"In den Sommerferien habe ich vor, nach Japan zu fahren." },
    { jp:"週末[しゅうまつ]はどこにも行[い]かないつもりです。", de:"Am Wochenende habe ich vor, nirgendwohin zu gehen." },
    { jp:"大学[だいがく]を卒業[そつぎょう]してから、会社[かいしゃ]で働[はたら]くつもりです。", de:"Nach dem Uniabschluss will ich in einer Firma arbeiten." },
    { jp:"昨日[きのう]勉強[べんきょう]するつもりでしたが、しませんでした。", de:"Gestern wollte ich lernen, habe es aber nicht getan." }
  ],
  pitfalls:["Nicht mit der ます-Form verbinden (❌ 行[い]きますつもり).","Vorgesetzte nicht mit 〜つもりですか nach ihren Plänen fragen."],
  tags:["absicht","zukunft","kurzform"],
  related:["g-g11-tai","g-g8-short-present"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"明日[あした]{O}を{V:dict}つもりです。",
      de:"Morgen will ich {O:akki} {V:inf}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"週末[しゅうまつ]は{V:nai}つもりです。",
      de:"Am Wochenende will ich nicht {V:inf}." },
    { slots:{ L:{pos:"noun", cat:["land"]} },
      jp:"来年[らいねん]{L}へ行[い]くつもりです。",
      de:"Nächstes Jahr habe ich vor, {L:zu} zu fahren." }
  ]
},

{ id:"g-g10-naru", type:"grammar", source:"Genki I", lesson:10, level:"N5",
  title:"Adjektiv/Nomen + なる – „werden“",
  jp:"〜くなる／〜になる",
  summary:"なる („werden“) beschreibt eine Veränderung: い-Adj. → 〜くなる, な-Adj./Nomen → 〜になる.",
  structure:["い-Adj.: 寒[さむ]い → 寒[さむ]くなります", "な-Adj.: 元気[げんき] → 元気[げんき]になります", "Nomen: 先生[せんせい] → 先生[せんせい]になります", "いい → よくなります"],
  explanation:"**なる** heißt „werden“ und ist ein う-Verb (なります, なりました). Davor steht ein Adjektiv oder Nomen in einer besonderen Form:\n- **い-Adjektive**: い → **く**: 寒[さむ]い → 寒[さむ]**く**なりました (ist kalt geworden); いい → **よく**なりました\n- **な-Adjektive**: + **に**: 元気[げんき] → 元気[げんき]**に**なりました (ist wieder gesund geworden)\n- **Nomen**: + **に**: 医者[いしゃ] → 医者[いしゃ]**に**なりたいです (ich möchte Arzt werden)\n\nMit einem Vergleich kombiniert: 日本語[にほんご]が前[まえ]より上手[じょうず]になりました。 – „Mein Japanisch ist besser geworden als vorher.“ Im Deutschen übersetzt man oft mit dem Komparativ: 安[やす]くなりました – „ist billiger geworden“.",
  examples:[
    { jp:"暖[あたた]かくなりましたね。", de:"Es ist wärmer geworden, nicht wahr?" },
    { jp:"日本語[にほんご]が上手[じょうず]になりました。", de:"Mein Japanisch ist gut geworden." },
    { jp:"私[わたし]は先生[せんせい]になりたいです。", de:"Ich möchte Lehrer werden." },
    { jp:"病気[びょうき]がよくなりました。", de:"Die Krankheit ist besser geworden." }
  ],
  pitfalls:["い-Adj.: 〜くなる (❌ 寒[さむ]いになる).","いい → よくなる."],
  tags:["veränderung","adjektive","verben"],
  related:["g-g5-adj-conjugation","g-g7-adj-te"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding","kleidung"]} },
      jp:"{N}は安[やす]くなりました。",
      de:"{N:def} ist billiger geworden." },
    { slots:{ L:{pos:"noun", cat:["land"]} },
      jp:"{L}は寒[さむ]くなりました。",
      de:"{L:in} ist es kalt geworden." },
    { slots:{ S:{pos:"noun", cat:["sprache"]} },
      jp:"{S}が上手[じょうず]になりました。",
      de:"Mein {S:w} ist besser geworden." }
  ]
},

{ id:"g-g10-dokoka", type:"grammar", source:"Genki I", lesson:10, level:"N5",
  title:"どこかに／どこにも – irgendwo, nirgendwo",
  jp:"どこかに／どこにも〜ない",
  summary:"Fragewort + か = irgend-; Fragewort + も + Verneinung = nirgend-/niemand/nichts.",
  structure:["どこか（に/へ/で） + positives Verb – irgendwo(hin)", "どこ（に/へ/で）も + verneintes Verb – nirgendwo(hin)", "だれか / だれも〜ない – jemand / niemand"],
  explanation:"Wie 何[なに]か/何[なに]も (Lektion 8) gibt es auch für Orte und Personen solche Formen:\n- **どこか** – irgendwo(hin); **どこも〜ない** – nirgendwo(hin)\n- **だれか** – jemand; **だれも〜ない** – niemand\n- **何[なに]か** – etwas; **何[なに]も〜ない** – nichts\n\nBei den Partikeln gilt: **は, が, を fallen weg**, aber **に, へ, で bleiben** – und zwar bei か **nach** か (どこか**に**) und bei も **vor** も (どこ**に**も):\n- 週末[しゅうまつ]どこかに行[い]きましたか。 – Bist du am Wochenende irgendwohin gefahren?\n- いいえ、どこにも行[い]きませんでした。 – Nein, ich bin nirgendwohin gefahren.\n\nAchtung: どこも/だれも/何[なに]も brauchen **immer** ein verneintes Verb.",
  examples:[
    { jp:"週末[しゅうまつ]、どこかへ行[い]きましたか。", de:"Bist du am Wochenende irgendwohin gefahren?" },
    { jp:"いいえ、どこにも行[い]きませんでした。", de:"Nein, ich bin nirgendwohin gefahren." },
    { jp:"教室[きょうしつ]にだれかいますか。", de:"Ist jemand im Klassenzimmer?" },
    { jp:"だれもいません。", de:"Es ist niemand da." }
  ],
  pitfalls:["Reihenfolge: どこかに, aber どこにも.","どこも/だれも + Verneinung."],
  tags:["pronomen","unbestimmt","verneinung"],
  related:["g-g8-nanika"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"どこかで{O}を{V:mashou}。",
      de:"Lass uns irgendwo {O:akki} {V:inf}!" },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"週末[しゅうまつ]はどこにも行[い]きませんでした。うちで{O}を{V:mashita}。",
      de:"Am Wochenende bin ich nirgendwohin gegangen. Ich {V:aux} zu Hause {O:akki} {V:pp}." }
  ]
},

{ id:"g-g10-de-means", type:"grammar", source:"Genki I", lesson:10, level:"N5",
  title:"Partikel で – Mittel und Werkzeug",
  jp:"Mittelで＋Verb",
  summary:"で markiert das Mittel, Werkzeug oder die Sprache, mit dem/in der man etwas tut.",
  structure:["Verkehrsmittel + で + 行[い]きます (mit dem Bus …)", "Werkzeug + で (mit Stäbchen …)", "Sprache + で (auf Japanisch …)"],
  explanation:"Neben dem Ort einer Handlung (Lektion 3) markiert **で** auch das **Mittel**, mit dem man etwas tut – im Deutschen meist „mit“ oder „auf“:\n- **Verkehrsmittel**: バス**で**学校[がっこう]に行[い]きます。 – Ich fahre mit dem Bus zur Schule.\n- **Werkzeug**: 箸[はし]**で**ご飯[はん]を食[た]べます。 – Ich esse mit Stäbchen.\n- **Sprache**: 日本語[にほんご]**で**話[はな]します。 – Ich spreche auf Japanisch.\n\nZu Fuß gehen heißt nicht „足[あし]で“, sondern **歩[ある]いて**行[い]きます. Die Dauer fragt man mit **どのぐらい** (wie lange): うちから駅[えき]までバスで**どのぐらい**かかりますか。 – „Wie lange braucht man mit dem Bus von zu Hause bis zum Bahnhof?“\n\nNicht verwechseln: „mit einer Person“ = **と**, „mit einem Mittel“ = **で**.",
  examples:[
    { jp:"毎日[まいにち]電車[でんしゃ]で大学[だいがく]に行[い]きます。", de:"Ich fahre jeden Tag mit dem Zug zur Uni." },
    { jp:"日本語[にほんご]で手紙[てがみ]を書[か]きました。", de:"Ich habe einen Brief auf Japanisch geschrieben." },
    { jp:"箸[はし]で食[た]べます。", de:"Ich esse mit Stäbchen." },
    { jp:"うちから学校[がっこう]まで自転車[じてんしゃ]で十分[じゅっぷん]かかります。", de:"Von zu Hause bis zur Schule brauche ich mit dem Fahrrad zehn Minuten." }
  ],
  pitfalls:["Person = と, Mittel = で.","Zu Fuß: 歩[ある]いて行[い]きます."],
  tags:["partikel","verkehr","mittel"],
  related:["g-g3-de","g-g4-to"],
  patterns:[
    { slots:{ B:{pos:"noun", cat:["verkehr"]}, A:{pos:"noun", cat:["ort","land"]} },
      jp:"{B}で{A}へ行[い]きます。",
      de:"Ich fahre mit {B:dat} {A:zu}." },
    { slots:{ S:{pos:"noun", cat:["sprache"]} },
      jp:"{S}で手紙[てがみ]を書[か]きました。",
      de:"Ich habe einen Brief auf {S:w} geschrieben." },
    { slots:{ S:{pos:"noun", cat:["sprache"]} },
      jp:"{S}で話[はな]してください。",
      de:"Bitte sprechen Sie auf {S:w}." }
  ]
},

// ───────────── Lektion 11 ─────────────
{ id:"g-g11-tai", type:"grammar", source:"Genki I", lesson:11, level:"N5",
  title:"〜たい – „etwas tun wollen/möchten“",
  jp:"〜たいです",
  summary:"Verbstamm + たいです drückt einen eigenen Wunsch aus: „Ich möchte …“",
  structure:["Verbstamm + たいです。 – möchte …", "Verbstamm + たくないです。 – möchte nicht …", "Vergangenheit: 〜たかったです／〜たくなかったです"],
  explanation:"Mit **Verbstamm + たい** sagt man, was man **tun möchte**: 行[い]き**たい**です (ich möchte hingehen), 食[た]べ**たい**です (ich möchte essen).\n\n〜たい konjugiert wie ein **い-Adjektiv**:\n- 行[い]きたいです – möchte gehen\n- 行[い]きたくないです – möchte nicht gehen\n- 行[い]きたかったです – wollte gehen\n- 行[い]きたくなかったです – wollte nicht gehen\n\nDas Objekt kann mit **を** oder **が** stehen: 水[みず]**を**／**が**飲[の]みたいです.\n\nWichtig: 〜たい drückt nur **eigene** Wünsche aus (oder fragt nach denen des Gesprächspartners). Über die Wünsche Dritter spricht man mit **〜たがっている**: たけしさんは日本[にほん]に帰[かえ]りたがっています。 Einem Vorgesetzten 〜たいですか zu fragen, wirkt zu direkt.",
  examples:[
    { jp:"日本[にほん]に行[い]きたいです。", de:"Ich möchte nach Japan fahren." },
    { jp:"今日[きょう]は何[なに]も食[た]べたくないです。", de:"Heute möchte ich nichts essen." },
    { jp:"子供[こども]の時[とき]、パイロットになりたかったです。", de:"Als Kind wollte ich Pilot werden." },
    { jp:"何[なに]が飲[の]みたいですか。", de:"Was möchtest du trinken?" }
  ],
  pitfalls:["〜たい nur für eigene Wünsche; für andere: 〜たがっている.","Verneinung wie い-Adjektiv: 〜たくないです."],
  tags:["wunsch","verben","adjektive"],
  related:["g-g10-tsumori","g-g7-stem-ni-iku","g-g5-adj-conjugation"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:tai}。",
      de:"Ich möchte {O:akki} {V:inf}." },
    { slots:{ A:{pos:"noun", cat:["ort","land"]}, V:{pos:"verb", cat:["bewegung"]} },
      jp:"{A}へ{V:tai}。",
      de:"Ich möchte {A:zu} {V:inf}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"今日[きょう]は{V:stem}たくないです。",
      de:"Heute möchte ich nicht {V:inf}." },
    { slots:{ L:{pos:"noun", cat:["land"]} },
      jp:"いつか{L}に住[す]みたいです。",
      de:"Ich möchte irgendwann {L:in} wohnen." }
  ]
},

{ id:"g-g11-tari", type:"grammar", source:"Genki I", lesson:11, level:"N5",
  title:"〜たり〜たりする – Beispielhafte Aufzählung von Handlungen",
  jp:"〜たり〜たりします",
  summary:"Mit 〜たり〜たりする nennt man einige Handlungen beispielhaft: „unter anderem … und …“",
  structure:["Verb-た + り、Verb-た + り + します／しました。"],
  explanation:"Mit **〜たり〜たりする** zählt man **Beispiele** für Tätigkeiten auf – es gibt noch mehr, aber diese sind typisch. Im Deutschen: „unter anderem …, …“ oder „Ich … und … und so.“\n\nBildung: **た-Form + り** für jede Handlung, am Ende **する** in der passenden Form:\n\n週末[しゅうまつ]は映画[えいが]を**見[み]たり**、買[か]い物[もの]を**したり**します。 – „Am Wochenende sehe ich zum Beispiel Filme, gehe einkaufen und so.“\n\n**Die Zeit steht nur bei する am Ende**: 〜たり〜たりしました (Vergangenheit), 〜たり〜たりしたいです (möchte). Unterschied zur て-Form: て gibt eine **feste Reihenfolge** und eine vollständige Liste an, たり nur **Beispiele ohne Reihenfolge**.",
  examples:[
    { jp:"週末[しゅうまつ]は掃除[そうじ]をしたり、洗濯[せんたく]をしたりします。", de:"Am Wochenende putze ich unter anderem und wasche Wäsche." },
    { jp:"昨日[きのう]は友[とも]だちと話[はな]したり、音楽[おんがく]を聞[き]いたりしました。", de:"Gestern habe ich unter anderem mit Freunden geredet und Musik gehört." },
    { jp:"京都[きょうと]でお寺[てら]を見[み]たり、写真[しゃしん]を撮[と]ったりしたいです。", de:"In Kyoto möchte ich Tempel besichtigen, Fotos machen und so weiter." },
    { jp:"授業[じゅぎょう]中[ちゅう]に寝[ね]たり、食[た]べたりしてはいけません。", de:"Während des Unterrichts darf man nicht schlafen, essen oder Ähnliches." }
  ],
  pitfalls:["Beide Verben brauchen 〜たり; am Ende kommt する.","Nur Beispiele – für eine feste Reihenfolge die て-Form verwenden."],
  tags:["aufzählung","kurzform","verben"],
  related:["g-g6-te-connect","g-g9-short-past","g-g11-ya"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"}, W:{pos:"verb", cat:["objekt"]}, P:{pos:"noun", objOf:"W"} },
      jp:"週末[しゅうまつ]は{O}を{V:ta}り、{P}を{W:ta}りしました。",
      de:"Am Wochenende {V:aux} ich unter anderem {O:akki} {V:pp} und {P:akki} {W:pp}." },
    { slots:{ P:{pos:"noun", cat:["ort"]}, V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{P}で{O}を{V:ta}り、友[とも]だちと話[はな]したりしました。",
      de:"{P:in} {V:aux} ich unter anderem {O:akki} {V:pp} und mit Freunden geredet." }
  ]
},

{ id:"g-g11-koto-ga-aru", type:"grammar", source:"Genki I", lesson:11, level:"N5",
  title:"〜たことがある – Erfahrung",
  jp:"〜たことがあります",
  summary:"た-Form + ことがあります = „Ich habe schon einmal …“",
  structure:["Verb-た + ことがあります。 – habe schon einmal …", "Verb-た + ことがありません。 – habe noch nie …"],
  explanation:"Mit **た-Form + ことがあります** sagt man, dass man etwas **schon einmal erlebt** hat: 日本[にほん]に行[い]った**ことがあります**。 – „Ich war schon einmal in Japan.“\n\nこと macht den Satz zu einem Nomen („die Sache, dass ich … habe“), und あります sagt: Diese Erfahrung existiert.\n\nVerneint: **〜たことがありません** – „noch nie“: 富士山[ふじさん]に登[のぼ]ったことがありません。 – „Ich habe den Fuji noch nie bestiegen.“\n\nFrage: 〜たことがありますか – „Haben Sie schon einmal …?“ Kurze Antworten: はい、あります。 / いいえ、ありません。 Für Dinge, die man täglich tut, verwendet man diese Form nicht (❌ ご飯[はん]を食[た]べたことがあります).",
  examples:[
    { jp:"日本[にほん]に行[い]ったことがありますか。", de:"Waren Sie schon einmal in Japan?" },
    { jp:"はい、二回[にかい]あります。", de:"Ja, zweimal." },
    { jp:"私[わたし]は着物[きもの]を着[き]たことがありません。", de:"Ich habe noch nie einen Kimono getragen." },
    { jp:"たけしさんは有名[ゆうめい]な人[ひと]に会[あ]ったことがあります。", de:"Takeshi hat schon einmal eine berühmte Person getroffen." }
  ],
  pitfalls:["Vor こと steht die た-Form (Vergangenheit), nicht die Wörterbuchform.","Nicht für alltägliche Handlungen verwenden."],
  tags:["erfahrung","kurzform","vergangenheit"],
  related:["g-g9-short-past","g-g8-noga-suki"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:ta}ことがあります。",
      de:"Ich {V:aux} schon einmal {O:akki} {V:pp}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:ta}ことがありません。",
      de:"Ich {V:aux} noch nie {O:akki} {V:pp}." },
    { slots:{ L:{pos:"noun", cat:["land"]} },
      jp:"{L}に行[い]ったことがありますか。",
      de:"Waren Sie schon einmal {L:in}?" }
  ]
},

{ id:"g-g11-ya", type:"grammar", source:"Genki I", lesson:11, level:"N5",
  title:"Nomen A や Nomen B – „A und B (unter anderem)“",
  jp:"AやB",
  summary:"や verbindet Nomen als Beispiele einer längeren Liste: „A, B und so weiter“.",
  structure:["Nomen A や Nomen B (など)"],
  explanation:"**や** verbindet wie と Nomen, bedeutet aber: „**unter anderem** A und B“ – die Liste ist **nicht vollständig**. Oft steht am Ende noch **など** („usw.“):\n\nかばんの中[なか]に本[ほん]**や**財布[さいふ]**など**があります。 – „In der Tasche sind unter anderem ein Buch und ein Portemonnaie.“\n\nVergleich:\n- 本[ほん]と雑誌[ざっし]を買[か]いました。 – Ich habe ein Buch und eine Zeitschrift gekauft (und sonst nichts).\n- 本[ほん]や雑誌[ざっし]を買[か]いました。 – Ich habe z. B. Bücher und Zeitschriften gekauft (und noch anderes).\n\nや ist das Gegenstück zu 〜たり〜たり bei Verben: Beide nennen Beispiele.",
  examples:[
    { jp:"京都[きょうと]や奈良[なら]に行[い]きました。", de:"Ich war unter anderem in Kyoto und Nara." },
    { jp:"私[わたし]はすしや天[てん]ぷらが好[す]きです。", de:"Ich mag zum Beispiel Sushi und Tempura." },
    { jp:"机[つくえ]の上[うえ]に本[ほん]やペンなどがあります。", de:"Auf dem Tisch sind Bücher, Stifte und so weiter." },
    { jp:"パーティーで先生[せんせい]や友[とも]だちに会[あ]いました。", de:"Auf der Party habe ich unter anderem den Lehrer und Freunde getroffen." }
  ],
  pitfalls:["や nur zwischen Nomen, nicht zwischen Verben (dafür 〜たり〜たり)."],
  tags:["partikel","aufzählung","und"],
  related:["g-g4-to","g-g11-tari"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["ding"]}, M:{pos:"noun", cat:["ding"]} },
      jp:"デパートで{N}や{M}を買[か]いました。",
      de:"Im Kaufhaus habe ich unter anderem {N:akki} und {M:akki} gekauft." },
    { slots:{ N:{pos:"noun", cat:["getraenk","essen"]}, M:{pos:"noun", cat:["getraenk","essen"]} },
      jp:"{N}や{M}が好[す]きです。",
      de:"Ich mag zum Beispiel {N:akk} und {M:akk}." },
    { slots:{ L:{pos:"noun", cat:["land"]}, K:{pos:"noun", cat:["land"]} },
      jp:"{L}や{K}に行[い]ったことがあります。",
      de:"Ich war unter anderem schon {L:in} und {K:in}." }
  ]
},

// ───────────── Lektion 12 ─────────────
{ id:"g-g12-ndesu", type:"grammar", source:"Genki I", lesson:12, level:"N5",
  title:"〜んです – Erklären und nachfragen",
  jp:"〜んです",
  summary:"Kurzform + んです erklärt Umstände oder fragt nach einer Erklärung: „…, nämlich …“",
  structure:["Verb/い-Adj. (Kurzform) + んです", "Nomen/な-Adj. + なんです", "Frage: 〜んですか。どうしたんですか。"],
  explanation:"**〜んです** (schriftlich: 〜のです) fügt einem Satz eine **erklärende Nuance** hinzu. Man verwendet es,\n- um einen **Grund oder Hintergrund** zu erklären: 「どうしたんですか。」「頭[あたま]が痛[いた]い**んです**。」 – „Was ist los?“ – „Ich habe nämlich Kopfschmerzen.“\n- um **nach einer Erklärung zu fragen**, wenn man etwas beobachtet: 日本[にほん]に行[い]く**んですか**。 – „Du fährst also nach Japan?“\n- um **Interesse** oder Begeisterung zu zeigen.\n\n**Bildung**: Kurzform + んです. Bei **Nomen und な-Adjektiven** steht **な** statt だ: 学生[がくせい]**な**んです, 好[す]き**な**んです.\n\nIm Deutschen entspricht das oft Wörtern wie „nämlich“, „eigentlich“, „also“ oder „ja“. Nicht zu oft verwenden – sonst klingt man, als müsse man sich ständig rechtfertigen.",
  examples:[
    { jp:"「どうしたんですか。」「のどが痛[いた]いんです。」", de:"„Was ist los?“ – „Mir tut der Hals weh.“" },
    { jp:"明日[あした]テストがあるんです。", de:"Morgen habe ich nämlich einen Test." },
    { jp:"このかばん、すてきですね。どこで買[か]ったんですか。", de:"Die Tasche ist toll. Wo hast du sie denn gekauft?" },
    { jp:"私[わたし]は魚[さかな]がきらいなんです。", de:"Ich mag nämlich keinen Fisch." }
  ],
  pitfalls:["Nomen/な-Adj.: なんです (❌ 学生[がくせい]だんです).","Nicht in jedem Satz verwenden."],
  tags:["erklärung","kurzform","gespräch"],
  related:["g-g6-kara","g-g12-node","g-g8-short-present"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["getraenk","essen","sport"]} },
      jp:"{N}が大好[だいす]きなんです。",
      de:"Ich liebe nämlich {N:akk}." },
    { slots:{ E:{pos:"noun", cat:["veranstaltung"]} },
      jp:"明日[あした]{E}があるんです。",
      de:"Morgen gibt es nämlich {E:akki}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"昨日[きのう]{O}を{V:ta}んです。",
      de:"Gestern {V:aux} ich nämlich {O:akki} {V:pp}." }
  ]
},

{ id:"g-g12-sugiru", type:"grammar", source:"Genki I", lesson:12, level:"N5",
  title:"〜すぎる – „zu viel, zu sehr“",
  jp:"〜すぎます",
  summary:"Verbstamm oder Adjektivstamm + すぎる = etwas im Übermaß tun oder sein.",
  structure:["Verbstamm + すぎます (食[た]べすぎます – zu viel essen)", "い-Adj. ohne い + すぎます (高[たか]すぎます – zu teuer)", "な-Adj. + すぎます (静[しず]かすぎます – zu ruhig)"],
  explanation:"**すぎる** (ein る-Verb) bedeutet „übertreiben, zu viel“. Man hängt es an:\n- den **Verbstamm**: 食[た]べ**すぎ**ました – habe zu viel gegessen; 飲[の]み**すぎ**ました – habe zu viel getrunken\n- den **Stamm von い-Adjektiven** (ohne い): 高[たか]**すぎ**ます – ist zu teuer; 大[おお]き**すぎ**ます – ist zu groß\n- **な-Adjektive** direkt: 静[しず]か**すぎ**ます – ist zu ruhig\n- Ausnahme: いい → よ**すぎ**る\n\nすぎる hat fast immer eine **negative** Bedeutung: Es ist mehr, als gut ist. Vergangenheit: 〜すぎました, verneint: 〜すぎません.",
  examples:[
    { jp:"昨日[きのう]、お酒[さけ]を飲[の]みすぎました。", de:"Gestern habe ich zu viel Alkohol getrunken." },
    { jp:"このシャツは大[おお]きすぎます。", de:"Dieses Hemd ist zu groß." },
    { jp:"この問題[もんだい]は難[むずか]しすぎます。", de:"Diese Aufgabe ist zu schwer." },
    { jp:"たけしさんはゲームをしすぎます。", de:"Takeshi spielt zu viel Videospiele." }
  ],
  pitfalls:["い-Adj.: das い fällt weg (高[たか]すぎる, nicht 高[たか]いすぎる)."],
  tags:["übermaß","verben","adjektive"],
  related:["g-g5-adj-conjugation","g-g12-hou-ga-ii"],
  patterns:[
    { slots:{ G:{pos:"noun", cat:["getraenk"]} },
      jp:"昨日[きのう]、{G}を飲[の]みすぎました。",
      de:"Gestern habe ich zu viel {G:w} getrunken." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"昨日[きのう]は{V:stem}すぎました。",
      de:"Gestern {V:aux} ich zu viel {V:pp}.",
      not:["v-g3-okiru"] },
    { slots:{ N:{pos:"noun", cat:["ding","kleidung"]} },
      jp:"この{N}は高[たか]すぎます。",
      de:"{N:def} hier ist zu teuer." }
  ]
},

{ id:"g-g12-hou-ga-ii", type:"grammar", source:"Genki I", lesson:12, level:"N5",
  title:"〜ほうがいいです – Ratschläge geben",
  jp:"〜たほうがいいです／〜ないほうがいいです",
  summary:"た-Form + ほうがいいです = „Du solltest besser …“; ない-Form + ほうがいいです = „Du solltest besser nicht …“",
  structure:["Verb-た + ほうがいいです。 – solltest (besser) …", "Verb-ない + ほうがいいです。 – solltest (besser) nicht …"],
  explanation:"Mit **〜ほうがいいです** gibt man einen **Ratschlag**. Wörtlich: „Die Seite, auf der man … tut, ist besser.“\n- **Positiv**: **た-Form** + ほうがいいです: 薬[くすり]を飲[の]ん**だ**ほうがいいですよ。 – „Du solltest Medizin nehmen.“\n- **Negativ**: **ない-Form** + ほうがいいです: 無理[むり]をし**ない**ほうがいいですよ。 – „Du solltest dich nicht überanstrengen.“\n\nAchtung: Positiv steht die **Vergangenheitsform** (た), obwohl es um die Zukunft geht! Negativ steht aber die **Präsens-Form** (ない, nicht なかった).\n\nDer Rat klingt ziemlich direkt; oft fügt man よ hinzu. Gegenüber Vorgesetzten besser vermeiden.",
  examples:[
    { jp:"病院[びょういん]に行[い]ったほうがいいですよ。", de:"Sie sollten ins Krankenhaus gehen." },
    { jp:"今日[きょう]は早[はや]く寝[ね]たほうがいいですよ。", de:"Du solltest heute früh schlafen gehen." },
    { jp:"あまりお酒[さけ]を飲[の]まないほうがいいです。", de:"Du solltest nicht so viel Alkohol trinken." },
    { jp:"毎日[まいにち]漢字[かんじ]を勉強[べんきょう]したほうがいいです。", de:"Du solltest jeden Tag Kanji lernen." }
  ],
  pitfalls:["Positiv: た-Form (行[い]ったほうがいい), negativ: ない-Form (行[い]かないほうがいい)."],
  tags:["rat","empfehlung","kurzform"],
  related:["g-g12-nakereba","g-g9-short-past","g-g8-short-present"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:ta}ほうがいいですよ。",
      de:"Sie sollten {O:akk} {V:inf}." },
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"{O}を{V:nai}ほうがいいですよ。",
      de:"Sie sollten {O:akk} nicht {V:inf}." },
    { slots:{ V:{pos:"verb", cat:["allein"]} },
      jp:"今日[きょう]は{V:ta}ほうがいいですよ。",
      de:"Sie sollten heute {V:inf}." }
  ]
},

{ id:"g-g12-node", type:"grammar", source:"Genki I", lesson:12, level:"N5",
  title:"〜ので – „weil, da“ (sachlich)",
  jp:"（Kurzform）ので、〜",
  summary:"ので gibt wie から einen Grund an, klingt aber sachlicher und höflicher.",
  structure:["Verb/い-Adj. (Kurzform) + ので", "Nomen/な-Adj. + なので"],
  explanation:"**ので** bedeutet wie から „weil, da“. Die Reihenfolge ist gleich: **Grund ので, Folge**.\n\n明日[あした]テストがある**ので**、今晩[こんばん]勉強[べんきょう]します。 – „Da morgen ein Test ist, lerne ich heute Abend.“\n\nUnterschied zu から: ので klingt **objektiver, weicher und höflicher**, als ob der Grund offensichtlich sei. Deshalb eignet es sich gut für Entschuldigungen und Bitten: 頭[あたま]が痛[いた]いので、早[はや]く帰[かえ]ってもいいですか。\n\n**Bildung**: Kurzform + ので; bei **Nomen und な-Adjektiven** steht **な** statt だ: 暇[ひま]**な**ので, 学生[がくせい]**な**ので (wie bei んです).",
  examples:[
    { jp:"明日[あした]テストがあるので、今晩[こんばん]勉強[べんきょう]します。", de:"Da ich morgen einen Test habe, lerne ich heute Abend." },
    { jp:"風邪[かぜ]をひいたので、授業[じゅぎょう]を休[やす]みました。", de:"Weil ich erkältet war, habe ich im Unterricht gefehlt." },
    { jp:"今日[きょう]は日曜日[にちようび]なので、銀行[ぎんこう]は休[やす]みです。", de:"Da heute Sonntag ist, hat die Bank geschlossen." },
    { jp:"お金[かね]がないので、何[なに]も買[か]いません。", de:"Weil ich kein Geld habe, kaufe ich nichts." }
  ],
  pitfalls:["Nomen/な-Adj.: なので (❌ 暇[ひま]だので)."],
  tags:["grund","konjunktion","kurzform"],
  related:["g-g6-kara","g-g9-kara","g-g12-ndesu"],
  patterns:[
    { slots:{ V:{pos:"verb", cat:["objekt"]}, O:{pos:"noun", objOf:"V"} },
      jp:"今日[きょう]は暇[ひま]なので、{O}を{V:masu}。",
      de:"Da ich heute Zeit habe, {V:ich} ich {O:akki}." },
    { slots:{ G:{pos:"noun", cat:["getraenk"]} },
      jp:"{G}が好[す]きなので、毎日[まいにち]飲[の]みます。",
      de:"Da ich {G:akk} mag, trinke ich jeden Tag {G:akki}." }
  ]
},

{ id:"g-g12-nakereba", type:"grammar", source:"Genki I", lesson:12, level:"N5",
  title:"〜なければいけません／〜なきゃいけない – „müssen“",
  jp:"〜なければいけません／〜なきゃ",
  summary:"ない-Form: ない → なければいけません = „müssen“; umgangssprachlich 〜なきゃ.",
  structure:["Verb-ない: ない → なければいけません", "Umgangssprachlich: ない → なきゃいけない／なきゃ", "Vergangenheit: 〜なければいけませんでした"],
  explanation:"„Müssen“ drückt man im Japanischen mit einer **doppelten Verneinung** aus: „Wenn man es nicht tut, geht es nicht.“\n\n**Bildung**: ない-Form, **ない → なければ** + いけません:\n- 行[い]く → 行[い]かない → 行[い]か**なければいけません** – muss gehen\n- 食[た]べる → 食[た]べない → 食[た]べ**なければいけません** – muss essen\n- する → しない → し**なければいけません** – muss machen\n\n**Umgangssprachlich** kürzt man **なければ → なきゃ**: 行[い]か**なきゃいけない**, oft sogar nur 行[い]か**なきゃ**！ („Ich muss los!“)\n\nStatt いけません hört man auch **なりません** (etwas formeller). Vergangenheit: 〜なければいけませんでした („musste“). „Nicht müssen“ ist eine andere Form: 〜なくてもいいです (Genki II).",
  examples:[
    { jp:"明日[あした]は六時[ろくじ]に起[お]きなければいけません。", de:"Morgen muss ich um sechs Uhr aufstehen." },
    { jp:"毎日[まいにち]漢字[かんじ]を勉強[べんきょう]しなければいけません。", de:"Ich muss jeden Tag Kanji lernen." },
    { jp:"昨日[きのう]はアルバイトに行[い]かなければいけませんでした。", de:"Gestern musste ich zu meinem Nebenjob." },
    { jp:"もう帰[かえ]らなきゃ。", de:"Ich muss jetzt nach Hause." }
  ],
  pitfalls:["ない → なければ (nicht „ないければ“).","なきゃ nur in lockerer Sprache."],
  tags:["pflicht","müssen","verben"],
  related:["g-g8-short-present","g-g12-hou-ga-ii","g-g6-tewaikenai"],
  patterns:[
    { slots:{ N:{pos:"noun", cat:["lesestoff"]} },
      jp:"明日[あした]までに{N}を読[よ]まなければいけません。",
      de:"Bis morgen muss ich {N:akk} lesen." },
    { slots:{ A:{pos:"noun", cat:["ort"]} },
      jp:"今日[きょう]は{A}に行[い]かなければいけません。",
      de:"Heute muss ich {A:zu} gehen." },
    { slots:{ F:{pos:"noun", cat:["fach","sprache"]} },
      jp:"毎日[まいにち]{F}を勉強[べんきょう]しなきゃいけない。",
      de:"Ich muss jeden Tag {F:w} lernen." }
  ]
},

{ id:"g-g12-deshou", type:"grammar", source:"Genki I", lesson:12, level:"N5",
  title:"〜でしょう – „wahrscheinlich“",
  jp:"〜でしょう／〜でしょうか",
  summary:"Kurzform + でしょう drückt eine Vermutung aus; でしょうか ist eine vorsichtige Frage.",
  structure:["Verb/い-Adj. (Kurzform) + でしょう", "Nomen/な-Adj. + でしょう (ohne だ)", "Frage: 〜でしょうか。"],
  explanation:"**でしょう** heißt „wahrscheinlich, vermutlich“ – man ist sich nicht ganz sicher. Typisch ist der Wetterbericht: 明日[あした]は雨[あめ]が降[ふ]る**でしょう**。 – „Morgen wird es wahrscheinlich regnen.“\n\n**Bildung**: Kurzform + でしょう. Bei **Nomen und な-Adjektiven fällt だ weg**: 雨[あめ]でしょう, 静[しず]かでしょう (nicht ❌ 雨[あめ]だでしょう).\n\nMit steigender Intonation oder als **〜でしょう？** sucht man Bestätigung („…, oder?“). **〜でしょうか** ist eine sehr höfliche, vorsichtige Frage: 明日[あした]は晴[は]れるでしょうか。 – „Ob es morgen wohl schön wird?“\n\nDie informelle Form ist **だろう**. Im Vergleich zu 〜と思[おも]います klingt でしょう distanzierter, eher wie eine sachliche Prognose.",
  examples:[
    { jp:"明日[あした]は雨[あめ]が降[ふ]るでしょう。", de:"Morgen wird es wahrscheinlich regnen." },
    { jp:"北海道[ほっかいどう]は寒[さむ]いでしょう。", de:"In Hokkaido ist es wahrscheinlich kalt." },
    { jp:"たけしさんは今日[きょう]来[こ]ないでしょう。", de:"Takeshi kommt heute wahrscheinlich nicht." },
    { jp:"すみません、駅[えき]はどこでしょうか。", de:"Entschuldigung, wo ist wohl der Bahnhof?" }
  ],
  pitfalls:["Nomen/な-Adj. ohne だ: 雨[あめ]でしょう (❌ 雨[あめ]だでしょう)."],
  tags:["vermutung","wetter","kurzform"],
  related:["g-g8-to-omoimasu","g-g12-ndesu"],
  patterns:[
    { slots:{ A:{pos:"i-adj", cat:["beschreibung"]}, N:{pos:"noun", subjOf:"A"} },
      jp:"その{N}は{A:attr}でしょう。",
      de:"{N:def} ist wahrscheinlich {A:de}." },
    { slots:{ L:{pos:"noun", cat:["land"]} },
      jp:"明日[あした]、{L}は暑[あつ]いでしょう。",
      de:"Morgen wird es {L:in} wahrscheinlich heiß." },
    { slots:{ A:{pos:"noun", cat:["ort"]} },
      jp:"すみません、{A}はどこでしょうか。",
      de:"Entschuldigung, wo ist wohl {A:def}?",
      not:["v-g3-uchi","v-g3-ie","v-g1-uchi"] }
  ]
}

);
