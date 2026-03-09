# RitMEX Earn

> A mobile-first gateway to earning on Solana through a simpler, more intuitive DLMM experience.

## One-Line Pitch

**RitMEX Earn** is a **Solana Mobile** app focused on **Meteora DLMM**, helping users discover pools, understand opportunities, and move from quote to wallet execution in a phone-native flow.

## The Problem

Solana offers deep onchain opportunities, but mobile DeFi still feels fragmented:

- Discovery, execution, and position management are often split across different tools
- DLMM and LP strategies are powerful, but still too complex for most everyday users
- On mobile, users rarely get a clean flow from market insight to action

**The result: users want to participate, but the mobile experience still creates too much friction.**

## Our Solution

RitMEX Earn is not a desktop dashboard squeezed onto a smaller screen.  
It is a mobile-native earning flow designed around how people actually make decisions on a phone:

1. **Discover**
   Browse live DLMM markets with the key signals that matter: Volume, TVL, APR, and Fee Ratio.

2. **Evaluate**
   Open a pool and immediately understand its core metrics, fee structure, and current opportunity.

3. **Act**
   Switch between **Add Liquidity** and **Swap** in one place, review estimates, build Meteora DLMM transactions, and hand them off to a mobile wallet for signing.

4. **Manage**
   Review wallet-aware portfolio state and recent activity today, with deeper onchain position syncing as the next step.

## What Is Already Built

| Module             | Value                                                                             | Status     |
| ------------------ | --------------------------------------------------------------------------------- | ---------- |
| Markets            | Search, sort, and discover DLMM pools worth attention                             | Built      |
| Pool Detail        | View essential pool metrics and action entry points                               | Built      |
| Add Liquidity      | Balanced, Imbalanced, and One-Sided inputs with Meteora DLMM transaction building | Integrated |
| Swap               | Direction switching, live quote refresh, and Meteora DLMM transaction building    | Integrated |
| Wallet Flow        | Mobile wallet connection plus transaction signing handoff                         | Built      |
| Portfolio          | Wallet-aware local positions and activity history inside the app                  | Partial    |
| Execution Feedback | Success and failure handling around transaction submission                        | Built      |
| Resilience         | Meteora API with fallback data for degraded network conditions                    | Built      |

## Current MVP State

The product is already past static mockups:

- **Discovery and pool evaluation are live**
- **Swap and add-liquidity flows are wired to the Meteora DLMM SDK**
- **Mobile wallet connection is integrated into the action flow**
- **Portfolio is still app-managed state, not full authoritative onchain position sync**

That means the core user journey now reaches from market discovery into real transaction construction, while portfolio management is still catching up to the execution layer.

## Why This Matters for Solana Mobile

Solana is uniquely positioned for fast, lightweight, high-frequency user behavior.  
That makes mobile not just a distribution channel, but the right interface for everyday onchain finance.

RitMEX Earn is designed around that thesis:

- **Mobile-first**: the experience is optimized for quick decisions and low-friction interaction
- **Onchain-first**: the product is centered on real Solana liquidity opportunities
- **Wallet-first**: connection, ownership, and portfolio context are part of the core flow
- **Action-first**: users do not just observe data, they can move directly from quote to transaction flow

## What Makes It Different

- **Not a market-tracking app, but an earning interface**
- **Not a pro-only terminal, but a broader consumer entry point into LP strategy**
- **Not a single-screen demo, but a connected mobile flow from discovery into wallet execution**
- **Not just concept art, but a working MVP with live data, transaction wiring, and clear next milestones**

## Technical Foundation

- **Expo + React Native + Expo Router** for a fast, native mobile product surface
- **Solana mobile wallet integration** for mobile-native account flows
- **Meteora DLMM market data** to power pool discovery and detail views
- **Meteora DLMM SDK transaction building** for swap and liquidity actions
- **Lightweight state and preview logic** to keep interactions fast and understandable
- **Fallback data support** so the product remains useful under unstable network conditions

## What Comes Next

The next stage is to evolve this MVP into a fully usable mobile earning product:

- Finish runtime hardening for Solana Mobile transaction flows
- Replace local portfolio state with full onchain position syncing
- Add real fee collection and close-position management
- Expand fee analytics and position performance tracking
- Introduce strategy recommendations and risk guidance
- Support a broader set of Solana earning primitives beyond a single entry point

## Closing

**RitMEX Earn is built on a simple belief: complex earning workflows on Solana should feel natural on mobile.**

Desktop DeFi proved that these strategies can work.  
We want Solana Mobile to prove that they can become **daily behavior**.

**Not just possible. Understandable, actionable, and eventually habitual.**
