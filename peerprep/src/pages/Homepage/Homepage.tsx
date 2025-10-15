import React from "react";
import PopularQuestions from "./PopularQuestions";
import UserStatsSection from "./UserStatsSection";
import MatchPartnerSection from "./MatchPartnerSection";

const HomePage: React.FC = () => {
  return (
    <main className="flex-1 w-full py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Welcome to PeerPrep!</h1>
          <p className="text-slate-600">
            Track your progress and find matching peers to collaborate with.
          </p>
        </div>
        <section>
          <MatchPartnerSection />
        </section>
        <section>
          <UserStatsSection />
        </section>
        <section>
          <PopularQuestions />
        </section>
      </div>
    </main>
  );
};

export default HomePage;
