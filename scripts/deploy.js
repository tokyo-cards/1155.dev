const { ethers, upgrades } = require("hardhat"); // eslint-disable-line
const setup = require('../lib/setupItems');
const env_config = require('../secrets');

const pre = async () => {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  const config = env_config[network.name];
  const accounts = await ethers.getSigners();

  console.log(`[info]: Setting up network environment`);
  console.log(`[info]: Network: ${network.name}`);
  console.log(`[info]: Issuer Account Address [0]: ${accounts[0].address}`);
  return { config, provider, network, accounts };
};

const main = async (opt) => {
  // Account
  const ISSUER = opt.accounts[0];
  // Get Contracts
  console.log(`[info]: Getting Contract Factory`);
  const LootBoxRandomness = await ethers.getContractFactory('LootBoxRandomness');
  const DivaItem = await ethers.getContractFactory('DivaItem');
  const DivaItemFactory = await ethers.getContractFactory('DivaItemFactory');

  // OpenSea proxy registry addresses for rinkeby and mainnet.
  const proxyRegistryAddress = opt.config.opensea_registry_address;

  console.log(`[info]: Deploying divaItem`);
  const divaItem = await upgrades.deployProxy(DivaItem, [proxyRegistryAddress], {
    unsafeAllowLinkedLibraries: true,
  });
  await setup.setupAccessory(divaItem, ISSUER.address);

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
  const lootBox = await upgrades.deployProxy(DivaItemLootBox, [proxyRegistryAddress], {
    unsafeAllowLinkedLibraries: true,
  });

  console.log(`[info]: Deploying DivaFactory`);
  const factory = await DivaItemFactory.deploy(
    proxyRegistryAddress,
    divaItem.address,
    lootBox.address,
  );

  console.log(`[info]: Transfering Ownership, divaItem`);
  await divaItem.transferOwnership(factory.address);

  console.log(`[info]: Setup Approval For All, divaItem`);
  await divaItem.connect(ISSUER).setApprovalForAll(factory.address, true);

  console.log(`[info]: Setting Up lootBox`);
  await setup.setupAccessoryLootBox(lootBox, factory);
 
  console.log(`[info]: (OpenSea) OpenSea Proxy Address: ${proxyRegistryAddress}`);
  console.log(`[info]: (1155) Factory Contract Address: ${factory.address}`);
  console.log(`[info]: (1155) LootBox Contract Address: ${lootBox.address}`);
  console.log(`[info]: (1155) LootBox Randomness Address: ${lootBoxRandomness.address}`);
  console.log(`[info]: (1155) Item Contract Address: ${divaItem.address}`);
};


const run = async () => {
  const opt = await pre();
  await main(opt);
}
run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
