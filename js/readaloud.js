/* Nihongo Techō – Nachsprechen: Satz anhören (auch langsam), dreimal mitsprechen (Shadowing), laut vorlesen und prüfen lassen */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const R = App.readAloudLogic;
  const SHADOW_N = 3;      // so oft hintereinander beim Mitsprechen
  const SHADOW_GAP = 1200; // Pause zwischen den Durchgängen (ms)

  // Knopf neben einem Beispielsatz
  App.readAloudBtn = (jp, de) => (JP.canSpeak() || App.dictate.supported()
    ? `<button class="icon-btn sm" data-readaloud="${esc(jp)}" data-de="${esc(de || '')}" title="Nachsprechen: anhören, mitsprechen, vorlesen prüfen">${icon('mic')}</button>` : '');

  const sentHtml = (jp, res) => {
    if (!res) return JP.ruby(jp);
    return res.blocks.map((b) => {
      if (b.st === 'p') return esc(b.k);
      const inner = b.k !== b.r && b.r ? `<ruby>${esc(b.k)}<rt>${esc(b.r)}</rt></ruby>` : esc(b.k);
      return `<span class="ra-${b.st}">${inner}</span>`;
    }).join('');
  };

  // list: [{ jp, de }] zum Weiterblättern, at: Start
  App.readAloud = (list, at = 0, title = 'Nachsprechen') => {
    list = (list || []).filter((s) => s && s.jp);
    if (!list.length) return;
    let i = Math.max(0, Math.min(at, list.length - 1)), rec = null, shadow = 0, hide = false;
    const md = App.modal({ title: `<span lang="ja">声</span> ${esc(title)}`, cls: 'ra-modal', body: '<div class="ra" data-ra></div>', foot: '<div class="row between" style="width:100%" data-ra-nav></div>', onClose: () => stopAll() });
    const box = md.el.querySelector('[data-ra]');
    const modalEl = box.closest('.modal');
    const nav = modalEl.querySelector('[data-ra-nav]');
    const stopAll = () => { shadow = 0; if (rec) { rec.stop(true); rec = null; } if (App.voiceAudio) App.voiceAudio.stop(); if (window.speechSynthesis) speechSynthesis.cancel(); };
    const canSay = App.dictate.supported();
    const render = (res) => {
      const s = list[i];
      JP.preloadSentence(s.jp);
      box.innerHTML = `<div class="ra-sent${hide ? ' ra-hidden' : ''}" lang="ja" data-ra-sent title="${hide ? 'Antippen zum Zeigen' : ''}">${sentHtml(s.jp, res)}</div>
        ${s.de ? `<div class="ra-de muted">${esc(s.de)}</div>` : ''}
        <div class="ra-tools">
          ${JP.canSpeak() ? `<button class="btn" data-ra-play="1">${icon('speak')} Anhören</button>
          <button class="btn" data-ra-play="0.7" title="Langsamer abspielen, gleiche Tonhöhe">${icon('speak')} Langsam</button>
          <button class="btn" data-ra-shadow title="Spielt den Satz ${SHADOW_N}× hintereinander – sprich gleichzeitig laut mit">${icon('refresh')} Mitsprechen ${SHADOW_N}×</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-ra-hide title="Text ausblenden – nur nach Gehör mitsprechen">${icon(hide ? 'eye' : 'eyeOff')} ${hide ? 'Text zeigen' : 'Text verbergen'}</button>
        </div>
        ${canSay ? `<div class="ra-say"><button class="btn btn-primary mic" data-ra-rec>${icon('mic')} <span class="mic-label">Vorlesen prüfen</span></button><span class="ra-heard muted" lang="ja"></span></div><div class="ra-verdict"></div>`
          : '<p class="muted small">Vorlesen prüfen geht in Chrome oder Edge (Spracherkennung mit Internet).</p>'}
        <p class="muted small ra-tip">Erst anhören, dann mitsprechen, dann selbst vorlesen. Die App prüft, ob man dich versteht – nicht die Betonung.</p>`;
      nav.innerHTML = list.length > 1 ? `<button class="btn btn-sm" data-ra-go="-1"${i ? '' : ' disabled'}>‹ Vorheriger</button><span class="muted small">Satz ${i + 1} von ${list.length}</span><button class="btn btn-sm" data-ra-go="1"${i < list.length - 1 ? '' : ' disabled'}>Nächster ›</button>` : '';
      if (res) {
        const v = R.verdict(res);
        box.querySelector('.ra-heard').innerHTML = `<span lang="de">Gehört:</span> <b>${esc(res.heard)}</b>`;
        box.querySelector('.ra-verdict').innerHTML = `<div class="verdict ${v.cls}">${v.cls === 'ok' ? '✓' : v.cls === 'half' ? '◐' : '✗'} ${v.t} – ${res.got} von ${res.total} Silben</div>${res.score < 0.95 ? '<span class="muted small">Rot = nicht verstanden. Anhören und nochmal versuchen.</span>' : ''}`;
      }
    };
    const play = (rate, onEnd) => JP.speak(list[i].jp, { rate, onEnd });
    // Mitsprechen: mehrmals hintereinander mit kurzer Pause; ein neuer Klick bricht ab
    const shadowRun = () => {
      const run = ++shadow;
      const btn = box.querySelector('[data-ra-shadow]');
      let n = 0;
      const once = () => {
        if (shadow !== run || !box.isConnected) return;
        if (n >= SHADOW_N) { shadow = 0; if (btn) { btn.classList.remove('active'); btn.lastChild.textContent = ` Mitsprechen ${SHADOW_N}×`; } return; }
        n++;
        if (btn) { btn.classList.add('active'); btn.lastChild.textContent = ` ${n} von ${SHADOW_N} …`; }
        play(1, () => setTimeout(once, SHADOW_GAP));
      };
      once();
    };
    const listen = () => {
      if (rec) { rec.stop(); return; }
      stopAll();
      const btn = box.querySelector('[data-ra-rec]'), heard = box.querySelector('.ra-heard');
      const idle = () => { btn.classList.remove('active'); btn.querySelector('.mic-label').textContent = 'Vorlesen prüfen'; };
      btn.classList.add('active'); btn.querySelector('.mic-label').textContent = 'Fertig';
      heard.textContent = 'Ich höre zu – lies den Satz laut vor …';
      box.querySelector('.ra-verdict').innerHTML = '';
      const at = i;
      rec = App.dictate.listen({
        onInterim: (t) => { heard.textContent = t; },
        onFail: (msg) => { rec = null; idle(); heard.textContent = msg; },
        onDone: (alts) => {
          rec = null;
          if (!box.isConnected || at !== i) return;
          idle();
          const res = R.compare(list[i].jp, alts);
          if (!res) { heard.textContent = 'Nichts gehört – tippe auf „Vorlesen prüfen“.'; return; }
          render(res);
        },
      });
      if (!rec) idle();
    };
    modalEl.addEventListener('click', (e) => {
      const p = e.target.closest('[data-ra-play]');
      if (p) { stopAll(); play(+p.dataset.raPlay); return; }
      if (e.target.closest('[data-ra-shadow]')) { if (shadow) { stopAll(); render(); } else { stopAll(); shadowRun(); } return; }
      if (e.target.closest('[data-ra-hide]')) { hide = !hide; render(); return; }
      if (e.target.closest('[data-ra-sent]') && hide) { hide = false; render(); return; }
      if (e.target.closest('[data-ra-rec]')) { listen(); return; }
      const g = e.target.closest('[data-ra-go]');
      if (g && !g.disabled) { stopAll(); i += +g.dataset.raGo; render(); }
    });
    render();
  };

  // Knopf an einem Beispielsatz: alle Sätze mit Knopf auf dieser Seite zum Weiterblättern
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-readaloud]');
    if (!b || b.closest('.ra-modal')) return;
    e.preventDefault(); e.stopPropagation();
    const all = Array.from(document.querySelectorAll('[data-readaloud]'));
    App.readAloud(all.map((x) => ({ jp: x.dataset.readaloud, de: x.dataset.de })), all.indexOf(b));
  }, true);

  // Genki-Sätze einer Lektion (vertont): Vokabel-Beispielsätze in Reihenfolge der Sammlung
  App.genkiSentences = (lesson) => {
    const out = [], seen = new Set();
    App.itemsOf('vocab').forEach((it) => {
      if (!/^Genki/.test(it.source || '') || it.lesson !== lesson) return;
      (it.examples || []).forEach((ex) => { const k = JP.plain(ex.jp || ''); if (ex.jp && !seen.has(k)) { seen.add(k); out.push({ jp: ex.jp, de: App.exMeaning ? App.exMeaning(ex) : ex.de }); } });
    });
    return out;
  };
  // In „Zum Hören“ je Genki-Lektion (Grammatik-Liste): alle Sätze der Lektion nachsprechen
  App.readAloudGenkiBtn = (lesson) => {
    const n = App.genkiSentences(lesson).length;
    return n ? `<button type="button" class="btn btn-sm ra-genki" data-ra-genki="${lesson}">${icon('mic')} Sätze nachsprechen <span class="muted">· ${n}</span></button>` : '';
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ra-genki]');
    if (!b) return;
    e.preventDefault();
    const l = +b.dataset.raGenki;
    App.readAloud(App.genkiSentences(l), 0, `Genki Lektion ${l}`);
  });
})(window.App);
