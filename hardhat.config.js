require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();

task("pool", "Prints the total amount of ETH in the pool")
  .addParam("address", "The ETH Pool contract address")
  .setAction( async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.address);

    console.log(`Pool balance: ${hre.ethers.utils.formatEther(balance)} ETH`);
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      accounts: [process.env.PRIVATE_KEY],
      url: process.env.NODE_URL
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
