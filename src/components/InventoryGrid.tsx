import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  imageUrl: string;
  available: boolean;
  description?: string;
  category?: string;
}

interface InventoryGridProps {
  items?: InventoryItem[];
  onScanQR?: (itemId: string) => void;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({
  items = [
    {
      id: "1",
      name: "Laptop",
      imageUrl:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80",
      available: true,
      description: "MacBook Pro 16-inch",
      category: "Electronics",
    },
    {
      id: "2",
      name: "Monitor",
      imageUrl:
        "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=300&q=80",
      available: false,
      description: "27-inch 4K Display",
      category: "Electronics",
    },
    {
      id: "3",
      name: "Keyboard",
      imageUrl:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80",
      available: true,
      description: "Mechanical Keyboard",
      category: "Accessories",
    },
    {
      id: "4",
      name: "Mouse",
      imageUrl:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&q=80",
      available: true,
      description: "Wireless Mouse",
      category: "Accessories",
    },
    {
      id: "5",
      name: "Headphones",
      imageUrl:
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&q=80",
      available: false,
      description: "Noise Cancelling Headphones",
      category: "Audio",
    },
    {
      id: "6",
      name: "Webcam",
      imageUrl:
        "https://images.unsplash.com/photo-1596207498818-c84f1bc1b2c2?w=300&q=80",
      available: true,
      description: "HD Webcam",
      category: "Electronics",
    },
  ],
  onScanQR = (itemId) => console.log(`Scan QR for item ${itemId}`),
}) => {
  return (
    <div className="bg-background w-full p-6">
      <h2 className="text-2xl font-bold mb-6">Inventory Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative h-48 w-full">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={item.available ? "default" : "destructive"}>
                  {item.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  {item.category && (
                    <p className="text-sm text-muted-foreground">
                      {item.category}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onScanQR(item.id)}
                  title="Scan QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              {item.description && (
                <p className="text-sm mt-2">{item.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InventoryGrid;
