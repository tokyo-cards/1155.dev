const { ethers } = require("hardhat"); // eslint-disable-line
const setup = require('../lib/setupItems');
const env_config = require('../secrets');

const pre = async () => {
  const network = await ethers.provider.getNetwork();
  const config = env_config[network.name];
  const provider = new ethers.providers.JsonRpcProvider(config.alchemy_url);
  const wallet = new ethers.Wallet.fromMnemonic(config.mnemonic);

  console.log(`[info]: Setting up network environment`);
  console.log(`[info]: Network: ${network.name}`);
  console.log(`[info]: Wallet Address: ${wallet.address}`);
  return { config, provider, network, wallet };
};

const main = async (opt) => {
  
  // Get Contracts
  console.log(`[info]: Getting Contract Factory`);
  const LootBoxRandomness = await ethers.getContractFactory('LootBoxRandomness');
  const DivaItem = await ethers.getContractFactory('DivaItem');
  const DivaItemFactory = await ethers.getContractFactory('DivaItemFactory');

  // OpenSea proxy registry addresses for rinkeby and mainnet.
  const proxyRegistryAddress = opt.config.opensea_registry_address;

  console.log(`[info]: Deploying divaItem`);
  const divaItem = await DivaItem.deploy(proxyRegistryAddress);
  await setup.setupAccessory(divaItem, opt.wallet.address);

  console.log(`[info]: Deploying LootBoxRandomness`);
  const lootBoxRandomness = await LootBoxRandomness.deploy();

  console.log(`[info]: Getting DivaItemLootBox`);
  const DivaItemLootBox = await ethers.getContractFactory(
    'DivaItemLootBox',
    {
      libraries: {
        LootBoxRandomness: lootBoxRandomness.address,
      },
    },
  );

  console.log(`[info]: Deploying DivaItemLootBox`);
  const lootBox = await DivaItemLootBox.deploy(proxyRegistryAddress);

  console.log(`[info]: Deploying DivaFactory`);
  const factory = await DivaItemFactory.deploy(
    proxyRegistryAddress,
    divaItem.address,
    lootBox.address,
  );

  console.log(`[info]: Transfering Ownership, divaItem`);
  await divaItem.transferOwnership(factory.address);

  console.log(`[info]: Setting Up LootBox`);
  await setup.setupAccessoryLootBox(
    lootBox, 
    factory, 
  );
  console.log(`[info]: Transfering Ownership, lootBox`);
  await lootBox.transferOwnership(factory.address);
};

const run = async () => {
  const opt = await pre();
  await main(opt);
};

run().then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});;