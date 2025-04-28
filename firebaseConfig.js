import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  TwitterAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Configuración de Firebase (reemplaza con tus propios datos)
const firebaseConfig = {
  apiKey: "AIzaSyDIhLxNKXQM8GlJLK1UjLTFT5q9oE6Q0sk",
  authDomain: "pokemon-click-game-123.firebaseapp.com",
  databaseURL: "https://pokemon-click-game-123-default-rtdb.firebaseio.com",
  projectId: "pokemon-click-game-123",
  storageBucket: "pokemon-click-game-123.appspot.com",
  messagingSenderId: "435336993557",
  appId: "1:435336993557:web:7d1bb7d75515229e7ca71c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Configurar proveedores de autenticación
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const twitterProvider = new TwitterAuthProvider();

// Exportar funcionalidades
export { 
  auth, 
  database, 
  googleProvider, 
  twitterProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
};