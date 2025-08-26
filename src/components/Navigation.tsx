import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Menu, X, Database, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { User } from '../contexts/AuthContext';

interface NavigationProps {
  user: User;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'settlement',
      label: 'Settlement Config',
      path: '/settlement',
      icon: Settings,
      requiredPermission: { resource: 'settlement_config', action: 'read' }
    },
    {
      id: 'database',
      label: 'Challan Database',
      path: '/database',
      icon: Database,
      requiredPermission: { resource: 'challan_dashboard', action: 'read' }
    },
    {
      id: 'rbac',
      label: 'RBAC Management',
      path: '/rbac',
      icon: Shield,
      requiredPermission: { resource: 'user_management', action: 'read' }
    }
  ];

  const hasPermission = (resource: string, action: string): boolean => {
    return user.permissions.some((permission: any) => 
      permission.resource === resource && permission.action === action
    );
  };

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (user.role === 'admin') return true; // Admin sees everything
    if (user.role === 'manager') return item.id !== 'rbac'; // Manager sees most (no RBAC)
    if (user.role === 'employee') return item.id === 'database'; // Employee sees only challan database
    return false;
  });

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">Vutto Challan Manager</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className="mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Info and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <UserIcon size={16} />
              <span className="font-medium">{user.name}</span>
              <span className="text-gray-500">({user.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 rounded-md"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 rounded-lg mt-2">
              {/* User Info */}
              <div className="px-3 py-2 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <UserIcon size={16} className="text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">Role: {user.role}</div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                    </div>
                  </Link>
                );
              })}

              {/* Logout Button */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
