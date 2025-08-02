/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed } from 'vue'
import * as contractAPI from '../api/contract'
import * as metamaskAPI from '../api/metamask'
import { useNotifications } from './useNotifications'

// Types
export interface Candidate {
  id: number
  name: string
  voteCount: number
}

export interface Winner {
  winnerId: number
  winnerName: string
  winnerVotes: number
}

export interface ContractInfo {
  electionName: string
  startTime: number
  endTime: number
  totalVotes: number
  maxVotesPerVoter: number
}

export interface VoterInfo {
  authorized: boolean
  votesCast: number
}

// Reactive state
const isConnected = ref(false)
const currentAccount = ref('')
const contractInfo = ref<ContractInfo>({
  electionName: '',
  startTime: 0,
  endTime: 0,
  totalVotes: 0,
  maxVotesPerVoter: 0,
})
const voterInfo = ref<VoterInfo>({
  authorized: false,
  votesCast: 0,
})
const candidates = ref<Candidate[]>([])
const winner = ref<Winner | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isAdmin = ref(false)
const adminAddress = ref('')

// Initialize notifications
const { success, error: showError, info, warning } = useNotifications()

// Computed properties
const shortAddress = computed(() => {
  if (!currentAccount.value) return ''
  return `${currentAccount.value.slice(0, 6)}...${currentAccount.value.slice(-4)}`
})

const canVote = computed(() => {
  return (
    voterInfo.value.authorized && voterInfo.value.votesCast < contractInfo.value.maxVotesPerVoter
  )
})

const isCurrentUserAdmin = computed(() => {
  return isAdmin.value && currentAccount.value.toLowerCase() === adminAddress.value.toLowerCase()
})

// Methods
const connect = async () => {
  try {
    isLoading.value = true
    error.value = null

    const account = await metamaskAPI.connectToMetaMask()
    currentAccount.value = account
    isConnected.value = true

    // Initialize contract
    contractAPI.initializeContract(window.ethereum)

    // Load initial data
    await Promise.all([loadContractInfo(), loadVoterInfo(), loadCandidates(), loadAdminInfo()])

    console.log('Đã kết nối tới MetaMask:', currentAccount.value)
    success('Connected Successfully', 'MetaMask wallet connected')
  } catch (err: any) {
    error.value = err.message
    showError('Connection Failed', err.message)
    console.error('Connection error:', err)
  } finally {
    isLoading.value = false
  }
}

const disconnect = () => {
  isConnected.value = false
  currentAccount.value = ''
  contractInfo.value = {
    electionName: '',
    startTime: 0,
    endTime: 0,
    totalVotes: 0,
    maxVotesPerVoter: 0,
  }
  voterInfo.value = {
    authorized: false,
    votesCast: 0,
  }
  candidates.value = []
  winner.value = null
  error.value = null
  isAdmin.value = false
  adminAddress.value = ''

  // Remove listeners
  metamaskAPI.removeListeners()
}

const loadContractInfo = async () => {
  try {
    contractInfo.value = await contractAPI.getContractInfo()
  } catch (err: any) {
    console.error('Error loading contract info:', err)
    error.value = 'Failed to load contract information'
    showError('Contract Error', 'Failed to load contract information')
  }
}

const loadAdminInfo = async () => {
  try {
    adminAddress.value = await contractAPI.getAdmin()
    isAdmin.value = true
  } catch (err: any) {
    console.error('Error loading admin info:', err)
    isAdmin.value = false
  }
}

const loadVoterInfo = async () => {
  if (!currentAccount.value) return

  try {
    voterInfo.value = await contractAPI.getVoterInfo(currentAccount.value)
  } catch (err: any) {
    console.error('Error loading voter info:', err)
    error.value = 'Failed to load voter information'
    showError('Voter Error', 'Failed to load voter information')
  }
}

const loadCandidates = async () => {
  try {
    candidates.value = await contractAPI.getAllCandidates()
  } catch (err: any) {
    console.error('Error loading candidates:', err)
    error.value = 'Failed to load candidates'
    showError('Candidates Error', 'Failed to load candidates')
  }
}

const castVote = async (candidateId: number) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.vote(candidateId, currentAccount.value)

    result.on('VoteCast', () => {
      success('Vote Cast', 'Your vote has been recorded successfully')
      Promise.all([loadCandidates(), loadVoterInfo(), loadContractInfo()])
      return
    })

    showError('Lỗi bỏ phiếu', 'Không thể bỏ phiếu. Vui lòng kiểm tra lại.')
  } catch (err: any) {
    console.error('Lỗi bỏ phiếu:', err)
    error.value = 'Không thể bỏ phiếu. Vui lòng kiểm tra lại.'
    showError('Lỗi bỏ phiếu', error.value)
  } finally {
    isLoading.value = false
  }
}

