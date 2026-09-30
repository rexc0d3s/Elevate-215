<script lang="ts">
	let { data } = $props();
	let q = $state('');

	const shown = $derived.by(() => {
		const s = q.trim().toLowerCase();
		if (!s) return data.schools;
		return data.schools.filter((x) => x.name.toLowerCase().includes(s) || x.number.includes(s));
	});
	const fileProblems = $derived(data.sources.flatMap((f) => f.problems.map((p) => `${f.file}: ${p}`)));
</script>

{#if fileProblems.length || data.unmatched.length}
	<section class="alert">
		{#if fileProblems.length}
			<h2>Data problems</h2>
			<ul>
				{#each fileProblems as p}<li>{p}</li>{/each}
			</ul>
		{/if}
		{#if data.unmatched.length}
			<h2>Unmatched records ({data.unmatched.length})</h2>
			<p class="hint">
				These rows could not be connected to a school, so they are not on any school page. Add the school to
				<code>schooldata/school-name-map.csv</code> (columns <code>Source_Name,SchoolNumber</code>) to connect them.
			</p>
			<table>
				<thead><tr><th>File</th><th>Row</th><th>School name in file</th><th>Reason</th></tr></thead>
				<tbody>
					{#each data.unmatched as u}
						<tr><td>{u.file}</td><td>{u.row}</td><td>{u.name || 'No Data'}</td><td>{u.reason}</td></tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
{/if}

<label class="search">
	<span>Find a school</span>
	<input type="search" bind:value={q} placeholder="School name or School Number" />
</label>
<p class="hint">{shown.length} of {data.schools.length} schools</p>

<ul class="list">
	{#each shown as s (s.key)}
		<li>
			<a href="/school/{encodeURIComponent(s.key)}">
				<span class="name">{s.name || 'No Data'}</span>
				<span class="num">School Number {s.number || 'No Data'}</span>
				<span class="counts">
					{#if s.flagCounts.problem}<span class="tag problem">{s.flagCounts.problem} problem</span>{/if}
					{#if s.flagCounts.missing}<span class="tag missing">{s.flagCounts.missing} missing</span>{/if}
					{#if s.flagCounts.outdated}<span class="tag outdated">{s.flagCounts.outdated} outdated</span>{/if}
				</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.alert {
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 4px solid #d03b3b;
		border-radius: 6px;
		padding: 4px 16px 12px;
		margin-bottom: 20px;
		overflow-x: auto;
	}
	h2 {
		font-size: 16px;
		margin: 12px 0 6px;
	}
	table {
		border-collapse: collapse;
		font-size: 14px;
		width: 100%;
	}
	th,
	td {
		text-align: left;
		padding: 4px 8px;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}
	.search {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-weight: 600;
	}
	.search input {
		font: inherit;
		padding: 8px 10px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: var(--text);
		max-width: 420px;
		width: 100%;
	}
	.hint {
		color: var(--text2);
		font-size: 14px;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
	}
	.list li + li {
		border-top: 1px solid var(--border);
	}
	.list a {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		align-items: baseline;
		padding: 10px 14px;
		text-decoration: none;
	}
	.list a:hover {
		background: var(--outdated);
	}
	.name {
		font-weight: 600;
	}
	.num {
		color: var(--text2);
		font-size: 14px;
	}
	.counts {
		margin-left: auto;
		display: flex;
		gap: 6px;
	}
	.tag {
		font-size: 12px;
		padding: 1px 8px;
		border-radius: 10px;
		border: 1px solid var(--border);
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
