import React, { useState } from 'react';
import { Search, Car, FileText, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface VehicleSearchForm {
  regNumber: string;
  engineNumber: string;
  chassisNumber: string;
}

interface ChallanResult {
  id: number;
  reg_no: string;
  unique_challans_json: any[];
  aggregated_challans_json: any[];
  settlement_summary_json: any;
  created_at: string;
  updated_at: string;
}

const ChallanSearchDashboard: React.FC = () => {
  const [searchForm, setSearchForm] = useState<VehicleSearchForm>({
    regNumber: '',
    engineNumber: '',
    chassisNumber: ''
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ChallanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<ChallanResult[]>([]);

  const handleInputChange = (field: keyof VehicleSearchForm, value: string) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!searchForm.regNumber.trim()) {
      setError('Vehicle registration number is required');
      return false;
    }
    return true;
  };

  const handleSearch = async () => {
    if (!validateForm()) return;

    try {
      setIsSearching(true);
      setError(null);
      setSearchResults(null);

      // Call your backend API to trigger the pipeline
      const response = await fetch(`https://test.fitstok.com/api/challan/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchForm),
      });

      if (!response.ok) {
        throw new Error('Failed to search challans');
      }

      const result = await response.json();
      setSearchResults(result);
      
      // Add to search history
      if (result) {
        setSearchHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 searches
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setIsSearching(false);
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'processing':
        return <Clock size={20} className="text-yellow-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <Car className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Challan Search & Analysis</h1>
              <p className="text-gray-600 mt-1">Search vehicle challans and view comprehensive settlement analysis</p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Vehicle Search</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter vehicle details to search for challans and trigger settlement analysis
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Registration Number *
                </label>
                <input
                  type="text"
                  value={searchForm.regNumber}
                  onChange={(e) => handleInputChange('regNumber', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., DL3CBZ4267"
                  disabled={isSearching}
                />
              </div>



              {/* Engine Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engine Number (Optional)
                </label>
                <input
                  type="text"
                  value={searchForm.engineNumber}
                  onChange={(e) => handleInputChange('engineNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ABC123456"
                  disabled={isSearching}
                />
              </div>

              {/* Chassis Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chassis Number (Optional)
                </label>
                <input
                  type="text"
                  value={searchForm.chassisNumber}
                  onChange={(e) => handleInputChange('chassisNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., XYZ789012"
                  disabled={isSearching}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
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

            {/* Search Button */}
            <div className="mt-6">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full md:w-auto flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <RefreshCw size={20} className="animate-spin mr-2" />
                    Searching & Processing...
                  </>
                ) : (
                  <>
                    <Search size={20} className="mr-2" />
                    Search Challans
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Search Results</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vehicle: {searchResults.reg_no} | Last Updated: {new Date(searchResults.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Challans</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {searchResults.unique_challans_json?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Original Amount</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatAmount(searchResults.settlement_summary_json?.total_original_amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Car className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-purple-600">Settlement Amount</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatAmount(searchResults.settlement_summary_json?.total_settlement_amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-orange-600">Total Savings</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatAmount(searchResults.settlement_summary_json?.total_savings || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-6">
                {/* Unique Challans */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Unique Challans After Deduplication</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {searchResults.unique_challans_json?.map((challan: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="text-sm font-medium text-gray-900">
                            {challan.source} - {challan.challanNo || 'No ID'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Amount: {formatAmount(challan.amount || 0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Date: {challan.date || 'Unknown'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Settlement Breakdown */}
                {searchResults.settlement_summary_json && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Settlement Breakdown</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {Object.entries(searchResults.settlement_summary_json.rules_applied || {}).map(([rule, details]: [string, any]) => (
                          <div key={rule} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">{rule}</span>
                              <span className="text-sm text-gray-600">
                                {details.challan_count} challans
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Applied: {details.settlement_percentage}% | 
                              Original: {formatAmount(details.total_original)} | 
                              Settlement: {formatAmount(details.total_settlement)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Searches</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your last 5 vehicle searches
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {searchHistory.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Car className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{result.reg_no}</p>
                        <p className="text-xs text-gray-500">
                          {result.unique_challans_json?.length || 0} challans • 
                          {new Date(result.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSearchResults(result)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallanSearchDashboard;

