/* Nihongo Techō – Üben: Umformen (einen Grammatikpunkt gezielt üben, z. B. 〜んです: höflicher Satz → んです-Satz, automatisch geprüft) */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const D = App.drillLogic;
  const N = 10;
  const HOW = { ndesu: 'Schreib den Satz mit 〜んです.' };
  const wordOf = (it) => it.kanji || it.kana || '';

  App.route('/ueben/umformen', (view, p, q) => {
    const g = q.g ? App.item(q.g) : null;
    const kind = g && D.field(g, 'drill');
    const head = `<div class="crumbs">${App.backCrumb()} › Umformen</div>
      <div class="page-head"><div class="titles"><h1>Umformen üben <span class="jp-title">練習</span></h1><p>${g ? `<a href="${App.link(g)}">${esc(g.title)}</a> · ` : ''}Nur mit Wörtern, die du schon kannst. An deinem Lernstand ändert das nichts.</p></div></div>`;
    const page = (body) => { view.innerHTML = `<div class="sec-grammar ${App.furiClass()}">${head}${body}</div>`; };
    if (!kind || !HOW[kind]) return page(`<div class="card muted">Für diesen Grammatikpunkt gibt es noch keine Umform-Aufgaben.</div><div class="row" style="margin-top:12px">${App.backBtn()}</div>`);

    const words = App.itemsOf('vocab');
    const known = (it) => App.vocabStatus(it.id) === 'known';
    const make = () => D.round({ words, known, n: N });
    if (!make().length) return page(`<div class="card"><div class="stack"><div>Für diese Übung brauchst du Verben, Adjektive oder Nomen auf „kann ich“ – noch steht keines darauf.</div>
      <div class="small muted">Wörter kommen auf „kann ich“, wenn du sie einstufst oder in der Lernschlange sicher weißt.</div>
      <div class="row"><a class="btn" href="#/lernweg">So läuft das Lernen</a>${App.backBtn()}</div></div></div>`);

    page(`<div class="card" data-setup><div class="stack"><div>${esc(HOW[kind])} Mal ein Verb, mal ein Adjektiv oder Nomen, mal als Frage – ${N} Aufgaben, die App prüft selbst.</div>
      <div class="row"><button class="btn btn-primary" data-go>${icon('sparkle')} Runde starten</button></div></div></div><div data-stage></div>`);
    const stage = view.querySelector('[data-stage]');
    const start = () => { view.querySelector('[data-setup]').hidden = true; run(stage, make(), kind, start); };
    view.querySelector('[data-go]').onclick = start;
  });

  // Eine Runde: falsch Beantwortetes kommt am Ende genau einmal wieder; gezählt wird nur der erste Versuch
  function run(stage, tasks, kind, again) {
    const total = tasks.length;
    const list = tasks.map((t) => ({ t, retry: false }));
    const missed = [];
    let i = 0, right = 0;
    const show = () => {
      if (i >= list.length) {
        stage.innerHTML = `<div class="ex-card"><div class="card pad-lg" style="text-align:center"><div class="score-ring">${right} / ${total}</div>
          <h2>${right === total ? '完璧！ Perfekt!' : right > total / 2 ? 'よくできました！' : 'がんばって！ Dranbleiben!'}</h2>
          ${missed.length ? `<div class="section-title">Zum Wiederholen</div><div class="stack" style="text-align:left">${missed.map((t) => `<div class="example"><div class="grow"><div class="jp-s" lang="ja">${JP.ruby(t.prompt)} → ${JP.ruby(t.solution)}</div></div></div>`).join('')}</div>` : ''}
          <div class="row" style="justify-content:center;margin-top:16px">${App.backBtn('Übersicht')}<button class="btn btn-primary" data-again>Neue Runde</button></div></div></div>`;
        stage.querySelector('[data-again]').onclick = again;
        return;
      }
      const { t, retry } = list[i];
      stage.innerHTML = `<div class="ex-card ${App.furiClass()}"><div class="row between small muted" style="margin-bottom:8px"><span>Aufgabe ${i + 1} / ${list.length}</span>${retry ? '<span>Noch einmal</span>' : ''}</div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${(i / list.length) * 100}%"></i></div>
        <div class="card pad-lg">
          <div class="small muted">${esc(HOW[kind])}</div>
          <div class="ex-prompt jp" lang="ja">${JP.ruby(t.prompt)} ${App.speakBtn(t.prompt)}</div>
          <div class="small muted" style="margin:-4px 0 8px"><span lang="ja">${esc(wordOf(t.word))}</span> = ${esc(t.word.de || '')}</div>
          <input class="input answer-in" placeholder="Antwort (Romaji wird zu かな)" autocomplete="off" autocapitalize="off" spellcheck="false">
          <div class="row" style="margin-top:8px"><label class="small row" style="gap:6px"><input type="checkbox" data-rj checked> Romaji → かな</label><button class="btn btn-sm btn-ghost" data-hand>${icon('pen')} Mit Stift schreiben</button></div><div data-handpad hidden style="margin-top:10px"></div>
          <div class="row" style="margin-top:14px"><button class="btn btn-primary" data-check>${icon('check')} Prüfen</button><button class="btn btn-ghost" data-skip>Lösung zeigen</button></div>
          <div data-sol></div></div></div>`;
      const inp = stage.querySelector('.answer-in');
      const rj = stage.querySelector('[data-rj]');
      App.bindRomaji(inp, () => rj.checked);
      stage.querySelector('[data-hand]').onclick = () => { const h = stage.querySelector('[data-handpad]'); h.hidden = !h.hidden; if (!h.hidden && !h.dataset.init) { h.dataset.init = 1; App.stroke.pad(h, null, { template: false }); } };
      setTimeout(() => inp.focus(), 50);
      let done = false;
      const finish = (r) => {
        done = true;
        const ok = !!(r && r.ok);
        if (ok && !retry) right++;
        if (!ok) { if (!missed.includes(t)) missed.push(t); if (!retry) list.push({ t, retry: true }); }
        stage.querySelector('[data-sol]').innerHTML = `<div class="solution">${r ? App.answerVerdictHtml(r) : ''}
          <div class="small muted" style="margin-top:8px">Lösung</div><div class="sol-jp" lang="ja">${JP.ruby(t.solution)} ${App.speakBtn(t.solution)}</div>
          ${!ok && !retry ? '<div class="small muted">Kommt am Ende der Runde noch einmal.</div>' : ''}
          <div class="row" style="margin-top:14px"><button class="btn btn-primary" data-next>Weiter ${icon('next')}</button></div></div>`;
        stage.querySelector('[data-check]').hidden = true;
        stage.querySelector('[data-skip]').hidden = true;
        stage.querySelector('[data-next]').onclick = () => { i++; show(); };
      };
      const check = () => {
        if (done) return;
        const r = D.sameAnswer(inp.value, [t.solution], App.kanjiReadings());
        if (!r) return inp.focus(); // leer: nichts prüfen
        finish(r);
      };
      stage.querySelector('[data-check]').onclick = check;
      stage.querySelector('[data-skip]').onclick = () => { if (!done) finish(null); };
      inp.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter' || ev.shiftKey || ev.isComposing) return;
        ev.preventDefault();
        if (!done) check(); else { i++; show(); }
      });
    };
    show();
  }
})(window.App);
