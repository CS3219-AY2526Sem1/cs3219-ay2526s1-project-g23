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

const SignUp = () => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Create a PeerPrep account</CardTitle>
        <CardDescription>Fill in the form below</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">
                <span>
                  Username <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input type="text" required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">
                <span>
                  Email <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input type="email" placeholder="example@gmail.com" required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">
                <span>
                  Password <span className="text-red-500">*</span>
                </span>
              </Label>
              <Input type="password" required />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Login now
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignUp;
