/* Nihongo Techō – Ansichten: Kanji & Kana, Bibliothek, Einstellungen */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;

  // =========================================================
  // Kanji
  // =========================================================
  const KANA_ROWS = [
    ['あいうえお', 'a i u e o'], ['かきくけこ', 'ka ki ku ke ko'], ['さしすせそ', 'sa shi su se so'], ['たちつてと', 'ta chi tsu te to'],
    ['なにぬねの', 'na ni nu ne no'], ['はひふへほ', 'ha hi fu he ho'], ['まみむめも', 'ma mi mu me mo'], ['や・ゆ・よ', 'ya - yu - yo'],
    ['らりるれろ', 'ra ri ru re ro'], ['わ・・・を', 'wa - - - wo'], ['ん・・・・', 'n - - - -'],
    ['がぎぐげご', 'ga gi gu ge go'], ['ざじずぜぞ', 'za ji zu ze zo'], ['だぢづでど', 'da ji zu de do'], ['ばびぶべぼ', 'ba bi bu be bo'], ['ぱぴぷぺぽ', 'pa pi pu pe po'],
  ];
  const kanaChart = (kata) => {
    let html = '';
    KANA_ROWS.forEach(([row, rom], ri) => {
      const rs = rom.split(' ');
      if (ri === 11) html += '</div><div class="section-title">Mit Dakuten ゛ und Handakuten ゜</div><div class="kana-grid">';
      Array.from(row).forEach((c, i) => {
        if (c === '・') { html += '<span class="kanji-tile empty"></span>'; return; }
        const ch = kata ? JP.toKata(c) : c;
        html += `<button class="kanji-tile" data-kana="${ch}" data-rom="${rs[i]}"><span class="c">${ch}</span><span class="m">${rs[i]}</span></button>`;
      });
    });
    return `<div class="kana-grid">${html}</div>`;
  };
  const openKana = (ch, rom) => {
    const body = document.createElement('div');
    body.innerHTML = `<div class="kanji-stage"><div><div data-anim></div><div style="text-align:center;margin-top:8px"><b style="font-size:22px">${esc(rom)}</b> ${App.speakBtn(ch)}</div></div><div data-pad></div></div>`;
    App.modal({ title: `<span style="font-family:var(--font-kanji);font-size:26px">${esc(ch)}</span> schreiben üben`, body, wide: true, foot: false });
    App.stroke.animator(body.querySelector('[data-anim]'), ch);
    App.stroke.pad(body.querySelector('[data-pad]'), ch);
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-kana]'); if (b) openKana(b.dataset.kana, b.dataset.rom); });

  App.route('/kanji', (view, p, q) => {
    const sec = App.SECTIONS.kanji;
    const all = App.itemsOf('kanji');
    let items = all;
    if (q.src) items = items.filter((i) => i.source === q.src);
    if (q.l) items = items.filter((i) => String(i.lesson) === q.l);
    if (q.f) { const ids = new Set(App.search(q.f, { types: ['kanji'], limit: 5000 }).map((x) => x.id)); items = items.filter((i) => ids.has(i.id)); }
    if (q.st) items = items.filter((i) => App.vocabStatus(i.id) === q.st);
    if (q.mark) items = items.filter((i) => App.hasMark(i, q.mark));
    if (q.lvl) items = items.filter((i) => App.levelMatch(i, q.lvl));
    items.sort((a, b) => (+a.lesson || 99) - (+b.lesson || 99) || App.ord(a) - App.ord(b));
    const tab = q.tab || 'kanji';
    const files = App.filesFor({ section: 'kanji', source: q.src || undefined });
    const kc = App.vocabCounts(all.filter((k) => k.char !== '々'));
    const einQs = new URLSearchParams(Object.fromEntries(Object.entries({ type: 'kanji', src: q.src, l: q.l, mark: q.mark, lvl: q.lvl }).filter(([, v]) => v))).toString();
    view.innerHTML = `<div class="${sec.cls}">${App.pageHead(sec, 'Bedeutung, Lesungen, Strichfolge als Animation und ein Schreibfeld für deinen Stift.',
      `<a class="btn" href="#/ueben/einstufen?${einQs}">${icon('check')} Einstufen${kc.unchecked ? ` <span class="badge">${kc.unchecked}</span>` : ''}</a><a class="btn" href="#/ueben/karten?type=kanji">${icon('practice')} Karteikarten</a><a class="btn" href="#/ueben/kanji">${icon('practice')} Kanji-Quiz</a><button class="btn btn-sec" data-new="kanji">${icon('plus')} Kanji</button>`)}
      <div class="tabs">${[['kanji', `Kanji <span class="badge">${items.length}</span>`], ['hira', 'Hiragana'], ['kata', 'Katakana'], ['files', `${icon('file')} Dateien <span class="badge">${files.length}</span>`]].map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-q-tab="${k === 'kanji' ? '' : k}">${l}</button>`).join('')}</div>
      <div data-body></div></div>`;
    const body = view.querySelector('[data-body]');
    if (tab === 'hira' || tab === 'kata') body.innerHTML = `<p class="muted">Tippe auf ein Zeichen: Strichfolge ansehen und direkt nachschreiben.</p>${kanaChart(tab === 'kata')}`;
    else if (tab === 'files') {
      body.innerHTML = `<div class="row" style="margin-bottom:14px"><button class="btn btn-sec" data-upload="kanji">${icon('upload')} Dateien hinzufügen</button><button class="btn" data-nb-kanji>${icon('notebook')} Kanji-Übungsblatt (Raster)</button></div>
        ${files.length ? `<div class="file-grid">${files.map(App.fileCard).join('')}</div>` : '<div class="empty-state"><div class="big">漢</div><h3>Noch keine Dateien</h3><p>Z. B. Kanji-Seiten aus Genki oder Übungsblätter. Mit „Kanji-Übungsblatt“ bekommst du ein leeres 原稿-Raster zum Schreiben.</p></div>'}`;
      body.querySelector('[data-nb-kanji]').onclick = () => App.newNotebook({ section: 'kanji', paper: 'kanji', name: 'Kanji-Übung ' + App.fmtDate(new Date()) });
      App.hydrateThumbs(body);
    } else {
      body.innerHTML = `<div class="toolbar"><div class="search-wrap" style="max-width:340px">${icon('search')}<input class="input" style="padding-left:44px;width:100%" data-kf placeholder="Kanji, Bedeutung oder Lesung …" value="${esc(q.f || '')}"></div>
        ${App.lessonSelect(all, q.l)}
        <select class="input" data-q-select="st"><option value="">Jeder Lernstand</option>${Object.entries(App.STATUS).map(([k, s]) => `<option value="${k}" ${q.st === k ? 'selected' : ''}>${s.dot} ${s.label}</option>`).join('')}</select>
        <span class="small muted">○ ungeprüft · <span style="color:var(--ai)">●</span> Lernstapel · <span style="color:var(--matcha)">●</span> kann ich · <span style="color:var(--shu)">授</span> im Unterricht</span><span class="grow"></span><button class="btn btn-sm btn-sec" data-kvg-all hidden></button></div>
        <div class="chips scroll" style="margin-bottom:8px"><button class="chip ${!q.mark ? 'on' : ''}" data-q-mark="">Alle Markierungen</button>${App.kanjiMarks().map((m) => { const n = all.filter((k) => App.hasMark(k, m)).length; return `<button class="chip ${q.mark === m ? 'on' : ''}" data-q-mark="${esc(m)}">${esc(m)} <span class="small" style="opacity:.7">${n}</span></button>`; }).join('')}<button class="chip" data-new-mark>${icon('plus')} Markierung</button></div>
        ${App.sourceChips(all, q.src)}${App.levelChips(q.lvl)}<div data-grid style="margin-top:14px"></div>`;
      body.querySelector('[data-new-mark]').onclick = async () => { const m = await App.addKanjiMark(); if (m) App.setQuery({ mark: m }); };
      // Eigene Kanji ohne Strichfolge finden → Sammel-Download anbieten
      (async () => {
        const missing = [];
        for (const k of all) if (k.char && k.char !== '々' && !(await App.stroke.has(k.char))) missing.push(k.char);
        const b = body.querySelector('[data-kvg-all]');
        if (!b || !missing.length) return;
        b.hidden = false;
        b.innerHTML = `${icon('download')} Strichfolge für ${missing.length} Kanji laden`;
        b.title = missing.join(' ');
        b.onclick = async () => {
          let ok = 0; const fail = [];
          for (const [i, c] of missing.entries()) {
            b.disabled = true; b.textContent = `Lade ${i + 1} / ${missing.length} …`;
            const r = await App.stroke.download(c);
            if (r.ok) ok++; else fail.push(c + ': ' + r.error);
            if (!r.ok && /Internet/.test(r.error)) break;
          }
          App.toast(`${ok} Strichfolgen geladen${fail.length ? ` · ${fail.length} fehlgeschlagen` : ''}`);
          if (fail.length) App.modal({ title: 'Nicht geladen', body: `<ul>${fail.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` });
          App.render(true);
        };
      })();
      const byL = new Map();
      items.forEach((it) => { const k = (it.source || 'Eigene') + (it.lesson !== '' && it.lesson != null ? ' · Lektion ' + it.lesson : ''); if (!byL.has(k)) byL.set(k, []); byL.get(k).push(it); });
      let html = '';
      byL.forEach((list, k) => { html += `<div class="group-head"><h2>${esc(k)}</h2><span class="badge">${list.length}</span><span class="line"></span></div><div class="kanji-grid">${list.map(App.kanjiTile).join('')}</div>`; });
      body.querySelector('[data-grid]').innerHTML = html || '<div class="empty-state"><div class="big">漢</div><h3>Keine Kanji gefunden</h3></div>';
      const kf = body.querySelector('[data-kf]');
      kf.addEventListener('input', App.debounce(() => { App.setQuery({ f: kf.value }); const g = $('[data-kf]'); if (g) { g.focus(); g.setSelectionRange(g.value.length, g.value.length); } }, 350));
    }
  });

  App.route('/kanji/:char', (view, p) => {
    const ch = p.char;
    const it = App.kanjiByChar(ch) || App.item(ch);
    const sec = App.SECTIONS.kanji;
    if (!it) {
      view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/kanji">Kanji</a></div><div class="card pad-lg"><div class="kanji-stage"><div data-anim></div><div><h2>${esc(ch)} ist noch nicht in deiner Sammlung</h2><p class="muted">Du kannst es trotzdem üben – oder als Eintrag speichern.</p><button class="btn btn-sec" data-add-k>${icon('plus')} Als Kanji speichern</button></div></div><div class="section-title">Schreiben üben</div><div data-pad></div></div></div>`;
      App.stroke.animator(view.querySelector('[data-anim]'), ch);
      App.stroke.pad(view.querySelector('[data-pad]'), ch);
      view.querySelector('[data-add-k]').onclick = () => App.editItem({ type: 'kanji', defaults: { char: ch } });
      return;
    }
    const list = App.itemsOf('kanji').sort((a, b) => (+a.lesson || 99) - (+b.lesson || 99) || App.ord(a) - App.ord(b));
    const idx = list.indexOf(it);
    const prev = list[idx - 1], next = list[idx + 1];
    const media = App.filesFor({ itemId: it.id }).filter((f) => ['image', 'video'].includes(App.fileKind(f)));
    view.innerHTML = `<div class="${sec.cls}"><div class="row between">${App.crumbs(sec, it)}<div class="row">
        ${prev ? `<a class="btn btn-sm" href="${App.link(prev)}">${icon('back')} ${esc(prev.char)}</a>` : ''}${next ? `<a class="btn btn-sm" href="${App.link(next)}">${esc(next.char)} ${icon('next')}</a>` : ''}</div></div>
      <div class="split"><div>
        <div class="card pad-lg"><div class="kanji-stage"><div data-anim></div>
          <div class="stack"><div class="row between" style="align-items:flex-start"><div><div class="de-big" style="font-size:26px">${App.meaningHtml(it)}</div>
            <div class="row" style="margin-top:6px">${App.levelBadge(it)}${App.srcBadge(it)}<span class="badge">${esc(it.strokes || '?')} Striche</span></div></div>
            <div class="row">${`<button class="icon-btn ${it.star ? 'active' : ''}" data-star="${it.id}">${icon(it.star ? 'starFill' : 'star')}</button><button class="btn btn-sm" data-edit="${it.id}">${icon('edit')} Bearbeiten</button>`}</div></div>
          <div class="stack" style="gap:8px">
            <div class="row" style="align-items:center"><span class="small muted" style="min-width:70px">Lesen</span><div class="seg" data-vst>${App.statusChoices(it).map(([k, s]) => `<button class="${App.vocabStatus(it.id) === k ? 'on' : ''}" data-v="${k}" style="color:${s.color}">${s.dot} ${s.label}</button>`).join('')}</div></div>
            <div class="row" style="align-items:center"><span class="small muted" style="min-width:70px">Schreiben</span><span data-wst></span></div>
            ${App.marksChips(it)}</div>
          <div class="readings">
            ${(it.on || []).length ? `<div class="r-line"><span class="lab">On</span>${it.on.map((r) => `<span class="r" lang="ja">${esc(r)}</span>`).join('')}</div>` : ''}
            ${(it.kun || []).length ? `<div class="r-line"><span class="lab">Kun</span>${it.kun.map((r) => `<span class="r" lang="ja">${esc(r)}</span>`).join('')}</div>` : ''}
          </div>
          ${it.mnemonic ? `<div class="pitfall" style="background:var(--murasaki-soft);border-color:var(--murasaki)">💡 ${JP.ruby(it.mnemonic)}</div>` : ''}
          </div></div></div>
        ${(it.words || []).length ? `<div class="section-title">Wörter</div><div class="grid cols-3">${it.words.map((w) => `<div class="card row between" style="padding:12px 16px"><div><div lang="ja" style="font-size:22px">${JP.ruby(w.jp)}</div><div class="muted">${App.meaningHtml(w)}</div></div>${App.speakBtn(w.jp)}</div>`).join('')}</div>` : ''}
        <div class="section-title">Schreiben üben</div><div data-pad></div>
        <div class="section-title">Eigene Strichfolge-Videos & GIFs</div>
        <div class="row" style="margin-bottom:10px"><button class="btn btn-sm" data-add-media>${icon('upload')} GIF / Video hinzufügen</button><span class="small muted">z. B. aus WaniKani, Jisho oder selbst aufgenommen</span></div>
        <div class="grid cols-3" data-media></div>
        ${it.notes ? `<div class="section-title">Notizen</div><div class="card prose">${JP.md(it.notes)}</div>` : ''}
      </div><aside>${App.relatedHtml(it)}</aside></div></div>`;
    App.stroke.animator(view.querySelector('[data-anim]'), it.char);
    App.stroke.pad(view.querySelector('[data-pad]'), it.char);
    // Schreib-Stand: eigener Lernstand, entsteht beim Schreiben im Kanji-Quiz
    const wst = () => {
      const W = App.writeLogic, ws = App.srsOf(W.id(it.id));
      const st = W.STATUS[!ws && !W.unlocked(S.srs, it.id) ? 'locked' : W.status(S.srs, it.id)];
      view.querySelector('[data-wst]').innerHTML = `<span class="badge vst" style="color:${st.color}">${st.dot} ${st.label}</span> <span class="small muted">${W.isMarkedKnown(S.srs, it.id) ? 'als gelernt eingestuft – wird nicht mehr abgefragt' : W.isKnown(ws) ? 'gelernt – wird nicht mehr abgefragt' : ws ? `nächste Wiederholung ${App.fmtDate(ws.due)}` : st === W.STATUS.locked ? 'kommt dran, sobald du es lesen kannst' : 'kommt beim nächsten „Schreiben lernen“ dran'}</span>${ws ? ' <button class="btn btn-sm btn-ghost" data-wreset title="Schreib-Stand löschen – das Kanji kommt wieder neu in die Schreib-Runde">zurücksetzen</button>' : ''}`;
      const rs = view.querySelector('[data-wreset]');
      if (rs) rs.onclick = async () => { await App.resetWrite(it.id); wst(); App.toast('Schreib-Stand zurückgesetzt'); };
    };
    wst();
    view.querySelector('[data-vst]').onclick = async (e) => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      await App.setCheck(it.id, b.dataset.v);
      wst();
      view.querySelectorAll('[data-vst] [data-v]').forEach((x) => x.classList.toggle('on', x === b));
      App.toast('Lernstand: ' + App.STATUS[b.dataset.v].label);
    };
    view.querySelector('[data-add-media]').onclick = () => App.uploadDialog({ itemId: it.id, section: 'kanji', source: it.source, lesson: it.lesson, accept: 'image/*,video/*', title: 'Strichfolge-GIF oder Video hinzufügen' });
    const mh = view.querySelector('[data-media]');
    (async () => {
      for (const f of media) {
        const u = URL.createObjectURL(await App.fileBlob(f.id));
        App.onLeave(() => URL.revokeObjectURL(u));
        const k = App.fileKind(f);
        mh.insertAdjacentHTML('beforeend', `<div class="card" style="padding:8px">${k === 'video' ? `<video src="${u}" controls loop muted playsinline style="width:100%;border-radius:10px"></video>` : `<img src="${u}" style="width:100%;border-radius:10px;background:#fff">`}
          <div class="row between small"><span class="muted">${esc(f.name)}</span><button class="icon-btn sm" data-open-file="${f.id}">${icon('edit')}</button></div></div>`);
      }
    })();
  });

  // =========================================================
  // Bibliothek
  // =========================================================
  const KIND_LABEL = { pdf: 'PDF', image: 'Bilder', slides: 'Präsentationen', notebook: 'Notizblätter', video: 'Videos', audio: 'Audio', doc: 'Dokumente', deck: 'Anki/Tabellen', other: 'Sonstige' };
  const SEC_LABEL = { library: 'Allgemein', grammar: 'Grammatik', vocab: 'Vokabeln', kanji: 'Kanji', phrase: 'Ausdrücke', session: 'Unterricht' };
  App.route('/bibliothek', (view, p, q) => {
    const sec = App.SECTIONS.library;
    const all = Array.from(S.files.values());
    let files = all;
    if (q.src) files = files.filter((f) => f.source === q.src);
    if (q.sec) files = files.filter((f) => f.section === q.sec);
    if (q.kind) files = files.filter((f) => App.fileKind(f) === q.kind);
    if (q.l) files = files.filter((f) => String(f.lesson) === q.l);
    files.sort((a, b) => b.created - a.created);
    const kinds = Array.from(new Set(all.map(App.fileKind)));
    const secs = Array.from(new Set(all.map((f) => f.section)));
    view.innerHTML = `<div class="${sec.cls}">${App.pageHead(sec, 'Alle Materialien: Buchseiten, Präsentationen, Hausaufgaben, Notizblätter – filterbar nach Quelle, Bereich und Lektion.',
      `<button class="btn" data-nb>${icon('notebook')} Notizblatt</button><button class="btn btn-sec" data-upload="library">${icon('upload')} Hochladen</button>`)}
      <div class="dropzone" data-drop style="margin-bottom:18px">${icon('upload')} <b>Dateien hierher ziehen</b> – PDF, Fotos, PowerPoint, Videos …</div>
      <div class="toolbar">
        <select class="input" data-q-select="sec"><option value="">Alle Bereiche</option>${secs.map((s) => `<option value="${s}" ${q.sec === s ? 'selected' : ''}>${SEC_LABEL[s] || s}</option>`).join('')}</select>
        <select class="input" data-q-select="kind"><option value="">Alle Dateitypen</option>${kinds.map((k) => `<option value="${k}" ${q.kind === k ? 'selected' : ''}>${KIND_LABEL[k]}</option>`).join('')}</select>
        ${App.lessonSelect(all, q.l)}</div>
      ${App.sourceChips(all, q.src)}
      <div style="margin-top:16px">${files.length ? `<div class="file-grid">${files.map(App.fileCard).join('')}</div>` : `<div class="empty-state"><div class="big">資</div><h3>Noch keine Dateien</h3><p>Lade deine Genki-Seiten, Marugoto-PDFs, PowerPoints aus dem VHS-Kurs oder Hausaufgaben hoch.</p></div>`}</div></div>`;
    App.hydrateThumbs(view);
    view.querySelector('[data-nb]').onclick = () => App.newNotebook({ section: 'library' });
    const dz = view.querySelector('[data-drop]');
    dz.onclick = () => App.uploadDialog({ source: q.src || '', section: q.sec || 'library' });
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); App.uploadDialog({ files: Array.from(e.dataTransfer.files), source: q.src || '', section: q.sec || 'library' }); });
  });

  // =========================================================
  // Einstellungen, Export & Import
  // =========================================================
  const blobToB64 = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  const b64ToBlob = async (d) => (await fetch(d)).blob();
  App.exportData = async ({ withFiles = true, share = false, sections = null, sources = null } = {}) => {
    let items = Array.from(S.items.values()).filter((i) => !i._seed || i._edited || (!share && (S.srs.has(i.id) || S.srs.has('w:' + i.id) || i.star)));
    if (share) {
      // unberührte Paket-Einträge nicht teilen – Freunde schalten das Paket selbst frei
      items = Array.from(S.items.values()).filter((i) => (!i._seed || i._edited) && !(i._pack && !i._edited));
      if (sections) {
        // „Anwenden“ steht als ein Chip für die drei zugrunde liegenden Typen
        if (sections.includes('apply')) sections = sections.concat(App.APPLY_TYPES);
        items = items.filter((i) => sections.includes(i.type));
      }
      if (sources) items = items.filter((i) => !i.source || sources.includes(i.source));
    }
    const data = { app: 'nihongo-techo', version: 1, exported: new Date().toISOString(), share, items: items.map((i) => { const c = Object.assign({}, i); delete c._st; return c; }) };
    if (!share) {
      data.srs = Array.from(S.srs.values()); data.settings = S.settings; data.ink = await App.db.all('ink');
      // Paket-Status gehört zu den mitgesicherten Paket-Einträgen (nur Level-Pakete; Wörterbuch liegt nicht im Backup)
      const packs = {};
      Object.entries(await App.packs.state()).forEach(([id, m]) => { if (m && (App.packById(id) || {}).kind === 'level') packs[id] = m; });
      data.packs = packs;
      data.deletedPackItems = ((await App.db.get('meta', 'deletedPackItems')) || {}).value || [];
    }
    if (withFiles) {
      data.files = [];
      let fl = Array.from(S.files.values());
      if (share && sections) fl = fl.filter((f) => sections.includes(f.section === 'library' ? 'library' : f.section) || sections.includes('library'));
      if (share && sources) fl = fl.filter((f) => !f.source || sources.includes(f.source));
      for (const f of fl) { const b = await App.fileBlob(f.id); data.files.push({ meta: f, data: b ? await blobToB64(b) : null }); }
      if (share) data.ink = (await App.db.all('ink')).filter((k) => data.files.some((x) => x.meta.id === k.fileId));
    }
    const name = `nihongo-techo-${share ? 'paket' : 'backup'}-${App.today()}.json`;
    App.downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), name);
    App.toast('Export erstellt: ' + name);
  };
  App.importData = async (file) => {
    const data = JSON.parse(await file.text());
    if (data.app !== 'nihongo-techo') throw new Error('Das ist keine Nihongo-Techō-Datei.');
    let n = 0, nf = 0;
    if (!data.share) {
      // Paket-Status nur übernehmen, wenn das Backup Einträge dieses Pakets enthält und es hier noch nicht installiert ist
      const inBackup = (id) => (data.items || []).some((it) => it._pack === id || (Array.isArray(it.packs) && it.packs.includes(id)));
      const local = await App.packs.state();
      for (const [id, m] of Object.entries(data.packs || {})) {
        if (m && !local[id] && (App.packById(id) || {}).kind === 'level' && inBackup(id)) await App.packMeta.set(id, m);
      }
      if (Array.isArray(data.deletedPackItems) && data.deletedPackItems.length) {
        const del = new Set(((await App.db.get('meta', 'deletedPackItems')) || {}).value || []);
        data.deletedPackItems.forEach((x) => del.add(x));
        await App.db.put('meta', { key: 'deletedPackItems', value: Array.from(del) });
      }
    }
    for (const it of data.items || []) {
      const cur = S.items.get(it.id);
      if (!cur || (it.updated || 0) >= (cur.updated || 0)) {
        // JLPT-Niveau wie beim Speichern bestimmen (Import schreibt direkt, ohne saveItem)
        if ((it.type === 'vocab' || it.type === 'kanji') && !it.levelManual) it.level = App.levelFor(it);
        S.items.set(it.id, it); await App.db.put('items', it); n++;
      }
    }
    for (const x of data.files || []) {
      if (S.files.has(x.meta.id) || !x.data) continue;
      await App.db.put('blobs', { id: x.meta.id, blob: await b64ToBlob(x.data) });
      await App.db.put('files', x.meta); S.files.set(x.meta.id, x.meta); nf++;
    }
    for (const k of data.ink || []) { await App.db.put('ink', k); if (App.inkImages.hasInk(k)) S.inkCount.set(k.fileId, (S.inkCount.get(k.fileId) || 0) + 1); }
    if (data.srs && !data.share) for (const s of data.srs) { const c = S.srs.get(s.id); if (!c || (s.last || 0) > (c.last || 0)) { S.srs.set(s.id, s); await App.db.put('srs', s); } }
    if (data.settings && !data.share) { const keep = S.settings.sources; await App.saveSettings(Object.assign({}, data.settings)); data.settings.sources.forEach((s) => { if (!keep.some((k) => k.name === s.name)) keep.push(s); }); await App.saveSettings({ sources: keep }); }
    App.emit('items');
    return { n, nf };
  };

  App.route('/einstellungen', (view) => {
    const st = S.settings;
    view.innerHTML = `<div class="sec-settings"><div class="page-head"><div class="titles"><h1>Einstellungen <span class="jp-title">設定</span></h1><p>Persönliches, Quellen, Sicherung und Teilen mit Freunden.</p></div></div>
      <div class="grid cols-2">
      <div class="card"><h3>Persönlich</h3><div class="form">
        <div class="field"><label>Dein Name <small>für die Begrüßung</small></label><input class="input" data-s="name" value="${esc(st.name)}"></div>
        <div class="field"><label>Name deines Kurses</label><input class="input" data-s="course" value="${esc(st.course)}"></div>
        <div class="two"><div class="field"><label>Design</label><select class="input" data-s="theme">${[['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<option value="${k}" ${st.theme === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Furigana</label><select class="input" data-s="furigana"><option value="on" ${st.furigana === 'on' ? 'selected' : ''}>Immer anzeigen</option><option value="hover" ${st.furigana === 'hover' ? 'selected' : ''}>Nur beim Antippen</option></select></div></div>
        <div class="two"><div class="field"><label>Neue Karten pro Sitzung</label><input class="input" type="number" min="1" max="100" data-s="newPerDay" value="${st.newPerDay}"></div>
        <div class="field"><label>Wörter pro Einstufungs-Runde</label><input class="input" type="number" min="3" max="100" data-s="checkBatch" value="${st.checkBatch || 15}"></div></div>
        <div class="field"><label>Kanji-Schwerpunkt <small>was Startseite und „fällig“ in den Vordergrund stellen</small></label><select class="input" data-s="kanjiFocus">${[['both', 'Lesen und Schreiben'], ['write', 'Schreiben – Lesen lerne ich woanders (z. B. WaniKani)'], ['read', 'Lesen – Schreiben brauche ich nicht']].map(([k, l]) => `<option value="${k}" ${App.writeLogic.focus(st) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Furigana beim Abfragen <small>über Kanji, die du schon lesen kannst („Kann ich“ oder mit Karten gelernt)</small></label><select class="input" data-s="furiKnown">${[['hide', 'Ausblenden – nur über Kanji, die ich noch lerne'], ['show', 'Über allen Kanji anzeigen']].map(([k, l]) => `<option value="${k}" ${(st.furiKnown === 'show' ? 'show' : 'hide') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="two">
        <div class="field"><label>Sprechtempo <small>${st.ttsRate}</small></label><div class="row"><input type="range" min="0.5" max="1.3" step="0.1" data-s="ttsRate" value="${st.ttsRate}" class="grow">${App.speakBtn('こんにちは、日本語を勉強しています。')}</div></div></div>
      </div></div>
      <div class="card"><h3>Quellen</h3><p class="muted small">Damit du deine Inhalte nach Buch, App oder Kurs filtern kannst (z. B. nur Genki-Vokabeln).</p>
        <div class="stack" data-srcs style="gap:6px">${st.sources.map((s, i) => `<div class="row"><input type="color" value="${s.color}" data-sc="${i}" style="width:44px;height:40px;border:0;background:none"><input class="input grow" value="${esc(s.name)}" data-sn="${i}"><button class="icon-btn sm" data-sd="${i}">${icon('trash')}</button></div>`).join('')}</div>
        <button class="btn btn-sm" style="margin-top:10px" data-sadd>${icon('plus')} Quelle hinzufügen</button></div>
      <div class="card"><h3>Sicherung</h3><p class="muted small">Alles wird lokal in diesem Browser gespeichert. Mach regelmäßig ein Backup – damit kannst du auch auf ein anderes Gerät umziehen.</p>
        <div class="stack"><button class="btn btn-primary" data-exp>${icon('download')} Komplett-Backup (mit Dateien & Stiftnotizen)</button>
        <button class="btn" data-exp-light>${icon('download')} Backup ohne Dateien (klein)</button>
        <label class="btn">${icon('upload')} Backup oder Paket importieren<input type="file" accept=".json,application/json" hidden data-imp></label></div></div>
      <div class="card"><h3>Pakete &amp; Wörterbuch</h3><p class="muted small">JLPT-Niveaus N5–N1 freischalten, das Wörterbuch für den Satz-Scan installieren und den belegten Speicher ansehen.</p>
        <div class="row"><a class="btn btn-primary" href="#/pakete">${icon('package')} Pakete verwalten</a><a class="btn btn-ghost" href="#/lizenzen">${icon('info')} Lizenzen</a></div></div>
      <div class="card"><h3>Mit Freunden teilen</h3><p class="muted small">Erstelle ein Paket mit deinen eigenen Einträgen (z. B. alle Vokabeln aus NHK Easy oder deine Unterrichtsnotizen). Deine Freunde importieren es in ihre eigene App – ihr Lernstand bleibt getrennt.</p>
        <div class="field"><label>Bereiche</label><div class="chips" data-share-sec>${[['vocab', 'Vokabeln'], ['grammar', 'Grammatik'], ['kanji', 'Kanji'], ['phrase', 'Ausdrücke'], ['session', 'Unterricht'], ['apply', 'Anwenden']].map(([k, l]) => `<label class="chip ${k === 'apply' ? '' : 'on'}"><input type="checkbox" value="${k}" ${k === 'apply' ? '' : 'checked'} hidden>${l}</label>`).join('')}</div></div>
        <div class="field" style="margin-top:10px"><label>Quellen</label><div class="chips" data-share-src>${st.sources.map((s) => `<label class="chip on"><input type="checkbox" value="${esc(s.name)}" checked hidden><span class="sw" style="--c:${s.color}"></span>${esc(s.name)}</label>`).join('')}</div></div>
        <label class="row small" style="margin:10px 0"><input type="checkbox" data-share-files checked> Zugehörige Dateien mitschicken</label>
        <button class="btn btn-sec" style="--sec:var(--sakura)" data-share>${icon('download')} Teilen-Paket erstellen</button></div>
      ${App.pwa.card()}
      <div class="card"><h3>Über</h3><p class="small">Nihongo Techō 日本語手帳 · läuft komplett offline in deinem Browser.<br>Strichfolge-Daten: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> © Ulrich Apel, CC BY-SA 3.0. PDF-Anzeige: pdf.js (Mozilla).<br>Inhalte orientieren sich an Genki I (3. Aufl.) – bitte mit deinem Buch abgleichen.</p>
        <button class="btn btn-sm btn-ghost btn-danger" data-reset>${icon('trash')} Alle Daten löschen</button></div>
      </div></div>`;
    const root = view.firstElementChild;
    root.addEventListener('change', async (e) => {
      const s = e.target.closest('[data-s]');
      if (s) { let v = s.value; if (s.type === 'number' || s.type === 'range') v = +v; await App.saveSettings({ [s.dataset.s]: v }); if (s.dataset.s === 'theme') App.applyTheme(); if (s.dataset.s === 'ttsRate') App.render(true); }
      const sn = e.target.closest('[data-sn]');
      if (sn) { const i = +sn.dataset.sn; const old = st.sources[i].name; const nn = sn.value.trim(); if (nn && nn !== old) { st.sources[i].name = nn; for (const it of S.items.values()) if (it.source === old) { it.source = nn; await App.db.put('items', it); } for (const f of S.files.values()) if (f.source === old) { f.source = nn; await App.db.put('files', f); } await App.saveSettings({}); App.toast('Quelle umbenannt'); } }
      const sc = e.target.closest('[data-sc]');
      if (sc) { st.sources[+sc.dataset.sc].color = sc.value; await App.saveSettings({}); }
      const ch = e.target.closest('.chip input'); if (ch) ch.parentElement.classList.toggle('on', ch.checked);
      const imp = e.target.closest('[data-imp]');
      if (imp && imp.files[0]) { try { const r = await App.importData(imp.files[0]); App.toast(`Importiert: ${r.n} Einträge, ${r.nf} Dateien`); App.render(); } catch (er) { App.toast('Import fehlgeschlagen: ' + er.message); } }
    });
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.matches('[data-sadd]')) { st.sources.push({ name: 'Neue Quelle', color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') }); await App.saveSettings({}); App.render(true); }
      if (b.matches('[data-sd]')) { const s = st.sources[+b.dataset.sd]; if (await App.confirm(`Quelle „${s.name}“ aus der Liste entfernen? Einträge behalten ihre Quelle.`, { ok: 'Entfernen' })) { st.sources.splice(+b.dataset.sd, 1); await App.saveSettings({}); App.render(true); } }
      if (b.matches('[data-exp]')) App.exportData({ withFiles: true });
      if (b.matches('[data-exp-light]')) App.exportData({ withFiles: false });
      if (b.matches('[data-share]')) {
        const sections = $$('[data-share-sec] input:checked', view).map((x) => x.value);
        const sources = $$('[data-share-src] input:checked', view).map((x) => x.value);
        App.exportData({ share: true, sections, sources, withFiles: view.querySelector('[data-share-files]').checked });
      }
      if (b.matches('[data-reset]')) {
        if (await App.confirm('Wirklich ALLE Daten (Einträge, Dateien, Notizen, Lernstand) löschen? Das kann nicht rückgängig gemacht werden. Mach vorher ein Backup!', { ok: 'Alles löschen' })) {
          for (const s of ['items', 'files', 'blobs', 'ink', 'srs', 'meta', 'dict']) await App.db.clear(s);
          location.reload();
        }
      }
    });
  });
})(window.App);
