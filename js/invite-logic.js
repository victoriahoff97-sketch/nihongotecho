/* Nihongo Techō – Einladungslink: #freischalten=<Code> erkennen und Links bauen (reine Logik, kein DOM) */
'use strict';
(function (App) {
  const L = App.inviteLogic = {};
  const PREFIX = '#freischalten=';

  // → { code } für einen Einladungs-Hash (bei leerem Code oder kaputter Kodierung code ''), sonst null
  L.read = (hash) => {
    if (typeof hash !== 'string' || !hash.startsWith(PREFIX)) return null;
    try { return { code: decodeURIComponent(hash.slice(PREFIX.length)).trim() }; } catch (e) { return { code: '' }; }
  };

  L.link = (base, code) => `${base}${PREFIX}${encodeURIComponent(String(code).trim())}`;
})(window.App);
