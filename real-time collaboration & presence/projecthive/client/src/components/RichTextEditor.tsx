import { useCallback, useEffect, useRef } from 'react';
import { BoldIcon, CheckSquareIcon, HeadingIcon, ItalicIcon, LinkIcon, ListIcon, OrderedListIcon } from './Icons';

interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
  onFocusChange?: (focused: boolean) => void;
  editable?: boolean;
  ariaLabel?: string;
}

type Cmd = 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'link' | 'checklist';

const TOOLBAR: { cmd: Cmd; label: string; icon: typeof BoldIcon }[] = [
  { cmd: 'h1', label: 'Title', icon: HeadingIcon },
  { cmd: 'h2', label: 'Heading', icon: HeadingIcon },
  { cmd: 'bold', label: 'Bold (Ctrl+B)', icon: BoldIcon },
  { cmd: 'italic', label: 'Italic (Ctrl+I)', icon: ItalicIcon },
  { cmd: 'ul', label: 'Bullet list', icon: ListIcon },
  { cmd: 'ol', label: 'Numbered list', icon: OrderedListIcon },
  { cmd: 'checklist', label: 'Checklist', icon: CheckSquareIcon },
  { cmd: 'link', label: 'Insert link', icon: LinkIcon },
];

/**
 * Dependency-free rich text editor built on contentEditable.
 * External (remote) updates are applied only when they differ from what the
 * user currently has, so the caret is never reset while typing.
 */
export default function RichTextEditor({ html, onChange, onFocusChange, editable = true, ariaLabel = 'Collaborative document editor' }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);

  // Remote/local state sync: replace DOM content only when it actually differs
  // (the parent never pushes remote content while a local dirty draft exists).
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }, [html]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (el) onChange(el.innerHTML);
  }, [onChange]);

  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    emit();
  };

  const applyCommand = (cmd: Cmd) => {
    switch (cmd) {
      case 'bold':
        return exec('bold');
      case 'italic':
        return exec('italic');
      case 'h1':
        return exec('formatBlock', '<h1>');
      case 'h2':
        return exec('formatBlock', '<h2>');
      case 'h3':
        return exec('formatBlock', '<h3>');
      case 'p':
        return exec('formatBlock', '<p>');
      case 'ul':
        return exec('insertUnorderedList');
      case 'ol':
        return exec('insertOrderedList');
      case 'link': {
        const url = window.prompt('Link URL', 'https://');
        if (url && url !== 'https://') exec('createLink', url);
        return;
      }
      case 'checklist': {
        const el = ref.current;
        if (!el) return;
        const selection = window.getSelection();
        const node = selection?.anchorNode;
        const li = node instanceof Element ? node.closest('li') : node?.parentElement?.closest('li');
        if (li) {
          // Already inside a list — convert the whole list to a checklist.
          const list = li.closest('ul, ol');
          const checklist = document.createElement('ul');
          checklist.className = 'checklist';
          for (const item of Array.from(list?.children ?? [])) {
            const newLi = document.createElement('li');
            newLi.setAttribute('data-checked', 'false');
            newLi.innerHTML = item.innerHTML;
            checklist.appendChild(newLi);
          }
          list?.replaceWith(checklist);
        } else {
          document.execCommand('insertUnorderedList');
          const sel2 = window.getSelection()?.anchorNode;
          const li2 = sel2 instanceof Element ? sel2.closest('li') : sel2?.parentElement?.closest('li');
          const list2 = li2?.closest('ul');
          if (list2) {
            list2.classList.add('checklist');
            for (const item of Array.from(list2.children)) item.setAttribute('data-checked', 'false');
          }
        }
        emit();
        return;
      }
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const li = target.closest('li');
    const list = li?.closest('ul.checklist');
    if (li && list) {
      // Clicking near the start of a checklist item toggles its checkbox.
      const rect = li.getBoundingClientRect();
      if (event.clientX - rect.left < 30) {
        li.setAttribute('data-checked', li.getAttribute('data-checked') === 'true' ? 'false' : 'true');
        emit();
      }
    }
    if (target.closest('a')) event.preventDefault();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      emit();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      applyCommand('bold');
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      applyCommand('italic');
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-2 py-1.5">
        {TOOLBAR.map(({ cmd, label, icon: IconComp }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            aria-label={label}
            disabled={!editable}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyCommand(cmd)}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-navy-800 hover:shadow-card disabled:opacity-40"
          >
            <IconComp size={16} />
          </button>
        ))}
        <span className="ml-auto hidden pr-2 text-[11px] text-slate-400 sm:block">Ctrl+B bold · Ctrl+I italic · Ctrl+S save now</span>
      </div>
      <div
        ref={ref}
        className="doc-content max-h-none min-h-[420px] px-5 py-4 sm:px-8 sm:py-6"
        contentEditable={editable}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        onInput={emit}
        onBlur={() => {
          focusedRef.current = false;
          onFocusChange?.(false);
          emit();
        }}
        onFocus={() => {
          focusedRef.current = true;
          onFocusChange?.(true);
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
