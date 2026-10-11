import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../realtime/socket';
import { SOCKET_EVENTS, type CommentNewEvent } from '../realtime/events';
import { relativeTime } from '../utils/format';
import type { Comment } from '../types';
import { Avatar } from './ui';
import { CheckIcon, CommentIcon } from './Icons';

interface Props {
  projectId: string;
  targetType: Comment['targetType'];
  targetId: string;
  title?: string;
  compact?: boolean;
}

interface ThreadComment extends Comment {
  authorName: string;
  avatarColor: string;
}

export default function CommentsPanel({ projectId, targetType, targetId, title = 'Comments', compact = false }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ comments: (Comment & { author?: { name: string; avatarColor: string } })[] }>(
        `/projects/${projectId}/comments?targetType=${targetType}&targetId=${targetId}`,
      )
      .then(({ comments }) =>
        setComments(
          comments.map((c) => ({ ...c, authorName: c.author?.name ?? 'Member', avatarColor: c.author?.avatarColor ?? '#64748b' })),
        ),
      )
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [projectId, targetType, targetId]);

  useEffect(load, [load]);

  // Live comments arriving over Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (event: CommentNewEvent) => {
      if (event.projectId !== projectId || event.comment.targetType !== targetType || event.comment.targetId !== targetId) return;
      setComments((prev) =>
        prev.some((c) => c.id === event.comment.id)
          ? prev
          : [
              ...prev,
              {
                ...(event.comment as unknown as Comment),
                projectId,
                authorName: event.comment.authorName,
                avatarColor: event.comment.avatarColor,
              },
            ],
      );
    };
    socket.on(SOCKET_EVENTS.COMMENT_NEW, onNew);
    return () => {
      socket.off(SOCKET_EVENTS.COMMENT_NEW, onNew);
    };
  }, [projectId, targetType, targetId]);

  const submit = async (parentId: string | null = null) => {
    const body = (parentId ? draft : draft).trim();
    if (!body) return;
    setDraft('');
    setReplyTo(null);
    await api.post(`/projects/${projectId}/comments`, { targetType, targetId, body, parentId }).catch(() => undefined);
    load();
  };

  const toggleResolve = async (id: string) => {
    await api.patch(`/projects/${projectId}/comments/${id}/resolve`).catch(() => undefined);
    load();
  };

  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  const renderComment = (c: ThreadComment, isReply = false) => (
    <div key={c.id} className={`group flex gap-2.5 ${isReply ? 'ml-9' : ''}`}>
      <Avatar name={c.authorName} color={c.avatarColor} size="xs" />
      <div className="min-w-0 flex-1">
        <div className={`rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100 ${c.resolved ? 'opacity-60' : ''}`}>
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-[13px] font-semibold text-navy-900">{c.authorName}</span>
            <span className="text-[11px] text-slate-400">{relativeTime(c.createdAt)}</span>
            {c.resolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 text-[10px] font-semibold text-emerald-600">
                <CheckIcon size={9} /> Resolved
              </span>
            )}
          </div>
          <p className={`mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 ${c.resolved ? 'line-through' : ''}`}>{c.body}</p>
        </div>
        {!isReply && (
          <div className="mt-1 flex gap-3 pl-1 text-[11px] font-medium text-slate-400">
            <button className="hover:text-indigo-600" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
              Reply
            </button>
            <button className="hover:text-emerald-600" onClick={() => toggleResolve(c.id)}>
              {c.resolved ? 'Reopen' : 'Resolve'}
            </button>
          </div>
        )}
        {replyTo === c.id && (
          <div className="mt-1.5 flex gap-2">
            <input
              autoFocus
              className="input !py-1.5 text-[13px]"
              placeholder={`Reply to ${c.authorName}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit(c.id)}
            />
            <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => submit(c.id)}>
              Reply
            </button>
          </div>
        )}
        <div className="mt-2 space-y-2">
          {repliesOf(c.id).map((r) => renderComment(r, true))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={compact ? '' : 'card p-4'}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">
        <CommentIcon size={15} className="text-indigo-500" /> {title}
        {comments.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{comments.length}</span>}
      </h3>
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : (
        <div className="space-y-3">
          {roots.length === 0 && <p className="py-2 text-[13px] text-slate-400">No comments yet. Start the discussion.</p>}
          {roots.map((c) => renderComment(c))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        {user && <Avatar name={user.name} color={user.avatarColor} size="xs" />}
        <input
          className="input"
          placeholder="Write a comment…"
          value={replyTo ? draft : draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(replyTo)}
          aria-label="Write a comment"
        />
        <button className="btn-primary !px-3.5" onClick={() => submit(replyTo)} disabled={!draft.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
