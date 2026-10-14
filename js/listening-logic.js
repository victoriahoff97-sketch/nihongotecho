/* Nihongo Techō – Hör-Kette „今日のリスニング“: teilt die Quellen in Stücke von etwa 5 Minuten (reine Logik) */
'use strict';
(function (App) {
  const L = App.listening = App.listening || {};
  L.CHUNK = 300; // Ziel: ca. 5 Minuten pro Stück
  L.MAX_WHOLE = 450; // Videos bis 7½ Minuten bleiben ganz

  // Teile eines Videos: gleich lange Stücke, Anzahl so, dass jedes nah an 5 Minuten liegt
  L.splits = (s) => {
    if (s <= L.MAX_WHOLE) return [[0, s]];
    const n = Math.max(2, Math.round(s / L.CHUNK));
    const out = [];
    for (let i = 0; i < n; i++) out.push([Math.round((s * i) / n), Math.round((s * (i + 1)) / n)]);
    return out;
  };

  // Alle Stücke der Kette in Reihenfolge: erst die Videos (in Teilen), dann die Teppei-Folgen
  L.build = (data) => {
    const out = [];
    for (const v of data.videos) {
      const parts = L.splits(v.s);
      parts.forEach(([from, to], i) => out.push({ kind: 'video', id: v.id, title: v.t, from, to, part: i + 1, parts: parts.length }));
    }
    for (const [n, t, a, s] of data.teppei) out.push({ kind: 'audio', n, title: `Teppei #${n}`, sub: t, url: data.audioBase + a, s });
    return out;
  };

  let cache = null;
  L.all = () => cache || (cache = (typeof window !== 'undefined' && window.LISTENING_DATA) ? L.build(window.LISTENING_DATA) : []);
  L.at = (pos) => L.all()[pos] || null;
  L.total = () => L.all().length;

  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  L.mmss = mmss;
  // Überschrift und Zusatzzeile für Kachel und Fenster
  L.head = (p) => (p.kind === 'video' && p.parts > 1 ? `${p.title} · Teil ${p.part}/${p.parts}` : p.title);
  L.source = (p) => (p.kind === 'video' ? 'Chienowa Japanese' : 'Nihongo con Teppei');
  // Teppei-Folgen ohne Längenangabe im Feed: ca. 4 Minuten
  L.minutes = (p) => (p.kind === 'video' ? Math.max(1, Math.round((p.to - p.from) / 60)) : p.s ? Math.max(1, Math.round(p.s / 60)) : 4);
  L.detail = (p) => {
    if (p.kind === 'audio') return p.sub;
    return p.parts > 1 ? `ab ${mmss(p.from)} bis ${mmss(p.to)}` : `ganzes Video, ${mmss(p.to)}`;
  };
  // Gemerkte Stelle ({ pos, t }: Stück und Sekunde im Video bzw. in der Folge) – nur gültig für dasselbe Stück,
  // nicht ganz am Anfang und nicht kurz vor dem Ende (dann lieber von vorn bzw. fertig)
  L.resume = (p, pos, saved) => {
    if (!p || !saved || saved.pos !== pos || !(saved.t > 0)) return 0;
    const from = p.kind === 'video' ? p.from : 0, to = p.kind === 'video' ? p.to : (p.s || Infinity);
    const t = Math.floor(saved.t);
    return t > from + 5 && t < to - 5 ? t : 0;
  };
  L.embedUrl = (p, at = 0) => `https://www.youtube-nocookie.com/embed/${p.id}?start=${at || p.from}&end=${p.to}&rel=0&playsinline=1&enablejsapi=1&cc_load_policy=0`;
  L.watchUrl = (p) => `https://www.youtube.com/watch?v=${p.id}${p.from ? `&t=${p.from}s` : ''}`;
  // Was danach kommt (kurz), z. B. für den Hinweis beim Wechsel zu Teppei
  L.nextHint = (pos) => {
    const p = L.at(pos), q = L.at(pos + 1);
    if (!p || !q) return '';
    return p.kind !== q.kind ? 'danach geht es mit Teppei weiter' : '';
  };
})(window.App);
