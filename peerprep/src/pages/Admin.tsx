import { getQuestions } from "@/api/question-service";
import Spinner from "@/components/custom/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ColumnDef } from "@tanstack/react-table";
import DOMPurify from "dompurify";
import { BookOpen } from "lucide-react";
import moment from "moment";
import { useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Question = {
  _id: string;
  title: string;
  content: string;
  difficulty: string;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

const columns: ColumnDef<Question>[] = [
  {
    accessorKey: "title",
    header: "Question",
    cell: ({ getValue, row }) => (
      <div className="flex gap-1 items-center">
        {getValue() as string}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost">
              <BookOpen />
            </Button>
          </DialogTrigger>
          <DialogContent className="min-w-[calc(0.75*100dvw)]">
            <DialogTitle>{getValue() as string}</DialogTitle>
            <ScrollArea className="max-h-[calc(0.75*100dvh)]">
              <div
                className="prose prose-sm [&>*]:text-wrap"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(row.original.content),
                }}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    ),
  },
  {
    accessorKey: "topics",
    header: "Topic(s)",
    cell: ({ getValue }) => (
      <div className="flex flex-wrap gap-1">
        {(getValue() as string[]).map((topic) => (
          <Badge variant="outline">{topic}</Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
  },
  {
    accessorKey: "createdAt",
    header: "Created On",
    cell: ({ getValue }) =>
      moment(getValue() as string).format("DD/MM/YYYY HH:mm"),
  },
  {
    accessorKey: "updatedAt",
    header: "Upated On",
    cell: ({ getValue }) =>
      moment(getValue() as string).format("DD/MM/YYYY HH:mm"),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge className="bg-lime-500 text-white dark:bg-lime-600">
          Active
        </Badge>
      ) : (
        <Badge variant="destructive">Inactive</Badge>
      ),
  },
];

const Admin = () => {
  const isAdmin = localStorage.getItem("isAdmin") == "true";
  const navigate = useNavigate();
  const [loading, startTransition] = useTransition();
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 0,
    limit: 10,
    total: 0,
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
    startTransition(async () => {
      try {
        const { questions, pagination } = await getQuestions({ page: 1 });
        setData(questions);
        setPagination(pagination);
      } catch (error) {
        toast.error("Failed to fetch questions");
      }
    });
  }, []);

  const onPageChange = async (next = true) => {
    const page = next ? pagination.page + 1 : pagination.page - 1;
    const { questions, pagination: updatedPagination } = await getQuestions({
      page,
    });
    setData(questions);
    setPagination(updatedPagination);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="w-full py-10 px-8">
      <DataTable
        data={data}
        columns={columns}
        pagination={{ ...pagination, onPageChange }}
      />
    </div>
  );
};

export default Admin;
