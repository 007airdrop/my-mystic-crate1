'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injectedConnector } from '@/config/wagmi'

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, isLoading, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isReconnecting) return <div>Reconnecting...</div>
  if (isConnecting || isLoading) return <div>Connecting...</div>

  const tryConnect = async () => {
    // basic injected provider detection — helps in embedded contexts
    const win = typeof window !== 'undefined' ? (window as any) : undefined
    const hasInjected = !!(win && (win.ethereum || win.web3))

    if (!hasInjected) {
      // give a helpful message instead of silently failing
      // Users in-app (Base) should use the in-app wallet; otherwise open in browser with MetaMask
      alert(
        'No injected wallet detected. If you are inside the Base app use the in-app wallet. Otherwise open this page in a browser with MetaMask or another Web3 wallet.'
      )
      return
    }

    try {
      await connect({ connector: injectedConnector })
    } catch (err: any) {
      // show a concise error to user and keep details in console
      alert(err?.message ? `Connect failed: ${err.message}` : 'Connect failed')
      // eslint-disable-next-line no-console
      console.error('Wallet connect error:', err)
    }
  }

  if (!isConnected) {
    return (
      <button onClick={tryConnect} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <button onClick={() => disconnect()} className="bg-red-500 text-white px-2 py-1 rounded text-xs">
        Disconnect
      </button>
    </div>
  )
}
