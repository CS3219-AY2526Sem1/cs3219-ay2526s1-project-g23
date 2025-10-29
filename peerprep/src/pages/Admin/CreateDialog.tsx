import Spinner from "@/components/custom/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  difficultyLabels,
  topicLabels,
} from "@/pages/Homepage/matchingConstants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, type Dispatch } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface CreateDialogProps {
  open: boolean;
  onOpenChange: Dispatch<any>;
  onCreate: (values: any) => Promise<boolean>;
}

const formSchema = z.object({
  title: z.string().nonempty("This field is required"),
  content: z.string().nonempty("This field is required"),
  topics: z.array(z.string()).min(1, "This field is required"),
  difficulty: z.string().nonempty("This field is required"),
});

const topicOptions = Object.values(topicLabels).map((value) => ({
  value,
  label: value,
}));

const difficultyOptions = Object.values(difficultyLabels).map((value) => ({
  value,
  label: value,
}));

const CreateDialog = ({ open, onOpenChange, onCreate }: CreateDialogProps) => {
  const [loading, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      topics: [],
      difficulty: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const status = await onCreate(values);
      if (status) {
        form.reset();
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="min-w-[calc(0.5*100dvw)]">
        <DialogHeader>
          <DialogTitle>Create Question</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-0">
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-0">
                    Content <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea className="max-h-80" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-0">
                    Topics <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      className="font-normal [&_svg]:opacity-50"
                      options={topicOptions}
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select topic(s)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-0">
                    Difficulty <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} {...field}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map(({ label, value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner />} Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDialog;
