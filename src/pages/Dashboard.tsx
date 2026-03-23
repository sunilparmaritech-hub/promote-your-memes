import { useState, useEffect, useCallback, useRef } from "react";
import {
  Rocket, TrendingUp, Users, BarChart3, Zap, Shield, Trophy, RefreshCw,
  Copy, ExternalLink, Twitter, Send, MessageSquare, Activity, Target,
  Flame, Star, Crown, Diamond, Brain, Waves, Clock, CheckCircle2,
  AlertTriangle, AlertCircle, Search, ChevronRight, Share2, Gift,
  Play, Pause, Eye, Wallet, ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

// ─── Types ────────────────────────────────────────────────────────────────────

type Campaign = {
  id: string; name: string; campaign_type: string; status: string;
  description: string; target_participants: number; current_participants: number;
  end_time: string | null; token_symbol: string | null; reward_pool: number;
  created_at: string;
};

type Mission = {
  id: string; title: string; description: string; mission_type: string;
  reward_points: number; required_amount: number | null; status: string;
  expires_at: string | null; completions_count: number; token_symbol: string | null;
};

type WalletLabel = {
  id: string; wallet_address: string; label: string; score: number;
  total_volume_sol: number; tokens_tracked: number; win_rate: number;
  last_activity: string;
};

type TokenRow = {
  id: string; token_address: string; token_symbol: string | null;
  token_name: string | null; promotion_type: string; price_sol: number;
  status: string; created_at: string; views: number | null; engagement_score: number | null;
};

type RiskScore = {
  token_address: string; risk_level: string; honeypot_detected: boolean;
  liquidity_locked: boolean; contract_renounced: boolean;
  top_holder_pct: number; liquidity_sol: number; risk_notes: string[];
};

// ─── Simulated Trending Tokens (Pump.fun style) ──────────────────────────────

const TRENDING_SIMULATED = [
  { symbol: "BONK", name: "Bonk", mc: "$4.2M", change: "+312%", volume: "892K", holders: 4821, hot: true, age: "2h", img: "🐕" },
  { symbol: "PEPE", name: "PepeSol", mc: "$891K", change: "+187%", volume: "231K", holders: 1243, hot: true, age: "5h", img: "🐸" },
  { symbol: "MOON", name: "MoonShib", mc: "$2.1M", change: "+94%", volume: "445K", holders: 2109, hot: false, age: "12h", img: "🌙" },
  { symbol: "DOGE2", name: "DogeKing", mc: "$312K", change: "+441%", volume: "78K", holders: 892, hot: true, age: "1h", img: "👑" },
  { symbol: "CHAD", name: "ChadToken", mc: "$1.5M", change: "+223%", volume: "567K", holders: 3201, hot: true, age: "3h", img: "💪" },
  { symbol: "FROG", name: "FrogArmy", mc: "$458K", change: "+156%", volume: "123K", holders: 789, hot: false, age: "8h", img: "🐸" },
  { symbol: "APE", name: "SolApe", mc: "$789K", change: "+78%", volume: "234K", holders: 1567, hot: false, age: "1d", img: "🦍" },
  { symbol: "ROCKET", name: "RocketFuel", mc: "$3.1M", change: "+512%", volume: "1.2M", holders: 5432, hot: true, age: "30m", img: "🚀" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function timeLeft(dateStr: string | null) {
  if (!dateStr) return "∞";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getRiskColor(level: string) {
  if (level === "safe") return "hsl(120 70% 50%)";
  if (level === "low") return "hsl(160 70% 50%)";
  if (level === "medium") return "hsl(45 100% 55%)";
  if (level === "high") return "hsl(20 100% 55%)";
  if (level === "honeypot") return "hsl(0 80% 55%)";
  return "hsl(var(--muted-foreground))";
}

function getMissionIcon(type: string) {
  if (type === "buy") return "💰";
  if (type === "hold") return "💎";
  if (type === "share") return "📢";
  if (type === "invite") return "👥";
  if (type === "follow") return "✈️";
  return "⭐";
}

function getCampaignIcon(type: string) {
  if (type === "pump_hour") return "🚀";
  if (type === "dip_buy") return "📉";
  if (type === "hold") return "💎";
  if (type === "raid") return "⚡";
  return "🎯";
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number | string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
      style={{
        background: active ? "hsl(var(--purple) / 0.2)" : "transparent",
        color: active ? "hsl(var(--purple))" : "hsl(var(--muted-foreground))",
        border: active ? "1px solid hsl(var(--purple) / 0.4)" : "1px solid transparent",
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: active ? "hsl(var(--purple))" : "hsl(var(--muted))", color: active ? "white" : "hsl(var(--muted-foreground))" }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────

function SCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${className}`}
      style={{ background: "hsl(var(--surface-1))", borderColor: "hsl(var(--border))" }}>
      {children}
    </div>
  );
}

// ─── AI Post Generator ────────────────────────────────────────────────────────

function AIPromoPanel() {
  const [symbol, setSymbol] = useState("");
  const [address, setAddress] = useState("");
  const [templateType, setTemplateType] = useState("early_gem");
  const [platform, setPlatform] = useState("twitter");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ symbol: symbol.trim(), address: address.trim() || undefined, templateType, platform, useAI: true }),
        }
      );
      const data = await res.json();
      if (data.post) setGenerated(data.post);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const TYPES = [
    { key: "early_gem", label: "🔮 Early Gem Alert" },
    { key: "whale_alert", label: "🐳 Whale Alert" },
    { key: "volume_spike", label: "📈 Volume Spike" },
    { key: "community_raid", label: "⚡ Community Raid" },
  ];

  const PLATFORMS = [
    { key: "twitter", label: "𝕏 Twitter/X", icon: <Twitter className="w-3 h-3" /> },
    { key: "telegram", label: "Telegram", icon: <Send className="w-3 h-3" /> },
    { key: "discord", label: "Discord", icon: <MessageSquare className="w-3 h-3" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Token Symbol *</label>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            placeholder="e.g. BONK"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", ["--tw-ring-color" as string]: "hsl(var(--purple))" }}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Contract Address</label>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Solana CA (optional)"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", ["--tw-ring-color" as string]: "hsl(var(--purple))" }}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Template Type</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setTemplateType(t.key)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: templateType === t.key ? "hsl(var(--purple) / 0.2)" : "hsl(var(--surface-3))",
                color: templateType === t.key ? "hsl(var(--purple))" : "hsl(var(--muted-foreground))",
                border: `1px solid ${templateType === t.key ? "hsl(var(--purple) / 0.5)" : "hsl(var(--border))"}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Platform</label>
        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <button key={p.key} onClick={() => setPlatform(p.key)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: platform === p.key ? "hsl(var(--cyan) / 0.15)" : "hsl(var(--surface-3))",
                color: platform === p.key ? "hsl(var(--cyan))" : "hsl(var(--muted-foreground))",
                border: `1px solid ${platform === p.key ? "hsl(var(--cyan) / 0.4)" : "hsl(var(--border))"}`,
              }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading || !symbol.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))",
          color: "white",
          boxShadow: "0 0 20px hsl(var(--purple) / 0.3)",
        }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {loading ? "Generating with AI..." : "Generate AI Post"}
      </button>

      {generated && (
        <div className="rounded-xl p-4 relative" style={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))" }}>
          <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
            {generated}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={copy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{ background: copied ? "hsl(120 70% 50% / 0.15)" : "hsl(var(--surface-2))", color: copied ? "hsl(120 70% 50%)" : "hsl(var(--muted-foreground))" }}>
              <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
            </button>
            {platform === "twitter" && (
              <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(generated)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: "hsl(210 100% 56% / 0.15)", color: "hsl(210 100% 56%)" }}>
                <Twitter className="w-3 h-3" /> Post to X
              </a>
            )}
            {platform === "telegram" && (
              <a href="https://t.me/promotememesai" target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: "hsl(200 90% 55% / 0.15)", color: "hsl(200 90% 55%)" }}>
                <Send className="w-3 h-3" /> Share on TG
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Risk Analyzer ────────────────────────────────────────────────────────────

function RiskAnalyzer() {
  const [addr, setAddr] = useState("");
  const [result, setResult] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!addr.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));

    // Simulated risk analysis (real integration would use RugCheck/GoPlus API)
    const rand = Math.random();
    const isHoneypot = rand < 0.08;
    const isHigh = rand < 0.2;
    const isMedium = rand < 0.45;

    let risk_level = "safe";
    if (isHoneypot) risk_level = "honeypot";
    else if (isHigh) risk_level = "high";
    else if (isMedium) risk_level = "medium";
    else if (rand < 0.65) risk_level = "low";

    const notes: string[] = [];
    if (isHoneypot) notes.push("Cannot sell — honeypot detected!", "Dev wallet holds 95% of supply");
    else if (isHigh) {
      if (Math.random() > 0.5) notes.push("Top 10 holders own 80% of supply");
      if (Math.random() > 0.5) notes.push("Liquidity not locked");
      notes.push("High rug risk — exercise extreme caution");
    } else if (isMedium) {
      notes.push("Moderate concentration in top wallets");
      if (Math.random() > 0.5) notes.push("No audit found");
    } else {
      notes.push("Liquidity appears stable");
      if (Math.random() > 0.3) notes.push("Contract renounced");
    }

    setResult({
      token_address: addr.trim(),
      risk_level,
      honeypot_detected: isHoneypot,
      liquidity_locked: !isHigh && Math.random() > 0.3,
      contract_renounced: !isHoneypot && Math.random() > 0.4,
      top_holder_pct: isHoneypot ? 95 : isHigh ? 70 + Math.random() * 20 : 20 + Math.random() * 30,
      liquidity_sol: isHoneypot ? 0.5 : 10 + Math.random() * 500,
      risk_notes: notes,
    });
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg text-xs" style={{ background: "hsl(45 100% 55% / 0.08)", border: "1px solid hsl(45 100% 55% / 0.2)", color: "hsl(45 100% 55%)" }}>
        <div className="flex items-center gap-2 font-semibold mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Disclaimer</div>
        Risk analysis is simulated for demo purposes. Always DYOR before investing in any token.
      </div>

      <div className="flex gap-2">
        <input
          value={addr}
          onChange={e => setAddr(e.target.value)}
          placeholder="Paste Solana token contract address..."
          className="flex-1 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
          style={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
        />
        <button
          onClick={analyze}
          disabled={loading || !addr.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))", color: "white" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Scanning..." : "Scan"}
        </button>
      </div>

      {result && (
        <div className="rounded-xl p-4 space-y-4" style={{ background: "hsl(var(--surface-2))", border: `2px solid ${getRiskColor(result.risk_level)}30` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-mono">{result.token_address.slice(0, 16)}...{result.token_address.slice(-8)}</div>
              <div className="text-xl font-black mt-1 capitalize" style={{ color: getRiskColor(result.risk_level) }}>
                {result.honeypot_detected ? "🚨 HONEYPOT" : result.risk_level === "high" ? "⚠️ HIGH RISK" : result.risk_level === "medium" ? "🟡 MEDIUM RISK" : result.risk_level === "low" ? "🟢 LOW RISK" : "✅ SAFE"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black" style={{ color: getRiskColor(result.risk_level) }}>
                {result.honeypot_detected ? "0" : result.risk_level === "high" ? "20" : result.risk_level === "medium" ? "55" : result.risk_level === "low" ? "78" : "92"}
              </div>
              <div className="text-xs text-muted-foreground">Safety Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Honeypot", value: result.honeypot_detected ? "⚠️ YES" : "✅ No", bad: result.honeypot_detected },
              { label: "Liq. Locked", value: result.liquidity_locked ? "✅ Yes" : "⚠️ No", bad: !result.liquidity_locked },
              { label: "Renounced", value: result.contract_renounced ? "✅ Yes" : "⚠️ No", bad: !result.contract_renounced },
              { label: "Top Holder %", value: `${result.top_holder_pct.toFixed(1)}%`, bad: result.top_holder_pct > 50 },
              { label: "Liquidity", value: `${result.liquidity_sol.toFixed(1)} SOL`, bad: result.liquidity_sol < 10 },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center px-2 py-1.5 rounded-lg"
                style={{ background: "hsl(var(--surface-3))" }}>
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold" style={{ color: item.bad ? "hsl(0 80% 60%)" : "hsl(120 70% 55%)" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {result.risk_notes.length > 0 && (
            <div className="space-y-1">
              {result.risk_notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 text-xs"
                  style={{ color: result.risk_level === "honeypot" || result.risk_level === "high" ? "hsl(0 80% 65%)" : "hsl(45 100% 65%)" }}>
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { wallet, connect } = useSolanaWallet();
  const [activeTab, setActiveTab] = useState<
    "discover" | "ai_promo" | "missions" | "wallets" | "campaigns" | "viral" | "risk" | "analytics"
  >("discover");

  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [walletLabels, setWalletLabels] = useState<WalletLabel[]>([]);
  const [loading, setLoading] = useState(true);

  const [refCode, setRefCode] = useState("");
  const [refCopied, setRefCopied] = useState(false);
  const [joinedCampaigns, setJoinedCampaigns] = useState<Set<string>>(new Set());
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [totalPoints, setTotalPoints] = useState(0);

  // Analytics simulated data
  const [analyticsData] = useState({
    totalTokens: 847, totalVolume: "12.4K SOL", totalUsers: 3241, conversionRate: "8.4%",
    avgEngagement: "234", weeklyGrowth: "+47%",
    chartData: Array.from({ length: 7 }, (_, i) => ({
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      submissions: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 10) + 2,
    })),
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [tokRes, campRes, missRes, wallRes] = await Promise.all([
      supabase.from("token_submissions").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("campaigns").select("*").order("current_participants", { ascending: false }),
      supabase.from("community_missions").select("*").eq("status", "active").order("reward_points", { ascending: false }),
      supabase.from("wallet_labels").select("*").order("score", { ascending: false }).limit(10),
    ]);
    if (tokRes.data) setTokens(tokRes.data as TokenRow[]);
    if (campRes.data) setCampaigns(campRes.data as Campaign[]);
    if (missRes.data) setMissions(missRes.data as Mission[]);
    if (wallRes.data) setWalletLabels(wallRes.data as WalletLabel[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Generate referral code from wallet
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setRefCode(`PM${wallet.publicKey.slice(0, 6).toUpperCase()}`);
    } else {
      setRefCode("PM" + Math.random().toString(36).slice(2, 8).toUpperCase());
    }
  }, [wallet.connected, wallet.publicKey]);

  const joinCampaign = (id: string, points: number) => {
    if (joinedCampaigns.has(id)) return;
    setJoinedCampaigns(prev => new Set([...prev, id]));
    setTotalPoints(prev => prev + points);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, current_participants: c.current_participants + 1 } : c));
  };

  const completeMission = (id: string, points: number) => {
    if (completedMissions.has(id)) return;
    setCompletedMissions(prev => new Set([...prev, id]));
    setTotalPoints(prev => prev + points);
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completions_count: m.completions_count + 1 } : m));
  };

  const copyRef = () => {
    const shareText = `🚀 Join PromoteMemes — the #1 Solana meme coin promotion platform!\nUse my code ${refCode} for bonus points!\nhttps://promotememeai.lovable.app`;
    navigator.clipboard.writeText(shareText);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  const allTokens = [...TRENDING_SIMULATED, ...tokens.map(t => ({
    symbol: t.token_symbol || "?", name: t.token_name || t.token_symbol || "?",
    mc: `${t.price_sol} SOL`, change: "+NEW", volume: "—",
    holders: Math.floor(Math.random() * 1000) + 100, hot: t.promotion_type === "premium",
    age: timeAgo(t.created_at), img: "🚀", isLive: true,
  }))];

  const TABS = [
    { key: "discover", label: "Discover", icon: <TrendingUp className="w-3.5 h-3.5" />, badge: allTokens.length },
    { key: "ai_promo", label: "AI Promo", icon: <Zap className="w-3.5 h-3.5" /> },
    { key: "campaigns", label: "Campaigns", icon: <Target className="w-3.5 h-3.5" />, badge: campaigns.filter(c => c.status === "active").length },
    { key: "missions", label: "Missions", icon: <Trophy className="w-3.5 h-3.5" />, badge: missions.length },
    { key: "wallets", label: "Wallets", icon: <Brain className="w-3.5 h-3.5" /> },
    { key: "viral", label: "Viral Loop", icon: <Share2 className="w-3.5 h-3.5" /> },
    { key: "risk", label: "Risk Check", icon: <Shield className="w-3.5 h-3.5" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(20px)", borderColor: "hsl(var(--border))" }}>
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan)))" }}>
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight hidden sm:block">
                Promote<span style={{ color: "hsl(var(--purple))" }}>Memes</span>
              </span>
            </a>
            <span className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: "hsl(var(--purple) / 0.15)", color: "hsl(var(--purple))" }}>
              <Activity className="w-3 h-3" /> Growth Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            {totalPoints > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full"
                style={{ background: "hsl(45 100% 55% / 0.12)", color: "hsl(45 100% 55%)" }}>
                <Star className="w-3.5 h-3.5" />
                {totalPoints.toLocaleString()} pts
              </div>
            )}
            <button
              onClick={load}
              className="p-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {wallet.connected ? (
              <span className="text-xs font-mono px-2 py-1.5 rounded-lg"
                style={{ background: "hsl(var(--cyan) / 0.1)", color: "hsl(var(--cyan))" }}>
                {wallet.publicKey!.slice(0, 4)}…{wallet.publicKey!.slice(-4)}
              </span>
            ) : (
              <button onClick={connect}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))", color: "white" }}>
                <Wallet className="w-3.5 h-3.5" /> Connect
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="container pb-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <TabBtn key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
                icon={t.icon} label={t.label} badge={"badge" in t ? t.badge : undefined} />
            ))}
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* ── Module 1: Token Discovery ── */}
        {activeTab === "discover" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">🔍 Token Discovery Engine</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Trending tokens ranked by volume, holders & social signals</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: "hsl(120 70% 50% / 0.12)", color: "hsl(120 70% 50%)" }}>
                  ● Live Feed
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Tokens Listed", value: `${847 + tokens.length}`, icon: <Rocket className="w-4 h-4" />, color: "hsl(var(--purple))" },
                { label: "Total Volume", value: "12.4K SOL", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(var(--cyan))" },
                { label: "Active Users", value: "3,241", icon: <Users className="w-4 h-4" />, color: "hsl(120 70% 50%)" },
                { label: "Trending Now", value: `${TRENDING_SIMULATED.filter(t => t.hot).length}`, icon: <Flame className="w-4 h-4" />, color: "hsl(20 100% 60%)" },
              ].map(s => (
                <SCard key={s.label}>
                  <div className="flex items-center gap-2 mb-1" style={{ color: s.color }}>
                    {s.icon}
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                </SCard>
              ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {["🔥 Hot", "⚡ New", "🐳 Whale Activity", "📈 Volume Spike"].map(f => (
                <button key={f} className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={{ background: f === "🔥 Hot" ? "hsl(var(--purple) / 0.2)" : "hsl(var(--surface-2))", color: f === "🔥 Hot" ? "hsl(var(--purple))" : "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Token Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {allTokens.map((token, i) => (
                <SCard key={i} className={`relative overflow-hidden group cursor-pointer transition-all ${token.hot ? "border-purple" : ""}`}>
                  {token.hot && (
                    <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "hsl(20 100% 60% / 0.2)", color: "hsl(20 100% 60%)" }}>
                      🔥 HOT
                    </div>
                  )}
                  {"isLive" in token && token.isLive && (
                    <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "hsl(120 70% 50% / 0.15)", color: "hsl(120 70% 50%)" }}>
                      ● LIVE
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{token.img}</div>
                    <div>
                      <div className="font-black text-sm">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                    <div className="text-muted-foreground">Market Cap</div>
                    <div className="font-semibold text-right">{token.mc}</div>
                    <div className="text-muted-foreground">24h Change</div>
                    <div className="font-bold text-right" style={{ color: "hsl(120 70% 55%)" }}>{token.change}</div>
                    {"volume" in token && <><div className="text-muted-foreground">Volume</div><div className="font-semibold text-right">{token.volume}</div></>}
                    {"holders" in token && <><div className="text-muted-foreground">Holders</div><div className="font-semibold text-right">{typeof token.holders === 'number' ? token.holders.toLocaleString() : token.holders}</div></>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{token.age}</span>
                    <a href="/" className="flex items-center gap-1 text-xs font-bold transition-all"
                      style={{ color: "hsl(var(--cyan))" }}>
                      Promote <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </SCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Module 2: AI Promotion Engine ── */}
        {activeTab === "ai_promo" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black">⚡ AI Promotion Engine</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Generate viral posts powered by AI for Twitter, Telegram & Discord</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: "hsl(var(--purple))" }} />
                  Generate AI Post
                </h3>
                <AIPromoPanel />
              </SCard>
              <div className="space-y-3">
                <SCard>
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: "hsl(var(--cyan))" }} />
                    Template Library
                  </h3>
                  <div className="space-y-2">
                    {[
                      { type: "🔮 Early Gem Alert", platforms: ["Twitter", "Telegram", "Discord"], count: 3 },
                      { type: "🐳 Whale Alert", platforms: ["Twitter", "Telegram"], count: 3 },
                      { type: "📈 Volume Spike", platforms: ["Twitter", "Telegram", "Discord"], count: 3 },
                      { type: "⚡ Community Raid", platforms: ["Telegram", "Discord"], count: 3 },
                    ].map(t => (
                      <div key={t.type} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: "hsl(var(--surface-2))" }}>
                        <div>
                          <div className="text-sm font-semibold">{t.type}</div>
                          <div className="text-xs text-muted-foreground">{t.platforms.join(" · ")}</div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                          {t.count} variants
                        </span>
                      </div>
                    ))}
                  </div>
                </SCard>
                <SCard>
                  <h3 className="font-bold text-sm mb-3">📊 Post Performance Stats</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Posts Generated", value: "12,847", color: "hsl(var(--purple))" },
                      { label: "Avg Engagement", value: "4.2%", color: "hsl(var(--cyan))" },
                      { label: "Total Reach", value: "2.1M", color: "hsl(120 70% 55%)" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: "hsl(var(--surface-2))" }}>
                        <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </SCard>
              </div>
            </div>
          </div>
        )}

        {/* ── Module 7: Campaign Controller ── */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">🎯 Campaign Controller</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Join live community campaigns to drive real organic volume</p>
              </div>
              {totalPoints > 0 && (
                <div className="text-sm font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "hsl(45 100% 55% / 0.12)", color: "hsl(45 100% 55%)" }}>
                  ⭐ {totalPoints.toLocaleString()} pts
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl animate-pulse" style={{ background: "hsl(var(--surface-2))" }} />
                ))
              ) : campaigns.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-muted-foreground">No active campaigns</div>
              ) : campaigns.map(c => {
                const pct = Math.min(100, Math.round((c.current_participants / c.target_participants) * 100));
                const joined = joinedCampaigns.has(c.id);
                const reward = c.campaign_type === "pump_hour" ? 500 : c.campaign_type === "hold" ? 300 : 250;
                return (
                  <SCard key={c.id} className="relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5"
                      style={{ background: `linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan)))` }} />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-2xl">{getCampaignIcon(c.campaign_type)}</div>
                        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold"
                          style={{ background: "hsl(120 70% 50% / 0.12)", color: "hsl(120 70% 50%)" }}>
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(120 70% 50%)" }} />
                          LIVE
                        </div>
                      </div>
                      <h3 className="font-black text-sm mb-1">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.description}</p>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{c.current_participants} / {c.target_participants} joined</span>
                          <span className="font-semibold" style={{ color: "hsl(var(--cyan))" }}>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-3))" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(var(--purple)), hsl(var(--cyan)))" }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {c.end_time ? timeLeft(c.end_time) : "∞"} left
                        </div>
                        <button
                          onClick={() => joinCampaign(c.id, reward)}
                          disabled={joined}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-60"
                          style={{
                            background: joined ? "hsl(var(--surface-3))" : "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))",
                            color: joined ? "hsl(var(--muted-foreground))" : "white",
                          }}>
                          {joined ? <><CheckCircle2 className="w-3 h-3" /> Joined</> : <><Play className="w-3 h-3" /> Join +{reward}pts</>}
                        </button>
                      </div>
                    </div>
                  </SCard>
                );
              })}
            </div>

            {/* Leaderboard Preview */}
            <SCard>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4" style={{ color: "hsl(45 100% 55%)" }} />
                Campaign Leaderboard
              </h3>
              <div className="space-y-2">
                {[
                  { rank: 1, wallet: "7xKX...AsU", points: 12450, badge: "🥇" },
                  { rank: 2, wallet: "3h1z...UjX", points: 9820, badge: "🥈" },
                  { rank: 3, wallet: "9mNP...nYZ", points: 8340, badge: "🥉" },
                  { rank: 4, wallet: "5rFK...xJQ", points: 6120, badge: "4️⃣" },
                  { rank: 5, wallet: "4eLb...vK", points: 4890, badge: "5️⃣" },
                ].map(r => (
                  <div key={r.rank} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: r.rank === 1 ? "hsl(45 100% 55% / 0.08)" : "hsl(var(--surface-2))" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{r.badge}</span>
                      <span className="text-sm font-mono text-muted-foreground">{r.wallet}</span>
                    </div>
                    <span className="font-black text-sm" style={{ color: r.rank === 1 ? "hsl(45 100% 55%)" : "hsl(var(--foreground))" }}>
                      {r.points.toLocaleString()} pts
                    </span>
                  </div>
                ))}
                {totalPoints > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg border"
                    style={{ background: "hsl(var(--purple) / 0.08)", borderColor: "hsl(var(--purple) / 0.3)" }}>
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4" style={{ color: "hsl(var(--purple))" }} />
                      <span className="text-sm font-semibold" style={{ color: "hsl(var(--purple))" }}>You</span>
                    </div>
                    <span className="font-black text-sm" style={{ color: "hsl(var(--purple))" }}>
                      {totalPoints.toLocaleString()} pts
                    </span>
                  </div>
                )}
              </div>
            </SCard>
          </div>
        )}

        {/* ── Module 3: Community Missions ── */}
        {activeTab === "missions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">🏆 Community Missions</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Complete tasks, earn points, climb the leaderboard</p>
              </div>
              <div className="text-sm font-bold px-3 py-1.5 rounded-full"
                style={{ background: "hsl(45 100% 55% / 0.12)", color: "hsl(45 100% 55%)" }}>
                ⭐ {totalPoints.toLocaleString()} pts
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "hsl(var(--surface-2))" }} />
                ))
              ) : missions.map(m => {
                const done = completedMissions.has(m.id);
                return (
                  <SCard key={m.id} className="relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl mt-0.5">{getMissionIcon(m.mission_type)}</div>
                        <div className="flex-1">
                          <h3 className="font-black text-sm mb-0.5">{m.title}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{m.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {m.completions_count} completed
                            {m.expires_at && (
                              <><span>·</span><Clock className="w-3 h-3" />{timeLeft(m.expires_at)}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-3">
                        <div className="font-black text-sm" style={{ color: "hsl(45 100% 55%)" }}>
                          +{m.reward_points} pts
                        </div>
                        <button
                          onClick={() => completeMission(m.id, m.reward_points)}
                          disabled={done}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-60"
                          style={{
                            background: done ? "hsl(var(--surface-3))" : "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))",
                            color: done ? "hsl(var(--muted-foreground))" : "white",
                          }}>
                          {done ? "✓ Done" : "Complete"}
                        </button>
                      </div>
                    </div>
                  </SCard>
                );
              })}
            </div>

            {/* Points Breakdown */}
            {totalPoints > 0 && (
              <SCard>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" style={{ color: "hsl(var(--cyan))" }} />
                  Your Rewards Summary
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Points", value: totalPoints.toLocaleString(), color: "hsl(45 100% 55%)" },
                    { label: "Missions Done", value: completedMissions.size.toString(), color: "hsl(var(--cyan))" },
                    { label: "Rank", value: totalPoints > 5000 ? "🥇 Gold" : totalPoints > 2000 ? "🥈 Silver" : "🥉 Bronze", color: "hsl(var(--purple))" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "hsl(var(--surface-2))" }}>
                      <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </SCard>
            )}
          </div>
        )}

        {/* ── Module 5: Wallet Intelligence ── */}
        {activeTab === "wallets" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black">🧠 Wallet Intelligence Layer</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Track top wallets — smart money, whales, early adopters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "hsl(var(--surface-2))" }} />
                ))
              ) : walletLabels.map((w, i) => (
                <SCard key={w.id} className="relative">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "hsl(var(--surface-3))" }}>
                      {w.label.includes("Smart") ? "🧠" : w.label.includes("Whale") ? "🐳" : w.label.includes("Early") ? "⚡" : w.label.includes("Diamond") ? "💎" : "🎰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm">{w.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "hsl(var(--purple) / 0.15)", color: "hsl(var(--purple))" }}>
                          #{i + 1}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mb-2 truncate">
                        {w.wallet_address.slice(0, 8)}...{w.wallet_address.slice(-8)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Score</div>
                          <div className="font-bold" style={{ color: "hsl(var(--cyan))" }}>{w.score}/100</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Volume</div>
                          <div className="font-bold">{w.total_volume_sol.toLocaleString()} SOL</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Win Rate</div>
                          <div className="font-bold" style={{ color: "hsl(120 70% 55%)" }}>{w.win_rate}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground">Last active</div>
                      <div className="text-xs font-semibold">{timeAgo(w.last_activity)}</div>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-3))" }}>
                      <div className="h-full rounded-full" style={{ width: `${w.score}%`, background: "linear-gradient(90deg, hsl(var(--purple)), hsl(var(--cyan)))" }} />
                    </div>
                  </div>
                </SCard>
              ))}
            </div>

            {/* Wallet Flow */}
            <SCard>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Waves className="w-4 h-4" style={{ color: "hsl(var(--cyan))" }} />
                Recent Wallet Activity
              </h3>
              <div className="space-y-2">
                {[
                  { wallet: "Smart Money 🧠", action: "Bought", token: "BONK", amount: "42.5 SOL", dir: "buy", time: "2m ago" },
                  { wallet: "Whale 🐳", action: "Bought", token: "PEPE", amount: "189.2 SOL", dir: "buy", time: "8m ago" },
                  { wallet: "Early Adopter ⚡", action: "Sold", token: "DOGE2", amount: "12.1 SOL", dir: "sell", time: "15m ago" },
                  { wallet: "Degen Trader 🎰", action: "Bought", token: "MOON", amount: "8.7 SOL", dir: "buy", time: "23m ago" },
                  { wallet: "Diamond Hands 💎", action: "Bought", token: "CHAD", amount: "56.3 SOL", dir: "buy", time: "31m ago" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "hsl(var(--surface-2))" }}>
                    <div className="flex items-center gap-2">
                      {a.dir === "buy"
                        ? <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "hsl(120 70% 55%)" }} />
                        : <ArrowDownRight className="w-3.5 h-3.5" style={{ color: "hsl(0 80% 60%)" }} />}
                      <div>
                        <span className="text-xs font-semibold">{a.wallet}</span>
                        <span className="text-xs text-muted-foreground"> {a.action} </span>
                        <span className="text-xs font-bold" style={{ color: "hsl(var(--cyan))" }}>${a.token}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: a.dir === "buy" ? "hsl(120 70% 55%)" : "hsl(0 80% 60%)" }}>
                        {a.amount}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SCard>
          </div>
        )}

        {/* ── Module 6: Viral Loop ── */}
        {activeTab === "viral" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black">🔄 Viral Loop Engine</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Refer friends, share token cards, earn rewards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Referral System */}
              <SCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Gift className="w-4 h-4" style={{ color: "hsl(var(--purple))" }} />
                  Your Referral Code
                </h3>
                <div className="text-center py-4">
                  <div className="text-4xl font-black tracking-wider mb-2"
                    style={{ color: "hsl(var(--cyan))", letterSpacing: "0.2em" }}>
                    {refCode}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Share this code to earn 750 pts per invite</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={copyRef}
                      className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))", color: "white" }}>
                      {refCopied ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Invite Link</>}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(`🚀 Join PromoteMemes — the #1 Solana meme coin promo platform!\nCode: ${refCode}\nhttps://promotememeai.lovable.app\n#Solana #MemeCoin`)}`}
                        target="_blank" rel="noreferrer"
                        className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: "hsl(210 100% 56% / 0.15)", color: "hsl(210 100% 56%)" }}>
                        <Twitter className="w-3.5 h-3.5" /> Share on X
                      </a>
                      <a href="https://t.me/promotememesai" target="_blank" rel="noreferrer"
                        className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: "hsl(200 90% 55% / 0.15)", color: "hsl(200 90% 55%)" }}>
                        <Send className="w-3.5 h-3.5" /> TG Community
                      </a>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-3 mt-2 grid grid-cols-3 gap-3" style={{ borderColor: "hsl(var(--border))" }}>
                  {[
                    { label: "Referrals", value: "0" },
                    { label: "Points Earned", value: "0" },
                    { label: "Rank", value: "—" },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="font-black text-lg" style={{ color: "hsl(var(--cyan))" }}>{s.value}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </SCard>

              {/* Shareable Token Cards */}
              <SCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Share2 className="w-4 h-4" style={{ color: "hsl(var(--cyan))" }} />
                  Shareable Token Cards
                </h3>
                <div className="space-y-3">
                  {TRENDING_SIMULATED.slice(0, 4).map((token, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{token.img}</span>
                        <div>
                          <div className="font-bold text-sm">${token.symbol}</div>
                          <div className="text-xs font-semibold" style={{ color: "hsl(120 70% 55%)" }}>{token.change}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={`https://x.com/intent/tweet?text=${encodeURIComponent(`🚀 ${token.name} ($${token.symbol}) is pumping ${token.change}!\n\nMC: ${token.mc} | Vol: ${token.volume}\n\nGet in early via @promotememesai\nhttps://promotememeai.lovable.app\n\n#Solana #MemeCoin #${token.symbol}`)}`}
                          target="_blank" rel="noreferrer"
                          className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                          style={{ background: "hsl(210 100% 56% / 0.15)", color: "hsl(210 100% 56%)" }}>
                          <Twitter className="w-3 h-3" /> X
                        </a>
                        <a href="https://t.me/promotememesai" target="_blank" rel="noreferrer"
                          className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                          style={{ background: "hsl(200 90% 55% / 0.15)", color: "hsl(200 90% 55%)" }}>
                          <Send className="w-3 h-3" /> TG
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </SCard>
            </div>

            {/* Growth Loop Visual */}
            <SCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: "hsl(var(--purple))" }} />
                Growth Loop Mechanics
              </h3>
              <div className="flex items-center justify-around flex-wrap gap-4">
                {[
                  { icon: "📢", label: "Share Token", sublabel: "Post on social" },
                  { icon: "→", label: "", sublabel: "" },
                  { icon: "👥", label: "Friends Join", sublabel: "via your code" },
                  { icon: "→", label: "", sublabel: "" },
                  { icon: "💰", label: "Earn Points", sublabel: "750 pts per invite" },
                  { icon: "→", label: "", sublabel: "" },
                  { icon: "🏆", label: "Climb Ranks", sublabel: "Leaderboard rewards" },
                ].map((s, i) => (
                  s.icon === "→" ? (
                    <ChevronRight key={i} className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <div key={i} className="text-center">
                      <div className="text-3xl mb-1">{s.icon}</div>
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.sublabel}</div>
                    </div>
                  )
                ))}
              </div>
            </SCard>
          </div>
        )}

        {/* ── Module 8: Risk & Safety ── */}
        {activeTab === "risk" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black">🛡️ Risk & Safety Layer</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Scan tokens for honeypots, rug risks and liquidity issues before investing</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4" style={{ color: "hsl(var(--purple))" }} />
                  Token Risk Scanner
                </h3>
                <RiskAnalyzer />
              </SCard>
              <div className="space-y-3">
                <SCard>
                  <h3 className="font-bold text-sm mb-3">⚠️ Risk Indicators Guide</h3>
                  <div className="space-y-2">
                    {[
                      { level: "🚨 HONEYPOT", color: "hsl(0 80% 60%)", desc: "Cannot sell — avoid at all costs" },
                      { level: "⚠️ HIGH RISK", color: "hsl(20 100% 60%)", desc: "Concentrated wallets, no lock" },
                      { level: "🟡 MEDIUM RISK", color: "hsl(45 100% 55%)", desc: "Some red flags — trade with caution" },
                      { level: "🟢 LOW RISK", color: "hsl(120 70% 55%)", desc: "Mostly safe, DYOR always" },
                      { level: "✅ SAFE", color: "hsl(120 70% 55%)", desc: "Locked liq, renounced, fair launch" },
                    ].map(r => (
                      <div key={r.level} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ background: "hsl(var(--surface-2))" }}>
                        <span className="text-sm font-bold" style={{ color: r.color }}>{r.level}</span>
                        <span className="text-xs text-muted-foreground flex-1 text-right">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </SCard>
                <SCard>
                  <h3 className="font-bold text-sm mb-3">📊 Community Safety Stats</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Tokens Scanned", value: "5,847", color: "hsl(var(--cyan))" },
                      { label: "Honeypots Found", value: "312", color: "hsl(0 80% 60%)" },
                      { label: "Safe Tokens", value: "4,217", color: "hsl(120 70% 55%)" },
                      { label: "Users Protected", value: "12K+", color: "hsl(var(--purple))" },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-lg text-center"
                        style={{ background: "hsl(var(--surface-2))" }}>
                        <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </SCard>
              </div>
            </div>
          </div>
        )}

        {/* ── Module 9: Analytics Dashboard ── */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black">📊 Analytics Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Track real performance: views → submissions → revenue</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Total Tokens", value: `${847 + tokens.length}`, change: "+47 this week", color: "hsl(var(--purple))", icon: <Rocket className="w-4 h-4" /> },
                { label: "Total Volume", value: "12.4K SOL", change: "+23% vs last week", color: "hsl(var(--cyan))", icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Active Users", value: "3,241", change: "+18% growth", color: "hsl(120 70% 55%)", icon: <Users className="w-4 h-4" /> },
                { label: "Conversion Rate", value: "8.4%", change: "+2.1% vs avg", color: "hsl(45 100% 55%)", icon: <Target className="w-4 h-4" /> },
                { label: "Avg Engagement", value: "234", change: "per token", color: "hsl(200 90% 55%)", icon: <Eye className="w-4 h-4" /> },
                { label: "Weekly Growth", value: "+47%", change: "organic traffic", color: "hsl(var(--purple))", icon: <ArrowUpRight className="w-4 h-4" /> },
              ].map(s => (
                <SCard key={s.label}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>
                    {s.icon}
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.change}</div>
                </SCard>
              ))}
            </div>

            {/* Bar Chart (CSS-only) */}
            <SCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" style={{ color: "hsl(var(--purple))" }} />
                7-Day Submissions & Revenue
              </h3>
              <div className="flex items-end gap-3 h-40">
                {analyticsData.chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5">
                      <div className="flex-1 rounded-t-sm transition-all"
                        style={{ height: `${(d.submissions / 70) * 120}px`, background: "hsl(var(--purple) / 0.7)" }} />
                      <div className="flex-1 rounded-t-sm transition-all"
                        style={{ height: `${(d.revenue / 12) * 120}px`, background: "hsl(var(--cyan) / 0.7)" }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--purple) / 0.7)" }} />
                  <span className="text-muted-foreground">Submissions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: "hsl(var(--cyan) / 0.7)" }} />
                  <span className="text-muted-foreground">Revenue (SOL)</span>
                </div>
              </div>
            </SCard>

            {/* Platform Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { platform: "Twitter/X", icon: <Twitter className="w-4 h-4" />, posts: 12847, reach: "2.1M", engagement: "4.2%", color: "hsl(210 100% 56%)" },
                { platform: "Telegram", icon: <Send className="w-4 h-4" />, posts: 8934, reach: "890K", engagement: "6.8%", color: "hsl(200 90% 55%)" },
                { platform: "Discord", icon: <MessageSquare className="w-4 h-4" />, posts: 4521, reach: "340K", engagement: "9.1%", color: "hsl(235 85% 65%)" },
              ].map(p => (
                <SCard key={p.platform}>
                  <div className="flex items-center gap-2 mb-3" style={{ color: p.color }}>
                    {p.icon}
                    <span className="font-bold text-sm">{p.platform}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Posts</span>
                      <span className="font-semibold">{p.posts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Reach</span>
                      <span className="font-semibold">{p.reach}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="font-bold" style={{ color: "hsl(120 70% 55%)" }}>{p.engagement}</span>
                    </div>
                  </div>
                </SCard>
              ))}
            </div>

            {/* Top Tokens Table */}
            <SCard>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4" style={{ color: "hsl(45 100% 55%)" }} />
                Top Promoted Tokens
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      {["#", "Token", "Package", "Views", "Engagement", "Status"].map(h => (
                        <th key={h} className="text-left pb-2 text-muted-foreground font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(tokens.slice(0, 5).length > 0 ? tokens.slice(0, 5) : [
                      { id: "1", token_symbol: "BONK", promotion_type: "premium", views: 12400, engagement_score: 89, status: "active", token_address: "XXXX" },
                      { id: "2", token_symbol: "PEPE", promotion_type: "advanced", views: 8900, engagement_score: 74, status: "active", token_address: "XXXX" },
                      { id: "3", token_symbol: "MOON", promotion_type: "basic", views: 2100, engagement_score: 41, status: "active", token_address: "XXXX" },
                    ] as TokenRow[]).map((t, i) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                        <td className="py-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 font-bold">${t.token_symbol || "?"}</td>
                        <td className="py-2">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                            style={{ background: t.promotion_type === "premium" ? "hsl(var(--cyan) / 0.15)" : t.promotion_type === "advanced" ? "hsl(var(--purple) / 0.15)" : "hsl(var(--muted))", color: t.promotion_type === "premium" ? "hsl(var(--cyan))" : t.promotion_type === "advanced" ? "hsl(var(--purple))" : "hsl(var(--muted-foreground))" }}>
                            {t.promotion_type}
                          </span>
                        </td>
                        <td className="py-2 font-semibold">{(t.views || 0).toLocaleString()}</td>
                        <td className="py-2">
                          <span style={{ color: "hsl(120 70% 55%)" }}>{t.engagement_score || 0}%</span>
                        </td>
                        <td className="py-2">
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.status === "active" ? "hsl(120 70% 50%)" : "hsl(var(--muted-foreground))" }} />
                            <span className="capitalize">{t.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SCard>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t mt-8 py-6" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <a href="https://t.me/promotememesai" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1"><Send className="w-3 h-3" /> Telegram</a>
            <a href="https://x.com/sniper44583" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1"><Twitter className="w-3 h-3" /> Twitter</a>
            <a href="/admin" className="hover:text-foreground transition-colors">Admin</a>
          </div>
          <p className="text-[10px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We do not guarantee any returns or promise any specific results. Cryptocurrency trading involves substantial risk and may not be suitable for all investors. Always DYOR.
          </p>
        </div>
      </footer>
    </div>
  );
}
