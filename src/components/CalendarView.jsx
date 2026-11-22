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
            const current = new Date(year, month, day);
            const dayTasks = tasks.filter(task => task.dueDate === dateStr);
            days.push({ day, otherMonth: false, dateStr, isToday: current.getTime() === today.getTime(), tasks: dayTasks });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) days.push({ day: i, otherMonth: true, dateStr: null, isToday: false, tasks: [] });
        return { year, month, days };
    }, [date, tasks]);

    const prev = () => { const next = new Date(date); next.setMonth(next.getMonth() - 1); setDate(next); };
    const next = () => { const following = new Date(date); following.setMonth(following.getMonth() + 1); setDate(following); };

    const totalTasks = tasks.filter(task => task.dueDate && !task.completed).length;
    const overdueTasks = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        return new Date(task.dueDate) < new Date(new Date().toDateString());
    }).length;
    const completedDated = tasks.filter(task => task.completed && task.dueDate).length;
    const navButton = 'w-9 h-9 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center active:scale-90 transition-colors duration-150 hover:text-[var(--text)] hover:border-[var(--border-strong)]';

    return (
        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] p-4 animate-[fadeIn_0.2s_ease]">
            <div className="flex justify-between items-center mb-5">
                <button onClick={prev} aria-label="Mes anterior" className={navButton}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <div className="text-center">
                    <h3 className="brand-type text-[19px] leading-none text-[var(--text)]">{monthNames[calendarData.month]} {calendarData.year}</h3>
                    {overdueTasks > 0 && <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--danger)]">{overdueTasks} vencida{overdueTasks > 1 ? 's' : ''}</p>}
                </div>
                <button onClick={next} aria-label="Mes siguiente" className={navButton}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1.5">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
                    <span key={day} className="text-center text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)] py-1">{day}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarData.days.map((day, index) => (
                    <button key={index} onClick={() => day.dateStr && onSetDueDate(day.dateStr)}
                        disabled={!day.dateStr}
                        aria-label={day.dateStr ? `Asignar fecha ${day.day}` : undefined}
                        className={`aspect-square flex flex-col items-center justify-center rounded-[var(--radius-sm)] min-h-[42px] transition-colors duration-150 ${day.otherMonth ? 'opacity-20' : 'active:scale-95'} ${day.isToday ? 'bg-[var(--accent-fill)] text-[var(--on-accent)]' : 'text-[var(--text)] hover:bg-[var(--hover)]'}`}>
                        <span className={`text-[12px] ${day.isToday ? 'font-semibold' : ''}`}>{day.day}</span>
                        {day.tasks.length > 0 && (
                            <div className="flex gap-[2px] mt-1">
                                {day.tasks.slice(0, 3).map((task, taskIndex) => {
                                    const category = categories.find(item => item.id === (task.category || 'none'));
                                    return <div key={taskIndex} className="w-1 h-1 rounded-full"
                                        style={{ background: day.isToday ? 'var(--on-accent)' : (task.completed ? 'var(--border-strong)' : category && category.id !== 'none' ? category.color : 'var(--text-muted)') }} />;
                                })}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                <span>{totalTasks} con fecha</span>
                <span>{completedDated} hecha{completedDated !== 1 ? 's' : ''}</span>
            </div>
        </div>
    );
}
