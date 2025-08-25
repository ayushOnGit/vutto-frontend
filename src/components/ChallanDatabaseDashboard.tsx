import React, { useState, useEffect } from 'react';
import { Database, Car, FileText, Search, Eye, RefreshCw, Calendar, DollarSign, X, AlertCircle, AlertTriangle, CheckCircle, Plus, Loader2, Upload, Download } from 'lucide-react';

interface BikeChallanRecord {
  id: number;
  reg_no: string;
  engine_no?: string; // Engine number from challan database
  chassis_no?: string; // Chassis number from challan database
  vcourt_notice_status: string;
  vcourt_traffic_status: string;
  unique_challans_json: any[];
  aggregated_challans_json: any[];
  settlement_summary_json: any;
  settlement_calculation_status: string;
  fir_status?: string; // FIR status: 'stolen', 'not_stolen', 'unknown', or undefined
  created_at: string;
  updated_at: string;
}

interface VehicleSearchForm {
  regNumber: string;
  engineNumber: string;
  chassisNumber: string;
  mobileNumber: string;
}

const ChallanDatabaseDashboard: React.FC = () => {
  const [bikeChallans, setBikeChallans] = useState<BikeChallanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBikeChallan, setSelectedBikeChallan] = useState<BikeChallanRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortField, setSortField] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeSource, setActiveSource] = useState<string>('vcourt_notice');
  
  // Search functionality state
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchForm, setSearchForm] = useState<VehicleSearchForm>({
    regNumber: '',
    engineNumber: '',
    chassisNumber: '',
    mobileNumber: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState<{ [key: number]: boolean }>({});
  const [showHoldAmountInfo, setShowHoldAmountInfo] = useState(false);
  
  // Bulk upload state
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [bulkUploadResults, setBulkUploadResults] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    loadBikeChallans();
  }, []);

  const loadBikeChallans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching challans from API...');
      const response = await fetch('https://test.fitstok.com/api/challan/database');
      console.log('📡 Raw response:', response);
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error('Failed to fetch bike challan database');
      }
      
      const data = await response.json();
      console.log('🚗 API Response for Challan Dashboard:', data);
      console.log('📊 Response type:', typeof data);
      console.log('📋 Response structure:', JSON.stringify(data, null, 2));
      
      if (Array.isArray(data)) {
        console.log('✅ Response is an array with', data.length, 'items');
        // Log the first item structure if available
        if (data.length > 0) {
          console.log('🔍 First challan item structure:', JSON.stringify(data[0], null, 2));
          console.log('💰 Settlement Summary JSON:', JSON.stringify(data[0].settlement_summary_json, null, 2));
          console.log('📊 Settlement Summary Fields:', {
            totalOriginalAmount: data[0].settlement_summary_json?.totalOriginalAmount,
            totalSettlementAmount: data[0].settlement_summary_json?.totalSettlementAmount,
            totalSavings: data[0].settlement_summary_json?.totalSavings,
            averageSettlementPercentage: data[0].settlement_summary_json?.averageSettlementPercentage
          });
        }
      } else if (data && typeof data === 'object') {
        console.log('✅ Response is an object with keys:', Object.keys(data));
        if (data.data && Array.isArray(data.data)) {
          console.log('✅ Response has data property with', data.data.length, 'items');
          if (data.data.length > 0) {
            console.log('🔍 First challan item structure:', JSON.stringify(data.data[0], null, 2));
            console.log('💰 Settlement Summary JSON:', JSON.stringify(data.data[0].settlement_summary_json, null, 2));
            console.log('📊 Settlement Summary Fields:', {
              totalOriginalAmount: data.data[0].settlement_summary_json?.totalOriginalAmount,
              totalSettlementAmount: data.data[0].settlement_summary_json?.totalSettlementAmount,
              totalSavings: data.data[0].settlement_summary_json?.totalSavings,
              averageSettlementPercentage: data.data[0].settlement_summary_json?.averageSettlementPercentage
            });
          }
        }
      }
      
      setBikeChallans(data);
    } catch (err) {
      console.error('❌ Error fetching bike challans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bike challan database');
    } finally {
      setIsLoading(false);
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

  // Search functionality
  const handleSearchInputChange = (field: keyof VehicleSearchForm, value: string) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
    if (searchError) setSearchError(null);
    if (searchSuccess) setSearchSuccess(null);
  };

  const validateSearchForm = (): boolean => {
    if (!searchForm.regNumber.trim()) {
      setSearchError('Vehicle registration number is required');
      return false;
    }
    if (!searchForm.mobileNumber.trim()) {
      setSearchError('Mobile number is required');
      return false;
    }
    return true;
  };

  const handleSearch = async () => {
    if (!validateSearchForm()) return;

    try {
      setIsSearching(true);
      setSearchError(null);
      setSearchSuccess(null);

      console.log('🔍 Searching for challans:', searchForm);

      // Call backend API to trigger the pipeline
      const response = await fetch(`https://test.fitstok.com/api/challan/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search challans');
      }

      const result = await response.json();
      console.log('✅ Search successful:', result);
      
      setSearchSuccess(`Successfully initiated challan search for ${searchForm.regNumber}. The pipeline is now running in the background.`);
      
      // Reset form
      setSearchForm({
        regNumber: '',
        engineNumber: '',
        chassisNumber: '',
        mobileNumber: ''
      });
      
      // Hide search form after success
      setTimeout(() => {
        setShowSearchForm(false);
        setSearchSuccess(null);
      }, 3000);
      
      // Refresh the database to show new results
      setTimeout(() => {
        loadBikeChallans();
      }, 5000);

    } catch (err) {
      console.error('❌ Search error:', err);
      setSearchError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefetchChallan = async (bikeChallan: BikeChallanRecord) => {
    try {
      console.log('🔄 Refetching challan for vehicle:', bikeChallan.reg_no);
      
      // Set refetching state for this specific vehicle
      setIsRefetching(prev => ({ ...prev, [bikeChallan.id]: true }));
      
      // Call backend API to trigger the pipeline again
      const response = await fetch(`https://test.fitstok.com/api/challan/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regNumber: bikeChallan.reg_no,
          engineNumber: bikeChallan.engine_no || '',
          chassisNumber: bikeChallan.chassis_no || '',
          mobileNumber: '8287041552' // Default mobile number for refetch
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refetch challan');
      }

      const result = await response.json();
      console.log('✅ Refetch successful:', result);
      
      // Show success message
      setSearchSuccess(`Successfully initiated challan refetch for ${bikeChallan.reg_no}. The pipeline is now running in the background.`);
      
      // Refresh the database to show updated results
      setTimeout(() => {
        loadBikeChallans();
      }, 5000);

    } catch (err) {
      console.error('❌ Refetch error:', err);
      setSearchError(err instanceof Error ? err.message : 'An error occurred during refetch');
    } finally {
      // Clear refetching state for this vehicle
      setIsRefetching(prev => ({ ...prev, [bikeChallan.id]: false }));
    }
  };

  const handleSourceChange = (source: string) => {
    setActiveSource(source);
  };

  const getSourceDisplayName = (source: string): string => {
    switch (source) {
      case 'vcourt_notice': return 'VCourt Notice';
      case 'vcourt_traffic': return 'VCourt Traffic';
      case 'traffic_notice': return 'Delhi Police';
      case 'acko': return 'ACKO/CarInfo';
      default: return source.replace('_', ' ').toUpperCase();
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return <FileText size={16} className="text-green-600" />;
      case 'pending':
      case 'processing':
        return <RefreshCw size={16} className="text-yellow-600" />;
      case 'failed':
      case 'error':
        return <FileText size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  // Bulk upload functions
  const downloadCSVTemplate = () => {
    const csvContent = `regNo,engineNo,chassisNo,stakeholderMobile
DL1SAD6045,,,9315970244
DL3CBZ4267,123456789,ABCD123456,8287041552
HR12AB1234,987654321,XYZ789012,9876543210`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('🚀 Starting bulk upload process...');
    try {
        setBulkUploadProgress(1); // Show processing state
        setBulkUploadResults(null);
        
        // Parse CSV file
        console.log('📖 Reading CSV file...');
        const text = await file.text();
        console.log('📄 CSV content:', text.substring(0, 200) + '...');
        
        const lines = text.split('\n');
        console.log('📊 CSV lines:', lines.length);
        
        const headers = lines[0].split(',');
        console.log('🏷️ Headers found:', headers);
      
        // Validate headers
        const requiredHeaders = ['regNo', 'engineNo', 'chassisNo', 'stakeholderMobile'];
        const hasValidHeaders = requiredHeaders.every(header => 
          headers.includes(header.trim())
        );
        
        console.log('✅ Headers validation:', hasValidHeaders);
        
        if (!hasValidHeaders) {
          throw new Error('Invalid CSV format. Please use the provided template. Required columns: ' + requiredHeaders.join(', '));
        }
      
        // Parse vehicle data
        const vehicles = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',');
          return {
            regNo: values[0]?.trim() || '',
            engineNo: values[1]?.trim() || '',
            chassisNo: values[2]?.trim() || '',
            stakeholderMobile: values[3]?.trim() || '8287041552'
          };
        }).filter(vehicle => vehicle.regNo); // Filter out empty rows
        
        console.log('🚗 Parsed vehicles:', vehicles);
        
        if (vehicles.length === 0) {
          throw new Error('No valid vehicle data found in CSV.');
        }
      
      console.log('📁 Processing bulk upload for', vehicles.length, 'vehicles');
      
      // Process vehicles sequentially through the complete pipeline
      console.log('📁 Processing', vehicles.length, 'vehicles through complete pipeline');
      
      let successCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        
        try {
          // Update progress
          const progress = ((i + 1) / vehicles.length) * 100;
          setBulkUploadProgress(progress);
          
          console.log(`🔄 Processing vehicle ${i + 1}/${vehicles.length}: ${vehicle.regNo}`);
          
          // Use the individual search endpoint that goes through the complete pipeline
          const response = await fetch('https://test.fitstok.com/api/challan/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              regNumber: vehicle.regNo,
              engineNumber: vehicle.engineNo,
              chassisNumber: vehicle.chassisNo,
              mobileNumber: vehicle.stakeholderMobile
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Vehicle ${vehicle.regNo} processed successfully:`, result);
            successCount++;
          } else {
            const errorData = await response.text();
            console.error(`❌ Vehicle ${vehicle.regNo} failed:`, errorData);
            failedCount++;
          }
          
          // Add delay between requests to be respectful to target websites
          if (i < vehicles.length - 1) {
            console.log(`⏳ Waiting 2 seconds before next vehicle...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
          
        } catch (error) {
          console.error(`❌ Error processing vehicle ${vehicle.regNo}:`, error);
          failedCount++;
        }
      }
      
      // Set final results
      setBulkUploadResults({
        total: vehicles.length,
        success: successCount,
        failed: failedCount
      });
      
      // Show success message
      if (successCount > 0) {
        setSearchSuccess(`Successfully processed ${successCount} out of ${vehicles.length} vehicles through the complete pipeline. ${failedCount} vehicles failed.`);
      } else {
        setSearchError(`All ${vehicles.length} vehicles failed to process.`);
      }
      
      // Refresh data after bulk upload
      setTimeout(() => {
        loadBikeChallans();
      }, 5000);
      
      console.log('✅ Bulk upload completed for', vehicles.length, 'vehicles');
      
    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      setSearchError(error instanceof Error ? error.message : 'Bulk upload failed');
    } finally {
      setBulkUploadProgress(0);
    }
  };

  // Function to check if challan is DL or non-DL
  const isDLChallan = (challan: any): boolean => {
    try {
      // Check challan number from various possible fields
      const challanNo = challan.challanNo || challan.noticeNo || challan.challanNumber || 
                        challan.noticeNumber || challan.caseNumber || challan.firNumber || '';
      
      if (!challanNo) return false;
      
      const challanNoStr = challanNo.toString().toUpperCase();
      
      // DL challans start with DL or any number
      // Non-DL challans start with HR, UP, RJ, etc. (letters)
      return challanNoStr.startsWith('DL') || /^\d/.test(challanNoStr);
    } catch (error) {
      console.error('Error checking DL status:', error);
      return false;
    }
  };

  // Function to get challan amount - NOW IDENTICAL TO BACKEND LOGIC
  const getChallanAmount = (challan: any): number => {
    try {
      const { source, amount, detailedInfo } = challan;
      
      // Method 1: Direct amount field (for fallback, mparivahan, acko)
      if (amount && typeof amount === 'number') {
        return amount;
      }
      
      // Method 2: Acko/CarInfo specific extraction (check all possible amount fields)
      if (source === 'acko') {
        const ackoAmountFields = [
          'fineAmount',
          'penaltyAmount', 
          'totalAmount',
          'amount',
          'fine',
          'penalty',
          'challanAmount'
        ];
        
        for (const field of ackoAmountFields) {
          if (challan[field] && typeof challan[field] === 'number') {
            return challan[field];
          }
        }
        
        // Also check if amount is stored as string
        for (const field of ackoAmountFields) {
          if (challan[field] && typeof challan[field] === 'string') {
            const extractedAmount = parseFloat(challan[field].replace(/[^\d.]/g, ''));
            if (!isNaN(extractedAmount) && extractedAmount > 0) {
              return extractedAmount;
            }
          }
        }
      }
      
      // Method 3: VCourt specific extraction
      if (source === 'vcourt_notice' || source === 'vcourt_traffic') {
        // Method 3a: Check detailedInfo.caseDetails for "Proposed Fine"
        if (detailedInfo && detailedInfo.caseDetails) {
          const proposedFine = detailedInfo.caseDetails["Proposed Fine"];
          if (proposedFine) {
            const extractedAmount = parseFloat(proposedFine);
            if (!isNaN(extractedAmount)) {
              return extractedAmount;
            }
          }
          
          // Method 3b: Check for other amount fields in caseDetails
          const amountFields = ['Fine', 'Amount', 'Total Amount', 'Challan Amount', 'Penalty'];
          for (const field of amountFields) {
            const value = detailedInfo.caseDetails[field];
            if (value) {
              const extractedAmount = parseFloat(value.toString().replace(/[^\d.]/g, ''));
              if (!isNaN(extractedAmount) && extractedAmount > 0 && extractedAmount < 100000) {
                return extractedAmount;
              }
            }
          }
          
          // Method 3c: Scan all caseDetails for amount-like values
          for (const [key, value] of Object.entries(detailedInfo.caseDetails)) {
            if (typeof value === 'string' && value.includes('₹')) {
              const extractedAmount = parseFloat(value.replace(/[^\d.]/g, ''));
              if (!isNaN(extractedAmount) && extractedAmount > 0 && extractedAmount < 100000) {
                return extractedAmount;
              }
            }
          }
        }
        
        // Method 3d: Check direct challan fields for VCourt
        const vcourtAmountFields = ['amount', 'fine', 'penalty', 'challanAmount', 'totalAmount', 'proposedFine'];
        for (const field of vcourtAmountFields) {
          if (challan[field]) {
            const value = challan[field];
            if (typeof value === 'number') {
              return value;
            } else if (typeof value === 'string') {
              const extractedAmount = parseFloat(value.replace(/[^\d.]/g, ''));
              if (!isNaN(extractedAmount) && extractedAmount > 0) {
                return extractedAmount;
              }
            }
          }
        }
        
        // Method 3e: Check challan object structure for nested amount data
        if (challan.challanData) {
          const challanData = challan.challanData;
          if (challanData.amount || challanData.fine || challanData.penalty) {
            const amount = challanData.amount || challanData.fine || challanData.penalty;
            const extractedAmount = parseFloat(amount.toString().replace(/[^\d.]/g, ''));
            if (!isNaN(extractedAmount) && extractedAmount > 0) {
              return extractedAmount;
            }
          }
        }
      }
      
      // Method 4: Delhi Police Traffic specific extraction - IDENTICAL TO BACKEND
      if (source === 'traffic_notice') {
        // Method 4a: Check penaltyAmount field FIRST (primary field for Delhi Police)
        if (challan.penaltyAmount) {
          const value = challan.penaltyAmount;
          if (typeof value === 'number') {
            return value;
          } else if (typeof value === 'string') {
            const extractedAmount = parseFloat(value.replace(/[^\d.]/g, ''));
            if (!isNaN(extractedAmount) && extractedAmount > 0) {
              return extractedAmount;
            }
          }
        }
        
        // Method 4b: Check other possible amount fields for Delhi Police
        const delhiAmountFields = ['amount', 'fine', 'penalty', 'challanAmount', 'totalAmount', 'fineAmount'];
        for (const field of delhiAmountFields) {
          if (challan[field]) {
            const value = challan[field];
            if (typeof value === 'number') {
              return value;
            } else if (typeof value === 'string') {
              const extractedAmount = parseFloat(value.replace(/[^\d.]/g, ''));
              if (!isNaN(extractedAmount) && extractedAmount > 0) {
                return extractedAmount;
              }
            }
          }
        }
      }
      
      // Method 5: Check for amount in various possible fields (generic fallback)
      const possibleAmountFields = [
        'fine',
        'penalty',
        'challanAmount',
        'totalAmount',
        'proposedFine',
        'caseAmount'
      ];
      
      for (const field of possibleAmountFields) {
        if (challan[field] && typeof challan[field] === 'number') {
          return challan[field];
        }
      }
      
      // Method 6: Check detailedInfo for any amount-like fields
      if (detailedInfo && detailedInfo.caseDetails) {
        for (const [key, value] of Object.entries(detailedInfo.caseDetails)) {
          if (typeof value === 'string' && value.includes('.') && !isNaN(parseFloat(value))) {
            const extractedAmount = parseFloat(value);
            if (extractedAmount > 0 && extractedAmount < 100000) { // Reasonable amount range
              return extractedAmount;
            }
          }
        }
      }
      
      // No amount found
      return 0;
      
    } catch (error) {
      console.error('Error getting challan amount:', error);
      return 0;
    }
  };

  // Function to get challan settlement amount
  const getChallanSettlementAmount = (challan: any): number => {
    try {
      // First try to get settlement amount from challan data
      let settlementAmount: string | number = challan.settlementAmount || challan.settledAmount || 
                                            challan.finalAmount || challan.paidAmount || 0;
      
      if (settlementAmount) {
        // Convert to number if it's a string
        if (typeof settlementAmount === 'string') {
          const numericAmount = parseFloat(settlementAmount.replace(/[^\d.]/g, ''));
          settlementAmount = isNaN(numericAmount) ? 0 : numericAmount;
        }
        return settlementAmount as number;
      }
      
      // If no settlement amount, fallback to original challan amount
      // This ensures we always have a value for calculation
      return getChallanAmount(challan);
      
    } catch (error) {
      console.error('Error getting challan settlement amount:', error);
      // Fallback to original amount if settlement amount fails
      return getChallanAmount(challan);
    }
  };

  // Function to check if challan is active (not completed, disposed, or paid)
  const isActiveChallan = (challan: any): boolean => {
    try {
      const status = challan.status || challan.challanStatus || challan.paymentStatus || '';
      const statusLower = status.toString().toLowerCase();
      
      // Check if challan is not completed, disposed, or paid
      return !statusLower.includes('completed') && 
             !statusLower.includes('disposed') && 
             !statusLower.includes('paid') &&
             !statusLower.includes('settled') &&
             !statusLower.includes('closed');
    } catch (error) {
      console.error('Error checking challan status:', error);
      return true; // Default to active if status can't be determined
    }
  };

  // Function to calculate hold amount based on business rules
  const calculateHoldAmount = (bikeChallan: BikeChallanRecord): { 
    holdAmount: number; 
    breakdown: string; 
    ruleApplied: string; 
    baseAmount: number; 
    extraCharge: number; 
    originalAmount: number; 
  } => {
    try {
      if (!bikeChallan.unique_challans_json || bikeChallan.unique_challans_json.length === 0) {
        return { 
          holdAmount: 0, 
          breakdown: 'No challans found',
          ruleApplied: 'No challans',
          baseAmount: 0,
          extraCharge: 0,
          originalAmount: 0
        };
      }

      // Filter only active challans (not completed, disposed, or paid)
      const activeChallans = bikeChallan.unique_challans_json.filter(isActiveChallan);
      
      if (activeChallans.length === 0) {
        return { 
          holdAmount: 0, 
          breakdown: 'All challans are completed/paid',
          ruleApplied: 'All completed',
          baseAmount: 0,
          extraCharge: 0,
          originalAmount: 0
        };
      }

      // Calculate total ORIGINAL amounts from all active challans (for rule determination)
      const totalOriginalAmount = activeChallans.reduce((sum, challan) => sum + getChallanAmount(challan), 0);
      
      // Use settlement amount directly from database instead of calculating
      const totalSettlementAmount = bikeChallan.settlement_summary_json?.totalSettlementAmount || 0;

      // Determine which SINGLE case applies to the unique JSON block
      let extraCharge = 0;
      let ruleApplied = '';
      let breakdown = '';

      // Check if any challan exceeds ₹2000 (Case 4 - highest priority)
      const hasChallanOver2000 = activeChallans.some(challan => getChallanAmount(challan) > 2000);
      
      if (hasChallanOver2000) {
        extraCharge = 1500;
        ruleApplied = 'Case 4: Any Challan Above ₹2000';
        breakdown = `Challan(s) above ₹2000 + ₹1500 service charge`;
      }
      // Case 1: Single DL challan < ₹1000
      else if (activeChallans.length === 1 && isDLChallan(activeChallans[0]) && totalOriginalAmount < 1000) {
        extraCharge = 200;
        ruleApplied = 'Case 1: Single DL Challan Under ₹1000';
        breakdown = `Single DL challan (₹${totalOriginalAmount}) + ₹200 service charge`;
      }
      // Case 2: Multiple DL challans (sum > ₹1000 OR any single > ₹1000)
      else if (activeChallans.length > 1 && 
               activeChallans.every(challan => isDLChallan(challan)) && 
               (totalOriginalAmount > 1000 || activeChallans.some(challan => getChallanAmount(challan) > 1000))) {
        extraCharge = 500;
        ruleApplied = 'Case 2: Multiple DL Challans (Sum > ₹1000 OR Any > ₹1000)';
        breakdown = `Multiple DL challans (₹${totalOriginalAmount}) + ₹500 service charge`;
      }
      // Case 3: Mixed DL + Non-DL challans (amount ≤ ₹2000)
      else if (activeChallans.some(challan => isDLChallan(challan)) && 
               activeChallans.some(challan => !isDLChallan(challan))) {
        extraCharge = 1000;
        ruleApplied = 'Case 3: Mixed DL + Non-DL Challans (≤ ₹2000)';
        breakdown = `Mixed challans (₹${totalOriginalAmount}) + ₹1000 service charge`;
      }
      // Case 5: Single non-DL challan (any amount)
      else if (activeChallans.length === 1 && !isDLChallan(activeChallans[0])) {
        extraCharge = 1000;
        ruleApplied = 'Case 5: Single Non-DL Challan (Any Amount)';
        breakdown = `Single non-DL challan (₹${totalOriginalAmount}) + ₹1000 service charge`;
      }
      // Default: No extra charge
      else {
        extraCharge = 0;
        ruleApplied = 'No Case: No Extra Charge';
        breakdown = `Total original (₹${totalOriginalAmount}) - no service charge applicable`;
      }

      // Final hold amount = Database settlement amount + Extra charge (calculated from original amounts)
      const holdAmount = totalSettlementAmount + extraCharge;

      return {
        holdAmount,
        breakdown: `${breakdown} = Hold Amount ₹${holdAmount}`,
        ruleApplied,
        baseAmount: totalSettlementAmount,
        extraCharge,
        originalAmount: totalOriginalAmount
      };
    } catch (error) {
      console.error('Error calculating hold amount:', error);
      return { 
        holdAmount: 0, 
        breakdown: 'Error calculating hold amount',
        ruleApplied: 'Error',
        baseAmount: 0,
        extraCharge: 0,
        originalAmount: 0
      };
    }
  };

  const filteredBikeChallans = bikeChallans.filter(bikeChallan => {
    const matchesSearch = bikeChallan.reg_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      bikeChallan.settlement_calculation_status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Sort the filtered challans
  const sortedBikeChallans = [...filteredBikeChallans].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'reg_no':
        aValue = a.reg_no;
        bValue = b.reg_no;
        break;
      case 'challan_count':
        aValue = a.unique_challans_json?.length || 0;
        bValue = b.unique_challans_json?.length || 0;
        break;
      case 'original_amount':
        aValue = a.settlement_summary_json?.totalOriginalAmount || 0;
        bValue = b.settlement_summary_json?.totalOriginalAmount || 0;
        break;
      case 'settlement_amount':
        aValue = a.settlement_summary_json?.totalSettlementAmount || 0;
        bValue = b.settlement_summary_json?.totalSettlementAmount || 0;
        break;
      case 'savings':
        aValue = a.settlement_summary_json?.totalSavings || 0;
        bValue = b.settlement_summary_json?.totalSavings || 0;
        break;
      case 'hold_amount':
        aValue = calculateHoldAmount(a).holdAmount;
        bValue = calculateHoldAmount(b).holdAmount;
        break;
      case 'status':
        aValue = a.settlement_calculation_status || '';
        bValue = b.settlement_calculation_status || '';
        break;
                    case 'fir_status':
                      aValue = a.fir_status || '';
                      bValue = b.fir_status || '';
                      break;
                    case 'vehicle_status':
                      aValue = a.fir_status || '';
                      bValue = b.fir_status || '';
                      break;
      case 'updated_at':
      default:
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
        break;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                                  <h1 className="text-3xl font-bold text-gray-900">Bike Challan Database Dashboard</h1>
                                  <p className="text-gray-600 mt-1">View all bike challans saved in the database with comprehensive analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              >
                <Upload size={16} className="mr-2" />
                Bulk Upload
              </button>
              <button
                onClick={() => setShowSearchForm(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Search New Challans
              </button>
              <button
                onClick={loadBikeChallans}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search Form Modal */}
        {showSearchForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="text-green-600" size={24} />
                  Search New Challans
                </h2>
                <button
                  onClick={() => setShowSearchForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="p-6 space-y-4">
                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Registration Number *
                  </label>
                  <input
                    type="text"
                    value={searchForm.regNumber}
                    onChange={(e) => handleSearchInputChange('regNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., DL3CBZ4267"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={searchForm.mobileNumber}
                    onChange={(e) => handleSearchInputChange('mobileNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 8287041552"
                    required
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
                    onChange={(e) => handleSearchInputChange('engineNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 123456789"
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
                    onChange={(e) => handleSearchInputChange('chassisNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., ABCDEF123456789"
                  />
                </div>

                {/* Error and Success Messages */}
                {searchError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center">
                      <AlertCircle size={16} className="text-red-400 mr-2" />
                      <p className="text-sm text-red-600">{searchError}</p>
                    </div>
                  </div>
                )}

                {searchSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center">
                      <CheckCircle size={16} className="text-green-400 mr-2" />
                      <p className="text-sm text-green-600">{searchSuccess}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowSearchForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={16} className="mr-2" />
                        Search Challans
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="text-purple-600" size={24} />
                  Bulk Upload Vehicles
                </h2>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* CSV Template Download */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Template</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Download the CSV template with the correct column structure for bulk upload.
                  </p>
                  <button
                    onClick={downloadCSVTemplate}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Download size={16} className="mr-2" />
                    Download Template
                  </button>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-purple-600 hover:text-purple-500">
                          Click to upload
                        </span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">CSV files only</p>
                    </label>
                  </div>
                </div>

                {/* Upload Progress */}
                {bulkUploadProgress > 0 && bulkUploadProgress < 100 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Processing vehicles through complete pipeline...</span>
                      <span className="text-sm text-gray-500">{bulkUploadProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${bulkUploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Upload Complete */}
                {bulkUploadProgress === 100 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-green-700">
                        Bulk upload completed! Processing results...
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload Results */}
                {bulkUploadResults && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Results</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Total vehicles: {bulkUploadResults.total}</p>
                      <p className="text-green-600">Success: {bulkUploadResults.success}</p>
                      <p className="text-red-600">Failed: {bulkUploadResults.failed}</p>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Instructions</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p><strong>Required columns:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><code>regNo</code> - Vehicle registration number (e.g., DL1SAD6045)</li>
                      <li><code>engineNo</code> - Engine number (optional, can be empty)</li>
                      <li><code>chassisNo</code> - Chassis number (optional, can be empty)</li>
                      <li><code>stakeholderMobile</code> - Mobile number (e.g., 9315970244)</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-500">
                      The system will process each vehicle sequentially to avoid overwhelming the target websites.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Challans Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Bike Challan Records</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All bikes with their challan data and settlement status
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="updated_at">Last Updated</option>
                    <option value="reg_no">Bike Number</option>
                    <option value="challan_count">Challan Count</option>
                    <option value="original_amount">Original Amount</option>
                    <option value="settlement_amount">Settlement Amount</option>
                    <option value="savings">Savings</option>
                    <option value="hold_amount">Hold Amount</option>
                    <option value="status">Status</option>
                    <option value="fir_status">FIR Status</option>
                    <option value="vehicle_status">Vehicle Status</option>
                    <option value="challan_date">Challan Date</option>
                  </select>
                </div>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'reg_no') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('reg_no');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Bike</span>
                      {sortField === 'reg_no' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engine No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chassis No
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'challan_count') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('challan_count');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Challans</span>
                      {sortField === 'challan_count' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'original_amount') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('original_amount');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Original Amount</span>
                      {sortField === 'original_amount' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'settlement_amount') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('settlement_amount');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Settlement Amount</span>
                      {sortField === 'settlement_amount' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'savings') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('savings');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Savings</span>
                      {sortField === 'savings' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'status') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('status');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'fir_status') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('fir_status');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>FIR Status</span>
                      {sortField === 'fir_status' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'vehicle_status') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('vehicle_status');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vehicle Status</span>
                      {sortField === 'vehicle_status' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Challan Date
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === 'updated_at') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('updated_at');
                        setSortDirection('desc');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Updated</span>
                      {sortField === 'updated_at' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VCourt Notice Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VCourt Traffic Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delhi Police Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACKO Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hold Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refetch
                  </th>
                </tr>
              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                  {sortedBikeChallans.map((bikeChallan) => (
                                      <tr key={bikeChallan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Car className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {bikeChallan.reg_no}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bikeChallan.engine_no || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bikeChallan.chassis_no || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bikeChallan.unique_challans_json?.length || 0}
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                                                {(() => {
                          console.log(`🔍 Rendering Original Amount for ${bikeChallan.reg_no}:`, {
                            hasSettlementSummary: !!bikeChallan.settlement_summary_json,
                            totalOriginalAmount: bikeChallan.settlement_summary_json?.totalOriginalAmount,
                            settlementSummaryKeys: bikeChallan.settlement_summary_json ? Object.keys(bikeChallan.settlement_summary_json) : []
                          });
                          
                          if (bikeChallan.settlement_summary_json?.totalOriginalAmount) {
                            return formatAmount(bikeChallan.settlement_summary_json.totalOriginalAmount);
                          }
                          // Fallback: calculate from unique_challans_json with multiple field names
                          const total = bikeChallan.unique_challans_json?.reduce((sum, c) => {
                            let amount: string | number = 0;
                            
                            if (c.source === 'vcourt_notice' || c.source === 'vcourt_traffic') {
                              // VCourt challans have complex structure
                              if (c.detailedInfo?.caseDetails) {
                                const caseDetails = c.detailedInfo.caseDetails;
                                amount = caseDetails['Proposed Fine'] || caseDetails['Fine Amount'] || caseDetails['Penalty Amount'] || 
                                         caseDetails['Total Amount'] || caseDetails['Amount'] || caseDetails['Challan Amount'] || 0;
                              }
                              
                              // Fallback to direct fields if detailedInfo is not available
                              if (!amount && c.detailedInfo) {
                                amount = c.detailedInfo.fineAmount || c.detailedInfo.penaltyAmount || 
                                         c.detailedInfo.totalAmount || c.detailedInfo.amount || 0;
                              }
                            } else {
                              // Other sources (mparivahan, delhi_police, carinfo)
                              amount = c.amount || c.fineAmount || c.penaltyAmount || c.totalAmount || 0;
                            }
                            
                            // Convert amount to number if it's a string
                            if (typeof amount === 'string') {
                              const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
                              amount = isNaN(numericAmount) ? 0 : numericAmount;
                            }
                            
                            return sum + (amount as number);
                          }, 0) || 0;
                          return formatAmount(total);
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          if (bikeChallan.settlement_summary_json?.totalSettlementAmount) {
                            return formatAmount(bikeChallan.settlement_summary_json.totalSettlementAmount);
                          }
                          // Fallback: same as original if no settlement data
                          const total = bikeChallan.unique_challans_json?.reduce((sum, c) => {
                            let amount: string | number = 0;
                            
                            if (c.source === 'vcourt_notice' || c.source === 'vcourt_traffic') {
                              // VCourt challans have complex structure
                              if (c.detailedInfo?.caseDetails) {
                                const caseDetails = c.detailedInfo.caseDetails;
                                amount = caseDetails['Proposed Fine'] || caseDetails['Fine Amount'] || caseDetails['Penalty Amount'] || 
                                         caseDetails['Total Amount'] || caseDetails['Amount'] || caseDetails['Challan Amount'] || 0;
                          }
                              
                              // Fallback to direct fields if detailedInfo is not available
                              if (!amount && c.detailedInfo) {
                                amount = c.detailedInfo.fineAmount || c.detailedInfo.penaltyAmount || 
                                         c.detailedInfo.totalAmount || c.detailedInfo.amount || 0;
                              }
                            } else {
                              // Other sources (mparivahan, delhi_police, carinfo)
                              amount = c.amount || c.fineAmount || c.penaltyAmount || c.totalAmount || 0;
                            }
                            
                            // Convert amount to number if it's a string
                            if (typeof amount === 'string') {
                              const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
                              amount = isNaN(numericAmount) ? 0 : numericAmount;
                            }
                            
                            return sum + (amount as number);
                          }, 0) || 0;
                          return formatAmount(total);
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-medium">
                        {(() => {
                          if (bikeChallan.settlement_summary_json?.totalSavings) {
                            return formatAmount(bikeChallan.settlement_summary_json.totalSavings);
                          }
                          // Fallback: calculate savings
                          const original = bikeChallan.unique_challans_json?.reduce((sum, c) => {
                            let amount: string | number = 0;
                            
                            if (c.source === 'vcourt_notice' || c.source === 'vcourt_traffic') {
                              // VCourt challans have complex structure
                              if (c.detailedInfo?.caseDetails) {
                                const caseDetails = c.detailedInfo.caseDetails;
                                amount = caseDetails['Proposed Fine'] || caseDetails['Fine Amount'] || caseDetails['Penalty Amount'] || 
                                         caseDetails['Total Amount'] || caseDetails['Amount'] || caseDetails['Challan Amount'] || 0;
                              }
                              
                              // Fallback to direct fields if detailedInfo is not available
                              if (!amount && c.detailedInfo) {
                                amount = c.detailedInfo.fineAmount || c.detailedInfo.penaltyAmount || 
                                         c.detailedInfo.totalAmount || c.detailedInfo.amount || 0;
                              }
                            } else {
                              // Other sources (mparivahan, delhi_police, carinfo)
                              amount = c.amount || c.fineAmount || c.penaltyAmount || c.totalAmount || 0;
                            }
                            
                            // Convert amount to number if it's a string
                            if (typeof amount === 'string') {
                              const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
                              amount = isNaN(numericAmount) ? 0 : numericAmount;
                            }
                            
                            return sum + (amount as number);
                          }, 0) || 0;
                          const settlement = bikeChallan.settlement_summary_json?.total_settlement_amount || original;
                          const savings = original - settlement;
                          return formatAmount(savings);
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bikeChallan.settlement_calculation_status)}`}>
                          {getStatusIcon(bikeChallan.settlement_calculation_status)}
                          <span className="ml-1">
                            {bikeChallan.settlement_calculation_status || 'Unknown'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bikeChallan.fir_status === 'stolen' 
                            ? 'text-red-600 bg-red-100' 
                            : bikeChallan.fir_status === 'not_stolen'
                            ? 'text-green-600 bg-green-100'
                            : 'text-gray-600 bg-gray-100'
                        }`}>
                                                  {bikeChallan.fir_status === 'stolen' ? '🚨 Stolen' : 
                         bikeChallan.fir_status === 'not_stolen' ? '✅ Not Stolen' : 
                         bikeChallan.fir_status === 'unknown' ? '❓ Unknown' :
                         '❓ Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bikeChallan.fir_status === 'stolen' 
                            ? 'text-red-800 bg-red-200 border border-red-300' 
                            : bikeChallan.fir_status === 'not_stolen'
                            ? 'text-green-800 bg-green-200 border border-green-300'
                            : 'text-gray-800 bg-gray-200 border border-gray-300'
                        }`}>
                          {bikeChallan.fir_status === 'stolen' ? '🚨 STOLEN VEHICLE' : 
                           bikeChallan.fir_status === 'not_stolen' ? '✅ SAFE VEHICLE' : 
                           bikeChallan.fir_status === 'unknown' ? '❓ STATUS UNKNOWN' :
                           '❓ STATUS UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          // Extract the earliest challan date from all sources
                          const challanDates = bikeChallan.unique_challans_json?.map((challan: any) => {
                            let date: string = 'Unknown';
                            
                            if (challan.source === 'vcourt_notice' || challan.source === 'vcourt_traffic') {
                              // VCourt challans have complex structure
                              if (challan.detailedInfo?.caseDetails) {
                                const caseDetails = challan.detailedInfo.caseDetails;
                                date = caseDetails['Challan Date.'] || caseDetails['Challan Date'] || caseDetails['Notice Date'] ||
                                       caseDetails['Issue Date'] || caseDetails['Registration Date'] || caseDetails['Date'] || 'Unknown';
                              }
                              
                              // Fallback to direct fields if detailedInfo is not available
                              if (!date && challan.detailedInfo) {
                                date = challan.detailedInfo.challanDate || challan.detailedInfo.noticeDate ||
                                       challan.detailedInfo.issueDate || challan.detailedInfo.date || 'Unknown';
                              }
                            } else {
                              // Other sources (mparivahan, delhi_police, carinfo, acko)
                              date = challan.dateTime || challan.date || challan.challanDate || challan.noticeDate || challan.issueDate || challan.createdDate || 'Unknown';
                            }
                            
                            return date;
                          }) || [];
                          
                          // Find the earliest valid date
                          const validDates = challanDates.filter(date => date !== 'Unknown' && date !== '');
                          if (validDates.length === 0) return 'No Date';
                          
                          // Try to parse and find the earliest date
                          const parsedDates = validDates.map(dateStr => {
                            try {
                              return new Date(dateStr);
                            } catch {
                              return null;
                            }
                          }).filter(date => date && !isNaN(date.getTime()));
                          
                          if (parsedDates.length === 0) return validDates[0] || 'Invalid Date';
                          
                          const earliestDate = new Date(Math.min(...parsedDates.map(d => d!.getTime())));
                          return earliestDate.toLocaleDateString('en-IN');
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(bikeChallan.updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const vcourtNoticeChallans = bikeChallan.unique_challans_json?.filter((c: any) => c.source === 'vcourt_notice') || [];
                          if (vcourtNoticeChallans.length === 0) {
                            return <span className="text-gray-500">Record not found</span>;
                          }
                          if (vcourtNoticeChallans.some((c: any) => c.error || c.status === 'error')) {
                            return <span className="text-red-600">Error fetching</span>;
                          }
                          return <span className="text-green-600">✓ {vcourtNoticeChallans.length} challan(s)</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const vcourtTrafficChallans = bikeChallan.unique_challans_json?.filter((c: any) => c.source === 'vcourt_traffic') || [];
                          if (vcourtTrafficChallans.length === 0) {
                            return <span className="text-gray-500">Record not found</span>;
                          }
                          if (vcourtTrafficChallans.some((c: any) => c.error || c.status === 'error')) {
                            return <span className="text-red-600">Error fetching</span>;
                          }
                          return <span className="text-green-600">✓ {vcourtTrafficChallans.length} challan(s)</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const delhiPoliceChallans = bikeChallan.unique_challans_json?.filter((c: any) => c.source === 'traffic_notice') || [];
                          if (delhiPoliceChallans.length === 0) {
                            return <span className="text-gray-500">Record not found</span>;
                          }
                          if (delhiPoliceChallans.some((c: any) => c.error || c.status === 'error')) {
                            return <span className="text-red-600">Error fetching</span>;
                          }
                          return <span className="text-green-600">✓ {delhiPoliceChallans.length} challan(s)</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const ackoChallans = bikeChallan.unique_challans_json?.filter((c: any) => c.source === 'acko') || [];
                          if (ackoChallans.length === 0) {
                            return <span className="text-gray-500">Record not found</span>;
                          }
                          if (ackoChallans.some((c: any) => c.error || c.status === 'error')) {
                            return <span className="text-red-600">Error fetching</span>;
                          }
                          return <span className="text-green-600">✓ {ackoChallans.length} challan(s)</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {(() => {
                            const { holdAmount, breakdown } = calculateHoldAmount(bikeChallan);
                            return (
                              <div className="space-y-1">
                                <div className="font-semibold text-purple-600">
                                  ₹{holdAmount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 max-w-xs truncate" title={breakdown}>
                                  {breakdown}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedBikeChallan(bikeChallan);
                            setShowDetails(true);
                            setActiveSource('vcourt_notice'); // Reset to first tab
                          }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View detailed challan information"
                      >
                        <Eye size={16} />
                      </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRefetchChallan(bikeChallan)}
                          disabled={isRefetching[bikeChallan.id]}
                          className={`flex items-center px-3 py-1 text-xs font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isRefetching[bikeChallan.id] 
                              ? 'bg-yellow-600 hover:bg-yellow-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          title="Refetch challan data from all sources"
                        >
                          {isRefetching[bikeChallan.id] ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <RefreshCw size={14} className="mr-1" />
                          )}
                          {isRefetching[bikeChallan.id] ? 'Refetching...' : 'Refetch'}
                        </button>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Info - Remove this after fixing the issue */}
        {bikeChallans.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Total records: {bikeChallans.length}</p>
                  <p>Records with settlement data: {bikeChallans.filter(c => c.settlement_summary_json).length}</p>
                  <p>Records with unique challans: {bikeChallans.filter(c => c.unique_challans_json?.length > 0).length}</p>
                  <p>Sample settlement data: {JSON.stringify(bikeChallans[0]?.settlement_summary_json || 'No data', null, 2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {sortedBikeChallans.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bike challan records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No bike challans have been processed yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {showDetails && selectedBikeChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Bike Challan Details - {selectedBikeChallan.reg_no}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Total Challans</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedBikeChallan.unique_challans_json?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Original Amount</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatAmount(selectedBikeChallan.settlement_summary_json?.totalOriginalAmount || 0)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-600">Settlement Amount</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatAmount(selectedBikeChallan.settlement_summary_json?.totalSettlementAmount || 0)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-orange-600">Settlement Percentage</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {selectedBikeChallan.settlement_summary_json?.averageSettlementPercentage || 'N/A'}%
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Total Savings</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatAmount(selectedBikeChallan.settlement_summary_json?.totalSavings || 0)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">FIR Status</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedBikeChallan.fir_status === 'stolen' ? '🚨 Stolen' : 
                     selectedBikeChallan.fir_status === 'not_stolen' ? '✅ Not Stolen' : 
                     selectedBikeChallan.fir_status === 'unknown' ? '❓ Unknown' :
                     '❓ Unknown'}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-purple-600">Hold Amount</p>
                    <button
                      onClick={() => setShowHoldAmountInfo(true)}
                      className="text-purple-500 hover:text-purple-700 transition-colors"
                      title="How is hold amount calculated?"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    ₹{(() => {
                      const { holdAmount } = calculateHoldAmount(selectedBikeChallan);
                      return holdAmount.toLocaleString();
                    })()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {(() => {
                      const { breakdown } = calculateHoldAmount(selectedBikeChallan);
                      return breakdown;
                    })()}
                  </p>
                </div>

              </div>

              {/* Source-Segregated Challans */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Challans by Source</h4>
                
                {/* Source Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {['vcourt_notice', 'vcourt_traffic', 'traffic_notice', 'acko'].map((source) => {
                    const challanCount = selectedBikeChallan.unique_challans_json?.filter(c => c.source === source).length || 0;
                    const totalAmount = selectedBikeChallan.unique_challans_json
                      ?.filter(c => c.source === source)
                      ?.reduce((sum: number, c: any) => {
                        let amount: string | number = 0;
                        if (c.source === 'vcourt_notice' || c.source === 'vcourt_traffic') {
                          if (c.detailedInfo?.caseDetails) {
                            amount = c.detailedInfo.caseDetails['Proposed Fine'] || 0;
                          }
                        } else {
                          amount = c.amount || c.fineAmount || c.penaltyAmount || c.totalAmount || 0;
                        }
                        if (typeof amount === 'string') {
                          const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
                          amount = isNaN(numericAmount) ? 0 : numericAmount;
                        }
                        return sum + (amount || 0);
                      }, 0) || 0;
                    
                    return (
                      <div key={source} className={`bg-white p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        activeSource === source 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`} onClick={() => handleSourceChange(source)}>
                        <div className="text-center">
                          <div className={`text-2xl font-bold mb-1 ${
                            activeSource === source ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {challanCount}
                          </div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {getSourceDisplayName(source)}
                          </div>
                          <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                            {formatAmount(totalAmount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                                {/* Source Tabs */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Select Source to View Details</h5>
                  <nav className="flex flex-wrap gap-2">
                    {['vcourt_notice', 'vcourt_traffic', 'traffic_notice', 'acko'].map((source) => {
                      const challanCount = selectedBikeChallan.unique_challans_json?.filter(c => c.source === source).length || 0;
                      return (
                        <button
                          key={source}
                          onClick={() => handleSourceChange(source)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            activeSource === source
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          {getSourceDisplayName(source)} ({challanCount})
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Source Content */}
                {['vcourt_notice', 'vcourt_traffic', 'traffic_notice', 'acko'].map((source) => {
                  const sourceChallans = selectedBikeChallan.unique_challans_json?.filter(c => c.source === source) || [];
                  
                                     if (sourceChallans.length === 0) {
                     return (
                       <div key={source} className={`${activeSource === source ? 'block' : 'hidden'}`}>
                         <div className="bg-gray-50 rounded-lg p-4 text-center py-8">
                           <div className="text-gray-500">
                             <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                             <h5 className="text-lg font-medium text-gray-900 mb-2">
                               No {getSourceDisplayName(source)} Challans
                             </h5>
                             <p className="text-sm text-gray-500">
                               This vehicle has no challans from {getSourceDisplayName(source)} source.
                             </p>
                           </div>
                         </div>
                       </div>
                     );
                   }

                  return (
                    <div key={source} className={`${activeSource === source ? 'block' : 'hidden'}`}>
                      <div className="bg-gray-50 rounded-lg p-4">
                                                 <div className="mb-6">
                           <div className="flex items-center justify-between mb-3">
                             <h5 className="text-xl font-bold text-gray-800">
                               {getSourceDisplayName(source)} Challans ({sourceChallans.length})
                             </h5>
                             <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                               source === 'vcourt_notice' ? 'bg-blue-100 text-blue-800' :
                               source === 'vcourt_traffic' ? 'bg-purple-100 text-purple-800' :
                               source === 'traffic_notice' ? 'bg-red-100 text-red-800' :
                               'bg-green-100 text-green-800'
                             }`}>
                               {sourceChallans.length} challan{sourceChallans.length !== 1 ? 's' : ''}
                             </span>
                           </div>
                           <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                             {source === 'vcourt_notice' && 'Court notices and legal challans from VCourt system'}
                             {source === 'vcourt_traffic' && 'Traffic challans from VCourt system'}
                             {source === 'traffic_notice' && 'Traffic challans from Delhi Police'}
                             {source === 'acko' && 'Challans from ACKO/CarInfo API and M Parivahan'}
                           </div>
                         </div>
                        
                        <div className="space-y-4">
                          {sourceChallans.map((challan: any, index: number) => {
                            // Handle different field names for different sources
                            let amount: string | number = 0;
                            let date: string = 'Unknown';
                            let challanId: string = 'No ID';
                            let status: string = 'Unknown';
                            let description: string = 'No description';
                            
                            // Extract amount based on source type
                            if (challan.source === 'vcourt_notice' || challan.source === 'vcourt_traffic') {
                              // VCourt challans have complex structure
                              if (challan.detailedInfo?.caseDetails) {
                                const caseDetails = challan.detailedInfo.caseDetails;
                                amount = caseDetails['Proposed Fine'] || caseDetails['Fine Amount'] || caseDetails['Penalty Amount'] || 
                                         caseDetails['Total Amount'] || caseDetails['Amount'] || caseDetails['Challan Amount'] || 0;
                                
                                date = caseDetails['Challan Date.'] || caseDetails['Challan Date'] || caseDetails['Notice Date'] || 
                                       caseDetails['Issue Date'] || caseDetails['Registration Date'] || caseDetails['Date'] || 'Unknown';
                                
                                status = caseDetails['Status'] || caseDetails['Case Status'] || caseDetails['Challan Status'] || 'Unknown';
                                description = caseDetails['Description'] || caseDetails['Case Description'] || caseDetails['Violation'] || caseDetails['Offence'] || 'No description';
                              }
                              
                              // Fallback to direct fields if detailedInfo is not available
                              if (!amount && challan.detailedInfo) {
                                amount = challan.detailedInfo.fineAmount || challan.detailedInfo.penaltyAmount || 
                                         challan.detailedInfo.totalAmount || challan.detailedInfo.amount || 0;
                              }
                              if (!date && challan.detailedInfo) {
                                date = challan.detailedInfo.challanDate || challan.detailedInfo.noticeDate || 
                                       challan.detailedInfo.issueDate || challan.detailedInfo.date || 'Unknown';
                              }
                            } else {
                              // Other sources (mparivahan, delhi_police, carinfo, acko)
                              amount = challan.amount || challan.fineAmount || challan.penaltyAmount || challan.totalAmount || 0;
                              date = challan.dateTime || challan.date || challan.challanDate || challan.noticeDate || challan.issueDate || challan.createdDate || 'Unknown';
                              status = challan.status || challan.challanStatus || challan.caseStatus || 'Unknown';
                              description = challan.description || challan.violation || challan.offence || challan.reason || 'No description';
                            }
                            
                            // Extract challan ID
                            challanId = challan.challanNumber || challan.challanNo || challan.noticeNo || challan.ticketNo || 
                                       challan.caseNumber || challan.efilno || challan.id || 'No ID';
                            
                            // Convert amount to number if it's a string
                            if (typeof amount === 'string') {
                              const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
                              amount = isNaN(numericAmount) ? 0 : numericAmount;
                            }
                            
                            return (
                              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  {/* Column 1 - Basic Info */}
                                  <div className="space-y-3">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Basic Information</h6>
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700">Challan ID:</span>
                                          <span className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border">
                                            {challanId}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700">Amount:</span>
                                          <span className="text-sm font-bold text-green-700">
                                            {formatAmount(amount)}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700">Date:</span>
                                          <span className="text-sm text-gray-900">
                                            {date}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700">Status:</span>
                                          <span className={`text-xs px-3 py-2 rounded-full font-medium ${
                                            status?.toLowerCase().includes('disposed') || status?.toLowerCase().includes('closed') || status?.toLowerCase().includes('paid')
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {status}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700">Description:</span>
                                          <span className="text-sm text-gray-800 bg-white px-3 py-2 rounded border max-w-[200px] truncate">
                                            {description}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Column 2 - Case Details */}
                                  <div className="space-y-3">
                                    {challan.detailedInfo?.caseDetails ? (
                                      <div className="bg-gray-50 p-4 rounded-lg h-full">
                                        <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Case Details</h6>
                                        <div className="bg-white p-4 rounded border max-h-[400px] overflow-y-auto">
                                          <div className="space-y-3">
                                            {Object.entries(challan.detailedInfo.caseDetails).map(([key, value]: [string, any]) => (
                                              <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0">
                                                <div className="flex items-start">
                                                  <span className="font-medium text-gray-700 min-w-[120px] flex-shrink-0 text-sm">{key}:</span>
                                                  <span className="text-gray-800 text-sm break-words flex-1">{String(value)}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-gray-50 p-4 rounded-lg h-full">
                                        <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Additional Info</h6>
                                        <div className="text-sm text-gray-500 bg-white p-4 rounded border min-h-[200px] flex items-center justify-center">
                                          No additional details available
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Source Badge */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                     source === 'vcourt_notice' ? 'bg-blue-100 text-blue-800' :
                                     source === 'vcourt_traffic' ? 'bg-purple-100 text-purple-800' :
                                     source === 'traffic_notice' ? 'bg-red-100 text-red-800' :
                                     'bg-green-100 text-green-800'
                                   }`}>
                                     {getSourceDisplayName(source)}
                                   </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Settlement Rules Applied */}
              {selectedBikeChallan.settlement_summary_json?.rules_applied && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Settlement Rules Applied</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {Object.entries(selectedBikeChallan.settlement_summary_json.rules_applied).map(([rule, details]: [string, any]) => (
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

      {/* Hold Amount Info Modal */}
      {showHoldAmountInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                How Hold Amount is Calculated
              </h2>
              <button
                onClick={() => setShowHoldAmountInfo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Overview</h3>
                <p className="text-blue-800">
                  Hold amount is calculated by first determining which business rule applies based on <strong>original challan amounts</strong>, 
                  then adding the appropriate service charge to the <strong>settlement amounts</strong>.
                </p>
              </div>

              {/* Actual Calculation Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Hold Amount Calculation</h3>
                {selectedBikeChallan && (() => {
                  const { holdAmount, breakdown, ruleApplied, baseAmount, extraCharge, originalAmount } = calculateHoldAmount(selectedBikeChallan);
                  const activeChallans = selectedBikeChallan.unique_challans_json?.filter((challan: any) => 
                    !['completed', 'disposed', 'paid', 'settled', 'closed'].includes(challan.status?.toLowerCase())
                  ) || [];
                  
                  return (
                    <div className="space-y-4">
                      {/* Source-wise Breakdown - Segregated by Source */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Source-wise Challan Breakdown</h4>
                        
                        {/* Segregate challans by source */}
                        {(() => {
                          const sourceGroups: { [key: string]: any[] } = {
                            vcourt_notice: [],
                            vcourt_traffic: [],
                            traffic_notice: [],
                            acko: []
                          };
                          
                          // Group challans by source
                          activeChallans.forEach(challan => {
                            const source = challan.source || 'unknown';
                            if (sourceGroups[source]) {
                              sourceGroups[source].push(challan);
                            }
                          });
                          
                          return (
                            <div className="space-y-6">
                              {/* VCourt Notice Challans */}
                              {sourceGroups.vcourt_notice.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                    VCourt Notice Challans ({sourceGroups.vcourt_notice.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {sourceGroups.vcourt_notice.map((challan: any, index: number) => {
                                      const isDL = challan.challan_number?.startsWith('DL') || /^\d/.test(challan.challan_number || '');
                                      const originalAmount = getChallanAmount(challan);
                                      const settlementAmount = getChallanSettlementAmount(challan);
                                      
                                      return (
                                        <div key={index} className="bg-white p-3 rounded border border-blue-100">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700">VCourt Notice Challan</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              isDL ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                              {isDL ? 'DL' : 'Non-DL'}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-600">Original Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{originalAmount.toLocaleString()}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Settlement Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{settlementAmount.toLocaleString()}</span>
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            Challan: {challan.challan_number || 'N/A'} | Status: {challan.status || 'N/A'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <div className="flex justify-between text-sm font-medium text-blue-900">
                                      <span>VCourt Notice Total:</span>
                                      <span>₹{sourceGroups.vcourt_notice.reduce((sum, challan) => sum + getChallanAmount(challan), 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* VCourt Traffic Challans */}
                              {sourceGroups.vcourt_traffic.length > 0 && (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                  <h5 className="font-semibold text-purple-900 mb-3 flex items-center">
                                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                                    VCourt Traffic Challans ({sourceGroups.vcourt_traffic.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {sourceGroups.vcourt_traffic.map((challan: any, index: number) => {
                                      const isDL = challan.challan_number?.startsWith('DL') || /^\d/.test(challan.challan_number || '');
                                      const originalAmount = getChallanAmount(challan);
                                      const settlementAmount = getChallanSettlementAmount(challan);
                                      
                                      return (
                                        <div key={index} className="bg-white p-3 rounded border border-purple-100">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700">VCourt Traffic Challan</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              isDL ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                              {isDL ? 'DL' : 'Non-DL'}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-600">Original Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{originalAmount.toLocaleString()}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Settlement Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{settlementAmount.toLocaleString()}</span>
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            Challan: {challan.challan_number || 'N/A'} | Status: {challan.status || 'N/A'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-purple-200">
                                    <div className="flex justify-between text-sm font-medium text-purple-900">
                                      <span>VCourt Traffic Total:</span>
                                      <span>₹{sourceGroups.vcourt_traffic.reduce((sum, challan) => sum + getChallanAmount(challan), 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Delhi Police Traffic Challans */}
                              {sourceGroups.traffic_notice.length > 0 && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                  <h5 className="font-semibold text-red-900 mb-3 flex items-center">
                                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                    Delhi Police Traffic Challans ({sourceGroups.traffic_notice.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {sourceGroups.traffic_notice.map((challan: any, index: number) => {
                                      const isDL = challan.challan_number?.startsWith('DL') || /^\d/.test(challan.challan_number || '');
                                      const originalAmount = getChallanAmount(challan);
                                      const settlementAmount = getChallanSettlementAmount(challan);
                                      
                                      return (
                                        <div key={index} className="bg-white p-3 rounded border border-red-100">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700">Delhi Police Traffic Challan</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              isDL ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                              {isDL ? 'DL' : 'Non-DL'}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-600">Original Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{originalAmount.toLocaleString()}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Settlement Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{settlementAmount.toLocaleString()}</span>
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            Challan: {challan.challan_number || 'N/A'} | Status: {challan.status || 'N/A'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-red-200">
                                    <div className="flex justify-between text-sm font-medium text-red-900">
                                      <span>Delhi Police Traffic Total:</span>
                                      <span>₹{sourceGroups.traffic_notice.reduce((sum, challan) => sum + getChallanAmount(challan), 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* ACKO/CarInfo Challans */}
                              {sourceGroups.acko.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <h5 className="font-semibold text-green-900 mb-3 flex items-center">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    ACKO/CarInfo Challans ({sourceGroups.acko.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {sourceGroups.acko.map((challan: any, index: number) => {
                                      const isDL = challan.challan_number?.startsWith('DL') || /^\d/.test(challan.challan_number || '');
                                      const originalAmount = getChallanAmount(challan);
                                      const settlementAmount = getChallanSettlementAmount(challan);
                                      
                                      return (
                                        <div key={index} className="bg-white p-3 rounded border border-green-100">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-700">ACKO/CarInfo Challan</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              isDL ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                              {isDL ? 'DL' : 'Non-DL'}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-600">Original Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{originalAmount.toLocaleString()}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Settlement Amount:</span>
                                              <span className="font-semibold text-gray-900 ml-2">₹{settlementAmount.toLocaleString()}</span>
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            Challan: {challan.challan_number || 'N/A'} | Status: {challan.status || 'N/A'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-green-200">
                                    <div className="flex justify-between text-sm font-medium text-green-900">
                                      <span>ACKO/CarInfo Total:</span>
                                      <span>₹{sourceGroups.acko.reduce((sum, challan) => sum + getChallanAmount(challan), 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Grand Total Summary */}
                              <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                                <h5 className="font-semibold text-gray-900 mb-3">Grand Total Summary</h5>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-700">Total Original Amount:</span>
                                    <span className="font-semibold text-gray-900">₹{activeChallans.reduce((sum, challan) => sum + getChallanAmount(challan), 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-700">Total Settlement Amount:</span>
                                    <span className="font-semibold text-gray-900">₹{activeChallans.reduce((sum, challan) => sum + getChallanSettlementAmount(challan), 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Summary Totals */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-3">Summary Totals</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Total Original Amount:</span>
                            <span className="font-semibold text-gray-900">₹{originalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Total Settlement Amount:</span>
                            <span className="font-semibold text-gray-900">₹{baseAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rule Application */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-3">Rule Applied & Why</h4>
                        <div className="space-y-3">
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-start">
                              <div className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full mr-3">
                                {ruleApplied}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700 text-sm">
                                  <strong>Reason:</strong> {(() => {
                                    if (ruleApplied.includes('Rule 1')) {
                                      return `Single DL challan (₹${originalAmount.toLocaleString()}) is under ₹1000`;
                                    } else if (ruleApplied.includes('Rule 2')) {
                                      return `Multiple DL challans with total (₹${originalAmount.toLocaleString()}) and at least one over ₹1000`;
                                    } else if (ruleApplied.includes('Rule 3')) {
                                      return `Total original amount (₹${originalAmount.toLocaleString()}) exceeds ₹1000`;
                                    } else if (ruleApplied.includes('Rule 4')) {
                                      return `Total original amount (₹${originalAmount.toLocaleString()}) exceeds ₹2000`;
                                    }
                                    return 'Default rule applied';
                                  })()}
                                </p>
                                <p className="text-gray-600 text-sm mt-1">
                                  <strong>Extra Charge:</strong> ₹{extraCharge.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Final Calculation */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-3">Final Hold Amount Calculation</h4>
                        <div className="bg-white p-4 rounded border space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Base Settlement Amount:</span>
                            <span className="font-semibold text-gray-900">₹{baseAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Extra Service Charge:</span>
                            <span className="font-semibold text-red-600">+ ₹{extraCharge.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-gray-300 pt-3">
                            <div className="flex justify-between">
                              <span className="text-gray-700 font-semibold text-lg">Final Hold Amount:</span>
                              <span className="font-bold text-green-900 text-xl">₹{holdAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Business Cases */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Cases (Only ONE Applies)</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mr-3">Case 1</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Single DL Challan Under ₹1000</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          <strong>Condition:</strong> Only 1 challan total, it's a DL challan, original amount is less than ₹1000<br/>
                          <strong>Service Charge:</strong> ₹200<br/>
                          <strong>Example:</strong> 1 DL challan of ₹800 → Extra Charge = ₹200
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mr-3">Case 2</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Multiple DL Challans with Any Over ₹1000</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          <strong>Condition:</strong> Multiple challans, ALL are DL challans, at least one original amount is over ₹1000<br/>
                          <strong>Service Charge:</strong> ₹500<br/>
                          <strong>Example:</strong> 3 DL challans of ₹600, ₹1200, ₹400 → Extra Charge = ₹500
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full mr-3">Case 3</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Mixed DL + Non-DL Challans (≤ ₹2000)</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          <strong>Condition:</strong> When both DL and non-DL challans are present (amount ≤ ₹2000)<br/>
                          <strong>Service Charge:</strong> ₹1000 (fixed)<br/>
                          <strong>Example:</strong> 1 DL challan ₹800 + 1 UP challan ₹500 = ₹1300 → ₹1000 extra charge
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full mr-3">Case 4</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Any Challan Above ₹2000</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          <strong>Condition:</strong> Any single challan exceeds ₹2000 (can be DL or non-DL)<br/>
                          <strong>Service Charge:</strong> ₹1500<br/>
                          <strong>Example:</strong> Any challan above ₹2000 → Extra Charge = ₹1500
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full mr-3">Case 5</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Single Non-DL Challan (Any Amount)</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          <strong>Condition:</strong> Only 1 challan total and it's a non-DL challan (any amount)<br/>
                          <strong>Service Charge:</strong> ₹1000<br/>
                          <strong>Example:</strong> 1 UP challan ₹800 → Extra Charge = ₹1000
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Process */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Process</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 text-purple-800 text-sm font-semibold px-2 py-1 rounded">Step 1</div>
                    <span className="text-gray-700">Calculate total original amount from all active challans</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 text-purple-800 text-sm font-semibold px-2 py-1 rounded">Step 2</div>
                    <span className="text-gray-700">Determine which SINGLE case applies to the unique JSON block</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 text-purple-800 text-sm font-semibold px-2 py-1 rounded">Step 3</div>
                    <span className="text-gray-700">Calculate total settlement amount from all active challans</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 text-purple-800 text-sm font-semibold px-2 py-1 rounded">Step 4</div>
                    <span className="text-gray-700">Final Hold Amount = Settlement Amount + Extra Charge (from the single case)</span>
                  </div>
                </div>
              </div>

              {/* DL vs Non-DL Classification */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">DL vs Non-DL Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">DL Challans</h4>
                    <p className="text-green-800 text-sm">
                      Challan numbers that start with:<br/>
                      • "DL" (e.g., DL12AB1234)<br/>
                      • Any number (e.g., 1234567890)
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">Non-DL Challans</h4>
                    <p className="text-orange-800 text-sm">
                      Challan numbers that start with:<br/>
                      • "HR" (Haryana)<br/>
                      • "UP" (Uttar Pradesh)<br/>
                      • "RJ" (Rajasthan)<br/>
                      • Other state codes
                    </p>
                  </div>
                </div>
              </div>

              {/* Example Calculation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Calculation</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Original DL challan:</span>
                      <span className="font-semibold">₹1,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Original UP challan:</span>
                      <span className="font-semibold">₹800</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total original amount:</span>
                        <span className="font-semibold">₹2,000</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Rule applied:</span>
                        <span className="font-semibold text-blue-600">Rule 3 (Total &gt; ₹1000)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Extra charge:</span>
                        <span className="font-semibold text-red-600">₹1,000</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Settlement DL challan:</span>
                        <span className="font-semibold">₹1,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Settlement UP challan:</span>
                        <span className="font-semibold">₹600</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300 pt-2 bg-blue-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-700 font-semibold">Final Hold Amount:</span>
                        <span className="font-bold text-blue-900">₹2,600</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Settlement (₹1,600) + Extra Charge (₹1,000)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallanDatabaseDashboard;
