import {
  formatUtcDate,
  formatUtcTime,
  formatUtcDateTime,
  isValidDateString,
  isValidTimeString,
} from '../../../src/utils/date';

describe('date utils', () => {
  const d = new Date('2024-01-15T08:30:00.000Z');

  it('formatUtcDate', () => {
    expect(formatUtcDate(d)).toBe('2024-01-15');
  });

  it('formatUtcTime', () => {
    expect(formatUtcTime(d)).toBe('08:30:00Z');
  });

  it('formatUtcDateTime', () => {
    expect(formatUtcDateTime(d)).toBe('2024-01-15T08:30:00Z');
  });

  it('isValidDateString — valid', () => {
    expect(isValidDateString('2024-01-15')).toBe(true);
  });

  it('isValidDateString — invalid format', () => {
    expect(isValidDateString('15-01-2024')).toBe(false);
  });

  it('isValidDateString — invalid date', () => {
    expect(isValidDateString('2024-13-01')).toBe(false);
  });

  it('isValidTimeString — valid', () => {
    expect(isValidTimeString('08:30:00Z')).toBe(true);
  });

  it('isValidTimeString — missing Z', () => {
    expect(isValidTimeString('08:30:00')).toBe(false);
  });
});
