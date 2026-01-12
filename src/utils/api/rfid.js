import api from "./index.js";

/**
 * Get RFID tags with tracking information
 */
export async function getRFIDTags(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.facilityId) {
    params.append("facility_id", filters.facilityId);
  }
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.batchId) {
    params.append("batch_id", filters.batchId);
  }
  if (filters.limit) {
    params.append("limit", filters.limit);
  }
  if (filters.offset) {
    params.append("offset", filters.offset);
  }
  
  const response = await api.get(`/api/v1/rfid/tags?${params.toString()}`);
  return response.data;
}

/**
 * Get detailed information about a specific RFID tag
 */
export async function getRFIDTag(tagId) {
  const response = await api.get(`/api/v1/rfid/tags/${tagId}`);
  return response.data;
}

/**
 * Get RFID tracking dashboard statistics
 */
export async function getRFIDDashboard() {
  const response = await api.get("/api/v1/rfid/dashboard");
  return response.data;
}

/**
 * Get tracking history for a specific RFID tag
 */
export async function getRFIDTagHistory(tagId, hours = 24) {
  const response = await api.get(`/api/v1/rfid/tags/${tagId}/history?hours=${hours}`);
  return response.data;
}




