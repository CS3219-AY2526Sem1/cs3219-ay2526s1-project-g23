import { getUserAttempts, getQuestionById } from "@/api/question-service";
import Spinner from "@/components/custom/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Attempt = {
  id: string;
  questionId: string;
  title: string;
  difficulty: string;
  topics: string[];
  timeTakenSeconds: number;
  createdAt: string;
};

interface Question {
  _id: string;
  title: string;
  content: string;
  difficulty: string;
}

const AttemptHistory = () => {
  const [loading, startTransition] = useTransition();
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const attempts = await getUserAttempts();
        setData(attempts);
      } catch (error) {
        setError(error.message);
      }
    });
  }, []);

  const handleViewSubmission = async (attempt: Attempt) => {
    setModalOpen(true);
    setSelectedAttempt(attempt);
    setQuestionLoading(true);
    try {
      console.log("Fetching question for attempt:", attempt);
      const q = await getQuestionById(attempt.questionId);
      setQuestion(q);
    } catch (err) {
      console.error(err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const columns: ColumnDef<Attempt>[] = [
    {
      accessorKey: "title",
      header: "Question",
    },
    {
      accessorKey: "topics",
      header: "Topic(s)",
      cell: ({ getValue }) =>
        (getValue() as string[]).map((topic) => (
          <Badge variant="outline">{topic}</Badge>
        )),
    },
    {
      accessorKey: "difficulty",
      header: "Difficulty",
    },
    {
      accessorKey: "timeTakenSeconds",
      header: "Time Taken",
      cell: ({ getValue }) => {
        const seconds = getValue() as number;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Attempted On",
      cell: ({ getValue }) =>
        moment(getValue() as string).format("DD/MM/YYYY HH:mm"),
    },
    {
      accessorKey: "action",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="text-indigo-600"
          onClick={() => handleViewSubmission(row.original)}
        >
          View Submission
        </Button>
      ),
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6">Attempt History</h2>
      <Card className="w-full">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <DataTable data={data} columns={columns} error={error} />
          )}
        </CardContent>
      </Card>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="!w-[95vw] !max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {question ? question.title : "Loading..."}
            </DialogTitle>
            <DialogDescription>
              Attempted on{" "}
              {moment(selectedAttempt?.createdAt).format("DD/MM/YYYY HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {questionLoading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner />
            </div>
          ) : (
            question && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Left side — Question */}
                <div className="prose max-w-none text-gray-700 border-r border-gray-200 pr-4 overflow-x-auto break-words">
                  <h3 className="font-semibold mb-3 text-lg">Question</h3>
                  <div
                    className="[&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words"
                    dangerouslySetInnerHTML={{ __html: question.content }}
                  />
                </div>

                {/* Right side — User Submission */}
                <div className="text-gray-800">
                  <h3 className="font-semibold mb-3 text-lg">
                    Your Submission
                  </h3>
                  <pre className="bg-gray-900 text-gray-100 rounded-md p-3 text-sm overflow-x-auto h-[70vh]">
                    {"// No code found"}
                  </pre>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AttemptHistory;
