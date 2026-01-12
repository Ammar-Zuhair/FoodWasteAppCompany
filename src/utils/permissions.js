/**
 * نظام الصلاحيات الشامل - Role-Based Access Control (RBAC)
 * Extensible Permission System with Compound Rules
 * 
 * Features:
 * - Array-based permissions (canView[], canCreate[], etc.)
 * - Facility-scoped access control
 * - Compound permission rules
 * - Data scope management
 */

// ======== ROLE DEFINITIONS ========
export const ROLES = {
  ADMIN: 'admin',
  BRANCH_MANAGER: 'branch_manager',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  QUALITY_MANAGER: 'quality_manager',
  PRODUCTION_MANAGER: 'production_manager',
  DISTRIBUTION_MANAGER: 'distribution_manager',
  DRIVER: 'driver',
  SUPERMARKET: 'supermarket',
  SALES_REP: 'sales_rep',
};

// ======== RESOURCE DEFINITIONS ========
export const RESOURCES = {
  // Dashboard & General
  DASHBOARD: 'dashboard',
  CHATBOT: 'chatbot',
  PROFILE: 'profile',

  // Operations
  INVENTORY: 'inventory',
  BATCHES: 'batches',
  PRODUCTION: 'production',
  PRODUCTION_MANAGEMENT: 'production_management',
  DISTRIBUTION: 'distribution',
  SHIPMENTS: 'shipments',
  ORDERS: 'orders',
  RETURNS: 'returns',

  // Quality & Monitoring
  QUALITY: 'quality',
  REFRIGERATION: 'refrigeration',
  WASTE_ANALYSIS: 'waste_analysis',
  ALERTS: 'alerts',
  HEATMAPS: 'heatmaps',
  RFID_TRACKING: 'rfid_tracking',

  // AI & Analytics
  AI_DASHBOARD: 'ai_dashboard',
  DIGITAL_TWIN: 'digital_twin',
  REPORTS: 'reports',
  FORECAST: 'forecast',

  // Charity & Special
  CHARITY: 'charity',
  LEADS: 'leads',
  TASKS: 'tasks',

  // Admin
  ADMIN: 'admin',
  USERS: 'users',
  BRANCHES: 'branches',
  FACILITIES: 'facilities',
  VEHICLES: 'vehicles',
  SUPERMARKETS: 'supermarkets',
  ALERT_SETTINGS: 'alert_settings',
  SYSTEM_SETTINGS: 'system_settings',
  ADAPTERS: 'adapters',
  AUDIT_LOGS: 'audit_logs',
};

// ======== DATA SCOPE TYPES ========
export const DATA_SCOPE = {
  GLOBAL: 'global',         // Can see all data (admin only)
  ORGANIZATION: 'organization', // Can see all data in organization
  FACILITY: 'facility',     // Limited to assigned facility
  BRANCH: 'branch',         // Limited to assigned branch
  VEHICLE: 'vehicle',       // Limited to assigned vehicle (driver)
  MERCHANT: 'merchant',     // Limited to merchant store (supermarket)
  PERSONAL: 'personal',     // Only own data (sales rep)
};

