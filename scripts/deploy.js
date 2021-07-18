const { ethers } = require("hardhat"); // eslint-disable-line
const setup = require('../lib/setupItems');
const env_config = require('../secrets');

const pre = (env) => {
  const network = env.NETWORK;
  const config = env_config[network];
  const provider = new ethers.providers.JsonRpcProvider(config.alchemy_url);
  const wallet = new ethers.Wallet.fromMnemonic(config.mnemonic);

  console.log(`[info]: Setting up network environment`);
  console.log(`[info]: Network: ${network}`);
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

  await divaItem.transferOwnership(factory.address);
  await setup.setupAccessoryLootBox(lootBox, factory);
  await lootBox.transferOwnership(factory.address);
};

main(pre(process.env))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });