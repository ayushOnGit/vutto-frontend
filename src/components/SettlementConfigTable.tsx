import React from 'react';
import { SettlementConfig } from '../types/SettlementConfig';
import { Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettlementConfigTableProps {
  configs: SettlementConfig[];
  onEdit: (config: SettlementConfig) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  isLoading: boolean;
}

const SettlementConfigTable: React.FC<SettlementConfigTableProps> = ({
  configs,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading
}) => {
  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'mparivahan':
        return 'MParivahan (ACKO/CarInfo)';
      case 'vcourt':
        return 'VCourt';
      case 'delhi_police':
        return 'Delhi Police';
      default:
        return sourceType;
    }
  };

  const getRegionLabel = (region: string) => {
    switch (region) {
      case 'ALL':
        return 'All Regions';
      case 'DL':
        return 'Delhi (DL)';
      case 'UP':
        return 'Uttar Pradesh (UP)';
      case 'HR':
        return 'Haryana (HR)';
      default:
        return region;
    }
  };

  const getSettlementEffect = (percentage: number) => {
    if (percentage === 100) {
      return { text: 'No discount', color: 'text-gray-600' };
    } else if (percentage < 100) {
      const discount = 100 - percentage;
      return { text: `${discount}% discount`, color: 'text-green-600' };
    } else {
      const penalty = percentage - 100;
      return { text: `${penalty}% penalty`, color: 'text-red-600' };
    }
  };

  const getCutoffDisplay = (config: SettlementConfig) => {
    const conditions = [];
    
    if (config.challan_year_cutoff && config.year_cutoff_logic) {
      conditions.push(`Year ${config.year_cutoff_logic} ${config.challan_year_cutoff}`);
    }
    
    if (config.amount_cutoff && config.amount_cutoff_logic) {
      conditions.push(`Amount ${config.amount_cutoff_logic} ₹${config.amount_cutoff}`);
    }
    
    if (conditions.length === 0) {
      return { text: 'No conditions', color: 'text-gray-400' };
    }
    
    return { text: conditions.join(', '), color: 'text-blue-700' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No settlement rules found</p>
        <p className="text-gray-400 text-sm mt-2">Create your first settlement rule to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rule Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Settlement %
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Effect
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cutoff Logic
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
          {configs.map((config) => {
            const effect = getSettlementEffect(config.settlement_percentage);
            const cutoffDisplay = getCutoffDisplay(config);
            return (
              <tr key={config.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {config.rule_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getSourceLabel(config.source_type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getRegionLabel(config.region)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {config.settlement_percentage}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${effect.color}`}>
                    {effect.text}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${cutoffDisplay.color}`}>
                    {cutoffDisplay.text}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleActive(config.id!, !config.is_active)}
                    className={`flex items-center ${
                      config.is_active ? 'text-green-600' : 'text-gray-400'
                    } hover:opacity-75 transition-opacity`}
                  >
                    {config.is_active ? (
                      <>
                        <ToggleRight size={20} className="mr-1" />
                        <span className="text-sm font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={20} className="mr-1" />
                        <span className="text-sm">Inactive</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(config)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit rule"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(config.id!)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SettlementConfigTable;

