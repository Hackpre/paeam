export async function generateContentHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(date: string | null): string {
  if (!date) return '\u2014';
  return new Date(date).toLocaleDateString('en-MW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '\u2014';
  return new Date(date).toLocaleString('en-MW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 12) errors.push('At least 12 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('At least one special character');
  return { valid: errors.length === 0, errors };
}

export function validateIPI(ipi: string): boolean {
  if (!ipi.startsWith('IPI-')) return false;
  const digits = ipi.replace('IPI-', '');
  if (digits.length < 10 || digits.length > 11) return false;
  if (!/^\d+$/.test(digits)) return false;
  return true;
}

export function getMembershipBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'active': return { label: 'Active Member', color: 'text-green-400 bg-green-500/10' };
    case 'trial': return { label: 'Free Trial', color: 'text-gold-400 bg-gold-500/10' };
    case 'grace': return { label: 'Grace Period', color: 'text-yellow-400 bg-yellow-500/10' };
    case 'suspended': return { label: 'Suspended', color: 'text-red-400 bg-red-500/10' };
    case 'bank_transfer_pending': return { label: 'Pending Verification', color: 'text-blue-400 bg-blue-500/10' };
    default: return { label: 'Unknown', color: 'text-neutral-400 bg-neutral-500/10' };
  }
}

export function truncateHash(hash: string): string {
  if (!hash) return '\u2014';
  return hash.substring(0, 12) + '...';
}
