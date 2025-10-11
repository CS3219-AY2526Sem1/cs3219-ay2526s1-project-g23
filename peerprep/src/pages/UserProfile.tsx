import React, { useState, useEffect, useTransition } from "react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { getUserStats, changePassword } from "@/api/user-service";
import Spinner from "@/components/custom/spinner";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface UserStats {
  userId: string;
  totalAttempts: number;
  breakdownByDifficulty: Array<{
    _id: string;
    attempts: number;
    avgTime: number;
  }>;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

const UserProfile: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordLoading, startPasswordTransition] = useTransition();
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Get user info from localStorage
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");

  // Form for changing password
  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        if (!userId) {
          setError("User not found");
          return;
        }

        setLoading(true);
        const response = await getUserStats(userId);
        setStats(response);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching user stats:", err);
        setError(err.message || "Failed to load user statistics");
        toast.error("Failed to load user statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  const onChangePassword = async (values: z.infer<typeof changePasswordSchema>) => {
    startPasswordTransition(async () => {
      try {
        const message = await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        toast.success(message || "Password changed successfully!");
        passwordForm.reset();
        setShowChangePassword(false);
      } catch (error: any) {
        console.error("Error changing password:", error);
        toast.error(error.message || "Failed to change password");
        // Clear password fields on error
        passwordForm.setValue("currentPassword", "");
        passwordForm.setValue("newPassword", "");
        passwordForm.setValue("confirmPassword", "");
      }
    });
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full bg-slate-50 text-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">User Profile</h1>
            <p className="text-slate-600">
              Track your progress and view your coding statistics.
            </p>
          </div>

          {/* User Information Section */}
          <section>
            <Card className="p-6 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium text-slate-600">Username:</span>
                    <span className="text-slate-900">{username || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium text-slate-600">Email:</span>
                    <span className="text-slate-900">{email || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Change Password Section */}
          <section>
            <Card className="p-6 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Security</CardTitle>
              </CardHeader>
              <CardContent>
                {!showChangePassword ? (
                  <div className="space-y-4">
                    <p className="text-slate-600 mb-4">
                      Keep your account secure by updating your password regularly.
                    </p>
                    <Button 
                      onClick={() => setShowChangePassword(true)}
                      className="w-full sm:w-auto"
                    >
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Change Password</h3>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowChangePassword(false);
                          passwordForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2 pt-2">
                          <Button 
                            type="submit" 
                            disabled={passwordLoading}
                            className="flex-1 sm:flex-none"
                          >
                            {passwordLoading ? <Spinner /> : "Update Password"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Statistics Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Your Statistics
            </h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : error ? (
              <Card className="p-6 max-w-2xl mx-auto">
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-2">Error loading statistics</p>
                    <p className="text-slate-600 text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {/* Total Attempts Card */}
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="text-xl text-center">Total Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-indigo-600 mb-2">
                        {stats.totalAttempts}
                      </div>
                      <p className="text-slate-600">Questions attempted</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Difficulty Breakdown Card */}
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="text-xl text-center">Difficulty Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.breakdownByDifficulty.length > 0 ? (
                        stats.breakdownByDifficulty.map((item, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg border ${getDifficultyColor(item._id)}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize">{item._id}</span>
                              <span className="font-bold">{item.attempts} attempts</span>
                            </div>
                            <div className="text-sm mt-1">
                              Avg. Time: {formatTime(item.avgTime)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-600">
                          No attempts recorded yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="p-6 max-w-2xl mx-auto">
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-slate-600">No statistics available</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;