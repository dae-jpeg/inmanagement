import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCodeIcon } from "lucide-react";
import InventoryGrid from "./InventoryGrid";
import QRScanner from "./QRScanner";
import AuthActionFlow from "./AuthActionFlow";

interface InventoryItem {
  id: string;
  name: string;
  imageUrl: string;
  available: boolean;
  description?: string;
}

const Home = () => {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAuthFlowOpen, setIsAuthFlowOpen] = useState(false);
  const [scannedItemId, setScannedItemId] = useState<string | null>(null);

  // Mock inventory data
  const inventoryItems: InventoryItem[] = [
    {
      id: "001",
      name: "Laptop",
      imageUrl:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80",
      available: true,
      description: "MacBook Pro 16-inch",
    },
    {
      id: "002",
      name: "Monitor",
      imageUrl:
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&q=80",
      available: false,
      description: "27-inch 4K Display",
    },
    {
      id: "003",
      name: "Keyboard",
      imageUrl:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80",
      available: true,
      description: "Mechanical Keyboard",
    },
    {
      id: "004",
      name: "Mouse",
      imageUrl:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&q=80",
      available: true,
      description: "Wireless Mouse",
    },
    {
      id: "005",
      name: "Headphones",
      imageUrl:
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&q=80",
      available: false,
      description: "Noise Cancelling Headphones",
    },
    {
      id: "006",
      name: "Webcam",
      imageUrl:
        "https://images.unsplash.com/photo-1596207498818-c9597d9c21db?w=300&q=80",
      available: true,
      description: "HD Webcam",
    },
  ];

  const handleScanClick = () => {
    setIsQRScannerOpen(true);
  };

  const handleScanComplete = (itemId: string) => {
    setIsQRScannerOpen(false);
    setScannedItemId(itemId);
    setIsAuthFlowOpen(true);
  };

  const handleScanCancel = () => {
    setIsQRScannerOpen(false);
  };

  const handleAuthFlowClose = () => {
    setIsAuthFlowOpen(false);
    setScannedItemId(null);
  };

  const handleTransactionComplete = (
    action: "withdraw" | "return",
    userId: string,
  ) => {
    // In a real app, this would update the database
    console.log(`User ${userId} performed ${action} on item ${scannedItemId}`);
    setIsAuthFlowOpen(false);
    setScannedItemId(null);
    // Here you would update the item's availability status
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory Management System</h1>
        <Button onClick={handleScanClick} className="flex items-center gap-2">
          <QrCodeIcon className="h-5 w-5" />
          Scan QR Code
        </Button>
      </header>

      <main>
        <InventoryGrid items={inventoryItems} onScanClick={handleScanClick} />
      </main>

      {isQRScannerOpen && (
        <QRScanner
          isOpen={isQRScannerOpen}
          onScanComplete={handleScanComplete}
          onCancel={handleScanCancel}
        />
      )}

      {isAuthFlowOpen && scannedItemId && (
        <AuthActionFlow
          isOpen={isAuthFlowOpen}
          itemId={scannedItemId}
          item={inventoryItems.find((item) => item.id === scannedItemId)}
          onClose={handleAuthFlowClose}
          onComplete={handleTransactionComplete}
        />
      )}
    </div>
  );
};

export default Home;
