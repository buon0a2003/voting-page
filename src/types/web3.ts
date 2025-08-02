import type { Contract, EventLog, ContractAbi } from 'web3'

// Web3 Provider Types
export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (eventName: string, callback: (...args: unknown[]) => void) => void
  removeAllListeners: (eventName: string) => void
}

// Contract Types - Using basic Contract type with proper ABI
export type VotingContract = Contract<ContractAbi>

// Transaction Types
export interface TransactionOptions {
  from: string
  gas?: string | number
  gasPrice?: string | number
  value?: string | number
}

// Event Types
export interface VoteCastEvent extends EventLog {
  returnValues: {
    voter: string
    candidateId: string
    timestamp: string
  }
}

export interface VoteRevokedEvent extends EventLog {
  returnValues: {
    voter: string
    candidateId: string
    timestamp: string
  }
}

export interface CandidateAddedEvent extends EventLog {
  returnValues: {
    candidateId: string
    name: string
    timestamp: string
  }
}

export interface VoterAuthorizedEvent extends EventLog {
  returnValues: {
    voter: string
    timestamp: string
  }
}

export interface ElectionEndedEvent extends EventLog {
  returnValues: {
    timestamp: string
  }
}

export interface ElectionRestartedEvent extends EventLog {
  returnValues: {
    timestamp: string
  }
}

// Error Types
export interface Web3Error extends Error {
  code?: number
  data?: string
  transaction?: {
    from: string
    to: string
    data: string
  }
}

// Network Types
export interface NetworkInfo {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
}
