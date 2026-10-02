/* Nihongo Techō – Paket-Verwaltung (JLPT-Level, Wörterbuch) und Seiten „Pakete“ und „Lizenzen“ */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const S = App.store;
  const SESSION_KEYS = ['grammarIds', 'vocabIds', 'kanjiIds', 'phraseIds'];

  // Level-Paketdateien laden (bereits geladene Daten werden wiederverwendet)
  async function loadLevelItems(pack) {
    const out = [];
    for (const file of pack.files) {
      const key = App.packDataKey(file);
      const src = 'packs/' + file;
      if (!(window.PACK_DATA && Array.isArray(window.PACK_DATA[key]))) {
        App.unloadScript(src); // falls das Skript-Element noch da ist, die Daten aber schon freigegeben wurden
        await App.loadScript(src);
      }
      const rows = (window.PACK_DATA || {})[key];
      if (!Array.isArray(rows)) throw new Error('Paketdatei ohne Inhalt: ' + file);
      out.push(...rows);
    }
    return out;
  }
  function freeLevel(pack) {
    pack.files.forEach((file) => {
      if (window.PACK_DATA) delete window.PACK_DATA[App.packDataKey(file)];
      App.unloadScript('packs/' + file);
    });
  }
  const deletedSet = async () => new Set(((await App.db.get('meta', 'deletedPackItems')) || {}).value || []);
  const plan = async (pack) => App.planMerge(await loadLevelItems(pack), Array.from(S.items.values()), {
    packId: pack.id, level: pack.level, deleted: await deletedSet(),
  });

  App.packs = {
    state: () => App.packMeta.read(),

    status: (pack) => {
      if (!pack || !pack.available) return 'unavailable';
      const m = App.packMeta.cached()[pack.id];
      if (!m) return 'locked';
      if (pack.kind === 'dict' && !m.complete) return 'partial';
      if ((pack.version || 0) > (m.version || 0)) return 'update';
      return 'installed';
    },

    // Zahlen für die Bestätigung, ohne etwas zu schreiben
    preview: async (id) => {
      const pack = App.packById(id);
      if (!pack || pack.kind !== 'level') throw new Error('Unbekanntes Level-Paket: ' + id);
      return (await plan(pack)).counts;
    },

    install: async (id, onProgress = () => {}) => {
      const pack = App.packById(id);
      if (!pack) throw new Error('Unbekanntes Paket: ' + id);
      if (pack.kind === 'dict') return App.dict.install(id, onProgress);
      onProgress(0.1, 'Paketdateien werden geladen …');
      const res = await plan(pack); // scheitert das Laden, wird nichts geschrieben
      onProgress(0.5, 'Einträge werden gespeichert …');
      const puts = res.adds.concat(res.updates);
      // eigene Einträge, die planMerge überspringt (Inhalt unverändert/bearbeitet), aber ohne dieses Paket in packs
      // (z. B. beim Entfernen behalten und jetzt wieder freigeschaltet): Paket-Kennung wieder eintragen
      const done = new Set(puts.map((it) => it.id));
      S.items.forEach((it) => {
        if (it._pack === id && !done.has(it.id) && !(Array.isArray(it.packs) && it.packs.includes(id))) {
          puts.push(Object.assign({}, it, { packs: [...(Array.isArray(it.packs) ? it.packs : []), id] }));
        }
      });
      if (puts.length) {
        try { await App.db.putMany('items', puts); } catch (e) { throw App.storageError(e); }
      }
      puts.forEach((it) => S.items.set(it.id, it));
      await App.packMeta.set(id, { version: pack.version, installed: Date.now() });
      freeLevel(pack);
      onProgress(1, 'Fertig');
      App.emit('items');
      return res.counts;
    },

    // Entfernt unberührte Paket-Einträge; eingestufte, markierte, bearbeitete oder verknüpfte bleiben
    remove: async (id) => {
      const pack = App.packById(id);
      if (pack && pack.kind === 'dict') { await App.dict.remove(id); return { removed: 0, kept: 0 }; }
      const sessionRefs = new Set();
      App.itemsOf('session').forEach((s) => SESSION_KEYS.forEach((k) => (s[k] || []).forEach((x) => sessionRefs.add(x))));
      const del = [];
      const upd = [];
      let kept = 0;
      const installed = App.packMeta.cached();
      for (const it of S.items.values()) {
        const packs = Array.isArray(it.packs) ? it.packs : [];
        const rest = packs.filter((x) => x !== id);
        // eigener Eintrag oder verwaister Eintrag eines nicht (mehr) installierten Pakets, das zuletzt über dieses Paket hing
        const own = it._pack === id || (it._pack && packs.includes(id) && !installed[it._pack]);
        if (own && !rest.length && App.isRemovable(it, { srs: S.srs, sessionRefs })) { del.push(it.id); continue; }
        if (it._pack === id) kept++;
        if (rest.length !== packs.length) upd.push(Object.assign({}, it, { packs: rest }));
      }
      if (del.length) await App.db.delMany('items', del);
      if (upd.length) await App.db.putMany('items', upd);
      del.forEach((x) => S.items.delete(x));
      upd.forEach((it) => S.items.set(it.id, it));
      await App.packMeta.set(id, null);
      App.emit('items');
      return { removed: del.length, kept };
    },
  };

  // ---------- Seite „Pakete“ ----------
  const STATUS = {
    locked: ['Nicht freigeschaltet', ''],
    installed: ['Installiert', 'ok'],
    update: ['Aktualisierung verfügbar', 'warn'],
    unavailable: ['Noch nicht verfügbar', 'off'],
    partial: ['Import unvollständig', 'warn'],
  };
  const num = (n) => Number(n || 0).toLocaleString('de-DE');
  const mb = (bytes) => (bytes / 1e6).toLocaleString('de-DE', { maximumFractionDigits: bytes < 1e8 ? 1 : 0 }) + ' MB';
  const kbSize = (kb) => (kb ? mb(kb * 1000) : '');
  let busy = null; // {id, pct, text} während einer Installation

  function packCard(p) {
    const st = App.packs.status(p);
    const m = App.packMeta.cached()[p.id];
    const [label, cls] = STATUS[st];
    const isLevel = p.kind === 'level';
    const nums = isLevel
      ? `${num(p.counts.vocab)} Wörter · ${num(p.counts.kanji)} Kanji · ${num(p.counts.grammar)} Grammatikpunkte`
      : `${num(p.entries)} Einträge · ${p.files.length} Teile`;
    const dis = busy ? 'disabled' : '';
    let btns = '';
    if (st === 'unavailable') btns = '<button class="btn btn-sm" disabled>Noch nicht verfügbar</button>';
    else if (isLevel) {
      if (st === 'locked') btns = `<button class="btn btn-sm btn-primary" data-act="unlock" data-id="${p.id}" ${dis}>${icon('plus')} Freischalten</button>`;
      else btns = `<button class="btn btn-sm ${st === 'update' ? 'btn-primary' : ''}" data-act="update" data-id="${p.id}" ${dis}>${icon('replay')} Aktualisieren</button>
        <button class="btn btn-sm btn-ghost btn-danger" data-act="remove" data-id="${p.id}" ${dis}>${icon('trash')} Entfernen</button>`;
    } else {
      if (st === 'locked') btns = `<button class="btn btn-sm btn-primary" data-act="dict" data-id="${p.id}" ${dis}>${icon('download')} Installieren</button>`;
      else if (st === 'partial') btns = `<button class="btn btn-sm btn-primary" data-act="resume" data-id="${p.id}" ${dis}>${icon('play')} Import fortsetzen</button>`;
      else if (st === 'update') btns = `<button class="btn btn-sm btn-primary" data-act="dict" data-id="${p.id}" ${dis}>${icon('replay')} Aktualisieren</button>`;
      if (st !== 'locked') btns += `<button class="btn btn-sm btn-ghost btn-danger" data-act="remove" data-id="${p.id}" ${dis}>${icon('trash')} Entfernen</button>`;
    }
    const partial = st === 'partial' && m ? `<p class="small muted">${(m.chunksDone || []).length} von ${p.files.length} Teilen importiert</p>` : '';
    const prog = busy && busy.id === p.id
      ? `<div class="pack-prog" data-prog><div class="progress"><i style="width:${Math.round(busy.pct * 100)}%"></i></div><p class="small muted" data-prog-text>${esc(busy.text || '')}</p></div>` : '';
    return `<div class="card pack-card ${st === 'unavailable' ? 'is-off' : ''}">
      <div class="row between"><h3>${isLevel ? `<span class="badge lvl lvl-${p.id}">${esc(p.level)}</span> ` : ''}${esc(p.title)}</h3><span class="pack-status ${cls}">${label}</span></div>
      <p class="small">${nums}</p>
      <p class="small muted">${p.sizeKB ? 'Größe: ' + kbSize(p.sizeKB) + ' · ' : ''}Version ${p.version}${m && m.version && m.version !== p.version ? ` (installiert: ${m.version})` : ''}</p>
      ${partial}${prog}
      <div class="row pack-btns">${btns}</div></div>`;
  }

  async function fillStorage(el) {
    let line = 'Die Speicheranzeige wird von diesem Browser nicht unterstützt.';
    let pct = null;
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        line = `Belegt: ${mb(e.usage || 0)} von ${mb(e.quota || 0)}`;
        if (e.quota) pct = Math.min(1, (e.usage || 0) / e.quota);
      }
    } catch (err) { /* Anzeige bleibt beim Hinweis */ }
    const rows = (window.PACKS || []).filter((p) => App.packMeta.cached()[p.id])
      .map((p) => `<li>${esc(p.title)}: ${kbSize(p.sizeKB) || '–'}${App.packs.status(p) === 'partial' ? ' (teilweise)' : ''}</li>`);
    let files = 0;
    S.files.forEach((f) => { files += f.size || 0; });
    rows.push(`<li>Eigene Dateien: ${mb(files)}</li>`);
    if (!el.isConnected) return;
    el.innerHTML = `<p>${esc(line)}</p>${pct != null ? `<div class="progress"><i style="width:${Math.max(1, Math.round(pct * 100))}%"></i></div>` : ''}
      <ul class="small pack-sizes">${rows.join('')}</ul>`;
  }

  function setProgress(pct, text) {
    if (!busy) return;
    busy.pct = pct;
    if (text) busy.text = text;
    const box = document.querySelector('[data-prog]');
    if (box) {
      box.querySelector('.progress > i').style.width = Math.round(pct * 100) + '%';
      box.querySelector('[data-prog-text]').textContent = busy.text;
    }
  }
  const rerender = () => { if (App.parseHash().path === '/pakete') App.render(true); };

  async function run(id, text, fn) {
    busy = { id, pct: 0, text };
    rerender();
    const t0 = Date.now();
    try {
      const r = await fn(setProgress);
      return { ok: true, r, ms: Date.now() - t0 };
    } catch (e) {
      console.error(e);
      App.toast(e.message || String(e));
      return { ok: false };
    } finally {
      busy = null;
      rerender();
    }
  }

  async function onAction(act, id) {
    const p = App.packById(id);
    if (!p) return;
    if (act === 'unlock' || act === 'update') {
      busy = { id, pct: 0.05, text: 'Vorschau wird berechnet …' };
      rerender();
      let c;
      try { c = await App.packs.preview(id); } catch (e) { App.toast('Paket konnte nicht geladen werden: ' + e.message); return; } finally { busy = null; rerender(); }
      const tagged = c.tagged.vocab + c.tagged.kanji + c.tagged.grammar;
      const verb = act === 'unlock' ? 'freischalten' : 'aktualisieren';
      const msg = `${p.level} ${verb}: ${num(c.added.vocab)} neue Wörter, ${num(c.added.kanji)} Kanji, ${num(c.added.grammar)} Grammatikpunkte werden hinzugefügt, ${num(tagged)} vorhandene Einträge bekommen das Niveau ${p.level}`;
      if (!(await App.confirm(msg, { ok: act === 'unlock' ? 'Freischalten' : 'Aktualisieren', danger: false }))) return;
      const res = await run(id, 'Wird installiert …', (prog) => App.packs.install(id, prog));
      if (res.ok) App.toast(`${p.title}: ${num(res.r.added.vocab + res.r.added.kanji + res.r.added.grammar)} Einträge hinzugefügt`);
    }
    if (act === 'dict' || act === 'resume') {
      if (act === 'dict' && !(await App.confirm(`${p.title} installieren? ${num(p.entries)} Einträge, etwa ${kbSize(p.sizeKB)}. Der Import kann einige Minuten dauern; wird er unterbrochen, kannst du ihn später fortsetzen.`, { ok: 'Installieren', danger: false }))) return;
      const res = await run(id, 'Import startet …', (prog) => App.dict.install(id, prog));
      if (res.ok) App.toast(`${p.title} installiert (${Math.round(res.ms / 1000)} s)`);
    }
    if (act === 'remove') {
      const msg = p.kind === 'level'
        ? `${p.title} entfernen? Einträge, die du eingestuft, markiert, bearbeitet oder in Unterrichtsstunden verwendet hast, bleiben erhalten.`
        : `${p.title} entfernen? Die Wörterbuch-Einträge dieses Pakets werden gelöscht.`;
      if (!(await App.confirm(msg, { ok: 'Entfernen' }))) return;
      const res = await run(id, 'Wird entfernt …', () => App.packs.remove(id));
      if (res.ok) App.toast(p.kind === 'level' ? `${num(res.r.removed)} Einträge entfernt, ${num(res.r.kept)} behalten` : `${p.title} entfernt`);
    }
  }

  App.route('/pakete', (view) => {
    const packs = window.PACKS || [];
    view.innerHTML = `<div class="sec-settings"><div class="page-head"><div class="titles"><h1>Pakete <span class="jp-title">包</span></h1>
      <p>JLPT-Wortschatz, Kanji und Grammatik freischalten und das Wörterbuch für den Satz-Scan installieren. Alles bleibt offline in diesem Browser.</p></div>
      <a class="btn btn-sm" href="#/lizenzen">${icon('info')} Lizenzen</a></div>
      <div class="section-title">JLPT-Niveaus</div>
      <div class="grid cols-3">${packs.filter((p) => p.kind === 'level').map(packCard).join('')}</div>
      <div class="section-title">Wörterbuch</div>
      <div class="grid cols-2">${packs.filter((p) => p.kind === 'dict').map(packCard).join('')}</div>
      <div class="section-title">Speicher</div>
      <div class="card" data-storage><p class="muted small">Wird berechnet …</p></div></div>`;
    const root = view.firstElementChild;
    fillStorage(root.querySelector('[data-storage]'));
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || busy) return;
      onAction(b.dataset.act, b.dataset.id);
    });
  });

  // ---------- Seite „Lizenzen“ ----------
  App.route('/lizenzen', (view) => {
    const list = [];
    const seen = new Set();
    const add = (c) => { if (c && c.name && !seen.has(c.name)) { seen.add(c.name); list.push(c); } };
    (window.PACK_CREDITS || []).forEach(add);
    (window.PACKS || []).forEach((p) => (p.credits || []).forEach(add));
    if (!list.some((c) => /kanjivg/i.test(c.name))) add({ name: 'KanjiVG', license: 'CC-BY-SA 3.0', url: 'https://kanjivg.tagaini.net' });
    view.innerHTML = `<div class="sec-settings"><div class="page-head"><div class="titles"><h1>Lizenzen <span class="jp-title">権利</span></h1>
      <p>Die Paket-Inhalte stammen aus freien Quellen. Die Paketdateien stehen unter CC-BY-SA 4.0 (Einzelheiten in packs/LIZENZEN.txt).</p></div>
      <a class="btn btn-sm" href="#/pakete">${icon('back')} Pakete</a></div>
      <div class="stack">${list.map((c) => `<div class="card"><div class="row between"><h3>${esc(c.name)}</h3><span class="badge">${esc(c.license || '')}</span></div>
        ${c.url ? `<p class="small"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url)}</a></p>` : ''}</div>`).join('')}</div></div>`;
  });
})(window.App);
