import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { PageHeader, Progress, StatusBadge } from '../components/UI';
import { useSubscription } from '../lib/useSubscription';
import { formatDate, toTitle } from '../lib/format';

const stats = [
  { label: 'Total bookings', value: '1,284', change: '+12.5%', detail: 'vs. last month', icon: 'bookings', color: 'bg-brand-50 text-brand-600' },
  { label: 'Confirmed revenue', value: '$24,860', change: '+8.2%', detail: 'vs. last month', icon: 'trend', color: 'bg-emerald-50 text-emerald-600' },
  { label: 'New customers', value: '186', change: '+6.4%', detail: 'vs. last month', icon: 'customers', color: 'bg-blue-50 text-blue-600' },
  { label: 'Booking rate', value: '82.4%', change: '+3.1%', detail: 'vs. last month', icon: 'calendar', color: 'bg-amber-50 text-amber-600' },
] as const;
const bookings = [
  { customer: 'Sophia Bennett', initials: 'SB', service: 'Strategy consultation', date: 'Today, 10:30 AM', price: '$180', status: 'confirmed', color: 'bg-violet-100 text-violet-700' },
  { customer: 'Liam Carter', initials: 'LC', service: 'Product onboarding', date: 'Today, 1:00 PM', price: '$240', status: 'confirmed', color: 'bg-blue-100 text-blue-700' },
  { customer: 'Maya Rodriguez', initials: 'MR', service: 'Team workshop', date: 'Today, 3:30 PM', price: '$450', status: 'pending', color: 'bg-amber-100 text-amber-700' },
  { customer: 'Noah Williams', initials: 'NW', service: 'Follow-up session', date: 'Tomorrow, 9:00 AM', price: '$120', status: 'confirmed', color: 'bg-emerald-100 text-emerald-700' },
];

export default function Dashboard() {
  const { subscription, loading } = useSubscription();
  const bookingPercent = subscription?.usage.bookingsLimit ? subscription.usage.bookings / subscription.usage.bookingsLimit * 100 : 0;
  return <>
    <PageHeader title="Good morning, Alex" description="Here’s what’s happening with your business today." actions={<Link to="/bookings" className="btn-primary"><Icon name="plus" size={17}/>New booking</Link>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => <div key={stat.label} className="card p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-ink-900">{stat.value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.color}`}><Icon name={stat.icon} size={19}/></span></div><div className="mt-4 flex items-center gap-1.5 text-xs"><span className="flex items-center font-semibold text-emerald-600"><Icon name="arrowUp" size={12}/>{stat.change}</span><span className="text-slate-400">{stat.detail}</span></div></div>)}
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-ink-900">Booking overview</h2><p className="mt-0.5 text-xs text-slate-500">Appointments over the last 7 days</p></div><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><option>This week</option><option>Last week</option></select></div>
        <div className="px-4 pb-4 pt-6 sm:px-6"><div className="flex h-56 items-end gap-2 sm:gap-4">{[42, 62, 48, 75, 68, 89, 72].map((height, index) => <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={index}><div className="group relative flex h-full w-full items-end justify-center"><div className={`w-full max-w-10 rounded-t-lg transition-all ${index === 5 ? 'bg-brand-600' : 'bg-brand-100 group-hover:bg-brand-200'}`} style={{height: `${height}%`}}><span className="sr-only">{height} bookings</span></div></div><span className="text-[11px] font-medium text-slate-400">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</span></div>)}</div></div>
      </section>
      <section className="overflow-hidden rounded-2xl bg-ink-900 p-5 text-white shadow-card">
        {loading ? <div className="space-y-4"><div className="skeleton h-6 w-32 rounded bg-white/10"/><div className="skeleton h-16 rounded-xl bg-white/10"/><div className="skeleton h-20 rounded-xl bg-white/10"/></div> : subscription ? <>
          <div className="flex items-center justify-between"><div><p className="text-xs font-medium text-slate-400">YOUR PLAN</p><h2 className="mt-1 text-xl font-bold">{toTitle(subscription.plan)}</h2></div><StatusBadge status={subscription.status}/></div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[.055] p-4"><div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">Monthly bookings</span><span className="font-semibold">{subscription.usage.bookings.toLocaleString()} / {subscription.usage.bookingsLimit?.toLocaleString() || '∞'}</span></div><Progress value={bookingPercent}/><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs text-slate-400">Next billing date</span><span className="text-sm font-semibold">{formatDate(subscription.currentPeriodEnd, {month:'short', day:'numeric'})}</span></div></div>
          {subscription.cancelAtPeriodEnd && <p className="mt-3 rounded-lg bg-amber-400/10 p-2.5 text-xs text-amber-200">Your plan ends on {formatDate(subscription.currentPeriodEnd)}.</p>}
          <Link to="/billing" className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-ink-900 transition hover:bg-slate-100">Manage billing <Icon name="arrowRight" size={16}/></Link>
        </> : <><p className="text-sm text-slate-300">No active plan</p><Link to="/pricing" className="btn-brand mt-4 w-full">Upgrade your plan</Link></>}
      </section>
    </div>

    <section className="card mt-5 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-ink-900">Upcoming bookings</h2><p className="mt-0.5 text-xs text-slate-500">Your next scheduled appointments</p></div><Link to="/bookings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View all</Link></div><div className="divide-y divide-slate-100">{bookings.map((booking) => <div key={booking.customer} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:px-5"><div className="flex min-w-0 items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${booking.color}`}>{booking.initials}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-900">{booking.customer}</p><p className="truncate text-xs text-slate-500 sm:hidden">{booking.service}</p></div></div><p className="hidden text-sm text-slate-600 sm:block">{booking.service}</p><div className="hidden sm:block"><p className="text-sm font-medium text-ink-800">{booking.date}</p><p className="text-xs text-slate-400">{booking.price}</p></div><StatusBadge status={booking.status}/></div>)}</div></section>
  </>;
}