const revokeVote = async (candidateId: number) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.revokeVote(candidateId, currentAccount.value)

    result.on('VoteRevoked', () => {
      success('Vote Revoked', 'Your vote has been revoked successfully')
      Promise.all([loadCandidates(), loadVoterInfo(), loadContractInfo()])
      return
    })

    showError('Lỗi hủy phiếu', 'Không thể hủy phiếu. Vui lòng kiểm tra lại.')
  } catch (err: any) {
    console.error('Error revoking vote:', err)
    error.value = 'Không thể hủy bỏ phiếu.'
    showError('Revoke Failed', 'Failed to revoke vote.')
  } finally {
    isLoading.value = false
  }
}

const getWinner = async () => {
  try {
    winner.value = await contractAPI.getWinner()
    success('Winner Retrieved', 'Election winner information loaded')
  } catch (err: any) {
    console.error('Error getting winner:', err)
    error.value = 'Failed to get winner. The election might still be ongoing.'
    showError('Winner Error', 'Failed to get winner. The election might still be ongoing.')
  }
}

const addCandidate = async (name: string) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.addCandidate(name, currentAccount.value)

    // Wait for transaction confirmation
    const receipt = await result.waitForTransactionReceipt()

    // Check if transaction was successful
    if (isTransactionSuccessful(receipt)) {
      success('Candidate Added', `Candidate "${name}" has been added successfully`)
      await loadCandidates()
    } else {
      showError('Add Candidate Failed', 'Transaction was reverted. Please try again.')
    }
  } catch (err: any) {
    console.error('Error adding candidate:', err)
    error.value = 'Failed to add candidate. Make sure you are the admin.'
    showError('Add Candidate Failed', 'Failed to add candidate. Make sure you are the admin.')
  } finally {
    isLoading.value = false
  }
}

const authorizeVoter = async (voterAddress: string) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.authorizeVoter(voterAddress, currentAccount.value)

    // Wait for transaction confirmation
    const receipt = await result.waitForTransactionReceipt()

    // Check if transaction was successful
    if (isTransactionSuccessful(receipt)) {
      success('Voter Authorized', `Voter ${voterAddress.slice(0, 10)}... has been authorized`)
      await loadVoterInfo()
    } else {
      showError('Authorization Failed', 'Transaction was reverted. Please try again.')
    }
  } catch (err: any) {
    console.error('Error authorizing voter:', err)
    error.value = 'Failed to authorize voter. Make sure you are the admin.'
    showError('Authorization Failed', 'Failed to authorize voter. Make sure you are the admin.')
  } finally {
    isLoading.value = false
  }
}

const endElection = async () => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.endElection(currentAccount.value)

    // Wait for transaction confirmation
    const receipt = await result.waitForTransactionReceipt()

    // Check if transaction was successful
    if (isTransactionSuccessful(receipt)) {
      success('Election Ended', 'The election has been ended successfully')
      await loadContractInfo()
    } else {
      showError('End Election Failed', 'Transaction was reverted. Please try again.')
    }
  } catch (err: any) {
    console.error('Error ending election:', err)
    error.value = 'Failed to end election. Make sure you are the admin.'
    showError('End Election Failed', 'Failed to end election. Make sure you are the admin.')
  } finally {
    isLoading.value = false
  }
}

const restartElection = async () => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.restartElection(currentAccount.value)

    // Wait for transaction confirmation
    const receipt = await result.waitForTransactionReceipt()

    // Check if transaction was successful
    if (isTransactionSuccessful(receipt)) {
      success('Election Restarted', 'The election has been restarted successfully')
      await Promise.all([loadContractInfo(), loadCandidates()])
      winner.value = null
    } else {
      showError('Restart Election Failed', 'Transaction was reverted. Please try again.')
    }
  } catch (err: any) {
    console.error('Error restarting election:', err)
    error.value = 'Failed to restart election. Make sure you are the admin.'
    showError('Restart Election Failed', 'Failed to restart election. Make sure you are the admin.')
  } finally {
    isLoading.value = false
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return 'Not set'
  return new Date(timestamp * 1000).toLocaleString()
}

// Helper function to check if transaction was successful
const isTransactionSuccessful = (receipt: any) => {
  // Different Web3 versions return status differently
  return receipt.status === 1 || receipt.status === true || receipt.status === '0x1'
}

// Setup listeners
const setupListeners = () => {
  metamaskAPI.setupAccountListener((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      currentAccount.value = accounts[0]
      if (isConnected.value) {
        loadVoterInfo()
      }
    }
  })
}

// Return composable
export function useVoting() {
  return {
    // State
    isConnected,
    currentAccount,
    contractInfo,
    voterInfo,
    candidates,
    winner,
    isLoading,
    error,
    isAdmin,
    adminAddress,

    // Computed
    shortAddress,
    canVote,
    isCurrentUserAdmin,

    // Methods
    connect,
    disconnect,
    loadContractInfo,
    loadVoterInfo,
    loadCandidates,
    castVote,
    revokeVote,
    getWinner,
    addCandidate,
    authorizeVoter,
    endElection,
    restartElection,
    formatTime,
    setupListeners,
  }
}
