import { describe, expect, it } from 'vitest';
import { currentMonth, monthRange, shiftMonth } from './month';

describe('month helpers', () => {
	it('currentMonth formats a date as YYYY-MM', () => {
		expect(currentMonth(new Date(2026, 6, 15))).toBe('2026-07');
	});

	it('monthRange spans the first to the last day of the month', () => {
		expect(monthRange('2026-07')).toEqual({ dateFrom: '2026-07-01', dateTo: '2026-07-31' });
		expect(monthRange('2026-02')).toEqual({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
	});

	it('shiftMonth steps across year boundaries', () => {
		expect(shiftMonth('2026-12', 1)).toBe('2027-01');
		expect(shiftMonth('2026-01', -1)).toBe('2025-12');
	});
});
