import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Timer } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm, Controller } from "react-hook-form";

const topicLabels: Record<string, string> = {
  "binary-search": "Binary Search",
  "linked-list": "Linked List",
  stack: "Stack",
  graph: "Graph",
  sorting: "Sorting",
  tree: "Tree",
  "dynamic-programming": "Dynamic Programming",
  greedy: "Greedy",
};

const difficultyLabels: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const proficiencyLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const MAX_RETRIES = 2;

type FormValues = {
  questionType: string;
  difficulty: string;
  proficiency: string;
};

export default function MatchPartnerSection() {
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

  useEffect(() => {
    setRetryCount(0);
  }, [questionType, difficulty, proficiency]);

  const onSubmit = () => {
    setIsModalOpen(true);
    setSecondsLeft(30);
    toast.info("Searching for a partner...");
  };

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

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setSecondsLeft(30); // reset timer
    setShowTimeoutModal(false);
    setIsModalOpen(true);
    toast.success("Retrying to find a match...");
  };

  const handleCancel = () => {
    setShowTimeoutModal(false);
    setIsModalOpen(false);
    setRetryCount(0);
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md text-center">
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
            <Button
              variant="default"
              onClick={() => {
                setIsModalOpen(false);
                setRetryCount(0);
              }}
            >
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
    </section>
  );
}
