import { BuildingIcon, CalendarIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";

type Organization = {
  name: string;
  subdomain: string;
  plan: string;
};

type Props = {
  totalBookings: number;
  upcomingBookings: number;
  totalUsers: number;
  organization: Organization;
};

export function SummaryCards({ totalBookings, upcomingBookings, totalUsers, organization }: Props) {
  const cards = [
    {
      label: "Total bookings",
      value: totalBookings,
      icon: <CalendarIcon className="h-5 w-5" />,
      iconClasses: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Upcoming bookings",
      value: upcomingBookings,
      icon: <ClockIcon className="h-5 w-5" />,
      iconClasses: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total users",
      value: totalUsers,
      icon: <UsersIcon className="h-5 w-5" />,
      iconClasses: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${card.iconClasses}`}
          >
            {card.icon}
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</p>
            <p className="truncate text-sm text-slate-500">{card.label}</p>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <BuildingIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{organization.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge tone="indigo" className="capitalize">
              {organization.plan} plan
            </Badge>
            <span className="truncate text-xs text-slate-500">
              {organization.subdomain}.bookflow.app
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
