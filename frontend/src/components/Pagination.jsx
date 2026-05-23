import Button from "./ui/Button";

const Pagination = ({ page, totalPages, onPageChange, rangeStart, rangeEnd, totalItems }) => {
  if (totalItems === 0) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((p) => {
    if (totalPages <= 7) return true;
    return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
  });

  return (
    <nav className="ds-pagination" aria-label="Pagination">
      <span className="ds-pagination__meta">
        {rangeStart}–{rangeEnd} sur {totalItems}
      </span>
      <div className="ds-pagination__controls">
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Précédent
        </Button>
        {pages.map((p, index, arr) => {
          const prev = arr[index - 1];
          const showEllipsis = prev != null && p - prev > 1;
          return (
            <span key={p} className="ds-pagination__page-group">
              {showEllipsis && <span className="ds-pagination__ellipsis" aria-hidden="true">…</span>}
              <button
                type="button"
                className={`ds-pagination__page ${p === page ? "is-active" : ""}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            </span>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Suivant
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;
