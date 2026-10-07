/* Nihongo Techō – Japanisch-Werkzeuge: Furigana, Kana, Romaji, Konjugation, Satzgenerator, Sprachausgabe */
'use strict';
(function (App) {
  const { esc } = App;
  const JP = App.jp = {};
  const KANJI = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reKanji = new RegExp('[' + KANJI + ']');
  const reFuri = new RegExp('\\{([^}]+)\\}\\[([^\\]]+)\\]|([' + KANJI + ']+)\\[([^\\]]+)\\]', 'g');
  JP.hasKanji = (s) => reKanji.test(s || '');

  // ---------- Furigana-Notation ----------
  // 食[た]べる → <ruby>食<rt>た</rt></ruby>べる · skip(Basis) = true lässt die Lesung über dieser Gruppe weg
  JP.ruby = (s, skip) => {
    s = String(s ?? '');
    let out = '', last = 0;
    s.replace(reFuri, (m, g1, r1, k2, r2, idx) => {
      out += esc(s.slice(last, idx));
      out += skip && skip(g1 || k2) ? esc(g1 || k2) : `<ruby>${esc(g1 || k2)}<rt>${esc(r1 || r2)}</rt></ruby>`;
      last = idx + m.length;
      return m;
    });
    return out + esc(s.slice(last));
  };
  JP.plain = (s) => String(s ?? '').replace(reFuri, (m, g1, r1, k2) => g1 || k2);   // nur Kanji-Schreibung
  JP.kana = (s) => String(s ?? '').replace(reFuri, (m, g1, r1, k2, r2) => r1 || r2); // nur Lesung
  JP.hasNotation = (s) => /\[[^\]]+\]/.test(s || '');

  // Kanji + Kana → Notation (食べる + たべる → 食[た]べる)
  JP.notate = (kanji, kana) => {
    if (!kanji || kanji === kana) return kana || kanji || '';
    if (!kana || !JP.hasKanji(kanji)) return kanji;
    const segs = kanji.match(new RegExp('[' + KANJI + ']+|[^' + KANJI + ']+', 'g'));
    const hk = JP.toHira(kana);
    const pattern = '^' + segs.map((sg) => reKanji.test(sg) ? '(.+?)' : '(' + JP.toHira(sg).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')').join('') + '$';
    const m = hk.match(new RegExp(pattern));
    if (!m) return `{${kanji}}[${kana}]`;
    let pos = 0;
    return segs.map((sg, i) => {
      const part = kana.slice(pos, pos + m[i + 1].length);
      pos += m[i + 1].length;
      return reKanji.test(sg) ? `${sg}[${part}]` : sg;
    }).join('');
  };
  // Anzeige eines Vokabel-Eintrags als Ruby
  JP.wordRuby = (it) => it.kanji ? JP.ruby(JP.notate(it.kanji, it.kana)) : esc(it.kana || '');

  // ---------- Kana ----------
  JP.toHira = (s) => String(s ?? '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  JP.toKata = (s) => String(s ?? '').replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
  JP.isKana = (s) => /^[぀-ヿー\s]+$/.test(s || '');

  // ---------- Romaji → Hiragana ----------
  const R = {
    a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
    ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ', kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
    ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご', gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
    sa: 'さ', si: 'し', shi: 'し', su: 'す', se: 'せ', so: 'そ', sha: 'しゃ', shu: 'しゅ', sho: 'しょ', she: 'しぇ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
    za: 'ざ', zi: 'じ', ji: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ', ja: 'じゃ', ju: 'じゅ', jo: 'じょ', je: 'じぇ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ', zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
    ta: 'た', ti: 'ち', chi: 'ち', tu: 'つ', tsu: 'つ', te: 'て', to: 'と', cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', che: 'ちぇ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
    da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど', dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',
    na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の', nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
    ha: 'は', hi: 'ひ', hu: 'ふ', fu: 'ふ', he: 'へ', ho: 'ほ', hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ', fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ',
    ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ', bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
    pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ', pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
    ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も', mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
    ya: 'や', yu: 'ゆ', yo: 'よ',
    ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ', rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
    la: 'ら', li: 'り', lu: 'る', le: 'れ', lo: 'ろ',
    wa: 'わ', wi: 'うぃ', we: 'うぇ', wo: 'を', va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
    xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', xtu: 'っ', xtsu: 'っ', xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', ltu: 'っ',
    '-': 'ー', '.': '。', ',': '、', '?': '？', '!': '！',
  };
  // final=false: ein einzelnes „n“ am Ende bleibt stehen (man tippt evtl. noch „na“)
  JP.romaji = (input, final = true) => {
    let s = String(input), out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      const lc = c.toLowerCase();
      if (!/[a-z'\-.,?!]/i.test(c)) { out += c; i++; continue; }
      const upper = c !== lc;
      // Doppelkonsonant → っ
      if (i + 1 < s.length && lc === s[i + 1].toLowerCase() && /[bcdfghjkmpqrstvwxyz]/.test(lc)) { out += upper ? 'ッ' : 'っ'; i++; continue; }
      if (lc === 'n') {
        const nx = (s[i + 1] || '').toLowerCase();
        const N = upper ? 'ン' : 'ん';
        if (!nx) { out += final ? N : c; i++; continue; }
        if (nx === "'") { out += N; i += 2; continue; }
        if (nx === 'n') { out += N; i += /[aeiouy]/i.test(s[i + 2] || '') ? 1 : 2; continue; }
        if (!/[aeiouy]/.test(nx)) { out += N; i++; continue; }
      }
      let hit = null;
      for (let L = 4; L >= 1; L--) {
        const chunk = s.slice(i, i + L).toLowerCase();
        if (R[chunk]) { hit = [chunk, R[chunk]]; break; }
      }
      if (hit) { out += upper ? JP.toKata(hit[1]) : hit[1]; i += hit[0].length; continue; }
      out += c; i++;
    }
    return out;
  };
  JP.looksRomaji = (s) => /^[a-z' \-]+$/i.test(s || '') && /[aeiou]/i.test(s);

  // ---------- Normalisierung für Suche / Antwortvergleich ----------
  JP.norm = (s) => JP.toHira(JP.kana(String(s || ''))).replace(/[\s　。、．，,.!！?？「」『』・〜~]/g, '').toLowerCase();
  JP.lenient = (s) => JP.norm(s).replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/ー/g, '');

  // ---------- Verbkonjugation ----------
  const U_I = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' };
  const U_A = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら' };
  const U_TE = { う: 'って', つ: 'って', る: 'って', む: 'んで', ぶ: 'んで', ぬ: 'んで', く: 'いて', ぐ: 'いで', す: 'して' };
  // liefert {stem, te, nai} für die Kana-Endung
  function base(dict, cls) {
    if (cls === 'irr') {
      if (dict.endsWith('する')) { const p = dict.slice(0, -2); return { stem: p + 'し', te: p + 'して', nai: p + 'しない', ta: p + 'した' }; }
      if (dict.endsWith('くる')) { const p = dict.slice(0, -2); return { stem: p + 'き', te: p + 'きて', nai: p + 'こない', ta: p + 'きた' }; }
      if (dict.endsWith('来る')) { const p = dict.slice(0, -2); return { stem: p + '来', te: p + '来て', nai: p + '来ない', ta: p + '来た' }; }
    }
    if (cls === 'ru') { const p = dict.slice(0, -1); return { stem: p, te: p + 'て', nai: p + 'ない', ta: p + 'た' }; }
    const p = dict.slice(0, -1), e = dict.slice(-1);
    let te = p + (U_TE[e] || 'って');
    if (/(行く|いく)$/.test(dict)) te = p + 'って';
    const nai = (dict === 'ある' ? '' : p + (U_A[e] || 'ら')) + 'ない';
    return { stem: p + (U_I[e] || 'り'), te, nai, ta: te.replace(/て$/, 'た').replace(/で$/, 'だ') };
  }
  function verbForm(dict, cls, form) {
    const b = base(dict, cls);
    const naiStem = b.nai.slice(0, -1);
    switch (form) {
      case 'dict': return dict;
      case 'stem': return b.stem;
      case 'masu': return b.stem + 'ます';
      case 'masen': return b.stem + 'ません';
      case 'mashita': return b.stem + 'ました';
      case 'masendeshita': return b.stem + 'ませんでした';
      case 'mashou': return b.stem + 'ましょう';
      case 'masenka': return b.stem + 'ませんか';
      case 'te': return b.te;
      case 'teimasu': return b.te + 'います';
      case 'teimashita': return b.te + 'いました';
      case 'tai': return b.stem + 'たいです';
      case 'nai': return b.nai;
      case 'ta': return b.ta;
      case 'nakatta': return naiStem + 'かった';
      default: return dict;
    }
  }
  // Konjugiert Kana und Kanji getrennt und gibt Notation zurück
  JP.conj = (it, form) => {
    const cls = (it.v && it.v.cls) || 'ru';
    const kana = verbForm(it.kana, cls, form);
    if (!it.kanji) return kana;
    let kj;
    if (cls === 'irr' && /来る$/.test(it.kanji)) {
      const kb = verbForm(it.kanji, 'irr', form);
      kj = kb;
    } else kj = verbForm(it.kanji, cls, form);
    return JP.notate(kj, kana);
  };

  // ---------- Adjektive ----------
  JP.adj = (it, form) => {
    const isI = it.pos === 'i-adj';
    const conjStr = (s) => {
      if (!isI) {
        const b = s.replace(/な$/, '');
        return { attr: b + 'な', desu: b + 'です', neg: b + 'じゃないです', past: b + 'でした', pastneg: b + 'じゃなかったです', te: b + 'で', plain: b }[form] ?? b;
      }
      let st = s.slice(0, -1);
      if (/いい$/.test(s)) st = s.slice(0, -2) + 'よ';
      if (/良い$/.test(s)) st = s.slice(0, -1);
      return { attr: s, desu: s + 'です', neg: st + 'くないです', past: st + 'かったです', pastneg: st + 'くなかったです', te: st + 'くて', plain: s }[form] ?? s;
    };
    const kana = conjStr(it.kana);
    if (!it.kanji) return kana;
    return JP.notate(conjStr(it.kanji), kana);
  };

  // ---------- Deutsch: Nomenformen ----------
  const ART = {
    def: { nom: { m: 'der', f: 'die', n: 'das', pl: 'die' }, akk: { m: 'den', f: 'die', n: 'das', pl: 'die' }, dat: { m: 'dem', f: 'der', n: 'dem', pl: 'den' } },
    indef: { nom: { m: 'ein', f: 'eine', n: 'ein', pl: '' }, akk: { m: 'einen', f: 'eine', n: 'ein', pl: '' } },
  };
  JP.nounDe = (it) => {
    if (it.n && it.n.w) return it.n;
    const m = String(it.de || '').split(/[,;(]/)[0].trim().match(/^(der|die|das)\s+(.+)$/i);
    if (m) return { w: m[2], g: { der: 'm', die: 'f', das: 'n' }[m[1].toLowerCase()] };
    return { w: String(it.de || '').split(/[,;(]/)[0].trim(), g: '0' };
  };
  JP.deNoun = (it, form) => {
    const n = JP.nounDe(it);
    const g = n.g || '0';
    const w = n.w;
    const home = (it.tags || []).includes('zuhause') || w === 'Hause';
    const land = (it.cat || []).includes('land');
    const bare = g === '0';
    switch (form) {
      case 'w': return w;
      case 'def': return bare ? w : `${ART.def.nom[g]} ${w}`;
      case 'indef': return bare || n.mass || g === 'pl' ? w : `${ART.indef.nom[g]} ${w}`;
      case 'akk': return bare || n.mass ? w : `${ART.def.akk[g]} ${w}`;
      case 'akki': return bare || n.mass || g === 'pl' ? w : `${ART.indef.akk[g]} ${w}`;
      case 'dat': return bare ? w : `${ART.def.dat[g]} ${w}`;
      case 'zu':
        if (home) return 'nach Hause';
        if (land || bare) return `nach ${w}`;
        return g === 'f' ? `zur ${w}` : g === 'pl' ? `zu den ${w}` : `zum ${w}`;
      case 'in':
        if (home) return 'zu Hause';
        if (land || bare) return `in ${w}`;
        return g === 'f' ? `in der ${w}` : g === 'pl' ? `in den ${w}` : `im ${w}`;
      default: return w;
    }
  };

  // ---------- Satzgenerator ----------
  // pool: Vokabeln, die bis zum gewählten Niveau erlaubt sind
  const posOk = (it, pos) => pos === 'adj' ? (it.pos === 'i-adj' || it.pos === 'na-adj') : it.pos === pos;
  const usable = (it, pos) => {
    if (!it.kana) return false;
    if (pos === 'verb') return it.v && it.v.cls && it.v.inf;
    if (pos === 'adj' || pos === 'i-adj' || pos === 'na-adj') return it.a && it.a.de;
    if (pos === 'time') return it.t && it.t.adv;
    if (pos === 'noun') return !!JP.nounDe(it).w;
    return true;
  };
  JP.candidates = (slot, chosen, pool) => {
    return pool.filter((it) => {
      if (!posOk(it, slot.pos) || !usable(it, slot.pos)) return false;
      if (Object.values(chosen).some((c) => c.id === it.id)) return false;
      if (slot.not && slot.not.includes(it.id)) return false;
      if (slot.ids && !slot.ids.includes(it.id)) return false;
      if (slot.pos === 'noun' && JP.nounDe(it).g === 'pl') return false; // Plural bricht „X ist …“-Muster
      if (slot.tag && !(it.tags || []).includes(slot.tag)) return false;
      const cats = it.cat || [];
      if (slot.cat && slot.cat.length && !slot.cat.some((c) => cats.includes(c))) return false;
      if (slot.objOf) { const v = chosen[slot.objOf]; if (!v || !v.v || !v.v.obj || !v.v.obj.some((c) => cats.includes(c))) return false; }
      if (slot.subjOf) { const a = chosen[slot.subjOf]; if (!a || !a.a || !a.a.subj || !a.a.subj.some((c) => cats.includes(c))) return false; }
      return true;
    });
  };
  JP.fill = (pattern, pool) => { for (let t = 0; t < 12; t++) { const r = fillOnce(pattern, pool); if (r) return r; } return null; };
  const fillOnce = (pattern, pool) => {
    const slots = pattern.slots || {};
    const names = Object.keys(slots).sort((a, b) => ((slots[a].objOf || slots[a].subjOf) ? 1 : 0) - ((slots[b].objOf || slots[b].subjOf) ? 1 : 0));
    const chosen = {};
    for (const n of names) {
      const slot = pattern.not ? Object.assign({}, slots[n], { not: (slots[n].not || []).concat(pattern.not) }) : slots[n];
      const c = JP.candidates(slot, chosen, pool);
      if (!c.length) return null;
      chosen[n] = App.pick(c);
    }
    const jpForm = (name, form) => {
      const it = chosen[name];
      if (!it) return '';
      if (it.pos === 'verb') return JP.conj(it, form || 'dict');
      if (it.pos === 'i-adj' || it.pos === 'na-adj') return JP.adj(it, form || 'plain');
      return it.kanji ? JP.notate(it.kanji, it.kana) : it.kana;
    };
    let seps = [];
    const deForm = (name, form) => {
      const it = chosen[name];
      if (!it) return '';
      if (it.pos === 'verb') {
        const v = it.v;
        if (form === 'ich') { if (v.sep) seps.push(v.sep); return v.ich; }
        return v[form] || v.inf;
      }
      if (it.pos === 'i-adj' || it.pos === 'na-adj') return it.a.de;
      if (it.pos === 'time') return form === 'w' ? JP.nounDe(it).w : it.t.adv;
      return JP.deNoun(it, form || 'w');
    };
    const jp = pattern.jp.replace(/\{([A-Z])(?::(\w+))?\}/g, (m, n, f) => jpForm(n, f));
    let de = pattern.de.replace(/\{([A-Z])(?::(\w+))?\}/g, (m, n, f) => deForm(n, f));
    if (seps.length) de = de.replace(/([.?!])?\s*$/, (m, p) => ' ' + seps.join(' ') + (p || ''));
    de = de.replace(/\s+/g, ' ').replace(/\s([.,?!])/g, '$1').trim();
    de = de.charAt(0).toUpperCase() + de.slice(1);
    return { jp, de, words: Object.values(chosen) };
  };

  // ---------- Sprachausgabe ----------
  let voice = null;
  const pickVoice = () => {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const ja = vs.filter((v) => /^ja/i.test(v.lang));
    voice = ja.find((v) => /natural|online|nanami/i.test(v.name)) || ja[0] || null;
  };
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  JP.canSpeak = () => !!window.speechSynthesis;
  JP.speak = (text) => {
    if (!window.speechSynthesis) return App.toast('Sprachausgabe wird von diesem Browser nicht unterstützt');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(JP.plain(text));
    u.lang = 'ja-JP';
    if (voice) u.voice = voice;
    u.rate = (App.store.settings && App.store.settings.ttsRate) || 0.9;
    speechSynthesis.speak(u);
    if (!voice) setTimeout(() => { if (!voice) App.toast('Tipp: Installiere in Windows eine japanische Stimme (Einstellungen › Zeit & Sprache › Sprache).'); }, 400);
  };

  // ---------- Mini-Markdown für Erklärungen ----------
  JP.md = (src) => {
    const lines = String(src || '').split(/\n/);
    let html = '', list = null, para = [];
    const inline = (s) => JP.ruby(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<i>$2</i>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    const flushP = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
    const flushL = () => { if (list) { html += `<${list.t}>${list.items.map((x) => `<li>${inline(x)}</li>`).join('')}</${list.t}>`; list = null; } };
    for (const raw of lines) {
      const l = raw.trim();
      if (!l) { flushP(); flushL(); continue; }
      let m;
      if ((m = l.match(/^#{1,4}\s+(.+)/))) { flushP(); flushL(); html += `<h3>${inline(m[1])}</h3>`; continue; }
      if ((m = l.match(/^[-•*]\s+(.+)/))) { flushP(); if (!list || list.t !== 'ul') { flushL(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
      if ((m = l.match(/^\d+[.)]\s+(.+)/))) { flushP(); if (!list || list.t !== 'ol') { flushL(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
      flushL(); para.push(l);
    }
    flushP(); flushL();
    return html;
  };
})(window.App);