// ======== ROLE PERMISSIONS MATRIX ========
export const ROLE_PERMISSIONS = {
  // ========== 1. مدير النظام (System Admin) - صلاحية كاملة ==========
  [ROLES.ADMIN]: {
    displayName: { ar: 'مدير النظام', en: 'System Admin' },
    dataScope: DATA_SCOPE.GLOBAL,
    canView: ['*'],
    canCreate: ['*'],
    canEdit: ['*'],
    canDelete: ['*'],
    menuItems: [
      // ★ الأزرار الأربعة الرئيسية في شريط التنقل السفلي (لا تظهر في الـ drawer)
      { label: 'home', path: '/dashboard', icon: 'home', isBottomNav: true },
      { label: 'reports', path: '/reports', icon: 'reports', isBottomNav: true },
      { label: 'rfidTracking', path: '/rfid-tracking', icon: 'rfid', isBottomNav: true },
      { label: 'userManagement', path: '/users', icon: 'users', isBottomNav: true },
      // باقي العناصر في القائمة الجانبية فقط
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'aiDashboard', path: '/ai', icon: 'ai' },
      { label: 'refrigerationManagement', path: '/refrigeration', icon: 'refrigeration' },
      { label: 'productionPlanning', path: '/production', icon: 'production' },
      { label: 'batchManagement', path: '/batches', icon: 'batches' },
      { label: 'distributionManagement', path: '/distribution', icon: 'distribution' },
      { label: 'wasteAnalysis', path: '/waste-analysis', icon: 'waste' },
      { label: 'shipmentManagement', path: '/shipments', icon: 'shipments' },
      { label: 'orderManagement', path: '/orders', icon: 'orders' },
      { label: 'charityIntegration', path: '/charity', icon: 'charity' },
      { label: 'qualityManagement', path: '/quality', icon: 'quality' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
      { label: 'heatMaps', path: '/heatmaps', icon: 'heatmaps' },
      { label: 'inventoryManagement', path: '/inventory', icon: 'inventory' },
      { label: 'facilitiesManagement', path: '/facilities', icon: 'facilities' },
      { label: 'vehiclesManagement', path: '/vehicles', icon: 'vehicles' },
      { label: 'supermarketsManagement', path: '/supermarkets', icon: 'supermarkets' },
    ],
    layout: 'desktop',
  },

  // ========== 2. مدير الفرع (Branch Manager) - READ ONLY للمنشأة فقط ==========
  // يرى: الطلبات، الإنتاج، التوزيع، المخازن، تقارير الجودة، الأصول - بدون تعديل
  [ROLES.BRANCH_MANAGER]: {
    displayName: { ar: 'مدير الفرع', en: 'Branch Manager' },
    dataScope: DATA_SCOPE.FACILITY,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.ORDERS,
      RESOURCES.PRODUCTION,
      RESOURCES.DISTRIBUTION,
      RESOURCES.INVENTORY,
      RESOURCES.BATCHES,
      RESOURCES.QUALITY,
      RESOURCES.SHIPMENTS,
      RESOURCES.REPORTS,
      RESOURCES.REFRIGERATION,
      RESOURCES.ALERTS,
      RESOURCES.PROFILE,
    ],
    canCreate: [],
    canEdit: [],
    canDelete: [],
    isReadOnly: true,
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'orderManagement', path: '/orders', icon: 'orders' },
      { label: 'productionPlanning', path: '/production', icon: 'production' },
      { label: 'distributionManagement', path: '/distribution', icon: 'distribution' },
      { label: 'inventoryManagement', path: '/inventory', icon: 'inventory' },
      { label: 'batchManagement', path: '/batches', icon: 'batches' },
      { label: 'refrigerationManagement', path: '/refrigeration', icon: 'refrigeration' },
      { label: 'qualityManagement', path: '/quality', icon: 'quality' },
      { label: 'shipmentManagement', path: '/shipments', icon: 'shipments' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
      { label: 'reports', path: '/reports', icon: 'reports' },
    ],
    layout: 'desktop',
  },

  // ========== 3. مسؤول المخازن (Warehouse Manager) - المنشأة فقط ==========
  // مراقبة المخزون، درجات الحرارة، التجاوزات، التنبيهات، إدارة الأصول
  [ROLES.WAREHOUSE_MANAGER]: {
    displayName: { ar: 'مسؤول المخازن', en: 'Warehouse Manager' },
    dataScope: DATA_SCOPE.FACILITY,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.INVENTORY,
      RESOURCES.BATCHES,
      RESOURCES.REFRIGERATION,
      RESOURCES.ALERTS,
      RESOURCES.SHIPMENTS,
      RESOURCES.PROFILE,
    ],
    canCreate: [
      RESOURCES.BATCHES,
      RESOURCES.SHIPMENTS,
    ],
    canEdit: [
      RESOURCES.BATCHES,
      RESOURCES.INVENTORY,
    ],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'inventoryManagement', path: '/inventory', icon: 'inventory' },
      { label: 'batchManagement', path: '/batches', icon: 'batches' },
      { label: 'refrigerationManagement', path: '/refrigeration', icon: 'refrigeration' },
      { label: 'shipmentManagement', path: '/shipments', icon: 'shipments' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
    ],
    layout: 'desktop',
  },

  // ========== 4. مسؤول الجودة (Quality Officer) - المنشأة فقط ==========
  // رؤية البضائع من خط الإنتاج، مراجعة الجودة، تحليل الهدر، التقارير
  [ROLES.QUALITY_MANAGER]: {
    displayName: { ar: 'مسؤول الجودة', en: 'Quality Officer' },
    dataScope: DATA_SCOPE.FACILITY,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.BATCHES,
      RESOURCES.QUALITY,
      RESOURCES.WASTE_ANALYSIS,
      RESOURCES.REPORTS,
      RESOURCES.PROFILE,
    ],
    canCreate: [
      RESOURCES.QUALITY,
    ],
    canEdit: [
      RESOURCES.QUALITY,
      RESOURCES.BATCHES,
    ],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'batchManagement', path: '/batches', icon: 'batches' },
      { label: 'qualityManagement', path: '/quality', icon: 'quality' },
      { label: 'wasteAnalysis', path: '/waste-analysis', icon: 'waste' },
      { label: 'reports', path: '/reports', icon: 'reports' },
    ],
    layout: 'desktop',
  },

  // ========== 5. مسؤول الإنتاج (Production Manager) - المنشأة فقط ==========
  // تخطيط الإنتاج، إدارة الإنتاج، التنبؤات، متابعة خطوط الإنتاج
  [ROLES.PRODUCTION_MANAGER]: {
    displayName: { ar: 'مسؤول الإنتاج', en: 'Production Manager' },
    dataScope: DATA_SCOPE.FACILITY,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.PRODUCTION,
      RESOURCES.PRODUCTION_MANAGEMENT,
      RESOURCES.AI_DASHBOARD,
      RESOURCES.REPORTS,
      RESOURCES.PROFILE,
    ],
    canCreate: [
      RESOURCES.PRODUCTION,
    ],
    canEdit: [
      RESOURCES.PRODUCTION,
    ],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'productionPlanning', path: '/production', icon: 'production' },
      { label: 'productionManagement', path: '/production/management', icon: 'production' },
      { label: 'aiDashboard', path: '/ai', icon: 'ai' },
      { label: 'reports', path: '/reports', icon: 'reports' },
    ],
    layout: 'desktop',
  },

  // ========== 6. مسؤول التوزيع (Distribution Manager) - المنشأة فقط ==========
  // استقبال الطلبات، إدارة التوزيع، الشحنات، التنبيهات
  [ROLES.DISTRIBUTION_MANAGER]: {
    displayName: { ar: 'مسؤول التوزيع', en: 'Distribution Manager' },
    dataScope: DATA_SCOPE.FACILITY,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.ORDERS,
      RESOURCES.DISTRIBUTION,
      RESOURCES.BATCHES,
      RESOURCES.SHIPMENTS,
      RESOURCES.ALERTS,
      RESOURCES.REPORTS,
      RESOURCES.PROFILE,
    ],
    canCreate: [
      RESOURCES.ORDERS,
      RESOURCES.SHIPMENTS,
      RESOURCES.BATCHES,
      RESOURCES.DISTRIBUTION,
    ],
    canEdit: [
      RESOURCES.ORDERS,
      RESOURCES.SHIPMENTS,
      RESOURCES.DISTRIBUTION,
      RESOURCES.BATCHES,
    ],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'orderManagement', path: '/orders', icon: 'orders' },
      { label: 'distributionManagement', path: '/distribution', icon: 'distribution' },
      { label: 'batchManagement', path: '/batches', icon: 'batches' },
      { label: 'shipmentManagement', path: '/shipments', icon: 'shipments' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
      { label: 'reports', path: '/reports', icon: 'reports' },
    ],
    layout: 'desktop',
  },

  // ========== 7. السائق (Driver) - المركبة الخاصة به فقط ==========
  // رؤية البضائع السابقة، استقبال طلبات التوصيل، مراقبة التجاوزات، التنبيهات، إدارة المركبة
  [ROLES.DRIVER]: {
    displayName: { ar: 'سائق', en: 'Driver' },
    dataScope: DATA_SCOPE.VEHICLE,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.SHIPMENTS,
      RESOURCES.ALERTS,
      RESOURCES.REFRIGERATION,
      RESOURCES.PROFILE,
    ],
    canCreate: [],
    canEdit: [
      RESOURCES.SHIPMENTS,
    ],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'shipmentManagement', path: '/shipments', icon: 'shipments' },
      { label: 'refrigerationManagement', path: '/refrigeration', icon: 'refrigeration' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
    ],
    layout: 'desktop',
  },

  // ========== 8. السوبر ماركت (Supermarket) - المتجر الخاص به فقط ==========
  // رؤية البضاعة، تنبؤات الطلب، التوصيات، التنبيهات، إرسال طلبات
  [ROLES.SUPERMARKET]: {
    displayName: { ar: 'سوبرماركت', en: 'Supermarket' },
    dataScope: DATA_SCOPE.MERCHANT,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.INVENTORY,
      RESOURCES.ORDERS,
      RESOURCES.ALERTS,
      RESOURCES.REFRIGERATION,
      RESOURCES.REPORTS,
      RESOURCES.PROFILE,
    ],
    canCreate: [
      RESOURCES.ORDERS,
    ],
    canEdit: [
      RESOURCES.ORDERS,
    ],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'inventoryManagement', path: '/inventory', icon: 'inventory' },
      { label: 'orderManagement', path: '/orders', icon: 'orders' },
      { label: 'refrigerationManagement', path: '/refrigeration', icon: 'refrigeration' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
      { label: 'reports', path: '/reports', icon: 'reports' },
    ],
    layout: 'desktop',
  },

  // ========== 9. مندوب المبيعات (Sales Representative) - بياناته الشخصية فقط ==========
  // رؤية طلباته، البضائع لعملائه، إنشاء/تعديل طلباته، تقاريره، إدارة السوبرماركت
  [ROLES.SALES_REP]: {
    displayName: { ar: 'مندوب مبيعات', en: 'Sales Representative' },
    dataScope: DATA_SCOPE.PERSONAL,
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.ORDERS,
      RESOURCES.INVENTORY,
      RESOURCES.SUPERMARKETS,
      RESOURCES.ALERTS,
      RESOURCES.REPORTS,
      RESOURCES.PROFILE,
    ],
    canCreate: [
      RESOURCES.ORDERS,
      RESOURCES.SUPERMARKETS,
    ],
    canEdit: [
      RESOURCES.ORDERS,
      RESOURCES.SUPERMARKETS,
    ],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'orderManagement', path: '/orders', icon: 'orders' },
      { label: 'inventoryManagement', path: '/inventory', icon: 'inventory' },
      { label: 'supermarketsManagement', path: '/admin/supermarkets', icon: 'supermarkets' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
      { label: 'reports', path: '/reports', icon: 'reports' },
    ],
    layout: 'desktop',
  },

  // ========== 10. السوبرماركت (Supermarket) - بياناته فقط ==========
  // يرى: طلباته، مخزونه، التنبيهات الخاصة به
  [ROLES.SUPERMARKET]: {
    displayName: { ar: 'سوبرماركت', en: 'Supermarket' },
    dataScope: DATA_SCOPE.PERSONAL,  // يرى بياناته فقط
    canView: [
      RESOURCES.DASHBOARD,
      RESOURCES.CHATBOT,
      RESOURCES.ORDERS,      // يرى طلباته فقط
      RESOURCES.INVENTORY,   // يرى مخزونه فقط
      RESOURCES.ALERTS,      // يرى التنبيهات الخاصة به
      RESOURCES.PROFILE,
    ],
    canCreate: [
      RESOURCES.ORDERS,      // يمكنه إنشاء طلبات
    ],
    canEdit: [],
    canDelete: [],
    menuItems: [
      { label: 'home', path: '/dashboard', icon: 'home' },
      { label: 'chatbot', path: '/chatbot', icon: 'chatbot' },
      { label: 'orderManagement', path: '/orders', icon: 'orders' },
      { label: 'inventoryManagement', path: '/inventory', icon: 'inventory' },
      { label: 'alertCenter', path: '/alerts', icon: 'alerts' },
    ],
    layout: 'desktop',
  },
};

