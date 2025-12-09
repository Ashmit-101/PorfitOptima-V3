// Base URL for backend API. Provide sensible dev fallback if env is missing.
const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

async function handleResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function enqueueCompetitorSync({ productId, urls, fx }) {
  const payload = { urls, fx };
  const res = await fetch(`${API_BASE}/api/products/${productId}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function fetchCompetitorStatus(productId) {
  const res = await fetch(`${API_BASE}/api/products/${productId}/status`);
  return handleResponse(res);
}

export async function applySuggestedPrice(productId, userId, suggestedPrice) {
  const res = await fetch(`${API_BASE}/api/products/${productId}/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Backend expects { price: number }
    body: JSON.stringify({ price: suggestedPrice })
  });
  return handleResponse(res);
}
