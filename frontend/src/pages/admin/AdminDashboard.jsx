import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import {
  getDashboardStats,
  getAllUsers,
  changeRole,
  removeUser,
} from "../../api/admin";
import RoleDropdown from "../../components/RoleDropdown";

function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4 animate-pulse">
      <div className="h-3 bg-zinc-800 rounded w-20 mb-3" />
      <div className="h-7 bg-zinc-800 rounded w-12" />
    </div>
  );
}

function UserRowSkeleton() {
  return (
    <tr className="border-b border-zinc-800/50 last:border-0 animate-pulse">
      <td className="px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-24" />
      </td>
      <td className="px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-32" />
      </td>
      <td className="px-5 py-3">
        <div className="h-6 bg-zinc-800 rounded w-16" />
      </td>
      <td className="px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-16" />
      </td>
      <td className="px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-10 ml-auto" />
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        getDashboardStats(accessToken),
        getAllUsers(accessToken),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Admin | Ramy";
  });

  useEffect(() => {
    if (accessToken) loadData();
  }, [accessToken]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await changeRole(userId, newRole, accessToken);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm("Delete this user permanently? This cannot be undone."))
      return;

    try {
      await removeUser(userId, accessToken);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-zinc-950 text-white px-8 py-8">
      <h1 className="text-2xl font-semibold mb-1">Admin Dashboard</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Manage users and monitor activity across the app.
      </p>

      {error && (
        <p className="text-sm text-red-400 mb-6 bg-red-950/40 border border-red-900 rounded-md px-4 py-2">
          {error}
        </p>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                Total Users
              </p>
              <p className="text-2xl font-semibold">
                {stats?.totalUsers ?? "-"}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                Total Notes
              </p>
              <p className="text-2xl font-semibold">
                {stats?.totalNotes ?? "-"}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                Total Tags
              </p>
              <p className="text-2xl font-semibold">
                {stats?.totalTags ?? "-"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Users table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Users
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-zinc-800">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <UserRowSkeleton />
                <UserRowSkeleton />
                <UserRowSkeleton />
                <UserRowSkeleton />
              </>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  <td className="px-5 py-3">{u.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <RoleDropdown
                      value={u.role}
                      onChange={(newRole) => handleRoleChange(u.id, newRole)}
                    />
                  </td>
                  <td className="px-5 py-3 text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleRemoveUser(u.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
