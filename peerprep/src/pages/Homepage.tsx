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
            <h2 className="text-2xl font-semibold mb-6">Your Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-500">
                    Questions Attempted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold mt-2">42</p>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-500">
                    Average Time per Question
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold mt-2">8m 15s</p>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-500">
                    Average Difficulty Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold mt-2">Medium</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-6">
              Popular Questions in PeerPrep
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Two Sum", difficulty: "Easy" },
                { title: "LRU Cache", difficulty: "Medium" },
                { title: "Regular Expression Matching", difficulty: "Hard" },
              ].map((q) => (
                <Card key={q.title} className="p-5">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-500">
                      {q.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">Difficulty: {q.difficulty}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-6">
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
                        <SelectValue placeholder="Question Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="algorithms">Algorithms</SelectItem>
                        <SelectItem value="data-structures">
                          Data Structures
                        </SelectItem>
                        <SelectItem value="system-design">
                          System Design
                        </SelectItem>
                        <SelectItem value="databases">Databases</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
