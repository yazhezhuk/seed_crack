import { useState } from "react";
import { haptic } from "@/lib/telegram";

export interface RiggedHit {
  id: string;
  attempt: number;
  coin: string;
  address: string;
  mnemonic: string;
  balance: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  startAttempt: number;
  setStartAttempt: (n: number) => void;
  hits: RiggedHit[];
  setHits: (h: RiggedHit[]) => void;
}

const emptyDraft = {
  attempt: "",
  coin: "BTC",
  address: "",
  mnemonic: "",
  balance: "",
};

export const RiggedConfigPanel = ({
  open,
  onClose,
  startAttempt,
  setStartAttempt,
  hits,
  setHits,
}: Props) => {
  const [draft, setDraft] = useState(emptyDraft);
  const [startInput, setStartInput] = useState(String(startAttempt));

  if (!open) return null;

  const applyStart = () => {
    const n = Math.max(0, Math.floor(Number(startInput.replace(/\D/g, "")) || 0));
    setStartAttempt(n);
    setStartInput(String(n));
    haptic("light");
  };

  const addHit = () => {
    const attempt = Math.max(0, Math.floor(Number(draft.attempt.replace(/\D/g, "")) || 0));
    const balance = Number(draft.balance) || 0;
    if (!draft.address.trim() || !draft.mnemonic.trim() || !attempt) return;
    const next: RiggedHit = {
      id: `${Date.now()}-${Math.random()}`,
      attempt,
      coin: draft.coin.trim().toUpperCase().slice(0, 6),
      address: draft.address.trim(),
      mnemonic: draft.mnemonic.trim(),
      balance,
    };
    setHits(
      [...hits, next].sort((a, b) => a.attempt - b.attempt),
    );
    setDraft(emptyDraft);
    haptic("medium");
  };

  const removeHit = (id: string) => {
    setHits(hits.filter((h) => h.id !== id));
    haptic("light");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/90 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl border-2 border-primary bg-card/95 p-4 sm:p-5 border-glow my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-primary text-glow">
            ⚙ RIG_CONFIG
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-primary/60 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 active:scale-95 transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Start attempt */}
        <div className="mb-4 border border-border/60 bg-card/60 p-3 space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Starting ATTEMPTS counter
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              placeholder="e.g. 1337420"
              className="flex-1 border-2 border-border bg-background px-2 py-1.5 text-xs font-bold tabular-nums text-primary text-glow focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={applyStart}
              className="border-2 border-primary bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 active:scale-95 transition-all"
            >
              SET
            </button>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/70">
            applied when generation starts (or right now if idle)
          </p>
        </div>

        {/* Add hit */}
        <div className="mb-3 border border-border/60 bg-card/60 p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Add scripted HIT
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={draft.attempt}
              onChange={(e) => setDraft({ ...draft, attempt: e.target.value })}
              placeholder="trigger @ attempt #"
              className="border-2 border-border bg-background px-2 py-1.5 text-xs font-bold tabular-nums text-primary focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              value={draft.coin}
              onChange={(e) => setDraft({ ...draft, coin: e.target.value })}
              placeholder="coin (BTC)"
              className="border-2 border-border bg-background px-2 py-1.5 text-xs font-bold uppercase text-primary focus:border-primary focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            placeholder="address"
            className="w-full border-2 border-border bg-background px-2 py-1.5 text-xs font-bold text-primary focus:border-primary focus:outline-none"
          />
          <textarea
            value={draft.mnemonic}
            onChange={(e) => setDraft({ ...draft, mnemonic: e.target.value })}
            placeholder="seed phrase (12/24 words)"
            rows={2}
            className="w-full border-2 border-border bg-background px-2 py-1.5 text-xs font-bold text-primary focus:border-primary focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={draft.balance}
              onChange={(e) => setDraft({ ...draft, balance: e.target.value })}
              placeholder="balance (e.g. 2.45)"
              className="flex-1 border-2 border-border bg-background px-2 py-1.5 text-xs font-bold tabular-nums text-primary focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={addHit}
              className="border-2 border-primary bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 active:scale-95 transition-all"
            >
              + ADD
            </button>
          </div>
        </div>

        {/* List */}
        <div className="border border-border/60 bg-card/60">
          <div className="border-b border-border/60 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            scripted hits ({hits.length})
          </div>
          {hits.length === 0 ? (
            <div className="px-2 py-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
              none — only scripted hits will fire
            </div>
          ) : (
            <ul className="divide-y divide-border/40 max-h-60 overflow-y-auto">
              {hits.map((h) => (
                <li key={h.id} className="px-2 py-1.5 space-y-0.5">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[hsl(var(--terminal-warn))] font-bold tabular-nums shrink-0">
                      @{h.attempt.toLocaleString()}
                    </span>
                    <span className="text-[hsl(var(--terminal-warn))] font-bold shrink-0">
                      {h.coin}
                    </span>
                    <span className="ml-auto text-[hsl(var(--terminal-warn))] font-bold tabular-nums shrink-0">
                      +{h.balance.toFixed(6)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHit(h.id)}
                      className="border border-destructive/60 bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/20 active:scale-95 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="break-all text-[10px] font-bold text-primary text-glow">
                    {h.address}
                  </div>
                  <div className="break-words text-[9px] text-muted-foreground italic">
                    {h.mnemonic}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-3 text-center text-[9px] uppercase tracking-widest text-muted-foreground/70">
          triple-click the title to reopen this panel
        </p>
      </div>
    </div>
  );
};
