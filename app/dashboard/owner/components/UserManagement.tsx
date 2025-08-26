"use client";
import { useState, useEffect } from "react";
import { Users, Search, Trash2, UserX, UserCheck, RefreshCw } from "lucide-react";
import EthiopianDate from "@/components/EthiopianDate";

interface User {
  _id: string;
  name: string;
  phone: string;
  role: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  isActive: boolean;
  isSuspended: boolean;
}

interface UserManagementProps {
  ownerId: string | null;
}

export default function UserManagement({ ownerId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users?ownerId=${ownerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object response structures
        const usersArray = Array.isArray(data) ? data : (data.users || []);
        
        // Add default values for missing fields
        const processedUsers = usersArray.map((user: any) => ({
          _id: user._id,
          name: user.name || 'Unknown',
          phone: user.phone || 'N/A',
          role: user.role || 'unknown',
          branchId: user.branchId,
          branchName: user.branchName,
          createdAt: user.createdAt,
          isActive: user.isActive !== undefined ? user.isActive : true,
          isSuspended: user.isSuspended !== undefined ? user.isSuspended : false
        }));
        
        setUsers(processedUsers);
        console.log('Fetched users:', processedUsers);
      } else {
        console.error('Failed to fetch users:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSoftDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    setUpdatingUser(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, isActive: false } : user
        ));
      } else {
        alert('Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    setUpdatingUser(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, isSuspended: true } : user
        ));
      } else {
        alert('Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/reactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, isActive: true, isSuspended: false } : user
        ));
      } else {
        alert('Failed to reactivate user');
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Failed to reactivate user');
    } finally {
      setUpdatingUser(null);
    }
  };

  const getStatusColor = (user: User) => {
    if (user.isSuspended) return 'bg-red-100 text-red-800 border-red-200';
    if (!user.isActive) return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = (user: User) => {
    if (user.isSuspended) return 'Suspended';
    if (!user.isActive) return 'Inactive';
    return 'Active';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'barber': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'washer': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'owner': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management-container">
      <div className="section-header">
        <div className="header-content">
          <div className="header-icon">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="section-title">User Management</h2>
            <p className="section-subtitle">Manage staff, workers, and administrators</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="refresh-button"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="filters-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="barber">Barber</option>
            <option value="washer">Washer</option>
            <option value="owner">Owner</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users className="w-16 h-16 text-slate-300" />
            <h4>No Users Found</h4>
            <p>{searchTerm ? `No users match your search "${searchTerm}"` : 'No users available'}</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((user, index) => (
                  <tr key={user._id} className="user-row">
                    <td className="row-number">{index + 1}</td>
                    <td className="user-name-cell">
                      <div className="user-name-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-id">ID: {user._id.slice(-6)}</span>
                      </div>
                    </td>
                    <td className="phone-cell">{user.phone}</td>
                    <td className="role-cell">
                      <span className={`role-badge ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${getStatusColor(user)}`}>
                        {getStatusText(user)}
                      </span>
                    </td>
                    <td className="date-cell">
                      <EthiopianDate 
                        dateString={user.createdAt} 
                        showTime={false} 
                        showWeekday={false}
                      />
                    </td>
                    <td className="actions-cell">
                      <div className="user-actions">
                        {user.isActive && !user.isSuspended ? (
                          <>
                            <button
                              onClick={() => handleSuspend(user._id)}
                              disabled={updatingUser === user._id}
                              className="action-button suspend"
                              title="Suspend User"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSoftDelete(user._id)}
                              disabled={updatingUser === user._id}
                              className="action-button deactivate"
                              title="Deactivate User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReactivate(user._id)}
                            disabled={updatingUser === user._id}
                            className="action-button reactivate"
                            title="Reactivate User"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .user-management-container {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .section-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .filters-section {
          margin-bottom: 2rem;
        }

        .search-container {
          margin-bottom: 1rem;
        }

        .search-input-wrapper {
          position: relative;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          width: 20px;
          height: 20px;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 1rem;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .users-table-container {
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .loading-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        .loading-state p {
          margin-top: 1rem;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        .empty-state h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .users-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e2e8f0;
        }

        .users-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .users-table tr:hover {
          background: #f8fafc;
        }

        .row-number {
          font-weight: 600;
          color: #64748b;
          text-align: center;
          width: 50px;
        }

        .user-name-cell {
          min-width: 200px;
        }

        .user-name-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-name {
          font-weight: 600;
          color: #1e293b;
        }

        .user-id {
          font-size: 0.75rem;
          color: #64748b;
        }

        .phone-cell {
          font-family: monospace;
          font-weight: 500;
          color: #374151;
        }

        .role-cell {
          text-align: center;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
          border: 1px solid;
        }

        .status-cell {
          text-align: center;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
        }

        .date-cell {
          color: #64748b;
          font-size: 0.875rem;
        }

        .actions-cell {
          text-align: center;
          width: 120px;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .action-button {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button.suspend {
          color: #f59e0b;
        }

        .action-button.suspend:hover {
          background: #fef3c7;
          color: #d97706;
        }

        .action-button.deactivate {
          color: #ef4444;
        }

        .action-button.deactivate:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-button.reactivate {
          color: #10b981;
        }

        .action-button.reactivate:hover {
          background: #d1fae5;
          color: #059669;
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .user-management-container {
            border-radius: 16px;
            padding: 1.5rem;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .filter-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-select {
            width: 100%;
          }

          .users-table-container {
            font-size: 0.75rem;
          }

          .users-table th,
          .users-table td {
            padding: 0.75rem 0.5rem;
          }

          .user-name-cell {
            min-width: 150px;
          }

          .actions-cell {
            width: 100px;
          }
        }
      `}</style>
    </div>
  );
}
