function pad(n: number): string {
	return String(n).padStart(2, '0');
}

function toKey(year: number, monthIndex: number): string {
	return `${year}-${pad(monthIndex + 1)}`;
}

export function currentMonth(now: Date = new Date()): string {
	return toKey(now.getFullYear(), now.getMonth());
}

export function monthRange(ym: string): { dateFrom: string; dateTo: string } {
	const [year, month] = ym.split('-').map(Number);
	const lastDay = new Date(year, month, 0).getDate();
	return { dateFrom: `${year}-${pad(month)}-01`, dateTo: `${year}-${pad(month)}-${pad(lastDay)}` };
}

export function shiftMonth(ym: string, delta: number): string {
	const [year, month] = ym.split('-').map(Number);
	const d = new Date(year, month - 1 + delta, 1);
	return toKey(d.getFullYear(), d.getMonth());
}
