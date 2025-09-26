import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const voting = await ethers.deployContract("Voting", [deployer.address]);
  await voting.waitForDeployment();

  console.log("Voting deployed to:", await voting.getAddress());
  console.log(`Verify with npx hardhat verify --network sepolia ${await voting.getAddress()} ${deployer.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
