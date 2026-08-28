import { useState, useRef } from 'react';
import { categories, priorities } from '../utils/helpers';

const emojis = ['😀','😂','😍','🤩','😎','🤔','💪','🔥','⭐','✅','❌','⚠️','🚀','💡','❤️','👏','🎉','✨','📝','📅','⏰','🔔','🏆','💎','☕'];

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd({ text: text.trim(), category, priority, repeat, dueDate: dueDate || null, estimatedMinutes: parseInt(estMin) || 0, notes: notes.trim() });
        setText(''); setCategory('none'); setPriority('none'); setRepeat('none'); setDueDate(''); setEstMin(''); setNotes(''); setExpanded(false);
        inputRef.current?.focus();
    };

    const insertEmoji = (emoji) => {
        const input = inputRef.current; if (!input) return;
        const s = input.selectionStart;
        setText(text.substring(0, s) + emoji + text.substring(s));
        setShowEmoji(false);
        setTimeout(() => { input.focus(); input.setSelectionRange(s + emoji.length, s + emoji.length); }, 0);
    };

    const sel = "w-full px-3 py-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] appearance-none transition-all duration-200";

    return (
        <form onSubmit={handleSubmit} className="mb-5">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden transition-all duration-300"
                style={{boxShadow: 'var(--shadow-md)'}}>
                <div className="flex items-center gap-3 p-3.5">
                    <div className="w-10 h-10 rounded-[var(--radius)] bg-gradient-to-br from-[#4c6ef5] to-[#7c3aed] text-white flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 shadow-sm">
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    </div>
                    <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)}
                        onFocus={() => { if (!expanded) setExpanded(true); }}
                        placeholder="Escribe una nueva tarea..." maxLength={500}
                        className="flex-1 bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] text-[15px] font-medium outline-none min-w-0 py-1.5" />
                    <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                        className="w-9 h-9 rounded-[14px] flex items-center justify-center text-lg shrink-0 hover:bg-[var(--hover)] active:scale-90 transition-all duration-200">😊</button>
                    {text.trim() && (
                        <button type="submit"
                            className="w-10 h-10 rounded-[var(--radius)] bg-gradient-to-br from-[#4c6ef5] to-[#7c3aed] text-white flex items-center justify-center shrink-0 active:scale-90 transition-all duration-200 shadow-md hover:shadow-lg">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    )}
                    {!text.trim() && (
                        <button type="button" onClick={() => setExpanded(!expanded)}
                            className={`w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0 active:scale-90 transition-all duration-200 ${expanded ? 'bg-[var(--accent)] text-white rotate-45' : 'bg-[var(--hover)] text-[var(--text-muted)] hover:bg-[var(--border)]'}`}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                    )}
                </div>

                {showEmoji && (
                    <div className="px-3.5 pb-3.5 animate-[fadeInDown_0.15s_ease]">
                        <div className="grid grid-cols-6 gap-1 p-2.5 bg-[var(--hover)] rounded-[var(--radius)]">
                            {emojis.map(e => (
                                <button key={e} type="button" onClick={() => insertEmoji(e)}
                                    className="aspect-square flex items-center justify-center text-xl rounded-[12px] hover:bg-[var(--card)] active:scale-90 transition-all duration-150">{e}</button>
                            ))}
                        </div>
                    </div>
                )}

                {expanded && (
                    <div className="px-3.5 pb-3.5 space-y-3 animate-[fadeIn_0.2s_ease]">
                        <div className="grid grid-cols-2 gap-2.5">
                            <select value={category} onChange={e => setCategory(e.target.value)} className={sel}
                                style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238896a6' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '28px'}}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className={sel}
                                style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238896a6' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '28px'}}>
                                {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={repeat} onChange={e => setRepeat(e.target.value)} className={sel}
                                style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238896a6' d='M2 3.5l3 3 3-3'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', paddingRight: '28px'}}>
                                <option value="none">Sin repetir</option>
                                <option value="daily">Diario</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                            </select>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={sel} />
                        </div>
                        <input type="number" placeholder="Min estimados" min="0" value={estMin} onChange={e => setEstMin(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-200" style={{backgroundImage:'none'}} />
                        <textarea placeholder="Notas..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                            className="w-full p-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] resize-y leading-snug transition-all duration-200" />
                        <button type="submit" className="w-full py-3.5 rounded-[var(--radius)] bg-gradient-to-r from-[#4c6ef5] to-[#7c3aed] hover:from-[#3b5bdb] hover:to-[#6d28d9] text-white text-sm font-bold active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg">
                            Agregar tarea
                        </button>
                    </div>
                )}
            </div>
        </form>
    );
}
