import React from "react";
import { Search } from "lucide-react";

const Homepage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* NAVBAR */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-2xl font-extrabold text-indigo-600">
              PeerPrep
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button className="px-4 py-2 rounded-2xl border border-slate-200 text-sm">
                Log in
              </button>
              <button className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm shadow">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* SEARCH BAR */}
        <section>
          <h1 className="text-3xl font-extrabold">Find Your Question Match</h1>
          <p className="mt-2 text-slate-600 max-w-xl">
            Search for questions to practise, explore by type, or check out
            what’s popular.
          </p>

          <div className="mt-6 flex items-center gap-2 bg-white rounded-xl p-2 border shadow-sm max-w-2xl">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              className="flex-1 outline-none px-2 py-2 text-sm"
              placeholder="Search questions by keyword, topic, or difficulty"
              aria-label="search questions"
            />
            <button className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm">
              Search
            </button>
          </div>
        </section>

        {/* QUESTION TYPES */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Question Types</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[
              "Algorithms",
              "Data Structures",
              "System Design",
              "Mathematics",
              "Databases",
              "Behavioral",
            ].map((type) => (
              <div
                key={type}
                className="rounded-xl bg-white p-6 shadow hover:shadow-md cursor-pointer"
              >
                <div className="font-semibold">{type}</div>
              </div>
            ))}
          </div>
        </section>

        {/* POPULAR QUESTIONS */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Popular Questions</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Two Sum", difficulty: "Easy" },
              { title: "LRU Cache", difficulty: "Medium" },
              { title: "Regular Expression Matching", difficulty: "Hard" },
            ].map((q) => (
              <article
                key={q.title}
                className="rounded-2xl bg-white shadow p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{q.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Difficulty: {q.difficulty}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-16 border-t pt-8 pb-12 text-sm text-slate-600 text-center">
          <div className="text-xl font-bold text-indigo-600">PeerPrep</div>
          <div className="mt-2">
            © {new Date().getFullYear()} PeerPrep. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Homepage;
