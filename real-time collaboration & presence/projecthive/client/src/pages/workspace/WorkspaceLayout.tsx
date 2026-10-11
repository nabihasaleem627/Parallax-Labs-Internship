import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useProjectRoom, type ConnectionBanner, type ConnectionState } from '../../hooks/useProjectRoom';
import TopBar from '../../components/TopBar';
import { AvatarStack, ProgressBar, Skeleton } from '../../components/ui';
import { ConnectionBannerBar, OfflineBar } from '../../components/Banners';
import { BoardIcon, CalendarIcon, FolderIcon, FlaskIcon, GridIcon, MenuIcon, NotesIcon, PulseIcon, UsersIcon, VideoIcon, XIcon } from '../../components/Icons';
import type { ActivityItem, PresenceMember, Project } from '../../types';

interface WorkspaceContextValue {
  project: Project | null;
  refreshProject: () => void;
  presence: PresenceMember[];
  onlineMembers: PresenceMember[];
  liveActivities: ActivityItem[];
  connectionState: ConnectionState;
  banner: ConnectionBanner;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceLayout');
  return ctx;
}

const SECTIONS = [
  { to: 'overview', label: 'Overview', icon: GridIcon },
  { to: 'tasks', label: 'Tasks', icon: BoardIcon },
  { to: 'notes', label: 'Collaborative Notes', icon: NotesIcon, highlight: true },
  { to: 'documents', label: 'Documents', icon: FolderIcon },
  { to: 'research', label: 'Research', icon: FlaskIcon },
  { to: 'meetings', label: 'Meetings', icon: VideoIcon },
  { to: 'team', label: 'Team', icon: UsersIcon },
  { to: 'activity', label: 'Activity', icon: PulseIcon },
  { to: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

export default function WorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { presence, onlineMembers, liveActivities, connectionState, banner } = useProjectRoom(projectId);

  const refreshProject = useCallback(() => {
    if (!projectId) return;
    api
      .get<{ project: Project }>(`/projects/${projectId}`)
      .then(({ project }) => {
        setProject(project);
        setLoadError(null);
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    refreshProject();
  }, [refreshProject]);

  const ctx: WorkspaceContextValue = { project, refreshProject, presence, onlineMembers, liveActivities, connectionState, banner };
  const offline = connectionState === 'offline';

  const sidebar = (
    <nav className="flex h-full flex-col gap-0.5 p-3" aria-label="Project sections">
      {SECTIONS.map(({ to, label, icon: IconComp, highlight }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition ${
              isActive
                ? highlight
                  ? 'bg-indigo-600 text-white shadow-card'
                  : 'bg-navy-800 text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <IconComp size={16} />
          {label}
          {highlight && (
            <span className="ml-auto hidden rounded-full bg-white/15 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-indigo-200 xl:block">
              Live
            </span>
          )}
        </NavLink>
      ))}
      <div className="mt-auto rounded-lg bg-white/5 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Team online</p>
        <p className="mt-1 text-lg font-extrabold text-white">
          {onlineMembers.length}
          <span className="ml-1 text-xs font-medium text-slate-400">/ {presence.length || project?.members?.length || 0} members</span>
        </p>
        <div className="mt-2.5">
          <AvatarStack
            members={(presence.length ? presence : (project?.members ?? []).map((m) => ({ userId: m.id, name: m.name, role: m.role, avatarColor: m.avatarColor, activity: 'Offline', online: false })))
              .slice(0, 5)
              .map((m) => ({ userId: m.userId, name: m.name, role: String(m.role), avatarColor: m.avatarColor, activity: m.activity, online: m.online }))}
            max={4}
          />
        </div>
      </div>
    </nav>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Skeleton className="h-8 w-72" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
            <Skeleton className="hidden h-96 rounded-xl lg:block" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-xl font-extrabold text-navy-900">Project unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{loadError ?? 'This project could not be loaded. You may not be a member.'}</p>
          <NavLink to="/" className="btn-primary mt-6 inline-flex">
            Back to dashboard
          </NavLink>
        </main>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={ctx}>
      <div className="flex min-h-screen flex-col">
        <TopBar>
          <span className="truncate">
            <NavLink to="/" className="hover:text-indigo-600">Dashboard</NavLink>
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="font-semibold text-navy-900">{project.title}</span>
          </span>
        </TopBar>
        <ConnectionBannerBar banner={banner} />
        <OfflineBar show={offline} />

        <div className="mx-auto flex w-full max-w-[1440px] flex-1">
          {/* Desktop sidebar */}
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 flex-shrink-0 overflow-y-auto bg-navy-900 lg:block">{sidebar}</aside>

          {/* Mobile drawer */}
          {drawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
              <aside className="absolute left-0 top-0 h-full w-64 animate-fade-in overflow-y-auto bg-navy-900">
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="truncate text-sm font-bold text-white">{project.title}</p>
                  <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close navigation">
                    <XIcon size={18} />
                  </button>
                </div>
                {sidebar}
              </aside>
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Project header */}
            <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-start gap-3">
                <button className="btn-ghost -ml-2 !p-2 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
                  <MenuIcon size={20} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="truncate text-lg font-extrabold tracking-tight text-navy-900 sm:text-xl">{project.title}</h1>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${project.status === 'active' ? 'bg-emerald-50 text-emerald-600' : project.status === 'completed' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {project.category} · {project.department ?? ''} · Supervisor: {project.supervisor?.name ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden w-40 sm:block">
                    <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Progress</span>
                      <span className="text-indigo-600">{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="hidden text-right text-[11px] font-medium leading-4 text-slate-500 md:block">
                      <span className="block font-bold text-navy-900">{onlineMembers.length} online</span>
                      {onlineMembers.length === 1 ? 'viewing now' : 'viewing now'}
                    </span>
                    <AvatarStack
                      members={(presence.length ? presence : []).map((m) => ({ userId: m.userId, name: m.name, role: m.role, avatarColor: m.avatarColor, activity: m.activity, online: m.online }))}
                      max={4}
                    />
                  </div>
                </div>
              </div>
            </div>

            <main className="px-4 py-5 sm:px-6 sm:py-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}

export function WorkspaceCard({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3.5 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-bold text-navy-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
