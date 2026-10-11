import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HexagonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5L12 2.5z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
  </Icon>
);
export const GridIcon = (p: IconProps) => (<Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Icon>);
export const BoardIcon = (p: IconProps) => (<Icon {...p}><rect x="3" y="3" width="5.5" height="18" rx="1.5" /><rect x="9.75" y="3" width="5.5" height="12" rx="1.5" /><rect x="16.5" y="3" width="4.5" height="8" rx="1.5" /></Icon>);
export const NotesIcon = (p: IconProps) => (<Icon {...p}><path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5" /><path d="M8 13h8M8 17h5" /></Icon>);
export const FolderIcon = (p: IconProps) => (<Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></Icon>);
export const FlaskIcon = (p: IconProps) => (<Icon {...p}><path d="M9 3h6M10 3v6.5L4.8 18A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-3L14 9.5V3" /><path d="M7.5 15h9" /></Icon>);
export const VideoIcon = (p: IconProps) => (<Icon {...p}><rect x="2.5" y="6" width="13" height="12" rx="2" /><path d="M15.5 10.5l6-3.5v10l-6-3.5" /></Icon>);
export const UsersIcon = (p: IconProps) => (<Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 14.4A6.5 6.5 0 0 1 21.5 20" /></Icon>);
export const PulseIcon = (p: IconProps) => (<Icon {...p}><path d="M3 12h4l2.5-7 4 14 2.5-7h5" /></Icon>);
export const CalendarIcon = (p: IconProps) => (<Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Icon>);
export const BellIcon = (p: IconProps) => (<Icon {...p}><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></Icon>);
export const PlusIcon = (p: IconProps) => (<Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>);
export const CheckIcon = (p: IconProps) => (<Icon {...p}><path d="M4 12.5l5 5L20 6.5" /></Icon>);
export const XIcon = (p: IconProps) => (<Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>);
export const ChevronDownIcon = (p: IconProps) => (<Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>);
export const ChevronLeftIcon = (p: IconProps) => (<Icon {...p}><path d="M15 5l-7 7 7 7" /></Icon>);
export const ChevronRightIcon = (p: IconProps) => (<Icon {...p}><path d="M9 5l7 7-7 7" /></Icon>);
export const MenuIcon = (p: IconProps) => (<Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>);
export const LogoutIcon = (p: IconProps) => (<Icon {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4M6 12h9" /></Icon>);
export const BoldIcon = (p: IconProps) => (<Icon {...p}><path d="M7 5h6.5a3.5 3.5 0 0 1 0 7H7V5z" /><path d="M7 12h7.5a3.5 3.5 0 0 1 0 7H7v-7z" /></Icon>);
export const ItalicIcon = (p: IconProps) => (<Icon {...p}><path d="M10 5h7M7 19h7M14.5 5L10 19" /></Icon>);
export const HeadingIcon = (p: IconProps) => (<Icon {...p}><path d="M6 5v14M14 5v14M6 12h8M17 19v-8.5a2 2 0 0 1 4 0V19" /></Icon>);
export const ListIcon = (p: IconProps) => (<Icon {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" /></Icon>);
export const OrderedListIcon = (p: IconProps) => (<Icon {...p}><path d="M10 6h11M10 12h11M10 18h11" /><path d="M4 5.5h1.2V9M3.5 14.5c0-.8 1.7-1 1.7-.2 0 .6-1.7 1.1-1.7 2.2h1.9" strokeWidth={1.4} /></Icon>);
export const LinkIcon = (p: IconProps) => (<Icon {...p}><path d="M10 13a4.5 4.5 0 0 0 6.7.4l2.1-2.1a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" /><path d="M14 11a4.5 4.5 0 0 0-6.7-.4L5.2 12.7a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></Icon>);
export const CheckSquareIcon = (p: IconProps) => (<Icon {...p}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11M4 5.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V12" /><path d="M9.5 12.5l2 2 8-8.5" /></Icon>);
export const UploadIcon = (p: IconProps) => (<Icon {...p}><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></Icon>);
export const DownloadIcon = (p: IconProps) => (<Icon {...p}><path d="M12 4v12m0 0l-4.5-4.5M12 16l4.5-4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></Icon>);
export const TrashIcon = (p: IconProps) => (<Icon {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" /></Icon>);
export const EditIcon = (p: IconProps) => (<Icon {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></Icon>);
export const CommentIcon = (p: IconProps) => (<Icon {...p}><path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.7A8 8 0 1 1 21 12z" /></Icon>);
export const AlertIcon = (p: IconProps) => (<Icon {...p}><path d="M12 3l9.5 16.5h-19L12 3z" /><path d="M12 9.5v4.5M12 17h.01" /></Icon>);
export const WifiOffIcon = (p: IconProps) => (<Icon {...p}><path d="M2 2l20 20" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3.9-2.4M19 12.9a10 10 0 0 0-4.2-2.5M2 8.8A15.5 15.5 0 0 1 8 5.4M22 8.8a15.5 15.5 0 0 0-11.4-3.6M12 20h.01" /></Icon>);
export const RefreshIcon = (p: IconProps) => (<Icon {...p}><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" /><path d="M20.5 3.5V9H15" /></Icon>);
export const ClockIcon = (p: IconProps) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Icon>);
export const CloudCheckIcon = (p: IconProps) => (<Icon {...p}><path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.3 1.6A4 4 0 0 1 17.5 18H7z" /><path d="M9.5 13.8l1.9 1.9 3.4-3.7" /></Icon>);
export const SearchIcon = (p: IconProps) => (<Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.8-3.8" /></Icon>);
export const FileIcon = (p: IconProps) => (<Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5" /></Icon>);
export const FlagIcon = (p: IconProps) => (<Icon {...p}><path d="M5 21V4m0 0h9l-1.2 3.2L15 11H5" /></Icon>);
export const SettingsIcon = (p: IconProps) => (<Icon {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" /></Icon>);
