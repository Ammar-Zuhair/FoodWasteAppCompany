/**
 * Shipment Tracking API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getToken } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/shipments`;

/**
 * Get authorization headers
 */
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Create a new shipment with AI risk assessment
 * @param {Object} shipmentData - Shipment data
 * @param {string} shipmentData.organizationId - Organization ID
 * @param {string} shipmentData.fromFacilityId - Source facility ID
 * @param {string} shipmentData.toFacilityId - Destination facility ID
 * @param {Array} shipmentData.items - Array of items with batch_id, inventory_position_id, quantity
 * @param {string} shipmentData.orderId - Optional order ID
 * @param {string} shipmentData.driverId - Optional driver ID
 * @param {string} shipmentData.vehicleId - Optional vehicle ID
 * @param {string} shipmentData.shipmentNumber - Optional shipment number
 * @returns {Promise<Object>}
 */
export async function createShipment(shipmentData) {
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        organization_id: shipmentData.organizationId,
        order_id: shipmentData.orderId || null,
        driver_id: shipmentData.driverId || null,
        vehicle_id: shipmentData.vehicleId || null,
        from_facility_id: shipmentData.fromFacilityId,
        to_facility_id: shipmentData.toFacilityId,
        items: shipmentData.items,
        shipment_number: shipmentData.shipmentNumber || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }
}

/**
 * Get shipment details
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise<Object>}
 */
export async function getShipment(shipmentId) {
  try {
    const response = await fetch(`${BASE_URL}/${shipmentId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shipment:', error);
    throw error;
  }
}

/**
 * Update shipment GPS location
 * @param {string} shipmentId - Shipment ID
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @returns {Promise<Object>}
 */
export async function updateShipmentLocation(shipmentId, latitude, longitude) {
  try {
    const response = await fetch(`${BASE_URL}/${shipmentId}/location`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating shipment location:', error);
    throw error;
  }
}

/**
 * Update shipment temperature
 * @param {string} shipmentId - Shipment ID
 * @param {number} temperature - Current temperature
 * @returns {Promise<Object>}
 */
export async function updateShipmentTemperature(shipmentId, temperature) {
  try {
    const response = await fetch(`${BASE_URL}/${shipmentId}/temperature`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating shipment temperature:', error);
    throw error;
  }
}

/**
 * Check if shipment is ready for delivery
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise<Object>}
 */
export async function checkDeliveryReadiness(shipmentId) {
  try {
    const response = await fetch(`${BASE_URL}/${shipmentId}/check-delivery`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking delivery readiness:', error);
    throw error;
  }
}

/**
 * Get list of shipments
 * @param {Object} filters - Filter options
 * @param {string} filters.organization_id - Organization ID
 * @param {string} filters.status - Shipment status
 * @param {number} filters.limit - Limit number of results
 * @param {number} filters.offset - Offset for pagination
 * @returns {Promise<Object>}
 */
export async function getShipments(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const url = `${BASE_URL}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting shipments:', error);
    throw error;
  }
}

/**
 * Get active shipments for a driver
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>}
 */
export async function getActiveShipments(driverId) {
  try {
    const response = await fetch(`${BASE_URL}/driver/${driverId}/active`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting active shipments:', error);
    throw error;
  }
}

/**
 * Get shipments currently in transit with enhanced tracking data
 * @param {string} organizationId - Optional organization ID filter
 * @param {string} language - 'ar' or 'en' for duration formatting (default: 'ar')
 * @returns {Promise<Object>} In-transit shipments with tracking data
 */
export async function getInTransitShipments(organizationId = null, language = 'ar') {
  try {
    const params = new URLSearchParams();
    if (organizationId) params.append('organization_id', organizationId);
    if (language) params.append('language', language);

    const url = `${BASE_URL}/in-transit${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting in-transit shipments:', error);
    throw error;
  }
}
