import { useEffect } from 'react';

/**
 * Contenedor de menú desplegable: capa para cerrar al tocar fuera,
 * panel flotante y cierre con Escape.
 */
export default function MenuPanel({
    onClose,
    children,
    className = '',
    overlayClassName = 'z-40',
    panelClassName = 'z-50',
    shadow = 'var(--shadow-md)'
}) {
    useEffect(() => {
        const handler = (event) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <>
            <div className={`fixed inset-0 ${overlayClassName}`} onClick={onClose} />
            <div
                role="menu"
                className={`absolute bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden animate-[scaleIn_0.15s_ease] ${panelClassName} ${className}`}
                style={{ boxShadow: shadow }}
                onMouseLeave={onClose}>
                {children}
            </div>
        </>
    );
}

/** Separador horizontal entre grupos de un menú. */
export function MenuDivider() {
    return <div className="h-px bg-[var(--border)] mx-3" />;
}
