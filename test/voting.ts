import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

let owner: any;
let paul: any;
let michel: any;
let voting: any;


before(async function () {
  [owner, paul, michel] = await ethers.getSigners();
});

beforeEach(async function () {
   voting = await ethers.deployContract("Voting");
})


describe("voting setup", function () {  
  it("Should egal to 0 to check if proposal is initialized", async function () {
    expect(await voting.winningProposalID()).to.equal(0n);
  });

  it("Should egal to 0 to check if worflow is initialized", async function () {
    expect(await voting.workflowStatus()).to.equal(0n);
  });

  it("Should owner contract be the same as the first signer", async function () {
    expect(await voting.owner()).to.equal(owner.address);
  });
});


describe("voting proposal", function () {
  it("Should not add a proposal if the voter is not registered", async function () {
    await voting.startProposalsRegistering();
    await expect(voting.connect(paul).addProposal("proposal 1")).to.be.revertedWith("You're not a voter");
  });

  it("Should not add a proposal if the workflow is not in ProposalsRegistrationStarted", async function () {
    await voting.addVoter(paul.address);
    await expect(voting.connect(paul).addProposal("proposal 1")).to.be.revertedWith("Proposals are not allowed yet");
  });

  it("Should not add a proposal if the description is empty", async function () {
    await voting.addVoter(paul.address);
    await voting.startProposalsRegistering();
    await expect(voting.connect(paul).addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
  });

  //Start at index 1 for the added proposition cause at the index 0 there is the genesis proposal.
  it("Should add a proposal and check if the proposal is added", async function () {
    await voting.addVoter(paul.address);
    await voting.startProposalsRegistering();
    await voting.connect(paul).addProposal("proposal 1");
    expect((await voting.connect(paul).getOneProposal(1)).description).to.equal("proposal 1");
  });
  
  it("Sould log the event ProposalRegistered when a proposal is added", async function () {
    await voting.addVoter(paul.address);
    await voting.startProposalsRegistering();
    await expect(voting.connect(paul).addProposal("proposal 1")).to.emit(voting, "ProposalRegistered").withArgs(1n);
  });
});

describe("voting workflow Failed", function () {
  it("Should not start the proposal registering if the workflow is not in RegisteringVoters", async function () {
    await voting.startProposalsRegistering();
    await expect(voting.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now");
  });

  it("Should not end the proposal registering if the workflow is not in ProposalsRegistrationStarted", async function () {
    await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
  });

  it("Should not start the voting session if the workflow is not in ProposalsRegistrationEnded", async function () {
    await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
  });

  it("Should not end the voting session if the workflow is not in VotingSessionStarted", async function () {
    await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
  });

  it("Should not tally the votes if the workflow is not in VotingSessionEnded", async function () {
    await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");
  });
});

describe("voting workflow success", function () {
  it("Should start the proposal registering if the workflow is in RegisteringVoters", async function () {
    await voting.startProposalsRegistering();
    expect(await voting.workflowStatus()).to.equal(1n);
  });

  it("Should end the proposal registering if the workflow is in ProposalsRegistrationStarted", async function () {
    await voting.startProposalsRegistering();
    await voting.endProposalsRegistering();
    expect(await voting.workflowStatus()).to.equal(2n);
  });

  it("Should start the voting session if the workflow is in ProposalsRegistrationEnded", async function () {
    await voting.startProposalsRegistering();
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    expect(await voting.workflowStatus()).to.equal(3n);
  });

  it("Should end the voting session if the workflow is in VotingSessionStarted", async function () {
    await voting.startProposalsRegistering();
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    await voting.endVotingSession();
    expect(await voting.workflowStatus()).to.equal(4n);
  });

  it("Should tally the votes if the workflow is in VotingSessionEnded", async function () {
    await voting.startProposalsRegistering();
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    await voting.endVotingSession();
    await voting.tallyVotes();
    expect(await voting.workflowStatus()).to.equal(5n);
  });
});

describe("voting workflow only owner can change status", function () {
  it("Should not start the proposal registering if the sender is not the owner", async function () {
    await expect(voting.connect(paul).startProposalsRegistering()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount").withArgs(paul.address);
  });

  it("Should not end the proposal registering if the sender is not the owner", async function () {
    await voting.startProposalsRegistering();
    await expect(voting.connect(paul).endProposalsRegistering()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount").withArgs(paul.address);
  });

  it("Should not start the voting session if the sender is not the owner", async function () {
    await voting.startProposalsRegistering();
    await voting.endProposalsRegistering();
    await expect(voting.connect(paul).startVotingSession()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount").withArgs(paul.address);
  });

  it("Should not end the voting session if the sender is not the owner", async function () {
    await voting.startProposalsRegistering();
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    await expect(voting.connect(paul).endVotingSession()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount").withArgs(paul.address);
  });

  it("Should not tally the votes if the sender is not the owner", async function () {
    await voting.startProposalsRegistering();
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    await voting.endVotingSession();
    await expect(voting.connect(paul).tallyVotes()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount").withArgs(paul.address);
  });
});

describe("voting workflow events", function () {
  it("Should log the event WorkflowStatusChange when the workflow status is changed", async function () {
    await expect(voting.startProposalsRegistering()).to.emit(voting, "WorkflowStatusChange").withArgs(0n, 1n);
    await expect(voting.endProposalsRegistering()).to.emit(voting, "WorkflowStatusChange").withArgs(1n, 2n);
    await expect(voting.startVotingSession()).to.emit(voting, "WorkflowStatusChange").withArgs(2n, 3n);
    await expect(voting.endVotingSession()).to.emit(voting, "WorkflowStatusChange").withArgs(3n, 4n);
    await expect(voting.tallyVotes()).to.emit(voting, "WorkflowStatusChange").withArgs(4n, 5n);
  });
});



