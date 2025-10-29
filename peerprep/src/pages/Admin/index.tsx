import {
  activateQuestionById,
  deactivateQuestionById,
  deleteQuestionById,
  editQuestionById,
  getQuestions,
} from "@/api/question-service";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import ActiveDialog from "@/pages/Admin/ActiveDialog";
import DeleteDialog from "@/pages/Admin/DeleteDialog";
import EditDialog from "@/pages/Admin/EditDialog";
import { type ColumnDef } from "@tanstack/react-table";
import DOMPurify from "dompurify";
import { BookOpen, EllipsisVertical } from "lucide-react";
import moment from "moment";
import { useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeDialogOpen, setActiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
              <ScrollArea className="max-h-[calc(0.75*100dvh)] p-3">
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
    {
      accessorKey: "action",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedQuestion(row.original);
                setEditDialogOpen(true);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedQuestion(row.original);
                setActiveDialogOpen(true);
              }}
            >
              {row.original.isActive ? "Mark as inactive" : "Mark as active"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedQuestion(row.original);
                setDeleteDialogOpen(true);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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

  const onEdit = async (values: any) => {
    try {
      await editQuestionById(selectedQuestion!._id, values);
      const { questions, updatedPagination } = await getQuestions({
        page: pagination.page,
      });
      setData(questions);
      setPagination(updatedPagination);
      toast.success("Question was edited successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onUpdateActive = async () => {
    const isActive = selectedQuestion!.isActive;
    try {
      if (isActive) {
        await deactivateQuestionById(selectedQuestion!._id);
      } else {
        await activateQuestionById(selectedQuestion!._id);
      }
      const { questions, updatedPagination } = await getQuestions({
        page: pagination.page,
      });
      setData(questions);
      setPagination(updatedPagination);
      toast.success("Question was updated successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDelete = async () => {
    try {
      await deleteQuestionById(selectedQuestion!._id);
      const { questions, updatedPagination } = await getQuestions({
        page: pagination.page,
      });
      setData(questions);
      setPagination(updatedPagination);
      toast.success("Question was deleted successfully");
    } catch (err) {
      toast.error(err.message);
    }
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
      <EditDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuestion(null);
          }
          setEditDialogOpen(open);
        }}
        question={selectedQuestion}
        onEdit={onEdit}
      />
      <ActiveDialog
        open={activeDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuestion(null);
          }
          setActiveDialogOpen(open);
        }}
        question={selectedQuestion}
        onUpdateActive={onUpdateActive}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuestion(null);
          }
          setDeleteDialogOpen(open);
        }}
        question={selectedQuestion}
        onDelete={onDelete}
      />
    </div>
  );
};

export default Admin;
