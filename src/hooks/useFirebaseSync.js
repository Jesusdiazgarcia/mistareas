import { useState, useEffect, useCallback, useRef } from 'react';
import { db, ref, onValue, set, isFirebaseAvailable } from '../firebase';

const LS_KEYS = { tasks: 'tasks', history: 'history', theme: 'theme', userId: 'mis_tareas_uid' };

function getUserId() {
    let id = localStorage.getItem(LS_KEYS.userId);
    if (!id) {
        id = 'user_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(LS_KEYS.userId, id);
    }
    return id;
}

function loadLocal(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

function saveLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useFirebaseSync() {
    const [tasks, setTasks] = useState(() => loadLocal(LS_KEYS.tasks, []));
    const [history, setHistory] = useState(() => loadLocal(LS_KEYS.history, []));
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('local');
    const userIdRef = useRef(getUserId());
    const firebaseActive = useRef(false);

    // Firebase listener
    useEffect(() => {
        if (!isFirebaseAvailable()) {
            setSyncStatus('local');
            return;
        }

        const userId = userIdRef.current;
        const tasksRef = ref(db, `users/${userId}/tasks`);
        const historyRef = ref(db, `users/${userId}/history`);

        setIsSyncing(true);
        setSyncStatus('connecting');

        let gotTasks = false;
        let gotHistory = false;

        const unsubTasks = onValue(tasksRef, (snap) => {
            const data = snap.val();
            if (data) {
                firebaseActive.current = true;
                if (Array.isArray(data)) {
                    setTasks(data);
                    saveLocal(LS_KEYS.tasks, data);
                }
            }
            gotTasks = true;
            if (gotTasks && gotHistory) setIsSyncing(false);
            setSyncStatus(firebaseActive.current ? 'synced' : 'local');
        }, (err) => {
            console.warn('Firebase tasks read error:', err);
            setSyncStatus('error');
            setIsSyncing(false);
        });

        const unsubHistory = onValue(historyRef, (snap) => {
            const data = snap.val();
            if (data && Array.isArray(data)) {
                setHistory(data);
                saveLocal(LS_KEYS.history, data);
            }
            gotHistory = true;
            if (gotTasks && gotHistory) setIsSyncing(false);
        }, () => {});

        return () => { unsubTasks(); unsubHistory(); };
    }, []);

    // Sync tasks to Firebase
    const syncTasks = useCallback((newTasksOrFn) => {
        const newTasks = typeof newTasksOrFn === 'function' ? newTasksOrFn(tasks) : newTasksOrFn;
        setTasks(newTasks);
        saveLocal(LS_KEYS.tasks, newTasks);

        if (isFirebaseAvailable()) {
            try {
                set(ref(db, `users/${userIdRef.current}/tasks`), newTasks);
            } catch (e) {
                console.warn('Firebase sync error:', e);
            }
        }
    }, [tasks]);

    // Sync history to Firebase
    const syncHistory = useCallback((newHistoryOrFn) => {
        const newHistory = typeof newHistoryOrFn === 'function' ? newHistoryOrFn(history) : newHistoryOrFn;
        setHistory(newHistory);
        saveLocal(LS_KEYS.history, newHistory);

        if (isFirebaseAvailable()) {
            try {
                set(ref(db, `users/${userIdRef.current}/history`), newHistory.slice(0, 100));
            } catch (e) {
                console.warn('Firebase sync error:', e);
            }
        }
    }, [history]);

    return { tasks, syncTasks, history, syncHistory, isSyncing, syncStatus };
}
