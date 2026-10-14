/* Nihongo Techō – Matsuri-Feuerwerk: Raketen, Funken und rieselndes Konfetti (mit Kirschblüten) über die ganze App */
'use strict';
(function (App) {
  const COLORS = ['#E24B4A', '#FAC775', '#EF9F27', '#ED93B1', '#ffffff', '#85B7EB', '#97C459'];
  const PETAL = '#F4C0D1';
  const DURATION = 6000; // so lange steigen Raketen und fällt Konfetti nach; danach blendet alles aus

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  // Glückwunsch in der Mitte – auch die einzige Anzeige, wenn Bewegung abgeschaltet ist
  const banner = () => {
    const el = document.createElement('div');
    el.className = 'matsuri-banner';
    el.setAttribute('role', 'status');
    el.innerHTML = '<b lang="ja">お疲れ様！</b><span>Wiederholt · angewendet · gehört</span>';
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3800);
    setTimeout(() => el.remove(), 4600);
  };

  App.matsuri = () => {
    banner();
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.querySelector('.matsuri-canvas')) return;
    const cv = document.createElement('canvas');
    cv.className = 'matsuri-canvas';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    window.addEventListener('resize', size);

    const rockets = [], sparks = [], confetti = [];
    const launch = () => rockets.push({ x: rnd(W * 0.15, W * 0.85), y: H + 10, vy: -rnd(H * 0.011, H * 0.015), top: rnd(H * 0.12, H * 0.42), color: pickColor() });
    const burst = (r) => {
      const n = 90, c2 = pickColor();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, v = rnd(2.5, 6.5);
        sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: rnd(0.012, 0.02), color: i % 3 ? r.color : c2 });
      }
    };
    const addConfetti = (n) => {
      for (let i = 0; i < n; i++) {
        const petal = Math.random() < 0.3;
        confetti.push({ x: rnd(0, W), y: rnd(-H * 0.6, -10), vy: rnd(1.2, 2.8), sway: rnd(0.6, 1.8), ph: rnd(0, 6.28), rot: rnd(0, 6.28), vr: rnd(-0.12, 0.12),
          w: petal ? rnd(7, 11) : rnd(6, 10), h: petal ? rnd(5, 8) : rnd(3, 6), petal, color: petal ? PETAL : pickColor() });
      }
    };

    const t0 = performance.now();
    let last = t0, nextLaunch = 0, alpha = 1;
    addConfetti(Math.min(220, Math.round(W / 6)));
    const frame = (now) => {
      const t = now - t0, dt = Math.min(2, (now - last) / 16.7);
      last = now;
      if (t < DURATION - 1500 && t > nextLaunch) { launch(); if (Math.random() < 0.5) launch(); nextLaunch = t + rnd(280, 620); }
      if (t < DURATION - 2500 && Math.random() < 0.25) addConfetti(2);
      if (t > DURATION) alpha -= 0.04 * dt;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, alpha);
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy * dt;
        ctx.fillStyle = r.color;
        ctx.fillRect(r.x - 1.5, r.y, 3, 10);
        if (r.y <= r.top) { burst(r); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.06 * dt; s.vx *= 0.985; s.life -= s.decay * dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, alpha) * s.life;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.8, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = Math.max(0, alpha);
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.ph += 0.05 * dt; c.y += c.vy * dt; c.x += Math.sin(c.ph) * c.sway * dt; c.rot += c.vr * dt;
        if (c.y > H + 20) { confetti.splice(i, 1); continue; }
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.fillStyle = c.color;
        if (c.petal) { ctx.beginPath(); ctx.ellipse(0, 0, c.w / 2, c.h / 2, 0, 0, 6.283); ctx.fill(); } else ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * Math.abs(Math.cos(c.ph)) + 1);
        ctx.restore();
      }
      if (alpha > 0 && (t < DURATION || rockets.length || sparks.length || confetti.length)) requestAnimationFrame(frame);
      else { window.removeEventListener('resize', size); cv.remove(); }
    };
    requestAnimationFrame(frame);
  };
})(window.App);
