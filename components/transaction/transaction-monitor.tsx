"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { TransactionService } from "@/lib/transaction-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Clock, CheckCircle, XCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import type { TransactionHistory } from "@/lib/blockchain"

interface TransactionMonitorProps {
  address: string
}

export function TransactionMonitor({ address }: TransactionMonitorProps) {
  const { signer } = useWeb3()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<TransactionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (signer && address) {
      loadTransactionHistory()
    }
  }, [signer, address])

  const loadTransactionHistory = async () => {
    if (!signer) return

    try {
      setLoading(true)
      const transactionService = new TransactionService(signer)
      const history = await transactionService.getTransactionHistory(address)
      setTransactions(history)
    } catch (error) {
      console.error("Error loading transaction history:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshHistory = async () => {
    setRefreshing(true)
    await loadTransactionHistory()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Transaction history updated",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-600">Success</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const openInExplorer = (hash: string) => {
    // BNB Chain explorer URL
    const explorerUrl = `https://bscscan.com/tx/${hash}`
    window.open(explorerUrl, "_blank")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2">Loading transaction history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button variant="outline" size="sm" onClick={refreshHistory} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions found</p>
            <p className="text-sm text-gray-500 mt-2">Your blockchain transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.hash} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(tx.status)}
                    <div>
                      <h3 className="font-semibold">{tx.type}</h3>
                      <p className="text-sm text-gray-500">{tx.functionName}</p>
                    </div>
                  </div>
                  {getStatusBadge(tx.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Transaction Hash:</span>
                    <p className="font-mono text-xs break-all">{tx.hash}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Timestamp:</span>
                    <p>{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">BNB Amount (Gas):</span>
                    <p className="font-medium">{tx.bnbAmount || "0"} BNB</p>
                  </div>
                </div>

                {tx.gasUsed && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                    <div>
                      <span className="text-gray-500">Gas Used:</span>
                      <p>{Number(tx.gasUsed).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Gas Price:</span>
                      <p>{tx.gasPrice ? `${Number(tx.gasPrice) / 1e9} Gwei` : "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Block Number:</span>
                      <p>{tx.blockNumber?.toLocaleString() || "N/A"}</p>
                    </div>
                  </div>
                )}

                {tx.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 text-sm">
                      <strong>Error:</strong> {tx.error}
                    </p>
                  </div>
                )}

                <div className="flex justify-end mt-3">
                  <Button variant="outline" size="sm" onClick={() => openInExplorer(tx.hash)}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on BscScan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
