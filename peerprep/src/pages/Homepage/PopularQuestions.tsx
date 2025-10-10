import { useEffect, useState } from "react";
import { getPopularQuestions } from "@/api/question-service";
import DOMPurify from "dompurify"; 

interface Question {
  _id: string;
  title: string;
  content: string;
  difficulty: string;
  noOfAttempts: number;
}

export default function PopularQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPopularQuestions(6)
      .then(setQuestions)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!questions.length) return <p>Loading popular questions...</p>;
  console.log(questions);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-6">
        Popular Questions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((q) => (
          <div
            key={q._id}
            className="p-5 border rounded-xl shadow-sm hover:shadow-md transition bg-white"
          >
            <h3 className="font-semibold text-lg mb-2">{q.title}</h3>

            {/* Safely render formatted HTML */}
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none line-clamp-6 overflow-hidden"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(q.content),
              }}
            />

            <p className="text-sm text-gray-500 mt-3">
              Difficulty: <span className="font-medium">{q.difficulty}</span> •{" "}
              Attempts: <span className="font-medium">{q.noOfAttempts}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
