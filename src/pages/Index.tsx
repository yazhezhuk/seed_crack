import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { FoundWallets, FoundWallet } from "@/components/FoundWallets";
import { MatrixRain } from "@/components/MatrixRain";
import { RiggedConfigPanel, RiggedHit } from "@/components/RiggedConfigPanel";
import { COINS, CoinId, deriveAddresses } from "@/lib/wallet";
import { haptic, initTelegram } from "@/lib/telegram";
import { toast } from "sonner";

const genPhrase = () => generateMnemonic(wordlist, 128);

const BATCH_PER_FRAME = 1;

const tsNow = () => new Date().toISOString().slice(11, 19);

const maskMnemonic = (m: string) =>
    m
        .split(" ")
        .map((w) => "*".repeat(Math.max(4, w.length)))
        .join(" ");

const maskAddress = (a: string) => {
  if (!a || a === "—" || a.length < 14) return a;
  const head = a.slice(0, 6);
  const tail = a.slice(-6);
  const mid = "*".repeat(Math.max(6, a.length - 12));
  return `${head}${mid}${tail}`;
};

const Index = () => {
  const [mnemonic, setMnemonic] = useState<string>(() => genPhrase());
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<CoinId[]>(["BTC"]);
  const [revealSeed, setRevealSeed] = useState(false);
  const [revealAddr, setRevealAddr] = useState(false);

  // Rig config
  const [configOpen, setConfigOpen] = useState(false);
  const [startAttempt, setStartAttempt] = useState(0);
  const [riggedHits, setRiggedHits] = useState<RiggedHit[]>([]);
  const [theme, setTheme] = useState<string>("green");
  const [foundHits, setFoundHits] = useState<FoundWallet[]>([]);

  useEffect(() => {
    if (theme === "green") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);
  const firedRef = useRef<Set<string>>(new Set());

  const rafRef = useRef<number | null>(null);
  const counterRef = useRef(0);
  const titleClicksRef = useRef<number[]>([]);

  const addresses = useMemo(
      () => deriveAddresses(mnemonic, selected),
      [mnemonic, selected],
  );

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Keep latest rigged hits available inside RAF loop
  const riggedRef = useRef(riggedHits);
  useEffect(() => {
    riggedRef.current = riggedHits;
  }, [riggedHits]);

  useEffect(() => {
    initTelegram();
  }, []);

  // Apply start value when idle
  useEffect(() => {
    if (!running) {
      counterRef.current = startAttempt;
      setCount(startAttempt);
      firedRef.current = new Set();
    }
  }, [startAttempt, running]);

  useEffect(() => {
    if (!running) return;
    const loop = () => {
      const coins = selectedRef.current;

      for (let i = 0; i < BATCH_PER_FRAME; i++) {
        const phrase = genPhrase();
        deriveAddresses(phrase, coins);
        counterRef.current += 1;

        // Check rigged trigger
        const rigs = riggedRef.current;
        for (const r of rigs) {
          if (r.attempt === counterRef.current && !firedRef.current.has(r.id)) {
            firedRef.current.add(r.id);
            const hit: FoundWallet = {
              id: r.id,
              ts: tsNow(),
              coin: r.coin,
              address: r.address,
              mnemonic: r.mnemonic,
              balance: r.balance,
              balanceLabel: r.balanceLabel,
            };
            setFoundHits((prev) => [hit, ...prev].slice(0, 50));
            haptic("medium");
          }
        }

        setMnemonic(phrase);
      }

      setCount(counterRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const onToggle = useCallback(() => {
    haptic("medium");
    setRunning((r) => !r);
  }, []);

  const onCopy = useCallback(async () => {
    haptic("light");
    const lines = selected.map((c) => `${c}: ${addresses[c] ?? "—"}`).join("\n");
    try {
      await navigator.clipboard.writeText(`${lines}\n${mnemonic}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard blocked");
    }
  }, [addresses, selected, mnemonic]);

  const toggleCoin = useCallback((c: CoinId) => {
    haptic("light");
    setSelected((prev) => {
      if (prev.includes(c)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== c);
      }
      return [...prev, c];
    });
  }, []);

  // Triple-click on title opens hidden config
  const onTitleClick = useCallback(() => {
    const now = Date.now();
    titleClicksRef.current = [...titleClicksRef.current, now].filter(
        (t) => now - t < 700,
    );
    if (titleClicksRef.current.length >= 3) {
      titleClicksRef.current = [];
      setConfigOpen(true);
      haptic("medium");
    }
  }, []);

  const displayedSeed = revealSeed ? mnemonic : maskMnemonic(mnemonic);

  return (
      <div className="crt-scanlines relative min-h-screen flicker">
        <MatrixRain />

        <div className="relative z-10 flex min-h-screen flex-col">
          <ConsoleHeader />

          <main className="container relative flex-1 px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-6 sm:py-6 max-w-2xl">
            <h1
                className="mb-0.5 text-lg sm:text-2xl font-black uppercase tracking-widest text-primary text-glow-strong cursor-default select-none"
                onClick={onTitleClick}
            >
              <span className="blink-cursor">Mr. Openchain_</span>
            </h1>
            <p className="mb-3 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
              attempts: <span className="text-primary tabular-nums">{count.toLocaleString()}</span>
            </p>

            {/* Coin selector */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {COINS.map((c) => {
                const on = selected.includes(c.id);
                return (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCoin(c.id)}
                        className={`border-2 px-2.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                            on
                                ? "border-primary bg-primary/15 text-primary text-glow border-glow"
                                : "border-border bg-card/40 text-muted-foreground hover:border-primary/60 hover:text-primary/80"
                        }`}
                    >
                      {on ? "▣" : "▢"} {c.label}
                    </button>
                );
              })}
            </div>

            <section className="space-y-3">
              {/* Addresses */}
              <div className="border border-primary/60 bg-card/60 p-2.5 sm:p-3 border-glow space-y-1.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Address:
                </span>
                  <button
                      type="button"
                      onClick={() => {
                        haptic("light");
                        setRevealAddr((v) => !v);
                      }}
                      className="border border-primary/60 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 active:scale-95 transition-all"
                  >
                    {revealAddr ? "◉ HIDE" : "◌ SHOW"}
                  </button>
                </div>
                {selected.length === 0 ? (
                    <div className="text-[12px] text-muted-foreground italic">— select a coin —</div>
                ) : (
                    selected.map((c) => (
                        <div key={c} className="flex items-start gap-2">
                    <span className="shrink-0 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[hsl(var(--terminal-warn))] w-10">
                      {c}
                    </span>
                          <span className="break-all font-bold text-primary text-glow text-[11px] sm:text-sm leading-snug min-w-0 flex-1">
                      {revealAddr ? (addresses[c] ?? "—") : maskAddress(addresses[c] ?? "—")}
                    </span>
                        </div>
                    ))
                )}
              </div>

              {/* Seed phrase (masked unless revealed) */}
              <div className="border border-primary/60 bg-card/60 p-2.5 sm:p-3 border-glow">
                <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Seed:
                </span>
                  <button
                      type="button"
                      onClick={() => {
                        haptic("light");
                        setRevealSeed((v) => !v);
                      }}
                      className="border border-primary/60 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 active:scale-95 transition-all"
                  >
                    {revealSeed ? "◉ HIDE" : "◌ SHOW"}
                  </button>
                </div>
                <div className="break-words font-bold text-primary text-glow text-[12px] sm:text-sm leading-relaxed tracking-wider min-h-[3.5rem] sm:min-h-[4rem]">
                  {displayedSeed}
                </div>
              </div>

              {/* Desktop buttons */}
              <div className="hidden sm:grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onToggle}
                    className={`border-2 px-2 py-3 text-sm font-bold uppercase tracking-widest transition-all active:scale-95 ${
                        running
                            ? "border-destructive bg-destructive/15 text-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.6)]"
                            : "border-primary bg-primary/10 text-primary text-glow-strong border-glow"
                    }`}
                >
                  {running ? "■ HALT" : "▶ INIT"}
                </button>
                <button
                    type="button"
                    onClick={onCopy}
                    className="border-2 border-border bg-card/60 px-2 py-3 text-sm font-bold uppercase tracking-widest text-foreground transition-all hover:border-primary hover:text-primary hover:text-glow active:scale-95"
                >
                  ⧉ COPY
                </button>
              </div>

              <FoundWallets hits={foundHits} active={running} />

              <p className="text-center text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground/70 leading-tight">
                ⚠ educational use only · not for real wallets
              </p>
            </section>
          </main>

          {/* Mobile sticky action bar */}
          <nav
              className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t-2 border-primary/40 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
              aria-label="Primary actions"
          >
            <div className="grid grid-cols-2 gap-1.5 p-2">
              <button
                  type="button"
                  onClick={onToggle}
                  className={`min-h-[52px] border-2 px-1 py-2 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                      running
                          ? "border-destructive bg-destructive/15 text-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.6)]"
                          : "border-primary bg-primary/10 text-primary text-glow-strong border-glow"
                  }`}
              >
                {running ? "■ HALT" : "▶ INIT"}
              </button>
              <button
                  type="button"
                  onClick={onCopy}
                  className="min-h-[52px] border-2 border-border bg-card/60 px-1 py-2 text-xs font-bold uppercase tracking-widest text-foreground transition-all active:scale-95 active:border-primary active:text-primary"
              >
                ⧉ COPY
              </button>
            </div>
          </nav>
        </div>

        <RiggedConfigPanel
            open={configOpen}
            onClose={() => setConfigOpen(false)}
            startAttempt={startAttempt}
            setStartAttempt={setStartAttempt}
            hits={riggedHits}
            setHits={setRiggedHits}
            theme={theme}
            setTheme={setTheme}
        />
      </div>
  );
};

export default Index;