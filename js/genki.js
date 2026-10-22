/* Nihongo Techō – Genki-Freischaltung in der App: Schlüssel merken, beim Start laden, mit Code freischalten */
'use strict';
(function (App) {
  // Der Code selbst wird nie gespeichert oder geloggt; gespeichert wird nur der nicht exportierbare CryptoKey
  // (strukturiert geklont, nicht per JSON) zusammen mit dem Salt unter meta.genkiKey.
  const G = App.genki = {};
  const L = () => App.genkiLogic;

  let state = window.GENKI_ENC ? 'locked' : 'none';
  let applied = false; // Einträge wurden in diesem Seitenaufruf schon an window.SEED angehängt
  let loading = null;
  let unlocking = null;

  const fail = (code, msg) => Object.assign(new Error(msg), { code });

  G.present = () => !!window.GENKI_ENC;
  G.state = () => state;

  // Einträge an window.SEED anhängen und SEED_MERGED mischen – höchstens einmal pro Seitenladung
  function apply(out) {
    if (applied) return;
    applied = true;
    if (!Array.isArray(window.SEED)) window.SEED = [];
    out.items.forEach((it) => window.SEED.push(it));
    window.SEED_MERGED = Object.assign(window.SEED_MERGED || {}, out.merged);
  }

  // Beim Start: gespeicherten Schlüssel lesen und, wenn er zum Salt passt, die Daten entschlüsseln.
  // Wirft nie – bei Problemen bleibt der Zustand 'stale' bzw. 'locked'.
  G.loadIfOpen = () => {
    const enc = window.GENKI_ENC;
    if (!enc || !L().supported()) return Promise.resolve();
    if (!loading) {
      loading = (async () => {
        if (applied) return;
        try {
          let stored;
          try {
            const rec = await App.db.get('meta', 'genkiKey');
            stored = rec && rec.value;
          } catch (e) {
            // Lesefehler der Datenbank: über den Code ist nichts bekannt – bleibt 'locked' (nicht 'stale')
            console.error('Genki: gespeicherter Schlüssel nicht lesbar', e && e.code ? e.code : e);
            return;
          }
          state = L().stateOf(enc, stored);
          if (state !== 'open') return;
          apply(await L().decrypt(enc, stored.key));
        } catch (e) {
          state = 'stale';
          console.error('Genki: gespeicherter Schlüssel nicht nutzbar', e && e.code ? e.code : e);
        }
      })();
    }
    return loading;
  };

  // Mit Code freischalten → { added, total }. Falscher Code: Fehler mit code GENKI_CODE, nichts wird verändert.
  G.unlock = (code) => {
    if (unlocking) return unlocking;
    unlocking = (async () => {
      const enc = window.GENKI_ENC;
      if (!enc) throw fail('GENKI_NONE', 'Keine Genki-Daten in dieser Version');
      if (!L().supported()) throw fail('GENKI_UNSUPPORTED', 'Dieser Browser kann die Genki-Daten nicht entschlüsseln');
      const key = await L().deriveKey(code, enc);
      const out = await L().decrypt(enc, key);
      await App.db.put('meta', { key: 'genkiKey', value: { salt: enc.salt, key } });
      apply(out);
      state = 'open';
      const added = await App.reseed();
      return { added, total: out.items.length };
    })();
    const done = () => { unlocking = null; };
    unlocking.then(done, done);
    return unlocking;
  };

  // ---------- Karte „Genki I freischalten“ ----------
  const T = {
    title: 'Genki I freischalten',
    text: 'Vokabeln, Grammatik, Kanji und Ausdrücke aus Genki I. Den Code bekommst du von der Person, die dir die App gegeben hat.',
    stale: 'Der Code wurde erneuert – bitte den neuen Code eingeben.',
    unsupported: 'Dieser Browser kann Genki nicht freischalten – bitte Chrome oder Edge verwenden.',
    wrong: 'Der Code stimmt nicht.',
    failed: 'Freischalten hat nicht geklappt – bitte noch einmal versuchen.',
    openTitle: 'Genki I',
    openText: 'Vokabeln, Grammatik, Kanji und Ausdrücke aus Genki I sind freigeschaltet. Aktualisierungen kommen automatisch.',
    go: 'Freischalten',
    busy: 'Wird geprüft …',
  };

  // HTML der Karte; leer, wenn die Version keine Genki-Daten enthält (ZIP, Tablet)
  G.card = () => {
    const st = state;
    if (st === 'none') return '';
    const { esc, icon } = App;
    const head = `<div class="row between"><h3>${esc(st === 'open' ? T.openTitle : T.title)}</h3>${st === 'open' ? '<span class="pack-status ok">Freigeschaltet</span>' : ''}</div>`;
    if (st === 'open') return `<div class="card" data-genki-card>${head}<p class="small muted">${esc(T.openText)}</p></div>`;
    if (!L().supported()) return `<div class="card" data-genki-card>${head}<p class="small">${esc(T.unsupported)}</p></div>`;
    return `<div class="card" data-genki-card>${head}
      <p class="small muted">${esc(T.text)}</p>
      ${st === 'stale' ? `<p class="small">${esc(T.stale)}</p>` : ''}
      <form class="row" data-genki-form>
        <input class="input" type="text" data-genki-code placeholder="XXXX-XXXX-XXXX-XXXX" aria-label="Freischaltcode" autocomplete="off" autocapitalize="characters" spellcheck="false">
        <button class="btn btn-primary" type="submit" data-genki-btn>${icon('plus')} ${esc(T.go)}</button>
      </form>
      <p class="small" role="alert" data-genki-err hidden style="color:var(--shu)"></p></div>`;
  };

  // Formular absenden: Code prüfen, Rückmeldung am Formular. Der Code wird nur an unlock gereicht, nie gemerkt oder geloggt.
  let submitting = false;
  G._submit = async (form) => {
    if (submitting) return;
    const input = form.querySelector('[data-genki-code]');
    const btn = form.querySelector('[data-genki-btn]');
    // Die Meldung liegt in der Karte neben dem Formular, nicht darin
    const cardEl = form.closest && form.closest('[data-genki-card]');
    const err = cardEl && cardEl.querySelector('[data-genki-err]');
    const show = (msg) => { if (err) { err.textContent = msg; err.hidden = !msg; } };
    submitting = true;
    const label = btn && btn.innerHTML;
    show('');
    if (btn) { btn.disabled = true; btn.textContent = T.busy; }
    try {
      const r = await G.unlock(input ? input.value : '');
      App.toast(r.added > 0 ? `Genki I freigeschaltet – ${r.added} neue Einträge` : 'Genki I freigeschaltet – deine Einträge sind aktuell');
      App.render();
    } catch (e) {
      if (e && e.code === 'GENKI_CODE') show(T.wrong);
      else if (e && e.code === 'GENKI_UNSUPPORTED') show(T.unsupported);
      else { console.error(e); show(T.failed); }
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
    } finally {
      submitting = false;
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('submit', (e) => {
      const form = e.target.closest && e.target.closest('form[data-genki-form]');
      if (!form) return;
      e.preventDefault();
      G._submit(form);
    });
  }
})(window.App);
