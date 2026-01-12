import api from "./index.js";

/**
 * Get facilities heat map data
 */
export async function getFacilitiesHeatmap(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.facilityType) {
    params.append("facility_type", filters.facilityType);
  }
  if (filters.organizationId) {
    params.append("organization_id", filters.organizationId);
  }
  if (filters.windowHours) {
    params.append("window_hours", filters.windowHours);
  }
  
  const response = await api.get(`/api/v1/heatmaps/facilities?${params.toString()}`);
  return response.data;
}

/**
 * Get warehouses heat map data
 */
export async function getWarehousesHeatmap(windowHours = 1) {
  const response = await api.get(`/api/v1/heatmaps/warehouses?window_hours=${windowHours}`);
  return response.data;
}

/**
 * Get refrigerators heat map data
 */
export async function getRefrigeratorsHeatmap(windowHours = 1) {
  const response = await api.get(`/api/v1/heatmaps/refrigerators?window_hours=${windowHours}`);
  return response.data;
}




