import { useState, useMemo } from 'react';
import { categories } from '../utils/helpers';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function CalendarView({ tasks, onSetDueDate }) {
    const [date, setDate] = useState(new Date());
    const calendarData = useMemo(() => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = lastDay.getDate();
        const prevMonthLast = new Date(year, month, 0).getDate();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const days = [];
        for (let i = startDay - 1; i >= 0; i--) days.push({ day: prevMonthLast - i, otherMonth: true, dateStr: null, isToday: false, tasks: [] });
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const d = new Date(year, month, day);
            const dayTasks = tasks.filter(t => t.dueDate === dateStr);
            days.push({ day, otherMonth: false, dateStr, isToday: d.getTime() === today.getTime(), tasks: dayTasks });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) days.push({ day: i, otherMonth: true, dateStr: null, isToday: false, tasks: [] });
        return { year, month, days };
    }, [date, tasks]);

    const prev = () => { const d = new Date(date); d.setMonth(d.getMonth() - 1); setDate(d); };
    const next = () => { const d = new Date(date); d.setMonth(d.getMonth() + 1); setDate(d); };

    const totalTasks = tasks.filter(t => t.dueDate && !t.completed).length;
    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < new Date(new Date().toDateString());
    }).length;

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-5 animate-[fadeIn_0.2s_ease]"
            style={{boxShadow: 'var(--shadow-md)'}}>
            <div className="flex justify-between items-center mb-5">
                <button onClick={prev} className="w-10 h-10 rounded-[var(--radius)] bg-[var(--hover)] text-[var(--text)] flex items-center justify-center active:scale-90 transition-all duration-200 hover:bg-[var(--border)]">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="text-center">
                    <h3 className="text-[17px] font-extrabold text-[var(--text)]">{monthNames[calendarData.month]} {calendarData.year}</h3>
                    {overdueTasks > 0 && <p className="text-[11px] text-[var(--danger)] font-bold mt-0.5">{overdueTasks} vencida{overdueTasks > 1 ? 's' : ''}</p>}
                </div>
                <button onClick={next} className="w-10 h-10 rounded-[var(--radius)] bg-[var(--hover)] text-[var(--text)] flex items-center justify-center active:scale-90 transition-all duration-200 hover:bg-[var(--border)]">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-2">
                {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(d => (
                    <span key={d} className="text-center text-[10px] font-bold text-[var(--text-muted)] uppercase py-1.5 tracking-wider">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
                {calendarData.days.map((d, i) => (
                    <button key={i} onClick={() => d.dateStr && onSetDueDate(d.dateStr)}
                        disabled={!d.dateStr}
                        className={`aspect-square flex flex-col items-center justify-center rounded-[12px] min-h-[44px] transition-all duration-200 ${d.otherMonth ? 'opacity-20' : 'active:scale-90'} ${d.isToday ? 'bg-gradient-to-br from-[#4c6ef5] to-[#7c3aed] text-white font-bold shadow-md' : 'text-[var(--text)] hover:bg-[var(--hover)]'}`}
                        style={d.isToday ? {boxShadow: '0 2px 8px rgba(76,110,245,0.3)'} : {}}>
                        <span className="text-[13px] font-medium">{d.day}</span>
                        {d.tasks.length > 0 && (
                            <div className="flex gap-px mt-0.5">
                                {d.tasks.slice(0, 3).map((t, j) => {
                                    const cat = categories.find(c => c.id === (t.category || 'none'));
                                    return <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: d.isToday ? 'white' : (cat ? cat.color : 'var(--text-muted)') }} />;
                                })}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between text-xs text-[var(--text-muted)] font-semibold">
                <span>{totalTasks} tarea{totalTasks !== 1 ? 's' : ''} con fecha</span>
                <span>{tasks.filter(t => t.completed && t.dueDate).length} completada{tasks.filter(t => t.completed && t.dueDate).length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    );
}
