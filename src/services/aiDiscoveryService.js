const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

/**
 * Discover competitors using AI
 * @param {string} productId - Product ID
 * @param {object} productInfo - Product details for AI search
 * @returns {Promise<{competitors: Array}>}
 */
export async function discoverCompetitors(productId, productInfo) {
  try {
    const response = await fetch(`${API_BASE}/api/products/${productId}/discover-competitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productInfo })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to discover competitors');
    }

    return await response.json();
  } catch (error) {
    console.error('Discovery error:', error);
    throw error;
  }
}

/**
 * Approve a discovered competitor
 * @param {string} productId - Product ID
 * @param {string} competitorId - Competitor ID
 * @returns {Promise<{success: boolean}>}
 */
export async function approveCompetitor(productId, competitorId) {
  try {
    const response = await fetch(`${API_BASE}/api/products/${productId}/competitors/${competitorId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve competitor');
    }

    return await response.json();
  } catch (error) {
    console.error('Approve error:', error);
    throw error;
  }
}

/**
 * Reject a discovered competitor
 * @param {string} productId - Product ID
 * @param {string} competitorId - Competitor ID
 * @returns {Promise<{success: boolean}>}
 */
export async function rejectCompetitor(productId, competitorId) {
  try {
    const response = await fetch(`${API_BASE}/api/products/${productId}/competitors/${competitorId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject competitor');
    }

    return await response.json();
  } catch (error) {
    console.error('Reject error:', error);
    throw error;
  }
}

/**
 * Calculate optimal price based on approved competitors
 * @param {string} productId - Product ID
 * @param {object} pricingData - Competitor prices and cost data
 * @returns {Promise<{recommendedPrice: number, priceBand: [number, number], expectedMargin: number, rationale: string}>}
 */
export async function calculateOptimalPrice(productId, pricingData) {
  try {
    const response = await fetch(`${API_BASE}/api/products/${productId}/calculate-pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pricingData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate optimal price');
    }

    return await response.json();
  } catch (error) {
    console.error('Pricing calculation error:', error);
    throw error;
  }
}

/**
 * Get discovery status for a product
 * @param {string} productId - Product ID
 * @returns {Promise<{status: string, competitors: Array}>}
 */
export async function getDiscoveryStatus(productId) {
  try {
    const response = await fetch(`${API_BASE}/api/products/${productId}/discovery-status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get discovery status');
    }

    return await response.json();
  } catch (error) {
    console.error('Status error:', error);
    throw error;
  }
}
