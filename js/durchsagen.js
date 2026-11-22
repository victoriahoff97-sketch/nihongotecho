/* Nihongo Techō – „Durchsagen verstehen“ (Seite Hören › Reiter Durchsagen): echte Durchsagen und Gespräche von YouTube,
   erst hören, Fragen im Kopf beantworten, Lösung zeigen, selbst einstufen (Hatte ich richtig/falsch) */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const D = App.durchsagenLogic;
  const LIST = () => App.DURCHSAGEN || [];
  const res = () => App.store.settings.durchsagen || {};
  const find = (id) => LIST().find((c) => c.id === id);
  const STATUS = { neu: 'neu', richtig: '✓ richtig', nochmal: 'nochmal' };

  const row = (c) => {
    const st = D.status(res(), c.id);
    return `<div class="shun-row ds-row" data-ds-row="${esc(c.id)}">
      <button type="button" class="shun-play" data-ds-open="${esc(c.id)}" title="Anhören und Fragen beantworten">${icon('play')}</button>
      <button type="button" class="grow ds-name" data-ds-open="${esc(c.id)}">${esc(c.title)} <span class="muted small" lang="ja">${esc(c.jt || '')}</span></button>
      <span class="muted small ds-meta">${D.len(c)} · ${c.qs.length} Fragen</span>
      <span class="ds-st ${st}">${STATUS[st]}</span></div>`;
  };

  // Inhalt des Reiters „Durchsagen“ auf der Seite Hören
  const section = () => {
    const list = LIST();
    const n = D.count(list, res());
    const groups = D.groups(list, App.DURCHSAGEN_GROUPS || []);
    return `<section class="hr-sec ds-sec">
      <p class="muted small">Echte Durchsagen und Gespräche von YouTube – so, wie du sie in Japan hörst. Erst anhören (das Bild ist verschwommen, damit du nicht mitliest),
        die Fragen im Kopf beantworten, dann „Lösung zeigen“ und selbst einstufen. <span class="ds-score">${n.ok} von ${n.total} richtig</span></p>
      ${groups.map((g) => `<h3>${esc(g.label)}</h3>${g.items.map(row).join('')}`).join('')}
    </section>`;
  };

  // ---------- Fenster: Video, Fragen, Lösung, selbst einstufen ----------
  let cur = null; // { cnt, noCaptions }
  window.addEventListener('message', (e) => {
    if (!cur || !/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin) || typeof e.data !== 'string') return;
    let d;
    try { d = JSON.parse(e.data); } catch (err) { return; }
    if (!d.info) return;
    if (typeof d.info.currentTime === 'number') cur.cnt.tick(d.info.currentTime); // zählt fürs Tagesziel „Listening“
    if (d.info.playerState === undefined) return;
    const was = cur.state;
    cur.state = d.info.playerState;
    // Untertitel würden die Antworten verraten: sobald es läuft, (erneut) ausschalten
    if (cur.state === 1 && was !== 1) [0, 600, 1500].forEach((ms) => setTimeout(() => cur && cur.noCaptions && cur.noCaptions(), ms));
  });

  const open = (id) => {
    const c = find(id);
    if (!c) return;
    const file = location.protocol === 'file:';
    const video = file
      // Tablet-Version (file://): YouTube erlaubt dort kein eingebettetes Video
      ? `<div class="ds-file"><p>Das Video öffnet sich auf YouTube an der richtigen Stelle (ab ${App.listening.mmss(c.from)}, bis ${App.listening.mmss(c.to)}). Nicht hinschauen, nur hören – dann komm zurück.</p>
          <a class="btn btn-primary" href="${esc(D.watchUrl(c))}" target="_blank" rel="noopener">${icon('play')} Auf YouTube öffnen</a></div>`
      : `<div class="listen-video ds-video blur"><iframe src="${esc(D.embedUrl(c))}" title="${esc(c.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><span class="ds-veil">${icon('eyeOff')} Nur hören</span></div>
        <p class="small muted ds-tools"><button type="button" class="linklike" data-ds-blur>${icon('eye')} Bild zeigen</button> · <button type="button" class="linklike" data-ds-again>${icon('replay')} Nochmal von vorn</button> · <a href="${esc(D.watchUrl(c))}" target="_blank" rel="noopener">Auf YouTube ${icon('link')}</a></p>`;
    const body = `<div class="ds-body">
      <div class="ds-left">${video}<p class="small muted">${esc(c.src)} · ${D.len(c)}</p></div>
      <div class="ds-right"><ol class="ds-qs">${c.qs.map((q) => `<li><span>${esc(q.q)}</span><span class="ds-a" hidden>${esc(q.a)}</span></li>`).join('')}</ol>
        <div class="ds-sol" hidden>${c.ja ? `<p class="ds-ja" lang="ja">${esc(c.ja)}</p>` : ''}${c.note ? `<p class="small muted">${esc(c.note)}</p>` : ''}</div></div></div>`;
    App.closePlayers && App.closePlayers();
    cur = { cnt: App.listening.playCounter() };
    const md = App.modal({
      title: esc(c.title), body, wide: true, cls: 'ds-modal',
      foot: `<button class="btn" data-ds-close>Schließen</button><button class="btn btn-primary" data-ds-show>${icon('eye')} Lösung zeigen</button>`,
      onClose: () => { if (cur) cur.cnt.done(); cur = null; App.dayCheck.check(); },
    });
    const m = md.el;
    m.querySelector('[data-ds-close]').onclick = md.close;
    const frame = m.querySelector('iframe');
    if (frame) {
      const send = (msg) => { try { frame.contentWindow.postMessage(JSON.stringify(msg), '*'); } catch (err) { /* Fenster zu */ } };
      cur.noCaptions = () => send({ event: 'command', func: 'unloadModule', args: ['captions'], id: 1, channel: 'widget' });
      frame.addEventListener('load', () => { send({ event: 'listening', id: 1, channel: 'widget' }); cur && cur.noCaptions(); });
      const box = m.querySelector('.ds-video');
      const blurBtn = m.querySelector('[data-ds-blur]');
      blurBtn.onclick = () => {
        const on = box.classList.toggle('blur');
        blurBtn.innerHTML = on ? `${icon('eye')} Bild zeigen` : `${icon('eyeOff')} Bild verschwimmen`;
      };
      m.querySelector('[data-ds-again]').onclick = () => { frame.src = D.embedUrl(c) + '&autoplay=1'; };
    }
    // Lösung zeigen → Antworten und Wortlaut, dann selbst einstufen
    m.querySelector('[data-ds-show]').onclick = () => {
      m.querySelectorAll('.ds-a, .ds-sol').forEach((el) => { el.hidden = false; });
      m.querySelector('.modal-foot').innerHTML = `<button class="btn" data-ds-grade="0">✗ Hatte ich falsch</button><button class="btn btn-primary" data-ds-grade="1">${icon('check')} Hatte ich richtig</button>`;
      m.querySelectorAll('[data-ds-grade]').forEach((b) => b.addEventListener('click', async () => {
        const ok = b.dataset.dsGrade === '1';
        const before = App.store.settings.durchsagen || null;
        md.close();
        await App.saveSettings({ durchsagen: D.record(before, c.id, ok, App.today()) });
        App.toast(ok ? 'Richtig – gut gehört!' : 'Kommt auf die Liste „nochmal“', { label: 'Rückgängig', fn: () => App.saveSettings({ durchsagen: before }) });
      }));
    };
  };

  App.durchsagen = { section, open };
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-ds-open]');
    if (!t) return;
    e.preventDefault();
    open(t.dataset.dsOpen);
  });
})(window.App);
