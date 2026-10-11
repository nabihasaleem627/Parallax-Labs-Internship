import { useAuth } from '../context/AuthContext';
import { useCollaborativeDocument, useTypingUsers } from '../hooks/useCollaborativeDocument';
import RichTextEditor from './RichTextEditor';
import { ConflictDialog, SaveStatusIndicator, TypingIndicator } from './realtime-ui';
import { AvatarStack } from './ui';
import type { PresenceMember } from '../types';

interface Props {
  projectId: string;
  documentId: string;
  title: string;
  presence: PresenceMember[];
  subtitle?: string;
}

/**
 * The multiplayer document surface: presence header, live editor,
 * typing indicator, save status, and conflict resolution dialog.
 */
export default function DocWorkspace({ projectId, documentId, title, presence, subtitle }: Props) {
  const { user } = useAuth();
  const engine = useCollaborativeDocument(projectId, documentId);
  const typing = useTypingUsers(projectId, documentId, user?.id);
  const viewers = presence.filter((m) => m.online);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500" aria-live="polite">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {viewers.length} {viewers.length === 1 ? 'person' : 'people'} currently viewing
            </span>
            {viewers.length > 0 && <span className="text-slate-400">·</span>}
            <span className="truncate text-slate-500">{viewers.map((v) => v.name.split(' ')[0]).join(', ') || subtitle}</span>
            {engine.doc && (
              <>
                <span className="text-slate-300">·</span>
                <span className="rounded bg-slate-100 px-1.5 py-px font-mono text-[11px] font-semibold text-slate-500" title="Document version (optimistic concurrency control)">
                  v{engine.doc.version}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={engine.saveStatus} lastSavedAt={engine.lastSavedAt} />
          <AvatarStack
            members={viewers.map((m) => ({ userId: m.userId, name: m.name, role: m.role, avatarColor: m.avatarColor, activity: m.activity, online: true }))}
            max={5}
          />
        </div>
      </div>

      {/* Editor */}
      {engine.error ? (
        <div className="card border-rose-200 bg-rose-50/50 p-8 text-center">
          <p className="text-sm font-semibold text-rose-700">{engine.error}</p>
          <p className="mt-1 text-xs text-rose-500">Check that you are still a member of this project, then reload.</p>
        </div>
      ) : engine.saveStatus === 'loading' && !engine.doc ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="space-y-3">
            <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-11/12 animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ) : (
        <RichTextEditor
          html={engine.content}
          onChange={engine.onLocalChange}
          onFocusChange={engine.onFocusChange}
          ariaLabel={`${title} collaborative editor`}
        />
      )}

      {/* Typing indicator */}
      <div className="mt-2">
        <TypingIndicator names={typing.map((t) => t.name)} />
      </div>

      {/* Conflict dialog */}
      {engine.conflict && (
        <ConflictDialog
          conflict={engine.conflict}
          localDraft={engine.content}
          onLoadLatest={engine.loadLatestVersion}
          onKeepMine={engine.keepMyDraft}
          onClose={engine.loadLatestVersion}
        />
      )}
    </div>
  );
}
