import React from "react";
import { Button } from "@/components/ui/button"; // adjust this if needed
import { useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Success!</h1>
        <p className="text-gray-600 mb-6">QR code generated and saved successfully.</p>
        <Button onClick={() => navigate("/actions")} className="w-full">
          Go Back to Actions
        </Button>
      </div>
    </div>
  );
};

export default SuccessPage;
