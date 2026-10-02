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

  const inside = (im, pt) => pt[0] >= im.x && pt[0] <= im.x + im.w && pt[1] >= im.y && pt[1] <= im.y + im.h;
  // oberstes Bild = letztes im Array
  const hit = (images, pt) => {
    for (let i = images.length - 1; i >= 0; i--) if (inside(images[i], pt)) return images[i];
    return null;
  };

  const CORNERS = { nw: [0, 0], ne: [1, 0], sw: [0, 1], se: [1, 1] };
  const handleAt = (im, pt, tol) => {
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

  // Verschieben: ein Randstreifen (bis 0,05) bleibt auf der Seite
  const move = (im, dx, dy, pageH) => {
    const vw = Math.min(0.05, im.w), vh = Math.min(0.05, im.h);
    return { x: clamp(im.x + dx, vw - im.w, 1 - vw), y: clamp(im.y + dy, vh - im.h, pageH - vh), w: im.w, h: im.h };
  };

  const hasInk = (row) => !!((row.strokes && row.strokes.length) || (row.images && row.images.length));
  const newId = () => 'im_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const P = { MAX_PX, MIN_W, fitSize, place, hit, handleAt, resize, move, hasInk, newId };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkImages = P;
})(this);
