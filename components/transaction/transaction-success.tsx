"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ExternalLink, Copy, Clock, Zap, Hash, User, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { TransactionResult, TransactionDetails } from "@/lib/blockchain"

interface TransactionSuccessProps {
  transaction: TransactionResult
  onViewDetails?: () => void
  onContinue?: () => void
}

export function TransactionSuccess({ transaction, onViewDetails, onContinue }: TransactionSuccessProps) {
  const { toast } = useToast()
  const [details, setDetails] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (transaction.hash) {
      fetchTransactionDetails()
    }
  }, [transaction.hash])

  const fetchTransactionDetails = async () => {
    if (!transaction.hash) return

    setLoading(true)
    try {
      const response = await fetch(`/api/transactions/${transaction.hash}`)
      if (response.ok) {
        const result = await response.json()
        setDetails(result.data)
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied",
        description: "Transaction hash copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const openInExplorer = () => {
    if (transaction.hash) {
      const explorerUrl = `https://bscscan.com/tx/${transaction.hash}`
      window.open(explorerUrl, "_blank")
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getMethodDisplayName = (methodName: string) => {
    switch (methodName) {
      case "registerDonor":
        return "Donor Registration"
      case "addRecipient":
        return "Recipient Registration"
      case "createMatch":
        return "Match Creation"
      case "updateDonorConsent":
        return "Consent Update"
      default:
        return methodName
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Transaction Successful!</CardTitle>
          <p className="text-green-700">
            Your {getMethodDisplayName(transaction.methodName || "")} has been confirmed on the BNB Chain blockchain.
          </p>
        </CardHeader>
      </Card>

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hash className="h-5 w-5" />
            <span>Transaction Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Hash */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Transaction Hash</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm break-all font-mono">{transaction.hash}</code>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(transaction.hash)}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center">
                <User className="h-4 w-4 mr-1" />
                From Address
              </label>
              <code className="block p-2 bg-gray-100 rounded text-sm font-mono">{transaction.from}</code>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Contract Address
              </label>
              <code className="block p-2 bg-gray-100 rounded text-sm font-mono">{transaction.contractAddress}</code>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Method Called
              </label>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {getMethodDisplayName(transaction.methodName || "")}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Timestamp
              </label>
              <p className="text-sm">{formatTimestamp(transaction.timestamp || Date.now())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {transaction.bnbAmount ? Number.parseFloat(transaction.bnbAmount).toFixed(6) : "0"} BNB
              </div>
              <div className="text-sm text-yellow-600">Total Cost</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {transaction.gasUsed ? Number(transaction.gasUsed).toLocaleString() : "0"}
              </div>
              <div className="text-sm text-blue-600">Gas Used</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {transaction.blockNumber ? transaction.blockNumber.toLocaleString() : "Pending"}
              </div>
              <div className="text-sm text-purple-600">Block Number</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Events */}
      {transaction.events && transaction.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transaction.events.map((event, index) => (
                <div key={index} className="border rounded-lg p-3 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-600">{event.eventName}</Badge>
                    <span className="text-sm text-gray-500">Block {event.blockNumber}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Contract:</strong> {event.address}
                  </div>
                  {event.args && Object.keys(event.args).length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm">Event Data:</strong>
                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(event.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Actions */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>What happens next?</strong>
          <br />• Your transaction has been permanently recorded on the blockchain
          <br />• Medical professionals will review and verify your registration
          <br />• You'll receive notifications about potential matches
          <br />• You can view your status anytime in the dashboard
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={openInExplorer} variant="outline" className="flex-1 bg-transparent">
          <ExternalLink className="h-4 w-4 mr-2" />
          View on BscScan
        </Button>

        {onViewDetails && (
          <Button onClick={onViewDetails} variant="outline" className="flex-1 bg-transparent">
            <Clock className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
        )}

        {onContinue && (
          <Button onClick={onContinue} className="flex-1 bg-green-600 hover:bg-green-700">
            Continue to Dashboard
          </Button>
        )}
      </div>
    </div>
  )
}
