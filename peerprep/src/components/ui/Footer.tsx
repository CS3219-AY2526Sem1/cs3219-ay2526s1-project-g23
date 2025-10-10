import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full text-slate-600 py-4 px-6 border-t">
      <div className="max-w-7xl mx-auto text-center text-sm">
        © {new Date().getFullYear()} PeerPrep. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
