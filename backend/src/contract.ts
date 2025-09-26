import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { contractABI } from './abi';

dotenv.config();

// Contract configuration
export const contractConfig = {
  address: process.env.CONTRACT_ADDRESS || '',
  abi: contractABI,
};

// Fall back to hardhat if a provider hasn't been set
export const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC_URL || 'http://localhost:8545');

// Create a wallet for the owner
export const ownerWallet = new ethers.Wallet(
  process.env.OWNER_PRIVATE_KEY || '',
  provider
);

// Create the contract instance
export const votingContract = new ethers.Contract(
  contractConfig.address,
  contractConfig.abi,
  provider
)