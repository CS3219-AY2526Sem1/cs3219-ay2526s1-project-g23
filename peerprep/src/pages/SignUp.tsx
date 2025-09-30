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
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { z } from "zod";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .regex(/^(?!.*__)[a-zA-Z0-9](?:[a-zA-Z0-9_]*[a-zA-Z0-9])?$/),
  email: z.email("Email address is invalid"),
  password: z
    .string()
    .regex(/^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\d))[A-Za-z\d]{8,}$/),
});

const SignUp = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Create a PeerPrep account</CardTitle>
        <CardDescription>Fill in the form below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="gap-0">
                    Username <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  {fieldState.error &&
                    (fieldState.error.type == "too_small" ? (
                      <FormMessage />
                    ) : (
                      <div className="text-sm text-destructive ">
                        Username should:
                        <ul className="ml-6 list-disc [&>li]:mt-0.5">
                          <li>
                            Contain only letters, numbers, and underscores (_)
                          </li>
                          <li>Not start or end with an underscore (_)</li>
                          <li>Not have two or more underscores (_) in a row</li>
                        </ul>
                      </div>
                    ))}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="gap-0">
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="gap-0">
                    Password <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  {fieldState.error && (
                    <div className="text-sm text-destructive ">
                      Password must be:
                      <ul className="ml-6 list-disc [&>li]:mt-0.5">
                        <li>At least 8 characters</li>
                        <li>At least one lowercase</li>
                        <li>At least one uppercase</li>
                        <li>At least one number</li>
                      </ul>
                    </div>
                  )}
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
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

export default SignUp;
