import express, { Response } from "express";
import cors from "cors";
import {
  votingContract,
  ownerWallet,
  provider,
} from "./contract";
import {
  ContractTransactionResponse,
  ethers,
} from "ethers";

const app = express();
app.use(cors());
app.use(express.json());

const handleContractError = async function (contractError: any, res: Response) {
  if (contractError.message.includes("You have already voted")) {
    return res.status(400).json({ error: "You have already voted" });
  }
  if (contractError.message.includes("Invalid candidate index")) {
    return res
      .status(400)
      .json({ error: "Please enter a valid candidate index" });
  }
  // Handle network-related errors
  if (contractError.code === "NETWORK_ERROR") {
    return res.status(503).json({
      error: "Network error",
      details: "Unable to connect to the blockchain network",
    });
  }
  // Handle gas-related errors
  if (contractError.code === "UNPREDICTABLE_GAS_LIMIT") {
    return res.status(400).json({
      error: "Transaction error",
      details: "Unable to estimate gas for the transaction",
    });
  }
  // If it's a revert error but we don't recognize the message
  if (contractError.code === "CALL_EXCEPTION") {
    return res.status(400).json({
      error: "Transaction reverted",
      details:
        contractError.reason || contractError.message || "Unknown reason",
    });
  }
  return res.status(400).json({
    error: "Transaction failed for unknown reason",
    details: contractError.reason || contractError.message || "Unknown reason",
  });
};

// POST /candidates - Add a new candidate
// WARNING This function is not protected. In a real implementation where we want to backend something like this, we would add some sort of auth in the middleware
app.post("/candidates", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Candidate name is required" });
    }

    const connectedContract: any = votingContract.connect(ownerWallet);
    const tx: ContractTransactionResponse =
      await connectedContract.addCandidate(name);
    console.log(`Adding candidate. Sent tx with hash ${tx.hash}`);
    const receipt = await tx.wait();

    res.status(201).json({
      message: "Candidate added successfully",
      transactionHash: tx.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
    });
  } catch (error: any) {
    return handleContractError(error, res);
  }
});

// GET /candidates - Get all candidates
app.get("/candidates", async (req, res) => {
  try {
    const candidates = await votingContract.getCandidates();
    res.json(
      candidates.map((c: any, index: number) => ({
        id: index,
        name: c.name,
        voteCount: c.voteCount.toString(),
      }))
    );
  } catch (error: any) {
    res
      .status(500)
      .json({
        message: "An unexpected error occurred fetching the candidates",
        error: error.message,
      });
  }
});

// POST /vote - Cast a vote
// WARNING DO NOT use this in a real production environment. Voters should ideally cast their vote using some wallet interface, usually accessed from the frontend
// This is the simplest approach for a short technical assesment. Some other strategies such as sending the signed transaction and simply executing that could be possible too
app.post("/vote", async (req, res) => {
  try {
    const { candidateIndex, voterPrivateKey } = req.body;
    if (candidateIndex === undefined || !voterPrivateKey) {
      return res
        .status(400)
        .json({ error: "Candidate index and voter private key are required" });
    }

    const votingWallet = new ethers.Wallet(voterPrivateKey, provider);
    const connectedContract: any = votingContract.connect(votingWallet);
    try {
      const tx: ContractTransactionResponse = await connectedContract.vote(
        candidateIndex
      );
      console.log(`Voting... Sent tx with hash ${tx.hash}`);
      const receipt = await tx.wait();

      res.status(201).json({
        message: "Vote cast successfully",
        transactionHash: tx.hash,
        voterAddress: votingWallet.address,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      });
    } catch (contractError: any) {
      // Handle specific contract errors
      return handleContractError(contractError, res);
    }
  } catch (error: any) {
    return res.status(500).json({
      message: "There was an error initializing the voter's wallet",
      details: error,
    });
  }
});

// GET /winner - Get the winning candidate
app.get("/winner", async (req, res) => {
  try {
    // First check if there are any candidates
    const candidates = await votingContract.getCandidates();
    if (candidates.length === 0) {
      return res.status(404).json({ error: "No candidates available" });
    }

    const winner = await votingContract.getWinner();
    res.json({ winner });
  } catch (error: any) {
    // If the error contains "No candidates available", return a 404
    if (error.message.includes("No candidates available")) {
      return res.status(404).json({ error: "No candidates available" });
    }
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
