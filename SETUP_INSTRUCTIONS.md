# Voting App Setup Instructions

This Vue.js application connects to your deployed smart contract on the Sepolia testnet and provides a user interface for interacting with the voting system.

## 🏗️ **Project Structure**

```
voting-page/
├── VotingSystem_metadata.json     ← Smart contract ABI
├── src/
│   ├── api/                       ← API Layer
│   │   ├── contract.ts            ← Contract interactions
│   │   ├── metamask.ts            ← MetaMask wallet functions
│   │   └── index.ts               ← API exports
│   ├── composables/               ← Vue Composables
│   │   └── useVoting.ts           ← Voting state management
│   ├── config/                    ← Configuration
│   │   └── contract.ts            ← Contract address & network config
│   └── views/
│       └── VotingApp.vue          ← Main UI component
```

## Prerequisites

1. **MetaMask Extension**: Make sure you have MetaMask installed in your browser
2. **Sepolia Testnet**: Ensure you have some Sepolia testnet ETH for gas fees
3. **Contract Address**: You need the address of your deployed smart contract

## Setup Steps

### 1. Configure Contract Address

1. Open `src/config/contract.ts`
2. Replace `'YOUR_CONTRACT_ADDRESS_HERE'` with your actual contract address deployed on Sepolia testnet
3. Save the file

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## 🏛️ **Architecture Overview**

### **API Layer** (`src/api/`)

- **`contract.ts`**: Handles all smart contract interactions
- **`metamask.ts`**: Manages MetaMask wallet connections
- **`index.ts`**: Exports all API functions

### **Composables** (`src/composables/`)

- **`useVoting.ts`**: Vue 3 composable for state management
  - Reactive state for contract data
  - Methods for contract interactions
  - Error handling and loading states

### **Configuration** (`src/config/`)

- **`contract.ts`**: Contract address and network settings
- Network switching utilities for Sepolia testnet

## How to Use

### 1. Connect MetaMask

1. Click the "Connect MetaMask" button
2. If you're not on Sepolia testnet, the app will automatically prompt you to switch
3. Approve the connection in MetaMask

### 2. Admin Functions (Contract Owner)

If you're the contract owner (the address that deployed the contract), you can:

- **Add Candidates**: Enter a candidate name and click "Add Candidate"
- **Authorize Voters**: Enter a voter's address and click "Authorize"
- **End Election**: Click "End Election" to stop the voting process
- **Restart Election**: Click "Restart Election" to reset the election

### 3. Voter Functions

Once authorized, voters can:

- **View Candidates**: See all candidates and their vote counts
- **Cast Votes**: Click "Vote" next to a candidate
- **Revoke Votes**: Click "Revoke" to take back a vote
- **View Winner**: Click "Get Winner" to see the election results

### 4. View Contract Information

The app displays:

- Election name and timing
- Total votes cast
- Maximum votes per voter
- Your authorization status
- Number of votes you've cast

## Testing the Contract

### Basic Test Flow

1. **Connect as Admin**: Use the account that deployed the contract
2. **Add Candidates**: Add 2-3 candidates with different names
3. **Authorize Voters**: Add your own address or other test addresses
4. **Switch Accounts**: In MetaMask, switch to an authorized voter account
5. **Cast Votes**: Vote for different candidates
6. **Check Results**: View the vote counts and winner

### Advanced Testing

- **Vote Limits**: Try voting more than the maximum allowed votes
- **Unauthorized Access**: Try voting with an unauthorized account
- **Revoke Votes**: Cast a vote then revoke it
- **End Election**: End the election and try to vote (should fail)
- **Restart**: Restart the election and verify all data is reset

## Troubleshooting

### Common Issues

1. **"MetaMask not found"**: Install MetaMask browser extension
2. **"Failed to connect"**: Make sure MetaMask is unlocked and you approve the connection
3. **"Wrong network"**: The app will automatically prompt you to switch to Sepolia
4. **"Transaction failed"**: Check if you have enough Sepolia ETH for gas fees
5. **"Not authorized"**: Make sure you're using an authorized voter account
6. **"Not admin"**: Admin functions only work with the contract owner account

### Network Configuration

The app is configured for Sepolia testnet:

- Chain ID: 11155111 (0xaa36a7)
- RPC URL: https://sepolia.infura.io/v3/
- Explorer: https://sepolia.etherscan.io/

### Getting Sepolia ETH

1. Visit a Sepolia faucet (e.g., https://sepoliafaucet.com/)
2. Enter your wallet address
3. Request testnet ETH
4. Wait for the transaction to confirm

## Contract Functions Available

The app implements all major functions from your smart contract:

### Read Functions

- `electionName()` - Get election name
- `startTime()` / `endTime()` - Get election timing
- `totalVotes()` - Get total votes cast
- `maxVotesPerVoter()` - Get vote limit per voter
- `getAllCandidates()` - Get all candidates and their votes
- `getWinner()` - Get election winner
- `voters(address)` - Get voter authorization status

### Write Functions

- `addCandidate(string)` - Add new candidate (admin only)
- `authorize(address)` - Authorize voter (admin only)
- `vote(uint256)` - Cast vote for candidate
- `revokeVote(uint256)` - Revoke vote for candidate
- `end()` - End election (admin only)
- `restart()` - Restart election (admin only)

## 🔧 **Development Features**

### **Error Handling**

- Comprehensive error handling with user-friendly messages
- Loading states for all async operations
- Network validation and automatic switching

### **State Management**

- Reactive Vue 3 composables for clean state management
- Automatic data refresh after transactions
- Real-time UI updates

### **Type Safety**

- Full TypeScript support
- Proper type definitions for all contract interactions
- Interface definitions for data structures

### **Code Organization**

- Separation of concerns with API layer
- Reusable composables
- Clean component structure

## Security Notes

- This is a testnet application for development purposes
- Never use real private keys or mainnet addresses
- The contract owner has full control over the election
- Voters must be explicitly authorized before they can vote
- All transactions require gas fees (paid in Sepolia ETH)
