import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOCIAL_TEMPLATES = {
  twitter: [
    "🔥 New gem just launched on Solana! {symbol} is gaining massive momentum. Don't miss this one! 🚀 #Solana #MemeCoin #100x",
    "👀 {symbol} quietly accumulating. Whales spotted. This is your sign 🐋 #Crypto #Altseason #GEM",
    "⚡ ALERT: {symbol} just listed! Community is growing fast 📈 Get in early! #Solana #DeFi",
    "💎 Hidden gem alert: {symbol} — backed by strong community, renounced contract ✅ #SolanaGem #100x",
  ],
  telegram: [
    "🚀 ALERT: {symbol} just launched on Solana! Early entry still possible. Community is PUMPING. Join the movement 💎",
    "🔥 NEW GEM: {symbol}\n✅ Liquidity locked\n✅ Renounced contract\n✅ Community-driven\nGet in early! 🚀",
    "⚡ BREAKING: {symbol} gaining momentum! Volume exploding 📈 Don't miss out!",
  ],
  discord: [
    "💰 MOONSHOT ALERT 💰\n{symbol} — New meme token on Solana\n✅ Liquidity locked\n✅ Renounced\n✅ Based team\nCA: {address}",
    "🎯 {symbol} just launched! Huge potential. Community growing fast. Get in now before it's too late! 🚀",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tokenAddress, tokenSymbol, promotionType, walletAddress, txSignature } = await req.json();

    if (!tokenAddress || !promotionType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const priceMap: Record<string, number> = { basic: 0, advanced: 0.1, premium: 0.5 };
    const durationMap: Record<string, number> = { basic: 10, advanced: 180, premium: 1440 }; // minutes
    const price = priceMap[promotionType] ?? 0;
    const durationMinutes = durationMap[promotionType] ?? 10;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const symbol = tokenSymbol || tokenAddress.slice(0, 6).toUpperCase();

    // Insert submission
    const { data: submission, error: subErr } = await supabase
      .from("token_submissions")
      .insert({
        token_address: tokenAddress,
        token_symbol: symbol,
        promotion_type: promotionType,
        price_sol: price,
        wallet_address: walletAddress || null,
        tx_signature: txSignature || null,
        status: "active",
        expires_at: expiresAt,
        services_delivered: {
          listed: true,
          social_posts: promotionType !== "basic" ? true : false,
          bot_activity: promotionType === "premium" ? true : false,
          featured: promotionType !== "basic" ? true : false,
        },
      })
      .select()
      .single();

    if (subErr) throw subErr;

    // Generate social posts based on package
    const postsToCreate = [];
    const botActivities = [];

    if (promotionType === "basic") {
      // Basic: 1 telegram post only
      const tmpl = SOCIAL_TEMPLATES.telegram[Math.floor(Math.random() * SOCIAL_TEMPLATES.telegram.length)];
      postsToCreate.push({
        token_submission_id: submission.id,
        platform: "telegram",
        post_text: tmpl.replace("{symbol}", symbol).replace("{address}", tokenAddress),
        views: Math.floor(Math.random() * 500) + 100,
        shares: Math.floor(Math.random() * 20) + 5,
      });
      botActivities.push({
        token_submission_id: submission.id,
        token_symbol: symbol,
        platform: "Telegram",
        action_type: "shill",
        action_detail: "Sent to 3 groups",
        status: "live",
      });
    } else if (promotionType === "advanced") {
      // Advanced: Twitter + Telegram + Discord
      for (const [platform, templates] of Object.entries(SOCIAL_TEMPLATES)) {
        const tmpl = templates[Math.floor(Math.random() * templates.length)];
        postsToCreate.push({
          token_submission_id: submission.id,
          platform,
          post_text: tmpl.replace("{symbol}", symbol).replace("{address}", tokenAddress),
          likes: Math.floor(Math.random() * 200) + 30,
          views: Math.floor(Math.random() * 3000) + 500,
          shares: Math.floor(Math.random() * 100) + 20,
          reactions: Math.floor(Math.random() * 150) + 40,
        });
      }
      botActivities.push(
        { token_submission_id: submission.id, token_symbol: symbol, platform: "Twitter/X", action_type: "post", action_detail: "Posted + engagement bots active", status: "live" },
        { token_submission_id: submission.id, token_symbol: symbol, platform: "Telegram", action_type: "shill", action_detail: "Sent to 50+ groups", status: "live" },
        { token_submission_id: submission.id, token_symbol: symbol, platform: "Discord", action_type: "engagement", action_detail: "Bot engaged 500+ users", status: "live" },
      );
    } else if (promotionType === "premium") {
      // Premium: everything + multiple posts per platform
      for (const [platform, templates] of Object.entries(SOCIAL_TEMPLATES)) {
        for (let i = 0; i < Math.min(templates.length, 2); i++) {
          const tmpl = templates[i];
          postsToCreate.push({
            token_submission_id: submission.id,
            platform,
            post_text: tmpl.replace("{symbol}", symbol).replace("{address}", tokenAddress),
            likes: Math.floor(Math.random() * 500) + 100,
            views: Math.floor(Math.random() * 10000) + 2000,
            shares: Math.floor(Math.random() * 250) + 80,
            reactions: Math.floor(Math.random() * 400) + 120,
          });
        }
      }
      botActivities.push(
        { token_submission_id: submission.id, token_symbol: symbol, platform: "Twitter/X", action_type: "post", action_detail: "Hourly posts scheduled 24h", status: "live" },
        { token_submission_id: submission.id, token_symbol: symbol, platform: "Telegram", action_type: "shill", action_detail: "Sent to 147 groups", status: "live" },
        { token_submission_id: submission.id, token_symbol: symbol, platform: "Discord", action_type: "engagement", action_detail: "Active in 89 servers", status: "live" },
        { token_submission_id: submission.id, token_symbol: symbol, platform: "All Platforms", action_type: "engagement", action_detail: "10K+ bot interactions started", status: "live" },
      );
    }

    if (postsToCreate.length > 0) {
      await supabase.from("social_posts").insert(postsToCreate);
    }
    if (botActivities.length > 0) {
      await supabase.from("bot_activity_log").insert(botActivities);
    }

    return new Response(JSON.stringify({ success: true, submission }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
