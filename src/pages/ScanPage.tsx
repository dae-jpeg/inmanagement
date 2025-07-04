import React, { useState } from 'react';
import CodeScanner from '../components/CodeScanner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const ScanPage: React.FC = () => {
  const [scannedItem, setScannedItem] = useState<any>(null);
  const navigate = useNavigate();

  const handleScan = (data: any) => {
    setScannedItem(data);
  };

  const handleViewDetails = () => {
    if (scannedItem) {
      navigate(`/items/${scannedItem.id}`);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Scan Item</h1>
      
      <CodeScanner onScan={handleScan} scanType="qr" />

      {scannedItem && (
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-2">Scanned Item Details</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {scannedItem.name}</p>
            <p><strong>ID:</strong> {scannedItem.item_id}</p>
            <p><strong>Category:</strong> {scannedItem.category}</p>
            <p><strong>Status:</strong> {scannedItem.status}</p>
            <Button onClick={handleViewDetails} className="mt-4">
              View Full Details
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ScanPage; 