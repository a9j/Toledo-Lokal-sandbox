import { describe, it, expect } from 'vitest';
import { buildVCard, slugifyName } from './vcard';

describe('buildVCard', () => {
  it('emits required FN/ORG and wraps with BEGIN/END', () => {
    const card = buildVCard({ name: 'Maple Cafe' });
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true);
    expect(card).toContain('FN:Maple Cafe');
    expect(card).toContain('ORG:Maple Cafe');
    expect(card.endsWith('END:VCARD')).toBe(true);
  });

  it('includes optional fields only when present', () => {
    const card = buildVCard({
      name: 'Glass City Goods',
      phone: '419-555-0100',
      website: 'https://glasscity.example',
      address: '123 Main St, Toledo, OH',
      profileUrl: 'https://toledolokal.com/business/glass-city-goods',
    });
    expect(card).toContain('TEL;TYPE=WORK,VOICE:419-555-0100');
    expect(card).toContain('URL:https://glasscity.example');
    expect(card).toContain('URL:https://toledolokal.com/business/glass-city-goods');
    expect(card).toContain('ADR;TYPE=WORK:;;123 Main St\\, Toledo\\, OH;;;;');
  });

  it('omits absent optional lines', () => {
    const card = buildVCard({ name: 'Solo' });
    expect(card).not.toContain('TEL');
    expect(card).not.toContain('ADR');
  });

  it('escapes commas, semicolons, backslashes and newlines', () => {
    const card = buildVCard({ name: 'Smith, Jones; & Co.\\Inc\nLLC' });
    expect(card).toContain('FN:Smith\\, Jones\\; & Co.\\\\Inc\\nLLC');
  });
});

describe('slugifyName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyName('Maple Cafe & Bar')).toBe('maple-cafe-bar');
  });

  it('falls back to "contact" for empty input', () => {
    expect(slugifyName('!!!')).toBe('contact');
  });
});
