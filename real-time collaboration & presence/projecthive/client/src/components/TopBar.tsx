import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { relativeTime } from '../utils/format';
import type { Notification } from '../types';
import { Avatar, Badge } from './ui';
import { BellIcon, ChevronDownIcon, HexagonIcon, LogoutIcon, SettingsIcon } from './Icons';

export default function TopBar({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [openPanel, setOpenPanel] = useState<'none' | 'notifications' | 'user'>('none');
  const rootRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    api
      .get<{ notifications: Notification[]; unreadCount: number }>('/notifications')
      .then((data) => {
        setNotifications(data.notifications);
        setUnread(data.unreadCount);
      })
      .catch(() => undefined);
  };

  useEffect(loadNotifications, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenPanel('none');
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const toggleNotifications = () => {
    const next = openPanel === 'notifications' ? 'none' : 'notifications';
    setOpenPanel(next);
    if (next === 'notifications') {
      loadNotifications();
      window.setTimeout(() => {
        api.post('/notifications/read-all').then(() => setUnread(0)).catch(() => undefined);
      }, 1800);
    }
  };

  return (
    <header ref={rootRef} className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-indigo-300">
            <HexagonIcon size={18} />
          </span>
          <span className="hidden text-[15px] font-extrabold tracking-tight text-navy-900 sm:block">
            Project<span className="text-indigo-600">Hive</span>
          </span>
        </Link>

        <div className="mx-2 hidden h-5 w-px bg-slate-200 sm:block" />
        <div className="min-w-0 flex-1 truncate text-sm font-medium text-slate-500">{children}</div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={toggleNotifications} className="btn-ghost relative !px-2" aria-label={`Notifications (${unread} unread)`}>
            <BellIcon size={18} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {openPanel === 'notifications' && (
            <div className="absolute right-0 mt-2 w-80 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop sm:w-96">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-navy-900">Notifications</p>
                {unread > 0 && <Badge tone="red">{unread} new</Badge>}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">You're all caught up.</p>}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${!n.read ? 'bg-indigo-50/40' : ''}`}
                    onClick={() => {
                      setOpenPanel('none');
                      if (n.projectId) navigate(`/projects/${n.projectId}/overview`);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-indigo-500'}`} />
                      <span className="truncate text-[13px] font-semibold text-navy-900">{n.title}</span>
                    </span>
                    <span className="line-clamp-2 pl-3.5 text-xs text-slate-500">{n.body}</span>
                    <span className="pl-3.5 text-[11px] text-slate-400">{relativeTime(n.createdAt)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setOpenPanel(openPanel === 'user' ? 'none' : 'user')} className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-100" aria-label="Account menu">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            <span className="hidden text-left md:block">
              <span className="block text-[13px] font-semibold leading-4 text-navy-900">{user.name}</span>
              <span className="block text-[11px] capitalize leading-4 text-slate-400">{user.role}</span>
            </span>
            <ChevronDownIcon size={14} className="hidden text-slate-400 md:block" />
          </button>
          {openPanel === 'user' && (
            <div className="absolute right-0 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-pop">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-sm font-bold text-navy-900">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
                <p className="mt-1 text-xs capitalize text-indigo-600">{user.role} · {user.department}</p>
              </div>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setOpenPanel('none')} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                  <SettingsIcon size={15} /> Admin Console
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogoutIcon size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
