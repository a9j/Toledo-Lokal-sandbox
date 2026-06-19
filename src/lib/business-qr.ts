import { siteUrl } from './site-url';

// The permanent QR target for a business. It encodes the business record's
// immutable primary key (id), never the slug or any editable field, so a printed
// code keeps working forever even if the business renames or its slug changes.
// The /qr/:businessId route looks up the business and forwards to its current
// public page, carrying ?via=qr through.
export function businessQrUrl(businessId: string): string {
  return siteUrl(`/qr/${businessId}?via=qr`);
}
