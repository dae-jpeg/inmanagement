import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Toggle } from "./ui/toggle";

interface AuthActionFlowProps {
  isOpen?: boolean;
  onClose?: () => void;
  itemId?: string;
  itemName?: string;
}

type Step = "auth" | "action" | "confirmation";
type Action = "withdraw" | "return" | null;
type Status = "success" | "error" | null;

const AuthActionFlow = ({
  isOpen = true,
  onClose = () => {},
  itemId = "ITEM-001",
  itemName = "Office Laptop",
}: AuthActionFlowProps) => {
  const [step, setStep] = useState<Step>("auth");
  const [userId, setUserId] = useState<string>("");
  const [action, setAction] = useState<Action>(null);
  const [status, setStatus] = useState<Status>(null);
  const [error, setError] = useState<string>("");

  const handleUserIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError("User ID is required");
      return;
    }

    // Simulate validation - in a real app, this would be an API call
    if (userId.length < 3) {
      setError("Invalid User ID format");
      return;
    }

    setError("");
    setStep("action");
  };

  const handleActionSelect = (selectedAction: Action) => {
    setAction(selectedAction);

    // Simulate processing - in a real app, this would be an API call
    setTimeout(() => {
      // Simulate success (you could add logic for failure cases)
      setStatus("success");
      setStep("confirmation");
    }, 1000);
  };

  const handleClose = () => {
    // Reset state
    setStep("auth");
    setUserId("");
    setAction(null);
    setStatus(null);
    setError("");
    onClose();
  };

  const handleRetry = () => {
    setStep("action");
    setStatus(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        {step === "auth" && (
          <>
            <DialogHeader>
              <DialogTitle>User Authentication</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUserIdSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Enter your User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User ID"
                  autoFocus
                />
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Scanning item: <span className="font-medium">{itemName}</span>{" "}
                (ID: {itemId})
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">Continue</Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "action" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm">
                <p>
                  User ID: <span className="font-medium">{userId}</span>
                </p>
                <p>
                  Item: <span className="font-medium">{itemName}</span> (ID:{" "}
                  {itemId})
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium">
                  What would you like to do?
                </p>
                <div className="flex space-x-2">
                  <Toggle
                    pressed={action === "withdraw"}
                    onPressedChange={() => setAction("withdraw")}
                    className="flex-1 data-[state=on]:bg-blue-600"
                  >
                    Withdraw
                  </Toggle>
                  <Toggle
                    pressed={action === "return"}
                    onPressedChange={() => setAction("return")}
                    className="flex-1 data-[state=on]:bg-green-600"
                  >
                    Return
                  </Toggle>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("auth")}
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleActionSelect(action)}
                  disabled={!action}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </div>
          </>
        )}

        {step === "confirmation" && (
          <>
            <DialogHeader>
              <DialogTitle>
                Transaction {status === "success" ? "Complete" : "Failed"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {status === "success" ? (
                <>
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-lg">Success!</h3>
                    <p className="text-sm text-muted-foreground">
                      You have successfully{" "}
                      {action === "withdraw" ? "withdrawn" : "returned"}{" "}
                      {itemName}.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-red-100 p-3">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-lg">Transaction Failed</h3>
                    <p className="text-sm text-muted-foreground">
                      There was an error processing your request. Please try
                      again.
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              {status === "success" ? (
                <Button onClick={handleClose}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleRetry}>Retry</Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthActionFlow;
