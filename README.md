# 🚀 CrowdFund DAO

Welcome to CrowdFund DAO, the decentralized platform revolutionizing rapid fundraising on the Stacks blockchain! This Web3 project empowers communities to raise funds quickly for causes or projects, then automatically distribute them based on transparent, crowd-voted priorities. Using Clarity smart contracts, it solves the real-world problem of slow, opaque fund allocation in traditional crowdfunding—think charities bogged down by bureaucracy or community initiatives stalled by indecision. Here, donors contribute, voters prioritize, and funds flow automatically to the most supported proposals, ensuring fairness and efficiency.

## ✨ Features

💰 **Rapid Fundraising**: Launch campaigns in minutes with no intermediaries—anyone can create a fund pool for a cause.
🗳️ **Crowd-Voted Priorities**: Token holders or donors vote on proposals to decide fund allocation, with quadratic voting to prevent whale dominance.
🤖 **Auto-Distribution**: Smart contracts release funds instantly to winners based on vote tallies, with time-locked escrows for accountability.
🔒 **Secure & Transparent**: All transactions on Stacks for immutable records; prevent fraud with hash-based proposal verification.
📊 **Real-Time Analytics**: Query contract states for vote counts, fund balances, and distribution history.
⚖️ **Governance Tokens**: Earn or buy CFDAO tokens to vote, creating a self-sustaining ecosystem.
🛡️ **Dispute Resolution**: Built-in arbitration for edge cases, with multi-sig approvals for refunds.

## 🛠 How It Works

**For Fundraisers (Campaign Creators)**

- Deploy a new campaign via the Factory contract with a goal amount, duration, and theme (e.g., "Local Disaster Relief").
- Donors send STX or tokens to the campaign's escrow—funds are locked until voting ends.
- Submit proposals (e.g., "Buy supplies for shelter" with a budget) hashed for privacy until reveal.

**For Voters & Donors**

- Hold or earn CFDAO governance tokens (minted via donations or staking).
- Vote on proposals using the Voting contract—votes are weighted by tokens and decay over time to encourage fresh input.
- Quadratic voting ensures fair participation: more tokens mean diminishing returns per additional vote.

**For Recipients (Proposal Winners)**

- Once voting closes (e.g., after 7 days), the Distributor contract tallies votes and auto-releases funds from escrow.
- Winners claim via a simple transaction, with proofs burned on-chain for auditability.
- Unallocated funds auto-refund to donors or roll over to the next cycle.

**Under the Hood: 8 Clarity Smart Contracts**

This platform leverages 8 interconnected Clarity contracts on Stacks for robustness and modularity:

1. **CampaignFactory**: Creates new campaign instances, sets parameters like duration and token requirements.
2. **CampaignCore**: Manages individual campaigns—handles donations, proposal submissions, and basic state (active/closed).
3. **EscrowVault**: Securely holds funds with time-locks; integrates with Stacks' native SIP-010 tokens for STX/sFTX support.
4. **ProposalManager**: Allows users to submit and reveal hashed proposals, preventing front-running.
5. **VotingEngine**: Core voting logic with quadratic mechanics; tracks voter balances and prevents double-voting.
6. **GovernanceToken (CFDAO)**: Mintable ERC-20-like token for voting power; includes staking for yield.
7. **FundDistributor**: Automates allocation post-voting—transfers funds to winners or refunds based on thresholds.
8. **DisputeArbiter**: Handles challenges (e.g., invalid proposals) via multi-sig oracles; integrates with Stacks' cross-contract calls.

Boom! Deploy on Stacks testnet, integrate with a simple frontend (e.g., React + Stacks.js), and watch communities fundraise like never before. No more waiting for board approvals—democracy in code.

## 🚀 Getting Started

1. Clone the repo and set up Clarity dev environment (e.g., via Clarinet).
2. Deploy contracts to Stacks testnet: `clarinet deploy`.
3. Interact via wallet (e.g., Leather) or scripts for testing campaigns.
4. Check out the docs for full ABI and integration guides.

**Real-World Impact**: In disaster relief or open-source funding, this cuts allocation time from weeks to hours, boosting trust and participation. Let's decentralize giving! 🌍