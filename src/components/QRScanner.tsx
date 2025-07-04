import React, { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertCircle } from "lucide-react";
import { Html5QrcodeScanner } from 'html5-qrcode';

// Custom ViewFinder component
const ViewFinder = () => (
  <>
    <svg
      className="absolute top-0 left-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d="M25 2 L2 2 L2 25"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M2 75 L2 98 L25 98"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M75 98 L98 98 L98 75"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M98 25 L98 2 L75 2"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />
    </svg>
  </>
);

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (itemId: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const hasScanned = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize scanner
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          if (!hasScanned.current) {
            hasScanned.current = true;
            setIsScanning(false);
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          if (!errorMessage.includes("No QR code found")) {
            console.warn('QR Scanner error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize QR scanner:', err);
      setError('Failed to initialize camera. Please check permissions.');
      setIsScanning(false);
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          console.warn('Error clearing scanner:', err);
        }
      }
    };
  }, [isOpen, onScanSuccess]);

  const handleClose = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error clearing scanner:', err);
      }
    }
    setIsScanning(false);
    hasScanned.current = false;
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            Scan QR Code
          </h3>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 text-center mb-4">
          Place the QR code inside the frame to scan.
        </p>
        
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        
        <div className="relative w-full aspect-square overflow-hidden rounded-lg border">
          <ViewFinder />
          <div 
            id="qr-reader" 
            ref={containerRef}
            className="w-full h-full"
          />
          
          {!isScanning && !error && (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Initializing camera...</p>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleClose}
          variant="outline"
          className="w-full mt-6"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default React.memo(QRScanner);
