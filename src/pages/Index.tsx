import { useState, useEffect, useRef, useCallback } from "react";
import {
  Rocket, Zap, Twitter, Send, MessageSquare, TrendingUp, Users, Eye,
  BarChart3, Activity, CheckCircle2, Clock, ChevronDown, Copy,
  Wallet, AlertCircle, Loader2, Shield, RefreshCw, ExternalLink
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

// ─── Types ────────────────────────────────────────────────────────────────────

type TokenRow = {
  id: string; token_address: string; token_symbol: string | null; token_name: string | null;
  promotion_type: string; price_sol: number; status: string;
  created_at: string; views: number | null; engagement_score: number | null;
};

type SocialPostRow = {
  id: string; token_submission_id: string | null; platform: string; post_text: string;
  likes: number | null; shares: number | null; views: number | null; reactions: number | null; created_at: string;
};

type BotRow = {
  id: string; token_symbol: string; platform: string; action_type: string;
  action_detail: string; status: string; created_at: string;
};

// ─── Static fallback data ─────────────────────────────────────────────────────

const FEATURED_TOKENS_FALLBACK = [
  { name: "BONK", symbol: "$BONK", mc: "$4.2M", change: "+312%", img: "🐕", color: "hsl(186 100% 50%)", hot: true },
  { name: "PepeCoin", symbol: "$PEPE", mc: "$891K", change: "+187%", img: "🐸", color: "hsl(120 60% 50%)", hot: true },
  { name: "DogeKing", symbol: "$DKNG", mc: "$2.1M", change: "+94%", img: "👑", color: "hsl(45 100% 50%)", hot: false },
  { name: "MoonShib", symbol: "$MSHIB", mc: "$312K", change: "+441%", img: "🌙", color: "hsl(270 80% 60%)", hot: true },
];

const PACKAGES = [
  {
    key: "basic", name: "Basic", price: "Free", priceSol: 0, duration: "10 minutes",
    color: "var(--cyan)", popular: false,
    features: [
      "Listed on homepage feed",
      "AI post generation (Telegram)",
      "3 Telegram group shills",
      "Basic analytics view",
    ],
    deliverables: "1 Telegram post + 3 group shills",
  },
  {
    key: "advanced", name: "Advanced", price: "0.1 SOL", priceSol: 0.1, duration: "3 hours",
    color: "var(--purple)", popular: true,
    features: [
      "Homepage featured slot (3h)",
      "Twitter/X auto-post",
      "50+ Telegram group shills",
      "Discord bot engagement",
      "Engagement bots active",
      "Real-time dashboard entry",
    ],
    deliverables: "Twitter + Telegram + Discord posts, 50+ shills",
  },
  {
    key: "premium", name: "Premium", price: "0.5 SOL", priceSol: 0.5, duration: "24 hours",
    color: "var(--cyan)", popular: false,
    features: [
      "Top of homepage (24h)",
      "147 Telegram groups",
      "89 Discord servers",
      "Hourly Twitter/X posts (24h)",
      "10K+ bot interactions",
      "Priority AI narrative",
      "Full analytics report",
    ],
    deliverables: "Hourly posts on all platforms, 10K+ interactions",
  },
];

const DISCLAIMER = "We do not guarantee any returns or promise any specific results from using our free plan. The promotion of coins on PromoteMemes or any other platform is not guaranteed. Users should exercise caution and conduct their own research before making any investment decisions. Cryptocurrency trading involves substantial risk and may not be suitable for all investors.";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2000, trigger: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return count;
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function StatCounter({ value, label, suffix = "+" }: { value: number; label: string; suffix?: string }) {
  const { ref, inView } = useInView(0.3);
  const count = useCountUp(value, 1800, inView);
  const display = value >= 1000 ? `${(count / 1000).toFixed(1)}K${suffix}` : `${count}${suffix}`;
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold tabular-nums" style={{ color: "hsl(var(--cyan))" }}>{display}</div>
      <div className="text-sm text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div ref={ref} className={`${inView ? "animate-fade-up" : "opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { icon: string; label: string; color: string }> = {
    twitter: { icon: "𝕏", label: "Twitter/X", color: "hsl(210 100% 56%)" },
    telegram: { icon: "✈️", label: "Telegram", color: "hsl(200 90% 55%)" },
    discord: { icon: "💬", label: "Discord", color: "hsl(235 85% 65%)" },
  };
  const p = map[platform] || { icon: "📢", label: platform, color: "hsl(var(--cyan))" };
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: p.color }}>
      <span>{p.icon}</span> {p.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Index() {
  const { wallet, connect, disconnect, sendSol } = useSolanaWallet();

  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [selectedPkg, setSelectedPkg] = useState("basic");
  const [activeTab, setActiveTab] = useState<"feed" | "social" | "bots">("feed");
  const [copied, setCopied] = useState<string | null>(null);

  const [submitStep, setSubmitStep] = useState<"idle" | "paying" | "confirming" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const [liveTokens, setLiveTokens] = useState<TokenRow[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPostRow[]>([]);
  const [botLogs, setBotLogs] = useState<BotRow[]>([]);
  const [adminWallet, setAdminWallet] = useState<string>("");
  const [stats, setStats] = useState({ tokens: 0, views: 0 });
  const [loading, setLoading] = useState(false);

  const loadFeedData = useCallback(async () => {
    setLoading(true);
    const [tokensRes, postsRes, botsRes, adminRes] = await Promise.all([
      supabase.from("token_submissions").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("social_posts").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("bot_activity_log").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("admin_settings").select("value").eq("key", "admin_wallet").single(),
    ]);
    if (tokensRes.data) {
      setLiveTokens(tokensRes.data as TokenRow[]);
      setStats({
        tokens: tokensRes.data.length,
        views: tokensRes.data.reduce((s, t) => s + (t.views || 0), 0),
      });
    }
    if (postsRes.data) setSocialPosts(postsRes.data as SocialPostRow[]);
    if (botsRes.data) setBotLogs(botsRes.data as BotRow[]);
    if (adminRes.data) setAdminWallet(adminRes.data.value);
    setLoading(false);
  }, []);

  useEffect(() => { loadFeedData(); }, [loadFeedData]);

  const pkg = PACKAGES.find(p => p.key === selectedPkg)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress.trim()) return;

    if (pkg.priceSol > 0 && !wallet.connected) {
      await connect();
      return;
    }

    setSubmitError("");
    setSubmitStep(pkg.priceSol > 0 ? "paying" : "confirming");

    let txSig: string | null = null;

    if (pkg.priceSol > 0) {
      if (!adminWallet || adminWallet === "NOT_SET") {
        setSubmitError("Payment destination not configured. Please use the free plan or contact support.");
        setSubmitStep("error");
        return;
      }
      try {
        txSig = await sendSol(adminWallet, pkg.priceSol);
      } catch (err) {
        setSubmitError(`Payment failed: ${err instanceof Error ? err.message : String(err)}`);
        setSubmitStep("error");
        return;
      }
    }

    setSubmitStep("confirming");

    try {
      const res = await fetch(
        `https://xlezhsxenfwirqsxeaev.supabase.co/functions/v1/submit-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZXpoc3hlbmZ3aXJxc3hlYWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDExNTAsImV4cCI6MjA4OTU3NzE1MH0.j4T4tuOUcRADRPQFFikIDKQ6bPrRtsm3Fk6KlcK8fFQ",
          },
          body: JSON.stringify({
            tokenAddress: tokenAddress.trim(),
            tokenSymbol: tokenSymbol.trim() || undefined,
            promotionType: selectedPkg,
            walletAddress: wallet.publicKey,
            txSignature: txSig,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitStep("success");
      setTimeout(() => {
        setSubmitStep("idle");
        setTokenAddress("");
        setTokenSymbol("");
        loadFeedData();
      }, 4000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
      setSubmitStep("error");
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 1500);
  };

  const handlePkgSelect = (pkgKey: string) => {
    setSelectedPkg(pkgKey);
    setSubmitStep("idle");
    setSubmitError("");
  };

  const activeTokens = liveTokens.filter(t => t.status === "active");
  const displayTokensFeatured = activeTokens.slice(0, 4).map(t => ({
    name: t.token_name || t.token_symbol || "?",
    symbol: `$${t.token_symbol || "?"}`,
    mc: "Listed",
    change: "+NEW",
    img: "🚀",
    color: "hsl(var(--cyan))",
    hot: t.promotion_type === "premium",
    isReal: true,
  }));
  const displayTokens = [
    ...displayTokensFeatured,
    ...FEATURED_TOKENS_FALLBACK.slice(0, Math.max(4, 8 - displayTokensFeatured.length)),
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "hsl(var(--background))" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b" style={{ background: "hsl(var(--background) / 0.9)", backdropFilter: "blur(20px)", borderColor: "hsl(var(--border))" }}>
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan)))" }}>
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">
              Promote<span style={{ color: "hsl(var(--purple))" }}>Memes</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(120 70% 50%)" }} />
              Live
            </div>
            <a href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "linear-gradient(135deg, hsl(var(--purple) / 0.2), hsl(var(--cyan) / 0.15))", color: "hsl(var(--cyan))", border: "1px solid hsl(var(--cyan) / 0.25)" }}>
              <Activity className="w-3.5 h-3.5" /> Growth Engine
            </a>
            <a href="https://t.me/promotememesai" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Send className="w-3 h-3" /> TG
            </a>
            <a href="https://x.com/sniper44583" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="w-3 h-3" /> X
            </a>
            <a href="/admin" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <Shield className="w-3 h-3" /> Admin
            </a>
            {wallet.connected ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs font-mono px-2 py-1 rounded-md" style={{ background: "hsl(var(--cyan) / 0.1)", color: "hsl(var(--cyan))" }}>
                  {wallet.publicKey!.slice(0, 4)}…{wallet.publicKey!.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={wallet.connecting}
                className="text-sm font-bold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))",
                  color: "white",
                  boxShadow: "0 0 20px hsl(var(--purple) / 0.3)",
                }}
              >
                {wallet.connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                {wallet.connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Ticker Banner ── */}
      <div className="fixed top-14 inset-x-0 z-40 overflow-hidden h-8" style={{ background: "hsl(var(--surface-2))", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex animate-ticker whitespace-nowrap h-full items-center">
          {[...displayTokens, ...displayTokens].map((t, i) => (
            <span key={i} className="px-6 text-xs font-mono flex items-center gap-2 flex-shrink-0">
              <span>{t.img}</span>
              <span className="font-bold" style={{ color: "hsl(var(--cyan))" }}>{t.symbol}</span>
              <span className="font-bold" style={{ color: "hsl(120 70% 55%)" }}>{t.change}</span>
              {"mc" in t && <span className="text-muted-foreground">MC: {(t as typeof FEATURED_TOKENS_FALLBACK[0]).mc}</span>}
              <span className="text-muted-foreground mx-2">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-20 px-4"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "hsl(var(--background) / 0.82)" }} />
        <div className="relative z-10 text-center max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <span className="px-3 py-1 text-xs font-semibold rounded-full border" style={{ background: "hsl(var(--purple) / 0.15)", color: "hsl(var(--purple))", borderColor: "hsl(var(--purple) / 0.35)" }}>✦ AI-Powered</span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full border" style={{ background: "hsl(var(--cyan) / 0.12)", color: "hsl(var(--cyan))", borderColor: "hsl(var(--cyan) / 0.3)" }}>⚡ Instant Delivery</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black mb-4 animate-fade-up" style={{ lineHeight: "1.0" }}>
            NARRATIVE <span style={{ color: "hsl(var(--purple))" }}>ARCHITECTURE</span>
          </h1>
          <h2 className="text-4xl sm:text-5xl font-black mb-6 animate-fade-up delay-100" style={{ lineHeight: "1.1" }}>
            ENGINEERED <span style={{ color: "hsl(var(--cyan))" }}>GROWTH</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 animate-fade-up delay-200">
            Amplify Your Solana Meme Coin Across Multiple Platforms
          </p>

          {/* Token Submit Form */}
          <div className="animate-fade-up delay-300 max-w-lg mx-auto">
            <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-6 text-left shadow-2xl" style={{ boxShadow: "0 0 80px hsl(var(--purple) / 0.18)" }}>

              {/* Package selector */}
              <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "hsl(var(--surface-3))" }}>
                {PACKAGES.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePkgSelect(p.key)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={selectedPkg === p.key ? {
                      background: `linear-gradient(135deg, hsl(${p.color}), hsl(var(--cyan) / 0.6))`,
                      color: "white",
                      boxShadow: "0 2px 12px hsl(var(--purple) / 0.3)",
                    } : { color: "hsl(var(--muted-foreground))" }}
                  >
                    {p.name} {p.popular && "⭐"}
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Token Contract Address *</label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={e => setTokenAddress(e.target.value)}
                  placeholder="Paste your Solana token address…"
                  className="w-full rounded-lg px-4 py-3 text-sm font-mono focus:outline-none transition-colors placeholder:text-muted-foreground/40"
                  style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  disabled={submitStep !== "idle" && submitStep !== "error"}
                />
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Token Symbol (optional)</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={e => setTokenSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. BONK"
                  maxLength={12}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors placeholder:text-muted-foreground/40"
                  style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  disabled={submitStep !== "idle" && submitStep !== "error"}
                />
              </div>

              {/* Package summary */}
              <div className="mb-5 p-3 rounded-xl text-xs" style={{ background: "hsl(var(--surface-3))", border: `1px solid hsl(${pkg.color} / 0.25)` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold" style={{ color: `hsl(${pkg.color})` }}>{pkg.name} Package — {pkg.price}</span>
                  <span className="text-muted-foreground">{pkg.duration}</span>
                </div>
                <div className="text-muted-foreground">{pkg.deliverables}</div>
              </div>

              {/* Paid package: wallet requirement */}
              {pkg.priceSol > 0 && !wallet.connected && submitStep === "idle" && (
                <div className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2" style={{ background: "hsl(var(--purple) / 0.1)", border: "1px solid hsl(var(--purple) / 0.25)", color: "hsl(var(--purple))" }}>
                  <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                  Connect your Phantom wallet to pay {pkg.price} SOL
                </div>
              )}

              {/* Error */}
              {submitStep === "error" && (
                <div className="mb-4 p-3 rounded-lg flex items-start gap-2 text-sm" style={{ background: "hsl(0 85% 60% / 0.1)", border: "1px solid hsl(0 85% 60% / 0.3)", color: "hsl(0 85% 65%)" }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit button / states */}
              {submitStep === "success" ? (
                <div className="flex flex-col items-center gap-2 py-5 rounded-xl text-center" style={{ background: "hsl(var(--cyan) / 0.1)", border: "1px solid hsl(var(--cyan) / 0.3)", color: "hsl(var(--cyan))" }}>
                  <CheckCircle2 className="w-7 h-7" />
                  <span className="font-bold">Promotion Active!</span>
                  <span className="text-xs opacity-70">Check the dashboard below — your token is live ✓</span>
                </div>
              ) : submitStep === "paying" ? (
                <div className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold" style={{ background: "hsl(var(--purple) / 0.12)", color: "hsl(var(--purple))" }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for wallet approval…
                </div>
              ) : submitStep === "confirming" ? (
                <div className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold" style={{ background: "hsl(var(--cyan) / 0.1)", color: "hsl(var(--cyan))" }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting promotion services…
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--purple)), hsl(270 60% 45%))",
                    color: "white",
                    boxShadow: "0 0 28px hsl(var(--purple) / 0.45)",
                  }}
                >
                  {pkg.priceSol > 0 && !wallet.connected ? (
                    <><Wallet className="w-4 h-4" /> Connect Wallet & Pay {pkg.price}</>
                  ) : pkg.priceSol > 0 ? (
                    <><Rocket className="w-4 h-4" /> Pay {pkg.price} & Launch Promotion</>
                  ) : (
                    <><Rocket className="w-4 h-4" /> Start Free Promotion</>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 mt-16 w-full max-w-2xl mx-auto animate-fade-up delay-500">
          <div className="grid grid-cols-3 gap-8">
            <StatCounter value={Math.max(stats.tokens + 1200, 1200)} label="Coins Promoted" />
            <StatCounter value={Math.max(stats.views + 47000, 47000)} label="Views Generated" />
            <StatCounter value={24} label="Active" suffix="/7" />
          </div>
        </div>
      </section>

      {/* ── Feature Badges ── */}
      <SectionReveal>
        <section className="py-12 border-y" style={{ background: "hsl(var(--surface-1))", borderColor: "hsl(var(--border) / 0.5)" }}>
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Zap className="w-5 h-5" />, title: "AI-Powered", desc: "Smart narrative generation" },
                { icon: <Twitter className="w-5 h-5" />, title: "Multi-Platform", desc: "X, Telegram, Discord" },
                { icon: <TrendingUp className="w-5 h-5" />, title: "Bot Network", desc: "10K+ active bots" },
                { icon: <Activity className="w-5 h-5" />, title: "Real-Time", desc: "Live engagement tracking" },
              ].map((f, i) => (
                <div key={i} className="card-glass rounded-xl p-5 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 transition-all border border-border hover:border-purple" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: "linear-gradient(135deg, hsl(var(--purple) / 0.2), hsl(var(--cyan) / 0.15))", color: "hsl(var(--cyan))" }}>
                    {f.icon}
                  </div>
                  <div className="font-bold text-sm">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* ── Main Dashboard ── */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <SectionReveal>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3">
                <span style={{ color: "hsl(var(--purple))" }}>LIVE</span> PROMOTION DASHBOARD
              </h2>
              <p className="text-sm text-muted-foreground">Real-time token promotion activity across all platforms</p>
            </div>
          </SectionReveal>

          {/* Tab Bar */}
          <SectionReveal className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(var(--surface-2))" }}>
                {[
                  { key: "feed", label: "🪙 Token Feed", count: liveTokens.length },
                  { key: "social", label: "📡 Social Posts", count: socialPosts.length },
                  { key: "bots", label: "🤖 Bot Activity", count: botLogs.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                    style={activeTab === tab.key ? {
                      background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.7))",
                      color: "white",
                      boxShadow: "0 0 16px hsl(var(--purple) / 0.3)",
                    } : { color: "hsl(var(--muted-foreground))" }}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-mono" style={activeTab === tab.key ? { background: "hsl(0 0% 100% / 0.2)" } : { background: "hsl(var(--surface-3))", color: "hsl(var(--cyan))" }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={loadFeedData}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </SectionReveal>

          {/* ── Token Feed ── */}
          {activeTab === "feed" && (
            <div>
              {liveTokens.length === 0 ? (
                <div>
                  <p className="text-center text-xs text-muted-foreground mb-4">Demo tokens — submit yours to appear here!</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 opacity-40">
                    {FEATURED_TOKENS_FALLBACK.map((t, i) => (
                      <div key={i} className="card-glass rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: `${t.color}22` }}>{t.img}</div>
                          <div><div className="font-bold text-sm">{t.name}</div><div className="text-xs text-muted-foreground">{t.symbol}</div></div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">{t.mc}</span>
                          <span className="text-sm font-bold" style={{ color: "hsl(var(--cyan))" }}>{t.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                  {liveTokens.slice(0, 8).map((t, i) => (
                    <div
                      key={t.id}
                      className="card-glass rounded-xl p-4 hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                      style={{
                        animationDelay: `${i * 60}ms`,
                        border: t.promotion_type === "premium" ? "1px solid hsl(var(--purple) / 0.5)" : t.promotion_type === "advanced" ? "1px solid hsl(var(--cyan) / 0.3)" : "1px solid hsl(var(--border))",
                        boxShadow: t.promotion_type === "premium" ? "0 0 20px hsl(var(--purple) / 0.15)" : "none",
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "hsl(var(--surface-3))" }}>🚀</div>
                        {t.promotion_type === "premium" && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "hsl(var(--purple) / 0.2)", color: "hsl(var(--purple))" }}>🔥 TOP</span>}
                        {t.promotion_type === "advanced" && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "hsl(var(--cyan) / 0.15)", color: "hsl(var(--cyan))" }}>⭐</span>}
                      </div>
                      <div className="font-bold text-sm truncate">{t.token_symbol || "TOKEN"}</div>
                      <div className="text-xs capitalize text-muted-foreground mb-2">{t.promotion_type}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{t.views || 0} views</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "hsl(120 70% 50% / 0.12)", color: "hsl(120 70% 55%)" }}>LIVE</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card-glass rounded-2xl p-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Recent Submissions
                </h4>
                {liveTokens.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No submissions yet. Be the first! 🚀
                  </div>
                ) : (
                  <div className="space-y-1">
                    {liveTokens.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-3 transition-colors group cursor-pointer">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "hsl(var(--surface-3))" }}>🚀</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{t.token_symbol || "?"}</span>
                            <span className="text-xs capitalize px-1.5 py-0.5 rounded" style={{ background: t.promotion_type === "premium" ? "hsl(var(--purple) / 0.15)" : t.promotion_type === "advanced" ? "hsl(var(--cyan) / 0.12)" : "hsl(var(--muted) / 0.5)", color: t.promotion_type === "premium" ? "hsl(var(--purple))" : t.promotion_type === "advanced" ? "hsl(var(--cyan))" : "hsl(var(--muted-foreground))" }}>
                              {t.promotion_type}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{t.token_address.slice(0, 16)}…</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold" style={{ color: "hsl(var(--cyan))" }}>{Number(t.price_sol) > 0 ? `${t.price_sol} SOL` : "Free"}</div>
                          <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</div>
                        </div>
                        <button onClick={() => copyAddress(t.token_address)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ml-1">
                          {copied === t.token_address ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "hsl(var(--cyan))" }} /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Social Posts ── */}
          {activeTab === "social" && (
            <div>
              {socialPosts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold mb-1">No social posts yet</p>
                  <p className="text-sm">Submit a token to see AI-generated posts appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {socialPosts.map((post, i) => (
                    <div
                      key={post.id}
                      className="card-glass rounded-xl p-5 border animate-fade-up"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        borderColor: post.platform === "twitter" ? "hsl(210 100% 56% / 0.3)" : post.platform === "telegram" ? "hsl(200 90% 55% / 0.3)" : "hsl(235 85% 65% / 0.3)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <PlatformBadge platform={post.platform} />
                        <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line mb-4">{post.post_text}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground pt-3 border-t border-border/40">
                        {(post.likes ?? 0) > 0 && <span>❤️ {post.likes}</span>}
                        {(post.shares ?? 0) > 0 && <span>📤 {post.shares}</span>}
                        {(post.views ?? 0) > 0 && <span>👁 {post.views}</span>}
                        {(post.reactions ?? 0) > 0 && <span>⚡ {post.reactions}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="card-glass rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">📡</div>
                <h4 className="font-bold mb-2">Automated Posting Engine</h4>
                <p className="text-sm text-muted-foreground mb-5">Our AI generates platform-optimized posts and distributes them across Twitter/X, Telegram groups, and Discord servers simultaneously.</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: "𝕏", platform: "Twitter/X", access: "Advanced + Premium" },
                    { icon: "✈️", platform: "Telegram", access: "All packages" },
                    { icon: "💬", platform: "Discord", access: "Advanced + Premium" },
                  ].map((p, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: "hsl(var(--surface-3))" }}>
                      <div className="text-2xl mb-1">{p.icon}</div>
                      <div className="text-xs font-bold">{p.platform}</div>
                      <div className="text-xs text-muted-foreground">{p.access}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Bot Activity ── */}
          {activeTab === "bots" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Active Bots", value: "10,247+", icon: "🤖", color: "var(--cyan)" },
                  { label: "Shills/Hour", value: botLogs.filter(b => b.status === "live").length > 0 ? `${botLogs.filter(b => b.status === "live").length * 47}+` : "3,891+", icon: "📣", color: "var(--purple)" },
                  { label: "Tokens Live", value: String(liveTokens.length || 0), icon: "🪙", color: "var(--cyan)" },
                ].map((stat, i) => (
                  <SectionReveal key={i}>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-black mb-1" style={{ color: `hsl(${stat.color})` }}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                    </div>
                  </SectionReveal>
                ))}
              </div>
              <div className="card-glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Live Bot Activity Log
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "hsl(var(--cyan))" }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--cyan))" }} />
                    LIVE
                  </div>
                </div>
                {botLogs.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No bot activity yet. Submit a token to activate bots! 🤖
                  </div>
                ) : (
                  <div className="space-y-1">
                    {botLogs.map((a, i) => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-3 transition-colors animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === "live" ? "animate-pulse" : ""}`}
                          style={{ background: a.status === "live" ? "hsl(120 70% 50%)" : "hsl(var(--muted-foreground))" }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs" style={{ color: "hsl(var(--cyan))" }}>{a.token_symbol}</span>
                            <span className="text-muted-foreground text-xs">→</span>
                            <span className="text-xs truncate">{a.action_detail}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{a.platform}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleTimeString()}</div>
                          {a.status === "live" && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "hsl(120 70% 50% / 0.12)", color: "hsl(120 70% 55%)" }}>LIVE</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-16 px-4" style={{ background: "hsl(var(--surface-1))" }}>
        <div className="container max-w-4xl">
          <SectionReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-3">PROMOTION <span style={{ color: "hsl(var(--purple))" }}>PACKAGES</span></h2>
              <p className="text-sm text-muted-foreground">Real services delivered on-chain — pay with SOL, results start immediately</p>
            </div>
          </SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKAGES.map((p) => (
              <SectionReveal key={p.key}>
                <div
                  className="card-glass rounded-2xl p-6 relative transition-all hover:-translate-y-1.5 duration-300 h-full flex flex-col"
                  style={{
                    border: `1px solid hsl(${p.color} / ${p.popular ? "0.6" : "0.22"})`,
                    boxShadow: p.popular ? `0 0 50px hsl(${p.color} / 0.18)` : "none",
                  }}
                >
                  {p.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))", color: "white" }}>
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  <div className="mb-5">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{p.name}</div>
                    <div className="text-3xl font-black" style={{ color: `hsl(${p.color})` }}>{p.price}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.duration} promotion</div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: `hsl(${p.color})` }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      handlePkgSelect(p.key);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={p.popular ? {
                      background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.7))",
                      color: "white",
                      boxShadow: "0 0 24px hsl(var(--purple) / 0.35)",
                    } : {
                      border: `1px solid hsl(${p.color} / 0.4)`,
                      color: `hsl(${p.color})`,
                      background: `hsl(${p.color} / 0.08)`,
                    }}
                  >
                    {p.price === "Free" ? "Start Free" : `Select — ${p.price}`}
                  </button>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover" }} />
        <div className="absolute inset-0" style={{ background: "hsl(var(--background) / 0.88)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <SectionReveal>
            <div className="text-5xl mb-5">🚀</div>
            <h2 className="text-4xl font-black mb-4">READY TO <span style={{ color: "hsl(var(--purple))" }}>MOON</span>?</h2>
            <p className="text-muted-foreground mb-8 text-base">Submit your token now and let our network amplify your reach across the entire crypto ecosystem.</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-10 py-4 rounded-xl font-bold text-base transition-all active:scale-95 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))", color: "white", boxShadow: "0 0 40px hsl(var(--purple) / 0.4)" }}
            >
              🔥 Start Promoting Now
            </button>
          </SectionReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t" style={{ background: "hsl(var(--surface-1))", borderColor: "hsl(var(--border) / 0.6)" }}>
        {/* Disclaimer */}
        <div className="border-b py-4 px-4" style={{ borderColor: "hsl(var(--border) / 0.4)", background: "hsl(var(--surface-2))" }}>
          <div className="container max-w-4xl">
            <p className="text-xs text-muted-foreground/70 text-center leading-relaxed">
              ⚠️ {DISCLAIMER}
            </p>
          </div>
        </div>
        <div className="py-8 px-4">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan)))" }}>
                <Rocket className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-sm text-foreground">PromoteMemes</span>
            </div>
            <div>© 2025 PromoteMemes. Solana meme coin amplification.</div>
            <div className="flex gap-5">
              <a href="https://x.com/sniper44583" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Twitter className="w-3 h-3" /> Twitter/X
              </a>
              <a href="https://t.me/promotememesai" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Send className="w-3 h-3" /> Telegram
              </a>
              <a href="/admin" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