// ======== ROUTE TO RESOURCE MAPPING ========
const ROUTE_RESOURCE_MAP = {
  '/dashboard': RESOURCES.DASHBOARD,
  '/chatbot': RESOURCES.CHATBOT,
  '/profile': RESOURCES.PROFILE,
  '/inventory': RESOURCES.INVENTORY,
  '/batches': RESOURCES.BATCHES,
  '/production': RESOURCES.PRODUCTION,
  '/production/management': RESOURCES.PRODUCTION_MANAGEMENT,
  '/distribution': RESOURCES.DISTRIBUTION,
  '/shipments': RESOURCES.SHIPMENTS,
  '/shipments/track': RESOURCES.SHIPMENTS,
  '/orders': RESOURCES.ORDERS,
  '/returns': RESOURCES.RETURNS,
  '/quality': RESOURCES.QUALITY,
  '/refrigeration': RESOURCES.REFRIGERATION,
  '/waste-analysis': RESOURCES.WASTE_ANALYSIS,
  '/alerts': RESOURCES.ALERTS,
  '/heatmaps': RESOURCES.HEATMAPS,
  '/rfid-tracking': RESOURCES.RFID_TRACKING,
  '/ai': RESOURCES.AI_DASHBOARD,
  '/digital-twin': RESOURCES.DIGITAL_TWIN,
  '/reports': RESOURCES.REPORTS,
  '/forecast': RESOURCES.FORECAST,
  '/charity': RESOURCES.CHARITY,
  '/leads': RESOURCES.LEADS,
  '/tasks': RESOURCES.TASKS,
  '/admin': RESOURCES.ADMIN,
  '/admin/branches': RESOURCES.BRANCHES,
  '/admin/facilities': RESOURCES.FACILITIES,
  '/admin/vehicles': RESOURCES.VEHICLES,
  '/admin/supermarkets': RESOURCES.SUPERMARKETS,
  '/admin/alert-settings': RESOURCES.ALERT_SETTINGS,
  '/admin/system-settings': RESOURCES.SYSTEM_SETTINGS,
  '/settings/system': RESOURCES.SYSTEM_SETTINGS,
  '/adapters': RESOURCES.ADAPTERS,
  '/audit-logs': RESOURCES.AUDIT_LOGS,
};

