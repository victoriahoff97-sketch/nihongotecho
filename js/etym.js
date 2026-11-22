/* Nihongo Techō – „Herkunft 字源“ auf der Kanji-Seite: alte Schriftformen, Bauteile, Erklärung
 * Daten: packs/etym-index.js (window.KANJI_ETYM, erst bei Bedarf geladen); Bilder alter Formen von Wikimedia Commons (nur online). */
'use strict';
(function (App) {
  const esc = (s) => App.esc(s);
  const TYPES = {
    bild: ['Bildzeichen', '象形', 'zeichnet einen Gegenstand ab'],
    zeichen: ['Hinweiszeichen', '指事', 'zeigt mit Strichen auf eine Idee'],
    kombi: ['Sinnverbindung', '会意', 'Bedeutungsteile ergeben zusammen den Sinn'],
    laut: ['Laut + Bedeutung', '形声', 'ein Teil gibt den Sinn, einer den Klang'],
    leih: ['Lehnzeichen', '仮借', 'für ein gleich klingendes Wort ausgeliehen'],
    kurz: ['Vereinfachte Form', '略字', 'verkürzte Schreibung einer älteren Form'],
    unklar: ['Herkunft unklar', '未詳', 'die Forschung ist sich nicht einig'],
  };
  const ROLE = { b: ['Bedeutung', 'b'], l: ['Laut', 'l'], f: ['Form', 'f'] };
  const FORMS = [['o', 'oracle', 'Orakelknochen', 'um 1200 v. Chr.'], ['b', 'bronze', 'Bronzeschrift', 'um 1000 v. Chr.'], ['s', 'seal', 'Siegelschrift', 'um 200 v. Chr.']];
  const SURE = { 1: 'wahrscheinlich', 0: 'umstritten' };
  const IMG = (c, k) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c + '-' + k + '.svg')}?width=120`;

  let data = null, loading = null;
  App.etymLoad = () => {
    if (data) return Promise.resolve(data);
    return (loading = loading || App.loadScript('packs/etym-index.js').then(() => (data = window.KANJI_ETYM || {})).catch(() => { loading = null; return null; }));
  };

  App.etymHtml = (ch, e) => {
    const ty = TYPES[e.t] || TYPES.unklar;
    const forms = FORMS.filter(([k]) => (e.i || '').includes(k));
    const now = `<div class="etym-form now"><span class="g" lang="ja">${esc(ch)}</span><span class="l">heute</span>${e.a ? `<span class="s">früher <span lang="ja">${esc(e.a)}</span></span>` : '<span class="s">&nbsp;</span>'}</div>`;
    const strip = forms.length ? `<div class="etym-forms">${forms.map(([, k, l, s]) => `<div class="etym-form" data-ef><img alt="${esc(l)}" loading="lazy" referrerpolicy="no-referrer" src="${IMG(e.ic || e.a || ch, k)}"><span class="l">${l}</span><span class="s">${s}</span></div><span class="etym-arrow">→</span>`).join('')}${now}</div>` : '';
    const parts = (e.p || []).map(([c, de, r]) => {
      const role = ROLE[r] || ROLE.b;
      const link = /^[㐀-鿿豈-﫿]$/.test(c) && App.kanjiByChar && App.kanjiByChar(c);
      const inner = `<span class="c" lang="ja">${esc(c)}</span><span class="d">${esc(de)}</span><span class="rl ${role[1]}">${role[0]}</span>`;
      return link ? `<a class="etym-part" href="#/kanji/${encodeURIComponent(c)}" title="Kanji öffnen">${inner}</a>` : `<span class="etym-part">${inner}</span>`;
    }).join('<span class="etym-plus">+</span>');
    return `<div class="card etym">${strip}
      <div class="row etym-type"><span class="badge etym-t">${ty[0]} <span lang="ja">${ty[1]}</span></span><span class="small muted">${ty[2]}</span>${e.a && !forms.length ? `<span class="badge etym-sure">alte Form <span lang="ja" style="font-size:15px">${esc(e.a)}</span></span>` : ''}${SURE[e.s] ? `<span class="badge etym-sure">${SURE[e.s]}</span>` : ''}</div>
      ${parts ? `<div class="etym-parts">${parts}</div>` : ''}
      <p class="etym-x">${App.etymText(e.x)}</p>
      ${e.n ? `<p class="small etym-n">${App.etymText(e.n)}</p>` : ''}
      <div class="tiny muted etym-src">Quellen: Wiktionary (englisch + japanisch), Kanjium · CC BY-SA 4.0 · alte Formen: Wikimedia Commons</div></div>`;
  };
  // Kanji im Text mit lang="ja" auszeichnen (sonst chinesische Glyphen in manchen Schriften)
  App.etymText = (s) => esc(s || '').replace(/[㐀-鿿豈-﫿\u{20000}-\u{3134f}]+/gu, (m) => `<span lang="ja">${m}</span>`);

  // Platzhalter füllen; ohne Daten für das Zeichen bleibt der Abschnitt weg
  App.etymMount = async (host, ch) => {
    if (!host) return;
    const d = await App.etymLoad();
    const e = d && d[ch];
    if (!e || !host.isConnected) return;
    host.innerHTML = `<div class="section-title">Herkunft <span lang="ja" style="text-transform:none">字源</span></div>${App.etymHtml(ch, e)}`;
    host.querySelectorAll('[data-ef] img').forEach((img) => {
      img.onerror = () => {
        const f = img.closest('[data-ef]'); const ar = f.nextElementSibling;
        f.remove(); if (ar && ar.classList.contains('etym-arrow')) ar.remove();
        const strip = host.querySelector('.etym-forms');
        if (strip && !strip.querySelector('[data-ef]')) strip.remove();
      };
    });
  };
})(window.App = window.App || {});
