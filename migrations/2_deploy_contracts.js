// const Creature = artifacts.require("./Creature.sol");
// const CreatureFactory = artifacts.require("./CreatureFactory.sol");
// const CreatureLootBox = artifacts.require("./CreatureLootBox.sol");
const CreatureAccessory = artifacts.require("../contracts/DivaItem.sol");
const CreatureAccessoryFactory = artifacts.require("../contracts/DivaItemFactory.sol");
const CreatureAccessoryLootBox = artifacts.require(
  "../contracts/DivaItemLootBox.sol"
);
const LootBoxRandomness = artifacts.require(
  "../contracts/LootBoxRandomness.sol"
);

const setupCreatureAccessories = require("../lib/setupItems.js");

// If you want to hardcode what deploys, comment out process.env.X and use
// true/false;
const DEPLOY_ACCESSORIES_SALE = true;
const DEPLOY_ACCESSORIES = true;
const DEPLOY_CREATURES_SALE = false;
const DEPLOY_CREATURES = false; 

module.exports = async (deployer, network, addresses) => {
  // OpenSea proxy registry addresses for rinkeby and mainnet.
  let proxyRegistryAddress = "";
  if (network === 'rinkeby') {
    proxyRegistryAddress = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
  } else {
    proxyRegistryAddress = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";
  }

  if (DEPLOY_ACCESSORIES) {
    await deployer.deploy(
      CreatureAccessory,
      proxyRegistryAddress,
      { gas: 5000000 }
    );
    const accessories = await CreatureAccessory.deployed();
    await setupCreatureAccessories.setupAccessory(
      accessories,
      addresses[0]
    );
  }

  if (DEPLOY_ACCESSORIES_SALE) {
    await deployer.deploy(LootBoxRandomness);
    await deployer.link(LootBoxRandomness, CreatureAccessoryLootBox);
    await deployer.deploy(
      CreatureAccessoryLootBox,
      proxyRegistryAddress,
      { gas: 6721975 }
    );
    const lootBox = await CreatureAccessoryLootBox.deployed();
    await deployer.deploy(
      CreatureAccessoryFactory,
      proxyRegistryAddress,
      CreatureAccessory.address,
      CreatureAccessoryLootBox.address,
      { gas: 5000000 }
    );
    const accessories = await CreatureAccessory.deployed();
    const factory = await CreatureAccessoryFactory.deployed();
    await accessories.transferOwnership(
      CreatureAccessoryFactory.address
    );
    await setupCreatureAccessories.setupAccessoryLootBox(lootBox, factory);
    await lootBox.transferOwnership(factory.address);
  }
};
