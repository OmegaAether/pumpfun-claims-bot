# Getting started with pumpfun-claims-bot

PumpFun on-chain intelligence — Telegram feed + MCP server for AI assistants. Query token data, GitHub social fee claims, creator profiles, and more.

## Install

```bash
npx pumpfun-claims-bot
```

## Verify the install

Clone the repository and run its checks to confirm everything works on your machine:

```bash
git clone https://github.com/nirholas/pumpfun-claims-bot.git
cd pumpfun-claims-bot
```

Available commands:

| Command | Runs |
|---|---|
| `npm run dev` | `tsx watch src/index.ts` |
| `npm run start` | `node dist/index.js` |
| `npm run build` | `tsc` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` |

## Next steps

- [Examples](./examples.md) shows runnable snippets.
- The [README](https://github.com/nirholas/pumpfun-claims-bot#readme) is the complete reference.
- Found a problem? [Open an issue](https://github.com/nirholas/pumpfun-claims-bot/issues).
