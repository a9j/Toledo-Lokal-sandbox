// Builds a downloadable vCard (.vcf) from a business so a resident who scans a
// founding QR code can save the business straight into their phone's contacts.

export interface VCardBusiness {
  name: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  /** Public Toledo Lokal profile URL, added as a secondary URL line. */
  profileUrl?: string | null;
}

// vCard text values must escape backslash, comma, semicolon and newlines.
const esc = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

export function buildVCard(b: VCardBusiness): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`FN:${esc(b.name)}`);
  lines.push(`ORG:${esc(b.name)}`);
  if (b.phone) lines.push(`TEL;TYPE=WORK,VOICE:${esc(b.phone)}`);
  if (b.website) lines.push(`URL:${esc(b.website)}`);
  if (b.profileUrl) lines.push(`URL:${esc(b.profileUrl)}`);
  if (b.address) lines.push(`ADR;TYPE=WORK:;;${esc(b.address)};;;;`);
  lines.push('NOTE:Saved from Toledo Lokal');
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export const slugifyName = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'contact';

export function downloadVCard(b: VCardBusiness): void {
  const blob = new Blob([buildVCard(b)], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyName(b.name)}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so the download has a chance to start (esp. on mobile Safari).
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
