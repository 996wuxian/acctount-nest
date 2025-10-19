export const IP_BLACKLIST: string[] = [];

export function isIpBlacklisted(ip?: string): boolean {
  if (!ip) return false;
  const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  return IP_BLACKLIST.includes(normalized) || IP_BLACKLIST.includes(ip);
}
