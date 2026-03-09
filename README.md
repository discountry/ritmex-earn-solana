# RitMEX Earn Solana

RitMEX Earn Solana is a mobile app built with Expo and React Native for exploring Meteora DLMM pools on Solana. It focuses on a simple earn workflow: browse markets, open a pool, add liquidity or swap, and review wallet-linked positions.

## Features

- Browse DLMM markets with search, sorting, and key pool metrics
- Open pool detail screens for liquidity and swap actions
- Connect a mobile wallet and review portfolio activity
- Use local fallback data when live market data is unavailable

## Tech Stack

- Expo
- React Native
- Expo Router
- Uniwind / Tailwind CSS
- Solana Kit and `@solana/web3.js`
- Wallet UI React Native Kit
- Meteora DLMM SDK

## Project Structure

- `src/app/`: Expo Router screens and navigation
- `src/components/`: reusable UI and feature components
- `src/hooks/`, `src/lib/`, `src/providers/`: data, Solana logic, and app state
- `android/`: native Android project output
- `docs/meteora/`: protocol notes and API references
- `docs/legacy-web-app/`: archived reference code, not the main app

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run android
```

Other useful commands:

- `npm run dev`: start Expo in dev-client mode and clear cache
- `npm run ios`: build and launch the iOS app
- `npm run web`: start the web target
- `npm run lint`: run ESLint with fixes
- `npm run fmt`: format the project with Prettier
- `npm run build`: type-check and prebuild Android
- `npm run ci`: run the current baseline verification flow

## Notes

- The app uses Expo Router file-based routing under `src/app/`
- Mobile wallet support is configured for Solana mainnet
- Protocol reference material lives in `docs/meteora/`
