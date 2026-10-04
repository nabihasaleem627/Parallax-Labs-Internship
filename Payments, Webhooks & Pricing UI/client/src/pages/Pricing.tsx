import { useState } from 'react';
import { Icon } from '../components/Icons';
import { ErrorState, Spinner } from '../components/UI';
import { api } from '../lib/api';
import { useSubscription } from '../lib/useSubscription';
import { useToast } from '../lib/ToastContext';
import type { BillingInterval, PlanId } from '../types/billing';

const plans: { id: PlanId; name: string; monthly: number; yearly: number; description: string; features: string[]; featured?: boolean }[] = [
  { id: 'STARTER', name: 'Starter', monthly: 9, yearly: 90, description: 'Everything you need to start accepting bookings.', features: ['1 team member', '100 bookings / month', 'Basic calendar', 'Email notifications'] },
  { id: 'PROFESSIONAL', name: 'Professional', monthly: 29, yearly: 290, description: 'Powerful tools for teams ready to grow faster.', features: ['5 team members', '1,000 bookings / month', 'Advanced calendar', 'Analytics & reports', 'Priority support'], featured: true },
  { id: 'BUSINESS', name: 'Business', monthly: 79, yearly: 790, description: 'Advanced flexibility for established businesses.', features: ['Unlimited team members', 'Unlimited bookings', 'Advanced analytics', 'Custom settings', 'Priority support'] },
];

export default function Pricing() {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const { subscription, loading, error, refresh } = useSubscription();
  const { toast } = useToast();

  const choosePlan = async (plan: PlanId) => {
    setBusyPlan(plan);
    try {
      const hasSubscription = subscription && subscription.plan !== 'FREE' && subscription.status !== 'canceled' && subscription.status !== 'none';
      if (hasSubscription) {
        await api.changePlan(plan, interval);
        toast('Subscription updated successfully');
        await refresh();
      } else {
        const { url } = await api.createCheckout(plan, interval);
        toast('Checkout session created');
        window.location.assign(url);
      }
    } catch (err) { toast(err instanceof Error ? err.message : 'Checkout creation failed.', 'error'); }
    finally { setBusyPlan(null); }
  };

  return <div className="mx-auto max-w-6xl pb-10">
    <div className="mx-auto max-w-2xl text-center"><p className="eyebrow">Simple, transparent pricing</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Choose the plan that fits your business</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">Start with the essentials and scale when you’re ready. Every plan includes secure payments and a 14-day free trial.</p>
      <div className="mt-7 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Billing period"><button onClick={() => setInterval('month')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${interval === 'month' ? 'bg-ink-900 text-white shadow-sm' : 'text-slate-500 hover:text-ink-900'}`}>Monthly</button><button onClick={() => setInterval('year')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${interval === 'year' ? 'bg-ink-900 text-white shadow-sm' : 'text-slate-500 hover:text-ink-900'}`}>Yearly <span className={`rounded-full px-2 py-0.5 text-[10px] ${interval === 'year' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>2 months free</span></button></div>
    </div>
    {error && <div className="mt-7"><ErrorState message={error} onRetry={refresh}/></div>}
    <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const current = subscription?.plan === plan.id && subscription.status !== 'canceled';
        const price = interval === 'month' ? plan.monthly : Math.round(plan.yearly / 12);
        return <article key={plan.id} className={`relative flex flex-col rounded-2xl bg-white p-6 ${plan.featured ? 'border-2 border-brand-500 shadow-[0_18px_50px_rgba(91,56,220,.13)] lg:-mt-3 lg:mb-[-12px]' : 'border border-slate-200 shadow-card'}`}>
          {plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white">Most popular</span>}
          <div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-ink-900">{plan.name}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{plan.description}</p></div>{current && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">Current</span>}</div>
          <div className="mt-6 flex items-end"><span className="text-4xl font-bold tracking-tight text-ink-900">${price}</span><span className="mb-1 ml-1 text-sm text-slate-500">/ month</span></div>{interval === 'year' && <p className="mt-1 text-xs text-slate-400">${plan.yearly} billed annually</p>}
          <button className={`${plan.featured && !current ? 'btn-brand' : current ? 'btn-secondary' : 'btn-primary'} mt-6 w-full`} disabled={loading || current || busyPlan !== null} onClick={() => choosePlan(plan.id)}>{busyPlan === plan.id && <Spinner dark={!plan.featured}/>} {loading ? 'Checking plan…' : current ? 'Your current plan' : subscription?.plan === 'FREE' ? `Start with ${plan.name}` : `Switch to ${plan.name}`}</button>
          <div className="my-6 h-px bg-slate-100"/><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What’s included</p><ul className="mt-4 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm text-slate-700"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${plan.featured ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-700'}`}><Icon name="check" size={12}/></span>{feature}</li>)}</ul>
        </article>;
      })}
    </div>
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-slate-500"><span className="flex items-center gap-2"><Icon name="check" size={15} className="text-emerald-600"/>14-day free trial</span><span className="flex items-center gap-2"><Icon name="check" size={15} className="text-emerald-600"/>No setup fees</span><span className="flex items-center gap-2"><Icon name="check" size={15} className="text-emerald-600"/>Cancel anytime</span><span className="flex items-center gap-2"><Icon name="card" size={15} className="text-slate-500"/>Secure Stripe payments</span></div>
  </div>;
}
