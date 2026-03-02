import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import '../../styles/components.css';

function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 0) return null;

  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        Page <span className="pagination-info-highlight">{page}</span> of{' '}
        <span className="pagination-info-highlight">{totalPages || 1}</span>
        {total != null && (
          <>
            {' '}
            · {total} item{total !== 1 ? 's' : ''}
          </>
        )}
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn pagination-nav"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          type="button"
          className="pagination-btn pagination-nav"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="pagination-numbers">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`pagination-btn pagination-number ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pagination-btn pagination-nav"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="pagination-btn pagination-nav"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
