/* Nihongo Techō – Gruppenforum: Gedankenwolke in der oberen Leiste und das Gruppenfenster dahinter */
'use strict';
(function (App) {
  // Der einzige Teil der App, der online geteilt wird (js/forum-db.js). Was nur dieses Gerät betrifft – Gruppencode,
  // Name, was schon gesehen wurde, angefangene Texte – liegt in localStorage, nicht im Backup.
  const { $, $$, esc, icon } = App;
  const F = App.forumLogic;
  const D = App.forumDb;
  const KEY = 'nt-forum';
  const KIND = { rede: '💬 Redebedarf', zeigen: '💡 Zum Zeigen' };
  const OFFLINE = 'Gerade offline – Beiträge kommen, sobald du wieder Internet hast.';
  const NO_GROUP = 'Diesen Gruppencode gibt es nicht. Prüf die Schreibweise.';
  const JPEG = 'data:image/jpeg;base64,';

  // ---------- Gerätezustand ----------
  const blank = () => ({ code: '', name: '', seen: {}, drafts: {}, fresh: false });
  let st = (() => {
    try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return blank(); }
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* privates Fenster: dann eben nur bis zum Schließen */ } };
  const draft = (key) => st.drafts[key] || '';
  const saveDraft = (key, text) => { if (text) st.drafts[key] = text; else delete st.drafts[key]; save(); };

  // ---------- Verbindung ----------
  let posts = [];
  let status = 'idle'; // idle · loading · live · offline
  let unsub = null;
  let ui = null; // offenes Fenster: { md, root, view: 'join'|'list'|'post', id, ... }

  // gen zählt jede Verbindung: Antworten einer schon beendeten (stop während des Ladens) werden verworfen,
  // sonst hingen zwei Listener dran oder ein alter Fehler würfe eine gerade beigetretene Gruppe wieder raus
  let gen = 0;
  const stop = () => { gen++; if (unsub) unsub(); unsub = null; posts = []; status = 'idle'; };
  const start = () => {
    if (!D.configured() || !st.code || unsub || status === 'loading') return;
    status = 'loading';
    const g = gen;
    const mine = (fn) => (...a) => { if (g === gen) fn(...a); };
    D.load().then(mine(() => { unsub = D.watchPosts(st.code, mine(onPosts), mine(onError)); })).catch(mine(onError));
  };
  const onPosts = (list, meta = {}) => {
    posts = list;
    // offline gestartet: noch nie Antwort vom Server – nicht „Noch keine Gedanken“ zeigen
    status = meta.fromCache && !list.length ? 'offline' : 'live';
    // gerade beigetreten: was schon da war, gilt als gesehen
    if (st.fresh && status === 'live') { st.seen = Object.assign(Object.fromEntries(list.map((p) => [p.id, F.seenAt(p, Date.now())])), st.seen); st.fresh = false; save(); }
    refreshDot();
    if (ui) ui.onPosts();
  };
  const onError = (e) => {
    unsub = null;
    // kein Mitglied mehr (oder Gruppe weg): zurück zum Beitreten
    if (e && e.code === 'permission-denied') { stop(); st = Object.assign(blank(), { name: st.name, drafts: st.drafts }); save(); refreshDot(); if (ui) showJoin(); return; }
    status = 'offline';
    refreshDot();
    if (ui) ui.onPosts();
  };

  const refreshDot = () => {
    const dot = $('.forum-dot');
    if (dot) dot.hidden = !(status === 'live' && F.hasNew(posts, st.seen, D.uid()));
  };
  const markSeen = (id) => { st.seen = F.markSeen(st.seen, id, F.seenAt(posts.find((p) => p.id === id), Date.now())); save(); refreshDot(); };

  // ---------- Bilder ----------
  // Längste Seite 1280 / 1024 / 800 px, JPEG-Qualität schrittweise runter, bis es in einen Beitrag passt
  const shrinkImage = async (file) => {
    const bmp = await createImageBitmap(file);
    const cv = document.createElement('canvas');
    for (const max of F.SIZES) {
      const { w, h } = F.fitSize(bmp.width, bmp.height, max);
      cv.width = w; cv.height = h;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); // durchsichtige PNGs nicht schwarz
      cx.drawImage(bmp, 0, 0, w, h);
      for (const q of F.QUALITIES) {
        const url = cv.toDataURL('image/jpeg', q);
        if (url.length <= F.MAX_IMAGE) return url;
      }
    }
    throw new Error('too-big');
  };
  const imgHtml = (src, cls) => (typeof src === 'string' && src.startsWith(JPEG) ? `<img class="${cls}" src="${esc(src)}" alt="Bild">` : '');
  const showBig = (src) => App.modal({ title: 'Bild', body: imgHtml(src, 'forum-big'), foot: false, wide: true, cls: 'forum-img-modal' });

  // ---------- Verknüpfte Einträge ----------
  const toRef = (it) => F.makeRef(it, { label: App.itemPlain(it), sub: App.itemSub(it) });
  // Eintrag, der gerade unter dem Fenster offen ist (z. B. #/grammatik/g-n5-wa) – für „Diesen Eintrag anhängen“
  const pageItem = () => {
    const parts = App.parseHash().path.split('/').filter(Boolean);
    if (parts.length !== 2) return null;
    const key = decodeURIComponent(parts[1]);
    if (parts[0] === 'kanji') return App.kanjiByChar(key) || App.item(key);
    const it = App.item(key);
    return it && F.REF_TYPES.includes(it.type) && App.link(it) === '#/' + parts.join('/') ? it : null;
  };
  const byWord = (w) => { for (const it of App.store.items.values()) if (it.type === 'vocab' && (it.kanji === w || it.kana === w)) return it; return null; };
  const resolve = (ref) => F.resolveRef(ref, { byId: App.item, byWord });
  const refsHtml = (refs, owner) => {
    const list = F.cleanRefs(refs);
    if (!list.length) return '';
    return `<div class="forum-refs">${list.map((r, i) => {
      const sec = App.SECTIONS[r.type];
      const take = resolve(r).kind === 'take';
      return `<span class="forum-ref ${sec.cls}"><button type="button" class="forum-ref-open" data-ref="${esc(owner)}:${i}" title="${take ? 'Hast du noch nicht – danach suchen' : 'Öffnen'}">
          <span class="badge sec">${sec.label}</span><b lang="ja">${esc(r.label)}</b>${r.sub ? `<span class="muted">${esc(r.sub)}</span>` : ''}</button>
          ${take ? `<button type="button" class="btn btn-sm" data-take="${esc(owner)}:${i}">${icon('plus')} Als Vokabel übernehmen</button>` : ''}</span>`;
    }).join('')}</div>`;
  };
  // Verweis antippen: öffnen (Fenster zu), eigene Vokabel öffnen oder danach suchen
  const openRef = (ref) => {
    const r = resolve(ref);
    const to = r.kind === 'open' ? App.link(App.item(r.id)) : '#/suche?' + new URLSearchParams({ q: ref.label });
    if (ui) ui.md.close();
    App.go(to);
  };
  const takeRef = (ref, after) => {
    const v = ref.vocab || {};
    App.editItem({
      type: 'vocab', title: 'Vokabel übernehmen',
      defaults: { kana: v.kana, kanji: v.kanji, de: v.de, pos: v.pos, examples: v.examples || [], source: 'Eigene', tags: [] },
      onSaved: () => { App.toast(`„${ref.label}“ ist jetzt in deinen Vokabeln`); if (after) after(); },
    });
  };

  // ---------- Eingabefeld (neuer Gedanke, Antwort, Bearbeiten) ----------
  // key = Entwurf auf diesem Gerät ('new' bzw. 'r:<postId>'); beim Bearbeiten kein Entwurf
  const composer = ({ key, kinds, label, placeholder, init = {}, onSubmit, onCancel }) => {
    const el = document.createElement('div');
    el.className = 'forum-compose';
    el.innerHTML = `<textarea class="input" maxlength="${F.MAX_TEXT}" placeholder="${esc(placeholder)}"></textarea>
      <div class="forum-img-prev" hidden></div>
      <div class="forum-chosen"></div>
      <div class="forum-row">
        ${kinds ? `<div class="forum-kinds">${Object.keys(KIND).map((k) => `<button type="button" class="chip" data-kind="${k}">${KIND[k]}</button>`).join('')}</div>` : ''}
        <label class="btn btn-sm forum-pick">${icon('imagePlus')}<span>Bild</span><input type="file" accept="image/*" hidden></label>
        <button type="button" class="btn btn-sm" data-link>${icon('link')}<span>Eintrag</span></button>
        <span class="grow"></span>
        ${onCancel ? '<button type="button" class="btn btn-sm" data-cancel>Abbrechen</button>' : ''}
        <button type="button" class="btn btn-sm btn-primary" data-send>${esc(label)}</button>
      </div>
      <div class="forum-err" hidden></div>`;
    const ta = el.querySelector('textarea');
    const prev = el.querySelector('.forum-img-prev');
    const err = el.querySelector('.forum-err');
    let kind = init.kind || 'rede';
    let image = init.image || null;
    let busy = false;
    ta.value = key ? draft(key) : (init.text || '');
    const setErr = (msg) => { err.textContent = msg; err.hidden = !msg; };
    const setKind = (k) => { kind = k; $$('[data-kind]', el).forEach((b) => b.classList.toggle('on', b.dataset.kind === k)); };
    const setImage = (src) => {
      image = src;
      prev.hidden = !src;
      prev.innerHTML = src ? `${imgHtml(src, 'forum-thumb')}<button type="button" class="icon-btn" data-noimg title="Bild entfernen" aria-label="Bild entfernen">${icon('close')}</button>` : '';
    };
    // Verknüpfte Einträge: gewählte als Kärtchen mit ✕, dazu der gerade offene Eintrag als Vorschlag
    let refs = F.cleanRefs(init.refs);
    const chosen = el.querySelector('.forum-chosen');
    const drawRefs = () => {
      const here = pageItem();
      const offer = here && !refs.some((r) => r.id === here.id) && refs.length < F.MAX_REFS ? here : null;
      chosen.innerHTML = refs.map((r, i) => `<span class="chip on ${App.SECTIONS[r.type].cls}"><span lang="ja">${esc(r.label)}</span>
          <button type="button" class="forum-unref" data-unref="${i}" title="Verknüpfung entfernen" aria-label="Verknüpfung entfernen">✕</button></span>`).join('')
        + (offer ? `<button type="button" class="chip forum-offer" data-here>${icon('plus')} Diesen Eintrag anhängen: <b lang="ja">${esc(App.itemPlain(offer))}</b></button>` : '');
      chosen.hidden = !chosen.innerHTML;
    };
    const pick = async () => {
      const ids = await App.pickItems({ title: 'Einträge verknüpfen', types: F.REF_TYPES, selected: refs.map((r) => r.id) });
      if (!ids) return;
      // Verweise auf Einträge, die es auf diesem Gerät nicht gibt (beim Bearbeiten), bleiben stehen
      const kept = refs.filter((r) => !App.item(r.id));
      const next = kept.concat(ids.map(App.item).filter(Boolean).map(toRef));
      if (next.length > F.MAX_REFS) App.toast(`Höchstens ${F.MAX_REFS} Einträge pro Beitrag`);
      refs = next.slice(0, F.MAX_REFS);
      drawRefs();
    };
    if (kinds) setKind(kind);
    setImage(image);
    drawRefs();
    const keep = key ? App.debounce(() => saveDraft(key, ta.value), 400) : () => {};
    ta.addEventListener('input', () => { setErr(''); keep(); });
    el.addEventListener('click', (e) => {
      const k = e.target.closest('[data-kind]');
      if (k) setKind(k.dataset.kind);
      if (e.target.closest('[data-noimg]')) setImage(null);
      if (e.target.closest('[data-cancel]')) onCancel();
      if (e.target.closest('[data-link]')) pick();
      const un = e.target.closest('[data-unref]');
      if (un) { refs.splice(Number(un.dataset.unref), 1); drawRefs(); }
      if (e.target.closest('[data-here]')) { const it = pageItem(); if (it) { refs.push(toRef(it)); setErr(''); drawRefs(); } }
    });
    el.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      setErr('');
      try { setImage(await shrinkImage(file)); } catch (x) { setErr('Dieses Bild ist zu groß. Probier einen Ausschnitt.'); }
    });
    el.querySelector('[data-send]').addEventListener('click', async () => {
      if (busy) return;
      if (navigator.onLine === false) { setErr(OFFLINE); return; }
      const text = ta.value.trim();
      const msg = F.checkPost({ text, image, refs });
      if (msg) { setErr(msg); return; }
      busy = true;
      try {
        await onSubmit({ kind, text, image, refs });
        if (key) { saveDraft(key, ''); ta.value = ''; setImage(null); refs = []; drawRefs(); }
      } catch (x) {
        setErr(OFFLINE);
      } finally { busy = false; }
    });
    return el;
  };

  // ---------- Fenster ----------
  const meta = (p) => `<b>${esc(p.name)}</b> · ${p.createdAt ? esc(F.relTime(p.createdAt, Date.now())) : 'gerade eben'}${p.editedAt ? ' (bearbeitet)' : ''}`;
  const dayMonth = (ms) => { const d = new Date(ms); return `${d.getDate()}.${d.getMonth() + 1}.`; };
  const offlineNote = () => `<div class="forum-note">${esc(OFFLINE)}</div>`;

  const open = () => {
    if (ui) return;
    if (!D.configured()) {
      App.modal({ title: 'Gruppe', body: '<p>Die Gruppe ist auf diesem Gerät noch nicht eingerichtet. Sobald das Update mit eurer Gruppe da ist, geht es hier los.</p>', foot: false, cls: 'forum-modal' });
      return;
    }
    const md = App.modal({
      title: `${icon('thought')} Gruppe`, body: '<div class="forum"></div>', foot: false, cls: 'forum-modal',
      onClose: () => { if (ui && ui.cleanup) ui.cleanup(); ui = null; },
    });
    const more = document.createElement('div');
    more.className = 'forum-more';
    more.innerHTML = `<button class="icon-btn" data-more title="Mehr" aria-label="Mehr">${icon('more')}</button>`;
    md.el.querySelector('.modal-head [data-x]').before(more);
    ui = { md, root: md.body.querySelector('.forum') };
    more.querySelector('[data-more]').onclick = (e) => { e.stopPropagation(); toggleMenu(more); };
    if (!st.code) showJoin();
    else { if (status !== 'live') { stop(); start(); } showList(); }
  };

  // ---------- ⋯-Menü ----------
  const toggleMenu = (host) => {
    const old = host.querySelector('.more-pop');
    if (old) { old.remove(); return; }
    const pop = document.createElement('div');
    pop.className = 'more-pop card';
    const item = (k, ic, label, cls = '') => `<button class="more-item ${cls}" data-m="${k}">${icon(ic)}<span>${label}</span></button>`;
    pop.innerHTML = st.code
      ? item('code', 'link', 'Gruppencode anzeigen') + item('name', 'edit', 'Meinen Namen ändern') + item('help', 'help', 'Hilfe')
        + item('leave', 'close', 'Gruppe auf diesem Gerät verlassen', 'danger')
      : item('help', 'help', 'Hilfe');
    host.appendChild(pop);
    const close = (e) => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', close, true); } };
    setTimeout(() => document.addEventListener('click', close, true));
    pop.onclick = async (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      pop.remove();
      document.removeEventListener('click', close, true);
      const m = b.dataset.m;
      if (m === 'code') showCode(st.code);
      if (m === 'help') App.tour.start('gruppe');
      if (m === 'name') rename();
      if (m === 'leave') leave();
    };
  };
  const copy = (text) => navigator.clipboard.writeText(text).then(() => App.toast('Code kopiert'), () => App.toast('Kopieren ging nicht – bitte von Hand abschreiben.'));
  const showCode = (code) => {
    const md = App.modal({
      title: 'Gruppencode', foot: false, cls: 'forum-modal',
      body: `<p>Schick diesen Code an die anderen. Sie tippen auf die Wolke und geben ihn dort ein.</p>
        <div class="forum-code">${esc(code)}</div><div class="row"><button class="btn btn-primary" data-copy>${icon('copy')} Code kopieren</button></div>`,
    });
    md.el.querySelector('[data-copy]').onclick = () => copy(code);
  };
  const rename = async () => {
    const r = await App.ask('Meinen Namen ändern', [{ label: 'Dein Name', value: st.name }]);
    if (!r) return;
    const msg = F.checkName(r[0]);
    if (msg) { App.toast(msg); return; }
    try { await D.rename(st.code, r[0]); st.name = r[0]; save(); App.toast('Name geändert – gilt für neue Beiträge.'); } catch (e) { App.toast(OFFLINE); }
  };
  const leave = async () => {
    if (!(await App.confirm('Dieses Gerät verlässt die Gruppe. Mit dem Code kannst du jederzeit wieder beitreten.', { ok: 'Verlassen' }))) return;
    const code = st.code;
    stop();
    st = Object.assign(blank(), { name: st.name });
    save();
    refreshDot();
    try { await D.leaveGroup(code); } catch (e) { /* offline: der Eintrag bleibt liegen, schadet nicht */ }
    if (ui) showJoin();
  };

  // ---------- Beitreten / Gründen ----------
  const showJoin = (mode = 'join') => {
    if (ui.cleanup) ui.cleanup();
    ui.view = 'join';
    ui.onPosts = () => {};
    ui.cleanup = null;
    const r = ui.root;
    r.innerHTML = mode === 'join'
      ? `<p>Hier teilt ihr Themen, über die ihr reden wollt, und Dinge, die ihr euch zeigen möchtet. Nur dieser Bereich wird mit eurer Gruppe geteilt – alles andere bleibt bei dir.</p>
        <div class="form">
          <div class="field"><label>Gruppencode</label><input class="input" data-code placeholder="z. B. sakura-7kq3-m9xd" autocomplete="off" autocapitalize="off" spellcheck="false" autofocus></div>
          <div class="field"><label>Dein Name</label><input class="input" data-name maxlength="${F.MAX_NAME}" value="${esc(st.name)}" placeholder="So sehen dich die anderen"></div>
          <div class="forum-err" hidden></div>
          <div class="row"><button class="btn btn-primary" data-go>Beitreten</button></div>
        </div>
        <p class="hint">Noch keine Gruppe? <a href="#" data-create>Neue Gruppe gründen</a></p>`
      : `<p>Du gründest eine neue Gruppe. Danach bekommst du einen Code, den du an die anderen schickst.</p>
        <div class="form">
          <div class="field"><label>Dein Name</label><input class="input" data-name maxlength="${F.MAX_NAME}" value="${esc(st.name)}" placeholder="So sehen dich die anderen" autofocus></div>
          <div class="forum-err" hidden></div>
          <div class="row"><button class="btn" data-back>Zurück</button><button class="btn btn-primary" data-go>Gründen</button></div>
        </div>`;
    App.hydrateIcons(r);
    const err = r.querySelector('.forum-err');
    const setErr = (m) => { err.textContent = m; err.hidden = !m; };
    let busy = false;
    const go = async () => {
      if (busy) return;
      const name = r.querySelector('[data-name]').value.trim();
      const codeIn = r.querySelector('[data-code]');
      const code = codeIn ? F.normCode(codeIn.value) : F.makeCode(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
      const nameMsg = F.checkName(name);
      if (codeIn && !F.isCode(code)) return setErr(NO_GROUP);
      if (nameMsg) return setErr(nameMsg);
      if (navigator.onLine === false) return setErr(OFFLINE);
      setErr('');
      busy = true;
      try {
        await D.load();
        if (codeIn) await D.joinGroup(code, name); else await D.createGroup(code, name);
        st = Object.assign(blank(), { code, name, fresh: true });
        save();
        stop();
        start();
        if (codeIn) showList(); else showCreated(code);
      } catch (e) {
        setErr(e && e.code === 'no-group' ? NO_GROUP : OFFLINE);
      } finally { busy = false; }
    };
    r.querySelector('[data-go]').onclick = go;
    $$('input', r).forEach((x) => x.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }));
    const c = r.querySelector('[data-create]');
    if (c) c.onclick = (e) => { e.preventDefault(); showJoin('create'); };
    const b = r.querySelector('[data-back]');
    if (b) b.onclick = () => showJoin('join');
    setTimeout(() => { const f = r.querySelector('[autofocus]'); if (f) f.focus(); }, 30);
  };
  const showCreated = (code) => {
    ui.root.innerHTML = `<p>Eure Gruppe ist da. Schick diesen Code an die anderen – sie tippen auf die Wolke und geben ihn ein.</p>
      <div class="forum-code">${esc(code)}</div>
      <div class="row"><button class="btn" data-copy>${icon('copy')} Code kopieren</button><button class="btn btn-primary" data-on>Weiter zur Gruppe</button></div>`;
    ui.root.querySelector('[data-copy]').onclick = () => copy(code);
    ui.root.querySelector('[data-on]').onclick = () => showList();
  };

  // ---------- Liste ----------
  const row = (p) => `<button class="forum-item ${F.isNew(p, st.seen, D.uid()) ? 'is-new' : ''}" data-open="${esc(p.id)}">
      <span class="forum-item-head"><span class="forum-kind k-${esc(p.kind)}">${KIND[p.kind] || ''}</span> ${meta(p)}${p.hasImage ? ' · 📷' : ''}${p.refs && p.refs.length ? ' · 🔗' : ''}
        <span class="grow"></span>${p.replyCount ? `<span class="badge">${p.replyCount} ${p.replyCount === 1 ? 'Antwort' : 'Antworten'}</span>` : ''}</span>
      <span class="forum-item-text">${esc(p.text)}</span></button>`;
  const showList = () => {
    if (ui.cleanup) ui.cleanup();
    ui.view = 'list';
    ui.cleanup = null;
    const r = ui.root;
    r.innerHTML = '<h3 class="forum-h">Neuer Gedanke</h3><div data-new></div><div data-list class="forum-list"></div>';
    r.querySelector('[data-new]').appendChild(composer({
      key: 'new', kinds: true, label: 'Teilen', placeholder: 'Was ist dir aufgefallen?',
      onSubmit: (v) => D.addPost(st.code, Object.assign({ name: st.name }, v)),
    }));
    App.hydrateIcons(r);
    const list = r.querySelector('[data-list]');
    ui.onPosts = () => {
      if (status === 'offline') { list.innerHTML = offlineNote(); return; }
      if (status !== 'live') { list.innerHTML = '<p class="muted">Lade Beiträge …</p>'; return; }
      if (!posts.length) { list.innerHTML = '<p class="muted forum-empty">Noch keine Gedanken. Teil den ersten!</p>'; return; }
      const s = F.sections(posts, Date.now());
      const wasOpen = list.querySelector('details[open]');
      list.innerHTML = s.open.map(row).join('') + s.show.map(row).join('')
        + (s.done.length ? `<details class="forum-done"${wasOpen ? ' open' : ''}><summary>Besprochen (${s.done.length})</summary>${s.done.map(row).join('')}</details>` : '');
    };
    list.onclick = (e) => { const b = e.target.closest('[data-open]'); if (b) showPost(b.dataset.open); };
    ui.onPosts();
  };

  // ---------- Ein Beitrag mit Antworten ----------
  const showPost = (id) => {
    if (ui.cleanup) ui.cleanup();
    ui.view = 'post';
    const r = ui.root;
    r.innerHTML = `<button class="btn btn-sm" data-back>${icon('back')} Zurück zur Liste</button>
      <div data-head class="forum-post"></div><div data-replies class="forum-replies"></div>
      <h3 class="forum-h">Antworten</h3><div data-answer></div>`;
    r.querySelector('[data-back]').onclick = () => showList();
    const head = r.querySelector('[data-head]');
    const repEl = r.querySelector('[data-replies]');
    let editing = null; // null · 'post' · Antwort-id
    let replies = [];
    const me = () => D.uid();
    const own = (x) => x.uid === me();
    const tools = (x, what) => (own(x) ? `<span class="forum-tools"><button class="btn btn-sm" data-edit="${what}">${icon('edit')} Bearbeiten</button><button class="btn btn-sm" data-del="${what}">${icon('trash')} Löschen</button></span>` : '');

    // Bild des Beitrags: eigenes Dokument, erst hier geladen (neu, wenn der Beitrag bearbeitet wurde)
    const pics = {};
    let picVersion;
    const loadPic = (p) => {
      if (!p.hasImage || picVersion === p.editedAt) return;
      picVersion = p.editedAt;
      D.getImage(st.code, id).then((src) => { pics[id] = src; drawHead(); }, () => {});
    };
    const drawHead = () => {
      if (editing === 'post') return;
      const p = posts.find((x) => x.id === id);
      if (!p) { if (status === 'live') showList(); return; }
      loadPic(p);
      const done = p.kind === 'rede'
        ? `<div class="forum-row">${p.done ? `<span class="badge">Besprochen · von ${esc(p.doneBy)}${p.doneAt ? ', ' + dayMonth(p.doneAt) : ''}</span>` : ''}
            <button class="btn btn-sm" data-done>${p.done ? 'Wieder öffnen' : `${icon('check')} Als besprochen markieren`}</button></div>` : '';
      head.innerHTML = `<div class="forum-item-head"><span class="forum-kind k-${esc(p.kind)}">${KIND[p.kind] || ''}</span> ${meta(p)}</div>
        <div class="forum-text">${F.linkify(p.text)}</div>${p.hasImage ? (id in pics ? imgHtml(pics[id], 'forum-img') : '<p class="muted small">Bild wird geladen …</p>') : ''}${refsHtml(p.refs, 'post')}${done}${tools(p, 'post')}`;
    };
    const drawReplies = () => {
      repEl.innerHTML = replies.map((x) => (editing === x.id ? `<div class="forum-reply" data-rid="${esc(x.id)}" data-editing></div>`
        : `<div class="forum-reply" data-rid="${esc(x.id)}"><div class="forum-item-head">${meta(x)}</div>
          <div class="forum-text">${F.linkify(x.text)}</div>${imgHtml(x.image, 'forum-img')}${refsHtml(x.refs, x.id)}${tools(x, x.id)}</div>`)).join('');
      const slot = repEl.querySelector('[data-editing]');
      if (slot) {
        const x = replies.find((y) => y.id === editing);
        slot.appendChild(composer({
          label: 'Speichern', placeholder: '', init: x,
          onSubmit: async (v) => { await D.editReply(st.code, id, x.id, v); editing = null; drawReplies(); },
          onCancel: () => { editing = null; drawReplies(); },
        }));
      }
    };
    r.querySelector('[data-answer]').appendChild(composer({
      key: 'r:' + id, label: 'Antworten', placeholder: 'Deine Antwort …',
      onSubmit: (v) => D.addReply(st.code, id, { name: st.name, text: v.text, image: v.image, refs: v.refs }),
    }));
    App.hydrateIcons(r);

    r.onclick = async (e) => {
      // verknüpfter Eintrag: „post:2“ bzw. „<antwort-id>:0“
      const refAt = (v) => { const [o, i] = v.split(':'); const x = o === 'post' ? posts.find((y) => y.id === id) : replies.find((y) => y.id === o); return x ? F.cleanRefs(x.refs)[Number(i)] : null; };
      const ro = e.target.closest('[data-ref]');
      if (ro) { const ref = refAt(ro.dataset.ref); if (ref) openRef(ref); return; }
      const tk = e.target.closest('[data-take]');
      if (tk) { const ref = refAt(tk.dataset.take); if (ref) takeRef(ref, () => { drawHead(); drawReplies(); App.hydrateIcons(r); }); return; }
      const img = e.target.closest('.forum-img');
      if (img) { showBig(img.getAttribute('src')); return; }
      const p = posts.find((x) => x.id === id);
      if (e.target.closest('[data-done]') && p) {
        try { await D.setDone(st.code, id, !p.done, st.name); } catch (x) { App.toast(OFFLINE); }
        return;
      }
      const ed = e.target.closest('[data-edit]');
      if (ed) {
        if (ed.dataset.edit === 'post') {
          // Bild noch nicht da: beim Speichern ginge es sonst verloren
          if (p && p.hasImage && !(id in pics)) { App.toast('Das Bild lädt noch – gleich nochmal versuchen'); return; }
          editing = 'post';
          head.innerHTML = '';
          head.appendChild(composer({
            kinds: true, label: 'Speichern', placeholder: '', init: Object.assign({}, p, { image: pics[id] || null }),
            onSubmit: async (v) => { await D.editPost(st.code, id, v); pics[id] = v.image || null; editing = null; drawHead(); },
            onCancel: () => { editing = null; drawHead(); },
          }));
          App.hydrateIcons(head);
        } else { editing = ed.dataset.edit; drawReplies(); App.hydrateIcons(repEl); }
        return;
      }
      const del = e.target.closest('[data-del]');
      if (del) {
        const isPost = del.dataset.del === 'post';
        if (!(await App.confirm(isPost ? 'Diesen Beitrag und alle Antworten löschen?' : 'Diese Antwort löschen?'))) return;
        try {
          if (isPost) { await D.deletePost(st.code, id); saveDraft('r:' + id, ''); showList(); } else await D.deleteReply(st.code, id, del.dataset.del);
        } catch (x) { App.toast(OFFLINE); }
      }
    };

    ui.onPosts = () => { drawHead(); markSeen(id); };
    let unsubR = null;
    if (status === 'live') {
      unsubR = D.watchReplies(st.code, id, (list) => { replies = list; if (!editing || editing === 'post') drawReplies(); markSeen(id); }, () => {});
    }
    ui.cleanup = () => { if (unsubR) unsubR(); r.onclick = null; };
    drawHead();
    markSeen(id);
  };

  App.forum = { open, state: () => st };

  // Im Hintergrund verbinden, damit der rote Punkt auch ohne Öffnen erscheint – nie, wenn das Gerät in keiner Gruppe ist
  if (typeof document !== 'undefined') window.addEventListener('load', () => { if (st.code && D.configured()) setTimeout(start, 3000); });
})(window.App = window.App || {});
