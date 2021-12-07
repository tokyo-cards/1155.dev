const { ethers, upgrades } = require("hardhat"); // eslint-disable-line
const opensea = require('opensea-js')
const { WyvernSchemaName } = require('opensea-js/lib/types')
const OpenSeaPort = opensea.OpenSeaPort
const Network = opensea.Network

const env_config = require('../secrets');

const pre = async () => {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  const config = env_config[network.name];
  const accounts = await ethers.getSigners();

  console.log(`[info]: Setting up network environment`);
  console.log(`[info]: Network: ${network.name}`);
  console.log(`[info]: Wallet Address [0]: ${accounts[0].address}`);
  console.log(`[info]: Factory Contract Address [A]: ${config.factory_contract_address}`);
  console.log(`[info]: Owner Address [B]: ${config.owner_address}`);
  return { config, provider, network, accounts };
};

async function main(opt) {
  // const INFURA_KEY = process.env.INFURA_KEY
  const FACTORY_CONTRACT_ADDRESS = opt.config.factory_contract_address 
  const OWNER_ADDRESS = opt.config.owner_address
  const NETWORK = opt.network.name
  console.log(NETWORK);
  // const API_KEY = process.env.API_KEY || '' // API key is optional but useful if you're doing a high volume of requests.

  // Lootboxes only. These are the *Factory* option IDs.
  // These map to 0, 1, 2 as LootBox option IDs, or 1, 2, 3 as LootBox token IDs.
  // const FIXED_PRICE_OPTION_IDS = ['6', '7', '8']
  const FIXED_PRICE_OPTION_IDS = ['0', '1', '2']
  const FIXED_PRICES_ETH = [0.1, 0.2, 0.3]
  const NUM_FIXED_PRICE_AUCTIONS = [1000, 1000, 1000] // [2034, 2103, 2202];

  if (!FACTORY_CONTRACT_ADDRESS) {
    console.error('Please specify a factory contract address.')
    return
  }

  const seaport = new OpenSeaPort(
    opt.provider,
    {
      networkName:
        NETWORK === 'mainnet' || NETWORK === 'rinkeby'
          ? Network.Main
          : Network.Rinkeby,
      // apiKey: API_KEY,
    },
    (arg) => console.log(arg)
  )

  // Example: many fixed price auctions for a factory option.
  for (let i = 0; i < FIXED_PRICE_OPTION_IDS.length; i++) {
    const optionId = FIXED_PRICE_OPTION_IDS[i]
    console.log(`Creating fixed price auctions for ${optionId}...`)
    const numOrders = await seaport.createFactorySellOrders({
      assets: [
        {
          tokenId: optionId,
          tokenAddress: FACTORY_CONTRACT_ADDRESS,
          // Comment the next line if this is an ERC-721 asset (defaults to ERC721):
          schemaName: WyvernSchemaName.ERC1155,
        },
      ],
      // Quantity of each asset to issue
      quantity: 1,
      accountAddress: OWNER_ADDRESS,
      startAmount: FIXED_PRICES_ETH[i],
      // Number of times to repeat creating the same order for each asset. If greater than 5, creates them in batches of 5. Requires an `apiKey` to be set during seaport initialization:
      numberOfOrders: NUM_FIXED_PRICE_AUCTIONS[i],
    })
    console.log(`Successfully made ${numOrders} fixed-price sell orders!\n`)
  }

};

const run = async () => {
  const opt = await pre();
  await main(opt);
}
run().catch((e) => console.error(e))

