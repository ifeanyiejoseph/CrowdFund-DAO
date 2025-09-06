import { describe, it, expect, beforeEach } from "vitest";

const ERR_CAMPAIGN_NOT_STARTED = 100;
const ERR_CAMPAIGN_INVALID = 103;
const ERR_PROPOSAL_NOT_FOUND = 106;
const ERR_INVALID_GOAL = 108;
const ERR_INVALID_DURATION = 109;
const ERR_INVALID_ESCROW = 110;
const ERR_INVALID_DIST = 111;

class CampaignCoreMock {
  state: any;
  blockHeight: number = 0; // ✅ initialized directly

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      creator: "ST1CREATOR",
      goalAmount: 0,
      startTime: 0,
      durationFundraise: 0,
      durationVote: 0,
      theme: "",
      isCanceled: false,
      contributions: new Map<string, number>(),
      proposals: new Map<number, any>(),
      proposalVotes: new Map<number, number>(),
      nextId: 0,
      escrow: null,
      distributor: null,
    };
    this.blockHeight = 0;
  }

  advanceTime(blocks: number) {
    this.blockHeight += blocks;
  }

  initCampaign(
    newGoal: number,
    fundraiseDur: number,
    voteDur: number,
    newTheme: string,
    escrowPr: string,
    distPr: string
  ) {
    if (this.state.startTime !== 0) {
      return { ok: false, value: ERR_CAMPAIGN_INVALID };
    }
    if (newGoal <= 0) {
      return { ok: false, value: ERR_INVALID_GOAL };
    }
    if (fundraiseDur <= 0 || voteDur <= 0) {
      return { ok: false, value: ERR_INVALID_DURATION };
    }
    if (!escrowPr.startsWith("ST")) {
      return { ok: false, value: ERR_INVALID_ESCROW };
    }
    if (!distPr.startsWith("ST")) {
      return { ok: false, value: ERR_INVALID_DIST };
    }
    this.state.goalAmount = newGoal;
    this.state.durationFundraise = fundraiseDur;
    this.state.durationVote = voteDur;
    this.state.theme = newTheme;
    this.state.escrow = escrowPr;
    this.state.distributor = distPr;
    this.state.startTime = this.blockHeight;
    return { ok: true, value: true };
  }

  contribute(amount: number) {
    if (amount <= 0) {
      return { ok: false, value: 200 };
    }
    const current = this.state.contributions.get("STX-ADDR") || 0;
    this.state.contributions.set("STX-ADDR", current + amount);
    return { ok: true, value: true };
  }

  getContribution(addr: string) {
    return this.state.contributions.get(addr) || 0;
  }

  submitProposalHash(proposalHash: string, budget: number) {
    const id = this.state.nextId;
    this.state.proposals.set(id, {
      hash: proposalHash,
      revealed: false,
      description: null,
      budget,
      submitter: "STX-ADDR",
    });
    this.state.nextId += 1;
    return { ok: true, value: id };
  }

  revealProposal(id: number, desc: string) {
    const proposal = this.state.proposals.get(id);
    if (!proposal) {
      return { ok: false, value: ERR_PROPOSAL_NOT_FOUND };
    }
    proposal.revealed = true;
    proposal.description = desc;
    this.state.proposals.set(id, proposal);
    return { ok: true, value: true };
  }

  castVote(proposalId: number, voteWeight: number) {
    if (this.blockHeight < this.state.startTime + this.state.durationFundraise) {
      return { ok: false, value: ERR_CAMPAIGN_NOT_STARTED };
    }
    const proposal = this.state.proposals.get(proposalId);
    if (!proposal) {
      return { ok: false, value: ERR_PROPOSAL_NOT_FOUND };
    }
    const current = this.state.proposalVotes.get(proposalId) || 0;
    this.state.proposalVotes.set(proposalId, current + voteWeight);
    return { ok: true, value: true };
  }

  getProposalVoteCount(id: number) {
    return { ok: true, value: this.state.proposalVotes.get(id) || 0 };
  }

  updateEscrow(newEscrow: string) {
    if (!newEscrow.startsWith("ST")) {
      return { ok: false, value: ERR_INVALID_ESCROW };
    }
    this.state.escrow = newEscrow;
    return { ok: true, value: true };
  }

  updateDistributor(newDist: string) {
    if (!newDist.startsWith("ST")) {
      return { ok: false, value: ERR_INVALID_DIST };
    }
    this.state.distributor = newDist;
    return { ok: true, value: true };
  }
}

describe("CampaignCore", () => {
  let contract: CampaignCoreMock;

  beforeEach(() => {
    contract = new CampaignCoreMock();
  });

  it("should initialize campaign with valid params", () => {
    const result = contract.initCampaign(
      1000000,
      3600,
      3600,
      "Health campaign",
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    );
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.state.goalAmount).toBe(1000000);
  });

  it("should allow contributions", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    const result = contract.contribute(500000);
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.getContribution("STX-ADDR")).toBe(500000);
  });

  it("should reject zero contribution", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    const result = contract.contribute(0);
    expect(result).toEqual({ ok: false, value: 200 });
  });

  it("should allow proposal submission", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    const result = contract.submitProposalHash("abc123hash", 500000);
    expect(result).toEqual({ ok: true, value: 0 });
  });

  it("should fail voting during fundraising phase", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    contract.submitProposalHash("abc123hash", 500000);
    const result = contract.castVote(0, 10);
    expect(result).toEqual({ ok: false, value: ERR_CAMPAIGN_NOT_STARTED });
  });

  it("should allow voting during vote phase", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    contract.submitProposalHash("abc123hash", 500000);
    contract.advanceTime(3700);
    const result = contract.castVote(0, 10);
    expect(result).toEqual({ ok: true, value: true });
    expect(contract.getProposalVoteCount(0).value).toBe(10);
  });

  it("should fail if proposal not found", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    contract.advanceTime(3700);
    const result = contract.castVote(99, 10);
    expect(result).toEqual({ ok: false, value: ERR_PROPOSAL_NOT_FOUND });
  });

  it("should fail on invalid escrow update", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    const result = contract.updateEscrow("not-a-principal");
    expect(result).toEqual({ ok: false, value: ERR_INVALID_ESCROW });
  });

  it("should fail on invalid distributor update", () => {
    contract.initCampaign(1000000, 3600, 3600, "Theme", "ST1...", "ST1...");
    const result = contract.updateDistributor("not-a-principal");
    expect(result).toEqual({ ok: false, value: ERR_INVALID_DIST });
  });
});
