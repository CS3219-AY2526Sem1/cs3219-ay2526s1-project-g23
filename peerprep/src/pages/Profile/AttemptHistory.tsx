import { getUserAttempts, getQuestionById } from "@/api/question-service";
import { getUserStats } from "@/api/user-service";
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
  partnerId: string | null;
  questionId: string;
  title: string;
  difficulty: string;
  topics: string[];
  solution: string;
  timeTakenSeconds: number;
  createdAt: string;
};

interface Question {
  _id: string;
  title: string;
  content: string;
  topics: string[];
  difficulty: string;
}

const AttemptHistory = () => {
  const [loading, startTransition] = useTransition();
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [partnerNames, setPartnerNames] = useState<Record<string, string>>({});
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const attempts = await getUserAttempts();
        setData(attempts);

        // Collect unique non-null partner IDs
        const uniquePartnerIds: string[] = Array.from(
          new Set(
            attempts
              .map((a: Attempt) => a.partnerId)
              .filter(
                (id: string | null | undefined): id is string =>
                  typeof id === "string" && id.trim() !== ""
              )
          )
        );
        
        // Fetch usernames for each valid partner in parallel
        const partnerData = await Promise.all(
          uniquePartnerIds.map(async (id: string) => {
            try {
              const stats = await getUserStats(id);
              return { id, name: stats.username || "Unknown User" };
            } catch (err) {
              console.error("Error fetching partner info for", id, err);
              return { id, name: "Unknown User" };
            }
          })
        );

        // Convert to { partnerId: username } mapping
        const partnerMap: Record<string, string> = Object.fromEntries(
          partnerData.map((p) => [p.id, p.name])
        );

        setPartnerNames(partnerMap);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }, []);

  const handleViewSubmission = async (attempt: Attempt) => {
    setSelectedAttempt(attempt);
    setModalOpen(true);
    setQuestionLoading(true);
    try {
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
      accessorKey: "partnerId",
      header: "Partner",
      cell: ({ getValue }) => {
        const partnerId = getValue() as string | null;
        if (!partnerId) return <span className="text-gray-400">—</span>; // no partner
        return <span>{partnerNames[partnerId] || "Loading..."}</span>;
      },
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
            question &&
            selectedAttempt && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="prose max-w-none text-gray-700 border-r border-gray-200 pr-4 overflow-x-auto break-words">
                  <h3 className="font-semibold mb-3 text-lg">Question</h3>

                  <div className="mb-4 text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Difficulty:</strong> {question.difficulty}
                    </p>
                    {question.topics && question.topics.length > 0 && (
                      <p>
                        <strong>Topics:</strong>{" "}
                        {question.topics.map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="ml-1 text-xs"
                          >
                            {t}
                          </Badge>
                        ))}
                      </p>
                    )}
                  </div>

                  <div
                    className="[&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words"
                    dangerouslySetInnerHTML={{ __html: question.content }}
                  />
                </div>
                <div className="text-gray-800">
                  <h3 className="font-semibold mb-3 text-lg">
                    Your Submission
                  </h3>
                  <pre className="bg-gray-900 text-gray-100 rounded-md p-3 text-sm overflow-x-auto h-[70vh]">
                    {selectedAttempt.solution
                      ? selectedAttempt.solution
                      : "// No code found"}
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
