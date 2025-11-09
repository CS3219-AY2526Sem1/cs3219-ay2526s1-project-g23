import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Dispatch } from "react";

interface ActiveDialogProps {
  open: boolean;
  onOpenChange: Dispatch<any>;
  question: Question | null;
  onUpdateActive: () => void;
}

const ActiveDialog = ({
  open,
  onOpenChange,
  question,
  onUpdateActive,
}: ActiveDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will set the question{" "}
            <span className="font-bold">{question?.title}</span> as{" "}
            {question?.isActive ? "inactive" : "active"} in our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onUpdateActive}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ActiveDialog;
