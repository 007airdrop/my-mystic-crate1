'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injectedConnector } from '@/config/wagmi'

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isReconnecting) return <div>Reconnecting...</div>
  if (isConnecting || isPending) return <div>Connecting...</div>

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injectedConnector })}
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <button
        onClick={() => disconnect()}
        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
      >
        Disconnect
      </button>
    </div>
  )
}
