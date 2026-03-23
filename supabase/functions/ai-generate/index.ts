import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATES = {
  early_gem: [
    "🚀 EARLY GEM ALERT: ${symbol} just launched on Solana!\n\n✅ Liquidity locked\n✅ Renounced contract\n✅ Community-driven\n\nGet in before the pump 👇\nCA: ${address}\n\n#Solana #MemeCoin #100x #EarlyGem",
    "👀 Alpha leak: ${symbol} is the next 100x gem on Solana\n\nWhales already accumulating 🐳\nCommunity growing fast 📈\n\nDon't miss this one!\nCA: ${address}\n\n#SolanaGem #Crypto #MemeSeason",
    "💎 Found a hidden gem: ${symbol}\n\nEarly entry still possible!\n• Renounced ✅\n• Locked liquidity ✅\n• Based dev team ✅\n\nCA: ${address}\n#Solana #DeFi #GemAlert",
  ],
  whale_alert: [
    "🐳 WHALE ALERT: Smart money is moving into ${symbol}!\n\nMultiple large wallets accumulating in the last hour 👀\n\nThis is your sign 📈\nCA: ${address}\n\n#WhaleAlert #Solana #CryptoAlpha",
    "⚡ SMART MONEY SPOTTED: Top wallets loading up on ${symbol}\n\n📊 Volume up 340% in 1h\n🐋 5 whale wallets entered\n💹 Strong buy pressure\n\nCA: ${address} #Solana #100x",
    "🚨 ALERT: Whale wallets accumulating ${symbol} silently\n\nThis pattern preceded 10x moves before 👀\n\nGet in before the announcement 🚀\nCA: ${address}\n\n#SolanaAlpha #WhaleMoves",
  ],
  volume_spike: [
    "📈 VOLUME SPIKE DETECTED: ${symbol} volume up 500% in the last hour!\n\nMomentum building fast 🔥\nCommunity growing 💪\n\nCA: ${address}\n\n#Solana #VolumeAlert #MemeCoin",
    "🔥 ${symbol} is PUMPING — volume just exploded!\n\n• 3x volume in 60 mins\n• New ATH incoming?\n• Community is raiding right now 🚀\n\nCA: ${address} #SolanaGems",
    "⚡ BREAKOUT INCOMING: ${symbol} showing massive volume\n\nChart looking bullish AF 📊\nGet in before the next candle 🕯️\n\nCA: ${address}\n\n#Solana #TechnicalAnalysis #Bullish",
  ],
  community_raid: [
    "🎯 COMMUNITY RAID TIME! Drop everything 👇\n\nTarget: ${symbol}\nMission: Buy & Hold\nReward: Leaderboard points + bragging rights 🏆\n\nCA: ${address}\n\nLET'S GO 🚀🚀🚀 #SolanaArmy",
    "📣 RAID ALERT: ${symbol} needs YOU!\n\nJoin the community buy right now 💪\nEvery buy counts, every holder matters!\n\nCA: ${address}\n\nTag 3 degens below 👇 #Solana",
    "🔔 PUMP HOUR ACTIVATED: ${symbol}\n\n⏰ Next 60 minutes = maximum effort\n💰 Real buys = real gains\n🏆 Top buyers win leaderboard rewards\n\nCA: ${address} #CryptoRaid",
  ],
  telegram: [
    "🚀 ALERT: ${symbol} just launched on Solana! Early entry still possible.\n\n✅ Renounced contract\n✅ Liquidity locked\n✅ Community-driven\n\nGet in early! 💎\nCA: ${address}",
    "🔥 NEW GEM: ${symbol}\n\n✅ Liquidity locked\n✅ Renounced contract\n✅ Community driven\n\nGet in early! 🚀\nCA: ${address}",
    "⚡ BREAKING: ${symbol} gaining momentum! Volume exploding 📈\nDon't miss out!\n\nCA: ${address}",
    "💰 MOONSHOT ALERT 💰\n${symbol} — New meme token on Solana\n✅ Liquidity locked\n✅ Renounced\n✅ Based team\n\nCA: ${address}",
  ],
  discord: [
    "💰 MOONSHOT ALERT 💰\n**${symbol}** — New meme token on Solana\n✅ Liquidity locked\n✅ Renounced\n✅ Based team\n\n**CA:** `${address}`",
    "🎯 **${symbol}** just launched! Huge potential. Community growing fast.\n\nGet in now before it's too late! 🚀\n\n**CA:** `${address}`",
    "🚀 **ALPHA DROP** — ${symbol}\nEarly buyers printing already\nVolume exploding 📈\n\n**CA:** `${address}`",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symbol, address, templateType, platform, useAI } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ error: "symbol is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sym = symbol.toUpperCase();
    const addr = address || "XXXXXX...XXXXXX";

    // Try AI generation first if requested
    if (useAI) {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (apiKey) {
        try {
          const platformInstructions: Record<string, string> = {
            twitter: "Write a viral Twitter/X post (max 280 chars). Use emojis, hashtags like #Solana #MemeCoin #100x. Be hype but credible.",
            telegram: "Write a Telegram announcement for crypto groups. Use emojis, bullet points, multiple lines. Include CA at end.",
            discord: "Write a Discord announcement with bold markdown (**text**) and code blocks for the CA. Engaging and hype.",
          };

          const typeInstructions: Record<string, string> = {
            early_gem: "Early gem discovery alert — token just launched, early entry opportunity",
            whale_alert: "Whale wallet activity detected — smart money moving in",
            volume_spike: "Volume spike alert — unusual trading activity, momentum building",
            community_raid: "Community coordinated buy event — call to action for everyone to buy together",
          };

          const platInstr = platformInstructions[platform || "twitter"] || platformInstructions.twitter;
          const typeInstr = typeInstructions[templateType || "early_gem"] || typeInstructions.early_gem;

          const prompt = `You are a crypto meme coin promotion copywriter. Generate a ${platform || "Twitter"} post for token ${sym} (CA: ${addr}).

Context: ${typeInstr}
Platform rules: ${platInstr}

Requirements:
- Be exciting and create FOMO
- Include the token symbol $${sym}
- Include the CA: ${addr}
- Use relevant emojis
- Sound authentic, not like a bot
- Include relevant hashtags for Twitter posts

Generate ONE post only, no explanation.`;

          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are an expert crypto meme coin marketing copywriter. Generate viral, engaging posts." },
                { role: "user", content: prompt },
              ],
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const aiText = aiData.choices?.[0]?.message?.content;
            if (aiText) {
              return new Response(JSON.stringify({ post: aiText.trim(), source: "ai" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        } catch (_e) {
          // fallback to templates
        }
      }
    }

    // Template fallback
    const key = templateType as keyof typeof TEMPLATES || "early_gem";
    const bucket = TEMPLATES[key] || TEMPLATES.early_gem;
    const template = bucket[Math.floor(Math.random() * bucket.length)];
    const post = template.replace(/\${symbol}/g, sym).replace(/\${address}/g, addr);

    return new Response(JSON.stringify({ post, source: "template" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
