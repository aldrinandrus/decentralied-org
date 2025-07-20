"use client"

import { useState } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Coins, ExternalLink, Copy, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function FaucetPage() {
  const { isConnected, account, chainId } = useWeb3()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const faucetLinks = [
    {
      name: "BNB Smart Chain Testnet",
      url: "https://testnet.binance.org/faucet-smart",
      description: "Official BSC testnet faucet",
      amount: "0.1 BNB",
      chainId: 97,
    },
    {
      name: "BSC Testnet Faucet",
      url: "https://faucet.quicknode.com/binance-smart-chain/bnb-testnet",
      description: "QuickNode BSC testnet faucet",
      amount: "0.1 BNB",
      chainId: 97,
    },
    {
      name: "BSC Testnet Faucet (Alternative)",
      url: "https://testnet.bnbchain.org/faucet-smart",
      description: "Alternative BSC testnet faucet",
      amount: "0.1 BNB",
      chainId: 97,
    },
  ]

  const copyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account)
        setCopied(true)
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard",
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard",
          variant: "destructive",
        })
      }
    }
  }

  const openFaucet = (url: string) => {
    window.open(url, "_blank")
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Coins className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please connect your MetaMask wallet to access the faucet.</p>
            <Link href="/">
              <Button className="bg-yellow-600 hover:bg-yellow-700">Go Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BNB Testnet Faucet</h1>
              <p className="text-gray-600">Get testnet BNB tokens for development and testing</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Network Check */}
          <Alert className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Make sure you're connected to BNB Smart Chain Testnet (Chain ID: 97) to receive testnet tokens.
              {chainId !== 97 && (
                <span className="block mt-2 font-semibold text-red-600">
                  Current network: {chainId === 56 ? "BSC Mainnet" : `Chain ID ${chainId}`} - Switch to testnet!
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Wallet Address */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="h-5 w-5" />
                <span>Your Wallet Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input
                  value={account || ""}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={copyAddress}
                  className="flex items-center space-x-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Use this address to receive testnet BNB tokens from the faucets below.
              </p>
            </CardContent>
          </Card>

          {/* Available Faucets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faucetLinks.map((faucet, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{faucet.name}</span>
                    <Badge variant={chainId === faucet.chainId ? "default" : "secondary"}>
                      {chainId === faucet.chainId ? "Available" : "Wrong Network"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-600 mb-2">{faucet.description}</p>
                    <p className="text-sm font-semibold text-green-600">Amount: {faucet.amount}</p>
                  </div>
                  
                  <Button
                    onClick={() => openFaucet(faucet.url)}
                    disabled={chainId !== faucet.chainId}
                    className="w-full"
                    variant={chainId === faucet.chainId ? "default" : "outline"}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get Testnet BNB
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How to Get Testnet BNB</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <h3 className="font-semibold">Switch Network</h3>
                  <p className="text-sm text-gray-600">Switch to BSC Testnet in MetaMask</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <h3 className="font-semibold">Copy Address</h3>
                  <p className="text-sm text-gray-600">Copy your wallet address above</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <h3 className="font-semibold">Request Tokens</h3>
                  <p className="text-sm text-gray-600">Click on a faucet link and paste your address</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Configuration */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>BSC Testnet Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">MetaMask Network Settings</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Network Name:</strong> BSC Testnet</p>
                    <p><strong>RPC URL:</strong> https://data-seed-prebsc-1-s1.binance.org:8545/</p>
                    <p><strong>Chain ID:</strong> 97</p>
                    <p><strong>Currency Symbol:</strong> tBNB</p>
                    <p><strong>Block Explorer:</strong> https://testnet.bscscan.com/</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Quick Add to MetaMask</h3>
                  <Button
                    onClick={() => {
                      if (typeof window.ethereum !== "undefined") {
                        window.ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: [{
                            chainId: "0x61",
                            chainName: "BSC Testnet",
                            nativeCurrency: {
                              name: "tBNB",
                              symbol: "tBNB",
                              decimals: 18
                            },
                            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
                            blockExplorerUrls: ["https://testnet.bscscan.com/"]
                          }]
                        })
                      }
                    }}
                    className="w-full"
                  >
                    Add BSC Testnet to MetaMask
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="outline">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 