// ======== PERMISSION CHECKING FUNCTIONS ========

/**
 * Get normalized role code
 */
function normalizeRole(role) {
  if (!role) return null;

  // Handle object input (e.g., { role: 'admin' })
  let roleStr = role;
  if (typeof role === 'object') {
    roleStr = role.role || role.name || role.code || '';
  }

  // Ensure it's a string
  if (typeof roleStr !== 'string') {
    roleStr = String(roleStr || '');
  }

  roleStr = roleStr.toLowerCase().trim();

  if (!roleStr) return null;

  // Map common variations
  const roleMap = {
    'admin': ROLES.ADMIN,
    'system_admin': ROLES.ADMIN,
    'branch_manager': ROLES.BRANCH_MANAGER,
    'warehouse_manager': ROLES.WAREHOUSE_MANAGER,
    'quality_manager': ROLES.QUALITY_MANAGER,
    'quality_officer': ROLES.QUALITY_MANAGER,
    'production_manager': ROLES.PRODUCTION_MANAGER,
    'distribution_manager': ROLES.DISTRIBUTION_MANAGER,
    'driver': ROLES.DRIVER,
    'supermarket': ROLES.SUPERMARKET,
    'retailer': ROLES.SUPERMARKET,
    'supermarket_manager': ROLES.SUPERMARKET,
    'sales_rep': ROLES.SALES_REP,
    'sales_representative': ROLES.SALES_REP,
    'sales_manager': ROLES.SALES_REP,
  };
  return roleMap[roleStr] || roleStr;
}


