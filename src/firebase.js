import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCPBL70PyxJ7s4wgTj1rbnj9J2UVUKxUSg",
  authDomain: "mis-tareas-ec9b2.firebaseapp.com",
  databaseURL: "https://mis-tareas-ec9b2-default-rtdb.firebaseio.com",
  projectId: "mis-tareas-ec9b2",
  storageBucket: "mis-tareas-ec9b2.firebasestorage.app",
  messagingSenderId: "1038929235758",
  appId: "1:1038929235758:web:8c9c96ca16633af949f4bf",
  measurementId: "G-DQ5V9YDB5R"
};

let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.warn('Firebase init failed, using localStorage fallback:', e);
}

export { db, ref, onValue, set, push, remove };

export function isFirebaseAvailable() {
  return !!db;
}
