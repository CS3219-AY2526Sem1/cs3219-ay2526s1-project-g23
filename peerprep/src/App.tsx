import "./App.css";
import { Button } from "./components/ui/button";

function App() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
        <h1 className="text-3xl font-mono">Welcome to PeerPrep!</h1>
        <div className="flex gap-4">
          <Button className="font-mono cursor-pointer bg-green-500">
            Register
          </Button>
          <Button className="font-mono cursor-pointer bg-blue-500">
            Login
          </Button>
        </div>
      </div>
    </>
  );
}

export default App;
