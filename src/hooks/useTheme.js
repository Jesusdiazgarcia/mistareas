import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'themeV2';

export function useTheme() {
    // Nocturno frío is the app's default: dark unless the user picked light.
    const [isDark, setIsDark] = useState(() => (localStorage.getItem(STORAGE_KEY) ?? 'dark') !== 'light');

    useEffect(() => {
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0e1013' : '#f6f7f8');
    }, [isDark]);

    const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

    return { isDark, toggleTheme };
}
