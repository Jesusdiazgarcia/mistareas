import { Component } from 'react';
import { readRawBackup } from '../utils/storage';

function downloadEmergencyBackup() {
  const snapshot = readRawBackup();
  const payload = JSON.stringify({ app: 'mis-tareas', version: 1, exportedAt: new Date().toISOString(), ...snapshot }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mis_tareas_rescate_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Evita la pantalla en blanco: si un componente lanza un error, se muestra este
 * aviso con la opción de recargar y de descargar las tareas guardadas.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error no controlado:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center gap-5 px-6 py-10">
        <div role="alert" className="rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--card)] p-5">
          <h1 className="brand-type text-[22px] leading-tight text-[var(--text)]">Algo se rompió</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            La app encontró un error inesperado y se detuvo para no dañar tus tareas. Tus datos siguen guardados
            en este navegador.
          </p>
          <p className="mt-2 text-[11.5px] leading-snug text-[var(--text-muted)] break-words">
            {String(this.state.error?.message || this.state.error)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={() => window.location.reload()}
            className="h-11 rounded-[var(--radius-sm)] bg-[var(--accent-fill)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] text-[12px] font-semibold tracking-[0.04em]">
            Recargar la app
          </button>
          <button onClick={downloadEmergencyBackup}
            className="h-11 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] tracking-[0.04em] hover:text-[var(--text)] hover:border-[var(--border-strong)]">
            Descargar mis tareas
          </button>
        </div>
      </main>
    );
  }
}
