/* Nihongo Techō – Willkommenskarte: Logik ohne DOM (Gerät, Zeilen, Wörterbuch-Automatik; in Node getestet) */
'use strict';
(function (App) {
  const W = App.welcomeLogic = {};
  const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|; wv\)/;

  // ---------- Gerät und Installationsweg ----------
  W.env = (o) => {
    const { ua = '', standalone = false, hasPrompt = false, maxTouchPoints = 0 } = o || {};
    const s = String(ua);
    const inApp = IN_APP.test(s);
    // iPadOS gibt sich als Mac aus – nur mit Touch ist es ein iPad
    const ios = /iPhone|iPad|iPod/.test(s) || (/Macintosh/.test(s) && maxTouchPoints > 1);
    const os = /Android/.test(s) ? 'android' : ios ? 'ios' : /Windows/.test(s) ? 'windows' : 'other';
    const install = standalone ? 'done' : inApp ? 'open-in-browser' : hasPrompt ? 'button' : os === 'ios' ? 'ios-steps' : 'menu';
    return { os, inApp, install };
  };

  // ---------- Zeilen der Karte ----------
  W.rows = (o) => {
    const { env = {}, genki = 'none', emptyLocal = false, folderSupported = false, backupOn = false, dict = 'none', dismissed = false } = o || {};
    const rows = [{ id: 'install', done: env.install === 'done', variant: env.install || 'menu' }];
    if (genki === 'locked' || genki === 'stale' || genki === 'open') rows.push({ id: 'genki', done: genki === 'open', variant: genki });
    if (emptyLocal) rows.push({ id: 'stand', done: false, variant: folderSupported ? 'folder+file' : 'file' });
    rows.push(folderSupported
      ? { id: 'backup', done: !!backupOn, variant: 'folder' }
      : { id: 'backup', done: false, variant: 'manual' });
    // „stand“ und die manuelle Sicherung zählen nicht für „alles erledigt“
    const open = rows.some((r) => !r.done && r.id !== 'stand' && !(r.id === 'backup' && r.variant === 'manual'));
    return { show: !dismissed && open, rows, dictLine: dict === 'loading' || dict === 'ready' ? dict : '' };
  };

  // ---------- Wörterbuch von selbst laden (nur dict-common, höchstens zwei Versuche) ----------
  W.dictAuto = (o) => {
    const { web = false, emptyLocal = false, installed = false, marker = '' } = o || {};
    return { run: !!web && !installed && (marker === '' ? !!emptyLocal : marker === '1') };
  };
  W.dictAutoNext = (marker, ok) => ok ? 'done' : marker === '' ? '1' : marker === '1' ? '2' : marker;
})(window.App);
