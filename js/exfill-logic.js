/* Nihongo Techō – Beispielsatz automatisch ausfüllen: Lesung eines ganzen Satzes (aus eigenen Vokabeln und dem Wörterbuch), Übersetzung holen. Browser: App.exfillLogic, Node: module.exports */
'use strict';
(function (root) {
  const KANJI = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reKanji = new RegExp('[' + KANJI + ']');
  const reJp = new RegExp('[' + KANJI + '\\u3040-\\u30ff]');
  const hira = (s) => String(s ?? '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const MAX_LEN = 12;

  // ---------- Zahlen ----------
  const DIG = { 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const UNIT = { 十: 10, 百: 100, 千: 1000 };
  const reArab = /[0-9０-９]/;
  const reKanNum = /[〇一二三四五六七八九十百千万]/;
  const ONES = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
  const below10000 = (n) => {
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
    let s = '';
    if (th) s += th === 1 ? 'せん' : th === 3 ? 'さんぜん' : th === 8 ? 'はっせん' : ONES[th] + 'せん';
    if (h) s += h === 1 ? 'ひゃく' : h === 3 ? 'さんびゃく' : h === 6 ? 'ろっぴゃく' : h === 8 ? 'はっぴゃく' : ONES[h] + 'ひゃく';
    if (t) s += (t === 1 ? '' : ONES[t]) + 'じゅう';
    return s + ONES[o];
  };
  const numRead = (n) => (n === 0 ? 'ゼロ' : (n >= 10000 ? below10000(Math.floor(n / 10000)) + 'まん' : '') + below10000(n % 10000));

  // Zahl ab Stelle i: arabische Ziffern (5, １２) oder Kanji-Zahl (二十三, 二〇二六) → { end, value }; sonst null
  const numAt = (s, i) => {
    let j = i;
    if (reArab.test(s[i] || '')) {
      while (j < s.length && reArab.test(s[j])) j++;
      const v = Number(s.slice(i, j).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)));
      return v < 1e8 ? { end: j, value: v } : null;
    }
    if (!reKanNum.test(s[i] || '')) return null;
    while (j < s.length && reKanNum.test(s[j])) j++;
    const t = s.slice(i, j);
    if (t.length > 1 && [...t].every((c) => c in DIG)) return { end: j, value: Number([...t].map((c) => DIG[c]).join('')) };
    let total = 0, sec = 0, cur = 0;
    for (const c of t) {
      if (c in DIG) cur = DIG[c];
      else if (c === '万') { total += (sec + cur || 1) * 10000; sec = 0; cur = 0; }
      else { sec += (cur || 1) * UNIT[c]; cur = 0; }
    }
    const v = total + sec + cur;
    return v < 1e8 ? { end: j, value: v } : null;
  };

  // Zählwörter: r = Lesung · ones = Lesung der letzten Ziffer · ten = じゅっ statt じゅう · sfx = Lesung nach Ziffer (10 = Zehner) · whole = ganze Zahl samt Zählwort
  const GEM_K = { 1: 'いっ', 6: 'ろっ', 8: 'はっ' }, GEM_S = { 1: 'いっ', 8: 'はっ' }, CLOCK = { 4: 'よ', 7: 'しち', 9: 'く' };
  const hSfx = (p, b) => ({ 1: p, 3: b, 6: p, 8: p, 10: p });
  const DAYS = { 2: 'ふつか', 3: 'みっか', 4: 'よっか', 5: 'いつか', 6: 'むいか', 7: 'なのか', 8: 'ようか', 9: 'ここのか', 10: 'とおか', 14: 'じゅうよっか', 20: 'はつか', 24: 'にじゅうよっか' };
  const addTo = (map, tail) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v + tail]));
  const KAGETSU = { r: 'かげつ', ones: GEM_K, ten: true };
  const COUNTERS = {
    時: { r: 'じ', ones: CLOCK }, 時間: { r: 'じかん', ones: CLOCK }, 秒: { r: 'びょう' },
    分: { r: 'ふん', ones: GEM_K, ten: true, sfx: { ...hSfx('ぷん', 'ぷん'), 4: 'ぷん' } },
    分間: { r: 'ふんかん', ones: GEM_K, ten: true, sfx: { ...hSfx('ぷんかん', 'ぷんかん'), 4: 'ぷんかん' } },
    月: { r: 'がつ', ones: { 4: 'し', 7: 'しち', 9: 'く' } }, か月: KAGETSU, ヶ月: KAGETSU, ヵ月: KAGETSU, カ月: KAGETSU, 箇月: KAGETSU,
    日: { r: 'にち', ones: { 7: 'しち', 9: 'く' }, whole: { 1: 'ついたち', ...DAYS } },
    日間: { r: 'にちかん', ones: { 7: 'しち', 9: 'く' }, whole: addTo(DAYS, 'かん') },
    年: { r: 'ねん', ones: { 4: 'よ' } }, 年間: { r: 'ねんかん', ones: { 4: 'よ' } }, 年生: { r: 'ねんせい', ones: { 4: 'よ' } },
    円: { r: 'えん', ones: { 4: 'よ' } },
    人: { r: 'にん', ones: { 4: 'よ' }, whole: { 1: 'ひとり', 2: 'ふたり' } },
    歳: { r: 'さい', ones: GEM_S, ten: true, whole: { 20: 'はたち' } }, 才: { r: 'さい', ones: GEM_S, ten: true, whole: { 20: 'はたち' } },
    回: { r: 'かい', ones: GEM_K, ten: true }, 個: { r: 'こ', ones: GEM_K, ten: true }, 課: { r: 'か', ones: GEM_K, ten: true },
    階: { r: 'かい', ones: GEM_K, ten: true, sfx: { 3: 'がい' } },
    冊: { r: 'さつ', ones: GEM_S, ten: true }, 週間: { r: 'しゅうかん', ones: GEM_S, ten: true },
    本: { r: 'ほん', ones: GEM_K, ten: true, sfx: hSfx('ぽん', 'ぼん') },
    杯: { r: 'はい', ones: GEM_K, ten: true, sfx: hSfx('ぱい', 'ばい') },
    匹: { r: 'ひき', ones: GEM_K, ten: true, sfx: hSfx('ぴき', 'びき') },
    枚: { r: 'まい' }, 番: { r: 'ばん' }, 番目: { r: 'ばんめ' }, 台: { r: 'だい' }, 度: { r: 'ど' },
  };
  const CTR_KEYS = Object.keys(COUNTERS).sort((a, b) => b.length - a.length);
  const counterAt = (s, i) => CTR_KEYS.find((k) => s.startsWith(k, i)) || '';

  // Zahl + Zählwort → { whole } (eine Lesung für beides, 一日 → ついたち) oder { num, ctr }
  const countRead = (n, key) => {
    const c = COUNTERS[key];
    if (c.whole && c.whole[n]) return { whole: c.whole[n] };
    const d = n % 10, tens = d === 0 && n % 100 !== 0;
    let num = numRead(n);
    if (d && c.ones && c.ones[d]) num = (n - d ? numRead(n - d) : '') + c.ones[d];
    else if (tens && c.ten) num = num.slice(0, -3) + 'じゅっ';
    return { num, ctr: (c.sfx && c.sfx[tens ? 10 : d]) || c.r };
  };
  // 何 + Zählwort: wie nach ん (何分 → なんぷん, 何本 → なんぼん)
  const nanRead = (key) => { const c = COUNTERS[key]; return (c.sfx && c.sfx[3]) || c.r; };

  // ---------- Lesung eines Wortes im Satz ----------
  // Passt die Lesung zur Schreibung? Die Kana der Schreibung müssen in dieser Reihenfolge in der Lesung stehen (食べ物 ↔ たべもの)
  const fits = (k, r) => {
    const segs = k.match(new RegExp('[' + KANJI + ']+|[^' + KANJI + ']+', 'g')) || [];
    const pat = segs.map((sg) => (reKanji.test(sg) ? '.+' : hira(sg).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('');
    return new RegExp('^' + pat + '$').test(hira(r));
  };
  const readingOf = (entry, base) => (entry.r || []).find((r) => fits(base, r)) || (entry.r || [])[0] || '';

  // Lesung der (evtl. gebeugten) Form surface, wenn base die Grundform mit Lesung r ist: 食べました + 食べる/たべる → たべました
  const inflected = (surface, base, r, type) => {
    if (surface === base) return r;
    if (type === 'vk' && base.endsWith('来る') && r.endsWith('くる')) {
      const pre = base.length - 2, rest = surface.slice(pre + 1);
      if (!surface.startsWith(base.slice(0, pre + 1))) return '';
      return r.slice(0, -2) + ('なよらさ'.includes(rest[0]) ? 'こ' : 'るれ'.includes(rest[0]) ? 'く' : 'き') + rest;
    }
    let cs = 0;
    while (cs < base.length - 1 && cs < r.length - 1 && base[base.length - 1 - cs] === r[r.length - 1 - cs]) cs++;
    const stemK = base.slice(0, base.length - cs);
    return surface.startsWith(stemK) ? r.slice(0, r.length - cs) + surface.slice(stemK.length) : '';
  };

  // Verbstamm (見に行く, 聞きながら) – den kennt App.deinflect nicht; hier nur für die Lesung
  const STEM_U = { い: 'う', き: 'く', ぎ: 'ぐ', し: 'す', ち: 'つ', に: 'ぬ', び: 'ぶ', み: 'む', り: 'る' };
  const stemCands = (surface) => {
    const st = surface.endsWith('ながら') ? surface.slice(0, -3) : surface;
    if (!st) return [];
    const out = [{ base: st + 'る', type: 'v1', stem: true }];
    const u = STEM_U[st.slice(-1)];
    if (u) out.push({ base: st.slice(0, -1) + u, type: 'v5', stem: true });
    return out;
  };
  // Potenzialform der う-Verben (会えなかった → 会える → 会う): Grundformen auf え-Reihe + る zusätzlich als う-Verb
  const POT_U = { え: 'う', け: 'く', げ: 'ぐ', せ: 'す', て: 'つ', ね: 'ぬ', べ: 'ぶ', め: 'む', れ: 'る' };
  const withPotential = (cands) => cands.concat(cands
    .filter((c) => (c.type === 'v1' || c.type === 'any') && c.base.endsWith('る') && POT_U[c.base.slice(-2, -1)])
    .map((c) => ({ base: c.base.slice(0, -2) + POT_U[c.base.slice(-2, -1)], type: 'v5', rules: c.rules })));
  // Grußformeln, die sonst das Wort davor verschlucken: 今日は meint fast immer きょう + は
  const SKIP = new Set(['今日は', '今晩は']);

  const AFFIX = new Set(['suf', 'n-suf', 'pref', 'n-pref', 'ctr']);
  const affixOnly = (p) => Array.isArray(p) && p.length > 0 && p.every((t) => AFFIX.has(t));

  // Lesung des Satzes. opts: lookup(forms) → Map Form → Einträge { id, k, r, p, c, own }, deinflect, posMatches,
  // notate (JP.notate), bonus(entry, Grundform, Lesung) (0–9, z. B. JLPT-Niveau: 前 → まえ vor ぜん).
  // Ergebnis: { furi (Notation 食[た]べます), kana (ganze Lesung), missing (Kanji ohne Lesung) }
  const reading = async (sentence, opts) => {
    const s = String(sentence || '');
    const { lookup, deinflect, posMatches, notate } = opts;
    const bonus = opts.bonus || (() => 0);
    const parts = [], missing = [];
    const push = (t, r) => parts.push({ t, r });

    // Längstes Wort ab Stelle i, das ein Kanji enthält: { len, r, own }
    const wordAt = async (i, kanaStart) => {
      let maxLen = 0;
      while (maxLen < MAX_LEN && i + maxLen < s.length && reJp.test(s[i + maxLen])) maxLen++;
      const byLen = [], forms = new Set();
      for (let len = 1; len <= maxLen; len++) {
        const surface = s.slice(i, i + len);
        if (!reKanji.test(surface) || SKIP.has(surface)) continue;
        const cands = withPotential(deinflect(surface)).concat(stemCands(surface)).filter((c) => reKanji.test(c.base));
        byLen[len] = { surface, cands };
        cands.forEach((c) => forms.add(c.base));
      }
      if (!forms.size) return null;
      const map = (await lookup([...forms])) || new Map();
      for (let len = maxLen; len >= 1; len--) {
        if (!byLen[len]) continue;
        const { surface, cands } = byLen[len];
        let best = null;
        for (const cand of cands) for (const e of map.get(cand.base) || []) {
          if (!(e.k || []).includes(cand.base) || !posMatches(e.p || [], cand.type)) continue;
          // mitten im Kana-Text beginnend (お金, この間) nur eigene und häufige Wörter – sonst schluckt ein seltenes Wort die Partikel davor
          if (kanaStart && !e.own && !e.c) continue;
          const br = readingOf(e, cand.base);
          const r = inflected(surface, cand.base, br, cand.type);
          if (!r) continue;
          // eigene Vokabel · häufig · kein bloßes Suffix/Zählwort · Hauptschreibung des Eintrags (本 → ほん, nicht もと) · 行って → 行く
          const score = (e.own ? 1000 : 0) + (e.c ? 100 : 0) + (affixOnly(e.p) ? 0 : 50) + (e.k[0] === cand.base ? 20 : 0)
            + ((cand.rules || []).some((n) => n.startsWith('iku')) ? 30 : 0) - (cand.stem ? 60 : 0) + bonus(e, cand.base, br) + (cand.base === surface ? 1 : 0);
          if (!best || score > best.score) best = { len, r, own: !!e.own, score };
        }
        if (best) return best;
      }
      return null;
    };

    let i = 0, prevCtr = '';
    while (i < s.length) {
      const ch = s[i];
      const num = numAt(s, i);
      const isNan = ch === '何';
      if (!num && !isNan && !reKanji.test(ch)) {
        // Kana, Satzzeichen, Lateinisches: unverändert – außer hier beginnt ein Wort mit Kanji (お金, ご飯)
        const w = /[぀-ヿ]/.test(ch) ? await wordAt(i, true) : null;
        if (w) { push(s.slice(i, i + w.len), w.r); i += w.len; prevCtr = ''; } else { push(ch, null); i++; }
        continue;
      }
      const w = reKanji.test(ch) ? await wordAt(i, false) : null;
      const numEnd = num ? num.end : i + 1;
      const ctr = counterAt(s, numEnd);
      const span = numEnd + ctr.length - i;
      if (num || (isNan && ctr)) {
        // 十分 (genug) und 一日 (ein Tag) nur nach Uhrzeit bzw. Monat als Zeitangabe lesen
        const ambiguous = num && ((ctr === '分' && num.value === 10 && prevCtr !== '時') || (ctr === '日' && num.value === 1 && prevCtr !== '月'));
        const useWord = w && (w.len > span || (w.own && w.len === span) || (w.len === span && ambiguous));
        if (!useWord) {
          const numText = s.slice(i, numEnd);
          if (isNan) { push(numText, 'なん'); push(ctr, nanRead(ctr)); }
          else if (!ctr) push(numText, numRead(num.value));
          else {
            const cr = countRead(num.value, ctr);
            if (cr.whole) push(numText + ctr, cr.whole); else { push(numText, cr.num); push(ctr, cr.ctr); }
          }
          i += span; prevCtr = ctr;
          continue;
        }
      }
      prevCtr = '';
      if (w && !(isNan && w.len === 1)) { push(s.slice(i, i + w.len), w.r); i += w.len; }
      else if (isNan) { push(ch, 'でだとの曜'.includes(s[i + 1] || ' ') ? 'なん' : 'なに'); i++; }
      else { if (!missing.includes(ch)) missing.push(ch); push(ch, null); i++; }
    }

    const note = (p) => {
      if (p.r == null || p.r === p.t) return p.t;
      return reKanji.test(p.t) ? notate(p.t, p.r) : `{${p.t}}[${p.r}]`;
    };
    return { furi: parts.map(note).join(''), kana: parts.map((p) => (p.r == null ? p.t : p.r)).join(''), missing };
  };

  // ---------- Übersetzung (Google Übersetzer, braucht Internet) ----------
  const TR_URL = 'https://translate.googleapis.com/translate_a/single';
  // sl = Ausgangssprache: 'ja' (Beispielsätze) oder 'en' (Bedeutungen der WaniKani-Vokabeln)
  const translateUrl = (text, sl = 'ja') => TR_URL + '?' + new URLSearchParams({ client: 'gtx', sl, tl: 'de', dt: 't', q: text });
  // Antwort: [[["Ich esse.", "食べます。", …], …], …] – die Teile der Übersetzung aneinander
  const parseTranslation = (j) => (Array.isArray(j) && Array.isArray(j[0]) ? j[0].map((x) => (Array.isArray(x) && typeof x[0] === 'string' ? x[0] : '')).join('').trim() : '');
  const translate = async (text, fetchFn, sl) => {
    const r = await fetchFn(translateUrl(text, sl), { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('Übersetzung antwortet nicht (' + r.status + ')');
    return parseTranslation(await r.json());
  };

  const api = { numAt, numRead, countRead, fits, inflected, reading, translateUrl, parseTranslation, translate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.App.exfillLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
