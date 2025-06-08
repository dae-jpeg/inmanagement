import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Camera, QrCode } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import QRScanner from "./QRScanner";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const UserAuth = () => {
  const [formData, setFormData] = useState({
    idNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idNumber.trim()) {
      setError("ID number is required");
      return;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      const response = await api.post('/user-lookup/', {
        id_number: formData.idNumber,
        password: formData.password,
      });

      const result = response.data;

      if (result.status === 'success') {
        login(result.data);
        navigate("/actions");
      } else {
        setError(result.message || "Invalid ID number or password");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || "Error during login. Please try again.");
    }
  };

  const handleQRScanSuccess = (qrData: any) => {
    console.log('QR scan completed in UserAuth, data:', qrData);
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Inventory Management System
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showScanner && (
            <QRScanner
              isOpen={showScanner}
              onClose={() => setShowScanner(false)}
              onScanSuccess={handleQRScanSuccess}
            />
          )}
          {!showScanner && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  placeholder="Enter your ID number"
                  className="flex-1"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Scan QR Code
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            Login with your ID number and password or scan your QR code
          </span>
          <Button
            variant="link"
            onClick={() => navigate("/signup")}
            className="flex items-center gap-1"
          >
            <QrCode className="h-4 w-4" />
            Don't have an account? Create one
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserAuth;
