
/* global ethers task */
import { task } from 'hardhat/config';
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
require('@nomiclabs/hardhat-waffle');
require("@nomiclabs/hardhat-etherscan");
import { config } from 'dotenv';

config({ path: '.env.local' });

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (_args, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.13',
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    hardhat: {},
    polygon: {
      url: process.env.POLYGON_RPC_PROVIDER
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  }
}
