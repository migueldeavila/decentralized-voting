// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    struct Candidate {
        string name;
        uint voteCount;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    event CandidateAdded(string name, uint256 index);
    event Voted(address voter, uint256 candidateIndex);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function addCandidate(string memory name) public onlyOwner {
        require(bytes(name).length > 0, "Candidate name cannot be empty");
        candidates.push(Candidate({
            name: name,
            voteCount: 0
        }));
        emit CandidateAdded(name, candidates.length - 1);
    }

    function vote(uint candidateIndex) public {
        require(candidateIndex < candidates.length, "Invalid candidate index");
        require(!hasVoted[msg.sender], "You have already voted");

        candidates[candidateIndex].voteCount++;
        hasVoted[msg.sender] = true;

        emit Voted(msg.sender, candidateIndex);
    }

    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getWinner() public view returns (string memory name) {
        require(candidates.length > 0, "No candidates available");

        uint256 winningVoteCount = 0;
        uint256 winningCandidateIndex = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateIndex = i;
            }
        }

        return candidates[winningCandidateIndex].name;
    }
}