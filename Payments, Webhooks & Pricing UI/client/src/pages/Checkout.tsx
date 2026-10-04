import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { api } from '../lib/api';
import { toTitle } from '../lib/format';

export function CheckoutSuccess() {
  const [params] = useSearchParams();
  const plan = params.get('plan') || 'selected';
  const [state, setState] = useState<'confirming'|'active'|'delayed'>('confirming');
  useEffect(() => {
    let cancelled = false;
    const confirm = async () => {
      await api.confirmDemoCheckout();
      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        try { const subscription = await api.getSubscription(); if (subscription.status === 'active' || subscription.status === 'trialing') { setState('active'); return; } } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 1600));
      }
      if (!cancelled) setState('delayed');
    };
    void confirm(); return () => { cancelled = true; };
  }, []);
  return <CheckoutShell><div className="mx-auto max-w-md text-center"><span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${state === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'}`}>{state === 'confirming' ? <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600"/> : <Icon name="check" size={29}/>}</span><h1 className="mt-6 text-2xl font-bold text-ink-900">{state === 'active' ? 'You’re all set!' : 'Checkout successful'}</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your <strong className="text-ink-800">{toTitle(plan)}</strong> plan payment was received. {state === 'confirming' ? 'We’re securely confirming activation with Stripe.' : state === 'active' ? 'Stripe confirmed your subscription and your workspace is now updated.' : 'Confirmation is taking a little longer than usual. Your dashboard will update automatically once Stripe confirms it.'}</p><div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${state === 'active' ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'}`}/><div><p className="text-sm font-semibold text-ink-900">{state === 'active' ? 'Subscription active' : state === 'confirming' ? 'Waiting for secure webhook confirmation' : 'Activation pending'}</p><p className="mt-0.5 text-xs text-slate-500">The webhook—not this page—is the source of truth.</p></div></div></div><Link to="/" className="btn-primary mt-6 w-full">Return to dashboard <Icon name="arrowRight" size={16}/></Link><Link to="/billing" className="mt-3 inline-block text-sm font-semibold text-brand-600">View billing details</Link></div></CheckoutShell>;
}

export function CheckoutCancel() { return <CheckoutShell><div className="mx-auto max-w-md text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-600"><Icon name="close" size={28}/></span><h1 className="mt-6 text-2xl font-bold text-ink-900">Checkout cancelled</h1><p className="mt-3 text-sm leading-6 text-slate-500">No charge was made and your current plan has not changed. You can return to pricing whenever you’re ready.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link to="/pricing" className="btn-primary flex-1">Return to pricing</Link><Link to="/" className="btn-secondary flex-1">Go to dashboard</Link></div></div></CheckoutShell>; }
function CheckoutShell({ children }: {children: React.ReactNode}) { return <div className="min-h-screen bg-[#f7f8fb] px-4 py-10"><Link to="/" className="mx-auto flex w-fit items-center gap-2 text-lg font-bold text-ink-900"><span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-white">B</span>BookFlow</Link><main className="mx-auto mt-10 max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-card sm:p-10">{children}</main><p className="mt-6 text-center text-xs text-slate-400">Secure billing powered by Stripe · BookFlow</p></div>; }
