import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import api from '@/utils/api';
import { QrCode } from 'lucide-react';
import QRScanner from './QRScanner';

const UserAuth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isQRScannerOpen, setQRScannerOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Login Failed",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Get the access and refresh tokens
      const tokenResponse = await api.post('/token/', {
        username,
        password,
      });
      const { access, refresh } = tokenResponse.data;

      // Store both tokens in localStorage
      localStorage.setItem('refresh_token', refresh);

      // Step 2: Use the token to get user profile
      const profileResponse = await api.get('/profile/', {
        headers: {
          Authorization: `Bearer ${access}`
        }
      });

      // Step 3: Call login from AuthContext
      login(profileResponse.data, access);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${profileResponse.data.username}!`,
      });
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.detail || 'An unexpected error occurred.';
      toast({
        title: "Login Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleQRLogin = useCallback(async (scannedData: string) => {
    setQRScannerOpen(false);
    try {
      // Extract only the UUID if the scanned data is in the format 'login_token:<uuid>'
      let loginToken = scannedData;
      if (loginToken.startsWith('login_token:')) {
        loginToken = loginToken.replace('login_token:', '');
      }
      // Send the UUID to the backend
      const response = await api.post('/qr-login/', { login_token: loginToken });
      const { access, refresh, user: userData } = response.data;
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      // Log in the user
      login(userData, access);
      toast({
        title: 'QR Login Successful',
        description: `Welcome, ${userData.username || userData.first_name}!`,
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('QR login error:', error);
      const errorMsg = error.response?.data?.detail || 'QR login failed.';
      toast({
        title: 'QR Login Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  }, [login, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {isQRScannerOpen ? (
            <QRScanner
              isOpen={isQRScannerOpen}
              onScan={handleQRLogin}
              onClose={() => setQRScannerOpen(false)}
            />
          ) : (
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-2 mt-4">
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setQRScannerOpen(true)}>
                      <QrCode className="mr-2 h-4 w-4"/> Scan QR Code
                  </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAuth;
