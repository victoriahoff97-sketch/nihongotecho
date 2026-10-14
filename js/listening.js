/* Nihongo Techō – Startseiten-Kachel „今日のリスニング“: jeden Tag ein Hörstück von ca. 5 Minuten, abhaken mit „Gehört“ */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const L = App.listening;
  const pos = () => App.store.settings.listenPos || 0;

  const ART = `<svg viewBox="0 0 92 84" aria-hidden="true"><g transform="rotate(-5 46 42)">
    <path d="M18 50V40a28 28 0 0156 0v10" fill="none" stroke="#1e6b6f" stroke-width="5" stroke-linecap="round"/>
    <rect x="10" y="44" width="16" height="24" rx="7" fill="#2b8a8f" stroke="#1e6b6f" stroke-width="2"/>
    <rect x="66" y="44" width="16" height="24" rx="7" fill="#2b8a8f" stroke="#1e6b6f" stroke-width="2"/>
    <circle cx="38" cy="50" r="2.5" fill="#1e6b6f"/><circle cx="54" cy="50" r="2.5" fill="#1e6b6f"/>
    <path d="M42 58q4 3 8 0" fill="none" stroke="#1e6b6f" stroke-width="2" stroke-linecap="round"/>
    <circle cx="33" cy="56" r="3" fill="#ED93B1" opacity=".7"/><circle cx="59" cy="56" r="3" fill="#ED93B1" opacity=".7"/></g>
    <text x="80" y="18" font-size="14" fill="#c98a14">♪</text><text x="6" y="22" font-size="11" fill="#d0567a">♫</text></svg>`;

  // Kachel für die Leiste „Heute lesen“ (kein Link, weil zwei Knöpfe darin stehen)
  L.tile = () => {
    const p = L.at(pos());
    if (!p) {
      return `<div class="read-tile listen" data-listen-tile><span class="art">${ART}</span><span class="txt">
        <span class="kicker" lang="ja">今日のリスニング</span><b>Alles durchgehört</b>
        <span class="desc">Du hast die ganze Hör-Kette geschafft. Neue Teppei-Folgen kommen mit einem App-Update dazu.</span></span></div>`;
    }
    const hint = L.nextHint(pos());
    return `<div class="read-tile listen" data-listen-tile><span class="art">${ART}</span><span class="txt">
      <span class="kicker"><span lang="ja">今日のリスニング</span> · ca. ${L.minutes(p)} Min.</span>
      <b>${esc(L.head(p))}</b>
      <span class="desc"><span ${p.kind === 'audio' ? 'lang="ja"' : ''}>${esc(L.detail(p))}</span> · ${L.source(p)}</span>
      <span class="listen-row"><button type="button" class="go" data-listen-play>${icon('play')} Anhören</button><button type="button" class="go ghost" data-listen-done>${icon('check')} Gehört</button></span>
      <span class="listen-pos">Stück ${pos() + 1}${hint ? ' · ' + hint : ''}</span></span></div>`;
  };

  // Fenster zum Anhören: Video-Ausschnitt (startet und stoppt an den Grenzen des Stücks) oder Teppei als Audio
  const open = () => {
    const p = L.at(pos());
    if (!p) return;
    let body;
    if (p.kind === 'audio') {
      body = `<p class="small" lang="ja">${esc(p.sub)}</p>
        <audio class="listen-audio" controls autoplay preload="auto" src="${esc(p.url)}"></audio>
        <p class="small muted">Nihongo con Teppei for Beginners · Folge ${p.n}</p>`;
    } else if (location.protocol === 'file:') {
      // In der Tablet-Version (file://) lässt YouTube kein eingebettetes Video zu – dort öffnet es sich auf YouTube
      body = `<p>Das Video öffnet sich auf YouTube${p.from ? ` an der richtigen Stelle (ab ${L.mmss(p.from)})` : ''}.</p>
        <p class="small muted">${p.parts > 1 ? `Hör bis ${L.mmss(p.to)}, dann komm zurück und tippe „Gehört“.` : 'Wenn du fertig bist, komm zurück und tippe „Gehört“.'}</p>
        <a class="btn btn-primary" href="${esc(L.watchUrl(p))}" target="_blank" rel="noopener">${icon('play')} Auf YouTube öffnen</a>`;
    } else {
      body = `<div class="listen-video"><iframe src="${esc(L.embedUrl(p))}" title="${esc(L.head(p))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
        <p class="small muted">${esc(L.detail(p))} · stoppt am Ende des Stücks · <a href="${esc(L.watchUrl(p))}" target="_blank" rel="noopener">Auf YouTube öffnen ${icon('link')}</a></p>`;
    }
    const md = App.modal({
      title: esc(L.head(p)), body, wide: p.kind === 'video', cls: 'listen-modal',
      foot: `<button class="btn" data-listen-close>Schließen</button><button class="btn btn-primary" data-listen-done>${icon('check')} Gehört</button>`,
    });
    md.el.querySelector('[data-listen-close]').onclick = md.close;
  };

  // „Gehört“: ein Stück weiter; kurz danach lässt sich das rückgängig machen
  const done = async () => {
    const old = pos();
    const back = document.querySelector('.listen-modal');
    if (back) back.closest('.modal-back').querySelector('[data-x]').click();
    await App.saveSettings({ listenPos: old + 1 });
    App.toast('Gehört – das nächste Stück ist bereit', { label: 'Rückgängig', fn: () => App.saveSettings({ listenPos: old }) });
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-listen-play], [data-listen-done]');
    if (!t) return;
    e.preventDefault();
    if (t.matches('[data-listen-play]')) open(); else done();
  });
})(window.App);
