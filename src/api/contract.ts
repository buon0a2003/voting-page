/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from 'web3'
import contractMetadata from '../../VotingSystem_metadata.json'
import { CONTRACT_CONFIG } from '../config/contract'
import type { EthereumProvider, TransactionOptions } from '../types/web3'

// Contract ABI from metadata file
const contractABI = contractMetadata.output.abi

// Contract instance
let contract: any = null
let web3: Web3 | null = null

// Initialize contract
export const initializeContract = (provider: EthereumProvider) => {
  web3 = new Web3(provider)
  contract = new web3.eth.Contract(contractABI, CONTRACT_CONFIG.ADDRESS)
  return { web3, contract }
}

// Get contract instance
export const getContract = () => contract
export const getWeb3 = () => web3

// Get admin address
export const getAdmin = async (): Promise<string> => {
  if (!contract) throw new Error('Contract not initialized')

  return await contract.methods.admin().call()
}

// Contract read functions
export const getContractInfo = async () => {
  if (!contract) throw new Error('Contract not initialized')

  const [electionName, startTime, endTime, totalVotes, maxVotesPerVoter] = await Promise.all([
    contract.methods.electionName().call(),
    contract.methods.startTime().call(),
    contract.methods.endTime().call(),
    contract.methods.totalVotes().call(),
    contract.methods.maxVotesPerVoter().call(),
  ])

  return {
    electionName,
    startTime: parseInt(startTime),
    endTime: parseInt(endTime),
    totalVotes: parseInt(totalVotes),
    maxVotesPerVoter: parseInt(maxVotesPerVoter),
  }
}

export const getVoterInfo = async (address: string) => {
  if (!contract) throw new Error('Contract not initialized')

  const voter = await contract.methods.voters(address).call()
  return {
    authorized: voter.authorized,
    votesCast: parseInt(voter.votesCast),
  }
}

export const getAllCandidates = async () => {
  if (!contract) throw new Error('Contract not initialized')

  const result = await contract.methods.getAllCandidates().call()
  return result.ids.map((id: string, index: number) => ({
    id: parseInt(id),
    name: result.names[index],
    voteCount: parseInt(result.votes[index]),
  }))
}

export const getWinner = async () => {
  if (!contract) throw new Error('Contract not initialized')

  const result = await contract.methods.getWinner().call()
  return {
    winnerId: parseInt(result.winnerId),
    winnerName: result.winnerName,
    winnerVotes: parseInt(result.winnerVotes),
  }
}

// Contract write functions
export const vote = async (candidateId: number, fromAddress: string) => {
  if (!contract) throw new Error('Contract not initialized')

  const options: TransactionOptions = {
    from: fromAddress,
  }

  return await contract.methods.vote(candidateId).send(options)
}

export const revokeVote = async (candidateId: number, fromAddress: string) => {
  if (!contract) throw new Error('Contract not initialized')

  const options: TransactionOptions = {
    from: fromAddress,
  }

  return await contract.methods.revokeVote(candidateId).send(options)
}

export const addCandidate = async (name: string, fromAddress: string) => {
  if (!contract) throw new Error('Contract not initialized')

  const options: TransactionOptions = {
    from: fromAddress,
  }

  return await contract.methods.addCandidate(name).send(options)
}

export const authorizeVoter = async (voterAddress: string, fromAddress: string) => {
  if (!contract) throw new Error('Contract not initialized')

  const options: TransactionOptions = {
    from: fromAddress,
  }

  return await contract.methods.authorize(voterAddress).send(options)
}

export const endElection = async (fromAddress: string) => {
  if (!contract) throw new Error('Contract not initialized')

  const options: TransactionOptions = {
    from: fromAddress,
  }

  return await contract.methods.end().send(options)
}

export const restartElection = async (fromAddress: string) => {
  if (!contract) throw new Error('Contract not initialized')

  const options: TransactionOptions = {
    from: fromAddress,
  }

  return await contract.methods.restart().send(options)
}
