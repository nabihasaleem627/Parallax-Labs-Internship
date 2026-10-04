import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icons';
import { useAuth } from '../lib/AuthContext';

const navigation = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Calendar', path: '/calendar', icon: 'calendar' },
  { label: 'Bookings', path: '/bookings', icon: 'bookings' },
  { label: 'Customers', path: '/customers', icon: 'customers' },
  { label: 'Team', path: '/team', icon: 'team' },
  { label: 'Pricing', path: '/pricing', icon: 'pricing', divider: true },
  { label: 'Billing', path: '/billing', icon: 'billing' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
] as const;

function Brand() {
  return <div className="flex items-center gap-3"><span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white text-ink-950 shadow-sm"><span className="absolute left-0 top-0 h-4 w-4 rounded-br-xl bg-brand-500"/><svg className="relative" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 6.5h5.25a3.25 3.25 0 010 6.5H8V6.5z" stroke="currentColor" strokeWidth="2"/><path d="M8 13h6a3.5 3.5 0 010 7H8v-7z" stroke="currentColor" strokeWidth="2"/></svg></span><span className="text-lg font-bold tracking-tight text-white">BookFlow</span></div>;
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = navigation.find((item) => item.path === location.pathname)?.label || 'BookFlow';

  const sideContent = <>
    <div className="flex h-[74px] items-center justify-between px-5"><Brand/><button className="p-2 text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><Icon name="close"/></button></div>
    <div className="mx-3 mb-5 rounded-xl border border-white/10 bg-white/[.055] p-3">
      <div className="flex items-center gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-400 text-xs font-bold text-white">NS</div><div className="min-w-0 flex-1"><p className="truncate text-xs text-slate-400">Workspace</p><p className="truncate text-sm font-semibold text-white">{user?.tenantName}</p></div><Icon name="chevronDown" size={14} className="text-slate-500"/></div>
    </div>
    <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
      {navigation.map((item) => <div key={item.path} className={'divider' in item && item.divider ? 'border-t border-white/10 pt-4 mt-4' : ''}><NavLink to={item.path} onClick={() => setMobileOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-white/[.1] text-white' : 'text-slate-400 hover:bg-white/[.06] hover:text-white'}`} end={item.path === '/'}><Icon name={item.icon} size={18}/><span>{item.label}</span>{item.label === 'Billing' && <span className="ml-auto rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-100">PRO</span>}</NavLink></div>)}
    </nav>
    <div className="m-3 border-t border-white/10 pt-3"><button onClick={() => { logout(); navigate('/login'); }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[.06]"><span className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white">AM</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{user?.name}</span><span className="block truncate text-xs text-slate-500">{user?.email}</span></span><Icon name="logout" size={17} className="text-slate-500"/></button></div>
  </>;

  return <div className="min-h-screen bg-[#f7f8fb]">
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col bg-ink-900 lg:flex">{sideContent}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm lg:hidden" onMouseDown={(e) => e.currentTarget === e.target && setMobileOpen(false)}><aside className="flex h-full w-[278px] flex-col bg-ink-900 shadow-2xl">{sideContent}</aside></div>}
    <div className="lg:pl-[248px]">
      <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Icon name="menu"/></button><div><p className="text-sm font-semibold text-ink-900 sm:hidden">{title}</p><div className="relative hidden sm:block"><Icon name="search" size={17} className="absolute left-3 top-2.5 text-slate-400"/><input className="h-9 w-64 rounded-xl border-0 bg-slate-100 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Search anything…" aria-label="Search"/></div></div></div>
        <div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>All systems operational</span><button className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Icon name="bell" size={19}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-brand-500"/></button><div className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-xs font-bold text-white">AM</div></div>
      </header>
      <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8"><Outlet/></main>
    </div>
  </div>;
}
