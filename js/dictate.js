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
  let active = null; // { rec, input, stop }
  const NO_SPEECH = 8000; // so lange darf nach dem Antippen nichts kommen
  const PAUSE = 2500;     // Sprechpause, nach der das Diktat endet
  const END_WAIT = 1200;  // so lange aufs Ende warten, dann abbrechen

  // Erkannter Text hinter dem, was schon im Feld steht; Japanisch ohne Leerzeichen (Safari trennt die Wörter)
  const joined = (before, text, lang) => {
    const t = /^ja/.test(lang) ? String(text).replace(/\s+/g, '') : String(text).trim();
    if (!t) return before;
    return before + (before && !/^ja/.test(lang) && !/\s$/.test(before) ? ' ' : '') + t;
  };

  // navigator.standalone gibt es nur bei Apple: true = vom Home-Bildschirm gestartet
  const homeScreenIos = () => !!window.navigator && window.navigator.standalone === true;

  App.dictate = {
    joined,
    supported: () => !!SR(),
    // Startet das Diktat ins Feld; ein zweiter Aufruf fürs selbe Feld beendet es. btn bekommt solange die Klasse „active“.
    toggle: (input, btn, lang) => {
      // iPad/iPhone, App vom Home-Bildschirm: die Spracherkennung startet dort, hört aber nichts und hält das Mikrofon besetzt –
      // stattdessen das Feld öffnen und aufs Mikrofon der Tastatur verweisen
      if (homeScreenIos()) {
        input.focus();
        return App.toast('In der App vom Home-Bildschirm diktiert das iPad nur über das Mikrofon auf der Tastatur' + (/^ja/.test(lang) ? ' (für Japanisch die japanische Tastatur wählen).' : '.'));
      }
      const was = active;
      if (was) { was.stop(); if (was.input === input) return; }
      const rec = new (SR())();
      const before = input.value;
      let got = false, done = false, timer = 0;
      // Abschluss genau einmal – auch wenn der Browser das Ende nie meldet
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        btn.classList.remove('active');
        if (active && active.rec === rec) active = null;
        // wie getippt: Folgeschritte (Lesung, Übersetzung) hängen am change-Ereignis
        if (got && input.isConnected) input.dispatchEvent(new Event('change', { bubbles: true }));
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
      const quiet = (ms) => { clearTimeout(timer); timer = setTimeout(stop, ms); };
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        if (done) return;
        input.value = joined(before, Array.from(e.results).map((r) => r[0].transcript).join(''), lang);
        got = input.value !== before;
        quiet(PAUSE);
      };
      rec.onerror = (e) => { if (!done && e.error !== 'aborted') App.toast(MSG[e.error] || 'Diktieren hat nicht geklappt (' + e.error + ').'); };
      rec.onend = finish;
      try { rec.start(); } catch (e) { console.error(e); return App.toast('Diktieren ließ sich nicht starten.'); }
      active = { rec, input, stop };
      btn.classList.add('active');
      timer = setTimeout(() => { App.toast(MSG['no-speech']); stop(); }, NO_SPEECH);
    },
  };
})(window.App);
