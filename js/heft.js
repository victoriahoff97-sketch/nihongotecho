/* Nihongo Techō – eigene Notizbücher in der Bibliothek: ein Heft mit Kapiteln (je ein Notizblatt), zum Blättern wie das Kurs-Notizbuch.
   Heft = Eintrag { type: 'notebook', title, chapterIds }, Kapitel = Notizblatt-Datei mit bookId. */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const KL = App.kursbuchLogic;

  App.heftLink = (id) => '#/bibliothek/heft?id=' + encodeURIComponent(id);
  // Kapitel-Blätter verknüpfen Wörter wie Mitschriften – die Grammatik steht dann rechts im Inhaltsverzeichnis
  App.sheetHome((f) => (f.bookId ? { newDefaults: {} } : null));
  const chaptersOf = (book) => KL.bookChapters(book, Array.from(App.store.files.values()));
  const allBooks = () => App.itemsOf('notebook').sort((a, b) => (a.created || 0) - (b.created || 0));
  // Farbfamilie eines Hefts: eigene Wahl (book.color), sonst reihum wie die Karten in der Bibliothek
  const fallbackColor = (book) => KL.HEFT_ROW[Math.max(0, allBooks().indexOf(book)) % KL.HEFT_ROW.length];

  App.newHeft = async () => {
    const r = await App.ask('Neues Notizbuch', [{ label: 'Name', placeholder: 'z. B. Partikeln' }]);
    if (!r || !r[0]) return null;
    const book = await App.saveItem({ type: 'notebook', title: r[0], chapterIds: [] });
    App.go(App.heftLink(book.id));
    return book;
  };

  // Kapitel anlegen: Papier + Titel abfragen, hinten anhängen und gleich zum Schreiben öffnen
  const addChapter = async (book) => {
    const f = await App.newNotebook({ section: 'library', bookId: book.id, name: 'Kapitel ' + (chaptersOf(book).length + 1) }, { open: false });
    if (!f) return;
    book.chapterIds = chaptersOf(book).map((c) => c.id);
    await App.saveItem(book);
    App.ink.open(f.id, { afterClose: () => App.render(true) });
  };

  const rename = async (book) => {
    const r = await App.ask('Notizbuch umbenennen', [{ label: 'Name', value: book.title }]);
    if (!r || !r[0]) return;
    book.title = r[0];
    await App.saveItem(book);
    App.render(true);
  };

  const removeBook = async (book) => {
    const ch = chaptersOf(book);
    if (!(await App.confirm(`Notizbuch „${book.title}“ endgültig löschen?${ch.length ? ` Auch ${ch.length === 1 ? 'das Kapitel' : `alle ${ch.length} Kapitel`} mit allem, was du geschrieben hast.` : ''}`))) return;
    if (ch.length) await App.deleteFiles(ch.map((f) => f.id));
    await App.deleteItem(book.id);
    App.toast('Notizbuch gelöscht');
    App.go('#/bibliothek');
  };

  // Kapitel ordnen: umbenennen, mit ↑/↓ verschieben, löschen – gespeichert wird beim „Fertig“
  const arrange = (book) => {
    let list = chaptersOf(book).map((f) => ({ f, name: f.name }));
    let saved = false;
    const save = async () => {
      if (saved) return;
      saved = true;
      for (const c of list) { const n = c.name.trim(); if (n && n !== c.f.name) { c.f.name = n; await App.updateFile(c.f); } }
      book.chapterIds = list.map((c) => c.f.id);
      await App.saveItem(book);
    };
    // Schließen auf jedem Weg (Fertig, ✕, Escape – auch das Escape eines Lösch-Dialogs) behält die Änderungen
    const md = App.modal({ title: 'Kapitel ordnen', body: '<div class="heft-arrange" data-list></div>', foot: '<button class="btn btn-primary" data-ok>Fertig</button>', onClose: async () => { await save(); App.render(true); } });
    const box = md.el.querySelector('[data-list]');
    const draw = () => {
      box.innerHTML = list.length ? list.map((c, i) => `<div class="row heft-ch" data-i="${i}"><span class="kb-no">${i + 1}</span>
          <input class="input grow" data-name value="${esc(c.name)}">
          <button class="icon-btn sm" data-mv="-1" title="Nach oben"${i ? '' : ' disabled'}>↑</button><button class="icon-btn sm" data-mv="1" title="Nach unten"${i < list.length - 1 ? '' : ' disabled'}>↓</button>
          <button class="icon-btn sm" data-del title="Kapitel löschen">${icon('trash')}</button></div>`).join('') : '<p class="muted">Noch keine Kapitel.</p>';
    };
    box.addEventListener('input', (e) => { const r = e.target.closest('[data-i]'); if (r && e.target.matches('[data-name]')) list[+r.dataset.i].name = e.target.value; });
    box.addEventListener('click', async (e) => {
      const r = e.target.closest('[data-i]'), b = e.target.closest('button');
      if (!r || !b) return;
      const i = +r.dataset.i;
      if (b.dataset.mv) { const j = i + +b.dataset.mv; [list[i], list[j]] = [list[j], list[i]]; draw(); return; }
      if (b.hasAttribute('data-del')) {
        if (!(await App.confirm(`Kapitel „${list[i].name}“ endgültig löschen? Auch alles, was du darauf geschrieben hast.`))) return;
        await App.deleteFiles([list[i].f.id]);
        const gone = list.splice(i, 1)[0].f.id;
        book.chapterIds = (book.chapterIds || []).filter((id) => id !== gone);
        await App.saveItem(book);
        draw();
      }
    });
    md.el.querySelector('[data-ok]').onclick = () => md.close();
    draw();
  };

  const moreMenu = (book) => {
    const md = App.modal({ title: esc(book.title), body: `<div class="heft-menu">
        <button class="btn" data-a="rename">${icon('edit')} Umbenennen</button>
        <button class="btn" data-a="arrange">${icon('list')} Kapitel ordnen</button>
        <button class="btn btn-danger" data-a="delete">${icon('trash')} Notizbuch löschen</button></div>` });
    md.el.querySelector('.heft-menu').onclick = (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      md.close();
      ({ rename, arrange, delete: removeBook })[b.dataset.a](book);
    };
  };

  // Muss vor „/bibliothek/:x“-Routen angemeldet sein
  App.route('/bibliothek/heft', async (view, p, q) => {
    const book = App.item(q.id);
    const sec = App.SECTIONS.library;
    if (!book || book.type !== 'notebook') {
      view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/bibliothek">Bibliothek</a></div><div class="empty-state"><div class="big">帳</div><h3>Notizbuch nicht gefunden</h3><p>Vielleicht wurde es gelöscht.</p><a class="btn" href="#/bibliothek">Zur Bibliothek</a></div></div>`;
      return;
    }
    const chapters = chaptersOf(book);
    // Knöpfe im Kopf und im leeren Inhaltsverzeichnis: Delegation, weil das Buch die Ansicht asynchron aufbaut
    view.onclick = (e) => {
      const b = e.target.closest('[data-heft-add], [data-heft-more]');
      if (!b) return;
      if (b.hasAttribute('data-heft-add')) addChapter(book); else moreMenu(book);
    };
    App.onLeave(() => { view.onclick = null; });
    await App.kursbuch.mount(view, {
      cls: sec.cls + ' heft', bookTitle: book.title, spread: q.p,
      crumbs: `<div class="crumbs" style="margin:0"><a href="#/bibliothek">Bibliothek</a> › ${esc(book.title)}</div>`,
      sections: chapters.map((f) => ({ id: f.id, title: f.name || 'Kapitel', sub: '', sheets: [f] })),
      topics: (pages) => KL.topicsFromLinks(pages, (id) => (App.item(id) || {}).type === 'grammar'),
      href: (spread) => `${App.heftLink(book.id)}${spread ? '&p=' + spread : ''}`,
      texts: {
        jump: 'Zum Kapitel …', jumpTitle: 'Zu einem Kapitel blättern', topicsHead: 'Themen in diesem Heft', tabTitle: 'Kapitel zum Schreiben öffnen',
        emptySection: 'Noch keine Handschrift – öffnet das Kapitel',
      },
      openSection: (id, fileId, page) => App.ink.open(fileId || id, { page: (page || 0) + 1, afterClose: () => App.render(true) }),
      extraButtons: `<button class="btn btn-sm" data-heft-add>${icon('plus')} Kapitel</button><button class="btn btn-sm" data-heft-more title="Umbenennen, Kapitel ordnen, löschen">⋯</button>`,
      look: {
        fallback: fallbackColor(book),
        stored: () => ({ color: book.color, tabColors: book.tabColors, layout: book.layout }),
        save: (c) => {
          book.color = c.color; book.tabColors = c.tabColors;
          if (c.layout) book.layout = c.layout; else delete book.layout;
          return App.saveItem(book, { silent: true });
        },
      },
      emptyHtml: `<div class="heft-empty"><p class="kb-none">Noch keine Kapitel.</p><button type="button" class="btn btn-primary" data-heft-add>${icon('plus')} Erstes Kapitel anlegen</button></div>`,
    });
  });

  // Reihe „Meine Notizbücher“ über den Dateien der Bibliothek – auch ohne Heft, damit „＋ Neu“ immer zu finden ist
  App.heftRow = () => {
    const books = allBooks();
    return `<h3 class="heft-head">Meine Notizbücher</h3><div class="heft-row">${books.map((b, i) => {
      const n = chaptersOf(b).length, f = KL.family(b.color, KL.HEFT_ROW[i % KL.HEFT_ROW.length]);
      return `<a class="heft-card" style="--hc-cover:${f.cover};--hc-bg:${f.tabs[2]};--hc-line:${f.tabs[3]};--hc-ink:${f.ink}" href="${App.heftLink(b.id)}"><b>${esc(b.title)}</b><span>${n === 1 ? '1 Kapitel' : n + ' Kapitel'}</span></a>`; }).join('')}
      <button type="button" class="heft-card heft-new" data-heft-new title="Neues Notizbuch">${icon('plus')} Neu</button></div>`;
  };
})(window.App);
