import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getToken } from '../../api/client';
import { useWorkspace } from './WorkspaceLayout';
import { Avatar, Badge, EmptyState, PageSkeleton } from '../../components/ui';
import { DownloadIcon, EditIcon, FileIcon, FolderIcon, TrashIcon, UploadIcon } from '../../components/Icons';
import { formatBytes, formatDate } from '../../utils/format';
import type { ProjectFile, User } from '../../types';

const extIconTone: Record<string, string> = {
  pdf: 'bg-rose-50 text-rose-600',
  doc: 'bg-sky-50 text-sky-600',
  docx: 'bg-sky-50 text-sky-600',
  png: 'bg-emerald-50 text-emerald-600',
  jpg: 'bg-emerald-50 text-emerald-600',
  txt: 'bg-slate-100 text-slate-600',
  zip: 'bg-amber-50 text-amber-600',
};

const toneFor = (name: string) => extIconTone[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'bg-indigo-50 text-indigo-600';

export default function DocumentsPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { project } = useWorkspace();
  const [files, setFiles] = useState<ProjectFile[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [renaming, setRenaming] = useState<ProjectFile | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api.get<{ files: ProjectFile[] }>(`/projects/${projectId}/files`).then(({ files }) => setFiles(files)).catch(() => setFiles([]));
  }, [projectId]);

  useEffect(load, [load]);

  const upload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await api.post(`/projects/${projectId}/files`, { name: file.name, type: file.type || 'application/octet-stream', contentBase64 });
      load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const download = async (file: ProjectFile) => {
    const res = await fetch(`/api/projects/${projectId}/files/${file.id}/download`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (file: ProjectFile) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    await api.delete(`/projects/${projectId}/files/${file.id}`).catch(() => undefined);
    load();
  };

  const submitRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    await api.patch(`/projects/${projectId}/files/${renaming.id}`, { name: renameValue.trim() }).catch(() => undefined);
    setRenaming(null);
    load();
  };

  if (!files || !project) return <PageSkeleton rows={2} />;
  const members: User[] = project.members ?? [];
  const memberOf = (id: string) => members.find((m) => m.id === id);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-900">Documents</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">{files.length} files in the project library</p>
        </div>
        <div>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => upload(e.target.files)} aria-label="Upload file" />
          <button className="btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <UploadIcon size={15} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={<FolderIcon size={22} />}
          title="No documents yet"
          description="Upload reports, diagrams and drafts so the whole team can access them."
        />
      ) : (
        <div className="card divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Uploaded by</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const uploader = memberOf(file.uploadedById);
                return (
                  <tr key={file.id} className="group transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${toneFor(file.name)}`}>
                          <FileIcon size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-semibold text-navy-900">{file.name}</p>
                          <p className="text-[11px] text-slate-400">{file.type.split('/').pop()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {uploader ? (
                        <span className="flex items-center gap-2">
                          <Avatar name={uploader.name} color={uploader.avatarColor} size="xs" />
                          <span className="text-[13px] text-slate-600">{file.uploadedByName ?? uploader.name}</span>
                        </span>
                      ) : (
                        <span className="text-[13px] text-slate-400">{file.uploadedByName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-500">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-500">{formatBytes(file.sizeBytes)}</td>
                    <td className="px-4 py-3">
                      <Badge tone="slate">v{file.version}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                        <button className="btn-ghost !p-1.5" title="Download" onClick={() => download(file)} aria-label={`Download ${file.name}`}>
                          <DownloadIcon size={15} />
                        </button>
                        <button
                          className="btn-ghost !p-1.5"
                          title="Rename"
                          onClick={() => {
                            setRenaming(file);
                            setRenameValue(file.name);
                          }}
                          aria-label={`Rename ${file.name}`}
                        >
                          <EditIcon size={15} />
                        </button>
                        <button className="btn-ghost !p-1.5 text-rose-500 hover:bg-rose-50" title="Delete" onClick={() => remove(file)} aria-label={`Delete ${file.name}`}>
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && setRenaming(null)}>
          <div className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-5 shadow-pop">
            <h3 className="text-base font-bold text-navy-900">Rename file</h3>
            <input className="input mt-3" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitRename()} autoFocus />
            <div className="mt-4 flex gap-2">
              <button className="btn-primary flex-1" onClick={submitRename}>Save</button>
              <button className="btn-secondary flex-1" onClick={() => setRenaming(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
