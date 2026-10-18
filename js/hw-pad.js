/* Nihongo Techō – kleines Schreibfeld mit Erkennung (Antwort auf Karteikarten): Striche bleiben im Feld, nach einer Schreibpause erkennt Google */
'use strict';
(function (App) {
  const { icon } = App;
  const HW = App.hwLogic;
  const WAIT = 700; // ms Schreibpause, wie im Nachschlagen-Fenster
  // onResult(ja) mit den japanischen Vorschlägen, bester zuerst; onMsg(Text) bei Hinweisen; onClear() nach dem Leeren
  App.hwPad = (host, { onResult, onMsg, onClear }) => {
    host.innerHTML = `<div class="hw-pad empty"><canvas></canvas><span class="hw-pad-hint muted small">Hier mit dem Stift schreiben</span>
      <div class="hw-pad-tools"><button class="icon-btn sm" data-hwundo title="Letzten Strich zurücknehmen">${icon('undo')}</button><button class="icon-btn sm" data-hwclear title="Schreibfeld leeren">${icon('trash')}</button></div></div>`;
    const pad = host.firstElementChild, cv = pad.querySelector('canvas');
    let strokes = [], cur = null, timer = 0, run = 0, fresh = false, job = null, jobRun = -1; // fresh = Vorschläge passen zu den Strichen im Feld
    const draw = () => {
      pad.classList.toggle('empty', !strokes.length && !cur);
      const W = pad.clientWidth, k = window.devicePixelRatio || 1;
      if (!W) return;
      if (cv.width !== Math.round(W * k)) { cv.width = Math.round(W * k); cv.height = Math.round(pad.clientHeight * k); }
      const c = cv.getContext('2d'), u = W * k;
      c.clearRect(0, 0, cv.width, cv.height);
      c.strokeStyle = getComputedStyle(pad).color; c.lineWidth = 3 * k; c.lineCap = c.lineJoin = 'round';
      strokes.concat(cur || []).forEach((s) => {
        c.beginPath();
        s.pts.forEach((q, i) => (i ? c.lineTo(q[0] * u, q[1] * u) : c.moveTo(q[0] * u, q[1] * u)));
        if (s.pts.length === 1) c.lineTo(s.pts[0][0] * u + 0.1, s.pts[0][1] * u); // Punkt
        c.stroke();
      });
    };
    const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width]; };
    const clear = () => { clearTimeout(timer); run++; strokes = []; cur = null; fresh = false; draw(); if (onClear) onClear(); };
    const recognize = () => { job = recognizeNow(); jobRun = run; return job; };
    const recognizeNow = async () => {
      const n = ++run;
      if (!strokes.length) { clear(); return; }
      if (strokes.length > HW.MAX_STROKES) { onMsg('Zu viel geschrieben – bitte ein Wort'); return; }
      if (!(await App.hw.consent('Zum Erkennen werden die Striche aus dem Schreibfeld an Google gesendet (nur diese Linien). Einverstanden?'))) { if (n === run) clear(); return; }
      if (n !== run) return;
      onMsg('…');
      const ja = (await App.hw.recognize(strokes)).ja.filter((t) => t.trim());
      if (n !== run || !pad.isConnected) return; // inzwischen weitergeschrieben, geleert oder weitergeblättert
      if (!ja.length) { onMsg('Erkennung gerade nicht erreichbar'); return; }
      fresh = true;
      onResult(ja);
    };
    cv.addEventListener('pointerdown', (e) => {
      if (cur || (e.pointerType === 'mouse' && e.button > 0)) return;
      e.preventDefault();
      clearTimeout(timer); run++; fresh = false; // eine laufende Erkennung soll nicht mitten im Schreiben dazwischenfunken
      cv.setPointerCapture(e.pointerId);
      cur = { id: e.pointerId, pts: [pt(e)] };
      draw();
    });
    cv.addEventListener('pointermove', (e) => { if (cur && e.pointerId === cur.id) { cur.pts.push(pt(e)); draw(); } });
    const end = (e) => {
      if (!cur || e.pointerId !== cur.id) return;
      strokes.push({ pts: cur.pts }); cur = null;
      draw();
      timer = setTimeout(recognize, WAIT);
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    pad.addEventListener('click', (e) => {
      if (e.target.closest('[data-hwundo]')) { if (strokes.length) { strokes.pop(); fresh = false; draw(); recognize(); } return; }
      if (e.target.closest('[data-hwclear]')) clear();
    });
    requestAnimationFrame(draw);
    // pending: geschrieben, aber noch nicht (fertig) erkannt · flush: sofort erkennen bzw. die laufende Erkennung abwarten
    const pending = () => !!strokes.length && !fresh;
    const flush = async () => {
      if (!pending()) return;
      clearTimeout(timer);
      // run zählt bei jedem neuen Strich hoch: gleiche Nummer = die laufende Erkennung gilt schon für alle Striche im Feld
      await (jobRun === run ? job : recognize());
    };
    return { clear, pending, flush, stop: () => { clearTimeout(timer); run++; } };
  };
})(window.App);
