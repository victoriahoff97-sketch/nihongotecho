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
  const blank = () => ({ code: '', name: '', avatar: '', seen: {}, drafts: {}, fresh: false });
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
  let members = {}; // uid → { name, avatar }
  let unsubM = null;
  const stop = () => { gen++; if (unsub) unsub(); if (unsubM) unsubM(); unsub = unsubM = null; posts = []; members = {}; status = 'idle'; };
  const start = () => {
    if (!D.configured() || !st.code || unsub || status === 'loading') return;
    status = 'loading';
    const g = gen;
    const mine = (fn) => (...a) => { if (g === gen) fn(...a); };
    D.load().then(mine(() => {
      unsub = D.watchPosts(st.code, mine(onPosts), mine(onError));
      if (!unsubM) unsubM = D.watchMembers(st.code, mine((m) => { members = m; keepAvatar(); if (ui && ui.onMembers) ui.onMembers(); }));
    })).catch(mine(onError));
  };
  // eigenen Avatar auch auf dem Gerät merken: geht die Anmeldung verloren, nimmt das Wiederbeitreten ihn mit
  const keepAvatar = () => {
    const a = (members[D.uid()] && members[D.uid()].avatar) || '';
    if (a && a !== st.avatar) { st.avatar = a; save(); }
  };
  // Firebase kann die anonyme Anmeldung vergessen (Browserdaten aufgeräumt …): mit neuer ID ist das Gerät dann kein
  // Mitglied mehr. Code und Name liegen noch hier – also einmal still wieder beitreten, statt die Gruppe zu vergessen.
  let rejoining = false;
  const rejoin = () => {
    rejoining = true;
    status = 'loading';
    const g = ++gen;
    D.load().then(() => D.joinGroup(st.code, st.name, st.avatar)).then(() => {
      if (g !== gen) return;
      stop();
      start();
    }).catch((e) => {
      if (g !== gen) return;
      if (e && e.code === 'no-group') return forget();
      rejoining = false;
      status = 'offline';
      refreshDot();
      if (ui) ui.onPosts();
    });
  };
  const forget = () => { rejoining = false; stop(); st = Object.assign(blank(), { name: st.name, drafts: st.drafts }); save(); refreshDot(); if (ui) showJoin(); };
  const onPosts = (list, meta = {}) => {
    posts = list;
    if (!meta.fromCache) rejoining = false;
    // offline gestartet: noch nie Antwort vom Server – nicht „Noch keine Gedanken“ zeigen
    status = meta.fromCache && !list.length ? 'offline' : 'live';
    // gerade beigetreten: was schon da war, gilt als gesehen
    if (st.fresh && status === 'live') { st.seen = Object.assign(Object.fromEntries(list.map((p) => [p.id, F.seenAt(p, Date.now())])), st.seen); st.fresh = false; save(); }
    refreshDot();
    if (ui) ui.onPosts();
  };
  const onError = (e) => {
    unsub = null;
    // kein Mitglied mehr: erst still wieder beitreten; klappt auch das nicht (Gruppe weg), zurück zum Beitreten
    if (e && e.code === 'permission-denied') { if (!rejoining && st.code && !F.checkName(st.name)) rejoin(); else forget(); return; }
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
  const kanjiCopy = (it) => (it.type === 'kanji'
    ? { on: [].concat(it.on || []).join('、'), kun: [].concat(it.kun || []).map(App.kanjiLogic.kunText).join('、') } : undefined);
  const toRef = (it) => F.makeRef(it, { label: App.itemPlain(it), sub: App.itemSub(it), kanji: kanjiCopy(it) });
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
  const resolve = (ref) => F.resolveRef(ref, { byId: App.item, byWord, byChar: App.kanjiByChar });
  // Kanji stehen rechts neben dem Text (withKanji), alles andere darunter; i bleibt der Platz in refs
  const refsHtml = (refs, owner) => {
    const list = F.cleanRefs(refs).map((r, i) => [r, i]).filter(([r]) => r.type !== 'kanji');
    if (!list.length) return '';
    return `<div class="forum-refs">${list.map(([r, i]) => {
      const sec = App.SECTIONS[r.type];
      const take = resolve(r).kind === 'take';
      // Vokabeln bringen ihre Kopie mit (Wort, Lesung, Deutsch, oberster Beispielsatz) – so sehen alle sie, auch ohne Paket
      const v = r.vocab;
      const reading = v && v.kana && v.kana !== r.label ? `<span class="forum-ref-kana" lang="ja">${esc(v.kana)}</span>` : '';
      const ex = v && v.examples && v.examples[0] && v.examples[0].jp ? v.examples[0] : null;
      const exHtml = ex ? `<span class="forum-ref-ex"><span lang="ja">${App.jp.ruby(ex.jp)}</span>${ex.de ? `<span class="muted">${esc(ex.de)}</span>` : ''}</span>` : '';
      return `<span class="forum-ref ${sec.cls}"><button type="button" class="forum-ref-open ${exHtml ? 'has-ex' : ''}" data-ref="${esc(owner)}:${i}" title="${take ? 'Hast du noch nicht – danach suchen' : 'Öffnen'}">
          <span class="badge sec">${sec.label}</span><b lang="ja">${esc(r.label)}</b>${reading}${r.sub ? `<span class="muted">${esc(r.sub)}</span>` : ''}${exHtml}</button>
          ${take ? `<button type="button" class="btn btn-sm" data-take="${esc(owner)}:${i}">${icon('plus')} Als Vokabel übernehmen</button>` : ''}</span>`;
    }).join('')}</div>`;
  };
  const kanjiHtml = (refs, owner) => {
    const list = F.cleanRefs(refs).map((r, i) => [r, i]).filter(([r]) => r.type === 'kanji');
    if (!list.length) return '';
    return `<aside class="forum-kanji">${list.map(([r, i]) => {
      const k = r.kanji || {};
      const take = resolve(r).kind === 'take';
      const read = [k.on, k.kun].filter(Boolean).join(' · ');
      return `<div class="forum-kj ${App.SECTIONS.kanji.cls}"><button type="button" class="forum-kj-open" data-ref="${esc(owner)}:${i}" title="${take ? 'Hast du noch nicht' : 'Öffnen'}">
          <b lang="ja">${esc(k.char || r.label)}</b><span>${esc(k.de || r.sub)}</span>${read ? `<span class="forum-kj-read" lang="ja">${esc(read)}</span>` : ''}</button>
          ${take ? `<button type="button" class="btn btn-sm" data-take="${esc(owner)}:${i}">${icon('plus')} Als Kanji übernehmen</button>` : ''}</div>`;
    }).join('')}</aside>`;
  };
  const withKanji = (main, refs, owner) => {
    const k = kanjiHtml(refs, owner);
    return k ? `<div class="forum-split"><div class="forum-split-main">${main}</div>${k}</div>` : main;
  };
  // Verweis antippen: öffnen (Fenster zu), eigene Vokabel öffnen oder danach suchen
  const openRef = (ref) => {
    const r = resolve(ref);
    const to = r.kind === 'open' ? App.link(App.item(r.id)) : '#/suche?' + new URLSearchParams({ q: ref.label });
    if (ui) ui.md.close();
    App.go(to);
  };
  const takeRef = (ref, after) => {
    if (ref.type === 'kanji') {
      // Lesungen, Strichzahl und Wörter füllt das Kanji-Formular selbst aus dem Kanji-Index
      const k = ref.kanji || {};
      App.editItem({
        type: 'kanji', title: 'Kanji übernehmen', single: true,
        defaults: { char: k.char || ref.label, de: k.de || ref.sub, source: 'Eigene', tags: [] },
        onSaved: () => { App.toast(`„${k.char || ref.label}“ ist jetzt in deinen Kanji`); if (after) after(); },
      });
      return;
    }
    const v = ref.vocab || {};
    App.editItem({
      type: 'vocab', title: 'Vokabel übernehmen',
      defaults: { kana: v.kana, kanji: v.kanji, de: v.de, pos: v.pos, examples: v.examples || [], source: 'Eigene', tags: [] },
      onSaved: () => { App.toast(`„${ref.label}“ ist jetzt in deinen Vokabeln`); if (after) after(); },
    });
  };

  // Diktieren (js/dictate.js): Sprache pro Gerät gemerkt
  const DLANGS = [['de-DE', 'DE'], ['ja-JP', '日本語']];
  const dictLang = () => (App.lsGet('forumDictLang') === 'ja-JP' ? 'ja-JP' : 'de-DE');

  // ---------- Eingabefeld (neuer Gedanke, Antwort, Bearbeiten) ----------
  // key = Entwurf auf diesem Gerät ('new' bzw. 'r:<postId>'); beim Bearbeiten kein Entwurf
  // closed: erst nur eine Zeile, klappt beim Hineintippen auf (und nach dem Teilen wieder zu)
  const composer = ({ key, kinds, closed, label, placeholder, init = {}, onSubmit, onCancel }) => {
    const el = document.createElement('div');
    el.className = 'forum-compose';
    el.innerHTML = `<textarea class="input" maxlength="${F.MAX_TEXT}" placeholder="${esc(placeholder)}"></textarea>
      <div class="forum-img-prev" hidden></div>
      <div class="forum-chosen"></div>
      <div class="forum-row">
        ${kinds ? `<div class="forum-kinds">${Object.keys(KIND).map((k) => `<button type="button" class="chip" data-kind="${k}">${KIND[k]}</button>`).join('')}</div>` : ''}
        <label class="btn btn-sm forum-pick">${icon('imagePlus')}<span>Bild</span><input type="file" accept="image/*" hidden></label>
        ${navigator.clipboard && navigator.clipboard.read ? `<button type="button" class="btn btn-sm" data-clip title="Screenshot oder Bild aus der Zwischenablage einfügen (am PC auch Strg+V)">${icon('copy')}<span>Einfügen</span></button>` : ''}
        <button type="button" class="btn btn-sm" data-link>${icon('link')}<span>Eintrag</span></button>
        ${App.dictate.supported() ? `<span class="forum-dict"><button type="button" class="btn btn-sm mic" data-mic title="Sprechen – der Text erscheint im Feld. Bleibt an, bis du auf „Fertig“ tippst.">${icon('mic')}<span class="mic-label">Diktieren</span></button>
          <span class="seg forum-dlang" title="In welcher Sprache diktierst du?">${DLANGS.map(([l, t]) => `<button type="button" data-dlang="${l}">${t}</button>`).join('')}</span></span>` : ''}
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
    const setClosed = (on) => el.classList.toggle('is-closed', !!closed && on);
    setClosed(!ta.value);
    ['focus', 'pointerdown', 'input'].forEach((ev) => ta.addEventListener(ev, () => setClosed(false)));
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
    const showLang = () => { const l = dictLang(); $$('[data-dlang]', el).forEach((b) => b.classList.toggle('on', b.dataset.dlang === l)); };
    if (kinds) setKind(kind);
    showLang();
    setImage(image);
    drawRefs();
    const keep = key ? App.debounce(() => saveDraft(key, ta.value), 400) : () => {};
    ta.addEventListener('input', () => { setErr(''); keep(); });
    ta.addEventListener('change', keep); // Diktiertes kommt als change

    el.addEventListener('click', (e) => {
      const k = e.target.closest('[data-kind]');
      if (k) setKind(k.dataset.kind);
      if (e.target.closest('[data-noimg]')) setImage(null);
      if (e.target.closest('[data-cancel]')) { App.dictate.stopFor(ta, { now: true }); onCancel(); }
      if (e.target.closest('[data-link]')) pick();
      const mic = e.target.closest('[data-mic]');
      if (mic) { setErr(''); App.dictate.toggle(ta, mic, dictLang(), { long: true }); }
      const dl = e.target.closest('[data-dlang]');
      if (dl) { App.dictate.stopFor(ta); App.lsSet('forumDictLang', dl.dataset.dlang); showLang(); }
      const un = e.target.closest('[data-unref]');
      if (un) { refs.splice(Number(un.dataset.unref), 1); drawRefs(); }
      if (e.target.closest('[data-here]')) { const it = pageItem(); if (it) { refs.push(toRef(it)); setErr(''); drawRefs(); } }
    });
    const takeImage = async (file) => {
      setErr('');
      setClosed(false);
      try { setImage(await shrinkImage(file)); } catch (x) { setErr('Dieses Bild ist zu groß. Probier einen Ausschnitt.'); }
    };
    el.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (file) takeImage(file);
    });
    // Screenshot aus der Zwischenablage: Strg+V im Textfeld oder der Knopf „Einfügen“ (fragt beim ersten Mal nach Erlaubnis)
    ta.addEventListener('paste', (e) => {
      const it = Array.from((e.clipboardData && e.clipboardData.items) || []).find((x) => x.type.startsWith('image/'));
      if (!it) return;
      e.preventDefault();
      takeImage(it.getAsFile());
    });
    const clip = el.querySelector('[data-clip]');
    if (clip) clip.addEventListener('click', async () => {
      try {
        for (const it of await navigator.clipboard.read()) {
          const t = it.types.find((x) => x.startsWith('image/'));
          if (t) { takeImage(await it.getType(t)); return; }
        }
        setErr('In der Zwischenablage ist gerade kein Bild.');
      } catch (x) { setErr('Die Zwischenablage ließ sich nicht lesen – erlaub den Zugriff oder nimm „Bild“.'); }
    });
    el.querySelector('[data-send]').addEventListener('click', async () => {
      if (busy) return;
      if (navigator.onLine === false) { setErr(OFFLINE); return; }
      App.dictate.stopFor(ta, { now: true });
      const text = ta.value.trim();
      const msg = F.checkPost({ text, image, refs });
      if (msg) { setErr(msg); return; }
      busy = true;
      try {
        await onSubmit({ kind, text, image, refs });
        if (key) { saveDraft(key, ''); ta.value = ''; setImage(null); refs = []; drawRefs(); ta.blur(); setClosed(true); }
      } catch (x) {
        setErr(OFFLINE);
      } finally { busy = false; }
    });
    return el;
  };

  // ---------- Fenster ----------
  // Avatar aus dem Mitglied-Eintrag; ohne (oder ausgetreten): Anfangsbuchstabe im grauen Kreis
  const avatarHtml = (a, name, cls = '') => {
    if (a && a.t === 'e') return `<span class="forum-av av-${a.c} ${cls}" aria-hidden="true">${a.v}</span>`;
    if (a && a.t === 'k') return `<span class="forum-av av-hanko ${cls}" lang="ja" aria-hidden="true">${esc(a.v)}</span>`;
    return `<span class="forum-av ${cls}" aria-hidden="true">${esc(Array.from(String(name || '?').trim())[0] || '?')}</span>`;
  };
  const avatarOf = (x) => avatarHtml(F.parseAvatar(members[x.uid] && members[x.uid].avatar), x.name);
  const meta = (p) => `${avatarOf(p)}<b>${esc(p.name)}</b> ·${p.createdAt ? esc(F.relTime(p.createdAt, Date.now())) : 'gerade eben'}${p.editedAt ? ' (bearbeitet)' : ''}`;
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
      onClose: () => { $$('textarea', md.el).forEach((t) => App.dictate.stopFor(t, { now: true })); if (ui && ui.cleanup) ui.cleanup(); ui = null; },
    });
    const more = document.createElement('div');
    more.className = 'forum-more';
    more.innerHTML = `<button class="icon-btn" data-more title="Mehr" aria-label="Mehr">${icon('more')}</button>`;
    md.el.querySelector('.modal-head [data-x]').before(more);
    ui = { md, root: md.body.querySelector('.forum') };
    more.querySelector('[data-more]').onclick = (e) => { e.stopPropagation(); toggleMenu(more); };
    if (!st.code) showJoin();
    else { if (status !== 'live' && !rejoining) { stop(); start(); } showList(); }
  };

  // ---------- ⋯-Menü ----------
  const toggleMenu = (host) => {
    const old = host.querySelector('.more-pop');
    if (old) { old.remove(); return; }
    const pop = document.createElement('div');
    pop.className = 'more-pop card';
    const item = (k, ic, label, cls = '') => `<button class="more-item ${cls}" data-m="${k}">${icon(ic)}<span>${label}</span></button>`;
    pop.innerHTML = st.code
      ? item('code', 'link', 'Gruppencode anzeigen') + item('name', 'edit', 'Meinen Namen ändern') + item('avatar', 'sparkle', 'Mein Avatar') + item('help', 'help', 'Hilfe')
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
      if (m === 'avatar') pickAvatar();
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
  // Kawaii-Motiv im Pastellkreis oder ein eigenes Kanji als Hanko-Stempel
  const COLOR_NAMES = { sakura: 'Kirschblüte', matcha: 'Matcha', sora: 'Himmel', yuzu: 'Yuzu', fuji: 'Glyzinie', kumo: 'Wolke' };
  const pickAvatar = () => {
    const cur = F.parseAvatar(members[D.uid()] && members[D.uid()].avatar);
    let a = cur || { t: 'e', v: F.AVATAR_MOTIFS[0], c: F.AVATAR_COLORS[0] };
    let lastColor = a.c || F.AVATAR_COLORS[0];
    const md = App.modal({
      title: 'Mein Avatar', cls: 'forum-av-modal',
      foot: '<button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-ok>Speichern</button>',
      body: `<div class="forum-av-preview" data-prev></div>
        <h3 class="forum-h">Motiv</h3>
        <div class="forum-av-grid">${F.AVATAR_MOTIFS.map((m) => `<button type="button" class="forum-av-pick" data-motif="${m}" aria-label="Motiv ${m}">${m}</button>`).join('')}</div>
        <div class="forum-av-colors">${F.AVATAR_COLORS.map((c) => `<button type="button" class="forum-av av-${c}" data-color="${c}" title="${COLOR_NAMES[c]}" aria-label="Farbe ${COLOR_NAMES[c]}"></button>`).join('')}</div>
        <h3 class="forum-h">Oder ein Kanji als Stempel</h3>
        <div class="forum-row"><input class="input forum-av-kanji" data-kanji maxlength="2" lang="ja" placeholder="桜" value="${a.t === 'k' ? esc(a.v) : ''}"><span class="muted small">ein Kanji, z. B. aus deinem Namen</span></div>`,
    });
    md.el.querySelector('[data-no]').onclick = () => md.close();
    md.el.querySelector('[data-ok]').onclick = async () => {
      try { await D.setAvatar(st.code, F.makeAvatar(a)); st.avatar = F.makeAvatar(a); save(); App.toast('Avatar gespeichert'); md.close(); }
      catch (e) { App.toast(e && e.code === 'permission-denied' ? 'Avatare gehen erst nach dem nächsten Gruppen-Update.' : OFFLINE); }
    };
    const root = md.body;
    const draw = () => {
      root.querySelector('[data-prev]').innerHTML = avatarHtml(a, st.name, 'is-big') + `<b>${esc(st.name)}</b>`;
      root.querySelectorAll('[data-motif]').forEach((b) => b.classList.toggle('on', a.t === 'e' && b.dataset.motif === a.v));
      root.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('on', a.t === 'e' && b.dataset.color === a.c));
    };
    root.onclick = (e) => {
      const m = e.target.closest('[data-motif]');
      const c = e.target.closest('[data-color]');
      if (m) a = { t: 'e', v: m.dataset.motif, c: lastColor };
      else if (c) { lastColor = c.dataset.color; a = { t: 'e', v: a.t === 'e' ? a.v : F.AVATAR_MOTIFS[0], c: lastColor }; }
      else return;
      root.querySelector('[data-kanji]').value = '';
      draw();
    };
    root.querySelector('[data-kanji]').oninput = (e) => {
      const k = F.parseAvatar('k:' + Array.from(e.target.value.trim()).pop());
      if (k) { a = k; draw(); }
    };
    draw();
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
    ui.onMembers = null;
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
  // Kästchen wie im Tagebuch: links groß der Tag, rechts Kopf, bis zu drei Zeilen Text, unten Verknüpfungen und Antworten
  const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const dateCol = (ms) => { const d = new Date(ms || Date.now()); return `<span class="forum-date"><span class="forum-day">${d.getDate()}</span><span class="forum-wd">${WEEKDAY[d.getDay()]}</span></span>`; };
  const refChips = (refs) => F.cleanRefs(refs).map((r) => `<span class="badge sec ${App.SECTIONS[r.type].cls}" lang="ja">${esc(r.label)}</span>`).join('');
  const row = (p) => {
    const fresh = F.isNew(p, st.seen, D.uid());
    const replies = p.replyCount ? `<span class="badge">${icon('chat')} ${p.replyCount} ${p.replyCount === 1 ? 'Antwort' : 'Antworten'}</span>` : '';
    const foot = refChips(p.refs) + replies;
    return `<button class="forum-item ${fresh ? 'is-new' : ''}" data-open="${esc(p.id)}">${dateCol(p.createdAt)}
      <span class="forum-item-body">
        <span class="forum-item-head"><span class="forum-kind k-${esc(p.kind)}">${KIND[p.kind] || ''}</span> ${meta(p)}${p.hasImage ? ` ${icon('image')}` : ''}
          <span class="grow"></span>${fresh ? '<span class="badge forum-new">neu</span>' : ''}${p.done ? '<span class="badge">besprochen</span>' : ''}</span>
        <span class="forum-item-text">${esc(p.text)}</span>
        ${foot ? `<span class="forum-item-foot">${foot}</span>` : ''}
      </span></button>`;
  };
  // Auswahl über der Liste – bleibt gewählt, solange das Fenster offen ist
  const TABS = [['offen', 'Alle offenen'], ['rede', '💬 Redebedarf'], ['zeigen', '💡 Zum Zeigen'], ['done', 'Besprochen']];
  const EMPTY = { offen: 'Gerade ist nichts offen.', rede: 'Gerade kein offener Redebedarf.', zeigen: 'Noch nichts zum Zeigen.', done: 'Noch nichts besprochen.' };
  const showList = () => {
    if (ui.cleanup) ui.cleanup();
    ui.view = 'list';
    ui.cleanup = null;
    ui.tab = ui.tab || 'offen';
    const r = ui.root;
    ui.q = ui.q || '';
    r.innerHTML = `<div data-new></div><div class="forum-bar" data-tabs><b>Eure Themen</b>
      <input class="input forum-search" type="search" placeholder="Suchen …" aria-label="Im Forum suchen" value="${esc(ui.q)}"><select class="input" aria-label="Welche Themen"></select></div><div data-list class="forum-list"></div>`;
    r.querySelector('[data-new]').appendChild(composer({
      // von einem Eintrag aus geöffnet: gleich aufgeklappt, damit „Diesen Eintrag anhängen“ zu sehen ist
      key: 'new', kinds: true, closed: !pageItem(), label: 'Teilen', placeholder: 'Neuer Gedanke … was ist dir aufgefallen?',
      onSubmit: (v) => D.addPost(st.code, Object.assign({ name: st.name }, v)),
    }));
    App.hydrateIcons(r);
    const tabs = r.querySelector('[data-tabs]');
    const pick = tabs.querySelector('select');
    const list = r.querySelector('[data-list]');
    ui.onPosts = () => {
      const live = status === 'live' && posts.length;
      const s = live ? F.sections(posts, Date.now()) : null;
      const by = s ? { offen: s.open.concat(s.show), rede: s.open, zeigen: s.show, done: s.done } : null;
      tabs.hidden = !live;
      pick.innerHTML = live ? TABS.map(([k, l]) => `<option value="${k}"${ui.tab === k ? ' selected' : ''}>${l} (${by[k].length})</option>`).join('') : '';
      if (status === 'offline') { list.innerHTML = offlineNote(); return; }
      if (status !== 'live') { list.innerHTML = '<p class="muted">Lade Beiträge …</p>'; return; }
      if (!posts.length) { list.innerHTML = '<p class="muted forum-empty">Noch keine Gedanken. Teil den ersten!</p>'; return; }
      // Suche: über alle Themen, auch besprochene
      const q = ui.q.trim();
      const shown = q ? s.open.concat(s.show, s.done).filter((p) => F.matchPost(p, q)) : by[ui.tab];
      pick.disabled = !!q;
      list.innerHTML = shown.length ? shown.map(row).join('')
        : `<p class="muted forum-empty">${q ? `Nichts gefunden zu „${esc(q)}“.` : EMPTY[ui.tab]}</p>`;
      App.hydrateIcons(list);
    };
    ui.onMembers = ui.onPosts;
    pick.onchange = () => { ui.tab = pick.value; ui.onPosts(); };
    const search = tabs.querySelector('.forum-search');
    search.oninput = App.debounce(() => { ui.q = search.value; ui.onPosts(); }, 150);
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
      <h3 class="forum-h">Deine Antwort</h3><div data-answer class="forum-answer"></div>`;
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
      head.innerHTML = `<div class="forum-post-top">${dateCol(p.createdAt)}<div class="forum-item-head"><span class="forum-kind k-${esc(p.kind)}">${KIND[p.kind] || ''}</span> ${meta(p)}</div></div>
        ${withKanji(`<div class="forum-text">${F.linkify(p.text)}</div>${p.hasImage ? (id in pics ? imgHtml(pics[id], 'forum-img') : '<p class="muted small">Bild wird geladen …</p>') : ''}${refsHtml(p.refs, 'post')}${done}${tools(p, 'post')}`, p.refs, 'post')}`;
    };
    const drawReplies = () => {
      repEl.innerHTML = replies.map((x) => (editing === x.id ? `<div class="forum-reply" data-rid="${esc(x.id)}" data-editing></div>`
        : `<div class="forum-reply" data-rid="${esc(x.id)}"><div class="forum-item-head">${meta(x)}</div>
          ${withKanji(`<div class="forum-text">${F.linkify(x.text)}</div>${imgHtml(x.image, 'forum-img')}${refsHtml(x.refs, x.id)}${tools(x, x.id)}`, x.refs, x.id)}</div>`)).join('');
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
    ui.onMembers = () => { drawHead(); if (!editing || editing === 'post') drawReplies(); };
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
