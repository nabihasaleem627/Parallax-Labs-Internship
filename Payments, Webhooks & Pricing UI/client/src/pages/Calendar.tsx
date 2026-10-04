import { useState } from 'react';
import { Icon } from '../components/Icons';
import { PageHeader } from '../components/UI';

const events = [
  { day: 0, top: 58, height: 62, name: 'Strategy call', person: 'Sophia B.', color: 'bg-violet-100 border-violet-300 text-violet-900' },
  { day: 1, top: 128, height: 78, name: 'Onboarding', person: 'Liam C.', color: 'bg-blue-100 border-blue-300 text-blue-900' },
  { day: 2, top: 26, height: 96, name: 'Team workshop', person: 'Maya R.', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
  { day: 3, top: 176, height: 62, name: 'Follow-up', person: 'Noah W.', color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { day: 4, top: 80, height: 62, name: 'Discovery call', person: 'Emma K.', color: 'bg-pink-100 border-pink-300 text-pink-900' },
];
export default function Calendar() {
  const [view, setView] = useState('Week');
  const days = [{d:'MON',n:5},{d:'TUE',n:6},{d:'WED',n:7},{d:'THU',n:8},{d:'FRI',n:9}];
  return <><PageHeader title="Calendar" description="See your team’s availability and upcoming schedule." actions={<><div className="hidden rounded-xl border border-slate-200 bg-white p-1 sm:flex">{['Day','Week','Month'].map(x => <button key={x} onClick={() => setView(x)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view===x?'bg-ink-900 text-white':'text-slate-500'}`}>{x}</button>)}</div><button className="btn-primary"><Icon name="plus" size={17}/>Add booking</button></>}/>
    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div className="flex items-center gap-2"><button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"><Icon name="chevron" className="rotate-180" size={16}/></button><button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"><Icon name="chevron" size={16}/></button><h2 className="ml-2 text-sm font-semibold text-ink-900">October 5–9, 2026</h2></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Today</button></div><div className="overflow-x-auto"><div className="min-w-[740px]"><div className="calendar-grid border-b border-slate-100"><div/><div className="col-span-5 grid grid-cols-5">{days.map((day,i)=><div key={day.d} className={`border-l border-slate-100 py-3 text-center ${i===0?'bg-brand-50/40':''}`}><p className="text-[10px] font-semibold text-slate-400">{day.d}</p><p className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${i===0?'bg-brand-600 text-white':'text-ink-900'}`}>{day.n}</p></div>)}</div></div><div className="calendar-grid"><div className="relative h-[520px] border-r border-slate-100">{['9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM'].map((time,i)=><span key={time} className="absolute right-2 -translate-y-2 text-[10px] text-slate-400" style={{top:i*65}}>{time}</span>)}</div>{days.map((_, day) => <div key={day} className="relative h-[520px] border-r border-slate-100 last:border-r-0">{Array.from({length:8}).map((__,i)=><div key={i} className="h-[65px] border-b border-slate-100"/>)}{events.filter(e=>e.day===day).map(e=><button key={e.name} className={`absolute left-2 right-2 overflow-hidden rounded-lg border-l-4 p-2 text-left shadow-sm ${e.color}`} style={{top:e.top,height:e.height}}><p className="truncate text-xs font-bold">{e.name}</p><p className="mt-1 truncate text-[10px] opacity-70">{e.person}</p></button>)}</div>)}</div></div></div></section>
  </>;
}
