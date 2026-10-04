import type { SVGProps } from 'react';

const paths: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  bookings: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
  customers: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  team: <><circle cx="9" cy="7" r="4"/><path d="M17 11l2 2 4-4M3 21v-2a6 6 0 0112 0v2"/></>,
  pricing: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L3.41 13.4A2 2 0 013 12V5a2 2 0 012-2h7a2 2 0 011.41.59l7.18 7.18a2 2 0 010 2.64z"/><circle cx="8.5" cy="8.5" r="1"/></>,
  billing: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .6 1.7 1.7 0 00-.4 1.1V21a2 2 0 01-4 0v-.1A1.7 1.7 0 008.6 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.6-1H3a2 2 0 010-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88L4.2 7.06a2 2 0 012.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.6V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.88-.34l.06-.06a2 2 0 012.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.6 1h.1a2 2 0 010 4H21a1.7 1.7 0 00-1.6 1z"/></>,
  bell: <><path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  chevron: <path d="M9 18l6-6-6-6"/>,
  chevronDown: <path d="M6 9l6 6 6-6"/>,
  arrowUp: <><path d="M12 19V5M5 12l7-7 7 7"/></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  external: <><path d="M14 3h7v7M10 14L21 3"/><path d="M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5"/></>,
  close: <path d="M18 6L6 18M6 6l12 12"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  check: <path d="M20 6L9 17l-5-5"/>,
  warning: <><path d="M10.3 2.9L1.8 17a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 2.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  trend: <><path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
};

export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
