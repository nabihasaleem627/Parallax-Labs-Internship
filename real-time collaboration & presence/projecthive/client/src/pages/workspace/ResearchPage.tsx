import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useWorkspace } from './WorkspaceLayout';
import DocWorkspace from '../../components/DocWorkspace';
import CommentsPanel from '../../components/CommentsPanel';
import { PageSkeleton } from '../../components/ui';
import { FlaskIcon } from '../../components/Icons';
import type { ResearchSection } from '../../types';

const SECTION_ICONS: Record<string, string> = {
  questions: '❓',
  objectives: '🎯',
  literature: '📚',
  methodology: '🧪',
  references: '🔗',
  findings: '💡',
};

export default function ResearchPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { presence } = useWorkspace();
  const [sections, setSections] = useState<ResearchSection[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ sections: ResearchSection[] }>(`/projects/${projectId}/research/sections`)
      .then(({ sections }) => {
        setSections(sections);
        setActiveId((current) => current ?? sections[0]?.documentId ?? null);
      })
      .catch(() => setSections([]));
  }, [projectId]);

  if (!sections) return <PageSkeleton rows={1} />;
  const active = sections.find((s) => s.documentId === activeId) ?? sections[0];

  if (sections.length === 0 || !active?.document) {
    return (
      <div className="card flex flex-col items-center gap-3 py-16 text-center">
        <FlaskIcon size={26} className="text-indigo-400" />
        <h2 className="text-base font-bold text-navy-900">No research sections yet</h2>
        <p className="max-w-sm text-sm text-slate-500">Research questions, objectives, literature review, methodology, references and findings will appear here as collaborative cards.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Section cards */}
      <aside className="space-y-2.5">
        <h1 className="mb-1 text-lg font-extrabold tracking-tight text-navy-900">Research</h1>
        <p className="mb-3 text-xs text-slate-400">Each section is a live collaborative document.</p>
        {sections.map((section) => {
          const isActive = section.documentId === active.documentId;
          return (
            <button
              key={section.id}
              onClick={() => setActiveId(section.documentId)}
              className={`w-full rounded-xl border p-3.5 text-left transition ${
                isActive ? 'border-indigo-400 bg-indigo-50/70 shadow-card ring-1 ring-indigo-200' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg" aria-hidden>{SECTION_ICONS[section.key] ?? '📄'}</span>
                <div className="min-w-0">
                  <p className={`truncate text-[13.5px] font-bold ${isActive ? 'text-indigo-800' : 'text-navy-900'}`}>{section.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {section.document ? `v${section.document.version}` : 'No document'}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Active section editor */}
      <div className="min-w-0">
        <DocWorkspace
          key={active.document.id}
          projectId={projectId}
          documentId={active.document.id}
          title={active.title}
          presence={presence}
        />
        <div className="mt-5">
          <CommentsPanel projectId={projectId} targetType="document" targetId={active.document.id} title={`Comments on ${active.title}`} />
        </div>
      </div>
    </div>
  );
}
