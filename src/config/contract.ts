/* eslint-disable @typescript-eslint/no-explicit-any */
// Contract configuration

export const CONTRACT_CONFIG = {
  ADDRESS: '0x8f45329a73401C6e7f480F0543F4F0d2959641C5',

  NETWORK: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  },
}

export const checkNetwork = async () => {
  if (typeof window.ethereum !== 'undefined') {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    return chainId === CONTRACT_CONFIG.NETWORK.chainId
  }
  return false
}

export const switchToSepolia = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CONTRACT_CONFIG.NETWORK.chainId }],
      })
      return true
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CONTRACT_CONFIG.NETWORK],
          })
          return true
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError)
          return false
        }
      }
      console.error('Failed to switch to Sepolia network:', error)
      return false
    }
  }
  return false
}
