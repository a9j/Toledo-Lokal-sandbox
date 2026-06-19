// Builds a downloadable vCard (.vcf) from a business so a resident who scans a
// founding QR code can save the business straight into their phone's contacts.

export interface VCardBusiness {
  /** Business / organization name. */
  name: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  /** Public Toledo Lokal profile URL, added as a secondary URL line. */
  profileUrl?: string | null;
  /** Person to file the contact under. When set, the card saves as this person
   *  with the business as their company. When absent, the business is the name. */
  contactName?: string | null;
  contactTitle?: string | null;
  email?: string | null;
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
  const person = b.contactName?.trim();
  if (person) {
    const parts = person.split(/\s+/);
    const given = parts[0] ?? '';
    const family = parts.slice(1).join(' ');
    lines.push(`N:${esc(family)};${esc(given)};;;`);
    lines.push(`FN:${esc(person)}`);
  } else {
    lines.push(`FN:${esc(b.name)}`);
  }
  lines.push(`ORG:${esc(b.name)}`);
  if (b.contactTitle?.trim()) lines.push(`TITLE:${esc(b.contactTitle.trim())}`);
  if (b.phone) lines.push(`TEL;TYPE=WORK,VOICE:${esc(b.phone)}`);
  if (b.email?.trim()) lines.push(`EMAIL;TYPE=WORK:${esc(b.email.trim())}`);
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
  link.download = `${slugifyName(b.contactName?.trim() || b.name)}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so the download has a chance to start (esp. on mobile Safari).
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
