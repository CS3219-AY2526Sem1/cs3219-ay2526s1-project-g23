import { cn } from "@/lib/utils";

const Logo = ({ className }: React.ComponentProps<"div">) => {
  return (
    <h1 className={cn(["text-2xl font-extrabold text-indigo-600", className])}>
      PeerPrep
    </h1>
  );
};

export default Logo;
