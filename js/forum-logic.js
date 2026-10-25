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
  F.makeRef = (it, { label, sub }) => {
    const ref = { type: it.type, id: it.id, label: str(label, 60), sub: str(sub, 80) };
    if (it.type === 'vocab') ref.vocab = cleanVocab(it);
    return ref;
  };
  // Verweise kommen von anderen Geräten: nur Bekanntes durchlassen, Texte kürzen
  F.cleanRefs = (list) => (Array.isArray(list) ? list : [])
    .filter((r) => r && typeof r === 'object' && F.REF_TYPES.includes(r.type) && typeof r.id === 'string' && r.id && r.id.length <= 100)
    .slice(0, F.MAX_REFS)
    .map((r) => {
      const out = { type: r.type, id: r.id, label: str(r.label, 60), sub: str(r.sub, 80) };
      if (r.type === 'vocab' && r.vocab && typeof r.vocab === 'object') out.vocab = cleanVocab(r.vocab);
      return out;
    });
  // Antippen: derselbe Eintrag → öffnen · eigene Vokabel mit demselben Wort → die öffnen ·
  // fremde Vokabel → übernehmen anbieten · sonst danach suchen
  F.resolveRef = (ref, { byId, byWord }) => {
    const same = byId(ref.id);
    if (same) return { kind: 'open', id: same.id };
    if (ref.type === 'vocab' && ref.vocab) {
      const mine = [ref.vocab.kanji, ref.vocab.kana].filter(Boolean).map(byWord).find(Boolean);
      if (mine) return { kind: 'open', id: mine.id };
      return { kind: 'take' };
    }
    return { kind: 'search', q: ref.label };
  };

  // ---------- Daten von anderen Geräten ----------
  // Alles, was aus Firebase kommt, hat ein anderes Mitglied geschrieben: jedes Feld auf seinen Typ bringen,
  // bevor es irgendwo angezeigt wird (die Regeln prüfen auch, aber die Anzeige verlässt sich nicht darauf)
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const JPEG = 'data:image/jpeg;base64,';
  F.cleanPost = (d) => ({
    id: str(d.id, 100), uid: str(d.uid, 128), name: str(d.name, F.MAX_NAME), kind: d.kind === 'rede' ? 'rede' : 'zeigen',
    text: str(d.text, F.MAX_TEXT), hasImage: d.hasImage === true,
    replyCount: Math.max(0, Math.floor(num(d.replyCount) || 0)),
    done: d.done === true, doneBy: str(d.doneBy, F.MAX_NAME), doneAt: num(d.doneAt),
    createdAt: num(d.createdAt), editedAt: num(d.editedAt), lastActivityAt: num(d.lastActivityAt),
    lastActivityUid: str(d.lastActivityUid, 128), refs: F.cleanRefs(d.refs),
  });
  F.cleanReply = (d) => ({
    id: str(d.id, 100), uid: str(d.uid, 128), name: str(d.name, F.MAX_NAME), text: str(d.text, F.MAX_TEXT),
    image: typeof d.image === 'string' && d.image.startsWith(JPEG) && d.image.length <= F.MAX_IMAGE ? d.image : null,
    createdAt: num(d.createdAt), editedAt: num(d.editedAt), refs: F.cleanRefs(d.refs),
  });

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
  const textPart = (s) => esc(s).replace(/\r?\n/g, '<br>');
  F.linkify = (text) => {
    const s = String(text ?? '');
    let out = '';
    let pos = 0;
    for (const m of s.matchAll(URL_RE)) {
      const url = trimUrl(m[0]);
      out += textPart(s.slice(pos, m.index));
      out += `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`;
      pos = m.index + url.length;
    }
    return out + textPart(s.slice(pos));
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
