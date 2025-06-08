import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowLeft, QrCode } from "lucide-react";
import QRScanner from "./QRScanner";
import api from "../utils/api";

interface InventoryItem {
  id: string;
  item_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  qr_code: string;
}

const WithdrawItem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Redirect to login if no user data is found
  React.useEffect(() => {
    if (!user) {
      navigate("/");
    } 
    // else {
    //   console.log("Triggered user");
    //   setIsQRScannerOpen(true);
    // }
  }, [user, navigate]);

  // Handle transaction complete state from QuickScan
  useEffect(() => {
    const state = location.state as { transactionComplete?: boolean; itemId?: string } | null;
    if (state?.transactionComplete) {
      setSelectedItemId(state.itemId || null);
      setTransactionComplete(true);
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    console.log("QR STAT:", isQRScannerOpen);
  }, [isQRScannerOpen]);

  // Fetch available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/items/available/');
        setItems(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleScanClick = () => {
    setIsQRScannerOpen(true);
  };

  const handleScanSuccess = async (itemId: string) => {
    setIsQRScannerOpen(false);
    setSelectedItemId(itemId);

    try {
      const response = await api.post('/transactions/', {
        item_id: itemId,
        transaction_type: 'WITHDRAW',
        notes: ''
      });

      setTransactionComplete(true);
    } catch (err: any) {
      // Extract error message from API response
      const errorMessage = err.response?.data?.item_id || 
                         err.response?.data?.detail ||
                         err.message || 
                         'Failed to withdraw item';
      setError(errorMessage);
    }
  };

  const handleScanCancel = () => {
    setIsQRScannerOpen(false);
  };

  const handleBackToActions = () => {
    navigate("/actions");
  };

  const handleNewWithdrawal = () => {
    setSelectedItemId(null);
    setTransactionComplete(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToActions}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Withdraw Item</h1>
        </div>
        <Button onClick={handleScanClick} className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan QR Code
        </Button>
      </header>

      <main>
        {error && (
          <div className="max-w-md mx-auto mb-4 bg-red-50 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        )}

        {transactionComplete && selectedItemId ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg">Withdrawal Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  You have successfully withdrawn the item.
                </p>
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={handleBackToActions}>
                  Back to Menu
                </Button>
                <Button onClick={handleNewWithdrawal}>New Withdrawal</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-4">Withdraw an Item</h2>
            <p className="mb-6 text-muted-foreground">
              To withdraw an item from inventory, please scan its QR code using the
              button above.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleScanClick} className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </Button>
            </div>
          </div>
        )}
      </main>

      {isQRScannerOpen &&
        <QRScanner
          isOpen={isQRScannerOpen}
          onClose={handleScanCancel}
          onScanSuccess={handleScanSuccess}
        />
      }

    </div>
  );
};

export default WithdrawItem;
