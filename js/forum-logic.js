/* Nihongo Techō – Gruppenforum (Gedankenwolke): Gruppencode, Liste, „neu“, Links, Zeiten (reine Logik) */
'use strict';
(function (App) {
  // Der einzige Teil der App, der online geteilt wird. Zeiten sind hier immer ms-Zahlen (Firebase-Zeitstempel wandelt
  // js/forum-db.js um). „Gesehen“ merkt sich jedes Gerät selbst: seen = { <postId>: ms }.
  const F = App.forumLogic = {};
  const esc = App.esc;
  F.WORDS = ['sakura', 'fuji', 'neko', 'kumo', 'yuki', 'sora', 'umi', 'hana'];
  // 32 gut lesbare Zeichen: ohne 0/o und 1/i
  F.ALPHABET = '23456789abcdefghjklmnpqrstuvwxyz';
  F.MAX_TEXT = 4000;
  F.MAX_NAME = 30;
  F.MAX_IMAGE = 450000;
  F.SIZES = [1280, 1024, 800];
  F.QUALITIES = [0.8, 0.7, 0.6, 0.5];

  // ---------- Gruppencode ----------
  const pick = (list, rand) => list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
  const block = (rand) => Array.from({ length: 4 }, () => pick(F.ALPHABET, rand)).join('');
  F.makeCode = (rand = Math.random) => `${pick(F.WORDS, rand)}-${block(rand)}-${block(rand)}`;
  // aus WhatsApp kopiert: Großbuchstaben, Leerzeichen und Zeilenumbrüche zählen nicht
  // (auch unsichtbare Richtungs- und Breitenzeichen, die manche Messenger beim Kopieren mitgeben)
  F.normCode = (s) => String(s ?? '').toLowerCase().replace(/[\s​-‏‪-‮⁠-⁩﻿]+/g, '');
  const CODE_RE = new RegExp(`^[a-z]+-[${F.ALPHABET}]{4}-[${F.ALPHABET}]{4}$`);
  F.isCode = (s) => CODE_RE.test(F.normCode(s));

  // ---------- Eingaben ----------
  F.checkPost = ({ text, image, refs } = {}) => {
    const t = String(text ?? '');
    if (!t.trim() && !image && !(refs && refs.length)) return 'Schreib etwas oder häng ein Bild an.';
    if (t.length > F.MAX_TEXT) return `Der Text ist zu lang (höchstens ${F.MAX_TEXT} Zeichen).`;
    return '';
  };
  F.checkName = (name) => {
    const n = String(name ?? '').trim();
    if (!n) return 'Gib deinen Namen ein.';
    if (n.length > F.MAX_NAME) return `Der Name ist zu lang (höchstens ${F.MAX_NAME} Zeichen).`;
    return '';
  };

  // ---------- Verknüpfte Einträge ----------
  // Jede hat ihre eigenen Daten: Genki-, JLPT- und mitgelieferte Einträge haben bei allen dieselbe Kennung, eigene nicht.
  // Ein Verweis trägt deshalb Anzeige-Text und bei Vokabeln eine Kopie, damit die anderen sie übernehmen können.
  F.REF_TYPES = ['grammar', 'vocab', 'phrase', 'kanji'];
  F.MAX_REFS = 5;
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const cleanVocab = (v) => ({
    kana: str(v.kana, 100), kanji: str(v.kanji, 100), de: str(v.de, 200), pos: str(v.pos, 40),
    examples: (Array.isArray(v.examples) ? v.examples : []).filter((x) => x && typeof x === 'object').slice(0, 1)
      .map((x) => ({ jp: str(x.jp, 200), de: str(x.de, 200) })),
  });
  // Kanji: Zeichen, Bedeutung und Lesungen (als fertiger Text) – so sehen alle das Kanji, auch ohne es selbst zu haben
  const cleanKanji = (k) => ({ char: str(k.char, 4), de: str(k.de, 120), on: str(k.on, 80), kun: str(k.kun, 120) });
  F.makeRef = (it, { label, sub, kanji }) => {
    const ref = { type: it.type, id: it.id, label: str(label, 60), sub: str(sub, 80) };
    if (it.type === 'vocab') ref.vocab = cleanVocab(it);
    if (it.type === 'kanji') ref.kanji = cleanKanji(Object.assign({ char: it.char, de: sub }, kanji));
    return ref;
  };
  // Satz aus „Sätze erkennen“ (z. B. aus einem Zeitungsartikel): kein Eintrag, sondern eine Kopie des Satzes;
  // jp mit Furigana-Notation, plain ohne – höchstens einer pro Beitrag, Link nur ins Web
  const cleanSatz = (s) => ({ jp: str(s.jp, 300), de: str(s.de, 300), src: str(s.src, 120), url: /^https?:\/\//i.test(s.url || '') ? str(s.url, 300) : '' });
  F.makeSentenceRef = ({ jp, plain, de, src, url }) => ({ type: 'satz', id: 'satz', label: str(plain, 60), sub: str(de, 80), satz: cleanSatz({ jp, de, src, url }) });
  // Verweise kommen von anderen Geräten: nur Bekanntes durchlassen, Texte kürzen
  F.cleanRefs = (list) => {
    let satz = false;
    return (Array.isArray(list) ? list : [])
      .filter((r) => r && typeof r === 'object' && typeof r.id === 'string' && r.id && r.id.length <= 100
        && (F.REF_TYPES.includes(r.type) || (r.type === 'satz' && r.satz && typeof r.satz === 'object' && !satz && (satz = true))))
      .slice(0, F.MAX_REFS)
      .map((r) => {
        const out = { type: r.type, id: r.id, label: str(r.label, 60), sub: str(r.sub, 80) };
        if (r.type === 'vocab' && r.vocab && typeof r.vocab === 'object') out.vocab = cleanVocab(r.vocab);
        if (r.type === 'kanji' && r.kanji && typeof r.kanji === 'object') out.kanji = cleanKanji(r.kanji);
        if (r.type === 'satz') out.satz = cleanSatz(r.satz);
        return out;
      });
  };
  // Antippen: derselbe Eintrag → öffnen · eigene Vokabel mit demselben Wort bzw. eigenes Kanji mit demselben
  // Zeichen → das öffnen · fremde Vokabel / fremdes Kanji → übernehmen anbieten · sonst danach suchen
  F.resolveRef = (ref, { byId, byWord, byChar = () => null }) => {
    const same = byId(ref.id);
    if (same) return { kind: 'open', id: same.id };
    if (ref.type === 'vocab' && ref.vocab) {
      const mine = [ref.vocab.kanji, ref.vocab.kana].filter(Boolean).map(byWord).find(Boolean);
      if (mine) return { kind: 'open', id: mine.id };
      return { kind: 'take' };
    }
    if (ref.type === 'kanji') {
      const ch = (ref.kanji && ref.kanji.char) || ref.label;
      const mine = ch ? byChar(ch) : null;
      if (mine) return { kind: 'open', id: mine.id };
      if (ch) return { kind: 'take' };
    }
    return { kind: 'search', q: ref.label };
  };

  // ---------- Suche ----------
  // Alle Wörter müssen irgendwo vorkommen: Text, Name, verknüpfte Einträge (Wort, Lesung, Deutsch)
  const fold = (s) => String(s ?? '').toLowerCase().normalize('NFKC');
  const postWords = (p) => [F.plainText(p.text), p.name].concat(...F.cleanRefs(p.refs).map((r) => [r.label, r.sub,
    r.vocab && r.vocab.kana, r.vocab && r.vocab.de, r.kanji && r.kanji.de, r.kanji && r.kanji.on, r.kanji && r.kanji.kun, r.satz && r.satz.de, r.satz && r.satz.src]));
  F.matchPost = (p, q) => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const hay = fold(postWords(p).filter(Boolean).join('\n'));
    return words.every((w) => hay.includes(w));
  };

  // ---------- Avatare ----------
  // Pro Mitglied ein Text: „e:<Motiv>:<Farbe>“ (Kawaii-Motiv im Pastellkreis) oder „k:<Kanji>“ (Hanko-Stempel)
  F.AVATAR_MOTIFS = ['🍙', '🦊', '🐱', '🌸', '🍡', '🎏', '🐼', '🍵', '🗻', '🐟', '🍣', '🐸', '🌙', '🎐', '🐰', '⛩️',
    '🏮', '🍜', '🎋', '🏯', '🍱', '👘', '🍥', '🎴'];
  F.AVATAR_COLORS = ['sakura', 'matcha', 'sora', 'yuzu', 'fuji', 'kumo'];
  const KANJI_RE = /^[㐀-鿿豈-﫿]$/u;
  F.parseAvatar = (s) => {
    const [t, v, c] = String(s ?? '').split(':');
    if (t === 'e' && F.AVATAR_MOTIFS.includes(v)) return { t, v, c: F.AVATAR_COLORS.includes(c) ? c : F.AVATAR_COLORS[0] };
    if (t === 'k' && KANJI_RE.test(v || '')) return { t, v };
    return null;
  };
  F.makeAvatar = ({ t, v, c }) => (t === 'k' ? `k:${v}` : `e:${v}:${c}`);

  // ---------- Erwähnen und Herzen ----------
  // „@Marie“ im Text erwähnt das Mitglied mit diesem Namen (Groß-/Kleinschreibung egal, danach kein Buchstabe mehr).
  // members = { uid: { name } }; man erwähnt sich nicht selbst. Längere Namen zuerst, damit „@Mari“ nicht „@Marie“ schluckt.
  F.MAX_MENTIONS = 10;
  F.MAX_LIKES = 50;
  const LETTER = /[\p{L}\p{N}]/u;
  const atHits = (text, name) => {
    // nur Kleinschreibung, kein NFKC: die Stellen müssen zum Originaltext passen
    const t = String(text ?? '').toLowerCase(), n = ('@' + name).toLowerCase();
    const out = [];
    for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + 1)) if (!LETTER.test(t.charAt(i + n.length))) out.push(i);
    return out;
  };
  const byLength = (members) => Object.entries(members || {})
    .filter(([, m]) => m && typeof m.name === 'string' && m.name.trim())
    .sort((a, b) => b[1].name.length - a[1].name.length);
  F.findMentions = (text, members, myUid) => byLength(members)
    .filter(([uid, m]) => uid !== myUid && atHits(text, m.name).length).map(([uid]) => uid).slice(0, F.MAX_MENTIONS);
  // Herz an/aus: die eigene uid kommt dazu bzw. geht raus
  F.toggleLike = (likes, uid) => (likes.includes(uid) ? likes.filter((u) => u !== uid) : likes.concat(uid));
  F.likeNames = (likes, members) => likes.map((u) => (members[u] && members[u].name) || 'jemand, der nicht mehr dabei ist');
  // Wer „besprochen“ setzen darf: wer den Beitrag geschrieben hat, und wer die Gruppe gegründet hat
  F.canSetDone = (post, myUid, adminUid) => !!myUid && (post.uid === myUid || adminUid === myUid);

  // ---------- Daten von anderen Geräten ----------
  // Alles, was aus Firebase kommt, hat ein anderes Mitglied geschrieben: jedes Feld auf seinen Typ bringen,
  // bevor es irgendwo angezeigt wird (die Regeln prüfen auch, aber die Anzeige verlässt sich nicht darauf)
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const JPEG = 'data:image/jpeg;base64,';
  const uids = (v, max) => (Array.isArray(v) ? [...new Set(v.filter((u) => typeof u === 'string' && u && u.length <= 128))].slice(0, max) : []);
  F.cleanPost = (d) => ({
    id: str(d.id, 100), uid: str(d.uid, 128), name: str(d.name, F.MAX_NAME), kind: d.kind === 'rede' ? 'rede' : 'zeigen',
    text: str(d.text, F.MAX_TEXT), hasImage: d.hasImage === true,
    replyCount: Math.max(0, Math.floor(num(d.replyCount) || 0)),
    done: d.done === true, doneBy: str(d.doneBy, F.MAX_NAME), doneAt: num(d.doneAt),
    createdAt: num(d.createdAt), editedAt: num(d.editedAt), lastActivityAt: num(d.lastActivityAt),
    lastActivityUid: str(d.lastActivityUid, 128), refs: F.cleanRefs(d.refs),
    likes: uids(d.likes, F.MAX_LIKES), mentions: uids(d.mentions, F.MAX_MENTIONS), lastMentions: uids(d.lastMentions, F.MAX_MENTIONS),
  });
  F.cleanReply = (d) => ({
    id: str(d.id, 100), uid: str(d.uid, 128), name: str(d.name, F.MAX_NAME), text: str(d.text, F.MAX_TEXT),
    image: typeof d.image === 'string' && d.image.startsWith(JPEG) && d.image.length <= F.MAX_IMAGE ? d.image : null,
    createdAt: num(d.createdAt), editedAt: num(d.editedAt), refs: F.cleanRefs(d.refs),
    likes: uids(d.likes, F.MAX_LIKES), mentions: uids(d.mentions, F.MAX_MENTIONS),
  });
  // „@ dich“ in der Liste: im Beitrag selbst erwähnt, oder in der letzten, noch ungelesenen Antwort
  F.mentionsMe = (post, seen, myUid) => !!myUid && (post.mentions.includes(myUid)
    || (post.lastMentions.includes(myUid) && F.isNew(post, seen, myUid)));

  // ---------- Liste ----------
  // Offene 💬 zuerst, dann alle 💡, besprochene 💬 getrennt – jeweils neueste Aktivität zuerst.
  // Ein gerade abgeschickter Beitrag hat evtl. noch keinen Server-Zeitstempel: zählt als „jetzt“.
  F.sections = (posts, now) => {
    const at = (p) => p.lastActivityAt ?? now;
    const sorted = Array.from(posts).sort((a, b) => at(b) - at(a));
    return {
      open: sorted.filter((p) => p.kind === 'rede' && !p.done),
      show: sorted.filter((p) => p.kind !== 'rede'),
      done: sorted.filter((p) => p.kind === 'rede' && p.done),
    };
  };

  // Neu = jemand anderes hat zuletzt etwas geschrieben, und das ist nach dem letzten Ansehen auf diesem Gerät passiert
  F.isNew = (post, seen, myUid) => {
    if (!post || post.lastActivityUid === myUid) return false;
    const s = seen && seen[post.id];
    return !s || (post.lastActivityAt ?? Infinity) > s;
  };
  F.hasNew = (posts, seen, myUid) => Array.from(posts).some((p) => F.isNew(p, seen, myUid));
  F.seenAll = (posts, now) => Object.fromEntries(Array.from(posts).map((p) => [p.id, now]));
  F.markSeen = (seen, id, now) => Object.assign({}, seen, { [id]: now });
  // „Gesehen“ ist Geräteuhr, „letzte Aktivität“ Serveruhr: mindestens bis zur letzten Aktivität gilt es als gesehen,
  // sonst bliebe der rote Punkt bei einer nachgehenden Uhr trotz Lesen stehen
  F.seenAt = (post, now) => Math.max(now, (post && post.lastActivityAt) || 0);

  // ---------- Anzeige ----------
  // Text immer escaped; nur http(s)-Adressen werden Links. Satzzeichen am Ende gehören nicht dazu,
  // eine schließende Klammer nur, wenn der Link selbst eine öffnet (Wikipedia: …/Fuji_(Berg)).
  const URL_RE = /https?:\/\/[^\s<>]+/g;
  const trimUrl = (url) => {
    let u = url;
    for (;;) {
      const last = u.slice(-1);
      if ('.,;:!?'.includes(last)) { u = u.slice(0, -1); continue; }
      if (last === ')' && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) { u = u.slice(0, -1); continue; }
      return u;
    }
  };
  // Erwähnungen (@Name der Mitglieder in names) bekommen eine Markierung – nur im Text, nie in Links
  const textPart = (s, names) => {
    const hits = [];
    for (const n of names) for (const i of atHits(s, n)) if (!hits.some((h) => i < h.end && h.i < i + n.length + 1)) hits.push({ i, end: i + n.length + 1 });
    hits.sort((a, b) => a.i - b.i);
    const br = (x) => esc(x).replace(/\r?\n/g, '<br>');
    let out = '', pos = 0;
    for (const h of hits) { out += br(s.slice(pos, h.i)) + `<span class="forum-at">${esc(s.slice(h.i, h.end))}</span>`; pos = h.end; }
    return out + br(s.slice(pos));
  };
  const linkPart = (s, ns) => {
    let out = '';
    let pos = 0;
    for (const m of s.matchAll(URL_RE)) {
      const url = trimUrl(m[0]);
      out += textPart(s.slice(pos, m.index), ns);
      out += `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`;
      pos = m.index + url.length;
    }
    return out + textPart(s.slice(pos), ns);
  };
  const markHtml = (m) => {
    const mk = `<span class="forum-mk${m.c ? ' mk-' + m.c : ''}">${esc(m.text)}</span>`;
    return m.label ? `<span class="forum-tag"><span class="forum-tag-lab">${esc(m.label)}</span>${mk}</span>` : mk;
  };
  F.linkify = (text, names = []) => {
    const s = String(text ?? '');
    const ns = names.filter((n) => typeof n === 'string' && n.trim()).sort((a, b) => b.length - a.length);
    let out = '';
    let pos = 0;
    for (const m of F.parseMarks(s)) { out += linkPart(s.slice(pos, m.i), ns) + markHtml(m); pos = m.end; }
    return out + linkPart(s.slice(pos), ns);
  };

  // ---------- Textmarker und Labels ----------
  // Im Text steht „[[と|b|Partikel]]“: markierter Text, Farbe (y gelb, p rosa, b blau, g grün oder leer), Label (optional).
  // So bleibt alles ein einfacher Text – Firebase-Regeln und ältere Geräte brauchen nichts Neues.
  F.MARK_COLORS = ['y', 'p', 'b', 'g'];
  F.MAX_MARK = 80;
  F.MAX_LABEL = 20;
  const MARK_RE = /\[\[([^[\]|\n]{1,80})\|([ypbg]?)(?:\|([^[\]|\n]{0,20}))?\]\]/g;
  F.parseMarks = (text) => Array.from(String(text ?? '').matchAll(MARK_RE),
    (m) => ({ i: m.index, end: m.index + m[0].length, text: m[1], c: m[2], label: (m[3] || '').trim() }));
  F.plainText = (text) => String(text ?? '').replace(MARK_RE, '$1');
  const cleanPart = (s, max) => String(s ?? '').replace(/[[\]|\n]/g, '').trim().slice(0, max);
  const markRaw = (t, c, label) => (c || label ? `[[${t}|${c}${label ? '|' + label : ''}]]` : t);
  // Auswahl start..end (im Text mit Klammern) bekommt { c, label }; liegt sie in einer Markierung, ändert sich die.
  // Ergebnis { text, start, end } mit der neuen Markierung als Auswahl, oder null, wenn sich nichts markieren lässt.
  F.applyMark = (text, start, end, { c, label } = {}) => {
    const s = String(text ?? '');
    const marks = F.parseMarks(s);
    const col = (v, old) => (v === undefined ? old : F.MARK_COLORS.includes(v) ? v : '');
    const lab = (v, old) => (v === undefined ? old : cleanPart(v, F.MAX_LABEL));
    const inside = marks.find((m) => start >= m.i && end <= m.end);
    if (inside) {
      const raw = markRaw(inside.text, col(c, inside.c), lab(label, inside.label));
      return { text: s.slice(0, inside.i) + raw + s.slice(inside.end), start: inside.i, end: inside.i + raw.length };
    }
    let a = Math.max(0, Math.min(start, end)), b = Math.min(s.length, Math.max(start, end));
    for (const m of marks) if (m.i < b && m.end > a) { a = Math.min(a, m.i); b = Math.max(b, m.end); }
    const inner = F.plainText(s.slice(a, b));
    const t = inner.trim();
    if (!t || inner.includes('\n') || /[[\]|]/.test(t) || t.length > F.MAX_MARK) return null;
    a += inner.length - inner.trimStart().length;
    b -= inner.length - inner.trimEnd().length;
    const raw = markRaw(t, col(c, ''), lab(label, ''));
    return { text: s.slice(0, a) + raw + s.slice(b), start: a, end: a + raw.length };
  };
  // Markierungen in der Auswahl (bei leerer Auswahl: unter dem Cursor) werden wieder einfacher Text
  F.unmark = (text, start, end) => {
    const s = String(text ?? '');
    const hit = F.parseMarks(s).filter((m) => (start === end ? start > m.i && start < m.end : m.i < end && m.end > start));
    if (!hit.length) return null;
    let out = '', pos = 0;
    for (const m of hit) { out += s.slice(pos, m.i) + m.text; pos = m.end; }
    out += s.slice(pos);
    return { text: out, start: hit[0].i, end: hit[hit.length - 1].end - (s.length - out.length) };
  };

  const dayStart = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  F.relTime = (ms, now) => {
    const diff = now - ms;
    if (diff < 60e3) return 'gerade eben';
    if (diff < 3600e3) return `vor ${Math.floor(diff / 60e3)} Min.`;
    const today = dayStart(now);
    if (ms >= today) return `vor ${Math.floor(diff / 3600e3)} Std.`;
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (ms >= y.getTime()) return 'gestern';
    const d = new Date(ms);
    const dm = `${d.getDate()}.${d.getMonth() + 1}.`;
    return d.getFullYear() === new Date(now).getFullYear() ? dm : dm + d.getFullYear();
  };

  // Bild verkleinern: Seitenverhältnis bleibt, nie vergrößern
  F.fitSize = (w, h, max) => {
    const s = Math.min(1, max / Math.max(w, h));
    return { w: Math.round(w * s), h: Math.round(h * s) };
  };
})(window.App = window.App || {});
