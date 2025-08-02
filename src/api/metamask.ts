import { checkNetwork, switchToSepolia } from '../config/contract'

// MetaMask connection functions
export const connectToMetaMask = async (): Promise<string> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Check if we're on the correct network
      const isCorrectNetwork = await checkNetwork()
      if (!isCorrectNetwork) {
        const switched = await switchToSepolia()
        if (!switched) {
          throw new Error('Please switch to Sepolia testnet to use this app.')
        }
      }

      // Request account access
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[]

      if (accounts.length > 0) {
        console.log('accounts', accounts)

        return accounts[0]
      }

      throw new Error('No accounts found')
    } catch (error) {
      console.error('MetaMask connection error:', error)
      throw error
    }
  } else {
    throw new Error('MetaMask is not installed. Please install MetaMask to use this app.')
  }
}

// Check if MetaMask is available
export const isMetaMaskAvailable = (): boolean => {
  return typeof window.ethereum !== 'undefined'
}

// Get current account
export const getCurrentAccount = async (): Promise<string | null> => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[]
    return accounts.length > 0 ? accounts[0] : null
  }
  return null
}

// Listen for account changes
export const setupAccountListener = (callback: (accounts: string[]) => void): void => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', callback)
  }
}

// Listen for chain changes
export const setupChainListener = (callback: (chainId: string) => void): void => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('chainChanged', callback)
  }
}

// Remove listeners
export const removeListeners = (): void => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeAllListeners('accountsChanged')
    window.ethereum.removeAllListeners('chainChanged')
  }
}
