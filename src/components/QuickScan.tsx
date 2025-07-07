import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "./QRScanner";
import api from "../utils/api";
import { toast } from "./ui/use-toast";

interface QuickScanProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'withdraw' | 'return';
}

const QuickScan = ({ isOpen, onClose, mode }: QuickScanProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleScanSuccess = async (itemId: string) => {
    try {
      setError(null);
      
      const response = await api.post('/transactions/', {
        item_id: itemId,
        transaction_type: mode.toUpperCase(),
        notes: ''
      });

      // Close scanner first
      onClose();
      
      // Then navigate to success page
      navigate(`/${mode}`, { 
        state: { 
          transactionComplete: true,
          itemId: itemId,
          transactionId: response.data.id
        }
      });
    } catch (err) {
      console.error('Error processing transaction:', err);
      
      // Create user-friendly error message
      let userFriendlyMessage = `Failed to ${mode} item. Please try again.`;
      
      if (err instanceof Error) {
        const errorMessage = err.message;
        
        // Handle specific error patterns
        if (errorMessage.includes("Cannot withdraw") && errorMessage.includes("Insufficient stock")) {
          userFriendlyMessage = "Cannot withdraw this item. Insufficient stock available.";
        } else if (errorMessage.includes("Cannot withdraw") && errorMessage.includes("out of stock")) {
          userFriendlyMessage = "Cannot withdraw this item. Item is out of stock.";
        } else if (errorMessage.includes("Cannot return") && errorMessage.includes("original stock")) {
          userFriendlyMessage = "Cannot return this item. Would exceed original stock quantity.";
        } else if (errorMessage.includes("Cannot return") && errorMessage.includes("no original stock quantity set")) {
          userFriendlyMessage = "This item has no original stock quantity set. Please contact an administrator.";
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
      
      setError(userFriendlyMessage);
      
      toast({
        title: "Error",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      
      // Keep scanner open on error
      return;
    }
  };

  return (
    <>
      <QRScanner
        isOpen={isOpen}
        onClose={onClose}
        onScanSuccess={handleScanSuccess}
      />
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-md">
            <div className="font-medium mb-1">Transaction Error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickScan; 