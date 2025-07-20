"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast"

interface Web3ContextType {
  account: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  isConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  chainId: number | null
  isConnecting: boolean
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const isConnected = !!account

  const connectWallet = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      toast({
        title: "Connection in Progress",
        description: "Please wait for the current connection attempt to complete",
        variant: "destructive",
      })
      return
    }

    // If already connected, don't try to connect again
    if (isConnected) {
      toast({
        title: "Already Connected",
        description: "Your wallet is already connected",
      })
      return
    }

    setIsConnecting(true)

    try {
      if (typeof window.ethereum !== "undefined") {
        // Check if MetaMask is locked
        const isUnlocked = await window.ethereum._metamask?.isUnlocked?.() ?? true
        if (!isUnlocked) {
          toast({
            title: "MetaMask is Locked",
            description: "Please unlock MetaMask and try again",
            variant: "destructive",
          })
          return
        }

        const provider = new ethers.BrowserProvider(window.ethereum)

        // Check if already connected first
        const existingAccounts = await provider.listAccounts()
        if (existingAccounts.length > 0) {
          // Already connected, just get the account
          const signer = await provider.getSigner()
          const network = await provider.getNetwork()
          const currentChainId = Number(network.chainId)

          setProvider(provider)
          setSigner(signer)
          setAccount(existingAccounts[0].address)
          setChainId(currentChainId)

          const networkName = currentChainId === 56 ? "BSC Mainnet" : currentChainId === 97 ? "BSC Testnet" : "Unknown Network"
          toast({
            title: "Wallet Connected",
            description: `Successfully connected to ${networkName} - ${existingAccounts[0].address.slice(0, 6)}...${existingAccounts[0].address.slice(-4)}`,
          })
          return
        }

        // Request account access only if not already connected
        const accounts = await provider.send("eth_requestAccounts", [])

        if (accounts.length === 0) {
          throw new Error("No accounts found")
        }

        const signer = await provider.getSigner()
        const network = await provider.getNetwork()
        const currentChainId = Number(network.chainId)

        setProvider(provider)
        setSigner(signer)
        setAccount(accounts[0])
        setChainId(currentChainId)

        // Check if connected to BNB Chain (BSC Mainnet: 56, BSC Testnet: 97)
        if (currentChainId !== 97 && currentChainId !== 56) {
          // Don't show error immediately, just show success and let NetworkSwitcher handle it
          toast({
            title: "Wallet Connected",
            description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}. Please switch to BNB Smart Chain.`,
          })
        } else {
          const networkName = currentChainId === 56 ? "BSC Mainnet" : "BSC Testnet"
          toast({
            title: "Wallet Connected",
            description: `Successfully connected to ${networkName} - ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          })
        }
      } else {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to use this application. Visit https://metamask.io/",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)

      // Handle specific error cases
      if (error.code === 4001) {
        toast({
          title: "Connection Rejected",
          description: "Please approve the connection request in MetaMask",
          variant: "destructive",
        })
      } else if (error.code === -32002) {
        toast({
          title: "Connection Pending",
          description: "Please check MetaMask for a pending connection request. If you don't see it, try refreshing the page.",
          variant: "destructive",
        })
      } else if (error.message?.includes("Already processing")) {
        toast({
          title: "Connection in Progress",
          description: "MetaMask is already processing a connection request. Please check MetaMask and try again in a moment.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect wallet. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
    setIsConnecting(false)
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  useEffect(() => {
    // Check if already connected on page load
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()

          if (accounts.length > 0) {
            const signer = await provider.getSigner()
            const network = await provider.getNetwork()

            setProvider(provider)
            setSigner(signer)
            setAccount(accounts[0].address)
            setChainId(Number(network.chainId))
          }
        } catch (error) {
          console.error("Error checking existing connection:", error)
        }
      }
    }

    checkConnection()

    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(accounts[0])
          toast({
            title: "Account Changed",
            description: `Switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          })
        }
      }

      const handleChainChanged = (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16)
        setChainId(newChainId)

        const networkName = newChainId === 56 ? "BSC Mainnet" : newChainId === 97 ? "BSC Testnet" : "Unknown Network"

        if (newChainId === 56 || newChainId === 97) {
          toast({
            title: "Network Changed",
            description: `Switched to ${networkName}`,
          })
        } else {
          toast({
            title: "Unsupported Network",
            description: `Connected to ${networkName}. Please switch to BNB Smart Chain.`,
            variant: "destructive",
          })
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        isConnected,
        connectWallet,
        disconnectWallet,
        chainId,
        isConnecting,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}
