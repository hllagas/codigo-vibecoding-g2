export function getLicenseExpiryStatus(dateStr: string): 'expired' | 'expiring' | 'ok' {
  const expiry = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  if (expiry <= today) return 'expired';
  const diff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 30) return 'expiring';
  return 'ok';
}
