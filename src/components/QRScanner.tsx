import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Camera, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsQR from "jsqr";
import api from "../utils/api";
import { useAuth } from "@/context/AuthContext";

interface QRScannerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onScanSuccess?: (qrData: string) => void;
}

const QRScanner = ({
  isOpen,
  onClose = () => {},
  onScanSuccess = () => {},
}: QRScannerProps) => {
  const navigate = useNavigate();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  console.log(isOpen);
  // Request camera permission and setup video stream
  const setupCamera = async () => {
    try {
      setIsScanning(true);
      setScanError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
      setScanError("Unable to access camera. Please check permissions.");
    }
  };

  // Clean up video stream when component unmounts or dialog closes
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();

      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);
  };

  // Start scanning for QR codes
  const startScanning = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    scanIntervalRef.current = window.setInterval(() => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        // Draw video frame to canvas
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Get image data for QR code scanning
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          // Handle QR code data
          handleScanSuccess(code.data);
        }
      }
    }, 100);
  };
  const { login } = useAuth();
  const handleScanSuccess = async (qrData: unknown) => {
    console.log('Raw QR data received:', qrData);
    
    try {
      // Ensure qrData is a string
      if (typeof qrData !== 'string') {
        throw new Error('Invalid QR code data type');
      }

      // Stop scanning immediately after getting valid data
      stopCamera();

      // Check if it's a login QR code
      if (qrData.startsWith('login_token:')) {
        const loginToken = qrData.split(':')[1].trim();
        console.log('Extracted login token:', loginToken);
        
        const response = await api.post('/qr-login/', {
          login_token: loginToken
        });

        console.log('API Response:', response);
        const result = response.data;

        if (result.status === 'success') {
          console.log('Login successful, storing user data...');
          // Store tokens and user data
          localStorage.setItem('access_token', result.data.tokens.access);
          localStorage.setItem('refresh_token', result.data.tokens.refresh);
          const userData = {
            id: result.data.id,
            id_number: result.data.id_number,
            first_name: result.data.first_name,
            last_name: result.data.last_name,
            user_level: result.data.user_level,
            qr_code: result.data.qr_code
          };
          localStorage.setItem('user', JSON.stringify(userData));
          
          login(result.data);
          onClose();
          navigate("/actions");
        } else {
          setScanError(result.message || 'Invalid login QR code');
          setupCamera(); // Restart scanning
        }
      } else if (qrData.startsWith('item:')) {
        // Handle new format item QR code
        const itemId = qrData.split(':')[1].trim();
        console.log('Extracted item ID:', itemId);
        onClose();
        onScanSuccess(itemId);
      } else {
        // Try to handle as legacy item QR code (just UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(qrData)) {
          console.log('Detected legacy item QR code format');
          onClose();
          onScanSuccess(qrData);
        } else {
          setScanError('Invalid QR code format');
          setupCamera(); // Restart scanning
        }
      }
    } catch (error: any) {
      console.error('QR scan error:', error);
      setScanError(error.response?.data?.message || 'Error processing QR code. Please try again.');
      setupCamera(); // Restart scanning
    }
  };

  const handleClose = () => {
    console.log('close');
    stopCamera();
    onClose();
  };

  // Setup camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      setupCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Start scanning once video is ready
  useEffect(() => {
    if (hasPermission && videoRef.current) {
      const handleVideoReady = () => {
        startScanning();
      };

      videoRef.current.addEventListener("loadeddata", handleVideoReady);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener("loadeddata", handleVideoReady);
        }
      };
    }
  }, [hasPermission]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span>Scan QR Code</span>
          </DialogTitle>
          <DialogDescription>
            Position the QR code within the frame to scan it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center">
          {hasPermission === false && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {scanError ||
                  "Camera permission denied. Please enable camera access."}
              </AlertDescription>
            </Alert>
          )}

          <Card className="relative overflow-hidden w-full aspect-square max-w-sm mx-auto bg-black">
            {/* Video feed */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              aria-label="Camera feed for QR code scanning"
            />

            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-primary/50 flex items-center justify-center">
              <div className="w-3/4 h-3/4 border-2 border-primary animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
              </div>
            </div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          </Card>

          <div className="flex justify-between w-full mt-4">
            <Button variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (!isScanning) {
                  setupCamera();
                }
              }}
              disabled={isScanning}
            >
              <Camera className="mr-2 h-4 w-4" />
              {isScanning ? "Scanning..." : "Restart Scan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
