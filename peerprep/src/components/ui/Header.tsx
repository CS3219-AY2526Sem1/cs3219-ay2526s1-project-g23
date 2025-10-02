import React from "react";

const Header: React.FC = () => {
  return (
    <header className="w-full text-slate-900 py-4 px-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-indigo-600">PeerPrep</h1>
        <nav className="space-x-4">
          <a href="#" className="hover:underline text-indigo-600">
            Home
          </a>
          <a href="/user-profile" className="hover:underline text-indigo-600">
            User Profile
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
