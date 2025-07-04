import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "../context/AuthContext";

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { userData, qrCode } = location.state || {};

  if (!userData || !qrCode) {
    navigate('/signup');
    return null;
  }

  const handleContinue = () => {
    login(userData, qrCode || '');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Registration Successful!</CardTitle>
          <CardDescription className="text-center">
            Your account has been created. Here's your QR code for future logins:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <img 
              src={qrCode} 
              alt="Login QR Code" 
              className="w-64 h-64 object-contain"
            />
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>Save this QR code for quick login access.</p>
            <p>You can also use your ID number and password to log in.</p>
          </div>
          <Button 
            className="w-full" 
            onClick={handleContinue}
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;
