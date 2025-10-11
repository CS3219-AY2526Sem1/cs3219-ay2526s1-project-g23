import { getUserStats } from "@/api/user-service";
import Spinner from "@/components/custom/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState, useTransition } from "react";

interface UserStats {
  userId: string;
  totalAttempts: number;
  breakdownByDifficulty: Array<{
    _id: string;
    attempts: number;
    avgTime: number;
  }>;
}

const UserStatistics: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const userId = localStorage.getItem("userId") || "";

  const fetchUserStats = async () => {
    try {
      if (!userId) {
        return "User not found";
      }
      const response = await getUserStats(userId);
      setStats(response);
    } catch (err: any) {
      return err.message;
    }
  };

  useEffect(() => {
    startTransition(async () => {
      // TODO: Edit once API is fixed
      // const error = await fetchUserStats();
      const error = "Failed to load user statistics";
      setError(error);
    });
  }, []);

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
      case "easy":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "hard":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6">Your Statistics</h2>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="w-full">
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
              <CardTitle className="text-xl text-center">
                Total Attempts
              </CardTitle>
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
              <CardTitle className="text-xl text-center">
                Difficulty Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.breakdownByDifficulty.length > 0 ? (
                  stats.breakdownByDifficulty.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getDifficultyColor(
                        item._id
                      )}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {item._id}
                        </span>
                        <span className="font-bold">
                          {item.attempts} attempts
                        </span>
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
  );
};

export default UserStatistics;
