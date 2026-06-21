import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQHoCYYfdmkXnV2CTGBSq3gpE986QOq2o",
  authDomain: "rossoni-f069a.firebaseapp.com",
  projectId: "rossoni-f069a",
  storageBucket: "rossoni-f069a.firebasestorage.app",
  messagingSenderId: "708686815315",
  appId: "1:708686815315:web:0810734346e679e7c066a6",
  measurementId: "G-WY79H8S00F"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const paginaCorrente = window.location.pathname.split('/').pop() || 'index.html';

window.registraCliente = async function(nome, email, password, categoria, citta, descrizione, quando) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "utenti", cred.user.uid), {
      ruolo: "cliente",
      nome: nome,
      email: email,
      categoria: categoria,
      citta: citta,
      descrizione: descrizione,
      quando: quando,
      creato: serverTimestamp(),
      ban: false
    });
    await setDoc(doc(db, "richieste", cred.user.uid + "_" + Date.now()), {
      clienteId: cred.user.uid,
      clienteNome: nome,
      categoria: categoria,
      citta: citta,
      descrizione: descrizione,
      quando: quando,
      stato: "attiva",
      offerte: 0,
      creato: serverTimestamp()
    });
    localStorage.setItem('ruolo', 'cliente');
    localStorage.setItem('uid', cred.user.uid);
    localStorage.setItem('nome', nome);
    return { successo: true };
  } catch (e) {
    return { successo: false, errore: tradErrore(e.code) };
  }
};

window.loginUtente = async function(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "utenti", cred.user.uid));
    if (!snap.exists()) throw { code: 'auth/user-not-found' };
    const dati = snap.data();
    localStorage.setItem('ruolo', dati.ruolo);
    localStorage.setItem('uid', cred.user.uid);
    localStorage.setItem('nome', dati.nome || dati.ragioneSociale || '');
    if (dati.ruolo === 'professionista') {
      window.location.href = 'dashboard-pro.html';
    } else {
      window.location.href = 'dashboard-cliente.html';
    }
    return { successo: true };
  } catch (e) {
    return { successo: false, errore: tradErrore(e.code) };
  }
};

window.registraProfessionista = async function(datiForm) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, datiForm.email, datiForm.password);
    await setDoc(doc(db, "utenti", cred.user.uid), {
      ruolo: "professionista",
      ragioneSociale: datiForm.ragioneSociale,
      email: datiForm.email,
      telefono: datiForm.telefono,
      categoria: datiForm.categoria,
      citta: datiForm.citta,
      raggio: datiForm.raggio,
      descrizione: datiForm.descrizione,
      anni: datiForm.anni,
      piano: datiForm.piano,
      piva: datiForm.piva || '',
      sito: datiForm.sito || '',
      crediti: 0,
      rating: 0,
      recensioni: 0,
      lavori: 0,
      ban: false,
      verificato: false,
      creato: serverTimestamp()
    });
    localStorage.setItem('ruolo', 'professionista');
    localStorage.setItem('uid', cred.user.uid);
    localStorage.setItem('nome', datiForm.ragioneSociale);
    return { successo: true };
  } catch (e) {
    return { successo: false, errore: tradErrore(e.code) };
  }
};

window.eseguiLogout = async function() {
  await signOut(auth);
  localStorage.clear();
  window.location.href = 'index.html';
};

const pagineAuth = ['dashboard-cliente.html', 'dashboard-pro.html', 'chat.html', 'profilo-pro.html'];

onAuthStateChanged(auth, async (user) => {
  if (!user && pagineAuth.includes(paginaCorrente)) {
    window.location.href = 'cliente.html?tab=accedi';
    return;
  }
  if (user) {
    const snap = await getDoc(doc(db, "utenti", user.uid));
    if (snap.exists()) {
      const dati = snap.data();
      const elNome = document.querySelector('.navbar-nome');
      if (elNome) elNome.textContent = dati.nome || dati.ragioneSociale || '';
      if (paginaCorrente === 'dashboard-cliente.html' && dati.ruolo !== 'cliente') {
        window.location.href = 'dashboard-pro.html';
      }
      if (paginaCorrente === 'dashboard-pro.html' && dati.ruolo !== 'professionista') {
        window.location.href = 'dashboard-cliente.html';
      }
    }
  }
});

function tradErrore(code) {
  const mappa = {
    'auth/email-already-in-use': '❌ Email già registrata. Prova ad accedere.',
    'auth/invalid-email': '❌ Email non valida.',
    'auth/weak-password': '❌ Password troppo corta (minimo 6 caratteri).',
    'auth/wrong-password': '❌ Password errata.',
    'auth/user-not-found': '❌ Nessun account trovato con questa email.',
    'auth/too-many-requests': '❌ Troppi tentativi. Riprova tra qualche minuto.',
    'auth/network-request-failed': '❌ Errore di rete. Controlla la connessione.'
    'auth/invalid-credential': '❌ Email o password errata. Riprova.'
  };
  return mappa[code] || '❌ Errore: ' + code;
}

console.log('Firebase Auth caricato correttamente');
