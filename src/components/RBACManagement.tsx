import React, { useState, useEffect } from 'react';
import { Users, Shield, Key, Edit, Save, X, Plus, Trash2 } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
  last_login: string | null;
  created_at: string;
  permissions: Array<{
    resource: string;
    action: string;
    source: string;
    role?: string;
    granted?: boolean;
  }>;
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  is_active: boolean;
}

const RBACManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<{ [key: number]: number }>({});
  const [showPermissions, setShowPermissions] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, permissionsRes] = await Promise.all([
        fetch('/api/auth/users'),
        fetch('/api/auth/roles'),
        fetch('/api/auth/permissions')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.data);
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        setPermissions(permissionsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: number, roleId: number) => {
    try {
      const response = await fetch('/api/auth/users/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, role: updatedUser.data.role }
            : user
        ));
        setEditingUser(null);
        setSelectedRole({});
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handlePermissionToggle = async (userId: number, permissionId: number, granted: boolean) => {
    try {
      const endpoint = granted ? '/api/auth/users/permissions/grant' : '/api/auth/users/permissions/revoke';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permissionId })
      });

      if (response.ok) {
        // Refresh user data to get updated permissions
        fetchData();
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getPermissionStatus = (user: User, resource: string, action: string) => {
    const permission = user.permissions.find(p => 
      p.resource === resource && p.action === action
    );
    return permission?.granted !== false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3 h-8 w-8 text-blue-600" />
            RBAC Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage user roles, permissions, and access control
          </p>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-600" />
              Users & Roles
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role.name === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role.name === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingUser === user.id ? (
                        <>
                          <select
                            value={selectedRole[user.id] || user.role.id}
                            onChange={(e) => setSelectedRole({
                              ...selectedRole,
                              [user.id]: parseInt(e.target.value)
                            })}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                          >
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRoleUpdate(user.id, selectedRole[user.id] || user.role.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setSelectedRole({});
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingUser(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Role"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowPermissions({
                              ...showPermissions,
                              [user.id]: !showPermissions[user.id]
                            })}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Permissions"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permissions Section */}
        {Object.keys(showPermissions).some(key => showPermissions[parseInt(key)]) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Key className="mr-2 h-5 w-5 text-purple-600" />
                User Permissions
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users
                    .filter(user => showPermissions[user.id])
                    .map(user => 
                      permissions.map(permission => {
                        const hasPermission = getPermissionStatus(user, permission.resource, permission.action);
                        return (
                          <tr key={`${user.id}-${permission.id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {permission.resource}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {permission.action}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                hasPermission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {hasPermission ? 'Granted' : 'Denied'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handlePermissionToggle(user.id, permission.id, !hasPermission)}
                                className={`px-3 py-1 rounded-md text-xs font-medium ${
                                  hasPermission
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {hasPermission ? 'Revoke' : 'Grant'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RBACManagement;
