const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BotChainPayAsYouRead...");

  const Contract = await ethers.getContractFactory("BotChainPayAsYouRead");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  console.log(`BotChainPayAsYouRead deployed to: ${await contract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
