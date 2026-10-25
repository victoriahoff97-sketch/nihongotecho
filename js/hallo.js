/* Nihongo Techō – Willkommensbrief von Vicky: einmal je Gerät beim allerersten Öffnen, vor Einrichten und Tutorial.
   Danach startet das Tutorial (App.tour.firstRun). Wieder lesen: Einstellungen › Über › „Über diese App“. */
'use strict';
(function (App) {
  const KEY = 'hallo'; // localStorage „nt-hallo“: jedes Gerät zeigt den Brief einmal

  const BODY = `<div class="hallo">
    <p>Schön, dass du da bist! Bevor du loslegst, möchte ich dir kurz etwas mitgeben.</p>
    <h3>Wie die App entstanden ist</h3>
    <p>Um ehrlich zu sein: Nihongo Techō ist ein „Probier doch mal Claude aus“-Projekt, das mein Mann mir in die Hand gedrückt hat. Und plötzlich bin ich in ein riesiges Rabbit Hole gefallen. Zwischendurch war ich mehr damit beschäftigt, die App weiterzuentwickeln, als tatsächlich Japanisch zu lernen. 😅</p>
    <p>Aufgebaut habe ich die App nach dem Vorbild meines OneNote-Notizbuchs, das ich schon vorher hatte. Dazu habe ich alle Funktionen beschrieben, die ich mir schon immer gewünscht habe. So habe ich versucht, meine ganz persönliche Art zu lernen in dieser App umzusetzen.</p>
    <h3>Was die App sein will</h3>
    <p>Das Ziel der App ist vor allem Wissensmanagement. Es gibt so viele tolle, frei zugängliche Ressourcen zum Japanischlernen: Bücher, Websites, Apps, Kursunterlagen und, und, und. Mir ist es aber immer schwergefallen, diese Informationen an einer Stelle zu sammeln, sie zu verbinden und den Überblick zu behalten. Am Ende hatte ich hundert Ressourcen, aber keine davon habe ich richtig verfolgt. Ich habe überall ein bisschen Wissen aufgeschnappt, konnte es aber nie richtig lernen oder wiederfinden. Genau dabei soll die App unterstützen.</p>
    <h3>Wie die Inhalte entstanden sind</h3>
    <p>Viele Inhalte dieser App habe ich mit Hilfe von KI erstellt. Dazu gehören zum Beispiel die Vokabel- und Kanji-Listen, die deutschen Übersetzungen, Beispielsätze und Grammatikerklärungen. Grundlage waren frei zugängliche Quellen wie JLPT-Wortlisten, Wörterbücher und Satzsammlungen. Die KI hat diese Quellen zusammengeführt, übersetzt und ergänzt.</p>
    <p>Ich teste die App selbst jeden Tag beim Lernen. Wenn mir dabei ein Fehler auffällt, korrigiere ich ihn. Aber ich bin selbst Lernende und keine Lehrerin oder Muttersprachlerin. Ich kann also nicht garantieren, dass alles stimmt. Eine Übersetzung kann schief sein, eine Lesung falsch oder ein Satz klingt nicht ganz natürlich.</p>
    <p><b>Deshalb meine Bitte:</b> Geh bewusst damit um. Wenn dir etwas komisch vorkommt, prüf es in deinem Lehrbuch, im Internet oder frag jemanden, der Japanisch als Muttersprache spricht. Gib mir auch gern Bescheid, dann korrigiere ich es für alle. 💌</p>
    <h3>Alles kann, nichts muss</h3>
    <p>Weil die App für meine Art zu lernen gemacht ist, passt vielleicht nicht alles zu dir. Das ist völlig okay. Nimm dir einfach das, was dir hilft, und lass den Rest liegen. Es gibt keinen richtigen oder falschen Weg, die App zu benutzen.</p>
    <p>Viel Freude beim Lernen! <span class="jp">がんばってね！</span></p>
    <p class="hallo-sign">Vicky</p>
  </div>`;

  const open = (onClose) => {
    const md = App.modal({
      title: 'Hallo und willkommen bei Nihongo Techō! 🌸', cls: 'hallo-modal', body: BODY, onClose,
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
