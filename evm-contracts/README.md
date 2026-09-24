# BOT Chain EVM Contracts Deployment

This directory contains the Hardhat setup to deploy `BotChainPayAsYouRead.sol` to the BOT Chain Testnet and Mainnet.

## Prerequisites

1. Run `npm install` inside this folder.
2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your wallet's private key that has Testnet BOT tokens. You can get test tokens from the [BOT Chain Faucet](https://faucet.botchain.ai).

## Deploy to Testnet

To deploy your smart contract to the BOT Chain Testnet, simply run:

```bash
npx hardhat run scripts/deploy.ts --network botchain_testnet
```

## Deploy to Mainnet

To deploy to the BOT Chain Mainnet, run:

```bash
npx hardhat run scripts/deploy.ts --network botchain_mainnet
```
