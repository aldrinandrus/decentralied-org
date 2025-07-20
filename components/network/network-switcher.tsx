"use client"

import { useState } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

const BNB_MAINNET = {
  chainId: "0x38", // 56 in hex
  chainName: "BNB Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
}

const BNB_TESTNET = {
  chainId: "0x61", // 97 in hex
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  blockExplorerUrls: ["https://testnet.bscscan.com/"],
}

export function NetworkSwitcher() {
  const { chainId, isConnected } = useWeb3()
  const { toast } = useToast()
  const [switching, setSwitching] = useState(false)

  const isCorrectNetwork = chainId === 56 || chainId === 97
  const networkName = chainId === 56 ? "BSC Mainnet" : chainId === 97 ? "BSC Testnet" : "Unknown Network"

  const switchToNetwork = async (network: typeof BNB_MAINNET) => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to switch networks",
        variant: "destructive",
      })
      return
    }

    setSwitching(true)
    try {
      // First try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      })

      toast({
        title: "Network Switched Successfully",
        description: `Successfully switched to ${network.chainName}`,
      })
    } catch (error: any) {
      console.error("Network switch error:", error)

      // If the network doesn't exist in MetaMask, add it
      if (error.code === 4902 || error.message?.includes("Unrecognized chain ID")) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [network],
          })

          toast({
            title: "Network Added Successfully",
            description: `${network.chainName} has been added to MetaMask and selected`,
          })
        } catch (addError: any) {
          console.error("Error adding network:", addError)
          toast({
            title: "Failed to Add Network",
            description: addError.message || "Could not add the network to MetaMask",
            variant: "destructive",
          })
        }
      } else if (error.code === 4001) {
        toast({
          title: "Network Switch Cancelled",
          description: "You cancelled the network switch request",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Network Switch Failed",
          description: error.message || "Could not switch to the requested network",
          variant: "destructive",
        })
      }
    } finally {
      setSwitching(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Wallet Not Connected</p>
              <p className="text-sm text-yellow-600">Please connect your MetaMask wallet first</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isCorrectNetwork) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Connected to {networkName}</p>
              <p className="text-sm text-green-600">Ready for BNB transactions</p>
            </div>
            <Badge className="bg-green-600">BNB</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2 text-red-800">
          <AlertTriangle className="h-4 w-4" />
          <span>Wrong Network Detected</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-700">
          You're connected to {networkName}. Please switch to BNB Smart Chain to use this platform.
        </p>

        <div className="space-y-2">
          <Button
            onClick={() => switchToNetwork(BNB_TESTNET)}
            disabled={switching}
            variant="outline"
            className="w-full"
          >
            {switching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              "Switch to BSC Testnet"
            )}
          </Button>

          <Button
            onClick={() => switchToNetwork(BNB_MAINNET)}
            disabled={switching}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            {switching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              "Switch to BSC Mainnet"
            )}
          </Button>
        </div>

        <div className="text-xs text-red-600 border-t pt-2">
          <p>• BSC Testnet: Free transactions with test BNB</p>
          <p>• BSC Mainnet: Real BNB transactions</p>
        </div>
      </CardContent>
    </Card>
  )
}
