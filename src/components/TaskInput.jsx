import { useState, useRef } from 'react';
import { categories, priorities } from '../utils/helpers';

const emojis = ['😀','😂','😍','🤩','😎','🤔','💪','🔥','⭐','✅','❌','⚠️','🚀','💡','❤️','👏','🎉','✨','📝','📅','⏰','🔔','🏆','💎','☕'];

const FIELD = 'w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-[13px] outline-none focus:border-[var(--accent)] transition-colors duration-150 appearance-none';
const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238a919b' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E\")";

export default function TaskInput({ onAdd }) {
    const [text, setText] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [category, setCategory] = useState('none');
    const [priority, setPriority] = useState('none');
    const [repeat, setRepeat] = useState('none');
    const [dueDate, setDueDate] = useState('');
    const [estMin, setEstMin] = useState('');
    const [notes, setNotes] = useState('');
    const inputRef = useRef(null);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!text.trim()) return;
        onAdd({ text: text.trim(), category, priority, repeat, dueDate: dueDate || null, estimatedMinutes: parseInt(estMin) || 0, notes: notes.trim() });
        setText(''); setCategory('none'); setPriority('none'); setRepeat('none'); setDueDate(''); setEstMin(''); setNotes(''); setExpanded(false);
        inputRef.current?.focus();
    };

    const insertEmoji = (emoji) => {
        const input = inputRef.current;
        if (!input) return;
        const start = input.selectionStart;
        setText(text.substring(0, start) + emoji + text.substring(start));
        setShowEmoji(false);
        setTimeout(() => { input.focus(); input.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-5">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] transition-colors duration-150 focus-within:border-[var(--border-strong)]">
                <div className="flex items-center gap-2 pl-3.5 pr-1.5 py-1.5">
                    <input ref={inputRef} type="text" value={text} onChange={event => setText(event.target.value)}
                        onFocus={() => { if (!expanded) setExpanded(true); }}
                        placeholder="Escribe una nueva tarea..."
                        maxLength={500}
                        className="flex-1 bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] text-[13.5px] outline-none min-w-0 py-2" />
                    <button type="button" onClick={() => setShowEmoji(!showEmoji)} aria-label="Insertar emoji"
                        className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-muted)] shrink-0 hover:text-[var(--text)] hover:bg-[var(--hover)] transition-colors duration-150">
                        <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="6.8" cy="7.6" r="0.8" fill="currentColor" /><circle cx="11.2" cy="7.6" r="0.8" fill="currentColor" /><path d="M6.2 10.6c.7 1.2 1.7 1.8 2.8 1.8s2.1-.6 2.8-1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </button>
                    {text.trim() ? (
                        <button type="submit" aria-label="Agregar tarea"
                            className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--accent-fill)] text-[var(--on-accent)] flex items-center justify-center shrink-0 active:scale-90 transition-all duration-150">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    ) : (
                        <button type="button" onClick={() => setExpanded(!expanded)} aria-label="Más opciones de la tarea"
                            className={`w-9 h-9 rounded-[var(--radius-sm)] border flex items-center justify-center shrink-0 transition-all duration-150 active:scale-90 ${expanded ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </button>
                    )}
                </div>

                {showEmoji && (
                    <div className="px-3.5 pb-3 animate-[fadeIn_0.15s_ease]">
                        <div className="grid grid-cols-6 gap-1 p-2 rounded-[var(--radius-sm)] bg-[var(--panel)]">
                            {emojis.map(emoji => (
                                <button key={emoji} type="button" onClick={() => insertEmoji(emoji)}
                                    className="aspect-square flex items-center justify-center text-lg rounded-[var(--radius-sm)] hover:bg-[var(--hover)] active:scale-90 transition-all duration-150">{emoji}</button>
                            ))}
                        </div>
                    </div>
                )}

                {expanded && (
                    <div className="mx-3.5 mb-3.5 pt-3.5 border-t border-[var(--border)] space-y-2.5 animate-[fadeIn_0.15s_ease]">
                        <div className="grid grid-cols-2 gap-2">
                            <select value={category} onChange={event => setCategory(event.target.value)} aria-label="Categoría" className={FIELD}
                                style={{ backgroundImage: CHEVRON, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '26px' }}>
                                {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                            <select value={priority} onChange={event => setPriority(event.target.value)} aria-label="Prioridad" className={FIELD}
                                style={{ backgroundImage: CHEVRON, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '26px' }}>
                                {priorities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                            <select value={repeat} onChange={event => setRepeat(event.target.value)} aria-label="Repetición" className={FIELD}
                                style={{ backgroundImage: CHEVRON, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '26px' }}>
                                <option value="none">Sin repetir</option>
                                <option value="daily">Diario</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                            </select>
                            <input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} aria-label="Fecha límite" className={FIELD} />
                        </div>
                        <input type="number" placeholder="Minutos estimados" min="0" value={estMin} onChange={event => setEstMin(event.target.value)}
                            className={FIELD} style={{ backgroundImage: 'none' }} />
                        <textarea placeholder="Notas..." value={notes} onChange={event => setNotes(event.target.value)} rows={2}
                            className={`${FIELD} resize-y leading-snug`} />
                        <button type="submit"
                            className="w-full py-3 rounded-[var(--radius-sm)] bg-[var(--accent-fill)] text-[var(--on-accent)] text-[12px] font-semibold tracking-[0.06em] uppercase active:scale-[0.99] transition-all duration-150">
                            Agregar tarea
                        </button>
                    </div>
                )}
            </div>
        </form>
    );
}
