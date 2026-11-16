/* Nihongo Techō – Gullideckel: die 48 Deckel mit Meilenstein (reine Daten, ohne DOM) */
'use strict';
(function (App) {
  // d(id, ISO-Code-Nummer, Kanji, Name, Farbe, Kategorie, Metrik, Schwelle, Text, geheim)
  const d = (id, no, kanji, name, color, cat, metric, n, text, secret) => ({
    id, pref: no ? 'JP-' + String(no).padStart(2, '0') : null, kanji, name, color, cat, metric, n, secret: !!secret, text
  });
  const W = 'Wörter', K = 'Kanji', G = 'Grammatik';

  const DEFS = [
    // Wörter „Kann ich“
    d('tokyo', 13, '東京', 'Tokio', '#e8a317', W, 'words', 10, '10 Wörter „Kann ich“'),
    d('kanagawa', 14, '神奈川', 'Kanagawa', '#2f7fc1', W, 'words', 50, '50 Wörter „Kann ich“'),
    d('saitama', 11, '埼玉', 'Saitama', '#e0679a', W, 'words', 100, '100 Wörter „Kann ich“'),
    d('chiba', 12, '千葉', 'Chiba', '#f08a3c', W, 'words', 250, '250 Wörter „Kann ich“'),
    d('aichi', 23, '愛知', 'Aichi', '#c9a227', W, 'words', 500, '500 Wörter „Kann ich“'),
    d('hyogo', 28, '兵庫', 'Hyōgo', '#8fa9c4', W, 'words', 1000, '1000 Wörter „Kann ich“'),
    d('wakayama', 30, '和歌山', 'Wakayama', '#5d8a5a', W, 'words', 2000, '2000 Wörter „Kann ich“'),
    // Kanji „Kann ich“
    d('nara', 29, '奈良', 'Nara', '#b5835a', K, 'kanji', 10, '10 Kanji „Kann ich“'),
    d('kyoto', 26, '京都', 'Kyōto', '#c8453b', K, 'kanji', 50, '50 Kanji „Kann ich“'),
    d('shiga', 25, '滋賀', 'Shiga', '#3fa7c9', K, 'kanji', 100, '100 Kanji „Kann ich“'),
    d('shimane', 32, '島根', 'Shimane', '#a0522d', K, 'kanji', 300, '300 Kanji „Kann ich“'),
    // Grammatik „Kann ich“
    d('gifu', 21, '岐阜', 'Gifu', '#3a6ea5', G, 'grammar', 10, '10 Grammatik-Einträge „Kann ich“'),
    d('kagawa', 37, '香川', 'Kagawa', '#e6c07b', G, 'grammar', 50, '50 Grammatik-Einträge „Kann ich“'),
    // Wiederholungen
    d('gunma', 10, '群馬', 'Gunma', '#d63b3b', 'Wiederholungen', 'reviews', 1000, '1000 Wiederholungen'),
    // Kanji geschrieben
    d('fukui', 18, '福井', 'Fukui', '#f2e3c6', 'Schreiben', 'kanjiWritten', 50, '50 Kanji geschrieben'),
    d('hiroshima', 34, '広島', 'Hiroshima', '#d9534f', 'Schreiben', 'kanjiWritten', 500, '500 Kanji geschrieben'),
    // Kana geschrieben
    d('yamaguchi', 35, '山口', 'Yamaguchi', '#4a90a4', 'Schreiben', 'hiragana', 1, 'Alle Hiragana geschrieben'),
    d('tottori', 31, '鳥取', 'Tottori', '#e3c58a', 'Schreiben', 'katakana', 1, 'Alle Katakana geschrieben'),
    // Tagebuch-Sätze
    d('tochigi', 9, '栃木', 'Tochigi', '#b8312f', 'Tagebuch', 'diary', 1, 'Erster Tagebuch-Satz'),
    d('ishikawa', 17, '石川', 'Ishikawa', '#d4af37', 'Tagebuch', 'diary', 50, '50 Tagebuch-Sätze'),
    d('iwate', 3, '岩手', 'Iwate', '#6b8e9b', 'Tagebuch', 'diary', 250, '250 Tagebuch-Sätze'),
    // Übersetzungen
    d('nagasaki', 42, '長崎', 'Nagasaki', '#2a7f9e', 'Übersetzen', 'translations', 50, '50 Übersetzungen'),
    // Eigene Vokabeln angelegt
    d('ibaraki', 8, '茨城', 'Ibaraki', '#8e6bb0', 'Eigene Wörter', 'ownVocab', 10, '10 eigene Vokabeln angelegt'),
    d('niigata', 15, '新潟', 'Niigata', '#9bc34f', 'Eigene Wörter', 'ownVocab', 100, '100 eigene Vokabeln angelegt'),
    d('akita', 5, '秋田', 'Akita', '#e8892b', 'Eigene Wörter', 'ownVocab', 500, '500 eigene Vokabeln angelegt'),
    // Aus NHK / Erweiterung
    d('miyagi', 4, '宮城', 'Miyagi', '#e86fa0', 'NHK', 'nhk', 10, '10 Wörter aus NHK/Erweiterung'),
    // Forum
    d('osaka', 27, '大阪', 'Ōsaka', '#e0482f', 'Forum', 'forumPosts', 1, 'Erster Forum-Beitrag'),
    d('fukuoka', 40, '福岡', 'Fukuoka', '#f0a03c', 'Forum', 'forumPosts', 50, '50 Forum-Beiträge'),
    d('saga', 41, '佐賀', 'Saga', '#5bb8d4', 'Forum', 'dailySentences', 10, 'Satz des Tages 10×'),
    // App an X Tagen geöffnet
    d('nagano', 20, '長野', 'Nagano', '#7aa874', 'Treue', 'openDays', 30, 'App an 30 Tagen geöffnet'),
    d('yamanashi', 19, '山梨', 'Yamanashi', '#8c5fb0', 'Treue', 'openDays', 100, 'App an 100 Tagen geöffnet'),
    d('hokkaido', 1, '北海道', 'Hokkaidō', '#6fa8dc', 'Treue', 'openDays', 365, 'App an 365 Tagen geöffnet'),
    // Flamme (Vulkane)
    d('kumamoto', 43, '熊本', 'Kumamoto', '#d9622b', 'Flamme', 'flame', 7, '7 Tage Flamme am Stück'),
    d('kagoshima', 46, '鹿児島', 'Kagoshima', '#a13d2d', 'Flamme', 'flame', 30, '30 Tage Flamme am Stück'),
    d('oita', 44, '大分', 'Ōita', '#4fb3a9', 'Flamme', 'flame', 100, '100 Tage Flamme am Stück'),
    d('shizuoka', 22, '静岡', 'Shizuoka', '#3b5ba5', 'Flamme', 'flame', 365, '365 Tage Flamme am Stück'),
    // Tagesliste 今日 komplett
    d('toyama', 16, '富山', 'Toyama', '#3e9c7a', 'Tagesliste', 'dayAll', 10, 'Tagesliste 10× komplett'),
    // Hören (in Minuten)
    d('tokushima', 36, '徳島', 'Tokushima', '#c2477d', 'Hören', 'listenMin', 60, '60 Minuten gehört'),
    d('okinawa', 47, '沖縄', 'Okinawa', '#1fb5c9', 'Hören', 'listenMin', 600, '10 Stunden gehört'),
    // Prüfungen
    d('fukushima', 7, '福島', 'Fukushima', '#d6453d', 'Prüfungen', 'examsPassed', 1, 'Erste Prüfung bestanden'),
    d('okayama', 33, '岡山', 'Okayama', '#f4a6b8', 'Prüfungen', 'exams100', 1, 'Prüfung mit 100 % bestanden'),
    // Unterricht
    d('yamagata', 6, '山形', 'Yamagata', '#c0392b', 'Unterricht', 'lessons', 10, '10 Stunden mitgeschrieben'),
    // Geheim
    d('aomori', 2, '青森', 'Aomori', '#e0453a', 'Geheim', 'nightOwl', 1, 'Nach 23 Uhr gelernt', true),
    d('miyazaki', 45, '宮崎', 'Miyazaki', '#f5a623', 'Geheim', 'earlyBird', 1, 'Vor 7 Uhr gelernt', true),
    d('mie', 24, '三重', 'Mie', '#7a9e7e', 'Geheim', 'newYear', 1, 'An Neujahr gelernt', true),
    d('kochi', 39, '高知', 'Kōchi', '#4caf8a', 'Geheim', 'comeback', 1, 'Comeback nach 7 Tagen Pause', true),
    d('ehime', 38, '愛媛', 'Ehime', '#f28c1c', 'Geheim', 'bestRun', 20, '20 Karten ohne Fehler in einer Runde', true),
    // Bonus
    d('nihon', 0, '日本', 'Japan', '#d4af37', 'Bonus', 'collected', 47, 'Alle 47 Deckel gesammelt')
  ];

  App.manholeData = { DEFS, BONUS_ID: 'nihon' };
})(window.App = window.App || {});
