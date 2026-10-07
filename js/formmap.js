/* Nihongo Techō – Lernlandkarte: Verb- und Adjektivformen als Streckenplan */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const F = App.formMap;
  const STATUS_LABEL = { done: 'Kann ich', next: 'Als Nächstes dran', later: 'Kommt später' };
  const known = () => App.store.settings.formsKnown;

  // Eine Karte als SVG: erst die Strecken, darüber die Stationen mit Beschriftung
  const mapSvg = (map) => {
    const forms = F.formsOf(map.id);
    const k = known();
    const st = new Map(forms.map((f) => [f.id, F.status(f, k)]));
    const track = (d, color, done) => `<path class="fm-track ${done ? '' : 'ahead'}" d="${d}" style="stroke:${color}"/>`;
    let tracks = '';
    forms.forEach((f) => {
      // Startstation: kurzes gemeinsames Stück, von dessen Ende die Linien abgehen
      if (f.out) tracks += track(F.path(f.x, f.y, f.x + f.out, f.y), F.LINES.start.color, st.get(f.id) === 'done');
      f.from.forEach((pid) => {
        const p = F.form(pid);
        tracks += track(F.path(p.x + (p.out || 0), p.y, f.x, f.y), F.LINES[f.line].color, st.get(f.id) === 'done');
      });
    });
    const stations = forms.map((f) => {
      const s = st.get(f.id);
      const r = s === 'next' ? 12 : s === 'done' ? 10 : 8;
      const sample = JP.plain(F.example(f, F.sampleWord(f)).to);
      return `<g class="fm-station ${s}" data-form="${f.id}" tabindex="0" role="button" aria-label="${esc(f.label)} – ${STATUS_LABEL[s]}" style="--c:${F.LINES[f.line].color}">
        <rect class="fm-hit" x="${f.x - 58}" y="${f.y - 20}" width="116" height="66" rx="12"/>
        <circle class="fm-dot" cx="${f.x}" cy="${f.y}" r="${r}"/>
        ${s === 'done' ? `<path class="fm-check" d="M${f.x - 4.5} ${f.y + 0.5} l3 3 l6 -7"/>` : ''}
        <text class="fm-name" x="${f.x}" y="${f.y + 29}">${esc(f.label)}</text>
        <text class="fm-ex" x="${f.x}" y="${f.y + 46}" lang="ja">${esc(sample)}</text></g>`;
    }).join('');
    return `<svg class="fm-svg" viewBox="0 0 ${map.w} ${map.h}" role="group" aria-label="Streckenplan ${esc(map.title)}">${tracks}${stations}</svg>`;
  };

  // Fenster einer Station: Regel, Beispiele aus den eigenen Vokabeln, Abhaken, Link zur Grammatik
  const openForm = (id) => {
    const f = F.form(id);
    if (!f) return;
    const s = F.status(f, known());
    const prev = f.from.map(F.form);
    const g = App.item(f.grammar);
    const rows = F.samples(f, App.itemsOf('vocab')).map((w) => {
      const ex = F.example(f, w);
      return `<div class="fm-row"><span class="jp" lang="ja">${ex.from ? `${JP.ruby(ex.from)} <span class="fm-arrow">→</span> ` : ''}<b>${JP.ruby(ex.to)}</b></span><span class="small muted">${esc(w.de || w.en || '')}</span></div>`;
    }).join('');
    const md = App.modal({
      title: `${esc(f.label)} <span class="badge fm-badge ${s}">${STATUS_LABEL[s]}</span>`,
      body: `<div class="stack">
        ${prev.length ? `<div class="small muted">Leitest du ab aus: ${prev.map((p) => `<b>${esc(p.label)}</b>`).join(', ')}</div>` : ''}
        <p style="margin:0">${esc(f.rule)}</p>
        <div class="fm-rows">${rows}</div>
        ${s === 'later' ? `<div class="small muted">Dafür fehlt dir noch: ${prev.filter((p) => F.status(p, known()) !== 'done').map((p) => esc(p.label)).join(', ')}.</div>` : ''}
      </div>`,
      foot: `${g ? `<a class="btn" href="${App.link(g)}" data-grammar>${icon('grammar')} Grammatik öffnen</a>` : ''}
        <button class="btn ${s === 'done' ? '' : 'btn-primary'}" data-toggle>${icon('check')} ${s === 'done' ? 'Doch noch nicht' : 'Kann ich'}</button>`,
    });
    md.el.querySelector('[data-toggle]').onclick = async () => {
      md.close();
      await App.saveSettings({ formsKnown: F.toggle(known(), id) });
    };
    const ga = md.el.querySelector('[data-grammar]');
    if (ga) ga.onclick = () => md.close();
  };

  App.route('/karte', (view) => {
    const legend = `<div class="fm-legend small muted">
      <span><svg viewBox="0 0 34 12" width="34" height="12"><path class="fm-track" d="M2 6 L32 6" style="stroke:var(--muted)"/></svg> Geschafft</span>
      <span><svg viewBox="0 0 34 12" width="34" height="12"><path class="fm-track ahead" d="M2 6 L32 6" style="stroke:var(--muted)"/></svg> Liegt noch vor dir</span>
      <span><svg viewBox="0 0 26 26" width="18" height="18" class="fm-station next"><circle class="fm-dot" cx="13" cy="13" r="11"/></svg> Als Nächstes dran</span></div>`;
    view.innerHTML = `<div class="sec-grammar"><div class="page-head"><div class="titles"><h1>Lernlandkarte <span class="jp-title">地図</span></h1><p>Wie die Formen auseinander hervorgehen: Wer eine Station kann, erreicht von dort die nächste. Tippe eine Station an, um die Regel zu sehen und sie abzuhaken.</p></div></div>
      ${F.MAPS.map((m) => { const p = F.progress(m.id, known()); return `<div class="section-title">${esc(m.title)} <span class="badge">${p.done} von ${p.total} Formen</span></div>
        <div class="card fm-card"><div class="fm-scroll">${mapSvg(m)}</div></div>`; }).join('')}
      ${legend}</div>`;
    view.querySelectorAll('[data-form]').forEach((el) => {
      el.addEventListener('click', () => openForm(el.dataset.form));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openForm(el.dataset.form); } });
    });
  });
})(window.App);
