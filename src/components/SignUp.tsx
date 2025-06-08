import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Download, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";

interface UserProfile {
  idNumber: string;
  password: string;
  firstName: string;
  lastName: string;
}

const SignUp = () => {
  const [formData, setFormData] = useState<UserProfile>({
    idNumber: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form data
    if (!formData.idNumber.trim()) {
      setError("ID number is required");
      return;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return;
    }

    // Validate ID number format (only numbers)
    if (!/^\d+$/.test(formData.idNumber)) {
      setError("ID number must contain only numbers");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_number: formData.idNumber,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          user_level: 'USER'  // Add default user level
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating account');
      }

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess(true);
        setQrCodeUrl(result.data.qr_code);
        
        // Store tokens
        localStorage.setItem('access_token', result.data.tokens.access);
        localStorage.setItem('refresh_token', result.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify({
          id: result.data.id,
          id_number: result.data.id_number,
          first_name: result.data.first_name,
          last_name: result.data.last_name,
          qr_code: result.data.qr_code
        }));
      } else {
        setError(result.message || 'Error creating account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Error creating account. Please try again.');
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qr-code-${formData.idNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  placeholder="Enter your ID number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Last name"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium">Account Created Successfully!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your account has been created. Save your QR code to login easily.
                  </p>
                  <p className="text-sm font-medium mt-2">
                    Your ID Number: {formData.idNumber}
                  </p>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <img src={qrCodeUrl} alt="Login QR Code" className="w-48 h-48" />
                  </div>
                  <Button onClick={handleDownloadQR} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Go to Login
                </Button>
                <Button onClick={() => navigate("/actions")}>
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Already have an account? Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUp;
