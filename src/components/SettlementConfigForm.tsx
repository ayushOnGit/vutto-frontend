import React, { useState } from 'react';
import { SettlementConfig, SettlementConfigFormData, SOURCE_TYPES, REGIONS } from '../types/SettlementConfig';
import { X, Save } from 'lucide-react';

interface SettlementConfigFormProps {
  config?: SettlementConfig;
  onSave: (config: SettlementConfigFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const SettlementConfigForm: React.FC<SettlementConfigFormProps> = ({
  config,
  onSave,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<SettlementConfigFormData>({
    rule_name: config?.rule_name || '',
    source_type: config?.source_type || 'mparivahan',
    region: config?.region || 'ALL',
    challan_year_cutoff: config?.challan_year_cutoff?.toString() || '',
    year_cutoff_logic: config?.year_cutoff_logic || '',
    amount_cutoff: config?.amount_cutoff?.toString() || '',
    amount_cutoff_logic: config?.amount_cutoff_logic || '',
    settlement_percentage: config?.settlement_percentage?.toString() || '',
    is_active: config?.is_active ?? true,
  });

  const [errors, setErrors] = useState<Partial<SettlementConfigFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SettlementConfigFormData> = {};

    if (!formData.rule_name.trim()) {
      newErrors.rule_name = 'Rule name is required';
    }

    if (!formData.settlement_percentage.trim()) {
      newErrors.settlement_percentage = 'Settlement percentage is required';
    } else {
      const percentage = parseFloat(formData.settlement_percentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 1000) {
        newErrors.settlement_percentage = 'Settlement percentage must be between 0 and 1000';
      }
    }

    if (formData.challan_year_cutoff && formData.challan_year_cutoff.trim()) {
      const year = parseInt(formData.challan_year_cutoff);
      if (isNaN(year) || year < 2000 || year > 2030) {
        newErrors.challan_year_cutoff = 'Year must be between 2000 and 2030';
      }
    }

    if (formData.amount_cutoff && formData.amount_cutoff.trim()) {
      const amount = parseFloat(formData.amount_cutoff);
      if (isNaN(amount) || amount < 0) {
        newErrors.amount_cutoff = 'Amount must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSave(formData);
    }
  };

  const handleInputChange = (field: keyof SettlementConfigFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {config ? 'Edit Settlement Rule' : 'Create Settlement Rule'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.rule_name}
              onChange={(e) => handleInputChange('rule_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.rule_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., DL_MPARIVAHAN_60"
            />
            {errors.rule_name && (
              <p className="mt-1 text-sm text-red-600">{errors.rule_name}</p>
            )}
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Type *
            </label>
            <select
              value={formData.source_type}
              onChange={(e) => handleInputChange('source_type', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region *
            </label>
            <select
              value={formData.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          {/* Settlement Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Settlement Percentage * (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              value={formData.settlement_percentage}
              onChange={(e) => handleInputChange('settlement_percentage', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.settlement_percentage ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., 60 (for 60% settlement)"
            />
            {errors.settlement_percentage && (
              <p className="mt-1 text-sm text-red-600">{errors.settlement_percentage}</p>
            )}
            <p className="mt-0.5 text-xs text-gray-500">
              Values &gt;100% indicate penalties (e.g., 160% = 60% penalty)
            </p>
          </div>

          {/* Year Cutoff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Cutoff Logic
              </label>
              <select
                value={formData.year_cutoff_logic}
                onChange={(e) => handleInputChange('year_cutoff_logic', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No year restriction</option>
                <option value="≤">Less than or equal to (≤)</option>
                <option value=">">Greater than ({'>'})</option>
              </select>
              <p className="mt-0.5 text-xs text-gray-500">
                Choose cutoff logic for year
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Challan Year Cutoff
              </label>
              <input
                type="number"
                min="2000"
                max="2030"
                value={formData.challan_year_cutoff}
                onChange={(e) => handleInputChange('challan_year_cutoff', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.challan_year_cutoff ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 2023"
                disabled={!formData.year_cutoff_logic}
              />
              {errors.challan_year_cutoff && (
                <p className="mt-1 text-sm text-red-600">{errors.challan_year_cutoff}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-500">
                {formData.year_cutoff_logic ? 
                  `Year ${formData.year_cutoff_logic} ${formData.challan_year_cutoff || '___'}` : 
                  'Select logic first'
                }
              </p>
            </div>
          </div>

          {/* Amount Cutoff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Cutoff Logic
              </label>
              <select
                value={formData.amount_cutoff_logic}
                onChange={(e) => handleInputChange('amount_cutoff_logic', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No amount restriction</option>
                <option value="≤">Less than or equal to (≤)</option>
                <option value=">">Greater than ({'>'})</option>
              </select>
              <p className="mt-0.5 text-xs text-gray-500">
                Choose cutoff logic for amount
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Cutoff (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount_cutoff}
                onChange={(e) => handleInputChange('amount_cutoff', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount_cutoff ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 1000"
                disabled={!formData.amount_cutoff_logic}
              />
              {errors.amount_cutoff && (
                <p className="mt-1 text-sm text-red-600">{errors.amount_cutoff}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-500">
                {formData.amount_cutoff_logic ? 
                  `Amount ${formData.amount_cutoff_logic} ₹${formData.amount_cutoff || '___'}` : 
                  'Select logic first'
                }
              </p>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active (rule will be applied)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Rule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettlementConfigForm;
