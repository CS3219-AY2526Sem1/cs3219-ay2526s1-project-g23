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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  password: z
    .string()
    .regex(/^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\d))[A-Za-z\d]{8,}$/),
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        // @ts-ignore
        const message = await resetPassword({ token, ...values });
        toast.success(message);
        navigate("/login");
      } catch (error) {
        toast.error(error.message);
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Reset Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  {fieldState.error && (
                    <div className="text-sm text-destructive ">
                      Password must contain:
                      <ul className="ml-6 list-disc [&>li]:mt-0.5">
                        <li>At least 8 characters</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one number</li>
                      </ul>
                    </div>
                  )}
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner />} Submit
            </Button>
            <div className="text-center text-sm">
              Request for a new reset token{" "}
              <Link
                to="/forgot-password"
                className="underline underline-offset-4"
              >
                here
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;
