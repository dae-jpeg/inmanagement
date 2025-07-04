import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (value: string) => void;
  scanType: 'qr' | 'barcode';
}

const CodeScanner: React.FC<CodeScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  scanType,
}) => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const readerRef = useRef<HTMLDivElement>(null);
  const lastErrorTime = useRef<number>(0);

  useEffect(() => {
    let currentScanner: Html5QrcodeScanner | null = null;

    const initializeScanner = async () => {
      if (!isOpen || !readerRef.current || isScanning) return;

      try {
        console.log(`Initializing ${scanType} scanner...`);
        setIsScanning(true);
        
        // Clear any existing scanner
        if (scanner) {
          scanner.clear();
          setScanner(null);
        }

        // Create new scanner with optimized settings for performance
        currentScanner = new Html5QrcodeScanner(
          'reader',
          {
            fps: scanType === 'barcode' ? 5 : 10, // Lower FPS for barcodes to reduce CPU usage
            qrbox: scanType === 'qr' ? { width: 250, height: 250 } : { width: 400, height: 100 },
            aspectRatio: scanType === 'qr' ? 1.0 : 2.0,
            formatsToSupport: scanType === 'qr' 
              ? [Html5QrcodeSupportedFormats.QR_CODE]
              : [
                  Html5QrcodeSupportedFormats.CODE_128,
                  Html5QrcodeSupportedFormats.EAN_13,
                  Html5QrcodeSupportedFormats.UPC_A,
                  Html5QrcodeSupportedFormats.CODE_39,
                  Html5QrcodeSupportedFormats.CODE_93,
                  Html5QrcodeSupportedFormats.EAN_8,
                  Html5QrcodeSupportedFormats.UPC_E,
                  Html5QrcodeSupportedFormats.CODABAR,
                  Html5QrcodeSupportedFormats.ITF
                ],
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: scanType === 'qr' ? 2 : 1,
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            // Performance optimizations
            disableFlip: true, // Disable image flipping to save CPU
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          false
        );

        await currentScanner.render(
          (decodedText) => {
            console.log(`Raw scanned text: "${decodedText}"`);
            console.log(`Scan type: ${scanType}`);
            
            // Handle successful scan
            if (scanType === 'barcode') {
              console.log('Processing barcode scan...');
              // For barcodes, we expect the format: BAR{item_id}
              if (decodedText.startsWith('BAR')) {
                console.log(`Barcode with BAR prefix: ${decodedText}`);
                onScanSuccess(decodedText);
              } else {
                // If it's a plain barcode number, format it
                const formattedBarcode = `BAR${decodedText}`;
                console.log(`Formatted barcode: ${formattedBarcode}`);
                onScanSuccess(formattedBarcode);
              }
            } else {
              console.log('Processing QR code scan...');
              // For QR codes, we expect the format: item:{uuid}
              console.log(`QR code data: ${decodedText}`);
              onScanSuccess(decodedText);
            }
            
            // Stop scanning after successful scan
            if (currentScanner) {
              currentScanner.clear();
            }
            setIsScanning(false);
            onClose();
          },
          (errorMessage) => {
            // Throttle error logging to prevent spam
            const now = Date.now();
            if (now - lastErrorTime.current > 2000) { // Only log errors every 2 seconds
              console.warn('Scan error (throttled):', errorMessage);
              lastErrorTime.current = now;
              setErrorCount(prev => prev + 1);
            }
            
            // Stop scanning if too many errors (prevents infinite loops)
            if (errorCount > 50) {
              console.error('Too many scan errors, stopping scanner');
              if (currentScanner) {
                currentScanner.clear();
              }
              setIsScanning(false);
              onClose();
            }
          }
        );

        setScanner(currentScanner);
        console.log(`${scanType} scanner initialized successfully`);
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
        setIsScanning(false);
      }
    };

    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(initializeScanner, 100);
      return () => {
        clearTimeout(timer);
        if (currentScanner) {
          currentScanner.clear();
        }
      };
    }

    return () => {
      if (currentScanner) {
        currentScanner.clear();
      }
      setIsScanning(false);
    };
  }, [isOpen, scanType, onScanSuccess, onClose, isScanning, errorCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
      setIsScanning(false);
    };
  }, [scanner]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Scan {scanType === 'qr' ? 'QR Code' : 'Barcode'}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div id="reader" ref={readerRef} className="w-full bg-white rounded-lg overflow-hidden" />
        {isScanning && (
          <div className="text-center text-sm text-gray-500 mt-2">
            Scanning... {errorCount > 0 && `(Errors: ${errorCount})`}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CodeScanner; 