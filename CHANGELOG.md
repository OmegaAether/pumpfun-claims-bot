# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Dedicated primary RPC.** A dedicated QuickNode endpoint is now the primary RPC (the former endpoints remain in the fallback chain), making the 30s poll cycle and per-claim enrichment far more reliable than the previous free/public RPCs. Endpoint config is env/secret only, never committed.
- **WebSocket silent-death guard.** A dead-but-connected socket (silently rate-limited) never throws, so the heartbeat would reconnect it forever. After `WS_MAX_SILENT_RECONNECTS` reconnects with zero events the monitor now abandons the WebSocket and falls back to polling — closing the hole behind the earlier WS outage. NOTE: real-time WS mode (`SOLANA_WS_URL`) is left OFF in production. `onLogs` on the pump programs is a ~75k-events/min firehose whose downstream `getTransaction`/`getSignaturesForAddress` calls exceed even a dedicated RPC plan's rate limit; 30s polling is reliable and sufficient for this low-volume claim feed. Enable WS only with an RPC plan sized for that call volume.

### Fixed

- **GitHub-only channel no longer posts ordinary creator-fee claims.** `REQUIRE_GITHUB` was declared but never wired, so Path B (`collect_creator_fee` / `collect_coin_creator_fee` / `distribute_creator_fees`) posted generic PumpSwap "Creator Claimed Fees" cards to the GitHub-claims channel — unrelated devs and images the channel was never meant to show. Creator-fee routing is now gated on `REQUIRE_GITHUB` (default `true`): these claims are counted for diagnostics (`… creator-suppressed` in the pipeline line) but never posted. Decision extracted to a pure, tested `src/claim-routing.ts` (`isCreatorClaimType`, `shouldPostCreatorClaim`). Set `REQUIRE_GITHUB=false` to run a general creator-fee feed on a different channel.
- **State persistence on the container host.** The bot runs as non-root `bot` (uid 100); the mounted data volume was root-owned, so poll cursors, the first-claim dedup, and the dev-reputation store failed to write (`EACCES`) and reset on every restart. The deploy now `chown`s the data dir to the container user.

### Added

- **Credibility Score** — every claim card now leads with a deterministic 0-100 verdict (🟢 Strong / 🟡 Moderate / 🟠 Caution / 🔴 High Risk) synthesised from all trust signals (claim verification, GitHub account age/repos/followers, claimed-repo stars & fork status, copycats, bundling, holder concentration, creator rug history), with a transparent ±factor breakdown. Pure, fully-tested logic in `src/credibility.ts`.
- **Dev Track Record** — a persistent per-developer reputation store (`src/dev-reputation.ts`): every credibility score is recorded against the claiming GitHub user id, so a repeat dev's card shows their prior tokens and average credibility. A serial fee-farmer whose newest coin scores clean is exposed by their history; a proven builder is credited. Deduped by mint, persisted across restarts.

## [1.0.0] - 2025-01-01

### Added

- **GitHub Social Fee Claim monitoring** — real-time detection of `claim_social_fee_pda` transactions on the PumpFees program
- **First-time claim detection** — persistent tracking with `🚨 FIRST TIME CLAIM` banners
- **Fake claim detection** — identifies instructions called with no actual payout
- **SocialFeeIndex** — bootstraps ~148K SharingConfig → mint mappings for instant token resolution
- **GitHub enrichment** — user profiles, followers, repos, account age via GitHub API
- **X/Twitter enrichment** — follower counts and influencer tier badges
- **PumpFun enrichment** — token metadata, market cap, curve progress, creator profiles
- **Groq AI summaries** — one-liner token descriptions via Groq API
- **Token graduation cards** — rich cards for tokens graduating from bonding curve to PumpAMM
- **Rich HTML Telegram cards** — emoji-rich, section-based card formatting
- **Trading affiliate links** — Axiom, GMGN, Padre with configurable ref codes
- **Multi-RPC failover** — round-robin rotation with automatic fallback on 429/5xx/timeout
- **WebSocket + HTTP polling** — dual-mode transaction monitoring
- **Persistent claim tracking** — survives restarts via debounced disk persistence
- **Docker support** — multi-stage build with non-root user and volume mounts
- **Railway deployment** — one-click deploy with pre-configured `railway.json`
- **Health check endpoint** — HTTP server for container orchestration liveness probes
- **Configurable feeds** — toggle claims, graduations, launches, whales, fee distributions
- **Web dashboard** — React + Vite frontend with live event streaming
