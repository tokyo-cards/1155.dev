## Diva Items - ERC1155, and factory contracts

What's included:

### ERC1155 Contracts

This includes a very simple ERC1155 for the purposes of integration with the [OpenSea](https://opensea.io) marketplace. We include a script for minting the items.

Additionally, this contract whitelists the proxy accounts of OpenSea users so that they are automatically able to trade.

## Requirements

### Node version

Either make sure you're running a version of node compliant with the `engines` requirement in `package.json`, or install Node Version Manager [`nvm`](https://github.com/creationix/nvm) and run `nvm use` to use the correct version of node.

## Installation

Run

```bash
yarn
```

## Deploying

### Deploying to the Rinkeby network.

1. To access a Rinkeby testnet node, you'll need to sign up for [Alchemy](https://alchemy.com/?r=8bdfa597b2bbd16e) and get a free API key. Click "View Key" and then copy the part of the URL into `secrets.json`.

2. Using your API key and the mnemonic for your Metamask wallet (make sure you're using a Metamask seed phrase that you're comfortable using for testing purposes), run:

```
npx hardhat run scripts/deploy.js --network rinkeby
```

### Minting tokens.
```
node scripts/mint.js
```

### Diagnosing Common Issues

# Running Local Tests

```bash
yarn test
```