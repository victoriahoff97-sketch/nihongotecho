/* Nihongo Techō – Handschrift-Dienst: einmalige Zustimmung und Abruf der Vorschläge (Lasso „Erkennen“ und Schreibfeld im Nachschlagen-Fenster) */
'use strict';
(function (App) {
  const HW = App.hwLogic;
  const fetchLang = async (strokes, lang, max) => {
    const r = await fetch(HW.HW_URL(lang), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(HW.inkPayload(strokes, lang)), signal: AbortSignal.timeout(8000) });
    return HW.parseCandidates(await r.json(), max);
  };
  App.hw = {
    // fragt nur beim ersten Mal; false = abgelehnt
    consent: async (msg) => {
      if (App.store.settings.hwConsent) return true;
      if (!(await App.confirm(msg, { ok: 'Einverstanden', danger: false, title: 'Handschrift erkennen' }))) return false;
      await App.saveSettings({ hwConsent: true });
      return true;
    },
    // Striche: [{ pts: [[x, y], …] }]; beide Listen leer = Dienst nicht erreichbar
    recognize: async (strokes) => {
      const [ja, de] = (await Promise.allSettled([fetchLang(strokes, 'ja', 5), fetchLang(strokes, 'de', 3)])).map((r) => (r.status === 'fulfilled' ? r.value : []));
      return { ja, de };
    },
  };
})(window.App);
