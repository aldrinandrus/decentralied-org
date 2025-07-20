"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { BlockchainService } from "@/lib/blockchain"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, RefreshCw, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react"

interface BNBBalanceCheckerProps {
  requiredAmount?: string
}

export function BNBBalanceChecker({ requiredAmount = "0" }: BNBBalanceCheckerProps) {
  const { account, signer, chainId } = useWeb3()
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [hasEnoughBNB, setHasEnoughBNB] = useState<boolean>(true)

  useEffect(() => {
    if (account && signer) {
      checkBalance()
    }
  }, [account, signer])

  useEffect(() => {
    if (requiredAmount && balance) {
      setHasEnoughBNB(Number.parseFloat(balance) >= Number.parseFloat(requiredAmount))
    }
  }, [balance, requiredAmount])

  const checkBalance = async () => {
    if (!signer || !account) return

    setLoading(true)
    try {
      const blockchainService = new BlockchainService(signer)
      const userBalance = await blockchainService.getBNBBalance(account)
      setBalance(userBalance)
    } catch (error) {
      console.error("Error checking balance:", error)
    } finally {
      setLoading(false)
    }
  }

  const openFaucet = () => {
    if (chainId === 97) {
      // BSC Testnet faucet
      window.open("https://testnet.binance.org/faucet-smart", "_blank")
    } else {
      // BSC Mainnet - direct to exchange
      window.open("https://www.binance.com/en/buy-sell-crypto", "_blank")
    }
  }

  const getNetworkName = () => {
    switch (chainId) {
      case 56:
        return "BSC Mainnet"
      case 97:
        return "BSC Testnet"
      default:
        return "Unknown Network"
    }
  }

  const isTestnet = chainId === 97

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            <span>BNB Balance</span>
          </div>
          <Button variant="outline" size="sm" onClick={checkBalance} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Current Balance:</span>
            <p className="font-semibold text-blue-700">
              {loading ? "Loading..." : `${Number.parseFloat(balance).toFixed(6)} BNB`}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Network:</span>
            <p className="font-semibold">{getNetworkName()}</p>
          </div>
          {requiredAmount !== "0" && (
            <>
              <div>
                <span className="text-gray-600">Required:</span>
                <p className="font-semibold">{Number.parseFloat(requiredAmount).toFixed(6)} BNB</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge variant={hasEnoughBNB ? "default" : "destructive"} className="text-xs">
                  {hasEnoughBNB ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Sufficient
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Insufficient
                    </>
                  )}
                </Badge>
              </div>
            </>
          )}
        </div>

        {!hasEnoughBNB && requiredAmount !== "0" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Insufficient BNB</strong>
              <br />
              You need {Number.parseFloat(requiredAmount).toFixed(6)} BNB but only have{" "}
              {Number.parseFloat(balance).toFixed(6)} BNB.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={openFaucet} className="flex-1 bg-transparent">
            <ExternalLink className="h-3 w-3 mr-1" />
            {isTestnet ? "Get Test BNB" : "Buy BNB"}
          </Button>
        </div>

        <div className="text-xs text-gray-500 border-t pt-2">
          <p>• {isTestnet ? "Test BNB is free on BSC Testnet" : "Real BNB required on BSC Mainnet"}</p>
          <p>• Transaction fees are paid in BNB</p>
          <p>• Keep some BNB for future transactions</p>
        </div>
      </CardContent>
    </Card>
  )
}
