require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');

let secrets;
try {
 secrets = require('./secrets');
} catch (error) {
 secrets = require('./example.secrets');
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  solidity: {
   version:  "0.8.4",
   settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
   }
  },
  networks: {
    hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      blockGasLimit: 6721975 
    },
    rinkeby: {
      url: secrets.rinkeby.alchemy_url, 
      accounts: { mnemonic: secrets.rinkeby.mnemonic },
      allowUnlimitedContractSize: true,
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      blockGasLimit: 6721975 
    }
  }
};
