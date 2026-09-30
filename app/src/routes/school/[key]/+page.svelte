<script lang="ts">
	import type { Flag, FlagKind } from '$lib/types';

	let { data } = $props();
	const s = $derived(data.school);
	const r = $derived(s.rollup.fields);
	const latest = $derived(s.notes[0]);

	const blank = (v: string | undefined) => v === undefined || v.trim() === '';
	/** Shown after the test name, e.g. "PSSA Reading — N Scored_2025" → "N Scored_2025". */
	const part = (test: string, col: string) => col.slice(test.length + 3);
	const rows = (list: { row: number }[]) => list.map((x) => x.row).join(', ');

	const KINDS: { kind: FlagKind; title: string }[] = [
		{ kind: 'problem', title: 'Data problems' },
		{ kind: 'missing', title: 'Missing' },
		{ kind: 'outdated', title: 'Outdated' }
	];
	const flagsOf = (kind: FlagKind): Flag[] => s.flags.filter((f) => f.kind === kind);
</script>

{#snippet v(value: string | undefined)}
	{#if blank(value)}<span class="nodata">No Data</span>{:else}<span class="val">{value}</span>{/if}
{/snippet}

{#snippet kv(label: string, value: string | undefined)}
	<div class="kv"><dt>{label}</dt><dd>{@render v(value)}</dd></div>
{/snippet}

<svelte:head><title>{s.name} · Elevate 215</title></svelte:head>

<p><a href="/">← All schools</a></p>
<h1>{s.name}</h1>
<p class="sub">School Number {s.number}</p>

<section>
	<h2>Performance</h2>
	<div class="scroll">
		<table>
			<thead>
				<tr>
					<th>Test</th>
					{#each data.tests[0].cols as c}<th>{part(data.tests[0].test, c)}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each data.tests as t}
					<tr>
						<th scope="row">{t.test}</th>
						{#each t.cols as c}<td>{@render v(r[c])}</td>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<dl>
		{#each data.summaryCols as c}{@render kv(c, r[c])}{/each}
	</dl>
	<p class="src">Source: {data.labels.rollup} row {s.rollup.row}</p>

	<h3>From the latest school note</h3>
	{#if latest}
		<dl>
			{@render kv('Metric', latest.fields.Metric)}
			{@render kv('Latest_Result', latest.fields.Latest_Result)}
			{@render kv('Attendance_Result', latest.fields.Attendance_Result)}
		</dl>
		<p class="src">Source: {data.labels.notes} row {latest.row}</p>
	{:else}
		<p class="nodata">No Data</p>
	{/if}

	<h3>Grants</h3>
	{#if s.grants.length}
		{#each s.grants as g}
			<dl class="card">
				{@render kv('Grant_Name', g.fields.Grant_Name)}
				{@render kv('Grant_ID', g.fields.Grant_ID)}
				{@render kv('Grant_Purpose', g.fields.Grant_Purpose)}
				{@render kv('Grant_Metric', g.fields.Grant_Metric)}
				{@render kv('Grant_Target', g.fields.Grant_Target)}
				{@render kv('Grant_Start_Date', g.fields.Grant_Start_Date)}
				{@render kv('Grant_End_Date', g.fields.Grant_End_Date)}
				{@render kv('Amount_Pledged', g.fields.Amount_Pledged)}
				{@render kv('Amount_Received', g.fields.Amount_Received)}
			</dl>
		{/each}
		<p class="src">Source: {data.labels.grants} row {rows(s.grants)}</p>
	{:else}
		<p class="hint">No grants linked to this school.</p>
	{/if}
</section>

<section>
	<h2>Latest Update</h2>
	{#if latest}
		<dl>
			{@render kv('Visit_Date', latest.fields.Visit_Date)}
			{@render kv('School_Update_Notes', latest.fields.School_Update_Notes)}
			{@render kv('Next_Follow_Up', latest.fields.Next_Follow_Up)}
		</dl>
		<p class="src">Source: {data.labels.notes} row {latest.row}</p>
	{:else}
		<p class="nodata">No Data</p>
	{/if}
</section>

<section>
	<h2>Status</h2>
	<dl>
		{#each data.statusCols as c}{@render kv(c, r[c])}{/each}
	</dl>
	{#if r.ExcludedSelectionCriteria === 'TRUE'}
		<p class="excluded">Excluded by source selection criteria</p>
	{/if}
	<p class="src">Source: {data.labels.rollup} row {s.rollup.row}</p>
	<dl>
		{@render kv('Status (latest note)', latest?.fields.Status)}
		{#each s.grants as g}{@render kv(`Payment_Status (${g.fields.Grant_ID || 'No Grant_ID'})`, g.fields.Payment_Status)}{/each}
	</dl>
	{#if latest || s.grants.length}
		<p class="src">
			Source:
			{#if latest}{data.labels.notes} row {latest.row}{/if}{#if latest && s.grants.length};
			{/if}{#if s.grants.length}{data.labels.grants} row {rows(s.grants)}{/if}
		</p>
	{/if}
</section>

<section>
	<h2>Notes</h2>
	{#if s.notes.length}
		{#each s.notes as n}
			<dl class="card">
				{#each data.noteCols as c}{@render kv(c, n.fields[c])}{/each}
				<p class="src">Source: {data.labels.notes} row {n.row}</p>
			</dl>
		{/each}
	{:else}
		<p class="nodata">No Data</p>
	{/if}
</section>

<section>
	<h2>Flags</h2>
	{#if s.flags.length === 0}
		<p class="hint">Nothing flagged.</p>
	{/if}
	{#each KINDS as k}
		{@const list = flagsOf(k.kind)}
		{#if list.length}
			<h3><span class="tag {k.kind}">{k.title} ({list.length})</span></h3>
			<div class="scroll">
				<table>
					<thead><tr><th>Field</th><th>Why</th><th>Where</th></tr></thead>
					<tbody>
						{#each list as f}<tr><td>{f.field}</td><td>{f.detail}</td><td>{f.where}</td></tr>{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/each}
</section>

<style>
	h1 {
		font-size: 24px;
		margin: 0;
	}
	.sub {
		color: var(--text2);
		margin: 2px 0 16px;
	}
	section {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 4px 16px 12px;
		margin-bottom: 16px;
	}
	h2 {
		font-size: 18px;
		margin: 12px 0 10px;
		color: var(--brand);
	}
	@media (prefers-color-scheme: dark) {
		h2 {
			color: #9db8f0;
		}
	}
	h3 {
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text2);
		margin: 18px 0 6px;
	}
	.scroll {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		font-size: 14px;
		width: 100%;
	}
	th,
	td {
		text-align: left;
		padding: 5px 8px;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}
	thead th {
		font-weight: 600;
		color: var(--text2);
		white-space: nowrap;
	}
	dl {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 6px 20px;
		margin: 12px 0 4px;
	}
	.kv dt {
		font-size: 13px;
		color: var(--text2);
	}
	.kv dd {
		margin: 0;
	}
	.val {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.card {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 10px 12px;
	}
	.nodata {
		font-style: italic;
		background: var(--missing);
		padding: 0 4px;
		border-radius: 3px;
	}
	.excluded {
		display: inline-block;
		background: var(--problem);
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 600;
		margin: 6px 0 0;
	}
	.src,
	.hint {
		font-size: 12px;
		color: var(--text2);
		margin: 4px 0 8px;
		grid-column: 1 / -1;
	}
	.tag {
		font-size: 13px;
		padding: 2px 10px;
		border-radius: 10px;
		border: 1px solid var(--border);
		text-transform: none;
		letter-spacing: 0;
		color: var(--text);
	}
	.missing {
		background: var(--missing);
	}
	.outdated {
		background: var(--outdated);
	}
	.problem {
		background: var(--problem);
	}
</style>
