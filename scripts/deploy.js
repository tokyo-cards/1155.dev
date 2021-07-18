const { ethers, upgrades, hre } = require("hardhat"); // eslint-disable-line
const setup = require('../lib/setupItems');

const main = async () => {
  // const LootBoxRandomness = await ethers.getContractFactory('LootBoxRandomness');

  // const DivaItem = await ethers.getContractFactory('DivaItem');
  // const DivaItemFactory = await ethers.getContractFactory('DivaItemFactory');

  // // OpenSea proxy registry addresses for rinkeby and mainnet.
  // let proxyRegistryAddress;
  // if (network === 'rinkeby') {
  //   proxyRegistryAddress = '0xf57b2c51ded3a29e6891aba85459d600256cf317';
  // } else {
  //   proxyRegistryAddress = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';
  // }

  // const divaItem = await upgrades.deployProxy(DivaItem, [proxyRegistryAddress], {
  //   unsafeAllowLinkedLibraries: true,
  // });
  // await setup.setupAccessory(divaItem, addresses[0]);

  // const lootBoxRandomness = await LootBoxRandomness.deploy();
  // const DivaItemLootBox = await ethers.getContractFactory(
  //   'DivaItemLootBox',
  //   {
  //     libraries: {
  //       LootBoxRandomness: lootBoxRandomness.address,
  //     },
  //   },
  // );
  // const lootBox = await upgrades.deployProxy(DivaItemLootBox, [proxyRegistryAddress], {
  //   unsafeAllowLinkedLibraries: true,
  // });

  // const factory = await DivaItemFactory.deploy(
  //   proxyRegistryAddress,
  //   divaItem.address,
  //   lootBox.address,
  // );

  // await divaItem.transferOwnership(factory.address);
  // await setup.setupAccessoryLootBox(lootBox, factory);
  // await lootBox.transferOwnership(factory.address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });