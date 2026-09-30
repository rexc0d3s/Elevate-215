/**
 * RFC-4180 CSV parser that returns every cell as the exact source text.
 * No trimming, no type conversion. Quoted cells may contain commas, quotes ("") and newlines.
 * A single trailing line break at the end of the file does not create an extra row.
 */
export function parseCsv(text: string): string[][] {
	if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // byte-order mark is not data
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	let i = 0;

	while (i < text.length) {
		const ch = text[i];
		if (quoted) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					cell += '"';
					i += 2;
					continue;
				}
				quoted = false;
			} else {
				cell += ch;
			}
			i++;
			continue;
		}
		if (ch === '"') {
			quoted = true;
		} else if (ch === ',') {
			row.push(cell);
			cell = '';
		} else if (ch === '\n' || ch === '\r') {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
			if (ch === '\r' && text[i + 1] === '\n') i++;
		} else {
			cell += ch;
		}
		i++;
	}
	// Last row, unless the file ended right after a line break.
	if (cell !== '' || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}
	return rows;
}
