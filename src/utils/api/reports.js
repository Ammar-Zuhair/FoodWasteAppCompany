/**
 * Reports API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/reports`;

/**
 * Convert blob to base64 string (without data URL prefix)
 */
async function blobToBase64String(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URL prefix to get just the base64 string
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper function to share or download a file
 * Shows share dialog on mobile, downloads on web
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 * @param {string} title - Share dialog title
 * @returns {Promise<void>}
 */
async function shareOrDownloadFile(blob, filename, mimeType, title = 'Share File') {
  // On native platform, save file then share
  if (Capacitor.isNativePlatform()) {
    try {
      // Convert blob to base64
      const base64Data = await blobToBase64String(blob);

      // Save file to cache directory
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Get the file URI
      const fileUri = savedFile.uri;

      // Share the file
      await Share.share({
        title: title,
        url: fileUri,
        dialogTitle: title,
      });

      // Optionally delete the file after sharing (cleanup)
      // await Filesystem.deleteFile({ path: filename, directory: Directory.Cache });

      return;
    } catch (shareError) {
      console.log('Native share failed:', shareError);
      // Fall through to download method
    }
  }

  // Try Web Share API (for PWA/web on mobile)
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title
        });
        return;
      }
    } catch (shareError) {
      if (shareError.name === 'AbortError') {
        return;
      }
      console.log('Web Share failed:', shareError);
    }
  }

  // Fallback: Regular download
  const url_blob = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url_blob;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url_blob);
  }, 100);
}

/**
 * Get dashboard report
 * @returns {Promise<Object>}
 */
export async function getDashboardReport() {
  try {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard report:', error);
    throw error;
  }
}

/**
 * Get comprehensive system overview with all metrics
 * @returns {Promise<Object>}
 */
