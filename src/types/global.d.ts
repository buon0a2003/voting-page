import type { EthereumProvider } from './web3'

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export {}
