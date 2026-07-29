import { describe, expect, it } from 'vitest';
import {
	currentMonth,
	currentYear,
	monthRange,
	shiftMonth,
	shiftYear,
	today,
	yearRange
} from './helpers';

describe('date filtering helpers', () => {
	it('currentMonth formats a date as YYYY-MM', () => {
		expect(currentMonth(new Date(2026, 6, 15))).toBe('2026-07');
	});

	it('today formats a date as YYYY-MM-DD', () => {
		expect(today(new Date(2026, 6, 5))).toBe('2026-07-05');
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

describe('year helpers', () => {
	it('currentYear formats a date as YYYY', () => {
		expect(currentYear(new Date(2026, 6, 15))).toBe('2026');
	});

	it('yearRange spans the whole calendar year', () => {
		expect(yearRange('2026')).toEqual({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
	});

	it('shiftYear steps by whole years', () => {
		expect(shiftYear('2026', 1)).toBe('2027');
		expect(shiftYear('2026', -1)).toBe('2025');
	});
});
