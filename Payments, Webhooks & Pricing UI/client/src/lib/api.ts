import { defaultSubscription, demoInvoices } from './demoData';
import type { ApiResponse, BillingInterval, Invoice, PlanId, Subscription } from '../types/billing';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API_URL = import.meta.env.VITE_API_URL || '/api';
const sleep = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

function getDemoSubscription(): Subscription {
  const stored = localStorage.getItem('bookflow_demo_subscription');
  if (!stored) return defaultSubscription;
  try { return JSON.parse(stored) as Subscription; } catch { return defaultSubscription; }
}

function saveDemoSubscription(subscription: Subscription) {
  localStorage.setItem('bookflow_demo_subscription', JSON.stringify(subscription));
  window.dispatchEvent(new CustomEvent('bookflow:subscription-updated'));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bookflow_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || body?.message || 'Something went wrong. Please try again.');
  return (body as ApiResponse<T>).data;
}

export const api = {
  async getSubscription(): Promise<Subscription> {
    if (DEMO_MODE) { await sleep(650); return getDemoSubscription(); }
    return request<Subscription>('/billing/subscription');
  },
  async getInvoices(): Promise<Invoice[]> {
    if (DEMO_MODE) { await sleep(800); return demoInvoices; }
    return request<Invoice[]>('/billing/invoices');
  },
  async createCheckout(plan: PlanId, interval: BillingInterval): Promise<{ url: string }> {
    if (DEMO_MODE) {
      await sleep(850);
      sessionStorage.setItem('bookflow_pending_checkout', JSON.stringify({ plan, interval }));
      return { url: `/checkout/success?plan=${plan.toLowerCase()}&session_id=cs_demo_3Q9x` };
    }
    return request<{ url: string }>('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan, interval }) });
  },
  async changePlan(plan: PlanId, interval: BillingInterval): Promise<{ message: string }> {
    if (DEMO_MODE) {
      await sleep(850);
      const current = getDemoSubscription();
      saveDemoSubscription({ ...current, plan, billingInterval: interval });
      return { message: 'Subscription updated successfully' };
    }
    return request<{ message: string }>('/billing/change-plan', { method: 'POST', body: JSON.stringify({ plan, interval }) });
  },
  async cancelSubscription(): Promise<{ message: string }> {
    if (DEMO_MODE) {
      await sleep(700);
      saveDemoSubscription({ ...getDemoSubscription(), cancelAtPeriodEnd: true });
      return { message: 'Your subscription has been cancelled' };
    }
    return request<{ message: string }>('/billing/cancel', { method: 'POST' });
  },
  async resumeSubscription(): Promise<{ message: string }> {
    if (DEMO_MODE) {
      await sleep(700);
      saveDemoSubscription({ ...getDemoSubscription(), cancelAtPeriodEnd: false, status: 'active' });
      return { message: 'Your subscription will renew as usual' };
    }
    return request<{ message: string }>('/billing/resume', { method: 'POST' });
  },
  async createPortal(): Promise<{ url: string }> {
    if (DEMO_MODE) { await sleep(500); return { url: '/billing?portal=demo' }; }
    return request<{ url: string }>('/billing/portal', { method: 'POST' });
  },
  async confirmDemoCheckout(): Promise<void> {
    if (!DEMO_MODE) return;
    const pending = sessionStorage.getItem('bookflow_pending_checkout');
    if (!pending) return;
    await sleep(1400);
    const { plan, interval } = JSON.parse(pending) as { plan: PlanId; interval: BillingInterval };
    const now = new Date();
    const end = new Date(now);
    interval === 'year' ? end.setFullYear(end.getFullYear() + 1) : end.setMonth(end.getMonth() + 1);
    saveDemoSubscription({
      ...getDemoSubscription(), plan, billingInterval: interval, status: 'active', paymentStatus: 'paid',
      currentPeriodStart: now.toISOString(), currentPeriodEnd: end.toISOString(), cancelAtPeriodEnd: false,
    });
    sessionStorage.removeItem('bookflow_pending_checkout');
  },
};