/**
 * Get permission config for a role
 */
export function getRolePermissions(role) {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole] || null;
}

/**
 * Check if role can view a resource
 * @param {string} role - User role
 * @param {string} resource - Resource name or route path
 * @param {Object} context - Optional context { facility_id, branch_id, user_id }
 */
export function canView(role, resource, context = {}) {
  const permissions = getRolePermissions(role);
  if (!permissions) return false;

  // Check if wildcard permission
  if (permissions.canView.includes('*')) return true;

  // Convert route to resource if needed
  const resourceName = ROUTE_RESOURCE_MAP[resource] || resource;

  // Check basic view permission
  const hasViewPermission = permissions.canView.includes(resourceName);
  if (!hasViewPermission) return false;

  // Check scope if context provided
  if (context.facility_id && permissions.dataScope === DATA_SCOPE.FACILITY) {
    // Additional scope checking can be done here
    return true;
  }

  return hasViewPermission;
}

/**
 * Check if role can create a resource
 */
export function canCreate(role, resource) {
  const permissions = getRolePermissions(role);
  if (!permissions) return false;
  if (permissions.canCreate.includes('*')) return true;
  const resourceName = ROUTE_RESOURCE_MAP[resource] || resource;
  return permissions.canCreate.includes(resourceName);
}

/**
 * Check if role can edit a resource
 */
export function canEdit(role, resource) {
  const permissions = getRolePermissions(role);
  if (!permissions) return false;
  if (permissions.canEdit.includes('*')) return true;
  const resourceName = ROUTE_RESOURCE_MAP[resource] || resource;
  return permissions.canEdit.includes(resourceName);
}

