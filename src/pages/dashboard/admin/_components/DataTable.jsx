import { useEffect, useMemo, useState } from "react";

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Reusable paginated table with row click → triggers onRowClick.
 * Action buttons should NOT live in cells (per UX policy) — clicks open
 * the drawer where actions live.
 *
 * columns: [{ key, label, render?: (row) => node, width?: string }]
 */
export default function DataTable({
  columns,
  rows,
  onRowClick,
  emptyText = "Aucune donnée à afficher.",
  initialPageSize = 25,
  rowKey = (r) => r.id,
}) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialPageSize);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const start = page * size;
  const visible = useMemo(() => rows.slice(start, start + size), [rows, start, size]);

  useEffect(() => {
    if (page >= pages) setPage(0);
  }, [pages, page]);

  return (
    <div className="data-table">
      <div className="data-table-scroll">
        <table className="simple selectable">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty">{emptyText}</div>
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={rowKey(r)}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={onRowClick ? "is-clickable" : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="paginator">
        <span className="count">
          {total} résultat{total > 1 ? "s" : ""}
        </span>
        <label className="page-size">
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            aria-label="Taille de page"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ←
        </button>
        <span className="page-of">
          Page {page + 1} / {pages}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={page >= pages - 1}
          onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
        >
          →
        </button>
      </div>
    </div>
  );
}
