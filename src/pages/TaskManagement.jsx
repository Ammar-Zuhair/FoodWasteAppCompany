import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";
import * as tasksAPI from "../utils/api/tasks.js";
import * as usersAPI from "../utils/api/users.js";

function TaskManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // "all", "today", "week"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    assigned_to_id: "",
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    category: "other",
    tags: [],
    notes: "",
  });

  // Load tasks
  useEffect(() => {
    loadTasks();
    loadUsers();
    loadStatistics();
  }, [viewMode, selectedStatus, selectedPriority]);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (viewMode === "today") {
        data = await tasksAPI.getTodayTasks();
      } else if (viewMode === "week") {
        data = await tasksAPI.getWeekTasks();
      } else {
        const params = {};
        if (selectedStatus !== "all") params.status = selectedStatus;
        if (selectedPriority !== "all") params.priority = selectedPriority;
        data = await tasksAPI.getTasks(params);
      }
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getUsers({ organization_id: user?.organization_id });
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await tasksAPI.getTaskStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchTerm ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [tasks, searchTerm]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tasksAPI.createTask({
        ...formData,
        assigned_to_id: formData.assigned_to_id || user.id,
        due_date: formData.due_date || null,
      });
      setShowCreateModal(false);
      resetForm();
      loadTasks();
      loadStatistics();
    } catch (err) {
      console.error("Error creating task:", err);
      alert(err.message || "Failed to create task");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await tasksAPI.updateTask(editingTask.id, formData);
      setEditingTask(null);
      resetForm();
      loadTasks();
      loadStatistics();
    } catch (err) {
      console.error("Error updating task:", err);
      alert(err.message || "Failed to update task");
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm(t("confirmDelete") || "Are you sure you want to delete this task?")) {
      return;
    }
    try {
      await tasksAPI.deleteTask(taskId);
      loadTasks();
      loadStatistics();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert(err.message || "Failed to delete task");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.updateTask(task.id, { status: newStatus });
      loadTasks();
      loadStatistics();
    } catch (err) {
      console.error("Error updating task status:", err);
      alert(err.message || "Failed to update task status");
    }
  };

  const resetForm = () => {
    setFormData({
      assigned_to_id: "",
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      category: "other",
      tags: [],
      notes: "",
    });
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      assigned_to_id: task.assigned_to_id,
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : "",
      category: task.category || "other",
      tags: task.tags || [],
      notes: task.notes || "",
    });
    setShowCreateModal(true);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "blue",
      medium: "amber",
      high: "orange",
      urgent: "red",
    };
    return colors[priority] || "gray";
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const bgColor = theme === "dark" ? "bg-slate-800" : "bg-white";
  const borderColor = theme === "dark" ? "border-slate-700" : "border-gray-200";

  return (
    <div className={`space-y-4 sm:space-y-5 md:space-y-6 ${bgColor} min-h-screen p-4 sm:p-5 md:p-6`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-4 sm:mb-5 md:mb-8">
        <h2 className={`text-xl sm:text-2xl md:text-4xl font-semibold ${textColor} mb-1 sm:mb-1.5 md:mb-3`}>
          {t("taskManagement") || "Task Management"}
        </h2>
        <p className={`text-xs sm:text-sm md:text-lg ${subTextColor}`}>
          {t("taskManagementDescription") || "Manage and track your tasks"}
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("total") || "Total"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>{statistics.total}</div>
          </div>
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("pending") || "Pending"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>{statistics.pending}</div>
          </div>
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("inProgress") || "In Progress"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>{statistics.in_progress}</div>
          </div>
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("completed") || "Completed"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>{statistics.completed}</div>
          </div>
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("overdue") || "Overdue"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold text-red-500`}>{statistics.overdue}</div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className={`${bgColor} ${borderColor} border rounded-lg p-4 sm:p-5 md:p-6`}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          {/* View Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "all"
                ? "bg-blue-500 text-white"
                : `${bgColor} ${textColor} ${borderColor} border`
                }`}
            >
              {t("all") || "All"}
            </button>
            <button
              onClick={() => setViewMode("today")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "today"
                ? "bg-blue-500 text-white"
                : `${bgColor} ${textColor} ${borderColor} border`
                }`}
            >
              {t("today") || "Today"}
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "week"
                ? "bg-blue-500 text-white"
                : `${bgColor} ${textColor} ${borderColor} border`
                }`}
            >
              {t("thisWeek") || "This Week"}
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder={t("searchTasks") || "Search tasks..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-lg ${bgColor} ${borderColor} border ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />

          {/* Create Button */}
          <button
            onClick={() => {
              resetForm();
              setEditingTask(null);
              setShowCreateModal(true);
            }}
            className="px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            {t("createTask") || "Create Task"}
          </button>
        </div>

        {/* Status and Priority Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-3 sm:px-4 py-2 rounded-lg ${bgColor} ${borderColor} border ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">{t("allStatuses") || "All Statuses"}</option>
            <option value="pending">{t("pending") || "Pending"}</option>
            <option value="in_progress">{t("inProgress") || "In Progress"}</option>
            <option value="completed">{t("completed") || "Completed"}</option>
            <option value="cancelled">{t("cancelled") || "Cancelled"}</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={`px-3 sm:px-4 py-2 rounded-lg ${bgColor} ${borderColor} border ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">{t("allPriorities") || "All Priorities"}</option>
            <option value="low">{t("low") || "Low"}</option>
            <option value="medium">{t("medium") || "Medium"}</option>
            <option value="high">{t("high") || "High"}</option>
            <option value="urgent">{t("urgent") || "Urgent"}</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className={`${bgColor} ${borderColor} border rounded-lg p-8 text-center`}>
          <div className={`${textColor}`}>{t("loading") || "Loading..."}</div>
        </div>
      ) : error ? (
        <div className={`${bgColor} ${borderColor} border rounded-lg p-8 text-center`}>
          <div className="text-red-500">{error}</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className={`${bgColor} ${borderColor} border rounded-lg p-8 text-center`}>
          <div className={`${textColor}`}>{t("noTasksFound") || "No tasks found"}</div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`${bgColor} ${borderColor} border rounded-lg p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className={`text-base sm:text-lg md:text-xl font-semibold ${textColor} flex-1`}>
                      {task.title}
                    </h3>
                    <StatusBadge status={task.status} />
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-${getPriorityColor(task.priority)}-100 text-${getPriorityColor(task.priority)}-800`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className={`text-sm ${subTextColor} mb-2`}>{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    {task.due_date && (
                      <span>
                        {t("dueDate") || "Due"}: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.category && (
                      <span>
                        {t("category") || "Category"}: {task.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(task)}
                    className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    {t("edit") || "Edit"}
                  </button>
                  {task.status !== "completed" && (
                    <button
                      onClick={() => handleStatusChange(task, "completed")}
                      className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      {t("complete") || "Complete"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    {t("delete") || "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setEditingTask(null);
                resetForm();
              }}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10 shadow-2xl" : "bg-white shadow-2xl"} p-0 text-right transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {editingTask ? (t("editTask") || "Edit Task") : (t("createTask") || "Create Task")}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className={`text-2xl ${subTextColor} hover:${textColor} transition-colors`}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <form id="task-form" onSubmit={editingTask ? handleUpdate : handleCreate} className="p-6 overflow-y-auto flex-1 space-y-4 text-right">
                <div>
                  <label className={`block text-sm font-bold ${textColor} mb-1`}>
                    {t("title") || "Title"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-bold ${textColor} mb-1`}>
                    {t("description") || "Description"}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("priority") || "Priority"}
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="low">{t("low") || "Low"}</option>
                      <option value="medium">{t("medium") || "Medium"}</option>
                      <option value="high">{t("high") || "High"}</option>
                      <option value="urgent">{t("urgent") || "Urgent"}</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("dueDate") || "Due Date"}
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                {(user?.role === "admin") && (
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("assignTo") || "Assign To"}
                    </label>
                    <select
                      value={formData.assigned_to_id}
                      onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">{t("selectUser") || "Select User"}</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className={`p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 ${textColor} hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold`}
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  form="task-form"
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold"
                >
                  {editingTask ? (t("update") || "Update") : (t("create") || "Create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskManagement;





