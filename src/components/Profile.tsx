import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, ArrowLeft, Camera, Upload, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  profilePicture?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Get user profile from localStorage
  const getUserProfile = (): UserProfile => {
    const profileData = localStorage.getItem("userProfile");
    if (profileData) {
      return JSON.parse(profileData);
    }
    return {
      id: user?.id || "",
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      middleInitial: "",
      profilePicture: "",
    };
  };

  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  // Redirect to login if no user data is found
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleBackToActions = () => {
    navigate("/actions");
  };

  const handleSaveProfile = () => {
    if (!profile.firstName || !profile.lastName) {
      setError("First name and last name are required");
      return;
    }

    // Save profile to localStorage
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setSuccess("Profile updated successfully");
    setIsEditing(false);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/png");
        setProfile({ ...profile, profilePicture: imageDataUrl });

        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());

        setShowCamera(false);
      }
    }
  };

  const cancelCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToActions}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">User Profile</h1>
        </div>
        <div className="text-sm font-medium">User ID: {user?.id}</div>
      </header>

      <main className="max-w-2xl mx-auto">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Personal Information</span>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 mb-2">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">
                        {profile.firstName && profile.lastName
                          ? `${profile.firstName[0]}${profile.lastName[0]}`
                          : "?"}
                      </span>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      className="flex items-center gap-1"
                    >
                      <Camera className="h-4 w-4" />
                      Camera
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="profile-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="middleInitial">
                    Middle Initial (Optional)
                  </Label>
                  <Input
                    id="middleInitial"
                    value={profile.middleInitial || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, middleInitial: e.target.value })
                    }
                    maxLength={1}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={profile.id}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setProfile(getUserProfile());
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>

        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 max-w-md w-full">
              <h3 className="text-lg font-medium mb-2">Take Profile Picture</h3>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-md"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={cancelCamera}>
                  Cancel
                </Button>
                <Button onClick={capturePhoto}>Capture</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
