import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ChangePassword from "@/pages/Profile/ChangePassword";
import { useEffect, useState } from "react";

const Profile = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
  });

  useEffect(() => {
    const username = localStorage.getItem("username") || "";
    const email = localStorage.getItem("email") || "";
    setUser({ username, email });
  }, []);

  return (
    <main className="flex-1 w-full py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <section>
          <h2 className="text-2xl font-semibold mb-6">Profile</h2>
          <Card className="w-full">
            <CardContent>
              <div className="flex justify-center gap-16">
                <Avatar className="w-44 h-44">
                  <AvatarFallback className="bg-indigo-200 text-6xl">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col justify-center space-y-6">
                  <div className="flex gap-7">
                    <Label className="min-w-16">Username</Label>
                    <Input
                      className="min-w-72"
                      type="text"
                      value={user.username}
                      readOnly
                    />
                  </div>
                  <div className="flex gap-7">
                    <Label className="min-w-16">Email</Label>
                    <Input
                      className="min-w-72"
                      type="text"
                      value={user.email}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        <ChangePassword />
      </div>
    </main>
  );
};

export default Profile;
