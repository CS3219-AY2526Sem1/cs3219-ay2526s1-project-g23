import Spinner from "@/components/custom/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z
  .object({
    oldPassword: z.string().nonempty(),
    newPassword: z
      .string()
      .regex(/^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\d))[A-Za-z\d]{8,}$/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword == data.confirmPassword, {
    message: "Passwords does not match",
    path: ["confirmPassword"],
  });

const ChangePassword = () => {
  const [loading, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onChangePassword = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        // TODO: Send API request
      } catch (error) {
        toast.error(error.message);
      }
    });
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6">Security</h2>
      <Card className="w-full">
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onChangePassword)}
              className="w-fit text-right space-y-6 mx-auto"
            >
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-center gap-7">
                      <FormLabel className="min-w-32 gap-0">
                        Current Password{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="min-w-72"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex justify-center gap-7">
                      <FormLabel className="min-w-32 gap-0">
                        New Password <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="min-w-72"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    {fieldState.error && (
                      <div className="ml-[156px] text-left text-sm text-destructive ">
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-center gap-7">
                      <FormLabel className="min-w-32 gap-0">
                        Confirm Password{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="min-w-72"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-[156px] text-left" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={
                  loading ||
                  (Object.keys(form.formState.errors).length == 0 &&
                    Object.keys(form.formState.dirtyFields).length !=
                      Object.keys(form.formState.defaultValues as Object)
                        .length)
                }
              >
                {loading && <Spinner />} Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
};

export default ChangePassword;
