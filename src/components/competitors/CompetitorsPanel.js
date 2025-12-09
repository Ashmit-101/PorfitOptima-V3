import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { applySuggestedPrice, enqueueCompetitorSync, fetchCompetitorStatus } from '../../services/competitorService';
import CompetitorLoadingAnimation from '../ui/CompetitorLoadingAnimation';

function formatCurrency(value) {
  if (Number.isNaN(Number(value))) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
}

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}

const CompetitorsPanel = forwardRef(({ product, userId, onPriceApplied }, ref) => {
  const [urls, setUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);

  useImperativeHandle(ref, () => ({
    refresh
  }));

  useEffect(() => {
    const storedUrls = product?.competitors?.urls ?? [];
    if (storedUrls.length > 0) {
      setUrls(storedUrls);
    }
    if (product?.competitors?.names?.length) {
      const rows = (product.competitors.names || []).map((name, index) => ({
        name,
        price: Number(product.competitors.prices?.[index] ?? 0),
        url: product.competitors.urls?.[index] ?? '#'
      }));
      const lastSynced = product.competitors.lastSynced;
      const lastSyncedIso =
        typeof lastSynced?.toDate === 'function'
          ? lastSynced.toDate().toISOString()
          : typeof lastSynced === 'string'
          ? lastSynced
          : undefined;
      setData({ rows, insights: product.aiInsights || null, lastSynced: lastSyncedIso });
    } else {
      setData({ rows: [], insights: product?.aiInsights || null });
    }
  }, [product]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const currentPrice = Number(product?.pricing?.sellingPrice ?? 0);

  const chartData = useMemo(() => {
    if (!data?.rows?.length) {
      return [];
    }
    const rows = [...data.rows];
    rows.push({ name: 'Your Price', price: currentPrice, url: '' });
    const maxPrice = Math.max(...rows.map((row) => row.price || 0), currentPrice || 0, 1);
    return rows.map((row) => ({
      ...row,
      width: Math.max((row.price / maxPrice) * 100, 5)
    }));
  }, [data, currentPrice]);

  const addUrl = () => {
    let trimmed = urlInput.trim();
    if (!trimmed) return;

    // Auto-prepend https:// if missing protocol
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }

    try {
      const formatted = new URL(trimmed).toString();
      setUrls((prev) => Array.from(new Set([...prev, formatted])));
      setUrlInput('');
    } catch (error) {
      setToast({ type: 'error', message: 'Please enter a valid URL.' });
    }
  };

  const removeUrl = (index) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const refresh = async () => {
    if (!product?.id) {
      setToast({ type: 'error', message: 'Select a product before syncing.' });
      return;
    }

    if (urls.length === 0) {
      setToast({ type: 'error', message: 'Add at least one competitor URL.' });
      return;
    }

    try {
      setLoading(true);
      setShowLoadingAnimation(true);

      // 1) enqueue background scrape job
      const { jobId } = await enqueueCompetitorSync({ productId: product.id, urls });
      
      // Wait for animation to complete before fetching data
      // The animation runs for approximately 15 seconds (5 messages × 3s each)
      await new Promise(resolve => setTimeout(resolve, 15000));

      // 2) immediately read latest status; UI can be enhanced to poll if desired
      const status = await fetchCompetitorStatus(product.id);
      const snapshot = status.snapshot;
      const insight = status.insight || null;

      const competitors = Array.isArray(snapshot?.competitors) ? snapshot.competitors : [];
      const rows = competitors.map((row, index) => ({
        name: row.hostname || `Competitor ${index + 1}`,
        price: Number(row.parsedPriceUsd ?? 0),
        url: row.url || urls[index] || '#'
      }));

      setData({
        rows,
        insights: insight,
        lastSynced: snapshot?.scrapedAt?._seconds
          ? new Date(snapshot.scrapedAt._seconds * 1000).toISOString()
          : undefined
      });
      setToast({ type: 'success', message: 'Competitors snapshot loaded.' });
    } catch (error) {
      console.error(error);
      setToast({ type: 'error', message: error.message || 'Failed to sync competitors.' });
      setShowLoadingAnimation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowLoadingAnimation(false);
  };

  const applyPrice = async () => {
    if (!data?.insights) return;
    try {
      setLoading(true);
  await applySuggestedPrice(product.id, userId, data.insights.recommendedPrice);
      setToast({ type: 'success', message: 'Suggested price applied.' });
      if (onPriceApplied) {
        onPriceApplied(data.insights.recommendedPrice);
      }
    } catch (error) {
      console.error(error);
      setToast({ type: 'error', message: error.message || 'Failed to apply price.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="competitors-panel">
      {showLoadingAnimation && <CompetitorLoadingAnimation onComplete={handleAnimationComplete} />}
      
      <Toast message={toast?.message} type={toast?.type || 'info'} />

      <div className="panel-header">
        <div>
          <h2>Competitors</h2>
          <p>Track rival prices and apply AI-backed recommendations.</p>
        </div>
      </div>

      <div className="url-input-row">
        <input
          type="url"
          placeholder="https://example.com/product"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addUrl();
            }
          }}
        />
        <button className="btn-secondary" type="button" onClick={addUrl}>
          Add URL
        </button>
      </div>

      {urls.length > 0 ? (
        <div className="tracked-urls">
          {urls.map((url, index) => (
            <span key={url} className="tracked-pill">
              {url}
              <button type="button" onClick={() => removeUrl(index)} aria-label="Remove">
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="empty-hint">No competitors yet. Add URLs to get started.</div>
      )}

      {chartData.length > 0 && (
        <div className="competitors-chart">
          {chartData.map((row) => (
            <div key={row.name} className="chart-row">
              <span className="chart-label">{row.name}</span>
              <div className="chart-bar">
                <div className={`chart-fill ${row.name === 'Your Price' ? 'chart-fill-self' : ''}`} style={{ width: `${row.width}%` }} />
                <span className="chart-value">{formatCurrency(row.price)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.rows?.length ? (
        <div className="competitors-table-wrapper">
          <table className="competitors-table">
            <thead>
              <tr>
                <th>Competitor</th>
                <th>Price (USD)</th>
                <th>Difference</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => {
                const diff = Number(row.price - currentPrice);
                const diffLabel = diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${formatCurrency(Math.abs(diff))}`;
                const diffClass = diff > 0 ? 'price-up' : diff < 0 ? 'price-down' : '';
                return (
                  <tr key={row.url || index}>
                    <td>{row.name}</td>
                    <td>{formatCurrency(row.price)}</td>
                    <td className={diffClass}>{diffLabel}</td>
                    <td>
                      {row.url ? (
                        <a href={row.url} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No competitor data yet</h3>
          <p>Run a sync to fetch competitor pricing insights.</p>
        </div>
      )}

      {data?.insights && (
        <div className="insights-card">
          <div className="insights-header">
            <div>
              <h3>AI Recommendation</h3>
              {data.lastSynced && <p className="timestamp">Last synced {new Date(data.lastSynced).toLocaleString()}</p>}
            </div>
            <span className="confidence">Confidence {(Number(data.insights.confidence ?? 0) * 100).toFixed(0)}%</span>
          </div>
          <div className="insights-grid">
            <div>
              <span className="label">Suggested Price</span>
              <strong>{formatCurrency(Number(data.insights.recommendedPrice ?? 0))}</strong>
            </div>
            <div>
              <span className="label">Expected Margin</span>
              <strong>{Number(data.insights.expectedMargin ?? 0).toFixed(1)}%</strong>
            </div>
            <div>
              <span className="label">Band</span>
              <strong>
                {formatCurrency(Number(data.insights.priceBand?.[0] ?? 0))} – {formatCurrency(Number(data.insights.priceBand?.[1] ?? 0))}
              </strong>
            </div>
            <div>
              <span className="label">Strategy</span>
              <strong className="strategy-tag">{(data.insights.strategy || 'maintain').replace('_', ' ')}</strong>
            </div>
          </div>
          <p className="insights-rationale">{data.insights.rationale || 'No recommendation available.'}</p>
          <div className="insights-actions">
            <button className="btn-success" onClick={applyPrice} disabled={loading}>
              Apply Suggested Price
            </button>
            <button className="btn-tertiary" onClick={refresh} disabled={loading}>
              Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default CompetitorsPanel;
