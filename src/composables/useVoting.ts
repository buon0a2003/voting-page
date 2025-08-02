/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, computed } from 'vue'
import * as contractAPI from '../api/contract'
import * as metamaskAPI from '../api/metamask'
import { useNotifications } from './useNotifications'
import type { Web3Error } from '../types/web3'

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
    contractAPI.initializeContract(window.ethereum!)

    // Load initial data
    await Promise.all([loadContractInfo(), loadVoterInfo(), loadCandidates(), loadAdminInfo()])

    console.log('Đã kết nối tới MetaMask:', currentAccount.value)
    success('Kết nối thành công', 'Ví MetaMask đã được kết nối')
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    error.value = web3Error.message
    showError('Kết nối thất bại', web3Error.message)
    console.error('Connection error:', web3Error)
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
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error loading contract info:', web3Error)
    error.value = 'Không thể tải thông tin Contract'
    showError('Lỗi Contract', 'Không thể tải thông tin Contract')
  }
}

const loadAdminInfo = async () => {
  try {
    adminAddress.value = await contractAPI.getAdmin()
    isAdmin.value = true
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error loading admin info:', web3Error)
    isAdmin.value = false
  }
}

const loadVoterInfo = async () => {
  if (!currentAccount.value) return

  try {
    voterInfo.value = await contractAPI.getVoterInfo(currentAccount.value)
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error loading voter info:', web3Error)
    error.value = 'Không thể tải thông tin cử tri'
    showError('Lỗi cử tri', 'Không thể tải thông tin cử tri')
  }
}

const loadCandidates = async () => {
  try {
    candidates.value = await contractAPI.getAllCandidates()
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error loading candidates:', web3Error)
    error.value = 'Không thể tải danh sách ứng viên'
    showError('Lỗi ứng viên', 'Không thể tải danh sách ứng viên')
  }
}

const castVote = async (candidateId: number) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.vote(candidateId, currentAccount.value)

    if (result.status) {
      success('Đã bỏ phiếu', 'Phiếu bầu của bạn đã được ghi nhận thành công')
      Promise.all([loadCandidates(), loadVoterInfo(), loadContractInfo()])
      return
    } else {
      showError('Lỗi bỏ phiếu', 'Không thể bỏ phiếu. Vui lòng kiểm tra lại.')
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Lỗi bỏ phiếu:', web3Error)
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

    if (result.status) {
      success('Đã hủy phiếu', 'Phiếu bầu của bạn đã được hủy thành công')
      Promise.all([loadCandidates(), loadVoterInfo(), loadContractInfo()])
      return
    } else {
      showError('Lỗi hủy phiếu', 'Không thể hủy phiếu. Vui lòng kiểm tra lại.')
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error revoking vote:', web3Error)
    error.value = 'Không thể hủy bỏ phiếu.'
    showError('Hủy phiếu thất bại', 'Không thể hủy bỏ phiếu.')
  } finally {
    isLoading.value = false
  }
}

const getWinner = async () => {
  try {
    winner.value = await contractAPI.getWinner()
    success('Đã lấy kết quả', 'Thông tin người thắng cuộc bầu cử đã được tải')
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error getting winner:', web3Error)
    error.value = 'Không thể lấy kết quả người thắng. Cuộc bầu cử có thể vẫn đang diễn ra.'
    showError(
      'Lỗi kết quả',
      'Không thể lấy kết quả người thắng. Cuộc bầu cử có thể vẫn đang diễn ra.',
    )
  }
}

const addCandidate = async (name: string) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.addCandidate(name, currentAccount.value)

    if (result.status) {
      success('Đã thêm ứng viên', `Ứng viên "${name}" đã được thêm thành công`)
      await loadCandidates()
    } else {
      showError('Thêm ứng viên thất bại', 'Giao dịch đã bị hoàn trả. Vui lòng thử lại.')
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error adding candidate:', web3Error)
    error.value = 'Không thể thêm ứng viên. Hãy đảm bảo bạn là quản trị viên.'
    showError(
      'Thêm ứng viên thất bại',
      'Không thể thêm ứng viên. Hãy đảm bảo bạn là quản trị viên.',
    )
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

    if (result.status) {
      success('Đã ủy quyền cử tri', `Cử tri ${voterAddress.slice(0, 10)}... đã được ủy quyền`)
      await loadVoterInfo()
    } else {
      showError('Ủy quyền thất bại', 'Giao dịch đã bị hoàn trả. Vui lòng thử lại.')
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error authorizing voter:', web3Error)
    error.value = 'Không thể ủy quyền cử tri. Hãy đảm bảo bạn là quản trị viên.'
    showError('Ủy quyền thất bại', 'Không thể ủy quyền cử tri. Hãy đảm bảo bạn là quản trị viên.')
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

    if (result.status) {
      success('Đã kết thúc bầu cử', 'Cuộc bầu cử đã được kết thúc thành công')
      await loadContractInfo()
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error ending election:', web3Error)
    error.value = 'Không thể kết thúc cuộc bầu cử. Hãy đảm bảo bạn là quản trị viên.'
    showError(
      'Kết thúc bầu cử thất bại',
      'Không thể kết thúc cuộc bầu cử. Hãy đảm bảo bạn là quản trị viên.',
    )
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

    if (result.status) {
      success('Đã khởi động lại bầu cử', 'Cuộc bầu cử đã được khởi động lại thành công')
      await Promise.all([loadContractInfo(), loadCandidates()])
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error restarting election:', web3Error)
    error.value = 'Không thể khởi động lại cuộc bầu cử. Hãy đảm bảo bạn là quản trị viên.'
    showError(
      'Khởi động lại bầu cử thất bại',
      'Không thể khởi động lại cuộc bầu cử. Hãy đảm bảo bạn là quản trị viên.',
    )
  } finally {
    isLoading.value = false
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return 'Chưa thiết lập'
  return new Date(timestamp * 1000).toLocaleString('vi-VN')
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
