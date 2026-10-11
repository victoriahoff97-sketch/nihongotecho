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
  let active = null; // { rec, input }

  // Erkannter Text hinter dem, was schon im Feld steht; Japanisch ohne Leerzeichen (Safari trennt die Wörter)
  const joined = (before, text, lang) => {
    const t = /^ja/.test(lang) ? String(text).replace(/\s+/g, '') : String(text).trim();
    if (!t) return before;
    return before + (before && !/^ja/.test(lang) && !/\s$/.test(before) ? ' ' : '') + t;
  };

  App.dictate = {
    joined,
    supported: () => !!SR(),
    // Startet das Diktat ins Feld; ein zweiter Aufruf fürs selbe Feld beendet es. btn bekommt solange die Klasse „active“.
    toggle: (input, btn, lang) => {
      const was = active;
      if (was) { was.rec.stop(); if (was.input === input) return; }
      const rec = new (SR())();
      const before = input.value;
      let got = false;
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        input.value = joined(before, Array.from(e.results).map((r) => r[0].transcript).join(''), lang);
        got = input.value !== before;
      };
      rec.onerror = (e) => { if (e.error !== 'aborted') App.toast(MSG[e.error] || 'Diktieren hat nicht geklappt (' + e.error + ').'); };
      rec.onend = () => {
        btn.classList.remove('active');
        if (active && active.rec === rec) active = null;
        // wie getippt: Folgeschritte (Lesung, Übersetzung) hängen am change-Ereignis
        if (got && input.isConnected) input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      try { rec.start(); } catch (e) { console.error(e); return App.toast('Diktieren ließ sich nicht starten.'); }
      active = { rec, input };
      btn.classList.add('active');
    },
  };
})(window.App);
