"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, ExternalLink, Copy, AlertTriangle, RefreshCw } from "lucide-react"
import { TransactionSuccess } from "./transaction-success"
import type { TransactionResult } from "@/lib/blockchain"

interface TransactionFeedbackProps {
  transaction: TransactionResult | null
  isOpen: boolean
  onClose: () => void
  onRetry?: () => void
}

export function TransactionFeedback({ transaction, isOpen, onClose, onRetry }: TransactionFeedbackProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (transaction && isOpen) {
      // Show toast notification for transaction status
      if (transaction.status === "success") {
        toast({
          title: "Transaction Successful",
          description: "Your transaction has been confirmed on the blockchain",
        })
      } else if (transaction.status === "failed") {
        toast({
          title: "Transaction Failed",
          description: transaction.error || "Transaction was rejected or failed",
          variant: "destructive",
        })
      }
    }
  }, [transaction, isOpen, toast])

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
    if (transaction?.hash) {
      const explorerUrl = `https://bscscan.com/tx/${transaction.hash}`
      window.open(explorerUrl, "_blank")
    }
  }

  const getStatusIcon = () => {
    if (!transaction) return null

    switch (transaction.status) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case "failed":
        return <XCircle className="h-12 w-12 text-red-600" />
      case "pending":
        return <Loader2 className="h-12 w-12 text-yellow-600 animate-spin" />
      default:
        return <AlertTriangle className="h-12 w-12 text-gray-600" />
    }
  }

  const getStatusTitle = () => {
    if (!transaction) return "Transaction Status"

    switch (transaction.status) {
      case "success":
        return "Transaction Successful"
      case "failed":
        return "Transaction Failed"
      case "pending":
        return "Transaction Pending"
      default:
        return "Transaction Status"
    }
  }

  const getStatusDescription = () => {
    if (!transaction) return ""

    switch (transaction.status) {
      case "success":
        return "Your transaction has been successfully confirmed on the BNB Chain blockchain."
      case "failed":
        return transaction.error || "The transaction was rejected or failed to execute."
      case "pending":
        return "Your transaction is being processed. Please wait for blockchain confirmation."
      default:
        return "Transaction status unknown."
    }
  }

  const isNetworkError =
    transaction?.error?.includes("network changed") || transaction?.error?.includes("NETWORK_ERROR")

  if (!transaction) return null

  // Show detailed success view for successful transactions
  if (transaction.status === "success") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Confirmed</DialogTitle>
            <DialogDescription>
              Your blockchain transaction has been successfully processed and confirmed.
            </DialogDescription>
          </DialogHeader>

          <TransactionSuccess transaction={transaction} onContinue={onClose} />

          <DialogFooter>
            <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
              Continue to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Standard dialog for pending/failed transactions
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            <div className="text-center">
              <DialogTitle>{getStatusTitle()}</DialogTitle>
              <DialogDescription className="mt-2">{getStatusDescription()}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {transaction.hash && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Hash</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-xs break-all">{transaction.hash}</code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(transaction.hash)}>
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {transaction.status === "pending" && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {transaction.from && (
                <div>
                  <label className="text-gray-500">From</label>
                  <p className="font-mono text-xs">
                    {transaction.from.slice(0, 10)}...{transaction.from.slice(-8)}
                  </p>
                </div>
              )}
              {transaction.contractAddress && (
                <div>
                  <label className="text-gray-500">Contract</label>
                  <p className="font-mono text-xs">
                    {transaction.contractAddress.slice(0, 10)}...{transaction.contractAddress.slice(-8)}
                  </p>
                </div>
              )}
              {transaction.methodName && (
                <div>
                  <label className="text-gray-500">Method</label>
                  <Badge variant="outline">{transaction.methodName}</Badge>
                </div>
              )}
              {transaction.bnbAmount && (
                <div>
                  <label className="text-gray-500">Est. Cost</label>
                  <p className="font-medium">{Number.parseFloat(transaction.bnbAmount).toFixed(6)} BNB</p>
                </div>
              )}
            </div>
          )}

          {transaction.status === "failed" && transaction.error && (
            <div className="space-y-3">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error Details:</strong> {transaction.error}
                </AlertDescription>
              </Alert>

              {isNetworkError && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Network Issue Detected:</strong>
                    <br />• Make sure you're connected to BNB Smart Chain
                    <br />• Don't switch networks during transactions
                    <br />• Check your wallet connection and try again
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {transaction.status === "pending" && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
              <AlertDescription className="text-yellow-800">
                <strong>Please wait:</strong> Your transaction is being processed by the blockchain network. This may
                take a few minutes depending on network congestion.
                <br />
                <span className="text-sm mt-2 block">
                  ⚠️ Do not switch networks or close your wallet during this process.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2">
          <div className="flex space-x-2 w-full">
            {transaction.hash && (
              <Button variant="outline" onClick={openInExplorer} className="flex-1 bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on BscScan
              </Button>
            )}
            {transaction.status === "failed" && onRetry && (
              <Button onClick={onRetry} className="flex-1 bg-green-600 hover:bg-green-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Transaction
              </Button>
            )}
          </div>
          <Button
            variant={transaction.status === "success" ? "default" : "outline"}
            onClick={onClose}
            className="w-full"
          >
            {transaction.status === "success" ? "Continue" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
