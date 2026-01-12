import React, { useState, useEffect } from 'react';
import { getStoredUser } from '../utils/api/auth.js';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { API_CONFIG } from '../config/api.config.js';

const AdapterManagement = () => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null;

  const [adapters, setAdapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdapter, setSelectedAdapter] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  const [formData, setFormData] = useState({
    adapter_id: '',
    adapter_type: 'erp',
    adapter_name: '',
    config: {},
    enabled: true,
    sync_enabled: false,
    sync_direction: 'pull',
    sync_schedule: '',
  });

  useEffect(() => {
    loadAdapters();
  }, []);

  const loadAdapters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/adapters`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setAdapters(data.adapters || []);
    } catch (error) {
      console.error('Error loading adapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/adapters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create adapter');
      }
      setShowCreateModal(false);
      resetForm();
      loadAdapters();
    } catch (error) {
      console.error('Error creating adapter:', error);
      alert(error.message || 'Failed to create adapter');
    }
  };

  const handleUpdate = async (adapterId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/adapters/${adapterId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update adapter');
      }
      loadAdapters();
    } catch (error) {
      console.error('Error updating adapter:', error);
      alert(error.message || 'Failed to update adapter');
    }
  };

  const handleDelete = async (adapterId) => {
    if (!confirm('Are you sure you want to delete this adapter?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/adapters/${adapterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete adapter');
      }
      loadAdapters();
    } catch (error) {
      console.error('Error deleting adapter:', error);
      alert(error.message || 'Failed to delete adapter');
    }
  };

  const handleTest = async (adapterId) => {
    try {
      setTestResult(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/adapters/${adapterId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Connection test failed');
      }
      setTestResult(data);
      loadAdapters();
    } catch (error) {
      console.error('Error testing adapter:', error);
      setTestResult({
        status: 'failed',
        connected: false,
        error: error.message || 'Connection test failed',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      adapter_id: '',
      adapter_type: 'erp',
      adapter_name: '',
      config: {},
      enabled: true,
      sync_enabled: false,
      sync_direction: 'pull',
      sync_schedule: '',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('adapterManagement') || 'Adapter Management'}</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {t('createAdapter') || 'Create Adapter'}
        </button>
      </div>

      {/* Adapters List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('adapterName') || 'Name'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('adapterType') || 'Type'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('status') || 'Status'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('lastConnection') || 'Last Connection'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adapters.map((adapter) => (
              <tr key={adapter.adapter_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{adapter.adapter_name}</div>
                  <div className="text-sm text-gray-500">{adapter.adapter_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {adapter.adapter_type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(adapter.status)}`}>
                    {adapter.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {adapter.last_connection
                    ? new Date(adapter.last_connection).toLocaleString()
                    : t('never') || 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTest(adapter.adapter_id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {t('test') || 'Test'}
                    </button>
                    <button
                      onClick={() => handleUpdate(adapter.adapter_id, { enabled: !adapter.enabled })}
                      className={adapter.enabled ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                    >
                      {adapter.enabled ? (t('disable') || 'Disable') : (t('enable') || 'Enable')}
                    </button>
                    <button
                      onClick={() => handleDelete(adapter.adapter_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('delete') || 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {adapters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('noAdapters') || 'No adapters configured'}</p>
          </div>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg ${testResult.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
          <p className={`font-medium ${testResult.connected ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.connected
              ? t('connectionSuccessful') || 'Connection successful!'
              : t('connectionFailed') || 'Connection failed'}
          </p>
          {testResult.error && (
            <p className="text-sm text-red-600 mt-1">{testResult.error}</p>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10 shadow-2xl" : "bg-white shadow-2xl"} p-0 text-right transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {t('createAdapter') || 'Create Adapter'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className={`text-2xl ${subTextColor} hover:${textColor} transition-colors`}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-right">
                <div>
                  <label className={`block text-sm font-bold ${textColor} mb-1`}>
                    {t('adapterId') || 'Adapter ID'}
                  </label>
                  <input
                    type="text"
                    value={formData.adapter_id}
                    onChange={(e) => setFormData({ ...formData, adapter_id: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="my-erp-adapter"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-bold ${textColor} mb-1`}>
                    {t('adapterType') || 'Adapter Type'}
                  </label>
                  <select
                    value={formData.adapter_type}
                    onChange={(e) => setFormData({ ...formData, adapter_type: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="erp">ERP</option>
                    <option value="accounting">Accounting</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-bold ${textColor} mb-1`}>
                    {t('adapterName') || 'Adapter Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.adapter_name}
                    onChange={(e) => setFormData({ ...formData, adapter_name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="My ERP System"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-bold ${textColor} mb-1`}>
                    {t('configuration') || 'Configuration (JSON)'}
                  </label>
                  <textarea
                    value={JSON.stringify(formData.config, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData({ ...formData, config: JSON.parse(e.target.value) });
                      } catch (err) {
                        // Invalid JSON, keep as is
                      }
                    }}
                    className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm`}
                    rows={6}
                    placeholder='{"api_url": "https://api.example.com", "api_key": "your-key"}'
                  />
                </div>
              </div>

              {/* Footer */}
              <div className={`p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 ${textColor} hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold`}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold"
                >
                  {t('create') || 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdapterManagement;

