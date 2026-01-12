/**
 * Settings API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/settings`;

export async function getAlertThresholds() {
  try {
    const response = await fetch(`${BASE_URL}/alerts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.alert_thresholds || {};
  } catch (error) {
    console.error('Error fetching alert thresholds:', error);
    throw error;
  }
}

export async function updateAlertThresholds(thresholds) {
  try {
    const response = await fetch(`${BASE_URL}/alerts`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(thresholds),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.alert_thresholds || {};
  } catch (error) {
    console.error('Error updating alert thresholds:', error);
    throw error;
  }
}

export async function getIntegrationSettings() {
  try {
    const response = await fetch(`${BASE_URL}/integrations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.integration_settings || {};
  } catch (error) {
    console.error('Error fetching integration settings:', error);
    throw error;
  }
}

export async function updateIntegrationSettings(settings) {
  try {
    const response = await fetch(`${BASE_URL}/integrations`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.integration_settings || {};
  } catch (error) {
    console.error('Error updating integration settings:', error);
    throw error;
  }
}




































