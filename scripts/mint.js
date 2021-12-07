const { ethers } = require("hardhat"); // eslint-disable-line
const env_config = require('../secrets');
const toBN = ethers.BigNumber.from;

const pre = async () => {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  const config = env_config[network.name];
  const accounts = await ethers.getSigners();

  const DivaItemLootBox = await ethers.getContractFactory(
    'DivaItemLootBox',
    {
      libraries: {
        LootBoxRandomness: config.lootbox_randomness_contract_address,
      },
    },
  );

  
  console.log(`[info]: Attaching Lootbox Contract`);
  const lootbox_contract = await DivaItemLootBox.attach(config.lootbox_contract_address);

  console.log(`[info]: Setting up network environment`);
  console.log(`[info]: Network: ${network.name}`);
  console.log(`[info]: Issuer Address [0]: ${accounts[0].address}`);
  console.log(`[info]: Factory Contract Address [A]: ${config.factory_contract_address}`);
  console.log(`[info]: LootBox Contract Address [A]: ${config.lootbox_contract_address}`);
  return { config, provider, network, accounts, lootbox_contract };
};

/**
 * For now, this script just mints a lootbox.
 */
async function main(opt) {
  const tx = await opt.lootbox_contract 
    .connect(opt.accounts[0])
    .mint(opt.accounts[1].address, toBN(0), toBN(1), '0x00', { gasLimit: 500000 });
  const receipt = await tx.wait();
  console.log(receipt);
}

const run = async () => {
  const opt = await pre();
  await main(opt);
}
run().catch((e) => console.error(e))