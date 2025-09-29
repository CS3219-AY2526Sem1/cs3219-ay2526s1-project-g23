import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router";

const ResetPassword = () => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Reset Password</CardTitle>
        <CardDescription>
          We will send you a reset password link if the username or email is
          valid
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Username or Email</Label>
              <Input type="text" required />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Login now
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;
