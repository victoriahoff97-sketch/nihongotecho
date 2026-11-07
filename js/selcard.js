/* Nihongo Techō – Markieren in der App: Japanischen Text auf einer Seite der App markieren (z. B. einen Tatoeba-Beispielsatz)
   → Kärtchen „Sätze erkennen“ / „Vokabel speichern“, wie mit der Browser-Erweiterung auf fremden Seiten. Speichert nie selbst. */
'use strict';
(function (App) {
  const S = App.selcardLogic;
  const SKIP = new Set(['RT', 'RP', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  const BLOCK = new Set(['P', 'DIV', 'LI', 'DT', 'DD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'TD', 'TH', 'FIGCAPTION', 'MAIN', 'BODY']);
  // Hier kein Kärtchen: Eingabefelder und Editoren (eigene Leisten), offene Fenster (die Übergabe wartet, bis sie zu sind),
  // Kartenrunden (ein Seitenwechsel würde die Runde beenden), Nachschlagen-Fenster, Tour
  const NO_CARD = 'input, textarea, select, [contenteditable], .modal-back, .viewer, .flash-stage, .lookup-pop, .sel-card, .tour-bubble, .tour-block';

  const textOf = (el, tag) => [...el.querySelectorAll(tag)].map((x) => x.textContent).join('');
  const rubyBase = (el) => { const c = el.cloneNode(true); c.querySelectorAll('rt, rp').forEach((x) => x.remove()); return c.textContent; };
  const clip = (n, range) => {
    if (!range) return n.nodeValue;
    if (!range.intersectsNode(n)) return '';
    const from = n === range.startContainer ? range.startOffset : 0;
    const to = n === range.endContainer ? range.endOffset : n.nodeValue.length;
    return n.nodeValue.slice(from, to);
  };
  const rubyParts = (el, range) => {
    let base = '', rt = '';
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      const n = walk.currentNode, up = n.parentElement.closest('rt, rp');
      if (up && up.tagName === 'RP') continue;
      if (up) rt += clip(n, range); else base += clip(n, range);
    }
    return { base, rt };
  };
  const inRt = (ruby, range) => [range.startContainer, range.endContainer].some((c) => {
    const rt = (c.nodeType === 1 ? c : c.parentElement).closest('rt');
    return !!rt && ruby.contains(rt);
  });
  // DOM → Token für toNotation; mit range nur der markierte Teil. Knöpfe (Vorlesen usw.) gehören nicht zum Text.
  const tokens = (node, range, out = []) => {
    for (const n of node.childNodes) {
      if (range && !range.intersectsNode(n)) continue;
      if (n.nodeType === 3) { out.push({ s: clip(n, range) }); continue; }
      if (n.nodeType !== 1 || SKIP.has(n.tagName) || n.tagName === 'BUTTON') continue;
      if (n.tagName === 'RUBY') {
        const part = range ? rubyParts(n, range) : null;
        const full = { base: rubyBase(n), rt: textOf(n, 'rt') };
        out.push(part ? S.rubyToken({ base: full.base, rt: full.rt, selBase: part.base, selRt: part.rt, inRt: inRt(n, range) }) : full);
        continue;
      }
      if (n.tagName === 'BR') { out.push({ s: '\n' }); continue; }
      const block = BLOCK.has(n.tagName);
      if (block) out.push({ s: '\n' });
      tokens(n, range, out);
      if (block) out.push({ s: '\n' });
    }
    return out;
  };
  const rangeRoot = (range) => {
    let el = range.commonAncestorContainer;
    if (el.nodeType !== 1) el = el.parentElement;
    const ruby = el.closest('ruby');
    return ruby ? ruby.parentElement : el;
  };
  const blockOf = (node) => {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && !BLOCK.has(el.tagName)) el = el.parentElement;
    return el;
  };
  const elOf = (n) => (n && n.nodeType === 1 ? n : n && n.parentElement);

  // → { text, satz, range } in Furigana-Schreibweise; null ohne japanische Markierung oder an Stellen ohne Kärtchen
  const grab = () => {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    const a = elOf(range.startContainer), b = elOf(range.endContainer);
    if (!a || !b || !document.getElementById('view').contains(a) || a.closest(NO_CARD) || b.closest(NO_CARD)) return null;
    const text = S.toNotation(tokens(rangeRoot(range), range));
    if (!text || !S.isJp(text)) return null;
    const block = blockOf(range.commonAncestorContainer);
    const para = block && block.textContent.length <= 3000 ? S.toNotation(tokens(block, null)) : '';
    return { text, satz: S.sentenceContaining(para, text), range };
  };

  const card = document.createElement('div');
  card.className = 'sel-card';
  card.hidden = true;
  card.innerHTML = `<button class="sec-vocab" data-sc="saetze"><span class="k" lang="ja">例</span>Sätze erkennen</button>
    <button class="sec-vocab" data-sc="vokabel"><span class="k" lang="ja">単</span>Vokabel speichern</button>`;
  const btnWord = card.querySelector('[data-sc="vokabel"]');

  // Bei Stift/Touch zeigt das Tablet sein eigenes Menü über der Markierung – das Kärtchen kommt darunter (Luft für die Griffe)
  let touchy = matchMedia('(pointer: coarse)').matches;
  document.addEventListener('pointerdown', (e) => { if (!card.contains(e.target)) touchy = e.pointerType !== 'mouse'; }, true);

  const hide = () => { card.hidden = true; };
  const place = () => {
    const g = grab();
    if (!g) return hide();
    // waagrecht am Ende der Markierung, senkrecht unter ihrer ganzen Höhe (das letzte Rechteck ist bei Ruby oft nur die Lesung darüber)
    const rects = g.range.getClientRects(), box = g.range.getBoundingClientRect();
    const last = rects.length ? rects[rects.length - 1] : box;
    if (!box || (!box.width && !box.height)) return hide();
    const r = { right: last.right, top: box.top, bottom: box.bottom };
    btnWord.hidden = !S.wordLike(g.text);
    if (!card.isConnected) document.body.appendChild(card);
    card.hidden = false;
    const w = card.offsetWidth, h = card.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    card.style.left = Math.max(8, Math.min(r.right - w / 2, vw - w - 8)) + 'px';
    const gap = touchy ? 34 : 10;
    // unter der Markierung; passt es dort nicht mehr hin, darüber
    const top = r.bottom + gap + h <= vh - 8 ? r.bottom + gap : Math.max(8, r.top - h - 10);
    card.style.top = top + 'px';
  };

  let timer = 0;
  document.addEventListener('selectionchange', () => { clearTimeout(timer); timer = setTimeout(place, 200); });
  window.addEventListener('scroll', () => { if (!card.hidden) place(); }, { passive: true, capture: true });
  window.addEventListener('resize', () => { if (!card.hidden) place(); });
  window.addEventListener('hashchange', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

  // Antippen des Kärtchens darf die Markierung nicht aufheben
  card.addEventListener('pointerdown', (e) => e.preventDefault());
  card.addEventListener('mousedown', (e) => e.preventDefault());
  card.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sc]');
    const g = b && grab();
    if (!g) return hide();
    hide();
    getSelection().removeAllRanges();
    if (b.dataset.sc === 'vokabel') App.inbox.vocabHere({ text: g.text, satz: g.satz });
    // Sätze: über den Eingang, neuer Verlaufseintrag – „Zurück“ führt auf die Seite mit dem Satz
    else App.go('#/eingang?' + new URLSearchParams({ ziel: 'saetze', text: g.text }));
  });
})(window.App);
