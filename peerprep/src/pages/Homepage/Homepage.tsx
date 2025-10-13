import React, { useState } from "react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PopularQuestions from "./PopularQuestions";
import UserStatsSection from "./UserStatsSection";

const HomePage: React.FC = () => {
  const [questionType, setQuestionType] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [proficiency, setProficiency] = useState<string | undefined>();

  const handleReset = () => {
    setQuestionType(undefined);
    setDifficulty(undefined);
    setProficiency(undefined);
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full bg-slate-50 text-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Welcome to PeerPrep!</h1>
            <p className="text-slate-600">
              Track your progress and find matching peers to collaborate with.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Start A Practice Session
            </h2>
            <Card className="p-6 max-w-2xl mx-auto text-xl">
              <CardHeader>
                <CardTitle>Select Your Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Select
                      key={questionType ?? questionType}
                      value={questionType}
                      onValueChange={setQuestionType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Question Topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="binary-search">
                          Binary Search
                        </SelectItem>
                        <SelectItem value="linked-list">Linked List</SelectItem>
                        <SelectItem value="stack">Stack</SelectItem>
                        <SelectItem value="graph">Graph</SelectItem>
                        <SelectItem value="sorting">Sorting</SelectItem>
                        <SelectItem value="tree">Tree</SelectItem>
                        <SelectItem value="dynamic-programming">
                          Dynamic Programming
                        </SelectItem>
                        <SelectItem value="greedy">Greedy</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      key={difficulty ?? difficulty}
                      value={difficulty}
                      onValueChange={setDifficulty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Difficulty Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      key={proficiency ?? proficiency}
                      value={proficiency}
                      onValueChange={setProficiency}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Proficiency Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                  </div>

                  {/* Buttons */}
                  <div className="sm:col-span-3 mt-2 flex gap-4">
                    <Button type="submit" className="flex-1">
                      Search Partner
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
          <section>
            <UserStatsSection />
          </section>
          <section>
            <PopularQuestions />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
