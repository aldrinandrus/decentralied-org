import type { ethers } from "ethers"
import { BlockchainService, type TransactionResult, type TransactionHistory } from "./blockchain"

export interface PendingTransaction {
  hash: string
  type: string
  timestamp: number
  functionName: string
  parameters?: any
}

export class TransactionService {
  private blockchainService: BlockchainService
  private pendingTransactions: Map<string, PendingTransaction> = new Map()
  private eventListeners: Map<string, (result: TransactionResult) => void> = new Map()

  constructor(signer: ethers.Signer) {
    this.blockchainService = new BlockchainService(signer)
  }

  async executeTransaction(
    type: string,
    functionName: string,
    transactionFunction: () => Promise<TransactionResult>,
    parameters?: any,
  ): Promise<TransactionResult> {
    try {
      // Execute the transaction
      const result = await transactionFunction()

      if (result.status === "pending" && result.hash) {
        // Store pending transaction
        this.pendingTransactions.set(result.hash, {
          hash: result.hash,
          type,
          timestamp: Date.now(),
          functionName,
          parameters,
        })

        // Start monitoring the transaction with enhanced confirmation
        this.monitorTransactionWithEvents(result.hash, result.contractAddress || "")
      }

      return result
    } catch (error: any) {
      console.error(`Error executing ${type} transaction:`, error)
      return {
        hash: "",
        status: "failed",
        error: error.message || "Transaction failed",
      }
    }
  }

  private async monitorTransactionWithEvents(txHash: string, contractAddress: string): Promise<void> {
    try {
      console.log(`Monitoring transaction with events: ${txHash}`)

      // Wait for transaction confirmation with event parsing
      const result = await this.blockchainService.waitForTransactionWithEvents(txHash, contractAddress)

      // Remove from pending transactions
      this.pendingTransactions.delete(txHash)

      // Notify listeners with enhanced result
      const listener = this.eventListeners.get(txHash)
      if (listener) {
        listener(result)
        this.eventListeners.delete(txHash)
      }

      // Log success details
      if (result.status === "success") {
        console.log(`✅ Transaction confirmed successfully:`)
        console.log(`   Hash: ${result.hash}`)
        console.log(`   Block: ${result.blockNumber}`)
        console.log(`   Gas Used: ${result.gasUsed}`)
        console.log(`   BNB Spent: ${result.bnbAmount}`)
        console.log(`   Method: ${result.methodName}`)
        console.log(`   Events: ${result.events?.length || 0} contract events`)

        // Trigger success notifications
        await this.handleTransactionSuccess(result)
      }
    } catch (error) {
      console.error(`Error monitoring transaction ${txHash}:`, error)

      // Mark as failed
      const failedResult: TransactionResult = {
        hash: txHash,
        status: "failed",
        error: "Transaction monitoring failed",
      }

      const listener = this.eventListeners.get(txHash)
      if (listener) {
        listener(failedResult)
        this.eventListeners.delete(txHash)
      }
    }
  }

  private async handleTransactionSuccess(result: TransactionResult): Promise<void> {
    try {
      // Send success notification based on transaction type
      if (result.methodName === "registerDonor") {
        console.log("🎉 Donor registration successful!")
        // Could trigger email notifications, dashboard updates, etc.
      } else if (result.methodName === "createMatch") {
        console.log("🤝 Match creation successful!")
        // Could notify both donor and recipient
      } else if (result.methodName === "updateDonorConsent") {
        console.log("📝 Consent update successful!")
        // Could log consent changes for audit trail
      }

      // Store detailed transaction record
      await this.storeTransactionRecord(result)
    } catch (error) {
      console.error("Error handling transaction success:", error)
    }
  }

  private async storeTransactionRecord(result: TransactionResult): Promise<void> {
    try {
      // This would integrate with your backend API
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash: result.hash,
          from: result.from,
          to: result.to,
          gasUsed: result.gasUsed,
          gasPrice: result.gasPrice,
          blockNumber: result.blockNumber,
          timestamp: result.timestamp,
          status: result.status === "success" ? 1 : 0,
          methodName: result.methodName,
          contractAddress: result.contractAddress,
          bnbSpent: result.bnbAmount,
          events: result.events,
        }),
      })

      if (response.ok) {
        console.log(`📊 Transaction record stored: ${result.hash}`)
      }
    } catch (error) {
      console.error("Error storing transaction record:", error)
    }
  }

  onTransactionUpdate(txHash: string, callback: (result: TransactionResult) => void): void {
    this.eventListeners.set(txHash, callback)
  }

  getPendingTransactions(): PendingTransaction[] {
    return Array.from(this.pendingTransactions.values())
  }

  async getTransactionHistory(address: string): Promise<TransactionHistory[]> {
    return await this.blockchainService.getTransactionHistory(address)
  }

  async estimateTransactionCost(contractFunction: any, ...args: any[]): Promise<string> {
    return await this.blockchainService.estimateTransactionCost("general", { args })
  }

  // Enhanced transaction methods with better confirmation
  async registerDonor(donorData: any): Promise<TransactionResult> {
    return this.executeTransaction(
      "Donor Registration",
      "registerDonor",
      () => this.blockchainService.registerDonor(donorData),
      donorData,
    )
  }

  async addRecipient(recipientData: any): Promise<TransactionResult> {
    return this.executeTransaction(
      "Recipient Registration",
      "addRecipient",
      () => this.blockchainService.addRecipient(recipientData),
      recipientData,
    )
  }

  async createMatch(donorAddress: string, recipientAddress: string): Promise<TransactionResult> {
    return this.executeTransaction(
      "Match Creation",
      "createMatch",
      () => this.blockchainService.createMatch(donorAddress, recipientAddress),
      { donorAddress, recipientAddress },
    )
  }

  async updateConsent(medicalHash: string): Promise<TransactionResult> {
    return this.executeTransaction(
      "Consent Update",
      "updateDonorConsent",
      () => this.blockchainService.updateDonorConsent(medicalHash),
      { medicalHash },
    )
  }

  // Get detailed transaction information
  async getTransactionDetails(txHash: string) {
    return await this.blockchainService.getTransactionDetails(txHash)
  }
}
