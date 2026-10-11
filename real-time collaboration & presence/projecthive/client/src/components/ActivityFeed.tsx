import { dayKey, formatTime } from '../utils/format';
import type { ActivityItem } from '../types';
import { Avatar, Skeleton } from './ui';

export default function ActivityFeed({ activities, loading = false, limit }: { activities: ActivityItem[]; loading?: boolean; limit?: number }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = limit ? activities.slice(0, limit) : activities;
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No activity yet.</p>;
  }

  const groups: { day: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const key = dayKey(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === key) last.items.push(item);
    else groups.push({ day: key, items: [item] });
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.day}>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.day}</p>
          <ol className="relative space-y-3.5 border-l border-slate-100 pl-5">
            {group.items.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[27px] top-0.5">
                  <Avatar name={a.userName} color={a.avatarColor} size="xs" />
                </span>
                <p className="text-[13px] leading-snug text-slate-700">{a.message}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{formatTime(a.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
