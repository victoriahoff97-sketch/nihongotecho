/* Nihongo Techō – Japanese with Shun: Zeilen, Abspielfenster und „Gehört“-Haken (Seite „Hören“ und Kasten in der Genki-Grammatik) */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const S = App.shun;
  const U = App.shunUi = {};
  const heard = () => App.store.settings.shunHeard || []; // ältere Stände kennen shunHeard noch nicht
  const isHeard = (id) => heard().includes(id);
  // „Genki I · Lektion 5“ bzw. „Folge 12“
  const where = (e) => (e.lesson != null ? `${S.source(e.lesson)} · Lektion ${e.lesson}` : `Folge ${e.n}`);

  U.row = (e) => `<div class="shun-row ${isHeard(e.id) ? 'heard' : ''}">
      <button type="button" class="shun-play" data-shun-play="${esc(e.id)}" title="Anhören">${icon('play')}</button>
      <span class="grow">${e.n != null ? `<span class="muted small">Ep ${e.n}</span> ` : ''}${esc(e.title)}</span>
      <span class="muted small">${S.minutes(e)} Min.</span>
      <button type="button" class="shun-tick" data-shun-heard="${esc(e.id)}" aria-pressed="${isHeard(e.id)}" title="${isHeard(e.id) ? 'Gehört – noch einmal tippen zum Zurücknehmen' : 'Als gehört abhaken'}">${icon('check')}</button>
    </div>`;

  // Kasten unter „Genki I · Lektion N“ in der Grammatik-Liste
  U.lessonBox = (source, lesson) => {
    if (!/^Genki II?$/.test(source || '') || !(lesson > 0) || S.source(lesson) !== source) return '';
    const list = S.forLesson(lesson);
    if (!list.length) return '';
    return `<div class="shun-box"><div class="shun-box-head">${icon('listen')} <b>Zum Hören · Shun</b><a class="small" href="#/hoeren?zu=shun">Alle Folgen</a></div>${list.map(U.row).join('')}</div>`;
  };

  const setHeard = async (id, on, quiet) => {
    const before = heard();
    if (before.includes(id) === on) return;
    await App.saveSettings({ shunHeard: S.toggle(before, id) });
    // Rückgängig nimmt nur diese Folge zurück – spätere Haken bleiben stehen
    if (!quiet) App.toast(on ? 'Gehört' : 'Nicht mehr als gehört markiert', { label: 'Rückgängig', fn: () => setHeard(id, !on, true) });
  };
  U.toggleHeard = (id) => setHeard(id, !isHeard(id));

  // Gemerkte Sekunde gilt nur für dieselbe Folge, nicht ganz am Anfang und nicht kurz vor dem Ende
  const resumeAt = (e) => {
    const s = App.store.settings.shunAt;
    if (!s || s.id !== e.id || !(s.t > 5)) return 0;
    const t = Math.floor(s.t);
    return t < (e.s || Infinity) - 5 ? t : 0;
  };

  let cur = null;
  const remember = () => { if (cur && cur.t > 0) App.saveSettings({ shunAt: { id: cur.id, t: Math.floor(cur.t) } }); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') remember(); });

  U.open = (id) => {
    const e = S.byId(id);
    if (!e) return;
    const at = resumeAt(e);
    const body = `<p class="small muted">Japanese with Shun · ${esc(where(e))} · ca. ${S.minutes(e)} Min.${at ? ` · weiter ab ${App.listening.mmss(at)}` : ''}</p>
      <audio class="listen-audio" controls autoplay preload="auto" src="${esc(e.url)}"></audio>
      <p class="small shun-err" hidden>Die Folge lässt sich gerade nicht laden. Bist du online?</p>`;
    cur = { id, t: at, cnt: App.listening.playCounter() };
    const md = App.modal({
      title: esc(e.title), body, cls: 'listen-modal shun-modal',
      foot: `<button class="btn" data-shun-close>Schließen</button><button class="btn btn-primary" data-shun-done>${icon('check')} Gehört</button>`,
      onClose: () => { const was = cur; remember(); if (cur) cur.cnt.done(); cur = null; if (was) App.dayCheck.check(); },
    });
    md.el.querySelector('[data-shun-close]').onclick = md.close;
    md.el.querySelector('[data-shun-done]').onclick = async () => {
      if (cur) cur.t = 0; // fertig gehört: keine Stelle merken
      md.close();
      await App.saveSettings({ shunAt: null });
      await setHeard(id, true);
    };
    const audio = md.el.querySelector('audio');
    if (at) audio.addEventListener('loadedmetadata', () => { audio.currentTime = at; }, { once: true });
    audio.addEventListener('timeupdate', () => { if (cur) { cur.t = audio.currentTime; cur.cnt.tick(cur.t); } });
    audio.addEventListener('error', () => { md.el.querySelector('.shun-err').hidden = false; });
  };

  document.addEventListener('click', (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-shun-play], [data-shun-heard]');
    if (!t) return;
    ev.preventDefault();
    if (t.matches('[data-shun-play]')) U.open(t.dataset.shunPlay); else U.toggleHeard(t.dataset.shunHeard);
  });
})(window.App);
