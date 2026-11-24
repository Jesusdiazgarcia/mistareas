import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadList, saveList } from '../utils/storage';

const NOTIFIED_KEY = 'notified';
const DISMISSED_KEY = 'remindersDismissed';
const LIMIT = 300;

function reminderKey(task) {
    return `${task.id}@${task.dueDate}T${task.dueTime}`;
}

function dueAt(task) {
    return new Date(`${task.dueDate}T${task.dueTime}:00`).getTime();
}

/**
 * Recordatorios con hora: devuelve las tareas pendientes cuya hora ya pasó y
 * todavía no se han dado por vistas. Si el navegador lo permite, además lanza
 * una notificación del sistema una sola vez por recordatorio.
 */
export function useReminders(tasks) {
    const [now, setNow] = useState(() => Date.now());
    const notifiedRef = useRef(null);
    const [dismissed, setDismissed] = useState(() => new Set(loadList(DISMISSED_KEY)));
    const [permission, setPermission] = useState(() => (
        typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
    ));

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const reminders = useMemo(() => {
        return tasks
            .filter(task => !task.completed && task.dueDate && task.dueTime)
            .map(task => ({
                key: reminderKey(task),
                id: task.id,
                text: task.text,
                dueTime: task.dueTime,
                time: dueAt(task)
            }))
            .filter(item => {
                if (dismissed.has(item.key)) return false;
                return Number.isFinite(item.time) && item.time <= now && now - item.time < 24 * 3600000;
            })
            .sort((a, b) => a.time - b.time);
    }, [tasks, now, dismissed]);

    useEffect(() => {
        if (notifiedRef.current === null) notifiedRef.current = new Set(loadList(NOTIFIED_KEY));
        const fresh = reminders.filter(item => !notifiedRef.current.has(item.key));
        if (fresh.length === 0) return;

        fresh.forEach(item => notifiedRef.current.add(item.key));
        saveList(NOTIFIED_KEY, [...notifiedRef.current].slice(-LIMIT));

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            fresh.forEach(item => {
                try {
                    new Notification('Mis Tareas', { body: `${item.text} · ${item.dueTime}`, tag: item.key });
                } catch {
                    // Algunos navegadores exigen un service worker; el aviso en pantalla sigue funcionando.
                }
            });
        }
    }, [reminders]);

    const dismiss = useCallback((key) => {
        setDismissed(prev => {
            const next = new Set(prev).add(key);
            saveList(DISMISSED_KEY, [...next].slice(-LIMIT));
            return next;
        });
    }, []);

    const enableNotifications = useCallback(async () => {
        if (typeof Notification === 'undefined') return;
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
        } catch {
            setPermission('unsupported');
        }
    }, []);

    return { reminders, dismiss, permission, enableNotifications };
}
