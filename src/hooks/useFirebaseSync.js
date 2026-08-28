import { useState, useEffect, useCallback, useRef } from 'react';
import { db, ref, onValue, set, get, isFirebaseAvailable } from '../firebase';

const LS_KEYS = { tasks: 'tasks', history: 'history', theme: 'theme' };

const SHARED_USER_ID = 'mis_tareas_shared';

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
    const userIdRef = useRef(SHARED_USER_ID);
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

    // One-time migration from old random user ID to shared ID
    useEffect(() => {
        if (!isFirebaseAvailable()) return;
        const oldId = localStorage.getItem('mis_tareas_uid');
        if (!oldId || oldId === SHARED_USER_ID) return;

        const oldTasksRef = ref(db, `users/${oldId}/tasks`);
        const oldHistoryRef = ref(db, `users/${oldId}/history`);

        get(oldTasksRef).then(snap => {
            const oldData = snap.val();
            if (oldData && Array.isArray(oldData) && oldData.length > 0) {
                const sharedRef = ref(db, `users/${SHARED_USER_ID}/tasks`);
                get(sharedRef).then(sharedSnap => {
                    const sharedData = sharedSnap.val();
                    if (!sharedData || (Array.isArray(sharedData) && sharedData.length === 0)) {
                        set(sharedRef, oldData);
                    }
                });
            }
        });

        get(oldHistoryRef).then(snap => {
            const oldData = snap.val();
            if (oldData && Array.isArray(oldData) && oldData.length > 0) {
                const sharedRef = ref(db, `users/${SHARED_USER_ID}/history`);
                get(sharedRef).then(sharedSnap => {
                    const sharedData = sharedSnap.val();
                    if (!sharedData || (Array.isArray(sharedData) && sharedData.length === 0)) {
                        set(sharedRef, oldData);
                    }
                });
            }
        });

        localStorage.removeItem('mis_tareas_uid');
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
