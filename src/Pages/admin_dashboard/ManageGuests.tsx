import React, { useEffect, useMemo, useState } from "react";
import styles from "./ManageGuests.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config/api";

type GuestStatus = "Active" | "Blocked" | "Pending";

type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emailVerified: boolean;
  isActive: boolean;
  updatedAt: string | Date;
  lastLoginAt?: string | Date;
  roles?: Array<{ name: string; displayName: string }>;
};

type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastStay: string; // ISO or display date
  status: GuestStatus;
  roles: string[];
};

export const ManageGuests: React.FC = () => {
  const [status, setStatus] = useState<"" | GuestStatus>("");
  const [data, setData] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/admin/users?limit=100`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to fetch users');
        const users: ApiUser[] = json.data.users;
        const mapped: Guest[] = users.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          email: u.email,
          phone: u.phone || '-',
          totalBookings: 0,
          lastStay: (u.lastLoginAt || u.updatedAt || new Date()).toString(),
          status: u.isActive ? 'Active' : 'Blocked',
          roles: (u.roles || []).map(r => r.name)
        }));
        setData(mapped);
      } catch (e: any) {
        setError(e.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_URL, token]);

  const filtered = useMemo(() => {
    return data.filter(g => !status || g.status === status);
  }, [status, data]);

  const toggleBlock = async (id: string) => {
    const user = data.find(g => g.id === id);
    if (!user) return;

    const endpoint = user.status === "Blocked" ? 'activate' : 'deactivate';
    
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Failed to ${endpoint} user`);
      }

      // Update local state
      setData(prev =>
        prev.map(g =>
          g.id === id ? { ...g, status: g.status === "Blocked" ? "Active" : "Blocked" } : g
        )
      );
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to update user status');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <div className={styles.container}>
        {errorMessage && <div className={styles.errorAlert}>⚠️ {errorMessage}</div>}
      
      <div className={styles.headerBar}>
        <h1 className={styles.title}>Manage Guests</h1>
        <div className={styles.actionsRow}>
          <select
            className={styles.filterSelect}
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      <section className={styles.section}>
        {loading && (<div style={{ padding: 16 }}>Loading users…</div>)}
        {error && (<div style={{ padding: 16, color: '#b00020' }}>{error}</div>)}
        <h3 className={styles.subtitle}>Guest Directory</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Guest ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Roles</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td className={styles.truncate}>{g.name}</td>
                  <td className={styles.truncate}>{g.email}</td>
                  <td className={styles.truncate}>{g.phone}</td>
                  <td className={styles.truncate}>{g.roles.join(', ') || '-'}</td>
                  <td>{g.lastStay ? new Date(g.lastStay).toLocaleString() : '-'}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        g.status === "Active"
                          ? styles.statusActive
                          : g.status === "Pending"
                          ? styles.statusPending
                          : styles.statusBlocked
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className={styles.nowrap}>
                    <button className={styles.viewBtn}>View</button>
                    <button
                      className={g.status === "Blocked" ? styles.restoreBtn : styles.deactivateBtn}
                      onClick={() => toggleBlock(g.id)}
                      disabled={loading}
                    >
                      {g.status === "Blocked" ? "Activate" : "Deactivate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#4a5568" }}>
                    No guests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};