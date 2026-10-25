/* Nihongo Techō – Willkommensbrief von Vicky: einmal je Gerät beim allerersten Öffnen, vor Einrichten und Tutorial.
   Danach startet das Tutorial (App.tour.firstRun). Wieder lesen: Einstellungen › Über › „Über diese App“. */
'use strict';
(function (App) {
  const KEY = 'hallo'; // localStorage „nt-hallo“: jedes Gerät zeigt den Brief einmal

  const BODY = `<div class="hallo">
    <h3>Ein Ort zum Sammeln</h3>
    <p>Zum Japanischlernen gibt es <b>unzählige frei zugängliche Schätze</b>. Oft liest man hier etwas, schnappt dort etwas auf, und am nächsten Tag ist es wieder weg. Nihongo Techō sammelt und verbindet all das, damit du es <b>nicht nur einmal liest, sondern wirklich lernst</b>.</p>
    <div class="hallo-note">
      <h3>Ein ehrliches Wort</h3>
      <p>Viele Inhalte wurden <b>mit Hilfe von KI</b> aus frei zugänglichen Quellen erstellt, mit KI geprüft und im täglichen Gebrauch getestet. Fehler, die auffallen, werden korrigiert. <b>Muttersprachler haben aber nicht mitgewirkt.</b></p>
      <p>Darum nimm zwei Dinge mit: <b>gesunden Menschenverstand</b> und eine <b>gesunde Portion KI-Skepsis</b>. Kommt dir etwas seltsam vor, prüf es im Lehrbuch, im Internet oder bei einem Muttersprachler. Und <b>sag Bescheid</b>, damit der Weg für alle sicherer wird.</p>
    </div>
    <h3>Alles kann, nichts muss</h3>
    <p>Nimm mit, was dir hilft, und lass liegen, was nicht zu dir passt.</p>
    <p>Viel Freude auf dem Weg! <span class="jp">がんばってね！</span></p>
    <p class="hallo-sign">Vicky</p>
  </div>`;

  const open = (onClose) => {
    const md = App.modal({
      title: 'Bevor du eintrittst … 🏮', cls: 'hallo-modal', body: BODY, onClose,
      foot: '<button class="btn btn-primary" data-ok autofocus>Los geht\'s</button>',
    });
    md.el.querySelector('[data-ok]').onclick = md.close;
  };

  App.hallo = {
    // Beim Start, gleich nach dem ersten Zeichnen: nur auf einem Gerät ohne eigene Daten, nur einmal.
    // Geschlossen (egal wie) → das Tutorial beginnt mit der Sicherung.
    boot: () => {
      const seen = !!App.lsGet(KEY);
      if (!seen) App.lsSet(KEY, '1'); // sofort merken – auch wer jetzt neu lädt, bekommt ihn nicht noch einmal
      if (!App.tourLogic.showHello({ seen, fresh: App.backup.isEmptyLocal() })) return false;
      // die alte Frage „Rundgang?“ kommt dann nicht mehr – das Tutorial startet nach dem Brief von selbst
      App.saveSettings({ tourAsked: true });
      open(() => { if (App.tour) App.tour.firstRun(); });
      return true;
    },
    open: () => open(),
  };

  document.addEventListener('click', (e) => { if (e.target.closest('[data-hallo-open]')) App.hallo.open(); });
})(window.App);
