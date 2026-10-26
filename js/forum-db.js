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
        if (!window.firebase) for (const src of SDK) await loadScript(src);
        const fb = window.firebase;
        if (!fb.apps.length) fb.initializeApp(App.FIREBASE_CONFIG);
        auth = fb.auth();
        db = fb.firestore();
        // gespeicherte anonyme Anmeldung abwarten, sonst neu anmelden
        const user = await new Promise((res) => { const off = auth.onAuthStateChanged((u) => { off(); res(u); }); });
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
  const img = (code, postId) => posts(code).doc(postId).collection('img').doc('main');
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
    const b = db.batch();
    b.set(group(code), { createdAt: now(), createdBy: D.uid() });
    b.set(group(code).collection('members').doc(D.uid()), { name, joinedAt: now() });
    await b.commit();
  };
  // Die Regeln lassen den Mitglied-Eintrag nur zu, wenn es die Gruppe gibt: „verweigert“ heißt also „falscher Code“
  D.joinGroup = async (code, name) => {
    try {
      await group(code).collection('members').doc(D.uid()).set({ name, joinedAt: now() });
    } catch (e) {
      if (e && e.code === 'permission-denied') throw Object.assign(new Error('no-group'), { code: 'no-group' });
      throw e;
    }
  };
  D.leaveGroup = (code) => group(code).collection('members').doc(D.uid()).delete();
  D.rename = (code, name) => group(code).collection('members').doc(D.uid()).update({ name });
  D.setAvatar = (code, avatar) => group(code).collection('members').doc(D.uid()).update({ avatar });
  // Mitglieder → { uid: { name, avatar } } – für die Avatare neben den Namen (gelten auch für alte Beiträge)
  D.watchMembers = (code, onMembers) => group(code).collection('members').onSnapshot((snap) => {
    const out = {};
    snap.docs.forEach((d) => { const x = d.data(); out[d.id] = { name: typeof x.name === 'string' ? x.name : '', avatar: typeof x.avatar === 'string' ? x.avatar : '' }; });
    onMembers(out);
  }, () => {});

  // ---------- Lesen ----------
  // fromCache ohne Beiträge = noch nie Antwort vom Server bekommen (offline gestartet)
  D.watchPosts = (code, onPosts, onError) => posts(code).orderBy('lastActivityAt', 'desc').limit(300)
    .onSnapshot((snap) => onPosts(snap.docs.map((d) => F().cleanPost(raw(d))), { fromCache: snap.metadata.fromCache }), onError);
  D.watchReplies = (code, postId, onReplies, onError) => replies(code, postId).orderBy('createdAt', 'asc')
    .onSnapshot((snap) => onReplies(snap.docs.map((d) => F().cleanReply(raw(d)))), onError);
  // Bilder der Beiträge liegen in einem eigenen Dokument: die Liste lädt so keine Bilder mit, erst der offene Beitrag
  D.getImage = async (code, postId) => {
    const snap = await img(code, postId).get();
    const data = snap.exists ? snap.data().data : null;
    return F().cleanReply({ image: data }).image;
  };

  // ---------- Beiträge ----------
  D.addPost = async (code, { name, kind, text, image, refs }) => {
    const b = db.batch();
    const ref = posts(code).doc();
    b.set(ref, {
      uid: D.uid(), name, kind, text, hasImage: !!image, refs: refs || [], createdAt: now(), editedAt: null,
      done: false, doneBy: null, doneAt: null, replyCount: 0, lastActivityAt: now(), lastActivityUid: D.uid(),
    });
    if (image) b.set(img(code, ref.id), { data: image });
    await b.commit();
  };
  D.editPost = async (code, id, { kind, text, image, refs }) => {
    const b = db.batch();
    b.update(posts(code).doc(id), { kind, text, hasImage: !!image, refs: refs || [], editedAt: now() });
    if (image) b.set(img(code, id), { data: image }); else b.delete(img(code, id));
    await b.commit();
  };
  // Antworten anderer gehen mit: die Regeln erlauben das dem Autor des Beitrags
  D.deletePost = async (code, id) => {
    const snap = await replies(code, id).get();
    const b = db.batch();
    snap.docs.forEach((d) => b.delete(d.ref));
    b.delete(img(code, id));
    b.delete(posts(code).doc(id));
    await b.commit();
  };
  D.setDone = (code, id, done, name) => posts(code).doc(id).update(done
    ? { done: true, doneBy: name, doneAt: now() }
    : { done: false, doneBy: null, doneAt: null });

  // ---------- Antworten ----------
  // Antwort und Zähler/„letzte Aktivität“ am Beitrag in einem Schritt
  D.addReply = async (code, postId, { name, text, image, refs }) => {
    const b = db.batch();
    b.set(replies(code, postId).doc(), { uid: D.uid(), name, text, image: image || null, refs: refs || [], createdAt: now(), editedAt: null });
    b.update(posts(code).doc(postId), { replyCount: FV().increment(1), lastActivityAt: now(), lastActivityUid: D.uid() });
    await b.commit();
  };
  D.editReply = (code, postId, rid, { text, image, refs }) => replies(code, postId).doc(rid).update({ text, image: image || null, refs: refs || [], editedAt: now() });
  D.deleteReply = async (code, postId, rid) => {
    const b = db.batch();
    b.delete(replies(code, postId).doc(rid));
    b.update(posts(code).doc(postId), { replyCount: FV().increment(-1) });
    await b.commit();
  };
})(window.App = window.App || {});
