import { siteUrl } from './site-url';

// The permanent QR target for a business. It encodes the business record's
// immutable primary key (id), never the slug or any editable field, so a printed
// code keeps working forever even if the business renames or its slug changes.
// The /qr/:businessId route looks up the business and forwards to its current
// public page, carrying ?via=qr through.
//
// An optional contactId attaches the person who shared it (?c=), so the saved
// contact is filed under that individual rather than the business alone.
export function businessQrUrl(businessId: string, contactId?: string | null): string {
  const contact = contactId ? `&c=${encodeURIComponent(contactId)}` : '';
  return siteUrl(`/qr/${businessId}?via=qr${contact}`);
}
