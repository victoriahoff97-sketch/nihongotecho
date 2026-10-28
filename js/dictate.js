/* Nihongo Techō – Diktieren: Spracherkennung des Browsers (Chrome, Edge, Safari) schreibt in ein Eingabefeld. Braucht Internet und das Mikrofon. */
'use strict';
(function (App) {
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const MSG = {
    'not-allowed': 'Das Mikrofon ist für diese Seite nicht erlaubt – bitte in den Browser-Einstellungen freigeben.',
    'service-not-allowed': 'Die Spracherkennung ist auf diesem Gerät ausgeschaltet (iPhone, iPad, Mac: „Diktierfunktion“ in den Einstellungen einschalten).',
    'no-speech': 'Nichts gehört – noch einmal antippen und sprechen.',
    'audio-capture': 'Kein Mikrofon gefunden.',
    network: 'Diktieren braucht Internet.',
    'language-not-supported': 'Diese Sprache kann der Browser hier nicht erkennen.',
  };
  let active = null; // { input, stop }
  const NO_SPEECH = 8000; // so lange darf nach dem Antippen nichts kommen
  const PAUSE = 2500;     // Sprechpause, nach der das Diktat endet
  const END_WAIT = 1200;  // so lange aufs Ende warten, dann abbrechen
  const SILENCE = 60000;  // langes Diktat: so lange ganz still, dann aus (hält sonst das Mikrofon besetzt)

  // Erkannter Text hinter dem, was schon im Feld steht; Japanisch ohne Leerzeichen (Safari trennt die Wörter)
  const joined = (before, text, lang) => {
    const t = /^ja/.test(lang) ? String(text).replace(/\s+/g, '') : String(text).trim();
    if (!t) return before;
    return before + (before && !/^ja/.test(lang) && !/\s$/.test(before) ? ' ' : '') + t;
  };

  // navigator.standalone gibt es nur bei Apple: true = vom Home-Bildschirm gestartet
  const homeScreenIos = () => !!window.navigator && window.navigator.standalone === true;
  // Chrome auf Android wiederholt im Dauerbetrieb (continuous) schon Erkanntes – dort Satz für Satz neu starten
  const android = () => !!window.navigator && /Android/i.test(window.navigator.userAgent || '');

  // Ziel des Diktats. Eingabefeld: Text hinter das, was schon drinsteht; danach change (Lesung, Übersetzung hängen daran).
  // Schreibfläche (contenteditable): Text an der Schreibmarke – sonst ans Ende, oder direkt hinter after –, danach input (dort wird gespeichert).
  // end() übernimmt den Text und gibt den neuen Textknoten zurück (dort geht ein langes Diktat weiter).
  const fieldTarget = (input, lang) => {
    const before = input.value;
    return {
      put: (text) => { input.value = joined(before, text, lang); },
      end: () => { if (input.value !== before && input.isConnected) input.dispatchEvent(new Event('change', { bubbles: true })); },
    };
  };
  const editTarget = (ed, lang, after) => {
    const sel = getSelection();
    let r = document.createRange();
    if (after && after.isConnected) { r.setStartAfter(after); r.collapse(true); } else if (sel.rangeCount && ed.contains(sel.anchorNode)) { r = sel.getRangeAt(0).cloneRange(); r.collapse(false); } else {
      const last = ed.lastElementChild && /^(P|DIV|H2|H3|LI)$/.test(ed.lastElementChild.tagName) ? ed.lastElementChild : ed;
      r.selectNodeContents(last); r.collapse(false);
    }
    // Zwischenstand sichtbar in einer eigenen Spanne; am Ende wird daraus normaler Text
    const span = document.createElement('span');
    span.className = 'dictating';
    r.insertNode(span);
    return {
      put: (text) => { span.textContent = joined('', text, lang); },
      end: () => {
        if (!span.isConnected) return null;
        if (!span.textContent) { span.remove(); return null; }
        const node = document.createTextNode(span.textContent);
        span.replaceWith(node);
        if (document.activeElement === ed) { const c = document.createRange(); c.setStartAfter(node); c.collapse(true); sel.removeAllRanges(); sel.addRange(c); }
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        return node;
      },
    };
  };

  App.dictate = {
    joined,
    supported: () => !!SR(),
    // Läuft gerade ein Diktat in dieses Feld, beenden (z. B. beim Verlassen der Seite).
    // now: was gerade im Feld steht, gilt – Nachzügler der Erkennung schreiben nicht mehr hinein (Prüfen, Absenden)
    stopFor: (input, { now = false } = {}) => { if (active && active.input === input) active.stop(now); },
    // Startet das Diktat ins Feld (input oder contenteditable); ein zweiter Aufruf fürs selbe Feld beendet es. btn bekommt solange die Klasse „active“.
    // long: bleibt an, bis man wieder antippt (Tagebuch: Zeit zum Überlegen) – erst nach SILENCE ganz ohne Sprache geht es von selbst aus.
    // Ohne long endet es nach einem Satz (Sprechpause). Ein .mic-label im Knopf zeigt solange „Fertig“.
    toggle: (input, btn, lang, { long = false } = {}) => {
      // iPad/iPhone, App vom Home-Bildschirm: die Spracherkennung startet dort, hört aber nichts und hält das Mikrofon besetzt –
      // stattdessen das Feld öffnen und aufs Mikrofon der Tastatur verweisen
      if (homeScreenIos()) {
        input.focus();
        return App.toast('In der App vom Home-Bildschirm diktiert das iPad nur über das Mikrofon auf der Tastatur' + (/^ja/.test(lang) ? ' (für Japanisch die japanische Tastatur wählen).' : '.'));
      }
      const was = active;
      if (was) { was.stop(); if (was.input === input) return; }
      const label = btn.querySelector && btn.querySelector('.mic-label');
      const labelText = label && label.textContent;
      let on = true, cut = false, tg = null, last = null, cur = null, idle = 0, fails = 0;
      // Bisher Erkanntes übernehmen; weiter geht es direkt dahinter
      const commit = () => { if (tg) { last = tg.end() || last; tg = null; } };
      const target = () => tg || (tg = input.isContentEditable ? editTarget(input, lang, last) : fieldTarget(input, lang));
      const off = () => {
        on = false;
        clearTimeout(idle);
        btn.classList.remove('active');
        if (label) label.textContent = labelText;
        if (active && active.input === input) active = null;
      };
      const stopAll = (now) => { on = false; if (now) cut = true; if (cur) cur.stop(); };
      const stillness = () => { clearTimeout(idle); idle = setTimeout(() => { App.toast('Diktieren ist aus – eine Minute lang nichts gehört.'); stopAll(); }, SILENCE); };

      // Eine Runde der Spracherkennung; im langen Diktat startet nach ihrem Ende gleich die nächste
      const round = () => {
        const rec = new (SR())();
        let done = false, timer = 0, from = 0, heard = false;
        const t0 = Date.now();
        // Abschluss genau einmal – auch wenn der Browser das Ende nie meldet
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          commit();
          if (!on || !long || !input.isConnected) return off(); // Feld verschwunden (Ansicht gewechselt): nicht weiter zuhören
          // Endet jede Runde sofort ohne Ergebnis, stimmt etwas nicht – nicht endlos neu starten
          fails = heard || Date.now() - t0 > 1500 ? 0 : fails + 1;
          if (fails >= 3) { App.toast('Diktieren hat nicht geklappt.'); return off(); }
          round();
        };
        // Safari (iPad, iPhone) hört nach einer Sprechpause nicht von selbst auf und meldet das Ende oft gar nicht:
        // nach Stille selbst beenden, und bleibt die Meldung aus, abbrechen und aufräumen
        const stop = () => {
          if (done) return;
          clearTimeout(timer);
          try { rec.stop(); } catch (e) { /* schon beendet */ }
          if (done) return;
          timer = setTimeout(() => { try { rec.abort(); } catch (e) { /* egal */ } finish(); }, END_WAIT);
        };
        rec.lang = lang;
        rec.interimResults = true;
        rec.continuous = long && !android();
        rec.onresult = (e) => {
          if (done || cut) return;
          if (!input.isConnected) { stopAll(true); return; }
          // Fertige Sätze gleich als Text übernehmen (wird gespeichert), der Rest bleibt Zwischenstand
          let fin = '', rest = '';
          for (let i = from; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal && !rest) { fin += t; from = i + 1; } else rest += t;
          }
          heard = true;
          if (fin) { target().put(fin); commit(); }
          if (rest || tg) target().put(rest);
          if (long) stillness();
          if (!rec.continuous) { clearTimeout(timer); timer = setTimeout(stop, PAUSE); }
        };
        rec.onerror = (e) => {
          if (done || e.error === 'aborted') return;
          if (long && e.error === 'no-speech') return; // langes Diktat: Stille ist erlaubt, die nächste Runde hört weiter zu
          App.toast(MSG[e.error] || 'Diktieren hat nicht geklappt (' + e.error + ').');
          if (long) { on = false; stop(); }
        };
        rec.onend = finish;
        try { rec.start(); } catch (e) { console.error(e); App.toast('Diktieren ließ sich nicht starten.'); return off(); }
        cur = { stop };
        if (!long) timer = setTimeout(() => { App.toast(MSG['no-speech']); stop(); }, NO_SPEECH);
      };

      active = { input, stop: stopAll };
      btn.classList.add('active');
      if (label) label.textContent = 'Fertig';
      round();
      if (long && on) stillness();
    },
  };
})(window.App);
