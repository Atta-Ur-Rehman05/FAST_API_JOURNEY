import React, { useState, useEffect } from 'react';
import { RefreshCw, Pencil, CheckCircle2, XCircle } from 'lucide-react';
import type { User, RoleType, PaginatedResponse } from '../../types/api';
import { apiClient } from '../../lib/api-client';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<RoleType>('customer');
  const [editActive, setEditActive] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<User>>('/users/', {
        params: searchQuery ? { search: searchQuery } : undefined,
      });
      setUsers(res.data.items);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditRole(user.role);
    setEditActive(user.is_active);
  };

  const saveEdit = async (userId: string) => {
    setSavingId(userId);
    try {
      await apiClient.patch(`/users/${userId}`, { role: editRole, is_active: editActive });
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">User Management</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage user roles and account status</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
          />
          <button onClick={fetchUsers} className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xs">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center text-zinc-400 text-xs">No users found.</div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden border border-zinc-700 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-100">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-400">{u.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-zinc-100">{u.email}</td>
                    <td className="px-4 py-3 text-zinc-300">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as RoleType)} className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-xs text-zinc-100 text-xs">
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${u.role === 'admin' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-zinc-100 text-zinc-600 border-zinc-300'}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                      <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <select value={editActive ? 'true' : 'false'} onChange={(e) => setEditActive(e.target.value === 'true')} className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-xs text-zinc-100 text-xs">
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        <span className={`flex items-center gap-1 ${u.is_active ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {u.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-1.5">
                      {editingId === u.id ? (
                        <>
                          <button onClick={() => saveEdit(u.id)} disabled={savingId === u.id} className="p-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xs disabled:opacity-50">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-zinc-400 hover:bg-zinc-800 border border-zinc-700 rounded-xs">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(u)} className="p-1.5 text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded-xs">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
