import { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getUserStats } from '../utils/api/users.js';

/**
 * Hook for users list
 */
export function useUsers(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers(filters);
      setUsers(Array.isArray(data) ? data : (data.users || data.items || []));
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    users,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for user statistics
 */
export function useUserStats(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserStats(filters);
      setStats(data);
    } catch (err) {
      console.error('Error loading user stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    stats,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for creating users
 */
export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createUser(userData);
      return result;
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    create,
    loading,
    error,
  };
}

/**
 * Hook for updating users
 */
export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await updateUser(userId, userData);
      return result;
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    update,
    loading,
    error,
  };
}

/**
 * Hook for deleting users
 */
export function useDeleteUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await deleteUser(userId);
      return result;
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    delete: remove,
    loading,
    error,
  };
}












