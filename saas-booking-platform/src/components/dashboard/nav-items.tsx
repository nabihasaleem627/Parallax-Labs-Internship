import {
  CalendarDaysIcon,
  CalendarIcon,
  HomeIcon,
  SlidersIcon,
  UsersIcon,
} from "@/components/ui/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  exact?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon, exact: true },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarIcon },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/dashboard/users", label: "Users", icon: UsersIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SlidersIcon },
];
