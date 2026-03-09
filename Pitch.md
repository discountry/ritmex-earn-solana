# RitMEX Earn

> A mobile-first gateway to earning on Solana through a simpler, more intuitive DLMM experience.

## One-Line Pitch

**RitMEX Earn** is a **Solana Mobile** app that helps users discover high-quality liquidity opportunities, evaluate pool performance, simulate actions, and manage positions from a single mobile interface.  
The current MVP is focused on **Meteora DLMM**, turning a complex LP workflow into a fast, readable, and phone-native experience.

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
   Switch between **Add Liquidity** and **Swap** in one place, choose execution preferences, and review estimated outcomes before committing.

4. **Manage**
   Track positions, unclaimed fees, claimed fees, and recent activity from a single portfolio view.

## What Is Already Built

| Module | Value | Status |
| --- | --- | --- |
| Markets | Search, sort, and discover DLMM pools worth attention | Built |
| Pool Detail | View essential pool metrics and action entry points | Built |
| Add Liquidity | Support Balanced, Imbalanced, and One-Sided modes with previews | Built |
| Swap | Support direction switching, priority selection, and execution previews | Built |
| Portfolio | Review positions, earnings, and activity history | Built |
| Wallet Flow | Mobile wallet connection and account-aware state | Built |
| Resilience | Meteora API with fallback data for degraded network conditions | Built |

## Why This Matters for Solana Mobile

Solana is uniquely positioned for fast, lightweight, high-frequency user behavior.  
That makes mobile not just a distribution channel, but the right interface for everyday onchain finance.

RitMEX Earn is designed around that thesis:

- **Mobile-first**: the experience is optimized for quick decisions and low-friction interaction
- **Onchain-first**: the product is centered on real Solana liquidity opportunities
- **Wallet-first**: connection, ownership, and portfolio context are part of the core flow
- **Action-first**: users do not just observe data, they move directly into execution and management

## What Makes It Different

- **Not a market-tracking app, but an earning interface**
- **Not a pro-only terminal, but a broader consumer entry point into LP strategy**
- **Not a single-screen demo, but a full flow from discovery to portfolio**
- **Not just concept art, but a functional mobile MVP with clear product direction**

## Technical Foundation

- **Expo + React Native + Expo Router** for a fast, native mobile product surface
- **Solana mobile wallet integration** for mobile-native account flows
- **Meteora DLMM market data** to power pool discovery and detail views
- **Lightweight state and preview logic** to keep interactions fast and understandable
- **Fallback data support** so the product remains useful under unstable network conditions

## What Comes Next

The next stage is to evolve this MVP into a fully usable mobile earning product:

- Add real onchain execution and signing flows
- Expand fee analytics and position performance tracking
- Introduce strategy recommendations and risk guidance
- Support a broader set of Solana earning primitives beyond a single entry point

## Closing

**RitMEX Earn is built on a simple belief: complex earning workflows on Solana should feel natural on mobile.**

Desktop DeFi proved that these strategies can work.  
We want Solana Mobile to prove that they can become **daily behavior**.

**Not just possible. Usable.**
