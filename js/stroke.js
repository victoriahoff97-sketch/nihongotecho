/* Nihongo Techō – Strichfolge-Animation (KanjiVG) und Schreibübungsfeld */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const ST = App.stroke = {};
  const NS = 'http://www.w3.org/2000/svg';

  // Strichdaten: mitgeliefert (Genki I + Kana) oder bereits heruntergeladen – lädt NICHTS automatisch
  ST.get = async (ch) => {
    if (!ch) return null;
    if (window.KVG && window.KVG[ch]) return window.KVG[ch];
    const cached = await App.db.get('meta', 'kvg:' + ch);
    return cached ? cached.value : null;
  };
  ST.has = async (ch) => !!(await ST.get(ch));
  // Auf Klick: Strichfolge aus derselben Quelle (KanjiVG) herunterladen und lokal speichern
  ST.download = async (ch) => {
    if (!ch || !/[぀-ヿ㐀-鿿豈-﫿々]/.test(ch)) return { ok: false, error: 'Kein Kanji/Kana-Zeichen' };
    const hex = ch.codePointAt(0).toString(16).padStart(5, '0');
    let r;
    try { r = await fetch(`https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`); }
    catch (e) { return { ok: false, error: 'Keine Internetverbindung – bitte später nochmal versuchen.' }; }
    if (r.status === 404) return { ok: false, error: `KanjiVG hat für „${ch}“ keine Strichfolge.` };
    if (!r.ok) return { ok: false, error: 'Download fehlgeschlagen (' + r.status + ')' };
    const txt = await r.text();
    const paths = Array.from(txt.matchAll(/\sd="([^"]+)"/g)).map((m) => m[1]);
    if (!paths.length) return { ok: false, error: 'Die Datei enthielt keine Striche.' };
    await App.db.put('meta', { key: 'kvg:' + ch, value: paths, downloaded: Date.now() });
    // Strichzahl beim Kanji-Eintrag ergänzen, falls leer
    const it = App.kanjiByChar && App.kanjiByChar(ch);
    if (it && !it.strokes) { it.strokes = paths.length; await App.saveItem(it, { silent: true }); }
    document.dispatchEvent(new CustomEvent('kvg-loaded', { detail: ch }));
    return { ok: true, paths };
  };
  // Button-Logik (wird von mehreren Stellen genutzt)
  ST.downloadInto = async (btn, ch, msgEl) => {
    const old = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Lade …';
    const r = await ST.download(ch);
    btn.disabled = false; btn.innerHTML = old;
    if (r.ok) App.toast(`Strichfolge für ${ch} geladen (${r.paths.length} Striche)`);
    else { App.toast(r.error); if (msgEl) msgEl.textContent = r.error; }
    return r;
  };

  // ---------- Animation ----------
  ST.animator = async (host, ch, { size = '100%', autoplay = true, compact = false } = {}) => {
    host.innerHTML = `<div class="stroke-box"><svg class="stroke-svg" viewBox="0 0 109 109" style="width:${size}"></svg>
      <div class="stroke-ctrl">
        <button class="icon-btn sm" data-a="play" title="Abspielen/Pause">${icon('pause')}</button>
        <button class="icon-btn sm" data-a="replay" title="Neu starten">${icon('replay')}</button>
        <button class="icon-btn sm" data-a="step" title="Nächster Strich">${icon('step')}</button>
        ${compact ? '' : `<button class="btn btn-sm btn-ghost" data-a="speed" title="Geschwindigkeit">1×</button><button class="btn btn-sm btn-ghost" data-a="nums" title="Nummern">#</button>`}
      </div><div class="small muted" style="text-align:center" data-info></div></div>`;
    const svg = host.querySelector('svg');
    const info = host.querySelector('[data-info]');
    const paths = await ST.get(ch);
    if (!paths) {
      svg.innerHTML = `<text x="54.5" y="72" text-anchor="middle" style="font-size:64px;fill:var(--line-2);font-family:var(--font-kanji)">${esc(ch)}</text>`;
      const ctrl = host.querySelector('.stroke-ctrl');
      ctrl.innerHTML = `<button class="btn btn-sm btn-sec" data-dl>${icon('download')} Strichfolge herunterladen</button>`;
      info.textContent = 'Noch keine Strichfolge gespeichert. Quelle: KanjiVG (benötigt Internet)';
      ctrl.querySelector('[data-dl]').onclick = async (e) => {
        const r = await ST.downloadInto(e.currentTarget, ch, info);
        if (r.ok) ST.animator(host, ch, { size, autoplay: true, compact });
      };
      return null;
    }
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
    const gBg = mk('g', { fill: 'none', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const gFg = mk('g', { fill: 'none', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const gNum = mk('g', {});
    svg.append(gBg, gFg, gNum);
    const fg = paths.map((d) => {
      gBg.appendChild(mk('path', { d, class: 'bg' }));
      const p = mk('path', { d, class: 'fg' });
      gFg.appendChild(p);
      return p;
    });
    const lens = fg.map((p) => p.getTotalLength());
    fg.forEach((p, i) => { p.style.strokeDasharray = lens[i] + ' ' + lens[i]; p.style.strokeDashoffset = lens[i]; });
    // Nummern am Strichanfang
    fg.forEach((p, i) => {
      const pt = p.getPointAtLength(0);
      const t = mk('text', { x: pt.x - 4, y: pt.y - 2 }); t.textContent = i + 1; gNum.appendChild(t);
    });
    let showNums = !compact; gNum.style.display = showNums ? '' : 'none';
    let speed = 1, idx = 0, prog = 0, playing = false, raf = null, last = 0, pause = 0;
    const draw = () => {
      fg.forEach((p, i) => {
        p.style.strokeDashoffset = i < idx ? 0 : i === idx ? lens[i] * (1 - prog) : lens[i];
        p.setAttribute('class', i === idx && prog < 1 && playing ? 'cur' : 'fg');
      });
      info.textContent = `Strich ${Math.min(idx + (prog > 0 ? 1 : 0), fg.length)} / ${fg.length}`;
    };
    const tick = (ts) => {
      if (!playing) return;
      const dt = Math.min(64, ts - (last || ts)); last = ts;
      if (pause > 0) pause -= dt;
      else {
        prog += (dt * speed) / Math.max(260, lens[idx] * 9);
        if (prog >= 1) { prog = 0; idx++; pause = 180 / speed; if (idx >= fg.length) { idx = fg.length; playing = false; pause = 0; setBtn(); draw(); setTimeout(() => { if (host.isConnected && !playing && autoLoop) restart(); }, 2200); return; } }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    let autoLoop = true;
    const setBtn = () => { host.querySelector('[data-a=play]').innerHTML = icon(playing ? 'pause' : 'play'); };
    const play = () => { if (idx >= fg.length) { idx = 0; prog = 0; } playing = true; last = 0; setBtn(); raf = requestAnimationFrame(tick); };
    const stop = () => { playing = false; cancelAnimationFrame(raf); setBtn(); draw(); };
    const restart = () => { stop(); idx = 0; prog = 0; draw(); play(); };
    host.querySelector('.stroke-ctrl').addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'play') { autoLoop = true; playing ? (autoLoop = false, stop()) : play(); }
      if (a === 'replay') { autoLoop = true; restart(); }
      if (a === 'step') { autoLoop = false; stop(); if (idx >= fg.length) idx = 0; else { idx++; prog = 0; } draw(); }
      if (a === 'speed') { speed = speed === 1 ? 2 : speed === 2 ? 0.5 : 1; b.textContent = speed + '×'; }
      if (a === 'nums') { showNums = !showNums; gNum.style.display = showNums ? '' : 'none'; }
    });
    draw();
    if (autoplay) setTimeout(play, 250); else { idx = fg.length; draw(); }
    App.onLeave(() => { playing = false; autoLoop = false; cancelAnimationFrame(raf); });
    return { restart, count: fg.length };
  };

  // ---------- Schreibfeld ----------
  ST.pad = async (host, ch, { template = true } = {}) => {
    host.innerHTML = `<div class="pad-row"><div class="pad-wrap"><div class="pad-guide"></div><canvas></canvas></div>
      <div class="stack" style="min-width:180px">
        <button class="btn" data-p="clear">${icon('trash')} Löschen</button>
        <button class="btn" data-p="undo">${icon('undo')} Strich zurück</button>
        <button class="btn" data-p="tpl">${icon('eye')} Vorlage</button>
        <button class="btn" data-p="check">${icon('check')} Vergleichen</button>
        <div class="small muted" data-msg>Schreibe mit Stift, Finger oder Maus.</div>
      </div></div>`;
    const wrap = host.querySelector('.pad-wrap');
    const cv = host.querySelector('canvas');
    const guide = host.querySelector('.pad-guide');
    const msg = host.querySelector('[data-msg]');
    let paths = ch ? await ST.get(ch) : null;
    const onLoaded = async (e) => { if (e.detail === ch && host.isConnected) { paths = await ST.get(ch); renderGuide(); } };
    document.addEventListener('kvg-loaded', onLoaded);
    App.onLeave(() => document.removeEventListener('kvg-loaded', onLoaded));
    let showTpl = template, showCheck = false;
    const renderGuide = () => {
      guide.innerHTML = `<svg viewBox="0 0 109 109"><g stroke="var(--line-2)" stroke-width=".4" stroke-dasharray="2 2"><path d="M54.5 0v109M0 54.5h109"/></g>
        ${paths && (showTpl || showCheck) ? `<g fill="none" stroke="${showCheck ? 'rgba(200,64,42,.55)' : 'var(--line)'}" stroke-width="${showCheck ? 2 : 5}" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>` : ''}
        ${!paths && ch && showTpl ? `<text x="54.5" y="80" text-anchor="middle" style="font-size:80px;fill:var(--line);font-family:var(--font-kanji)">${esc(ch)}</text>` : ''}</svg>`;
    };
    renderGuide();
    const ctx = cv.getContext('2d');
    let strokes = [], cur = null;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      redraw();
    };
    const redraw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const W = cv.width;
      const col = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#222';
      for (const s of strokes.concat(cur ? [cur] : [])) {
        ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 1; i < s.length; i++) {
          const a = s[i - 1], b = s[i];
          ctx.lineWidth = W * 0.028 * (0.55 + (b.p || 0.5) * 0.9);
          ctx.beginPath(); ctx.moveTo(a.x * W, a.y * W); ctx.lineTo(b.x * W, b.y * W); ctx.stroke();
        }
        if (s.length === 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(s[0].x * W, s[0].y * W, W * 0.014, 0, 7); ctx.fill(); }
      }
    };
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, p: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.6 }; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [pt(e)]; redraw(); });
    cv.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      evs.forEach((ev) => cur.push(pt(ev)));
      redraw();
    });
    const end = () => { if (cur) { strokes.push(cur); cur = null; redraw(); if (paths) msg.textContent = `${strokes.length} von ${paths.length} Strichen`; } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    host.querySelector('.stack').addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const a = b.dataset.p;
      if (a === 'clear') { strokes = []; showCheck = false; renderGuide(); msg.textContent = 'Neuer Versuch!'; }
      if (a === 'undo') strokes.pop();
      if (a === 'tpl') { showTpl = !showTpl; b.innerHTML = icon(showTpl ? 'eye' : 'eyeOff') + ' Vorlage'; renderGuide(); }
      if (a === 'check') {
        showCheck = !showCheck; renderGuide();
        if (showCheck && paths) msg.innerHTML = strokes.length === paths.length ? `<b style="color:var(--matcha)">Strichzahl stimmt (${paths.length}) ✓</b>` : `<b style="color:var(--shu)">${strokes.length} statt ${paths.length} Striche</b>`;
      }
      redraw();
    });
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    App.onLeave(() => ro.disconnect());
    resize();
    return { clear: () => { strokes = []; redraw(); }, setChar: null };
  };
})(window.App);
