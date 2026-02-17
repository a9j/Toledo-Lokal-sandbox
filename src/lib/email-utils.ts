// List of common free/personal email providers
const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'outlook.com',
  'live.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'mail.com', 'zoho.com',
  'yandex.com', 'gmx.com', 'gmx.net', 'inbox.com',
  'fastmail.com', 'tutanota.com', 'msn.com', 'comcast.net',
  'att.net', 'sbcglobal.net', 'verizon.net', 'cox.net',
  'charter.net', 'earthlink.net', 'optonline.net',
];

export function isFreeEmailProvider(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return FREE_EMAIL_PROVIDERS.includes(domain);
}

export function getEmailDomain(email: string): string {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1]?.toLowerCase() || '';
}
