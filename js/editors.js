/* Nihongo Techō – Formulare zum Anlegen/Bearbeiten und Mitschrift-Editor */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;

  const NOUN_CATS = [['ort', 'Ort/Gebäude'], ['land', 'Land/Stadt'], ['essen', 'Essen'], ['getraenk', 'Getränk'], ['person', 'Person/Beruf'], ['familie', 'Familie'], ['ding', 'Gegenstand'], ['lesestoff', 'Lesestoff'], ['medien', 'Film/Musik'], ['sport', 'Sport'], ['fach', 'Studienfach'], ['sprache', 'Sprache'], ['tier', 'Tier'], ['natur', 'Natur'], ['kleidung', 'Kleidung'], ['verkehr', 'Verkehrsmittel'], ['veranstaltung', 'Veranstaltung'], ['wetter', 'Wetter'], ['koerper', 'Körper']];
  const VERB_CATS = [['allein', 'ohne Objekt sinnvoll'], ['bewegung', 'Bewegung (gehen/kommen)'], ['objekt', 'mit を-Objekt']];
  const lastSrc = () => { try { return localStorage.getItem('nt-lastSource') || 'Genki I'; } catch (e) { return 'Genki I'; } };
  const setLastSrc = (s) => { try { localStorage.setItem('nt-lastSource', s); } catch (e) { /* egal */ } };

  const guessClass = (kana) => {
    if (/(する|くる)$/.test(kana)) return 'irr';
    if (!/る$/.test(kana)) return 'u';
    const EXC = ['かえる', 'はいる', 'しる', 'はしる', 'しゃべる', 'すべる', 'にぎる', 'へる', 'まいる', 'ける', 'かぎる', 'まじる'];
    if (EXC.some((x) => kana.endsWith(x))) return 'u';
    const prev = kana.slice(-2, -1);
    return /[いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ]/.test(prev) ? 'ru' : 'u';
  };
  const catChips = (list, sel, name) => `<div class="chips">${list.map(([v, l]) => `<label class="chip ${sel.includes(v) ? 'on' : ''}" style="cursor:pointer"><input type="checkbox" name="${name}" value="${v}" ${sel.includes(v) ? 'checked' : ''} hidden>${l}</label>`).join('')}</div>`;
  const bindChipToggles = (root) => root.addEventListener('change', (e) => { const c = e.target.closest('.chip input'); if (c) c.parentElement.classList.toggle('on', c.checked); });
  const val = (root, n) => { const el = root.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ''; };
  const checked = (root, n) => $$(`[name="${n}"]:checked`, root).map((x) => x.value);
  const tagsOf = (s) => s.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
  const autoNotate = (jp, reading) => {
    if (!jp || !reading || JP.hasNotation(jp) || !JP.hasKanji(jp)) return jp;
    const n = JP.notate(jp, reading);
    return n.startsWith('{') ? jp : n;
  };

  // Romaji → Kana live
  App.bindRomaji = (input, enabled = () => true) => {
    input.addEventListener('input', (e) => {
      if (!enabled() || e.isComposing) return;
      const pos = input.selectionStart;
      const before = input.value;
      const conv = JP.romaji(before, false);
      if (conv !== before) { input.value = conv; const d = before.length - conv.length; try { input.setSelectionRange(pos - d, pos - d); } catch (er) { /* egal */ } }
    });
    input.addEventListener('blur', () => { if (enabled()) input.value = JP.romaji(input.value, true); });
  };

  // ---------- Beispielsätze-Block ----------
  // data-en/data-had-de: englische Übersetzung (Paket) bleibt beim Speichern erhalten
  const exRow = (ex = {}) => `<div class="ex-row" data-en="${esc(ex.en || '')}" data-had-de="${ex.de ? '1' : ''}"><button type="button" class="icon-btn sm rm" data-rm-ex title="Entfernen">${icon('close')}</button>
      <input class="input jp-in" data-ex="jp" placeholder="Japanisch, z. B. 毎日ご飯を食べます。" value="${esc(ex.jp && JP.hasNotation(ex.jp) ? JP.plain(ex.jp) : ex.jp || '')}">
      <input class="input jp-in" data-ex="kana" placeholder="Lesung in Kana (optional – ergibt Furigana)" value="${esc(ex.kana || (ex.jp && JP.hasNotation(ex.jp) ? JP.kana(ex.jp) : ''))}">
      <input class="input" data-ex="de" placeholder="Deutsche Übersetzung" value="${esc(App.exMeaning(ex))}">
      <input class="input" data-ex="src" placeholder="Fundstelle (optional, z. B. NHK Easy 12.09.)" value="${esc(ex.src || '')}"></div>`;
  // suggest: Knopf „Satz vorschlagen“ (holt kurze Sätze zum Wort von Tatoeba, braucht Internet)
  const exBlock = (exs, suggest) => `<div class="field"><label>Beispielsätze</label><div class="stack" data-exs>${(exs && exs.length ? exs : [{}]).map(exRow).join('')}</div>
      <div class="row"><button type="button" class="btn btn-sm" data-add-ex>${icon('plus')} Beispielsatz</button>
        ${suggest ? `<button type="button" class="btn btn-sm" data-suggest-ex>${icon('sparkle')} Satz vorschlagen</button>` : ''}</div>
      ${suggest ? '<div class="sugg" data-sugg hidden></div>' : ''}</div>`;
  const bindEx = (root) => {
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-add-ex]')) { root.querySelector('[data-exs]').insertAdjacentHTML('beforeend', exRow()); App.hydrateIcons(root); }
      const rm = e.target.closest('[data-rm-ex]'); if (rm) rm.closest('.ex-row').remove();
    });
    if (root.querySelector('[data-sugg]')) bindSuggest(root);
  };

  // ---------- Satzvorschläge (Tatoeba) ----------
  const SUGG_N = 8;
  const bindSuggest = (root) => {
    const box = root.querySelector('[data-sugg]');
    let run = null; // laufende Suche: { search, shown: Map(id → Satz) }
    const row = (ex) => `<button type="button" class="sugg-row" data-take="${ex.id}"><span class="jp-s" lang="ja">${JP.ruby(ex.furi)}</span><span class="small muted">${esc(ex.de || ex.en)}</span></button>`;
    const foot = (html) => { box.querySelector('[data-sugg-foot]').innerHTML = html; };
    const load = async () => {
      const my = run;
      foot('<span class="small muted">Suche Sätze …</span>');
      let res;
      try { res = await my.search.more(SUGG_N); }
      catch (e) {
        if (my !== run) return;
        console.error(e);
        const offline = navigator.onLine === false || e instanceof TypeError;
        return foot(`<span class="small muted">${offline ? 'Keine Verbindung – Satzvorschläge brauchen Internet.' : 'Tatoeba ist gerade nicht erreichbar – später noch einmal versuchen.'}</span> <button type="button" class="btn btn-sm" data-sugg-more>Nochmal</button>`);
      }
      if (my !== run) return;
      res.list.forEach((ex) => my.shown.set(String(ex.id), ex));
      box.querySelector('[data-sugg-list]').insertAdjacentHTML('beforeend', res.list.map(row).join(''));
      if (!my.shown.size) return foot('<span class="small muted">Keine kurzen Sätze zu diesem Wort gefunden.</span>');
      foot(`${res.done ? '' : '<button type="button" class="btn btn-sm" data-sugg-more>Mehr laden</button>'}
        <span class="small muted">${res.lang === 'eng' ? 'Keine deutsche Übersetzung gefunden – englische Sätze. ' : ''}Antippen übernimmt den Satz · Quelle: <a href="https://tatoeba.org" target="_blank" rel="noopener">tatoeba.org</a> (CC BY 2.0 FR)</span>`);
    };
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-suggest-ex]')) {
        const word = val(root, 'kanji') || val(root, 'kana');
        if (!word) return App.toast('Erst das Wort eintragen (Kana oder Kanji)');
        run = { search: App.tatoeba.search(word, (u, o) => fetch(u, o)), shown: new Map() };
        box.hidden = false;
        box.innerHTML = `<div class="small"><b>Vorschläge für <span lang="ja">${esc(word)}</span></b></div><div class="sugg-list" data-sugg-list></div><div class="row" data-sugg-foot></div>`;
        load();
        return;
      }
      if (e.target.closest('[data-sugg-more]') && run) return load();
      const take = e.target.closest('[data-take]');
      if (take && run) {
        const ex = run.shown.get(take.dataset.take);
        if (!ex) return;
        const list = root.querySelector('[data-exs]');
        const empty = $$('.ex-row', list).find((r) => !r.querySelector('[data-ex="jp"]').value.trim());
        if (empty) empty.outerHTML = exRow(ex); else list.insertAdjacentHTML('beforeend', exRow(ex));
        App.hydrateIcons(list);
        take.remove();
      }
    });
  };
  const readEx = (root) => $$('.ex-row', root).map((r) => {
    const g = (k) => r.querySelector(`[data-ex="${k}"]`).value.trim();
    const jp = g('jp'), kana = g('kana');
    if (!jp) return null;
    const n = autoNotate(jp, kana);
    const t = g('de'), en = r.dataset.en || '';
    // unveränderte englische Vorbelegung nicht als Deutsch speichern
    const o = { jp: n, de: en && t === en && !r.dataset.hadDe ? '' : t };
    if (en) o.en = en;
    if (n === jp && kana) o.kana = kana;
    if (g('src')) o.src = g('src');
    return o;
  }).filter(Boolean);

  // ---------- Automatisch ausfüllen (Vokabel-Formular, aus dem Offline-Wörterbuch) ----------
  // Wörter, die üblicherweise in Kana geschrieben werden (packs/uk-index.js, erst bei Bedarf geladen)
  let ukIds = null;
  const usuallyKana = async (id) => {
    if (!ukIds) {
      try { await App.loadScript('packs/uk-index.js'); ukIds = new Set(String(window.UK_INDEX || '').split(',')); }
      catch (e) { console.error(e); return false; }
    }
    return ukIds.has(String(id));
  };
  const AF_MAX = 8, AF_DICT = 'dict-common';
  const bindAutofill = (root) => {
    const box = root.querySelector('[data-af]');
    const AL = App.autofillLogic;
    let hits = [], typed = {}, run = 0;
    // gängige Wörter zuerst: leichtes JLPT-Niveau, dann Einträge mit deutscher Bedeutung
    const LV = { N5: 6, N4: 5, N3: 4, N2: 3, N1: 2 };
    const bonus = (e) => (LV[App.jlptOf({ type: 'vocab', kanji: (e.k || [])[0] || '', kana: (e.r || [])[0] || '' })] || 0) + (e.de ? 1 : 0);
    const show = (html) => { box.hidden = false; box.innerHTML = html; App.hydrateIcons(box); };
    const hide = () => { box.hidden = true; box.innerHTML = ''; };
    const set = (name, v) => { const el = root.querySelector(`[name="${name}"]`); if (el) el.value = v; };
    const noExample = () => !$$('.ex-row [data-ex="jp"]', root).some((i) => i.value.trim());

    const apply = async (e) => {
      const my = ++run;
      const w = AL.wordForms(e, typed, await usuallyKana(e.id));
      if (my !== run || !root.isConnected) return;
      const mp = App.mapPos(e.p || [], w.kanji || w.kana);
      const acc = App.accentOf({ type: 'vocab', kana: w.kana, kanji: w.kanji, pos: val(root, 'pos') || mp.pos });
      const cur = {};
      ['de', 'en', 'pos', 'vcls', 'accent'].forEach((n) => { cur[n] = val(root, n); });
      const found = AL.fill(cur, { de: App.firstGloss(e.de), en: e.en || '', pos: mp.pos, vcls: mp.cls || '', accent: acc ? String(acc.main) : '' });
      set('kana', w.kana); set('kanji', w.kanji);
      Object.entries(found).forEach(([n, v]) => set(n, v));
      root.querySelector('[name=pos]').dispatchEvent(new Event('change'));
      const auto = root.querySelector('[name=jlpt] option[value=auto]');
      const lv = App.levelFor({ type: 'vocab', kana: w.kana, kanji: w.kanji });
      if (auto) auto.textContent = 'automatisch' + (lv ? ' (' + lv + ')' : '');
      App.toast(val(root, 'de') ? 'Aus dem Wörterbuch ausgefüllt' : 'Ausgefüllt – das Wörterbuch kennt hier nur die englische Bedeutung');
      // Beispielsatz: der kürzeste von Tatoeba, wenn noch keiner dasteht (braucht Internet; ohne bleibt das Feld leer)
      if (!noExample() || navigator.onLine === false) return hide();
      show('<span class="small muted">Suche einen Beispielsatz …</span>');
      let ex = null;
      try { ex = (await App.tatoeba.search(w.kanji || w.kana, (u, o) => fetch(u, o)).more(1)).list[0]; }
      catch (er) { console.error(er); }
      if (my !== run || !root.isConnected) return;
      hide();
      const empty = root.querySelector('[data-exs] .ex-row');
      if (ex && empty && noExample()) { empty.outerHTML = exRow(ex); App.hydrateIcons(root.querySelector('[data-exs]')); }
    };

    const hitRow = (e, i, uk) => {
      const w = AL.wordForms(e, typed, uk);
      return `<button type="button" class="sugg-row" data-af-pick="${i}"><span class="jp-s" lang="ja">${esc(w.kanji || w.kana)}${w.kanji ? ` <span class="small muted">${esc(w.kana)}</span>` : ''}</span><span class="small muted">${App.meaningHtml({ de: short(e.de), en: short(e.en) })}</span></button>`;
    };

    const start = async () => {
      typed = { kana: val(root, 'kana'), kanji: val(root, 'kanji') };
      const forms = [typed.kanji, typed.kana].filter(Boolean);
      if (!forms.length) return App.toast('Erst das Wort eintragen (Kana oder Kanji)');
      if (!App.dict.installed()) {
        const p = App.packById(AF_DICT);
        return show(`<span class="small">Zum Ausfüllen braucht die App das Offline-Wörterbuch${p && p.available ? ` (${Math.round(p.entries / 1000)}.000 häufige Wörter, etwa ${Math.round(p.sizeKB / 1024)} MB)` : ''}.</span>
          <div class="row">${p && p.available ? `<button type="button" class="btn btn-sm btn-sec" data-af-install>${icon('download')} Wörterbuch installieren</button>` : '<span class="small muted">Es lässt sich unter „Pakete“ installieren.</span>'}</div>`);
      }
      const my = ++run;
      show('<span class="small muted">Suche im Wörterbuch …</span>');
      const LL = App.lookupLogic;
      let direct = [], infl = [];
      try {
        for (const f of forms) {
          for (const list of (await App.dict.lookup(LL.dictForms(f))).values()) direct = direct.concat(list);
          // gebeugt getippt (たべます): über die Grundform suchen
          const cands = App.deinflect(f).filter((c) => c.type !== 'any');
          infl = infl.concat(LL.surfaceEntries(cands, await App.dict.lookup([...new Set(cands.map((c) => c.base))]), App.posMatches));
        }
      } catch (e) { console.error(e); if (my === run) show(`<span class="small muted">Das Wörterbuch konnte nicht gelesen werden: ${esc(e.message || e)}</span>`); return; }
      if (my !== run || !root.isConnected) return;
      hits = AL.rank(direct.length ? direct : infl, typed, bonus).slice(0, AF_MAX);
      if (!hits.length) return show(`<span class="small muted">Nichts im Wörterbuch gefunden – Schreibweise prüfen oder von Hand ausfüllen.</span>
        <div class="row"><a class="btn btn-sm btn-ghost" href="${esc(App.jishoUrl(forms[0]))}" target="_blank" rel="noopener">Auf Jisho suchen ↗</a></div>`);
      const one = AL.sure(hits, typed);
      if (one) return apply(one);
      const uk = await Promise.all(hits.map((e) => usuallyKana(e.id)));
      if (my !== run || !root.isConnected) return;
      show(`<div class="small"><b>Welches Wort meinst du?</b></div><div class="sugg-list">${hits.map((e, i) => hitRow(e, i, uk[i])).join('')}</div>`);
    };

    root.addEventListener('click', async (e) => {
      if (e.target.closest('[data-autofill]')) return start();
      const pick = e.target.closest('[data-af-pick]');
      if (pick) return apply(hits[+pick.dataset.afPick]);
      const inst = e.target.closest('[data-af-install]');
      if (inst) {
        inst.disabled = true;
        try {
          await App.dict.install(AF_DICT, (frac, text) => { if (inst.isConnected) inst.textContent = `${Math.round(frac * 100)} % – ${text}`; });
          if (root.isConnected) start();
        } catch (er) {
          console.error(er);
          if (box.isConnected) show(`<span class="small muted">Wörterbuch konnte nicht installiert werden: ${esc(er.message || er)}</span>`);
        }
      }
    });
  };

  // Englisch-Feld und JLPT-Niveau (auto = aus dem JLPT-Index, sonst manuell mit levelManual)
  const enLevelFields = (it) => {
    const cur = it.levelManual ? (it.level || 'ohne') : 'auto';
    const auto = App.levelFor(it);
    const opts = [['auto', 'automatisch' + (auto ? ' (' + auto + ')' : '')]].concat(App.JLPT_LEVELS.map((l) => [l, l]), [['ohne', 'ohne Niveau']]);
    return `<div class="two"><div class="field"><label>Englisch <small>z. B. aus einem JLPT-Paket</small></label><input class="input" name="en" value="${esc(it.en || '')}" placeholder="z. B. to eat"></div>
      <div class="field"><label>JLPT-Niveau</label><select class="input" name="jlpt">${opts.map(([k, l]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>`;
  };
  const readEnLevel = (root, it) => {
    const en = val(root, 'en');
    if (en) it.en = en; else delete it.en;
    const lv = val(root, 'jlpt') || 'auto';
    if (lv === 'auto') { delete it.levelManual; it.level = App.levelFor(it); } // saveItem bestimmt das Niveau erneut
    else { it.level = lv === 'ohne' ? '' : lv; it.levelManual = true; }
  };
  const commonFields = (it) => `<div class="three">
      <div class="field"><label>Quelle</label><select class="input" name="source">${App.sourceOptions(it.source ?? lastSrc())}</select></div>
      <div class="field"><label>Lektion / Kapitel</label><input class="input" name="lesson" value="${esc(it.lesson ?? '')}" placeholder="z. B. 3"></div>
      <div class="field"><label>Fundstelle / Link</label><input class="input" name="sourceRef" value="${esc(it.sourceRef || '')}" placeholder="URL oder Seite"></div></div>
    <div class="field"><label>Schlagwörter <small>mit Komma trennen</small></label><input class="input" name="tags" value="${esc((it.tags || []).join(', '))}" placeholder="z. B. essen, alltag"></div>`;
  const readCommon = (root, it) => {
    it.source = val(root, 'source');
    const l = val(root, 'lesson'); it.lesson = l === '' ? '' : (isNaN(+l) ? l : +l);
    it.sourceRef = val(root, 'sourceRef');
    it.tags = tagsOf(val(root, 'tags'));
    if (it.source) setLastSrc(it.source);
  };

  // ---------- Formulare je Typ ----------
  const FORMS = {};
  FORMS.vocab = {
    html: (it) => {
      const n = it.n || {}, v = it.v || {}, a = it.a || {};
      return `<div class="form">
      ${(it.contexts || []).length && !it._existing ? `<div class="ctx"><div class="small"><b>Kontext aus ${esc(it.contexts[0].label || 'deiner Mitschrift')}</b> – wird mit dem Wort gespeichert</div><div class="jp-s" lang="ja">${esc(it.contexts[0].text || '')}</div></div>` : ''}
      <div class="two"><div class="field"><label>Lesung (Kana) * <small><label><input type="checkbox" data-romaji checked> Romaji → かな</label></small></label>
        <input class="input jp-in" name="kana" value="${esc(it.kana || '')}" placeholder="z. B. taberu → たべる" autofocus></div>
      <div class="field"><label>Kanji-Schreibweise</label><input class="input jp-in" name="kanji" value="${esc(it.kanji || '')}" placeholder="z. B. 食べる"></div></div>
      <div class="row"><button type="button" class="btn btn-sm btn-sec" data-autofill>${icon('sparkle')} Automatisch ausfüllen</button>
        <span class="small muted">Wort eintippen – das Wörterbuch füllt die leeren Felder aus.</span></div>
      <div class="sugg" data-af hidden></div>
      <div class="two"><div class="field"><label>Deutsch *</label><input class="input" name="de" value="${esc(it.de || '')}" placeholder="z. B. essen / die Schule"></div>
      <div class="field"><label>Wortart</label><select class="input" name="pos"><option value="">–</option>${Object.entries(App.POS).map(([k, l]) => `<option value="${k}" ${it.pos === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      ${enLevelFields(it)}
      <div class="field"><label>Pitch Accent <small>0 = flach, 1 = Abfall nach der 1. More … · leer = automatisch</small></label><input class="input" name="accent" inputmode="numeric" style="max-width:120px" value="${esc(it.accent ?? '')}" placeholder="auto"></div>
      ${exBlock(it.examples, true)}
      ${commonFields(it)}
      <div class="field"><label>Eigene Notizen</label><textarea class="input" name="notes" rows="2">${esc(it.notes || '')}</textarea></div>
      ${!it._existing ? `<div class="field"><label>Lernstand</label><select class="input" name="check">${[['learn', '◐ In den Lernstapel (neues Wort)'], ['known', '● Kann ich schon']].map(([k, l]) => `<option value="${k}" ${(it._check || 'learn') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>` : ''}
      <details class="adv"><summary>${icon('sparkle')}&nbsp; Für den Übungsgenerator (optional)</summary>
        <div class="stack">
        <div class="hint">Mit diesen Angaben kann die App das Wort automatisch in Übersetzungsübungen einbauen. Das meiste wird automatisch erkannt.</div>
        <div data-p="noun" class="stack"><div class="field"><label>Kategorie</label>${catChips(NOUN_CATS, it.cat || [], 'ncat')}</div>
          <div class="three"><div class="field"><label>Deutsches Nomen (ohne Artikel)</label><input class="input" name="nw" value="${esc(n.w || '')}"></div>
          <div class="field"><label>Genus</label><select class="input" name="ng">${[['', 'automatisch'], ['m', 'der (m)'], ['f', 'die (f)'], ['n', 'das (n)'], ['pl', 'Plural'], ['0', 'ohne Artikel']].map(([k, l]) => `<option value="${k}" ${n.g === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label>Unzählbar?</label><label class="chip"><input type="checkbox" name="nmass" ${n.mass ? 'checked' : ''}> z. B. Kaffee, Wasser</label></div></div></div>
        <div data-p="verb" class="stack"><div class="field"><label>Art</label>${catChips(VERB_CATS, it.cat || [], 'vcat')}</div>
          <div class="three"><div class="field"><label>Verbklasse</label><select class="input" name="vcls">${[['', 'automatisch'], ['u', 'う-Verb (Godan)'], ['ru', 'る-Verb (Ichidan)'], ['irr', 'unregelmäßig']].map(([k, l]) => `<option value="${k}" ${v.cls === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label>Infinitiv</label><input class="input" name="vinf" value="${esc(v.inf || '')}" placeholder="essen"></div>
          <div class="field"><label>„ich …“</label><input class="input" name="vich" value="${esc(v.ich || '')}" placeholder="esse"></div></div>
          <div class="three"><div class="field"><label>Partizip II</label><input class="input" name="vpp" value="${esc(v.pp || '')}" placeholder="gegessen"></div>
          <div class="field"><label>Hilfsverb</label><select class="input" name="vaux"><option ${v.aux !== 'bin' ? 'selected' : ''}>habe</option><option ${v.aux === 'bin' ? 'selected' : ''}>bin</option></select></div>
          <div class="field"><label>Abtrennbares Präfix</label><input class="input" name="vsep" value="${esc(v.sep || '')}" placeholder="z. B. auf"></div></div>
          <div class="field"><label>Typische を-Objekte</label>${catChips(NOUN_CATS, v.obj || [], 'vobj')}</div></div>
        <div data-p="adj" class="stack"><div class="field"><label>Deutsches Adjektiv</label><input class="input" name="ade" value="${esc(a.de || '')}" placeholder="groß"></div>
          <div class="field"><label>Beschreibt typischerweise …</label>${catChips(NOUN_CATS, a.subj || [], 'asubj')}</div></div>
        <div data-p="time" class="stack"><div class="field"><label>Im deutschen Satz</label><input class="input" name="tadv" value="${esc((it.t || {}).adv || '')}" placeholder="z. B. morgen, am Montag"></div></div>
        </div></details></div>`;
    },
    bind: (root) => {
      bindEx(root); bindChipToggles(root);
      const kana = root.querySelector('[name=kana]');
      const rj = root.querySelector('[data-romaji]');
      App.bindRomaji(kana, () => rj.checked);
      const pos = root.querySelector('[name=pos]');
      const sync = () => $$('[data-p]', root).forEach((p) => { const v = pos.value; p.hidden = !(p.dataset.p === v || (p.dataset.p === 'adj' && /adj/.test(v))); });
      pos.onchange = sync; sync();
      bindAutofill(root);
      // Wortart raten
      kana.addEventListener('blur', () => {
        if (pos.value) return;
        const de = val(root, 'de');
        if (/^(der|die|das) /i.test(de)) pos.value = 'noun';
        else if (/(る|う|く|ぐ|す|つ|ぬ|ぶ|む)$/.test(kana.value) && /^[a-zäöüß]+(en|n)$/.test(de)) pos.value = 'verb';
        sync();
      });
      root.querySelector('[name=de]').addEventListener('blur', () => { if (!pos.value && /^(der|die|das) /i.test(val(root, 'de'))) { pos.value = 'noun'; sync(); } });
    },
    read: (root, it) => {
      it.kana = val(root, 'kana'); it.kanji = val(root, 'kanji'); it.de = val(root, 'de'); it.pos = val(root, 'pos');
      if (!it.kana && !it.kanji) throw new Error('Bitte die Lesung (Kana) oder Kanji eingeben.');
      if (!it.kana) it.kana = it.kanji;
      if (App.readAccent && root.querySelector('[name=accent]')) {
        const accent = App.readAccent(val(root, 'accent'), it.kana);
        if (accent === undefined) delete it.accent; else it.accent = accent;
      }
      readEnLevel(root, it);
      if (!it.de && !it.en) throw new Error('Bitte die deutsche (oder englische) Bedeutung eingeben.');
      it.examples = readEx(root);
      it.notes = val(root, 'notes');
      if (root.querySelector('[name=check]')) it._check = val(root, 'check');
      readCommon(root, it);
      delete it.n; delete it.v; delete it.a; delete it.t;
      if (it.pos === 'noun') {
        it.cat = checked(root, 'ncat');
        const auto = JP.nounDe({ de: it.de });
        it.n = { w: val(root, 'nw') || auto.w, g: val(root, 'ng') || auto.g, mass: root.querySelector('[name=nmass]').checked };
      } else if (it.pos === 'verb') {
        it.cat = checked(root, 'vcat');
        const inf = val(root, 'vinf') || it.de.split(/[,;(]/)[0].trim();
        const ich = val(root, 'vich') || inf.replace(/(e?n)$/, 'e');
        it.v = { cls: val(root, 'vcls') || guessClass(it.kana), inf, ich, pp: val(root, 'vpp') || ('ge' + inf.replace(/(e?n)$/, 't')), aux: val(root, 'vaux') || 'habe', sep: val(root, 'vsep'), obj: checked(root, 'vobj') };
        if (it.v.obj.length && !it.cat.includes('objekt')) it.cat.push('objekt');
      } else if (/adj/.test(it.pos)) {
        it.cat = ['beschreibung'];
        it.a = { de: val(root, 'ade') || it.de.split(/[,;(]/)[0].trim(), subj: checked(root, 'asubj') };
        if (!it.a.subj.length) it.a.subj = ['ding', 'ort', 'person', 'essen'];
      } else if (it.pos === 'time') {
        it.cat = ['zeitpunkt'];
        it.t = { adv: val(root, 'tadv') || it.de.split(/[,;(]/)[0].trim() };
      }
    },
  };
  FORMS.grammar = {
    html: (it) => `<div class="form">
      <div class="two"><div class="field"><label>Titel *</label><input class="input" name="title" value="${esc(it.title || '')}" placeholder="z. B. Wunsch mit 〜たい" autofocus></div>
      <div class="field"><label>Muster (Japanisch)</label><input class="input jp-in" name="jp" value="${esc(it.jp || '')}" placeholder="〜たいです"></div></div>
      <div class="field"><label>Kurz gesagt</label><input class="input" name="summary" value="${esc(it.summary || '')}" placeholder="Ein Satz, wofür man es braucht"></div>
      <div class="field"><label>Aufbau <small>eine Zeile pro Regel</small></label><textarea class="input jp-in" name="structure" rows="2" placeholder="Verbstamm + たいです">${esc((it.structure || []).join('\n'))}</textarea></div>
      <div class="field"><label>Erklärung <small>**fett**, *kursiv*, Listen mit „- “, Furigana: 漢字[かんじ]</small></label><textarea class="input" name="explanation" rows="7">${esc(it.explanation || '')}</textarea></div>
      ${exBlock(it.examples)}
      <div class="field"><label>Stolperfallen <small>eine pro Zeile</small></label><textarea class="input" name="pitfalls" rows="2">${esc((it.pitfalls || []).join('\n'))}</textarea></div>
      ${commonFields(it)}
      <details class="adv"><summary>${icon('sparkle')}&nbsp; Übungsmuster (für Fortgeschrittene)</summary>
        <div class="hint" style="margin-bottom:8px">JSON-Liste. Beispiel: <code>[{"slots":{"A":{"pos":"noun","cat":["ort"]}},"jp":"{A}へ行[い]きます。","de":"Ich gehe {A:zu}."}]</code> – Details in DATA-SPEC.md.</div>
        <textarea class="input" name="patterns" rows="5" style="font-family:Consolas,monospace;font-size:13px">${esc(it.patterns && it.patterns.length ? JSON.stringify(it.patterns, null, 1) : '')}</textarea></details></div>`,
    bind: (root) => bindEx(root),
    read: (root, it) => {
      it.title = val(root, 'title');
      if (!it.title) throw new Error('Bitte einen Titel eingeben.');
      it.jp = val(root, 'jp'); it.summary = val(root, 'summary');
      it.structure = val(root, 'structure').split('\n').map((s) => s.trim()).filter(Boolean);
      it.explanation = root.querySelector('[name=explanation]').value;
      it.examples = readEx(root);
      it.pitfalls = val(root, 'pitfalls').split('\n').map((s) => s.trim()).filter(Boolean);
      readCommon(root, it);
      const p = val(root, 'patterns');
      if (p) { try { it.patterns = JSON.parse(p); } catch (e) { throw new Error('Übungsmuster: ungültiges JSON – ' + e.message); } } else it.patterns = [];
    },
  };
  FORMS.kanji = {
    html: (it) => `<div class="form">
      <div class="three"><div class="field"><label>Kanji *</label><input class="input" name="char" maxlength="2" value="${esc(it.char || '')}" style="font-family:var(--font-kanji);font-size:30px;height:60px;text-align:center" autofocus></div>
      <div class="field" style="grid-column:span 2"><label>Deutsch *</label><input class="input" name="de" value="${esc(it.de || '')}" placeholder="z. B. Tag, Sonne"></div></div>
      ${enLevelFields(it)}
      <div class="three"><div class="field"><label>On-Lesungen <small>Katakana, mit Komma</small></label><input class="input jp-in" name="on" value="${esc((it.on || []).join(', '))}" placeholder="ニチ, ジツ"></div>
      <div class="field"><label>Kun-Lesungen <small>Hiragana</small></label><input class="input jp-in" name="kun" value="${esc((it.kun || []).join(', '))}" placeholder="ひ, か"></div>
      <div class="field"><label>Striche</label><input class="input" name="strokes" type="number" min="1" max="40" value="${esc(it.strokes || '')}"></div></div>
      <div class="field"><label>Beispielwörter <small>eine Zeile: 日本[にほん] = Japan</small></label><textarea class="input jp-in" name="words" rows="3">${esc((it.words || []).map((w) => `${w.jp} = ${App.meaning(w).text}`).join('\n'))}</textarea></div>
      <div class="field"><label>Eselsbrücke</label><input class="input" name="mnemonic" value="${esc(it.mnemonic || '')}"></div>
      <div class="field"><label>Markierungen</label>${catChips(App.kanjiMarks().map((m) => [esc(m), esc(m)]), (it.marks || []).map(esc), 'kmark')}</div>
      ${!it._existing ? `<div class="field"><label>Lernstand</label><select class="input" name="check">${[['learn', '◐ In den Lernstapel'], ['known', '● Kann ich schon']].map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>` : ''}
      ${commonFields(it)}
      <div class="card row between" style="box-shadow:none;background:var(--murasaki-soft);border-color:transparent;padding:12px 16px">
        <div><b>Strichfolge</b> <span class="small muted">(Quelle: KanjiVG)</span><div class="small" data-kvg-msg>Kanji oben eingeben …</div></div>
        <button type="button" class="btn btn-sm btn-sec" data-kvg-dl hidden>${icon('download')} Strichfolge herunterladen</button></div>
      <div class="hint">Eigene GIFs/Videos zur Strichfolge kannst du zusätzlich auf der Kanji-Seite hinzufügen.</div></div>`,
    bind: (root) => {
      const ch = root.querySelector('[name=char]');
      const msg = root.querySelector('[data-kvg-msg]');
      const btn = root.querySelector('[data-kvg-dl]');
      const strokes = root.querySelector('[name=strokes]');
      const check = async () => {
        const c = Array.from(ch.value.trim())[0] || '';
        btn.hidden = true;
        if (!c) { msg.textContent = 'Kanji oben eingeben …'; return; }
        const p = await App.stroke.get(c);
        if (p) { msg.innerHTML = `✓ vorhanden – ${p.length} Striche`; if (!strokes.value) strokes.value = p.length; }
        else { msg.textContent = 'Noch nicht gespeichert – zum Laden auf den Button tippen (Internet nötig).'; btn.hidden = false; }
      };
      ch.addEventListener('input', App.debounce(check, 250));
      btn.onclick = async () => { const c = Array.from(ch.value.trim())[0]; const r = await App.stroke.downloadInto(btn, c, msg); if (r.ok) check(); };
      check();
    },
    read: (root, it) => {
      it.char = val(root, 'char').slice(0, 1);
      if (!it.char) throw new Error('Bitte ein Kanji eingeben.');
      it.de = val(root, 'de');
      readEnLevel(root, it);
      if (!it.de && !it.en) throw new Error('Bitte die deutsche (oder englische) Bedeutung eingeben.');
      it.id = it.id || 'k-' + it.char.codePointAt(0).toString(16);
      if (!it._existing && App.item(it.id)) throw new Error('Dieses Kanji gibt es schon – öffne es und bearbeite es dort.');
      it.on = val(root, 'on').split(/[,、\s]+/).filter(Boolean).map(JP.toKata);
      it.kun = val(root, 'kun').split(/[,、\s]+/).filter(Boolean);
      it.strokes = +val(root, 'strokes') || (window.KVG && window.KVG[it.char] ? window.KVG[it.char].length : '');
      // Eingabe landet in de; englische Bedeutung bleibt erhalten (unverändertes Englisch wird nicht zu Deutsch)
      const oldW = new Map((it.words || []).map((w) => [w.jp, w]));
      it.words = val(root, 'words').split('\n').map((l) => {
        const [a, ...b] = l.split('=');
        if (!a || !a.trim()) return null;
        const jp = a.trim(), t = b.join('=').trim(), o = oldW.get(jp) || {};
        const w = { jp, de: o.en && !o.de && t === o.en ? '' : t };
        if (o.en) w.en = o.en;
        return w;
      }).filter(Boolean);
      it.mnemonic = val(root, 'mnemonic');
      it.marks = checked(root, 'kmark').map((m) => new DOMParser().parseFromString(m, 'text/html').documentElement.textContent);
      if (root.querySelector('[name=check]')) it._check = val(root, 'check');
      readCommon(root, it);
    },
  };
  FORMS.phrase = {
    html: (it) => {
      const groups = App.phraseGroups();
      if (it.group && !groups.includes(it.group)) groups.push(it.group);
      const cur = it.group || App.parseHash().query.g || groups[0] || '';
      return `<div class="form">
      <div class="field"><label>Gruppe *</label><select class="input" name="group">${groups.map((g) => `<option ${g === cur ? 'selected' : ''}>${esc(g)}</option>`).join('')}<option value="__new">＋ Neue Gruppe …</option></select></div>
      <div class="two"><div class="field"><label>Japanisch *</label><input class="input jp-in" name="jp" value="${esc(it.jp ? JP.plain(it.jp) : '')}" placeholder="月曜日"></div>
      <div class="field"><label>Lesung <small>ergibt Furigana</small></label><input class="input jp-in" name="kana" value="${esc(it.jp && JP.hasNotation(it.jp) ? JP.kana(it.jp) : '')}" placeholder="げつようび"></div></div>
      <div class="field"><label>Deutsch *</label><input class="input" name="de" value="${esc(it.de || '')}"></div>
      <div class="field"><label>Hinweis / Merkhilfe</label><input class="input" name="note" value="${esc(it.note || '')}"></div>
      ${commonFields(it)}</div>`;
    },
    bind: (root) => {
      const sel = root.querySelector('[name=group]');
      let last = sel.value;
      sel.addEventListener('change', async () => {
        if (sel.value !== '__new') { last = sel.value; return; }
        const g = await App.newPhraseGroup();
        if (!g) { sel.value = last; return; }
        if (![...sel.options].some((o) => o.value === g)) sel.insertBefore(new Option(g, g), sel.lastElementChild);
        sel.value = last = g;
      });
    },
    read: (root, it) => {
      it.group = val(root, 'group');
      if (!it.group || it.group === '__new') it.group = 'Sonstiges';
      const jp = val(root, 'jp'); const kana = val(root, 'kana');
      if (!jp) throw new Error('Bitte den japanischen Ausdruck eingeben.');
      it.jp = autoNotate(jp, kana);
      it.de = val(root, 'de'); it.note = val(root, 'note');
      if (!it.order) it.order = App.itemsOf('phrase').filter((p) => p.group === it.group).length + 1;
      readCommon(root, it);
    },
  };

  // ---------- Editor-Modal ----------
  // opts: {type, item, defaults, onSaved, title, single} – single: ohne „Speichern & weiter“ (z. B. Übernahme aus dem Wörterbuch)
  App.editItem = ({ type, item, defaults = {}, onSaved, title, single } = {}) => {
    const isNew = !item;
    const it = item ? JSON.parse(JSON.stringify(item)) : Object.assign({ type }, defaults);
    if (item) { it._existing = true; if (item._seed) { it._seed = true; } }
    type = it.type;
    const F = FORMS[type];
    const sec = App.SECTIONS[type];
    const body = document.createElement('div');
    body.className = sec.cls;
    body.innerHTML = F.html(it);
    const md = App.modal({
      title: title || (isNew ? `Neu: ${sec.one}` : `${sec.one} bearbeiten`), body, wide: type === 'grammar',
      foot: `${!isNew ? `<button class="btn btn-ghost btn-danger" data-del>${icon('trash')} Löschen</button>` : ''}<span class="grow"></span><button class="btn" data-no>Abbrechen</button>${isNew && !single ? '<button class="btn" data-ok-more>Speichern & weiter</button>' : ''}<button class="btn btn-primary" data-ok>${icon('check')} Speichern</button>`,
    });
    F.bind(body, it);
    const save = async (more) => {
      try {
        F.read(body, it);
        delete it._existing;
        const chk = it._check; delete it._check;
        if (type === 'kanji' && isNew) it.id = 'k-' + it.char.codePointAt(0).toString(16);
        const saved = await App.saveItem(it);
        if ((type === 'vocab' || type === 'kanji') && isNew && chk && chk !== 'unchecked') await App.setCheck(saved.id, chk);
        App.toast(isNew ? `${sec.one} gespeichert` : 'Änderungen gespeichert');
        onSaved && onSaved(saved);
        md.close();
        if (more) App.editItem({ type, defaults: Object.assign({}, defaults, { source: saved.source, lesson: saved.lesson, sourceRef: saved.sourceRef, tags: saved.tags, group: saved.group }), onSaved, title });
        else if (isNew && !onSaved) App.go(App.link(saved));
      } catch (e) { App.toast(e.message); }
    };
    md.el.querySelector('[data-ok]').onclick = () => save(false);
    const om = md.el.querySelector('[data-ok-more]'); if (om) om.onclick = () => save(true);
    md.el.querySelector('[data-no]').onclick = md.close;
    const del = md.el.querySelector('[data-del]');
    if (del) del.onclick = async () => {
      if (await App.confirm(`„${App.itemPlain(item)}“ wirklich löschen?`)) { await App.deleteItem(item.id); md.close(); App.toast('Gelöscht'); App.go(sec.route); }
    };
    return md;
  };

  // ---------- Wörterbuch-Treffer (Satzerkennung, Suche) ----------
  // h = {entry, surface?, base?}; der Eintrag selbst wird nie ein Lerneintrag – nur über „Als Vokabel übernehmen“ + Speichern
  const short = (s) => (s && s.length > 90 ? s.slice(0, 88).trim() + ' …' : s || '');
  App.dictHitHtml = (h, i) => {
    const e = h.entry;
    const d = App.dictVocabDefaults(e, [h.surface, h.base]);
    const w = d.kanji || d.kana;
    const inSent = h.surface && h.surface !== w && h.surface !== d.kana ? `<span class="small muted"> · im Text: <span lang="ja">${esc(h.surface)}</span></span>` : '';
    return `<div class="dict-hit row" style="gap:8px;flex-wrap:wrap;align-items:center;padding:6px 0;border-top:1px solid var(--line)">
      <span class="grow" style="min-width:180px"><b lang="ja" style="font-size:17px">${esc(w)}</b>${d.kanji ? ` <span lang="ja" class="small muted">${esc(d.kana)}</span>` : ''} ${App.levelBadge({ level: d.level })}${inSent}
        <div class="small" title="${esc(e.de || e.en || '')}">${App.meaningHtml({ de: short(e.de), en: short(e.en) })}</div></span>
      <button type="button" class="btn btn-sm btn-sec" data-adopt="${i}">${icon('plus')} Als Vokabel übernehmen</button>
      <a class="btn btn-sm btn-ghost" href="${esc(App.jishoUrl(h.base || h.surface || w))}" target="_blank" rel="noopener">Auf Jisho öffnen ↗</a></div>`;
  };
  // Öffnet den Vokabel-Editor vorbelegt mit dem Wörterbucheintrag; extra z. B. {examples, source}
  App.adoptDictEntry = (h, { extra, onSaved } = {}) => {
    const defaults = Object.assign(App.dictVocabDefaults(h.entry, [h.surface, h.base]), extra || {});
    return App.editItem({ type: 'vocab', defaults, onSaved, single: true, title: 'Vokabel aus dem Wörterbuch' });
  };

  // ---------- Schnell speichern (+) ----------
  App.quickAdd = (pre = {}) => {
    const { path } = App.parseHash();
    const guess = pre.type || (/grammatik/.test(path) ? 'grammar' : /kanji/.test(path) ? 'kanji' : /ausdruecke/.test(path) ? 'phrase' : /unterricht/.test(path) ? 'session' : /bibliothek/.test(path) ? 'file' : 'vocab');
    const types = [['vocab', '単', 'Vokabel', 'sec-vocab'], ['grammar', '文', 'Grammatik', 'sec-grammar'], ['kanji', '漢', 'Kanji', 'sec-kanji'], ['phrase', '表', 'Ausdruck', 'sec-phrase'], ['session', '授', 'Unterrichtsstunde', 'sec-session'], ['file', '資', 'Datei / Notizblatt', 'sec-library'], ['sentences', '例', 'Sätze aus Text', 'sec-vocab'], ['import', '入', 'Vokabel-Liste importieren', 'sec-vocab']];
    const body = `<div class="type-picker">${types.map(([k, j, l, c]) => `<button class="${c} ${k === guess ? 'on' : ''}" data-type="${k}"><span class="k">${j}</span>${l}</button>`).join('')}</div>
      <p class="muted small" style="margin:0">Tipp: Neues Wort bei NHK Easy gefunden? → „Vokabel“, Quelle „NHK Easy“ wählen und den Satz als Beispiel einfügen.</p>`;
    const md = App.modal({ title: 'Was möchtest du speichern?', body, foot: false });
    md.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-type]');
      if (!b) return;
      md.close();
      const t = b.dataset.type;
      if (t === 'file') {
        const m2 = App.modal({ title: 'Datei oder Notizblatt?', body: `<div class="grid cols-2"><button class="mode-card sec-library" data-f="up"><span class="k">資</span><h3>Datei hochladen</h3><span class="muted">PDF, Foto einer Buchseite, PowerPoint …</span></button>
          <button class="mode-card sec-library" data-f="nb"><span class="k">書</span><h3>Leeres Notizblatt</h3><span class="muted">Handschriftlich mit dem Stift – liniert, kariert oder Kanji-Raster</span></button></div>`, foot: false });
        m2.el.querySelector('[data-f=up]').onclick = () => { m2.close(); App.uploadDialog({ source: lastSrc() }); };
        m2.el.querySelector('[data-f=nb]').onclick = () => { m2.close(); App.newNotebook({ section: 'library' }); };
      } else if (t === 'session') App.editSession();
      else if (t === 'sentences') App.go('#/saetze');
      else if (t === 'import') App.importVocab();
      else App.editItem({ type: t, defaults: pre.defaults || {} });
    });
  };

  // Gespeichertes HTML (z. B. aus importierten Paketen) entschärfen: keine Skripte/Einbettungen, keine on*-Attribute,
  // keine javascript:-Links. Ruby, Markierungen, Verweis-Chips, Listen und Überschriften bleiben erhalten.
  const cleanHtml = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html || '';
    t.content.querySelectorAll('script, style, iframe, object, embed').forEach((n) => n.remove());
    t.content.querySelectorAll('*').forEach((el) => Array.from(el.attributes).forEach((a) => {
      const n = a.name.toLowerCase();
      if (n.startsWith('on') || (/^(href|src|xlink:href|action|formaction|data)$/.test(n) && /^javascript:/i.test(a.value.replace(/[\s\u0000-\u001f]+/g, '')))) el.removeAttribute(a.name);
    }));
    return t.innerHTML;
  };
  App.cleanHtml = cleanHtml;

  // ---------- Mitschrift-Editor (Rich Text) ----------
  // linkLabel (optional, z. B. 'mit dieser Antwort') ersetzt im Dialog „Wort gibt es schon“ die Stunden-Formulierung
  // onRefItem(it) (optional): nach dem Einfügen eines Verweis-Chips („Verlinken“) aufgerufen
  App.rte = (host, html, onSave, { placeholder = 'Hier mitschreiben …', onNewItem, onLinkItem, onRefItem, contextInfo, linkLabel } = {}) => {
    host.innerHTML = `<div class="editor-toolbar">
      <button class="icon-btn sm" data-cmd="h2" title="Überschrift">${icon('h')}</button>
      <button class="icon-btn sm" data-cmd="bold" title="Fett (Strg+B)">${icon('bold')}</button>
      <button class="icon-btn sm" data-cmd="italic" title="Kursiv">${icon('italic')}</button>
      <button class="icon-btn sm" data-cmd="underline" title="Unterstreichen">${icon('underline')}</button>
      <button class="icon-btn sm" data-cmd="mark" title="Markieren – landet in der Zusammenfassung">${icon('highlight')}</button>
      <span class="sep"></span>
      <button class="icon-btn sm" data-cmd="ul" title="Liste">${icon('ul')}</button>
      <button class="icon-btn sm" data-cmd="ol" title="Nummerierte Liste">${icon('ol')}</button>
      <button class="icon-btn sm" data-cmd="box" title="Merkkasten">${icon('box')}</button>
      <span class="sep"></span>
      <button class="icon-btn sm" data-cmd="ruby" title="Furigana über markiertes Kanji">${icon('ruby')}</button>
      <button class="icon-btn sm" data-cmd="ref" title="Eintrag verlinken (Grammatik, Vokabel …)">${icon('link')}</button>
      ${onNewItem ? `<button class="btn btn-sm" data-cmd="newvocab" title="Markierten Text als neue Vokabel speichern">${icon('plus')} Vokabel</button><button class="btn btn-sm" data-cmd="newgrammar">${icon('plus')} Grammatik</button>` : ''}
      <span class="grow"></span><span class="small muted" data-status></span></div>
      <div class="rte" contenteditable="true" spellcheck="false" data-placeholder="${esc(placeholder)}"></div>`;
    const ed = host.querySelector('.rte');
    const status = host.querySelector('[data-status]');
    ed.innerHTML = cleanHtml(html);
    const doSave = App.debounce(() => { onSave(ed.innerHTML); status.textContent = 'Gespeichert ✓'; }, 700);
    ed.addEventListener('input', () => { status.textContent = '…'; doSave(); });
    let savedRange = null;
    const keepSel = () => { const s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange(); };
    ed.addEventListener('keyup', keepSel); ed.addEventListener('mouseup', keepSel); ed.addEventListener('touchend', keepSel);
    document.addEventListener('selectionchange', keepSel);
    App.onLeave(() => document.removeEventListener('selectionchange', keepSel));
    const restore = () => { ed.focus(); if (savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); } };
    const insertHtml = (h) => { restore(); document.execCommand('insertHTML', false, h); doSave(); };
    host.querySelector('.editor-toolbar').addEventListener('pointerdown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    host.querySelector('.editor-toolbar').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-cmd]'); if (!b) return;
      const c = b.dataset.cmd;
      const selText = savedRange ? savedRange.toString() : '';
      restore();
      if (c === 'h2') document.execCommand('formatBlock', false, document.queryCommandValue('formatBlock') === 'h2' ? 'p' : 'h2');
      else if (c === 'bold' || c === 'italic' || c === 'underline') document.execCommand(c);
      else if (c === 'ul') document.execCommand('insertUnorderedList');
      else if (c === 'ol') document.execCommand('insertOrderedList');
      else if (c === 'mark') {
        const s = getSelection();
        const inMark = s.anchorNode && s.anchorNode.parentElement && s.anchorNode.parentElement.closest('mark');
        if (inMark) { inMark.replaceWith(...inMark.childNodes); } else if (selText) insertHtml(`<mark>${esc(selText)}</mark>`);
      } else if (c === 'box') insertHtml(`<div class="box">${esc(selText) || 'Merke: …'}</div><p><br></p>`);
      else if (c === 'ruby') {
        const base = selText || '';
        const r = await App.ask('Furigana einfügen', [{ label: 'Kanji', value: base, jp: true }, { label: 'Lesung (Romaji oder Kana)', jp: true }]);
        if (r && r[0] && r[1]) insertHtml(`<ruby>${esc(r[0])}<rt>${esc(JP.looksRomaji(r[1]) ? JP.romaji(r[1]) : r[1])}</rt></ruby>&nbsp;`);
      } else if (c === 'ref') {
        const ids = await App.pickItems({ title: 'Eintrag verlinken', single: true, types: ['grammar', 'vocab', 'kanji', 'phrase'] });
        if (ids && ids[0]) {
          const it = App.item(ids[0]);
          insertHtml(`<a class="ref" href="${App.link(it)}" data-ref="${it.id}" contenteditable="false">${esc(App.itemPlain(it))}</a>&nbsp;`);
          if (onRefItem) await onRefItem(it);
        }
      } else if (c === 'newvocab') newVocab();
      else if (c === 'newgrammar') {
        onNewItem('grammar', { title: selText.trim() }, (it) => {
          if (selText) insertHtml(`<a class="ref" href="${App.link(it)}" data-ref="${it.id}" contenteditable="false">${esc(App.itemPlain(it))}</a>&nbsp;`);
        });
      }
      doSave();
    });

    // ---- Markiertes Wort → Vokabel (mit Kontext aus der Mitschrift) ----
    const refHtml = (it) => `<a class="ref" href="${App.link(it)}" data-ref="${it.id}" contenteditable="false">${esc(App.itemPlain(it))}</a>&nbsp;`;
    const contextOf = (range, word) => {
      let node = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
      let block = node.closest('p, li, h2, h3, td, blockquote, .box, div');
      if (!block || !ed.contains(block)) block = ed;
      const pre = document.createRange();
      pre.selectNodeContents(block);
      pre.setEnd(range.startContainer, range.startOffset);
      const text = block.textContent;
      const off = pre.toString().length;
      let a = off; while (a > 0 && !/[。！？!?\n]/.test(text[a - 1])) a--;
      let b = off + word.length; while (b < text.length && !/[。！？!?\n]/.test(text[b])) b++;
      if (b < text.length && /[。！？!?]/.test(text[b])) b++;
      const line = text.slice(a, b).trim();
      const after = text.slice(off + word.length);
      const reading = (after.match(/^\s*[（(]\s*([぀-ヿー]+)\s*[）)]/) || [])[1] || '';
      const deM = after.match(/^[^=＝:：–—\-]{0,20}[=＝:：–—\-]\s*([A-Za-zÄÖÜäöüß][^。\n;()（）]{0,60})/);
      const de = deM ? deM[1].trim().replace(/[.,]$/, '') : '';
      // Satz als Beispiel nur, wenn er überwiegend Japanisch ist
      const exText = line.replace(/[（(][぀-ヿー\s]+[）)]/g, '').replace(/\s*[=＝:：–—]\s*[A-Za-zÄÖÜäöüß].*$/, '').trim();
      const jpChars = (exText.match(/[぀-ヿ㐀-鿿]/g) || []).length;
      const latin = (exText.match(/[A-Za-zÄÖÜäöüß]/g) || []).length;
      const isSentence = jpChars >= word.length + 3 && latin <= jpChars / 3;
      return { line, reading, de, example: isSentence ? exText : '' };
    };
    const findExisting = (w) => {
      const h = JP.toHira(w);
      return App.itemsOf('vocab').find((v) => v.kanji === w || v.kana === w || (!v.kanji && JP.toHira(v.kana) === h));
    };
    const newVocab = async () => {
      const range = savedRange ? savedRange.cloneRange() : null;
      const word = range ? range.toString().trim() : '';
      if (!word) return App.toast('Markiere zuerst das neue Wort in deiner Mitschrift');
      const cx = contextOf(range, range.toString());
      const base = contextInfo ? contextInfo() : {};
      const ctx = Object.assign({}, base, { text: cx.line, date: base.date || App.today() });
      const replaceSel = (it) => { savedRange = range; insertHtml(refHtml(it)); };
      const ex = findExisting(word);
      if (ex) {
        const md = App.modal({
          title: 'Dieses Wort gibt es schon', body: `<div class="card sec-vocab row between"><div><div lang="ja" style="font-size:28px">${JP.wordRuby(ex)}</div><b>${App.meaningHtml(ex)}</b></div>${App.srcBadge(ex)}</div>
            <p class="muted small">${linkLabel ? `Du kannst es ${esc(linkLabel)} verknüpfen – der Satz wird als Kontext gespeichert.` : 'Du kannst es mit dieser Stunde verknüpfen – der Satz aus deiner Mitschrift wird als Kontext gespeichert.'}</p>`,
          foot: `<button class="btn" data-rte-new>Trotzdem neu anlegen</button><span class="grow"></span><button class="btn btn-primary" data-link>${icon('link')} ${linkLabel ? esc(linkLabel[0].toUpperCase() + linkLabel.slice(1)) + ' verknüpfen' : 'Mit Stunde verknüpfen'}</button>`,
        });
        md.el.querySelector('[data-link]').onclick = async () => { md.close(); if (onLinkItem) await onLinkItem(ex, ctx); replaceSel(ex); App.toast('Verknüpft – Kontext gespeichert'); };
        md.el.querySelector('[data-rte-new]').onclick = () => { md.close(); create(); };
        return;
      }
      create();
      function create() {
        const d = JP.hasKanji(word) ? { kanji: word, kana: cx.reading } : { kana: word };
        if (cx.de) d.de = cx.de;
        d.contexts = [ctx];
        if (cx.example) d.examples = [{ jp: cx.example, de: '', src: ctx.label || '' }];
        if (ctx.label) d.sourceRef = ctx.label;
        d._check = 'learn';
        onNewItem('vocab', d, (it) => replaceSel(it));
      }
    };

    // ---- Schwebende Leiste über markiertem Text (gut für Stift/Touch) ----
    if (onNewItem) {
      const bar = document.createElement('div');
      bar.className = 'sel-bar';
      bar.hidden = true;
      bar.innerHTML = `<button data-b="vocab">${icon('plus')} Vokabel</button><button data-b="mark">${icon('highlight')} Markieren</button><button data-b="ref">${icon('link')} Verlinken</button>`;
      document.body.appendChild(bar);
      App.onLeave(() => bar.remove());
      bar.addEventListener('pointerdown', (e) => e.preventDefault());
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-b]'); if (!b) return;
        bar.hidden = true;
        if (b.dataset.b === 'vocab') newVocab();
        else host.querySelector(`.editor-toolbar [data-cmd="${b.dataset.b}"]`).click();
      });
      const place = App.debounce(() => {
        const s = getSelection();
        if (!s.rangeCount || s.isCollapsed || !ed.contains(s.anchorNode) || !s.toString().trim() || s.toString().length > 40) { bar.hidden = true; return; }
        const r = s.getRangeAt(0).getBoundingClientRect();
        bar.style.left = App.clamp(r.left + r.width / 2, 120, window.innerWidth - 120) + 'px';
        bar.style.top = Math.max(70, r.top - 8) + 'px';
        bar.hidden = false;
      }, 180);
      document.addEventListener('selectionchange', place);
      window.addEventListener('scroll', () => { bar.hidden = true; }, { passive: true });
      App.onLeave(() => document.removeEventListener('selectionchange', place));
    }
    // Links im Editor per Klick öffnen
    ed.addEventListener('click', (e) => { const a = e.target.closest('a.ref'); if (a) { e.preventDefault(); App.go(a.getAttribute('href')); } });
    return ed;
  };
})(window.App);
