// src/components/Success.tsx
import React, { useEffect, useState } from "react";

interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  profilePicture?: string;
}

const Success = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("userProfile");
    if (data) {
      setProfile(JSON.parse(data));
    }
  }, []);

  if (!profile) {
    return <div className="p-4 text-center">No profile data found.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">QR Code Generated Successfully!</h2>
        <p className="mb-2">Welcome, <strong>{profile.firstName} {profile.lastName}</strong>!</p>
        <p className="mb-4">User ID: <strong>{profile.userId}</strong></p>
        {profile.profilePicture && (
          <img
            src={profile.profilePicture}
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto mb-4 border-2 border-gray-300 object-cover"
          />
        )}
        <a href="/signup" className="text-blue-600 hover:underline">Back to Signup</a>
      </div>
    </div>
  );
};

export default Success;
