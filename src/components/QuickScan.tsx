import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "./QRScanner";
import api from "../utils/api";

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
          itemId: itemId
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} item`);
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
          <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        </div>
      )}
    </>
  );
};

export default QuickScan; 