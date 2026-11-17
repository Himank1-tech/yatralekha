export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);
}

export function formatTonnes(tonnes: number): string {
  if (isNaN(tonnes)) return '0.00 MT';
  return `${Number(tonnes).toFixed(2)} MT`;
}

export function formatKg(kg: number): string {
  if (isNaN(kg)) return '0 kg';
  return `${new Intl.NumberFormat('en-IN').format(Math.round(kg))} kg`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
