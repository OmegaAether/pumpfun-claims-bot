# pumpfun-claims-bot examples

PumpFun on-chain intelligence — Telegram feed + MCP server for AI assistants. Query token data, GitHub social fee claims, creator profiles, and more.

## Example 1

```text
🟢 Credibility: 100/100 · Strong
   ↑ claim verified · GitHub 6y · 42 repos · repo 150★
📊 Dev track record: 3 prior tokens · avg 🔴 19/100 (High Risk)
```

## Example 2

```text
Solana RPC (WebSocket + HTTP polling)
        │
        ▼
┌───────────────────┐
│  SocialFeeIndex   │──▶ Bootstraps ~148K SharingConfig → mint mappings
└────────┬──────────┘
         │
┌────────▼──────────┐
│   ClaimMonitor    │──▶ Decodes PumpFees program claim transactions
│   EventMonitor    │──▶ Decodes Pump program logs (graduations)
└────────┬──────────┘
         │ FeeClaimEvent / GraduationEvent
┌────────▼──────────┐
│ Enrichment Layer  │
│  ├─ GitHub API    │──▶ User profile, repos, followers
│  ├─ X/Twitter API │──▶ Follower counts, influencer tier
│  ├─ PumpFun API   │──▶ Token info, creator profile, holders, trades
│  ├─ ClaimTracker  │──▶ First-claim detection, persistent counts
│  └─ Fake Detect   │──▶ Instruction called but no payout (amountLamports=0)
└────────┬──────────┘
         │ ClaimFeedContext
┌────────▼──────────┐
│    Formatters     │──▶ Rich HTML cards with sections & emoji layout
└────────┬──────────┘
         │
┌────────▼──────────┐
│   grammY Bot      │──▶ Posts photo + caption to Telegram channel
│   (retry + rate   │    Falls back to text-only if photo fails
│    limiting)      │
└───────────────────┘
```

## Example 3

```bash
npx pumpfun-claims-bot
```

## Example 4

```bash
npm install -g pumpfun-claims-bot
pumpfun-claims-bot
```

## Example 5

```bash
git clone https://github.com/nirholas/pumpfun-claims-bot.git
cd pumpfun-claims-bot && npm install
```

## Example 6

```bash
cp .env.example .env
```

## Example 7

```bash
# Install dependencies
npm install

# Development (hot reload via tsx)
npm run dev

# Production
npm run build
npm start
```

## Example 8

```bash
docker build -t pumpfun-channel-bot .
docker run -d --env-file .env pumpfun-channel-bot
```


Every snippet above is taken from the [repository documentation](https://github.com/nirholas/pumpfun-claims-bot#readme).
