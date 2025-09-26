# Voting Smart Contract Project

This project implements a decentralized voting system using Ethereum smart contracts, with a Node.js/Express backend API for interaction.

## Part 1: Smart Contract Development

### Prerequisites

- Node.js and npm installed. Works best with Node v22.x.x
- An Ethereum wallet with some test ETH (for Sepolia testnet)
- Etherscan API key (optional, for contract verification)

### Installation and Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Compile the smart contracts:
```bash
npx hardhat compile
```

3. Run the test suite:
```bash
npx hardhat test
```

### Configuration

The project uses Hardhat's built-in keystore for secure credential management. Set up your environment with the following commands:

```bash
# Set your Sepolia RPC URL
npx hardhat keystore set SEPOLIA_RPC_URL

# Set your contract owner's private key
npx hardhat keystore set SEPOLIA_PRIVATE_KEY

# Optional: Set Etherscan API key for contract verification
npx hardhat keystore set ETHERSCAN_API_KEY
```

### Deployment

To deploy to Sepolia testnet:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

To verify your contract on Etherscan:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>
```

## Part 2: Backend API

### Installation and Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file that looks like the provided .env.sample

4. Start the development server:
```bash
npm run dev
```
or
```bash
npm start
```

The API will be available at `http://localhost:3000` by default.

### API Endpoints

- `POST /candidates` - Add a new candidate. Uses the contract owner wallet that you specified via OWNER_PRIVATE_KEY in your `.env` file
- `GET /candidates` - Get all candidates
- `POST /vote` - Cast a vote. Passes the voter's private key. You should NOT do this in a real production environment. Instead, perhaps pass a signed transaction so the backend works as a relayer, or better yet, vote using a frontend library that is able to invoke a wallet such as Metamask.
- `GET /winner` - Get the winning candidate

## License

MIT
