import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Registra el service worker en modo "prompt": cuando hay una versión nueva,
 * se avisa en pantalla en vez de cambiarla por debajo sin que el usuario sepa.
 */
export function usePwaUpdate() {
    const [needRefresh, setNeedRefresh] = useState(false);
    const updateRef = useRef(null);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

        updateRef.current = registerSW({
            immediate: true,
            onNeedRefresh() { setNeedRefresh(true); }
        });
    }, []);

    const applyUpdate = useCallback(() => {
        if (updateRef.current) updateRef.current(true);
        else window.location.reload();
    }, []);

    const dismissUpdate = useCallback(() => setNeedRefresh(false), []);

    return { needRefresh, applyUpdate, dismissUpdate };
}
