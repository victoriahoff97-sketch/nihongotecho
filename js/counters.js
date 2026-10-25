/* Nihongo Techō – Zähler-Übersicht in den Ausdrücken: aufklappbar je Zähler, Zahlen 1–10 zum Antippen + passende Lernkarten */
'use strict';
(function (App) {
  const { esc } = App;
  const JP = App.jp;
  const C = App.counters;

  // offen gelassene Zähler pro Gerät merken, damit „←“ aus einer Karte nicht alles zuklappt
  const openSet = () => new Set(String(App.lsGet('ctrOpen') || '').split(',').filter(Boolean));
  const saveOpen = (s) => App.lsSet('ctrOpen', Array.from(s).join(','));

  const cell = (r) => {
    const title = r.alt.length ? ` title="auch: ${esc(r.alt.join(', '))}"` : '';
    const wide = Math.max(r.kana.length, r.jp.length) >= 6; // lange Lesungen bekommen zwei Spalten statt Umbruch
    return `<button type="button" class="ctr-cell${wide ? ' wide' : ''}${r.odd ? ' odd' : ''}${r.ask ? ' ask' : ''}${r.extra ? ' extra' : ''}"${JP.canSpeak() ? ` data-speak="${esc(r.kana)}"` : ''}${title}>
      <span class="ctr-n">${esc(r.label)}</span><span class="ctr-jp" lang="ja">${esc(r.jp)}</span><span class="ctr-kana" lang="ja">${esc(r.kana)}</span>${r.alt.length ? `<span class="ctr-alt" lang="ja">${esc(r.alt.join(' / '))}</span>` : ''}</button>`;
  };

  const panel = (c, cards, rows, open) => `<details class="ctr" data-ctr="${c.id}"${open ? ' open' : ''}>
      <summary><span class="ctr-k" lang="ja">〜${esc(c.k)}</span><span class="ctr-r" lang="ja">${esc(c.kana)}</span>
        <span class="ctr-de"><b>${esc(c.de)}</b><span class="small muted">${esc(c.ex)}</span></span>${cards.length ? `<span class="badge" title="Lernkarten dazu">${cards.length}</span>` : ''}<span class="ctr-chev" aria-hidden="true">›</span></summary>
      <div class="ctr-body">
        <div class="ctr-grid">${C.rows(c).map(cell).join('')}</div>
        <p class="ctr-rule">${esc(c.rule)}</p>
        <p class="ctr-sent"><span lang="ja">${JP.ruby(c.sent[0])}</span>${App.speakBtn(JP.kana(c.sent[0]))}<span class="small muted">${esc(c.sent[1])}</span></p>
        ${cards.length ? `<details class="ctr-cards"><summary>Lernkarten dazu (${cards.length})</summary>${rows(cards)}</details>` : ''}
        ${c.g ? `<a class="small" href="#/ausdruecke?g=${encodeURIComponent(c.g)}">Mehr dazu in „${esc(c.g)}“ ›</a>` : ''}
      </div></details>`;

  App.counterBody = (list, rows) => {
    const { by, rest } = C.assign(list, JP.plain);
    const open = openSet();
    return `<p class="small muted ctr-hint">Zähler antippen zum Aufklappen. <b class="ctr-odd-word">Rot</b> = weicht von „Zahl + Zähler“ ab. Eine Zahl antippen liest sie vor.</p>
      ${C.SECTIONS.map((s) => `<div class="ctr-sec">${esc(s.title)}</div>${s.items.map((c) => panel(c, by.get(c.id), rows, open.has(c.id))).join('')}`).join('')}
      ${rest.length ? `<div class="ctr-sec">Weitere</div>${rows(rest)}` : ''}`;
  };

  App.counterBind = (root) => {
    root.querySelectorAll('details.ctr').forEach((d) => d.addEventListener('toggle', () => {
      const s = openSet();
      if (d.open) s.add(d.dataset.ctr); else s.delete(d.dataset.ctr);
      saveOpen(s);
    }));
    const all = root.querySelector('[data-ctr-all]');
    if (!all) return;
    const ds = () => Array.from(root.querySelectorAll('details.ctr'));
    const label = () => { all.textContent = ds().every((d) => d.open) ? 'Alle zuklappen' : 'Alle aufklappen'; };
    label();
    root.addEventListener('toggle', label, true);
    all.onclick = () => {
      const to = !ds().every((d) => d.open);
      ds().forEach((d) => { d.open = to; });
      saveOpen(new Set(to ? ds().map((d) => d.dataset.ctr) : []));
    };
  };
})(window.App);
