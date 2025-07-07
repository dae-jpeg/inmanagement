import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle2, ArrowLeft, QrCode, Package, ArrowUpRight, ArrowDownLeft, Barcode, Info } from "lucide-react";
import { Toggle } from "./ui/toggle";
import SimpleScanner from "./SimpleScanner";
import api from "../utils/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "./ui/use-toast";

interface AuthActionFlowProps {
  isOpen?: boolean;
  onClose?: () => void;
  itemId?: string;
  itemName?: string;
}

type Step = "auth" | "action" | "confirmation";
type Action = "withdraw" | "return" | null;
type Status = "success" | "error" | null;

interface InventoryItem {
  id: string;
  item_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  qr_code: string;
  barcode: string;
  stock_quantity: number;
  minimum_stock: number;
}

const AuthActionFlow: React.FC<AuthActionFlowProps> = ({
  isOpen = true,
  onClose = () => {},
  itemId = "ITEM-001",
  itemName = "Office Laptop",
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("auth");
  const [userId, setUserId] = useState<string>("");
  const [action, setAction] = useState<Action>(null);
  const [status, setStatus] = useState<Status>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [actionType, setActionType] = useState<'withdraw' | 'return' | null>(null);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [scanType, setScanType] = useState<'qr' | 'barcode'>('qr');
  const [showScanner, setShowScanner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(null);
  
  // Bulk functionality states
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState<string>('1');

  // Get the last used scan type for each action
  const getLastScanType = (action: 'withdraw' | 'return'): 'qr' | 'barcode' => {
    const savedType = localStorage.getItem(`last_scan_type_${action}`);
    return (savedType as 'qr' | 'barcode') || 'qr';
  };

  // Save the last used scan type for an action
  const saveLastScanType = (action: 'withdraw' | 'return', type: 'qr' | 'barcode') => {
    localStorage.setItem(`last_scan_type_${action}`, type);
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = localStorage.getItem("access_token");

      if (!user || !token) {
        navigate("/login");
        return;
      }

      // Ensure we have a valid API URL
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/items/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      setItems(data);
      
      // Extract unique categories and ensure they are strings
      const uniqueCategories = Array.from(
        new Set(data.map((item: InventoryItem) => item.category))
      ).filter((category): category is string => typeof category === 'string');
      
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching items');
      toast({
        title: "Error",
        description: "Failed to load items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Redirect to login if no user data is found
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleUserIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError("User ID is required");
      return;
    }

    // Simulate validation - in a real app, this would be an API call
    if (userId.length < 3) {
      setError("Invalid User ID format");
      return;
    }

    setError("");
    setStep("action");
  };

  const handleActionSelect = (selectedAction: Action) => {
    setAction(selectedAction);

    // Simulate processing - in a real app, this would be an API call
    setTimeout(() => {
      // Simulate success (you could add logic for failure cases)
      setStatus("success");
      setStep("confirmation");
    }, 1000);
  };

  const handleClose = () => {
    // Reset state
    setStep("auth");
    setUserId("");
    setAction(null);
    setStatus(null);
    setError("");
    onClose();
  };

  const handleRetry = () => {
    setStep("action");
    setStatus(null);
  };

  const handleActionClick = (action: 'withdraw' | 'return') => {
    setActionType(action);
    setShowScanOptions(true);
    setIsBulkMode(false);
    setBulkQuantity('1');
  };

  const handleBulkActionClick = (action: 'withdraw' | 'return') => {
    const quantity = parseInt(bulkQuantity);
    if (!bulkQuantity || isNaN(quantity) || quantity < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity (minimum 1)",
        variant: "destructive",
      });
      return;
    }
    setActionType(action);
    setIsBulkMode(true);
    setShowScanOptions(true);
  };

  const handleScanTypeClick = (type: 'qr' | 'barcode') => {
    // Clear any previous errors when starting a new scan
    setUserFriendlyError(null);
    setError(null);
    
    // Set the scan type first, then open the scanner
    setScanType(type);
    
    // Use a small delay to ensure state is updated
    setTimeout(() => {
      setShowScanner(true);
    }, 100);
  };

  const handleScanSuccess = async (decodedText: string) => {
    setShowScanner(false);
    setShowScanOptions(false);

    try {
      setError(null);
      setUserFriendlyError(null);
      
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = localStorage.getItem("access_token");

      if (!user || !token) {
        navigate("/login");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      let item;

      // Handle different scan types
      if (scanType === 'qr') {
        // For QR codes, use the scan_code endpoint
        const response = await fetch(`${apiUrl}/api/items/scan_code/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'qr',
            value: decodedText
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to scan QR code');
        }
        
        item = await response.json();
      } else {
        // For barcodes, use the scan_code endpoint
        const response = await fetch(`${apiUrl}/api/items/scan_code/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'barcode',
            value: decodedText
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to scan barcode');
        }
        
        item = await response.json();
      }

      // For returns, validate stock before processing
      if (actionType === 'return') {
        const currentStock = item.stock_quantity;
        const originalStock = item.original_stock_quantity || 0;
        
        // If original stock is 0, we can't return anything
        if (originalStock === 0) {
          throw new Error(`Cannot return ${item.name}. This item has no original stock quantity configured. Please contact an administrator to set up the item's stock settings before attempting returns.`);
        }
        
        const alreadyReturned = originalStock - currentStock;
        const canReturn = originalStock - currentStock;
        
        if (isBulkMode) {
          const quantity = parseInt(bulkQuantity);
          if (quantity > canReturn) {
            if (canReturn <= 0) {
              const errorMsg = `Cannot return ${quantity} items of ${item.name}. All original stock (${originalStock}) has already been returned.`;
              throw new Error(errorMsg);
            } else {
              const errorMsg = `Cannot return ${quantity} items of ${item.name}. You can only return ${canReturn} more items (original stock: ${originalStock}, already returned: ${alreadyReturned}).`;
              throw new Error(errorMsg);
            }
          }
        } else if (canReturn <= 0) {
          throw new Error(`Cannot return ${item.name}. All original stock (${originalStock}) has already been returned.`);
        }
      }

      // For withdrawals, validate stock before processing
      if (actionType === 'withdraw') {
        const currentStock = item.stock_quantity;
        
        if (isBulkMode) {
          const quantity = parseInt(bulkQuantity);
          if (quantity > currentStock) {
            if (currentStock === 0) {
              throw new Error(`Cannot withdraw ${quantity} items of ${item.name}. Item is out of stock.`);
            } else {
              throw new Error(`Cannot withdraw ${quantity} items of ${item.name}. Only ${currentStock} items available in stock.`);
            }
          }
        } else if (currentStock === 0) {
          throw new Error(`Cannot withdraw ${item.name}. Item is out of stock.`);
        }
      }

      let transactionResult;
      
      if (isBulkMode) {
        // Create a single transaction with the bulk quantity
        const quantity = parseInt(bulkQuantity);
        const transactionData = {
          item: item.id,
          branch: typeof item.branch === 'object' && item.branch !== null ? item.branch.id : item.branch,
          transaction_type: actionType === 'withdraw' ? 'WITHDRAW' : 'RETURN',
          quantity: quantity,
          notes: `Bulk ${actionType} - ${quantity} items`
        };

        const transactionResponse = await fetch(`${apiUrl}/api/transactions/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(transactionData),
        });

        if (!transactionResponse.ok) {
          const errorText = await transactionResponse.text();
          // Try to parse JSON error first
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.detail) {
              throw new Error(errorJson.detail);
            }
          } catch {
            // If not JSON, check for specific error patterns
            if (errorText.includes("Cannot withdraw") && errorText.includes("Insufficient stock")) {
              const quantity = parseInt(bulkQuantity);
              throw new Error(`Cannot withdraw ${quantity} items of ${item.name}. Insufficient stock available.`);
            } else if (errorText.includes("Cannot return") && errorText.includes("exceed original stock")) {
              const quantity = parseInt(bulkQuantity);
              throw new Error(`Cannot return ${quantity} items of ${item.name}. Would exceed original stock quantity.`);
            } else {
              throw new Error(`Transaction failed: ${errorText.substring(0, 200)}...`);
            }
          }
        }

        transactionResult = await transactionResponse.json();
      } else {
        // Single transaction
        const transactionData = {
          item: item.id,
          branch: typeof item.branch === 'object' && item.branch !== null ? item.branch.id : item.branch,
          transaction_type: actionType === 'withdraw' ? 'WITHDRAW' : 'RETURN',
          quantity: 1,
          notes: actionType === 'withdraw' ? 'Withdrawn by user' : 'Returned by user'
        };

        const transactionResponse = await fetch(`${apiUrl}/api/transactions/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(transactionData),
        });

        if (!transactionResponse.ok) {
          const errorText = await transactionResponse.text();
          // Try to parse JSON error first
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.detail) {
              throw new Error(errorJson.detail);
            }
          } catch {
            // If not JSON, check for specific error patterns
            if (errorText.includes("Cannot withdraw") && errorText.includes("Insufficient stock")) {
              throw new Error(`Cannot withdraw ${item.name}. Insufficient stock available.`);
            } else if (errorText.includes("Cannot return") && errorText.includes("exceed original stock")) {
              throw new Error(`Cannot return ${item.name}. Would exceed original stock quantity.`);
            } else {
              throw new Error(`Transaction failed: ${errorText.substring(0, 200)}...`);
            }
          }
        }

        transactionResult = await transactionResponse.json();
      }



      // Navigate to the new transaction success page
      navigate(`/${actionType}`, { 
        state: { 
          transactionComplete: true,
          itemId: item.id,
          transactionId: transactionResult.id
        }
      });
      
      fetchItems(); // Refresh the items list
      setIsBulkMode(false);
      setBulkQuantity('1');
    } catch (error) {
      console.error('Error processing scan:', error);
      
      // Create user-friendly error message
      let userFriendlyMessage = "Failed to process the scanned item. Please try again.";
      
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Handle specific error patterns
        if (errorMessage.includes("Cannot withdraw") && errorMessage.includes("Insufficient stock")) {
          userFriendlyMessage = "Cannot withdraw this item. Insufficient stock available.";
        } else if (errorMessage.includes("Cannot withdraw") && errorMessage.includes("out of stock")) {
          userFriendlyMessage = "Cannot withdraw this item. Item is out of stock.";
        } else if (errorMessage.includes("Cannot withdraw") && errorMessage.includes("Only")) {
          userFriendlyMessage = errorMessage; // Keep the specific quantity message
        } else if (errorMessage.includes("Cannot return") && errorMessage.includes("original stock")) {
          userFriendlyMessage = errorMessage; // Keep the detailed return message
        } else if (errorMessage.includes("Cannot return") && errorMessage.includes("no original stock quantity set")) {
          userFriendlyMessage = "This item has no original stock quantity configured. Please contact an administrator to set up the item's stock settings before attempting returns.";
        } else if (errorMessage.includes("Cannot return") && errorMessage.includes("no original stock quantity configured")) {
          userFriendlyMessage = "This item has no original stock quantity configured. Please contact an administrator to set up the item's stock settings before attempting returns.";
        } else if (errorMessage.includes("Item not found")) {
          userFriendlyMessage = "Item not found. Please scan a valid item.";
        } else if (errorMessage.includes("Transaction failed")) {
          // Extract the meaningful part of the error
          const match = errorMessage.match(/Transaction failed: (.+)/);
          if (match && match[1]) {
            userFriendlyMessage = match[1];
          } else {
            userFriendlyMessage = "Transaction failed. Please try again.";
          }
        } else {
          // For any other errors, use the error message but truncate if too long
          userFriendlyMessage = errorMessage.length > 200 ? 
            errorMessage.substring(0, 200) + "..." : 
            errorMessage;
        }
      }
      
      // Set the user-friendly error message for display
      setUserFriendlyError(userFriendlyMessage);
      
      toast({
        title: "Error",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    }
  };

  const handleScanCancel = () => {
    setIsScannerOpen(false);
    setActionType(null);
  };

  const handleBackToActions = () => {
    setShowScanOptions(false);
    setActionType(null);
    setShowSuccess(false);
    setError(null);
    setUserFriendlyError(null);
    setSelectedItemId(null);
    setTransactionComplete(false);
    setIsBulkMode(false);
    setBulkQuantity('1');
    navigate('/dashboard');
  };

  const handleNewAction = () => {
    setSelectedItemId(null);
    setTransactionComplete(false);
    setError(null);
    setUserFriendlyError(null);
    setActionType(null);
    setShowSuccess(false);
    setShowScanOptions(false);
    setIsBulkMode(false);
    setBulkQuantity('1');
  };

  // Filter items based on selected category
  const filteredItems = selectedCategory === "all" 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const handleScanTypeChange = (type: 'qr' | 'barcode') => {
    setScanType(type);
    saveLastScanType(actionType, type);
  };



  return (
    <div className="container mx-auto p-4">
      {showSuccess ? (
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-4">Success!</div>
          <p className="text-gray-600 mb-4">{successMessage}</p>
          <div className="space-x-4">
            <Button onClick={() => setShowSuccess(false)}>Start New Action</Button>
            <Button variant="outline" onClick={() => navigate('/actions')}>Return to Menu</Button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* User-Friendly Error Display */}
            {userFriendlyError && (
              <div className="mb-6">
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">
                    {userFriendlyError}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="grid grid-cols-12 gap-8">
              {/* Left Column - Action Selection */}
              <div className="col-span-4">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {!showScanOptions ? 'Choose an Action' : `${actionType === 'withdraw' ? 'Withdraw' : 'Return'} Item`}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {!showScanOptions 
                          ? 'Select whether you want to withdraw or return an item'
                          : 'Choose how you want to scan the item'
                        }
                      </p>
                    </div>

                    {!showScanOptions ? (
                      // Step 1: Choose Action (Withdraw/Return) with Bulk options
                      <div className="space-y-4">
                        {/* Single Actions */}
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={() => handleActionClick('withdraw')}
                            className="h-16 bg-blue-600 hover:bg-blue-700 rounded-lg"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <ArrowUpRight className="h-5 w-5" />
                              <span>Single Withdraw</span>
                            </div>
                          </Button>
                          <Button 
                            onClick={() => handleActionClick('return')}
                            className="h-16 bg-green-600 hover:bg-green-700 rounded-lg"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <ArrowDownLeft className="h-5 w-5" />
                              <span>Single Return</span>
                            </div>
                          </Button>
                        </div>

                        {/* Bulk Actions */}
                        <div className="border-t pt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Bulk Operations</h3>
                          
                          {/* Quantity Input */}
                          <div className="flex items-center gap-3 mb-4 justify-center">
                            <Label htmlFor="bulk-quantity" className="text-sm text-gray-600">Quantity:</Label>
                            <Input
                              id="bulk-quantity"
                              type="number"
                              min="1"
                              value={bulkQuantity}
                              onChange={(e) => setBulkQuantity(e.target.value)}
                              className="w-20"
                            />
                          </div>

                          {/* Bulk Action Buttons */}
                          <div className="grid grid-cols-2 gap-4">
                            <Button 
                              onClick={() => handleBulkActionClick('withdraw')}
                              className="h-16 bg-blue-500 hover:bg-blue-600 rounded-lg"
                              disabled={!bulkQuantity || isNaN(parseInt(bulkQuantity)) || parseInt(bulkQuantity) < 1}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Package className="h-5 w-5" />
                                <span>Bulk Withdraw ({parseInt(bulkQuantity) || 0})</span>
                              </div>
                            </Button>
                            <Button 
                              onClick={() => handleBulkActionClick('return')}
                              className="h-16 bg-green-500 hover:bg-green-600 rounded-lg"
                              disabled={!bulkQuantity || isNaN(parseInt(bulkQuantity)) || parseInt(bulkQuantity) < 1}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Package className="h-5 w-5" />
                                <span>Bulk Return ({parseInt(bulkQuantity) || 0})</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Bulk Operation Information */}
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Bulk Operation Information</span>
                          </div>
                          <div className="text-xs text-yellow-700 space-y-1">
                            <p>• Enter the quantity you want to withdraw or return</p>
                            <p>• For returns: You cannot exceed the original stock quantity</p>
                            <p>• For withdrawals: You cannot exceed available stock</p>
                            <p>• The system will validate stock levels before processing</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Step 2: Choose Scan Type (QR/Barcode)
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={() => handleScanTypeClick('qr')}
                            className="h-16 bg-purple-600 hover:bg-purple-700 rounded-lg"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <QrCode className="h-5 w-5" />
                              <span>Scan QR Code</span>
                            </div>
                          </Button>
                          <Button 
                            onClick={() => handleScanTypeClick('barcode')}
                            className="h-16 bg-orange-600 hover:bg-orange-700 rounded-lg"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Barcode className="h-5 w-5" />
                              <span>Scan Barcode</span>
                            </div>
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handleBackToActions}
                          className="w-full h-10"
                        >
                          Back to Actions
                        </Button>
                        
                        {/* Return Information */}
                        {actionType === 'return' && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Return Information</span>
                            </div>
                            <div className="text-xs text-blue-700 space-y-1">
                              <p>• You can only return items up to the original stock quantity</p>
                              <p>• The system tracks how many items have been withdrawn vs. returned</p>
                              <p>• If all original stock has been returned, no more returns are allowed</p>
                              <p>• If an item shows 0 original stock, contact an administrator to configure it</p>
                              <p>• Returns help maintain accurate inventory tracking</p>
                            </div>
                          </div>
                        )}

                        {/* Withdrawal Information */}
                        {actionType === 'withdraw' && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Withdrawal Information</span>
                            </div>
                            <div className="text-xs text-green-700 space-y-1">
                              <p>• You can only withdraw items that are currently in stock</p>
                              <p>• The system will prevent withdrawals if stock is insufficient</p>
                              <p>• Out-of-stock items cannot be withdrawn</p>
                              <p>• Low stock items will be marked for reordering</p>
                              <p>• Withdrawals help track item usage and inventory levels</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Items List */}
              <div className="col-span-8">
                <div className="bg-white rounded-xl shadow-lg">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Available Items</h3>
                      <div className="flex items-center gap-3">
                        <Label htmlFor="category" className="text-sm text-gray-600">Filter by Category:</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading items...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="destructive" className="m-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{item.item_id}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{item.description}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                  item.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${
                                    item.stock_quantity <= item.minimum_stock ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {item.stock_quantity}
                                  </span>
                                  {item.stock_quantity <= item.minimum_stock && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Low Stock
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SimpleScanner
        isOpen={showScanner}
        onClose={() => {
          setShowScanner(false);
          setShowScanOptions(false);
          setActionType(null);
        }}
        onScanSuccess={handleScanSuccess}
        scanType={scanType}
      />
    </div>
  );
};

export default AuthActionFlow;
