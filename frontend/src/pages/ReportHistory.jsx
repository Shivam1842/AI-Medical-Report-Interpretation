import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { mockReportHistoryRows } from '../data/mockData';

export default function ReportHistory() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const totalPages = 3;

  const handleDownload = () => {
    window.alert('Demo download started for this report.');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Report History</h1>
        <p>View and manage your previous reports</p>
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Date</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockReportHistoryRows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.date}</td>
                <td>{row.summary}</td>
                <td>
                  <StatusBadge label={row.status} variant="completed" />
                </td>
                <td>
                  <div className="history-actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`View ${row.name}`}
                      onClick={() => navigate('/results')}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Download ${row.name}`}
                      onClick={handleDownload}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination" aria-label="Pagination">
        <button
          type="button"
          className="pagination__button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <ChevronLeft size={16} />
        </button>

        <button type="button" className="pagination__number pagination__number--active" aria-label="Page 1">
          1
        </button>
        <button type="button" className="pagination__number" aria-label="Page 2" onClick={() => setPage(2)}>
          2
        </button>
        <button type="button" className="pagination__number" aria-label="Page 3" onClick={() => setPage(3)}>
          3
        </button>

        <button
          type="button"
          className="pagination__button"
          aria-label="Next page"
          disabled={page === totalPages}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}