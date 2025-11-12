import {
  acceptMatchProposal,
  cancelMatchRequest,
  declineMatchProposal,
  getMatchStatus,
  submitMatchRequest,
} from "@/api/matching-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { io } from "socket.io-client";
import { toast } from "sonner";
import AcceptMatchModal from "./AcceptMatchModal";
import {
  difficultyLabels,
  MAX_RETRIES,
  proficiencyLabels,
  topicLabels,
} from "./matchingConstants";

type FormValues = {
  questionType: string;
  difficulty: string;
  proficiency: string;
};

export default function MatchPartnerSection() {
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    defaultValues: {
      questionType: "",
      difficulty: "",
      proficiency: "",
    },
  });

  const { watch, reset } = form;

  const questionType = watch("questionType");
  const difficulty = watch("difficulty");
  const proficiency = watch("proficiency");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [retryCount, setRetryCount] = useState(0);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<{
    proposalId: string;
    partnerId: string;
    sessionCriteria: any;
  } | null>(null);

  useEffect(() => {
    setRetryCount(0);
  }, [questionType, difficulty, proficiency]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (secondsLeft <= 0) {
      if (retryCount < MAX_RETRIES) {
        setShowTimeoutModal(true);
        setIsModalOpen(false);
      } else {
        setIsModalOpen(false);
        toast.error(
          "Sorry, no match found. Try changing your topic or proficiency level."
        );
        setRetryCount(0);
      }
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [isModalOpen, secondsLeft, retryCount, showTimeoutModal]);

  useEffect(() => {
    // Get backend URL from Vite env, fallback to localhost
    let BACKEND_URL =
      import.meta.env.VITE_MATCHING_SERVICE_URL || "http://localhost:3003";

    // If the URL starts with https://, convert to wss:// for Socket.IO
    if (BACKEND_URL.startsWith("https://")) {
      BACKEND_URL = BACKEND_URL.replace("https://", "wss://");
    }

    // Initialize Socket.IO
    const socket = io(BACKEND_URL, {
      auth: { token: localStorage.getItem("jwtToken") },
    });

    socket.on("notification", async (event) => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Blocking delay to ease state changes

      if (event.type == "match_proposal") {
        // Save proposal info and show accept/decline modal
        setActiveProposal({
          proposalId: event.proposalId,
          partnerId: event.partnerId,
          sessionCriteria: event.sessionCriteria,
        });
        setIsAcceptModalOpen(true); // New modal for accept/decline
        setIsModalOpen(false); // Close the "searching" modal
      }

      if (event.type === "match_declined") {
        toast.info(event.message || "Your match partner declined the match.");
        setIsAcceptModalOpen(false);
        setActiveProposal(null);
        setIsModalOpen(true); // Optionally reopen the queue/search modal
      }

      if (event.type == "match_confirmed") {
        navigate(`/collaborate/${event.sessionId}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRetry = async () => {
    try {
      await submitMatchRequest({
        topic: questionType,
        difficulty: difficulty,
        proficiency: proficiency,
        language: "python", // optional, defaults to python
      });
      setRetryCount((prev) => prev + 1);
      setSecondsLeft(30); // reset timer
      setShowTimeoutModal(false);
      setIsModalOpen(true);
      toast.success("Retrying to find a match...");
    } catch (err: any) {
      toast.error(err.message || "Failed to retry matching request");
    }
  };

  const onSubmit = async () => {
    try {
      const response = await getMatchStatus();
      if (response?.status != "none") {
        toast.info(
          response.status == "active"
            ? "An active collaboration session exists"
            : "Waiting for partner..."
        );
        return;
      }

      await submitMatchRequest({
        topic: questionType,
        difficulty: difficulty,
        proficiency: proficiency,
        language: "python", // optional, defaults to python
      });
      toast.info("Searching for a partner...");
      setIsModalOpen(true);
      setSecondsLeft(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to start matching request");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMatchRequest();
      toast.info("Match request cancelled");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel request");
    } finally {
      setShowTimeoutModal(false);
      setIsModalOpen(false);
      setRetryCount(0);
    }
  };

  const handleAccept = async () => {
    if (!activeProposal) return;
    try {
      await acceptMatchProposal(activeProposal.proposalId);
      toast.success("You accepted the match! Waiting for partner...");
      setIsAcceptModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept match");
    }
  };

  const handleDecline = async () => {
    if (!activeProposal) return;
    try {
      await declineMatchProposal(activeProposal.proposalId);
      toast.info("You declined the match");
      setIsAcceptModalOpen(false);
      setActiveProposal(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Start A Practice Session
      </h2>

      <Card className="p-5 max-w-2xl mx-auto text-xl">
        <CardHeader>
          <CardTitle className="text-center">Select Your Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 w-full">
                <FormField
                  control={form.control}
                  name="questionType"
                  rules={{ required: "Please select a topic" }}
                  render={({ fieldState }) => (
                    <FormItem className="flex-1 w-full">
                      <Controller
                        control={form.control}
                        name="questionType"
                        render={({ field }) => (
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={`w-full ${
                                  fieldState.error
                                    ? "border-red-600 ring-1 ring-red-600"
                                    : ""
                                }`}
                              >
                                <SelectValue placeholder="Question Topic" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(topicLabels).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}
                      />
                      {fieldState.error && (
                        <FormMessage className="break-words text-sm">
                          {fieldState.error.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  rules={{ required: "Please select difficulty" }}
                  render={({ fieldState }) => (
                    <FormItem className="flex-1 w-full">
                      <Controller
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={`w-full ${
                                  fieldState.error
                                    ? "border-red-600 ring-1 ring-red-600"
                                    : ""
                                }`}
                              >
                                <SelectValue placeholder="Difficulty Level" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(difficultyLabels).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}
                      />
                      {fieldState.error && (
                        <FormMessage className="break-words text-sm">
                          {fieldState.error.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proficiency"
                  rules={{ required: "Please select proficiency" }}
                  render={({ fieldState }) => (
                    <FormItem className="flex-1 w-full">
                      <Controller
                        control={form.control}
                        name="proficiency"
                        render={({ field }) => (
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={`w-full ${
                                  fieldState.error
                                    ? "border-red-600 ring-1 ring-red-600"
                                    : ""
                                }`}
                              >
                                <SelectValue placeholder="Proficiency Level" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(proficiencyLabels).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}
                      />
                      {fieldState.error && (
                        <FormMessage className="break-words text-sm">
                          {fieldState.error.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <div className="self-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="sm:col-span-3 mt-2 flex gap-4">
                <Button type="submit" className="flex-1">
                  Search Partner
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
          setIsModalOpen(open);
        }}
      >
        <DialogContent
          className="max-w-md text-center"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Finding Partner...
            </DialogTitle>
          </DialogHeader>

          <p className="text-base text-gray-400 italic">
            Please wait while we find a match for you.
          </p>

          <div className="text-base">
            <p>
              <span className="font-semibold">Topic:</span>{" "}
              {questionType ? topicLabels[questionType] : "—"}
            </p>
            <p>
              <span className="font-semibold">Difficulty:</span>{" "}
              {difficulty ? difficultyLabels[difficulty] : "—"}
            </p>
            <p>
              <span className="font-semibold">Proficiency:</span>{" "}
              {proficiency ? proficiencyLabels[proficiency] : "—"}
            </p>
          </div>

          <p>
            <Timer className="inline mb-1 mr-1 w-8 h-8" />
            <span className="font-semibold">{secondsLeft}s</span>
          </p>
          <div>
            <Button variant="default" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showTimeoutModal}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-center">
              Unable to find a match
            </DialogTitle>
          </DialogHeader>

          <p className="text-base text-muted-foreground">
            Sorry, no match was found. You have {MAX_RETRIES - retryCount}{" "}
            {MAX_RETRIES - retryCount === 1 ? "retry" : "retries"} left.
          </p>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AcceptMatchModal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        partnerId={activeProposal?.partnerId ?? ""}
        sessionCriteria={activeProposal?.sessionCriteria ?? {}}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </section>
  );
}
