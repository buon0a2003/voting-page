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
  started: boolean
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
  started: false,
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
const selectedCandidates = ref<Set<number>>(new Set())
const userVotes = ref<Set<number>>(new Set())

// Initialize notifications
const { success, error: showError, info, warning } = useNotifications()

// Computed properties
const shortAddress = computed(() => {
  if (!currentAccount.value) return ''
  return `${currentAccount.value.slice(0, 6)}...${currentAccount.value.slice(-4)}`
})

const canVote = computed(() => {
  return (
    contractInfo.value.started &&
    voterInfo.value.authorized &&
    voterInfo.value.votesCast < contractInfo.value.maxVotesPerVoter
  )
})

const electionStatus = computed(() => {
  if (!contractInfo.value.started) return 'not_started'

  const now = Math.floor(Date.now() / 1000)
  if (contractInfo.value.endTime > 0 && now > contractInfo.value.endTime) {
    return 'ended'
  }

  return 'active'
})

const canManageCandidates = computed(() => {
  return isCurrentUserAdmin.value && !contractInfo.value.started
})

const remainingVotes = computed(() => {
  return contractInfo.value.maxVotesPerVoter - voterInfo.value.votesCast
})

const canSelectMore = computed(() => {
  return selectedCandidates.value.size < remainingVotes.value
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

    // Load user votes after candidates are loaded
    if (candidates.value.length > 0) {
      await loadUserVotes()
    }

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
    started: false,
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
  selectedCandidates.value.clear()
  userVotes.value.clear()

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
      await Promise.all([loadCandidates(), loadVoterInfo(), loadContractInfo(), loadUserVotes()])
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
      await Promise.all([loadCandidates(), loadVoterInfo(), loadContractInfo(), loadUserVotes()])
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

// New functions for updated smart contract
const startElection = async () => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.startElection(currentAccount.value)

    if (result.status) {
      success('Đã bắt đầu bầu cử', 'Cuộc bầu cử đã được bắt đầu thành công')
      await loadContractInfo()
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error starting election:', web3Error)
    error.value = 'Không thể bắt đầu cuộc bầu cử. Hãy đảm bảo bạn là quản trị viên.'
    showError(
      'Bắt đầu bầu cử thất bại',
      'Không thể bắt đầu cuộc bầu cử. Hãy đảm bảo bạn là quản trị viên.',
    )
  } finally {
    isLoading.value = false
  }
}

const addMultipleCandidates = async (names: string[]) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.addMultipleCandidates(names, currentAccount.value)

    if (result.status) {
      success('Đã thêm ứng viên', `Đã thêm ${names.length} ứng viên thành công`)
      await loadCandidates()
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error adding multiple candidates:', web3Error)
    error.value = 'Không thể thêm ứng viên. Hãy đảm bảo bạn là quản trị viên.'
    showError(
      'Thêm ứng viên thất bại',
      'Không thể thêm ứng viên. Hãy đảm bảo bạn là quản trị viên.',
    )
  } finally {
    isLoading.value = false
  }
}

const removeCandidate = async (candidateId: number) => {
  if (!currentAccount.value) return

  try {
    isLoading.value = true
    error.value = null

    const result = await contractAPI.removeCandidate(candidateId, currentAccount.value)

    if (result.status) {
      success('Đã xóa ứng viên', 'Ứng viên đã được xóa thành công')
      await loadCandidates()
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error removing candidate:', web3Error)
    error.value = 'Không thể xóa ứng viên. Hãy đảm bảo bạn là quản trị viên.'
    showError('Xóa ứng viên thất bại', 'Không thể xóa ứng viên. Hãy đảm bảo bạn là quản trị viên.')
  } finally {
    isLoading.value = false
  }
}

const voteMultiple = async () => {
  if (!currentAccount.value || selectedCandidates.value.size === 0) return

  try {
    isLoading.value = true
    error.value = null

    const candidateIds = Array.from(selectedCandidates.value)
    const result = await contractAPI.voteMultiple(candidateIds, currentAccount.value)

    if (result.status) {
      success('Đã bỏ phiếu', `Đã bỏ phiếu cho ${candidateIds.length} ứng viên thành công`)
      selectedCandidates.value.clear()
      await Promise.all([loadCandidates(), loadVoterInfo(), loadContractInfo(), loadUserVotes()])
    }
  } catch (err: unknown) {
    const web3Error = err as Web3Error
    console.error('Error voting multiple:', web3Error)
    error.value = 'Không thể bỏ phiếu. Vui lòng kiểm tra lại.'
    showError('Bỏ phiếu thất bại', 'Không thể bỏ phiếu. Vui lòng kiểm tra lại.')
  } finally {
    isLoading.value = false
  }
}

const toggleCandidateSelection = (candidateId: number) => {
  if (selectedCandidates.value.has(candidateId)) {
    selectedCandidates.value.delete(candidateId)
  } else if (canSelectMore.value) {
    selectedCandidates.value.add(candidateId)
  }
}

const loadUserVotes = async () => {
  if (!currentAccount.value) return

  try {
    userVotes.value.clear()
    for (const candidate of candidates.value) {
      const hasVoted = await contractAPI.hasVotedFor(currentAccount.value, candidate.id)
      if (hasVoted) {
        userVotes.value.add(candidate.id)
      }
    }
  } catch (err: unknown) {
    console.error('Error loading user votes:', err)
  }
}

// Setup listeners
const setupListeners = () => {
  // Account change listener
  metamaskAPI.setupAccountListener(async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      const newAccount = accounts[0]
      const accountChanged = currentAccount.value !== newAccount

      currentAccount.value = newAccount

      if (isConnected.value && accountChanged) {
        // Clear previous user-specific data
        selectedCandidates.value.clear()
        userVotes.value.clear()
        winner.value = null
        error.value = null

        // Reload all necessary data for the new account
        try {
          await Promise.all([loadVoterInfo(), loadAdminInfo(), loadCandidates()])

          // Load user votes after candidates are loaded
          if (candidates.value.length > 0) {
            await loadUserVotes()
          }

          info(
            'Tài khoản đã thay đổi',
            `Đã chuyển sang tài khoản ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`,
          )
        } catch (err) {
          console.error('Error refreshing data after account change:', err)
          showError('Lỗi tải dữ liệu', 'Không thể tải dữ liệu cho tài khoản mới')
        }
      }
    }
  })

  // Chain change listener
  metamaskAPI.setupChainListener(async (chainId: string) => {
    if (isConnected.value) {
      warning('Mạng đã thay đổi', 'Vui lòng kiểm tra lại kết nối và làm mới trang nếu cần thiết')

      // Optionally reload data when chain changes
      try {
        await Promise.all([loadContractInfo(), loadVoterInfo(), loadAdminInfo(), loadCandidates()])

        if (candidates.value.length > 0) {
          await loadUserVotes()
        }
      } catch (err) {
        console.error('Error refreshing data after chain change:', err)
        showError(
          'Lỗi mạng',
          'Không thể tải dữ liệu sau khi thay đổi mạng. Vui lòng làm mới trang.',
        )
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
    selectedCandidates,
    userVotes,

    // Computed
    shortAddress,
    canVote,
    isCurrentUserAdmin,
    electionStatus,
    canManageCandidates,
    remainingVotes,
    canSelectMore,

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
    // New methods
    startElection,
    addMultipleCandidates,
    removeCandidate,
    voteMultiple,
    toggleCandidateSelection,
    loadUserVotes,
  }
}
