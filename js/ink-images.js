/* Nihongo Techō – Bilder auf Stift-Seiten: Platzieren, Treffer, Skalieren, Verschieben. Browser: App.inkImages, Node: module.exports */
'use strict';
(function (root) {
  const MAX_PX = 1600;
  const MIN_W = 0.03;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // auf 4 Stellen wie die Strich-Punkte; abgerundet, damit das Klemmen am Rand erhalten bleibt
  const f4 = (v) => +(Math.floor(v * 1e4) / 1e4).toFixed(4);

  // Pixelmaße fürs Speichern: lange Seite höchstens maxPx
  const fitSize = (natW, natH, maxPx) => {
    const k = Math.min(1, maxPx / Math.max(natW, natH));
    return { w: Math.round(natW * k), h: Math.round(natH * k) };
  };

  // Startplatz: ⅓ Seitenbreite (Hochkant: höchstens halbe sichtbare Höhe), mittig in view, in die Seite geklemmt.
  // Alle Werte als Anteil der Seitenbreite; view = { x, y, w, h, pageH }
  const place = (natW, natH, view) => {
    const ar = natH / natW;
    let w = 1 / 3, h = w * ar;
    if (h > view.h / 2) { h = view.h / 2; w = h / ar; }
    w = f4(w); h = f4(h);
    const x = f4(clamp(view.x + view.w / 2 - w / 2, 0, 1 - w));
    const y = f4(clamp(view.y + view.h / 2 - h / 2, 0, view.pageH - h));
    return { x, y, w, h };
  };

  // Drehung (im.r in Grad, um die Bildmitte): Punkt in das ungedrehte Bild zurückdrehen
  const turn = (pt, c, deg) => { const a = (deg * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a), x = pt[0] - c[0], y = pt[1] - c[1]; return [c[0] + x * co - y * si, c[1] + x * si + y * co]; };
  const mid = (im) => [im.x + im.w / 2, im.y + im.h / 2];
  const local = (im, pt) => (im.r ? turn(pt, mid(im), -im.r) : pt);
  const inside = (im, q) => { const pt = local(im, q); return pt[0] >= im.x && pt[0] <= im.x + im.w && pt[1] >= im.y && pt[1] <= im.y + im.h; };
  // oberstes Bild = letztes im Array
  const hit = (images, pt) => {
    for (let i = images.length - 1; i >= 0; i--) if (inside(images[i], pt)) return images[i];
    return null;
  };

  const CORNERS = { nw: [0, 0], ne: [1, 0], sw: [0, 1], se: [1, 1] };
  // rotOff > 0: zusätzlich der Dreh-Griff ('rot') mittig über dem Bild
  const handleAt = (im, q, tol, rotOff = 0) => {
    const pt = local(im, q);
    if (rotOff && Math.abs(pt[0] - (im.x + im.w / 2)) <= tol && Math.abs(pt[1] - (im.y - rotOff)) <= tol) return 'rot';
    for (const k of Object.keys(CORNERS)) {
      const [cx, cy] = CORNERS[k];
      if (Math.abs(pt[0] - (im.x + cx * im.w)) <= tol && Math.abs(pt[1] - (im.y + cy * im.h)) <= tol) return k;
    }
    return null;
  };

  // Ecke ziehen: gegenüberliegende Ecke bleibt fest, Seitenverhältnis bleibt.
  // Breite = Projektion des Zeigers auf die Bilddiagonale (auch rein waagerechtes/senkrechtes Ziehen skaliert)
  const resize = (im, handle, pt, minW = MIN_W) => {
    const [cx, cy] = CORNERS[handle];
    const ar = im.h / im.w;
    const fx = im.x + (1 - cx) * im.w, fy = im.y + (1 - cy) * im.h;
    const sx = cx ? 1 : -1, sy = cy ? 1 : -1;
    const w = Math.max(minW, (sx * (pt[0] - fx) + ar * sy * (pt[1] - fy)) / (1 + ar * ar));
    const h = w * ar;
    return { x: cx ? fx : fx - w, y: cy ? fy : fy - h, w, h };
  };

  // Ecke ziehen ohne festes Seitenverhältnis (Merkzettel): gegenüberliegende Ecke bleibt fest
  const resizeFree = (im, handle, pt, min = { w: MIN_W, h: MIN_W }) => {
    const [cx, cy] = CORNERS[handle];
    const fx = im.x + (1 - cx) * im.w, fy = im.y + (1 - cy) * im.h;
    const w = Math.max(min.w, (cx ? 1 : -1) * (pt[0] - fx)), h = Math.max(min.h, (cy ? 1 : -1) * (pt[1] - fy));
    return { x: cx ? fx : fx - w, y: cy ? fy : fy - h, w, h };
  };

  // Ecke ziehen an einem gedrehten Bild: fn = resize/resizeFree rechnet im ungedrehten Bild, danach wird die feste Ecke auf dem Blatt wieder an ihren Platz gerückt
  const resizeTurned = (im, handle, q, fn) => {
    const nb = fn(im, handle, local(im, q));
    if (!im.r) return nb;
    const [cx, cy] = CORNERS[handle];
    const F = [im.x + (1 - cx) * im.w, im.y + (1 - cy) * im.h], Fp = turn(F, mid(im), im.r);
    const d = turn([F[0] - (nb.x + nb.w / 2), F[1] - (nb.y + nb.h / 2)], [0, 0], im.r);
    return { x: Fp[0] - d[0] - nb.w / 2, y: Fp[1] - d[1] - nb.h / 2, w: nb.w, h: nb.h };
  };
  // Dreh-Griff ziehen: Winkel vom Mittelpunkt zum Zeiger (0 = Griff oben), rastet nahe der Geraden und der Viertel ein
  const angle = (im, pt, snap = 4) => {
    const c = mid(im);
    let a = (Math.atan2(pt[0] - c[0], c[1] - pt[1]) * 180) / Math.PI;
    for (const s of [0, 90, 180, -90, -180]) if (Math.abs(a - s) <= snap) a = s;
    if (a === -180) a = 180;
    return +a.toFixed(1);
  };

  // Verschieben: ein Randstreifen (bis 0,05) bleibt auf der Seite
  const move = (im, dx, dy, pageH) => {
    const vw = Math.min(0.05, im.w), vh = Math.min(0.05, im.h);
    return { x: clamp(im.x + dx, vw - im.w, 1 - vw), y: clamp(im.y + dy, vh - im.h, pageH - vh), w: im.w, h: im.h };
  };

  const hasInk = (row) => !!((row.strokes && row.strokes.length) || (row.images && row.images.length));
  const newId = () => 'im_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const P = { MAX_PX, MIN_W, fitSize, place, hit, handleAt, resize, resizeFree, resizeTurned, angle, turn, move, hasInk, newId };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkImages = P;
})(this);
