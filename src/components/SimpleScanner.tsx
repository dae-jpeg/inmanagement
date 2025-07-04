import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X, Camera, AlertCircle } from 'lucide-react';

interface SimpleScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (value: string) => void;
  scanType: 'qr' | 'barcode';
}

const SimpleScanner: React.FC<SimpleScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  scanType,
}) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsInitializing(true);
      setError(null);
      
      // Use a timeout to ensure the dialog and its DOM elements are fully rendered
      const startTimeout = setTimeout(async () => {
        const readerElement = document.getElementById('reader');
        if (!readerElement) {
          setError('Scanner UI failed to load. Please close and try again.');
          setIsInitializing(false);
          return;
        }

        try {
          const html5QrCode = new Html5Qrcode("reader");
          html5QrCodeRef.current = html5QrCode;
          
          // Get available cameras
          const devices = await Html5Qrcode.getCameras();
          
          if (devices && devices.length > 0) {
            const cameraId = devices[0].id;
            const config = {
              fps: 5,
              qrbox: scanType === 'qr' ? { width: 250, height: 250 } : { width: 400, height: 150 },
              aspectRatio: scanType === 'qr' ? 1.0 : 2.5,
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
              disableFlip: true,
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              }
            };

            await html5QrCode.start(
              { deviceId: { exact: cameraId } },
              config,
              (decodedText) => {
                onScanSuccess(decodedText.trim());
                handleClose();
              },
              (errorMessage) => {
                // This callback can be noisy, so we don't set an error here.
                // It's called frequently when no code is found.
                console.debug('Scanning...', errorMessage);
              }
            );
            
            setIsScanning(true);
            setIsInitializing(false);
          } else {
            setError('No camera available. Please connect a camera and grant access.');
            setIsInitializing(false);
          }
        } catch (err: any) {
          console.error("Scanner error:", err);
          
          if (err.name === 'NotAllowedError') {
            setError('Camera access denied. Please allow camera permissions in your browser.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found. Please connect a camera.');
          } else if (err.name === 'NotSupportedError') {
            setError('Camera not supported in this browser.');
          } else if (err.message?.includes('play')) {
            setError('Camera is already in use. Please close other applications using the camera.');
          } else {
            setError('Failed to start camera. Please check permissions and refresh.');
          }
          
          setIsInitializing(false);
        }
      }, 500); // Increased delay to ensure DOM is ready

      return () => {
        clearTimeout(startTimeout);
        if (html5QrCodeRef.current?.isScanning) {
          html5QrCodeRef.current.stop().catch(err => {
            // This can throw an error if the scanner is already stopped, so we'll just log it.
            console.warn("Error while stopping the scanner:", err);
          });
        }
      };
    }
  }, [isOpen, scanType, onScanSuccess]);

  const handleClose = () => {
    setIsScanning(false);
    setIsInitializing(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Scan {scanType === 'qr' ? 'QR Code' : 'Barcode'}</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Point your camera at the {scanType === 'qr' ? 'QR code' : 'barcode'} to scan it, or enter the ID manually below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          
          <div 
            id="reader" 
            className="w-full bg-white rounded-lg overflow-hidden border min-h-[300px] flex items-center justify-center"
          />
          
          {isInitializing && !error && (
            <div className="text-center text-sm text-gray-500">
              <Camera className="h-4 w-4 inline mr-2 animate-pulse" />
              Initializing camera...
            </div>
          )}
          
          {isScanning && !error && (
            <div className="text-center text-sm text-gray-500">
              <Camera className="h-4 w-4 inline mr-2 animate-pulse" />
              Scanning for {scanType === 'qr' ? 'QR code' : 'barcode'}...
            </div>
          )}
          
          {!isScanning && !isInitializing && !error && (
            <div className="text-center text-sm text-gray-500">
              Camera ready
            </div>
          )}

          {/* Manual entry for barcode mode */}
          {scanType === 'barcode' && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="Enter item ID if barcode can't be scanned"
                className="border rounded px-3 py-2 w-full max-w-xs text-center"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && manualBarcode.trim()) {
                    onScanSuccess(manualBarcode.trim());
                    setManualBarcode('');
                    handleClose();
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (manualBarcode.trim()) {
                    onScanSuccess(manualBarcode.trim());
                    setManualBarcode('');
                    handleClose();
                  }
                }}
                className="w-full max-w-xs"
                disabled={!manualBarcode.trim()}
              >
                Submit Item ID
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleScanner; 