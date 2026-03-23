import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, Shield, Wallet, Check, Eye, EyeOff, ArrowLeft, Activity, Users, TrendingUp, Copy } from "lucide-react";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [adminWallet, setAdminWallet] = useState("");
  const [newWallet, setNewWallet] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0 });
  const [submissions, setSubmissions] = useState<{
    id: string; token_symbol: string; token_address: string;
    promotion_type: string; price_sol: number; status: string;
    wallet_address: string; created_at: string; tx_signature: string;
  }[]>([]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "admin_password")
      .single();
    if (data?.value === password) {
      setAuthed(true);
      setAuthError("");
      loadData();
    } else {
      setAuthError("Incorrect password");
    }
  }

  async function loadData() {
    const [walletRes, subsRes] = await Promise.all([
      supabase.from("admin_settings").select("value").eq("key", "admin_wallet").single(),
      supabase.from("token_submissions").select("*").order("created_at", { ascending: false }),
    ]);
    if (walletRes.data) setAdminWallet(walletRes.data.value);
    if (subsRes.data) {
      setSubmissions(subsRes.data as typeof submissions);
      const active = subsRes.data.filter(s => s.status === "active").length;
      const revenue = subsRes.data.reduce((sum, s) => sum + Number(s.price_sol || 0), 0);
      setStats({ total: subsRes.data.length, active, revenue });
    }
  }

  async function saveWallet(e: React.FormEvent) {
    e.preventDefault();
    if (!newWallet.trim()) return;
    setSaving(true);
    // Use the edge function for admin-authorized updates
    const res = await fetch(`https://xlezhsxenfwirqsxeaev.supabase.co/functions/v1/admin-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "admin_wallet", value: newWallet.trim(), password }),
    });
    if (res.ok) {
      setAdminWallet(newWallet.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 6) return;
    setSaving(true);
    const res = await fetch(`https://xlezhsxenfwirqsxeaev.supabase.co/functions/v1/admin-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "admin_password", value: newPassword.trim(), password }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  const copyText = (t: string) => navigator.clipboard.writeText(t);

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-sm">
        <div className="card-glass rounded-2xl p-8" style={{ boxShadow: "0 0 60px hsl(var(--purple) / 0.2)" }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan)))" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-lg">Admin Panel</div>
              <div className="text-xs text-muted-foreground">PromoteMemes</div>
            </div>
          </div>
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors"
                  style={{ color: "hsl(var(--foreground))" }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authError && <p className="text-xs mt-1.5" style={{ color: "hsl(0 85% 60%)" }}>{authError}</p>}
            </div>
            <button type="submit" className="w-full py-3 rounded-lg font-bold text-sm text-white transition-all active:scale-95" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))" }}>
              Login
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center">
              <ArrowLeft className="w-3 h-3" /> Back to site
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "hsl(var(--background))" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan)))" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-xl">Admin Dashboard</div>
              <div className="text-xs text-muted-foreground">PromoteMemes Control Panel</div>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/" className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-surface-2 flex items-center gap-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Site
            </a>
            <button onClick={() => setAuthed(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-surface-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Users className="w-4 h-4" />, label: "Total Submissions", value: stats.total },
            { icon: <Activity className="w-4 h-4" />, label: "Active Promotions", value: stats.active },
            { icon: <TrendingUp className="w-4 h-4" />, label: "Total Revenue", value: `${stats.revenue.toFixed(3)} SOL` },
          ].map((s, i) => (
            <div key={i} className="card-glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2" style={{ color: "hsl(var(--cyan))" }}>
                {s.icon}
              </div>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Admin Wallet */}
          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Wallet className="w-4 h-4" style={{ color: "hsl(var(--cyan))" }} />
              <h3 className="font-bold">Payment Wallet</h3>
            </div>
            {adminWallet && adminWallet !== "NOT_SET" && (
              <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ background: "hsl(var(--cyan) / 0.08)", border: "1px solid hsl(var(--cyan) / 0.2)" }}>
                <span className="text-xs font-mono truncate flex-1" style={{ color: "hsl(var(--cyan))" }}>{adminWallet}</span>
                <button onClick={() => copyText(adminWallet)}><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
              </div>
            )}
            {adminWallet === "NOT_SET" && (
              <div className="mb-4 p-3 rounded-lg text-xs text-muted-foreground" style={{ background: "hsl(0 85% 60% / 0.08)", border: "1px solid hsl(0 85% 60% / 0.2)", color: "hsl(0 85% 60%)" }}>
                ⚠️ No wallet set — payments won't work until you configure this.
              </div>
            )}
            <form onSubmit={saveWallet} className="space-y-3">
              <input
                type="text"
                value={newWallet}
                onChange={e => setNewWallet(e.target.value)}
                placeholder="Enter your Solana wallet address..."
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-purple transition-colors"
                style={{ color: "hsl(var(--foreground))" }}
              />
              <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--cyan) / 0.8))" }}>
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving..." : "Update Wallet"}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4" style={{ color: "hsl(var(--purple))" }} />
              <h3 className="font-bold">Change Password</h3>
            </div>
            <form onSubmit={savePw} className="space-y-3">
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple transition-colors"
                style={{ color: "hsl(var(--foreground))" }}
              />
              <button type="submit" disabled={saving || newPassword.length < 6} className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50" style={{ background: "linear-gradient(135deg, hsl(var(--purple)), hsl(270 60% 45%))" }}>
                {saved ? "Saved!" : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Token Submissions</h3>
            <button onClick={loadData} className="text-xs text-muted-foreground hover:text-foreground">↻ Refresh</button>
          </div>
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Rocket className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No submissions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Token</th>
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Package</th>
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Paid</th>
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="font-bold text-xs" style={{ color: "hsl(var(--cyan))" }}>{s.token_symbol || "—"}</div>
                        <div className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">{s.token_address}</div>
                      </td>
                      <td className="py-2.5 pr-4 capitalize text-xs">{s.promotion_type}</td>
                      <td className="py-2.5 pr-4">
                        <span className="font-bold text-xs" style={{ color: Number(s.price_sol) > 0 ? "hsl(var(--cyan))" : "hsl(var(--muted-foreground))" }}>
                          {Number(s.price_sol) > 0 ? `${s.price_sol} SOL` : "Free"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                          background: s.status === "active" ? "hsl(var(--cyan) / 0.12)" : s.status === "completed" ? "hsl(120 70% 50% / 0.12)" : "hsl(var(--muted) / 0.5)",
                          color: s.status === "active" ? "hsl(var(--cyan))" : s.status === "completed" ? "hsl(120 70% 55%)" : "hsl(var(--muted-foreground))"
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
