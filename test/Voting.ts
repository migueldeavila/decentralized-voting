import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Voting", function () {
  async function deployVoting() {
    const [owner] = await ethers.getSigners();
    const voting = await ethers.deployContract("Voting", [owner.address]);
    return { voting, owner };
  }

  it("Should emit CandidateAdded event when adding a new candidate", async function () {
    const { voting } = await deployVoting();
    const candidateName = "Alice";

    await expect(voting.addCandidate(candidateName))
      .to.emit(voting, "CandidateAdded")
      .withArgs(candidateName, 0n);
  });

  it("Should emit Voted event when casting a vote", async function () {
    const { voting } = await deployVoting();
    const candidateName = "Alice";
    
    await voting.addCandidate(candidateName);
    const [, voter] = await ethers.getSigners();

    await expect(voting.connect(voter).vote(0))
      .to.emit(voting, "Voted")
      .withArgs(voter.address, 0n);
  });

  it("Vote counts should match the number of Voted events", async function () {
    const { voting } = await deployVoting();
    const deploymentBlockNumber = await ethers.provider.getBlockNumber();
    
    // Add candidates
    await voting.addCandidate("Alice");
    await voting.addCandidate("Bob");

    // Get signers for voting
    const [, ...voters] = await ethers.getSigners();
    
    // Cast votes
    await voting.connect(voters[0]).vote(0);
    await voting.connect(voters[1]).vote(0);
    await voting.connect(voters[2]).vote(1);

    // Get all voting events
    const events = await voting.queryFilter(
      voting.filters.Voted(),
      deploymentBlockNumber,
      "latest"
    );

    // Count votes per candidate from events
    const voteCounts = new Map<number, number>();
    for (const event of events) {
      const candidateIndex = Number(event.args.candidateIndex);
      voteCounts.set(candidateIndex, (voteCounts.get(candidateIndex) || 0) + 1);
    }

    // Get current state and verify
    const candidates = await voting.getCandidates();
    for (let i = 0; i < candidates.length; i++) {
      expect(candidates[i].voteCount).to.equal(BigInt(voteCounts.get(i) || 0));
    }
  });

  it("Winner should have the most votes", async function () {
    const { voting } = await deployVoting();
    
    // Add candidates
    await voting.addCandidate("Alice");
    await voting.addCandidate("Bob");

    // Get signers for voting
    const [, ...voters] = await ethers.getSigners();
    
    // Cast more votes for Alice
    await voting.connect(voters[0]).vote(0);
    await voting.connect(voters[1]).vote(0);
    await voting.connect(voters[2]).vote(1);

    // Verify winner
    expect(await voting.getWinner()).to.equal("Alice");
  });

  it("Should revert when adding empty candidate name", async function () {
    const { voting } = await deployVoting();
    await expect(voting.addCandidate(""))
      .to.be.revertedWith("Candidate name cannot be empty");
  });

  it("Should revert on double voting", async function () {
    const { voting } = await deployVoting();
    await voting.addCandidate("Alice");
    
    const [, voter] = await ethers.getSigners();
    await voting.connect(voter).vote(0);

    await expect(voting.connect(voter).vote(0))
      .to.be.revertedWith("You have already voted");
  });

  it("Should only allow owner to add candidates", async function () {
    const { voting } = await deployVoting();
    const [, nonOwner] = await ethers.getSigners();

    await expect(voting.connect(nonOwner).addCandidate("Alice"))
      .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount")
      .withArgs(nonOwner.address);
  });
});