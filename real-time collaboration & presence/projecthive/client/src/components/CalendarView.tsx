import { useMemo, useState } from 'react';
import { formatTime } from '../utils/format';
import type { CalendarEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

type View = 'month' | 'week' | 'day';

const typeStyles: Record<CalendarEvent['type'], string> = {
  deadline: 'bg-rose-100 text-rose-700',
  meeting: 'bg-indigo-100 text-indigo-700',
  milestone: 'bg-amber-100 text-amber-700',
  task: 'bg-sky-100 text-sky-700',
};

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const startOfWeek = (d: Date) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export default function CalendarView({ events, initialDate }: { events: CalendarEvent[]; initialDate?: Date }) {
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(initialDate ? new Date(initialDate) : new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = new Date(event.date).toDateString();
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    for (const list of map.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    return map;
  }, [events]);

  const shift = (dir: -1 | 1) => {
    const next = new Date(cursor);
    if (view === 'month') next.setMonth(next.getMonth() + dir);
    else if (view === 'week') next.setDate(next.getDate() + dir * 7);
    else next.setDate(next.getDate() + dir);
    setCursor(next);
  };

  const title =
    view === 'month'
      ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `Week of ${startOfWeek(cursor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : cursor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const days: Date[] = [];
  if (view === 'month') {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    for (let i = 0; i < 42; i++) days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  } else if (view === 'week') {
    const start = startOfWeek(cursor);
    for (let i = 0; i < 7; i++) days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  } else {
    days.push(new Date(cursor));
  }

  const renderEvents = (day: Date, max?: number) => {
    const list = byDay.get(day.toDateString()) ?? [];
    const shown = max ? list.slice(0, max) : list;
    return (
      <>
        {shown.map((event) => (
          <span key={event.id} className={`block truncate rounded px-1.5 py-0.5 text-[10.5px] font-semibold leading-4 ${typeStyles[event.type]}`} title={`${event.title} · ${formatTime(event.date)}`}>
            {view !== 'month' && <span className="mr-1 opacity-70">{formatTime(event.date)}</span>}
            {event.title}
          </span>
        ))}
        {max && list.length > max && <span className="block px-1.5 text-[10px] font-medium text-slate-400">+{list.length - max} more</span>}
      </>
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <button className="btn-ghost !p-1.5" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeftIcon size={16} />
          </button>
          <button className="btn-ghost !px-2.5 !py-1 text-xs font-semibold" onClick={() => setCursor(new Date())}>
            Today
          </button>
          <button className="btn-ghost !p-1.5" onClick={() => shift(1)} aria-label="Next">
            <ChevronRightIcon size={16} />
          </button>
        </div>
        <h3 className="min-w-40 text-sm font-bold text-navy-900">{title}</h3>
        <div className="ml-auto flex rounded-lg bg-slate-100 p-0.5">
          {(['month', 'week', 'day'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${view === v ? 'bg-white text-navy-900 shadow-card' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <div>
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = sameDay(day, new Date());
              return (
                <div key={i} className={`min-h-20 border-b border-r border-slate-100 p-1 ${inMonth ? 'bg-white' : 'bg-slate-50/50'} ${i % 7 === 6 ? 'border-r-0' : ''}`}>
                  <span className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${isToday ? 'bg-indigo-600 text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'}`}>
                    {day.getDate()}
                  </span>
                  <div className="space-y-0.5">{renderEvents(day, 3)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`grid ${view === 'week' ? 'grid-cols-1 divide-y divide-slate-100 sm:grid-cols-7 sm:divide-y-0' : ''}`}>
          {days.map((day, i) => (
            <div key={i} className={`p-3 ${view === 'week' ? 'min-h-40 border-r border-slate-100 last:border-r-0' : 'min-h-64'}`}>
              <p className={`mb-2 text-xs font-bold ${sameDay(day, new Date()) ? 'text-indigo-600' : 'text-slate-500'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <div className="space-y-1">
                {renderEvents(day)}
                {(byDay.get(day.toDateString()) ?? []).length === 0 && <p className="text-[11px] text-slate-300">Nothing scheduled</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-2.5">
        {(Object.keys(typeStyles) as CalendarEvent['type'][]).map((type) => (
          <span key={type} className="flex items-center gap-1.5 text-[11px] font-medium capitalize text-slate-500">
            <span className={`h-2.5 w-2.5 rounded-sm ${typeStyles[type]}`} /> {type}
          </span>
        ))}
      </div>
    </div>
  );
}