export async function getSystemOverview() {
  try {
    const response = await fetch(`${BASE_URL}/system-overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching system overview:', error);
    throw error;
  }
}


/**
 * Get waste report
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getWasteReport(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);

    const url = `${BASE_URL}/waste${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching waste report:', error);
    throw error;
  }
}

/**
 * Get inventory report
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getInventoryReport(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.facility_id) params.append('facility_id', filters.facility_id);

    const url = `${BASE_URL}/inventory${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    throw error;
  }
}

/**
 * Generate custom report
 * @param {Object} reportConfig - Report configuration
 * @returns {Promise<Object>}
 */
export async function generateCustomReport(reportConfig) {
  try {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportConfig),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating custom report:', error);
    throw error;
  }
}

/**
 * Download report
 * @param {string} reportId - Report ID
 * @param {string} format - Report format (pdf, excel)
 * @returns {Promise<Blob>}
 */
export async function downloadReport(reportId, format = 'pdf') {
  try {
    const response = await fetch(`${BASE_URL}/${reportId}/download?format=${format}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
}

/**
 * Export report as Excel
 * @param {string} reportType - Report type: waste, inventory, dashboard
 * @param {Object} filters - Filter options (facility_id, start_date, end_date)
 * @returns {Promise<void>}
 */
export async function exportReportExcel(reportType, filters = {}) {
  try {
    const params = new URLSearchParams();
    params.append('report_type', reportType);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const url = `${BASE_URL}/export/excel?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Generate descriptive Arabic filename
    const dateStr = new Date().toISOString().split('T')[0];
    const reportTypeNames = {
      waste: 'تقرير_الهدر',
      inventory: 'تقرير_المخزون',
      dashboard: 'تقرير_لوحة_التحكم'
    };
    const filename = `${reportTypeNames[reportType] || 'تقرير'}_${dateStr}.xlsx`;

    // Download file
    const blob = await response.blob();
    const url_blob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url_blob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url_blob);
  } catch (error) {
    console.error('Error exporting Excel report:', error);
    throw error;
  }
}


// ===============================
// API V2 Functions - Enhanced Reports (using v1 endpoint)
// ===============================

const BASE_URL_V2 = `${API_CONFIG.baseURL}/api/v1/reports`;

/**
 * Get comprehensive report with all KPIs and insights (API v2)
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getComprehensiveReport(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.cause_type) params.append('cause_type', filters.cause_type);

    const url = `${BASE_URL_V2}/comprehensive${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching comprehensive report:', error);
    throw error;
  }
}

/**
 * Get waste insights with comparisons (API v2)
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>}
 */
export async function getWasteInsights(days = 30) {
  try {
    const response = await fetch(`${BASE_URL_V2}/waste-insights?days=${days}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching waste insights:', error);
    throw error;
  }
}

/**
 * Generate AI-powered executive summary (API v2)
 * @param {Object} reportData - Validated report data
 * @param {string} language - 'ar' or 'en'
 * @returns {Promise<Object>}
 */
export async function generateAISummary(reportData, language = 'ar') {
  try {
    // Validate required fields before sending
    if (!reportData.kpis || !reportData.top_causes || !reportData.period) {
      throw new Error('Missing required fields: kpis, top_causes, period');
    }

    const response = await fetch(`${BASE_URL_V2}/generate-ai-summary?language=${language}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid or incomplete data');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw error;
  }
}

/**
 * Get latest AI summary (API v2)
 * @param {string} language - 'ar' or 'en'
 * @returns {Promise<Object>}
 */
export async function getLatestAISummary(language = 'ar') {
  try {
    const response = await fetch(`${BASE_URL_V2}/ai-summary/latest?language=${language}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // Handle 404 or empty response gracefully
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if body is empty
    const text = await response.text();
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error('Error fetching latest AI summary:', error);
    return null;
  }
}

/**
 * Export comprehensive report as Excel with Meta sheet (API v2)
 * @param {Object} filters - Filter options
 * @returns {Promise<void>}
 */
export async function exportComprehensiveExcel(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.user_email) params.append('user_email', filters.user_email);

    const url = `${BASE_URL_V2}/export/comprehensive-excel?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Generate descriptive Arabic filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `تقرير_ترشيد_شامل_${dateStr}.xlsx`;

    // Download file and show share dialog
    const blob = await response.blob();
    await shareOrDownloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel Report');
  } catch (error) {
    console.error('Error exporting comprehensive Excel:', error);
    throw error;
  }
}

/**
 * Export professional Waste Executive Report (Excel)
 * @param {Object} filters - Filter options
 * @returns {Promise<void>}
 */
export async function exportWasteExecutiveReport(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);

    const url = `${BASE_URL}/export/waste-executive?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Generate descriptive Arabic filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `تقرير_الهدر_التنفيذي_${dateStr}.xlsx`;

    const blob = await response.blob();
    await shareOrDownloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Waste Executive Report');
  } catch (error) {
    console.error('Error exporting waste executive report:', error);
    throw error;
  }
}

/**
 * Export professional Sales Report (Excel)
 * @param {Object} filters - Filter options
 * @returns {Promise<void>}
 */
export async function exportSalesReport(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);

    const url = `${BASE_URL}/export/sales-report?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Generate descriptive Arabic filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `تقرير_المبيعات_${dateStr}.xlsx`;

    const blob = await response.blob();
    await shareOrDownloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Sales Report');
  } catch (error) {
    console.error('Error exporting sales report:', error);
    throw error;
  }
}


/**
 * Export comprehensive report as PDF (API v2)
 * @param {Object} filters - Filter options
 * @returns {Promise<void>}
 */
export async function exportComprehensivePDF(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.language) params.append('language', filters.language);
    if (filters.report_type) params.append('report_type', filters.report_type);
    if (filters.generated_by) params.append('generated_by', filters.generated_by);

    const url = `${BASE_URL_V2}/export/comprehensive-pdf?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Generate descriptive Arabic filename based on report_type
    const dateStr = new Date().toISOString().split('T')[0];
    const reportTypeNames = {
      comprehensive: filters.language === 'ar' ? 'تقرير_ترشيد_شامل' : 'comprehensive_report',
      waste: filters.language === 'ar' ? 'تقرير_الهدر' : 'waste_report',
      inventory: filters.language === 'ar' ? 'تقرير_المخزون' : 'inventory_report',
      sales: filters.language === 'ar' ? 'تقرير_المبيعات' : 'sales_report',
      executive: filters.language === 'ar' ? 'تقرير_تنفيذي' : 'executive_report',
      vehicles: filters.language === 'ar' ? 'تقرير_الشاحنات' : 'vehicles_report',
      customers: filters.language === 'ar' ? 'تقرير_العملاء' : 'customers_report'
    };
    const reportName = reportTypeNames[filters.report_type] || reportTypeNames.comprehensive;
    const filename = `${reportName}_${dateStr}.pdf`;

    // Download file and show share dialog
    const blob = await response.blob();
    const title = filters.language === 'ar' ? 'تقرير ترشيد' : 'Tarsheed Report';
    await shareOrDownloadFile(blob, filename, 'application/pdf', title);

  } catch (error) {
    console.error('Error exporting comprehensive PDF:', error);
    throw error;
  }
}

/**
 * Get monthly waste trend data with month names
 * @param {number} months - Number of months to fetch
 * @returns {Promise<Object>}
 */
export async function getMonthlyWasteTrend(months = 12) {
  try {
    const response = await fetch(`${BASE_URL}/monthly-waste?months=${months}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching monthly waste trend:', error);
    throw error;
  }
}
/**
 * Get donation impact report incl. Waste Diversion Rate
 * @param {string} period - 'month', 'quarter', 'year'
 * @returns {Promise<Object>}
 */
export async function getDonationImpactReport(period = 'month') {
  try {
    const response = await fetch(`${BASE_URL}/donation-impact?period=${period}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching donation impact report:', error);
    throw error;
  }
}
