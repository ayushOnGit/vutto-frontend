import React, { useState } from 'react';
import { Settings, Menu, X, Database } from 'lucide-react';

interface NavigationProps {
  currentView: 'settlement' | 'database';
  onViewChange: (view: 'settlement' | 'database') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'settlement',
      label: 'Settlement Configuration',
      icon: Settings,
      description: 'Manage settlement rules and percentages'
    },
    {
      id: 'database',
      label: 'Bike Database & Search',
      icon: Database,
      description: 'Search new challans and view all bike challans in database'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">Challan Manager</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id as 'settlement' | 'database')}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} className="mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                                          onClick={() => {
                        onViewChange(item.id as 'settlement' | 'database');
                        setIsMobileMenuOpen(false);
                      }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
