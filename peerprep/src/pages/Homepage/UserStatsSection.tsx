import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getUserStats } from "@/api/user-service";

type UserStats = {
  questionsAttempted: number;
  avgTimePerQuestion: string;
  avgDifficulty: string;
};

const diffMap: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
const diffMapReverse: Record<number, string> = Object.fromEntries(
  Object.entries(diffMap).map(([key, value]) => [value, key])
);

function formatAvgTime(seconds: number): string {
  const rounded = Math.ceil(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}m ${secs}s`;
}

function formatUserStats(data: any): UserStats {
  const formattedStats: UserStats = {
    questionsAttempted: data.questionsCompleted ?? 0,
    avgTimePerQuestion: formatAvgTime(data.avgTime ?? 0),
    avgDifficulty:
      data.avgDifficulty === 0
        ? "N/A"
        : diffMapReverse[Math.round(data.avgDifficulty)] ?? "N/A",
  };
  return formattedStats;
}

export default function UserStatsSection() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        const data = await getUserStats(userId);

        setStats(formatUserStats(data));
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <p className="text-center text-slate-500">Loading statistics...</p>;
  }

  if (!stats) {
    return (
      <p className="text-center text-slate-500">No statistics available.</p>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6">Your Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg text-slate-500">
              Questions Attempted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold mt-2">
              {stats.questionsAttempted}
            </p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg text-slate-500">
              Average Time per Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold mt-2">
              {stats.avgTimePerQuestion}
            </p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg text-slate-500">
              Average Difficulty Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold mt-2">{stats.avgDifficulty}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
