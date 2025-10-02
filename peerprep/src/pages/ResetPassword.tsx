import { resetPassword } from "@/api/user-service";
import Spinner from "@/components/custom/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  email: z.email(),
});

const ResetPassword = () => {
  const [loading, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        await resetPassword(values);
        toast.success("Request submitted successfully");
      } catch (error) {
        toast.error(error.message);
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Reset Password</CardTitle>
        <CardDescription>
          We will send you a reset password link if the email is linked to an
          account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-0">Email</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner />} Submit
            </Button>
            <div className="text-center text-sm">
              Remember your password?{" "}
              <Link to="/login" className="underline underline-offset-4">
                Login now
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;
