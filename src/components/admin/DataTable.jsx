import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { EmptyState, ErrorState, Skeleton } from '../ui/StateViews.jsx';
import { cn, formatNumber } from '../../utils/format.js';

/**
 * Generic searchable / sortable / paginated table.
 * columns: [{ key, header, render?, sortValue?, className?, align? }]
 */
export default function DataTable({
  columns, rows, loading, error, onRetry, searchPlaceholder = 'Search…', searchFn, toolbar, pageSize = 12,
  emptyTitle = 'No records found', emptyDescription = 'Try a different date range or filter.', emptyIcon, initialSort, onRowClick,
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort || null);

  const filtered = useMemo(() => {
    let list = rows || [];
    const q = query.trim().toLowerCase();
    if (q && searchFn) list = list.filter((r) => searchFn(r).toLowerCase().includes(q));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = col?.sortValue || ((r) => r[sort.key]);
      list = [...list].sort((a, b) => {
        const va = val(a); const vb = val(b);
        if (va === vb) return 0;
        return (va > vb ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1);
      });
    }
    return list;
  }, [rows, query, sort, searchFn, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-navy-50 p-4 sm:flex-row sm:items-center">
        {searchFn && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
            <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={searchPlaceholder} className="input-base h-10 pl-9" />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
      ) : error ? (
        <div className="p-4"><ErrorState error={error} onRetry={onRetry} /></div>
      ) : filtered.length === 0 ? (
        <div className="p-4"><EmptyState icon={emptyIcon} title={emptyTitle} description={query ? `No results for “${query}”.` : emptyDescription} /></div>
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-navy-50 bg-navy-50/50 text-left">
                  {columns.map((c) => (
                    <th key={c.key} className={cn('whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-navy-400', c.align === 'right' && 'text-right')}>
                      {c.sortable === false ? c.header : (
                        <button onClick={() => toggleSort(c.key)} className={cn('inline-flex items-center gap-1 hover:text-navy-700', c.align === 'right' && 'flex-row-reverse')}>
                          {c.header}
                          {sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {visible.map((r, i) => (
                  <tr key={r.id || i} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn('transition hover:bg-aqua-50/40', onRowClick && 'cursor-pointer')}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn('whitespace-nowrap px-4 py-3 text-navy-700', c.align === 'right' && 'text-right', c.className)}>{c.render ? c.render(r) : r[c.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-navy-50 px-4 py-3 text-sm text-navy-500 sm:flex-row">
            <p>Showing <strong className="text-navy-800">{formatNumber((current - 1) * pageSize + 1)}–{formatNumber(Math.min(current * pageSize, filtered.length))}</strong> of <strong className="text-navy-800">{formatNumber(filtered.length)}</strong></p>
            <div className="flex items-center gap-1">
              <button disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-lg p-2 hover:bg-navy-50 disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-2">Page {current} of {pages}</span>
              <button disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-lg p-2 hover:bg-navy-50 disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
