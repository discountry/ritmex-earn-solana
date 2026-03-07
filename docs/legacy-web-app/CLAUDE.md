# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RitMEX Earn is a Solana DeFi frontend for managing liquidity positions on **Meteora DLMM** (Dynamic Liquidity Market Maker). Users can create balanced/imbalanced/one-sided positions, swap tokens, and manage liquidity — with Jito bundle support for MEV protection and configurable priority fees.

## Commands

```bash
bun dev          # Start dev server (uses Turbopack)
bun run build    # Production build
bun run lint     # ESLint
```

## Architecture

### Tech Stack
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + **Headless UI** for styling
- **Zustand** for global state (SOL price, priority fees)
- **Solana**: `@solana/web3.js`, wallet-adapter, `@meteora-ag/dlmm`, `@coral-xyz/anchor`
- **Jito**: MEV-protected transaction bundles via `jito-js-rpc`
- **Charts**: `lightweight-charts` (TradingView) for OHLCV candlestick data

### Directory Layout

```
app/
├── layout.tsx              # Root layout (GlobalStoreProvider + AppWalletProvider)
├── page.tsx                # Home — renders PairGroupList
├── dlmm/[address]/page.tsx # Core DLMM pool management page
├── api/                    # Next.js API route proxies (see below)
├── components/             # All UI components
├── providers/              # AppWalletProvider, StoreProvider
config/
├── solana.ts               # RPC endpoints (Helius, QuickNode)
├── wallet.ts               # FEE_WALLET, POSITION_FEE, SWAP_FEE constants
service/
├── meteora.ts              # DLMM position creation, removal, swaps, bin info
├── transactions.ts         # Transaction simulation, priority fee estimation, send utils
├── jito.ts                 # Jito bundle creation and submission
store/
└── globalStore.ts          # Zustand store: solPrice, priorityFee, priorityLevel
```

### API Routes (Backend Proxies)

All API routes proxy external services to avoid CORS and protect keys:

| Route | Source | Purpose |
|-------|--------|---------|
| `/api/group` | Meteora | Fetch DLMM pair groups |
| `/api/pool/[address]` | Meteora | Fetch specific pool data |
| `/api/price` | Meteora | Get SOL price |
| `/api/meta` | Meteora | Pair metadata |
| `/api/ohlcv/[address]` | GeckoTerminal | OHLCV candlestick data |
| `/api/fees` | QuickNode | Priority fee estimates |
| `/api/tip` | Jito | Landed tip floor (50th percentile) |

### Key Patterns

- **Transaction flow**: `service/meteora.ts` builds transactions → `service/transactions.ts` handles simulation and sending (via `sendTrustTransaction` / `signAndSendTransaction`) → optional Jito bundle wrapping via `service/jito.ts`
- **Fee collection**: Position and swap transactions automatically include transfer instructions sending fees to `FEE_WALLET` (defined in `config/wallet.ts`)
- **Position strategies**: Three types — Balance (Spot), Imbalance (Curve/BidAsk), OneSide — each has a dedicated creation function in `service/meteora.ts`
- **Priority fees**: User-selectable Low/Medium/High levels stored in Zustand, estimated via Helius API
- **Wallet integration**: `@solana/wallet-adapter-react` wrapped in `AppWalletProvider`

### UI Language

All UI text is currently hardcoded in **Chinese**. The current branch (`feat/i18n`) is for adding internationalization support.

### Webpack Config

`next.config.ts` polyfills `node:fs` as `false` and enables `topLevelAwait` — required for Solana SDK compatibility in browser.
