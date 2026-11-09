/* Nihongo Techō – Gruppenforum: die einzige Datei, die Firebase kennt (laden, anmelden, lesen, schreiben) */
'use strict';
(function (App) {
  // Das SDK liegt als klassische Skripte in vendor/firebase/ (compat-Builds) und wird erst bei Bedarf geladen –
  // Module per import() liefen in der Tablet-ZIP-Version (file://) nicht. Jedes Gerät meldet sich anonym an.
  // Zeiten gehen als ms-Zahlen hinaus (null = noch kein Server-Zeitstempel).
  const D = App.forumDb = {};
  const SDK = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'].map((f) => 'vendor/firebase/' + f);
  let ready = null;
  let auth = null;
  let db = null;

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('Konnte ' + src + ' nicht laden'));
    document.head.appendChild(s);
  });

  D.configured = () => !!App.FIREBASE_CONFIG;

  D.load = () => {
    if (!ready) {
      ready = (async () => {
        // D.step: woran es gerade hängt – die Fehlermeldung beim Beitreten zeigt es mit an (Fehlersuche auf fremden Geräten)
        D.step = 'Programmteil laden';
        if (!window.firebase) for (const src of SDK) await loadScript(src);
        const fb = window.firebase;
        if (!fb.apps.length) fb.initializeApp(App.FIREBASE_CONFIG);
        auth = fb.auth();
        db = fb.firestore();
        // gespeicherte anonyme Anmeldung abwarten, sonst neu anmelden
        D.step = 'Anmeldung prüfen';
        const user = await new Promise((res) => { const off = auth.onAuthStateChanged((u) => { off(); res(u); }); });
        D.step = 'Anmelden';
        if (!user) await auth.signInAnonymously();
        return auth.currentUser.uid;
      })();
      // Fehlschlag (offline): beim nächsten Versuch neu probieren
      ready.catch(() => { ready = null; });
    }
    return ready;
  };

  D.uid = () => (auth && auth.currentUser ? auth.currentUser.uid : null);

  const FV = () => window.firebase.firestore.FieldValue;
  const now = () => FV().serverTimestamp();
  const group = (code) => db.collection('groups').doc(code);
  const posts = (code) => group(code).collection('posts');
  const replies = (code, postId) => posts(code).doc(postId).collection('replies');
  const imgs = (code, postId) => posts(code).doc(postId).collection('img');
  // 2.–4. Bild einer Antwort (das erste steht in der Antwort selbst, so sehen es auch ältere App-Versionen)
  const replyImgs = (code, postId, rid) => replies(code, postId).doc(rid).collection('img');
  const SLOTS = () => F().IMG_SLOTS;
  const ms = (ts) => (ts && ts.toMillis ? ts.toMillis() : null);
  const TIMES = ['createdAt', 'editedAt', 'doneAt', 'lastActivityAt'];
  // Rohdaten → ms-Zeiten, dann über forum-logic auf ihre Typen gebracht (alles stammt von anderen Geräten)
  const raw = (doc) => {
    const d = doc.data({ serverTimestamps: 'estimate' });
    const out = Object.assign({}, d, { id: doc.id });
    for (const k of TIMES) if (k in d) out[k] = ms(d[k]);
    return out;
  };
  const F = () => App.forumLogic;

  // ---------- Gruppe ----------
  D.createGroup = async (code, name) => {
    D.step = 'Gruppe anlegen';
    const b = db.batch();
    b.set(group(code), { createdAt: now(), createdBy: D.uid() });
    b.set(group(code).collection('members').doc(D.uid()), { name, joinedAt: now() });
    await b.commit();
  };
  // Die Regeln lassen den Mitglied-Eintrag nur zu, wenn es die Gruppe gibt: „verweigert“ heißt also „falscher Code“
  D.joinGroup = async (code, name, avatar) => {
    D.step = 'Gruppe beitreten';
    try {
      await group(code).collection('members').doc(D.uid()).set(Object.assign({ name, joinedAt: now() }, avatar ? { avatar } : {}));
    } catch (e) {
      if (e && e.code === 'permission-denied') throw Object.assign(new Error('no-group'), { code: 'no-group' });
      throw e;
    }
  };
  D.leaveGroup = (code) => group(code).collection('members').doc(D.uid()).delete();
  D.rename = (code, name) => group(code).collection('members').doc(D.uid()).update({ name });
  D.setAvatar = (code, avatar) => group(code).collection('members').doc(D.uid()).update({ avatar });
  // Mitglieder → { uid: { name, avatar, streak } } – für die Avatare neben den Namen (gelten auch für alte Beiträge)
  D.watchMembers = (code, onMembers) => group(code).collection('members').onSnapshot((snap) => {
    const out = {};
    snap.docs.forEach((d) => { const x = d.data(); out[d.id] = { name: typeof x.name === 'string' ? x.name : '', avatar: typeof x.avatar === 'string' ? x.avatar : '', streak: F().cleanStreak(x.streak) }; });
    onMembers(out);
  }, () => {});

  // ---------- Lesen ----------
  // fromCache ohne Beiträge = noch nie Antwort vom Server bekommen (offline gestartet)
  D.watchPosts = (code, onPosts, onError) => posts(code).orderBy('lastActivityAt', 'desc').limit(300)
    .onSnapshot((snap) => onPosts(snap.docs.map((d) => F().cleanPost(raw(d))), { fromCache: snap.metadata.fromCache }), onError);
  D.watchReplies = (code, postId, onReplies, onError) => replies(code, postId).orderBy('createdAt', 'asc')
    .onSnapshot((snap) => onReplies(snap.docs.map((d) => F().cleanReply(raw(d)))), onError);
  // Bilder der Beiträge liegen in einem eigenen Dokument: die Liste lädt so keine Bilder mit, erst der offene Beitrag
  const readSlots = async (col, slots) => {
    const snap = await col.get();
    const by = {};
    snap.docs.forEach((d) => { by[d.id] = F().cleanImage(d.data().data); });
    return slots.map((s) => by[s]).filter(Boolean);
  };
  D.getImages = (code, postId) => readSlots(imgs(code, postId), SLOTS());
  D.getReplyImages = (code, postId, rid) => readSlots(replyImgs(code, postId, rid), SLOTS().slice(1));

  // ---------- Beiträge ----------
  D.addPost = async (code, { name, kind, text, images, refs, mentions }) => {
    const b = db.batch();
    const ref = posts(code).doc();
    images = (images || []).slice(0, F().MAX_IMAGES);
    b.set(ref, {
      uid: D.uid(), name, kind, text, hasImage: images.length > 0, refs: refs || [], mentions: mentions || [], createdAt: now(), editedAt: null,
      done: false, doneBy: null, doneAt: null, replyCount: 0, lastActivityAt: now(), lastActivityUid: D.uid(),
    });
    images.forEach((src, i) => b.set(imgs(code, ref.id).doc(SLOTS()[i]), { data: src }));
    await b.commit();
  };
  // alle vier Plätze neu: belegte schreiben, übrige löschen
  D.editPost = async (code, id, { kind, text, images, refs, mentions }) => {
    const b = db.batch();
    images = (images || []).slice(0, F().MAX_IMAGES);
    b.update(posts(code).doc(id), { kind, text, hasImage: images.length > 0, refs: refs || [], mentions: mentions || [], editedAt: now() });
    SLOTS().forEach((s, i) => { if (images[i]) b.set(imgs(code, id).doc(s), { data: images[i] }); else b.delete(imgs(code, id).doc(s)); });
    await b.commit();
  };
  // Antworten anderer gehen mit: die Regeln erlauben das dem Autor des Beitrags
  D.deletePost = async (code, id) => {
    const snap = await replies(code, id).get();
    const b = db.batch();
    snap.docs.forEach((d) => {
      SLOTS().slice(1, 1 + F().cleanReply(d.data()).moreImages).forEach((s) => b.delete(replyImgs(code, id, d.id).doc(s)));
      b.delete(d.ref);
    });
    SLOTS().forEach((s) => b.delete(imgs(code, id).doc(s)));
    b.delete(posts(code).doc(id));
    await b.commit();
  };
  // Zahnrad am Beispielsatz: nur die Verweise ändern (Bild und Text bleiben)
  D.setPostRefs = (code, id, refs) => posts(code).doc(id).update({ refs, editedAt: now() });
  D.setReplyRefs = (code, postId, rid, refs) => replies(code, postId).doc(rid).update({ refs, editedAt: now() });
  // Herz an/aus: nur die eigene uid kommt dazu oder geht raus (zählt nicht als Aktivität)
  const likeOp = (on) => (on ? FV().arrayUnion(D.uid()) : FV().arrayRemove(D.uid()));
  D.likePost = (code, id, on) => posts(code).doc(id).update({ likes: likeOp(on) });
  D.likeReply = (code, postId, rid, on) => replies(code, postId).doc(rid).update({ likes: likeOp(on) });
  // „besprochen“ dürfen Autor und wer die Gruppe gegründet hat
  D.groupAdmin = async (code) => { const g = await group(code).get(); const by = g.exists ? g.data().createdBy : null; return typeof by === 'string' ? by : null; };
  // Admin per Code (Vicky): groups/{code}/admins/{uid} – die Regeln vergleichen den Code mit dem in firestore.rules.
  // Lesen darf jedes Gerät nur seinen eigenen Eintrag; nach einem stillen Neu-Beitritt trägt die App sich mit dem
  // gemerkten Code wieder ein (js/forum.js).
  const adminDoc = (code) => group(code).collection('admins').doc(D.uid());
  D.isAdmin = async (code) => { try { return (await adminDoc(code).get()).exists; } catch (e) { return false; } };
  D.claimAdmin = (code, key) => adminDoc(code).set({ key: String(key), at: now() });
  D.setDone = (code, id, done, name) => posts(code).doc(id).update(done
    ? { done: true, doneBy: name, doneAt: now() }
    : { done: false, doneBy: null, doneAt: null });

  // ---------- Satz des Tages ----------
  // groups/{code}/daily/{Datum}/s/{uid}: ein Satz pro Mitglied und Tag
  const dailyCol = (code, date) => group(code).collection('daily').doc(date).collection('s');
  const dailyItem = (d) => {
    const x = raw(d);
    return { id: d.id, uid: x.uid, name: x.name, text: x.text, usedPrompt: !!x.usedPrompt, createdAt: x.createdAt, editedAt: x.editedAt || null,
      likes: Array.isArray(x.likes) ? x.likes.filter((u) => typeof u === 'string') : [], furi: typeof x.furi === 'string' ? x.furi : null };
  };
  D.watchDaily = (code, date, onList, onError) => dailyCol(code, date)
    .onSnapshot((snap) => onList(snap.docs.map(dailyItem)), onError);
  D.sendDaily = (code, date, { name, text, usedPrompt }) => dailyCol(code, date).doc(D.uid())
    .set({ uid: D.uid(), name, text, usedPrompt: !!usedPrompt, createdAt: now(), editedAt: null, likes: [] });
  // furi: von Hand korrigierte Lesung, auf den neuen Text übertragen (undefined = Feld nicht anfassen)
  D.editDaily = (code, date, { text, usedPrompt, furi }) => dailyCol(code, date).doc(D.uid())
    .update(Object.assign({ text, usedPrompt: !!usedPrompt, editedAt: now() }, furi === undefined ? {} : { furi: furi || null }));
  // Archiv: die Sätze eines früheren Tages einmal lesen (kein Listener)
  D.getDaily = async (code, date) => (await dailyCol(code, date).get()).docs.map(dailyItem);
  // Lesung von Hand korrigiert (jedes Mitglied, für alle sichtbar); null = wieder automatisch
  D.setDailyFuri = (code, date, uid, furi) => dailyCol(code, date).doc(uid).update({ furi: furi || null });
  D.likeDaily = (code, date, uid, on) => dailyCol(code, date).doc(uid).update({ likes: likeOp(on) });
  // Serie { n, hold, days } am eigenen Mitglied-Eintrag
  D.setStreak = (code, streak) => group(code).collection('members').doc(D.uid()).update({ streak });

  // ---------- Antworten ----------
  // Antwort und Zähler/„letzte Aktivität“ am Beitrag in einem Schritt
  // lastMentions: wen die neueste Antwort erwähnt – so zeigt die Liste „@ dich“, ohne Antworten zu laden
  const replyPics = (images) => { const l = images || []; return { image: l[0] || null, more: l.slice(1, F().MAX_IMAGES) }; };
  D.addReply = async (code, postId, { name, text, images, refs, mentions }) => {
    const b = db.batch();
    const { image, more } = replyPics(images);
    const ref = replies(code, postId).doc();
    b.set(ref, Object.assign({ uid: D.uid(), name, text, image, refs: refs || [], mentions: mentions || [], createdAt: now(), editedAt: null },
      more.length ? { moreImages: more.length } : {}));
    more.forEach((src, i) => b.set(replyImgs(code, postId, ref.id).doc(SLOTS()[i + 1]), { data: src }));
    b.update(posts(code).doc(postId), { replyCount: FV().increment(1), lastActivityAt: now(), lastActivityUid: D.uid(), lastMentions: mentions || [] });
    await b.commit();
  };
  // had = wie viele weitere Bilder die Antwort bisher hatte (nur deren Plätze werden geleert)
  D.editReply = async (code, postId, rid, { text, images, refs, mentions }, had = 0) => {
    const b = db.batch();
    const { image, more } = replyPics(images);
    const ch = { text, image, refs: refs || [], mentions: mentions || [], editedAt: now() };
    if (more.length || had) ch.moreImages = more.length;
    b.update(replies(code, postId).doc(rid), ch);
    SLOTS().slice(1, 1 + Math.max(more.length, had)).forEach((s, i) => {
      const doc = replyImgs(code, postId, rid).doc(s);
      if (more[i]) b.set(doc, { data: more[i] }); else b.delete(doc);
    });
    await b.commit();
  };
  D.deleteReply = async (code, postId, rid, had = 0) => {
    const b = db.batch();
    SLOTS().slice(1, 1 + had).forEach((s) => b.delete(replyImgs(code, postId, rid).doc(s)));
    b.delete(replies(code, postId).doc(rid));
    b.update(posts(code).doc(postId), { replyCount: FV().increment(-1) });
    await b.commit();
  };
})(window.App = window.App || {});
