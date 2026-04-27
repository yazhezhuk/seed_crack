import { useEffect, useState } from "react";

export const ConsoleHeader = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ts = time.toISOString().replace("T", " ").slice(0, 19);

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-card/70 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="container flex items-center justify-between py-2 text-[9px] sm:text-xs uppercase tracking-widest">
        <div className="flex items-center gap-1.5 sm:gap-2 text-primary text-glow-strong min-w-0">
          <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-bold truncate">t.me/mr_openchain</span>
        </div>
      </div>
    </header>
  );
};
