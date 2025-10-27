import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { getUserStats } from "@/api/user-service";
import { difficultyLabels, topicLabels } from "./matchingConstants";
import { getMatchStatus } from "@/api/matching-service";
import { toast } from "sonner";

interface AcceptMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  sessionCriteria: any;
  onAccept: () => void;
  onDecline: () => void;
}

const AcceptMatchModal: React.FC<AcceptMatchModalProps> = ({
  isOpen,
  onClose,
  partnerId,
  sessionCriteria,
  onAccept,
  onDecline,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [partnerUsername, setPartnerUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !partnerId) return;

    const pollStatus = async () => {
      try {
        const status = await getMatchStatus();
        if (status?.status === "none") {
          onDecline();
          onClose();
          toast.info("Match has been cancelled by partner or server.");
        }
      } catch (err) {
        console.error("Failed to poll match status", err);
      }
    };

    const interval = setInterval(pollStatus, 1000); // poll every second

    return () => clearInterval(interval);
  }, [isOpen, partnerId, onDecline, onClose]);

  useEffect(() => {
    if (!isOpen || !partnerId) return;

    const fetchUsername = async () => {
      setLoading(true);
      try {
        const stats = await getUserStats(partnerId);
        setPartnerUsername(stats.username);
      } catch (err) {
        console.error("Failed to fetch partner username", err);
        setPartnerUsername("Unknown");
      } finally {
        setLoading(false);
      }
    };

    fetchUsername();
  }, [isOpen, partnerId]);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(10); // reset when modal closes
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (secondsLeft <= 0 && isOpen) {
      onDecline(); // auto-decline
      onClose(); // close modal
    }
  }, [secondsLeft, isOpen, onDecline, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Match Found!
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 text-center space-y-2">
          {loading ? (
            <p>Loading partner info...</p>
          ) : (
            <p>
              You have been paired with <strong>{partnerUsername}</strong>
            </p>
          )}
          <p>
            Session Topic:{" "}
            <strong>
              {sessionCriteria.topic
                ? topicLabels[sessionCriteria.topic] || sessionCriteria.topic
                : "—"}
            </strong>
          </p>
          <p>
            Difficulty:{" "}
            <strong>
              {sessionCriteria.difficulty
                ? difficultyLabels[sessionCriteria.difficulty] ||
                  sessionCriteria.difficulty
                : "—"}
            </strong>
          </p>
          <p>
            Language: <strong>{sessionCriteria.language}</strong>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            <Timer className="inline mb-1 mr-1 w-6 h-6" />
            Auto-declining in <strong>{secondsLeft}s</strong>
          </p>
        </div>

        <DialogFooter className="mt-6 flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              onDecline();
              onClose();
            }}
          >
            Decline
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              onAccept();
              onClose();
            }}
          >
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptMatchModal;
