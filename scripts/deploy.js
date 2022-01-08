const hre = require("hardhat");

async function main() {
  const ETHPool = await hre.ethers.getContractFactory("ETHPool");
  const instance = await ETHPool.deploy();

  console.log("ETHPool deployed to:", instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
