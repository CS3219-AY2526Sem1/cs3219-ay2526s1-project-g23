import { getUserAttempts } from "@/api/question-service";
import Spinner from "@/components/custom/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import { useEffect, useState, useTransition } from "react";
import { Link } from "react-router";

type Attempt = {
  id: string;
  title: string;
  difficulty: string;
  topics: string[];
  timeTakenSeconds: number;
  createdAt: string;
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
      <Link
        to={`/attempt/${row.original.id}`}
        className="hover:underline text-indigo-600"
      >
        View Submission
      </Link>
    ),
  },
];

const AttemptHistory = () => {
  const [loading, startTransition] = useTransition();
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

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
    </section>
  );
};

export default AttemptHistory;
