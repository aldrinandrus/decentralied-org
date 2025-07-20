"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { BlockchainService } from "@/lib/blockchain"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fuel, TrendingUp, Clock, Wallet, AlertTriangle } from "lucide-react"

interface GasEstimatorProps {
  transactionType: string
  parameters?: any
}

export function GasEstimator({ transactionType, parameters }: GasEstimatorProps) {
  const { signer, account } = useWeb3()
  const [gasEstimate, setGasEstimate] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [gasPrice, setGasPrice] = useState<string>("0")
  const [userBalance, setUserBalance] = useState<string>("0")
  const [hasEnoughBNB, setHasEnoughBNB] = useState<boolean>(true)

  useEffect(() => {
    if (signer && account) {
      estimateGas()
      getUserBalance()
    }
  }, [signer, transactionType, parameters, account])

  const estimateGas = async () => {
    if (!signer) return

    setLoading(true)
    try {
      const blockchainService = new BlockchainService(signer)

      // Get current gas price
      const feeData = await signer.provider!.getFeeData()
      const currentGasPrice = feeData.gasPrice || BigInt(0)
      setGasPrice((Number(currentGasPrice) / 1e9).toFixed(2)) // Convert to Gwei

      // Estimate transaction cost
      const estimate = await blockchainService.estimateTransactionCost(transactionType, parameters)
      setGasEstimate(estimate)

      // Check if user has enough BNB
      if (account) {
        const hasEnough = await blockchainService.hasEnoughBNB(account, estimate)
        setHasEnoughBNB(hasEnough)
      }
    } catch (error) {
      console.error("Error estimating gas:", error)
      setGasEstimate("0.001") // Fallback estimate
    } finally {
      setLoading(false)
    }
  }

  const getUserBalance = async () => {
    if (!signer || !account) return

    try {
      const blockchainService = new BlockchainService(signer)
      const balance = await blockchainService.getBNBBalance(account)
      setUserBalance(balance)
    } catch (error) {
      console.error("Error getting user balance:", error)
    }
  }

  const getTransactionTypeDisplay = (type: string) => {
    switch (type) {
      case "registerDonor":
        return "Donor Registration"
      case "addRecipient":
        return "Recipient Registration"
      case "createMatch":
        return "Match Creation"
      default:
        return "Transaction"
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Fuel className="h-4 w-4 text-yellow-600" />
            <span>BNB Transaction Cost Estimate</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Transaction Type:</span>
              <p className="font-semibold text-yellow-700">{getTransactionTypeDisplay(transactionType)}</p>
            </div>
            <div>
              <span className="text-gray-600">Estimated Cost:</span>
              <p className="font-semibold text-yellow-700">
                {loading ? "Calculating..." : `${Number.parseFloat(gasEstimate).toFixed(6)} BNB`}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Gas Price:</span>
              <p className="font-semibold">{gasPrice} Gwei</p>
            </div>
            <div>
              <span className="text-gray-600">Your Balance:</span>
              <p className="font-semibold">{Number.parseFloat(userBalance).toFixed(6)} BNB</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600">Est. confirmation: 3-5 seconds on BSC</span>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Fast
            </Badge>
          </div>

          <div className="text-xs text-gray-500 border-t pt-2">
            <p>• Transaction costs paid in BNB on Binance Smart Chain</p>
            <p>• Actual cost may vary based on network congestion</p>
            <p>• Failed transactions will still consume gas fees</p>
          </div>
        </CardContent>
      </Card>

      {!hasEnoughBNB && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Insufficient BNB Balance</strong>
            <br />
            You need at least {Number.parseFloat(gasEstimate).toFixed(6)} BNB to complete this transaction. Your current
            balance is {Number.parseFloat(userBalance).toFixed(6)} BNB.
            <br />
            <span className="text-sm mt-2 block">
              Please add BNB to your wallet or use the BSC Testnet for free transactions.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {hasEnoughBNB && Number.parseFloat(gasEstimate) > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <Wallet className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Ready to Proceed</strong>
            <br />
            You have sufficient BNB balance to complete this transaction. Estimated cost:{" "}
            {Number.parseFloat(gasEstimate).toFixed(6)} BNB
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
