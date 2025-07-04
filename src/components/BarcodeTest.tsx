import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import SimpleScanner from './SimpleScanner';
import PerformanceMonitor from './PerformanceMonitor';
import { Barcode, QrCode, Download, Eye, ArrowLeft } from 'lucide-react';

interface Item {
  id: string;
  item_id: string;
  name: string;
  barcode_number: string;
  barcode: string;
  qr_code: string;
}

const BarcodeTest: React.FC = () => {
  const navigate = useNavigate();
  const [scanType, setScanType] = useState<'qr' | 'barcode'>('barcode');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [testBarcode, setTestBarcode] = useState<string>('BARITEM001');
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const handleScanSuccess = (data: string) => {
    console.log('Test scan success:', data);
    setScannedData(data);
    setIsScannerOpen(false);
  };

  const handleManualTest = () => {
    console.log('Manual test with barcode:', testBarcode);
    setScannedData(testBarcode);
  };

  const testBarcodeAPI = async () => {
    try {
      console.log('Testing barcode API with:', testBarcode);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${apiUrl}/api/items/scan_code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'barcode',
          value: testBarcode
        })
      });

      if (response.ok) {
        const item = await response.json();
        console.log('API test successful, found item:', item);
        setScannedData(`API Test Success: ${item.name} (${item.item_id})`);
      } else {
        const error = await response.text();
        console.error('API test failed:', error);
        setScannedData(`API Test Failed: ${error}`);
      }
    } catch (error) {
      console.error('API test error:', error);
      setScannedData(`API Test Error: ${error}`);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${apiUrl}/api/items/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        console.error('Failed to load items');
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Test */}
        <Card>
          <CardHeader>
            <CardTitle>Barcode Scanner Test (Optimized)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scan Type Selection */}
            <div className="space-y-2">
              <Label>Scan Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={scanType === 'barcode' ? 'default' : 'outline'}
                  onClick={() => setScanType('barcode')}
                  className="flex items-center gap-2"
                >
                  <Barcode className="h-4 w-4" />
                  Barcode
                </Button>
                <Button
                  variant={scanType === 'qr' ? 'default' : 'outline'}
                  onClick={() => setScanType('qr')}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>
              </div>
            </div>

            {/* Manual Test Input */}
            <div className="space-y-2">
              <Label>Test Barcode Value</Label>
              <div className="flex gap-2">
                <Input
                  value={testBarcode}
                  onChange={(e) => setTestBarcode(e.target.value)}
                  placeholder="Enter test barcode value"
                />
                <Button onClick={handleManualTest} variant="outline">
                  Test
                </Button>
              </div>
              <Button onClick={testBarcodeAPI} variant="outline" className="w-full">
                Test API Endpoint
              </Button>
            </div>

            {/* Scanner Button */}
            <div className="space-y-2">
              <Label>Scanner</Label>
              <Button
                onClick={() => setIsScannerOpen(true)}
                className="w-full flex items-center gap-2"
              >
                <Barcode className="h-4 w-4" />
                Open {scanType === 'barcode' ? 'Barcode' : 'QR'} Scanner
              </Button>
            </div>

            {/* Results */}
            {scannedData && (
              <div className="space-y-2">
                <Label>Scanned Result</Label>
                <div className="p-3 bg-gray-100 rounded border">
                  <p className="font-mono text-sm">{scannedData}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Length:</strong> {scannedData.length}</p>
                  <p><strong>Starts with BAR:</strong> {scannedData.startsWith('BAR') ? 'Yes' : 'No'}</p>
                  <p><strong>Starts with item:</strong> {scannedData.startsWith('item:') ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ul className="text-sm space-y-1">
                <li>• Select the scan type (Barcode or QR Code)</li>
                <li>• Click "Open Scanner" to test the camera scanner</li>
                <li>• Or enter a test value and click "Test" for manual testing</li>
                <li>• Check the browser console for detailed debug information</li>
                <li>• Barcodes should start with "BAR" (e.g., BARITEM001)</li>
                <li>• QR codes should start with "item:" (e.g., item:uuid)</li>
                <li>• <strong>This version is optimized for better performance</strong></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actual Barcodes for Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Actual Barcodes for Testing</span>
              <Button onClick={loadItems} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading items...</div>
            ) : items.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">ID: {item.item_id}</p>
                        <p className="text-sm text-gray-600">Barcode: {item.barcode_number}</p>
                      </div>
                      <Button
                        onClick={() => setTestBarcode(item.barcode_number)}
                        variant="outline"
                        size="sm"
                      >
                        Use for Test
                      </Button>
                    </div>
                    
                    {/* Barcode Image */}
                    {item.barcode && (
                      <div className="space-y-2">
                        <Label className="text-sm">Barcode Image:</Label>
                        <div className="bg-white p-2 border rounded">
                          <img 
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.barcode}`}
                            alt={`Barcode for ${item.name}`}
                            className="max-w-full h-16 object-contain"
                            onError={(e) => {
                              console.error('Failed to load barcode image:', item.barcode);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Scanner should read: <code>{item.barcode_number}</code>
                        </p>
                      </div>
                    )}

                    {/* QR Code Image */}
                    {item.qr_code && (
                      <div className="space-y-2">
                        <Label className="text-sm">QR Code Image:</Label>
                        <div className="bg-white p-2 border rounded">
                          <img 
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.qr_code}`}
                            alt={`QR code for ${item.name}`}
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                              console.error('Failed to load QR code image:', item.qr_code);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Scanner should read: <code>item:{item.id}</code>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No items found. Make sure you're logged in and items exist in the database.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Monitor */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Performance Monitor</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          >
            {showPerformanceMonitor ? 'Hide' : 'Show'} Monitor
          </Button>
        </div>
        
        {showPerformanceMonitor && <PerformanceMonitor />}
      </div>

      <SimpleScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        scanType={scanType}
      />
    </div>
  );
};

export default BarcodeTest; 