/**
 * Check if role can delete a resource
 */
export function canDelete(role, resource) {
  const permissions = getRolePermissions(role);
  if (!permissions) return false;
  if (permissions.canDelete.includes('*')) return true;
  const resourceName = ROUTE_RESOURCE_MAP[resource] || resource;
  return permissions.canDelete.includes(resourceName);
}

/**
 * Check if role is read-only
 */
export function isReadOnly(role) {
  const permissions = getRolePermissions(role);
  return permissions?.isReadOnly === true;
}

/**
 * Get data scope for a role
 */
export function getDataScope(role) {
  const permissions = getRolePermissions(role);
  return permissions?.dataScope || DATA_SCOPE.PERSONAL;
}

/**
 * Check if role has global data access
 */
export function hasGlobalAccess(role) {
  const permissions = getRolePermissions(role);
  return permissions?.dataScope === DATA_SCOPE.GLOBAL;
}

/**
 * Check route permission (backward compatibility)
 * @deprecated Use canView instead
 */
export function hasPermission(role, route, userInfo = {}) {
  return canView(role, route, userInfo);
}

/**
 * Get menu items for a role
 */
export function getMenuItems(role, userInfo = {}) {
  const permissions = getRolePermissions(role);
  if (!permissions) return [];
  return permissions.menuItems || [];
}

/**
 * Check if role can perform action (backward compatibility)
 * @deprecated Use canCreate/canEdit/canDelete instead
 */
export function canPerformAction(role, action, resource = null) {
  switch (action) {
    case 'create':
      return resource ? canCreate(role, resource) : !isReadOnly(role);
    case 'edit':
      return resource ? canEdit(role, resource) : !isReadOnly(role);
    case 'delete':
      return resource ? canDelete(role, resource) : canDelete(role, '*');
    default:
      return false;
  }
}

/**
 * Get layout type for role
 */
export function getLayoutType(role, isMobile) {
  const permissions = getRolePermissions(role);
  if (!permissions) return 'desktop';
  if (isMobile) return 'mobile';
  return permissions.layout || 'desktop';
}

/**
 * Get role display info
 */
export function getRoleDisplayInfo(role) {
  const permissions = getRolePermissions(role);
  if (!permissions) {
    return { ar: role, en: role };
  }
  return permissions.displayName;
}

/**
 * Build query params for facility-scoped requests
 */
export function buildScopeParams(user) {
  const scope = getDataScope(user.role);
  const params = {};

  switch (scope) {
    case DATA_SCOPE.GLOBAL:
      // No filtering needed
      break;
    case DATA_SCOPE.ORGANIZATION:
      if (user.organization_id) params.organization_id = user.organization_id;
      break;
    case DATA_SCOPE.FACILITY:
      if (user.facility_id) params.facility_id = user.facility_id;
      break;
    case DATA_SCOPE.BRANCH:
      if (user.branch_id) params.branch_id = user.branch_id;
      break;
    case DATA_SCOPE.VEHICLE:
      if (user.vehicle_id) params.vehicle_id = user.vehicle_id;
      break;
    case DATA_SCOPE.MERCHANT:
      if (user.merchant_id) params.merchant_id = user.merchant_id;
      break;
    case DATA_SCOPE.PERSONAL:
      if (user.id) params.user_id = user.id;
      break;
  }

  return params;
}

/**
 * Check compound permission with scope
 * @example canViewWithScope('inventory', { facility_id: 1 }, user)
 */
export function canViewWithScope(resource, requiredScope, user) {
  // First check basic view permission
  if (!canView(user.role, resource)) return false;

  const userScope = getDataScope(user.role);

  // Global access can see everything
  if (userScope === DATA_SCOPE.GLOBAL) return true;

  // Check if user's scope matches required scope
  if (requiredScope.facility_id && userScope === DATA_SCOPE.FACILITY) {
    return user.facility_id === requiredScope.facility_id;
  }

  if (requiredScope.branch_id && userScope === DATA_SCOPE.BRANCH) {
    return user.branch_id === requiredScope.branch_id;
  }

  if (requiredScope.merchant_id && userScope === DATA_SCOPE.MERCHANT) {
    return user.merchant_id === requiredScope.merchant_id;
  }

  if (requiredScope.user_id && userScope === DATA_SCOPE.PERSONAL) {
    return user.id === requiredScope.user_id;
  }

  return true;
}
