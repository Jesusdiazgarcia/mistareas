import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

    return { isDark, toggleTheme };
}
