export const formatDate = (value: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
};

export const formatCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);

export const toTitle = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
