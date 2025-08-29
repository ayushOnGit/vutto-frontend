import React, { useState, useEffect } from 'react';
import { SettlementConfig, SettlementConfigFormData } from '../types/SettlementConfig';
import SettlementConfigForm from './SettlementConfigForm';
import SettlementConfigTable from './SettlementConfigTable';
import { Plus, Settings, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { settlementConfigAPI } from '../services/api';

const SettlementConfigDashboard: React.FC = () => {
  const [configs, setConfigs] = useState<SettlementConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SettlementConfig | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await settlementConfigAPI.getAll();
      setConfigs(data);
    } catch (err) {
      setError('Failed to load settlement configurations. Please check your backend connection.');
      console.error('Error loading configs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingConfig(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (config: SettlementConfig) => {
    setEditingConfig(config);
    setIsFormOpen(true);
  };

  const handleSave = async (formData: SettlementConfigFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const configData = {
        rule_name: formData.rule_name,
        source_type: formData.source_type,
        region: formData.region,
        challan_year_cutoff: formData.challan_year_cutoff ? parseInt(formData.challan_year_cutoff) : null,
        year_cutoff_logic: formData.year_cutoff_logic || null,
        amount_cutoff: formData.amount_cutoff ? parseFloat(formData.amount_cutoff) : null,
        amount_cutoff_logic: formData.amount_cutoff_logic || null,
        settlement_percentage: parseFloat(formData.settlement_percentage),
        is_active: formData.is_active,
      };

      if (editingConfig) {
        await settlementConfigAPI.update(editingConfig.id!, configData);
        setSuccessMessage('Settlement rule updated successfully!');
      } else {
        await settlementConfigAPI.create(configData as any);
        setSuccessMessage('Settlement rule created successfully!');
      }

      setIsFormOpen(false);
      setEditingConfig(undefined);
      await loadConfigs();
    } catch (err) {
      setError('Failed to save settlement configuration. Please try again.');
      console.error('Error saving config:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this settlement rule?')) {
      return;
    }

    try {
      setError(null);
      await settlementConfigAPI.delete(id);
      setSuccessMessage('Settlement rule deleted successfully!');
      await loadConfigs();
    } catch (err) {
      setError('Failed to delete settlement configuration. Please try again.');
      console.error('Error deleting config:', err);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      setError(null);
      await settlementConfigAPI.toggleActive(id, isActive);
      setSuccessMessage(`Settlement rule ${isActive ? 'activated' : 'deactivated'} successfully!`);
      await loadConfigs();
    } catch (err) {
      setError('Failed to update settlement configuration status. Please try again.');
      console.error('Error toggling active status:', err);
    }
  };



  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingConfig(undefined);
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settlement Configuration</h1>
                <p className="text-gray-600 mt-1">Manage settlement rules for different challan sources and regions</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadConfigs}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleCreate}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus size={16} className="mr-2" />
                Create New Rule
              </button>
              
              <button
                onClick={handleClearAll}
                disabled={isLoading || configs.length === 0}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear all settlement rules and start fresh"
              >
                <Trash2 size={16} className="mr-2" />
                Clear All Rules
              </button>
            </div>
          </div>
        </div>



        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-green-400">✓</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Settlement Rules</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure settlement percentages, regions, and conditions for different challan sources
            </p>
          </div>
          <div className="p-6">
            {configs.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <Settings size={48} />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No settlement rules</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first settlement rule.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus size={16} className="mr-2" />
                    Create First Rule
                  </button>
                </div>
              </div>
            ) : (
              <SettlementConfigTable
                configs={configs}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <SettlementConfigForm
            config={editingConfig}
            onSave={handleSave}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default SettlementConfigDashboard;
