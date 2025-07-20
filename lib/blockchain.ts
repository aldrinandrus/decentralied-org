import { ethers } from "ethers"
import { getOrganRegistryContract, getMatchingContract } from "./contracts"

export interface DonorData {
  name: string
  bloodType: string
  organs: string[]
  medicalHash: string
  isVerified: boolean
  registrationTime: number
  emergencyContact?: string
  location?: string
}

export interface RecipientData {
  name: string
  bloodType: string
  organ: string
  urgency: number
  isActive: boolean
  medicalCondition?: string
  location?: string
}

export interface TransactionResult {
  hash: string
  status: "pending" | "success" | "failed"
  gasUsed?: string
  gasPrice?: string
  blockNumber?: number
  timestamp?: number
  error?: string
  bnbAmount?: string
  from?: string
  to?: string
  methodName?: string
  contractAddress?: string
  events?: any[]
}

export interface TransactionDetails {
  hash: string
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  blockNumber: number
  timestamp: number
  status: number
  methodName: string
  contractAddress: string
  bnbSpent: string
  confirmations: number
  events: ContractEvent[]
}

export interface ContractEvent {
  eventName: string
  args: any
  blockNumber: number
  transactionHash: string
  address: string
}

export interface TransactionHistory {
  hash: string
  type: string
  status: "pending" | "success" | "failed"
  timestamp: number
  gasUsed?: string
  gasPrice?: string
  blockNumber?: number
  functionName: string
  parameters?: any
  error?: string
  bnbAmount?: string
}

export class BlockchainService {
  private signer: ethers.Signer
  private provider: ethers.Provider

  constructor(signer: ethers.Signer) {
    this.signer = signer
    this.provider = signer.provider!
  }

  // Validate network before any transaction
  private async validateNetwork(): Promise<boolean> {
    try {
      const network = await this.provider.getNetwork()
      const chainId = Number(network.chainId)

      if (chainId !== 56 && chainId !== 97) {
        throw new Error(`Unsupported network. Please switch to BNB Smart Chain. Current network: ${chainId}`)
      }

      return true
    } catch (error) {
      console.error("Network validation failed:", error)
      throw error
    }
  }

  // Helper method to calculate BNB amount from gas
  private calculateBNBAmount(gasUsed: bigint, gasPrice: bigint): string {
    const totalWei = gasUsed * gasPrice
    return ethers.formatEther(totalWei)
  }

  // Helper method to get current gas price in BNB
  private async getCurrentGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData()
      return feeData.gasPrice || BigInt("5000000000") // 5 Gwei default for BSC
    } catch (error) {
      console.error("Error getting gas price:", error)
      return BigInt("5000000000") // 5 Gwei fallback
    }
  }

  // Enhanced transaction confirmation with event listening
  async waitForTransactionWithEvents(txHash: string, contractAddress: string): Promise<TransactionResult> {
    try {
      console.log(`Waiting for transaction confirmation with events: ${txHash}`)

      // Wait for transaction receipt with timeout
      const receipt = await Promise.race([
        this.provider.waitForTransaction(txHash, 1), // Wait for 1 confirmation
        new Promise<null>(
          (_, reject) => setTimeout(() => reject(new Error("Transaction timeout")), 300000), // 5 minutes
        ),
      ])

      if (!receipt) {
        return {
          hash: txHash,
          status: "failed",
          error: "Transaction receipt not found or timed out",
        }
      }

      // Get transaction details
      const tx = await this.provider.getTransaction(txHash)
      if (!tx) {
        throw new Error("Transaction not found")
      }

      // Get block details for timestamp
      const block = await this.provider.getBlock(receipt.blockNumber)
      if (!block) {
        throw new Error("Block not found")
      }

      // Calculate BNB spent
      const gasUsed = receipt.gasUsed
      const gasPrice = tx.gasPrice || BigInt(0)
      const bnbAmount = this.calculateBNBAmount(gasUsed, gasPrice)

      // Parse contract events
      const events = await this.parseContractEvents(receipt, contractAddress)

      // Determine method name from transaction data
      const methodName = await this.getMethodName(tx.data, contractAddress)

      const result: TransactionResult = {
        hash: txHash,
        status: receipt.status === 1 ? "success" : "failed",
        gasUsed: gasUsed.toString(),
        gasPrice: gasPrice.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp * 1000, // Convert to milliseconds
        bnbAmount: bnbAmount,
        from: tx.from,
        to: tx.to || contractAddress,
        methodName: methodName,
        contractAddress: contractAddress,
        events: events,
      }

      console.log(`Transaction confirmed: ${txHash}`)
      console.log(`Gas used: ${gasUsed.toString()}`)
      console.log(`Total BNB spent: ${bnbAmount} BNB`)
      console.log(`Block number: ${receipt.blockNumber}`)
      console.log(`Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`)

      // Store transaction in backend
      await this.storeTransactionInBackend(result)

      return result
    } catch (error: any) {
      console.error("Error waiting for transaction:", error)
      return {
        hash: txHash,
        status: "failed",
        error: this.getErrorMessage(error),
      }
    }
  }

  // Parse contract events from transaction receipt
  private async parseContractEvents(
    receipt: ethers.TransactionReceipt,
    contractAddress: string,
  ): Promise<ContractEvent[]> {
    try {
      const events: ContractEvent[] = []

      // Get contract interface for event parsing
      const organContract = getOrganRegistryContract(this.signer)
      const matchingContract = getMatchingContract(this.signer)

      for (const log of receipt.logs) {
        try {
          let parsedLog: ethers.LogDescription | null = null
          let eventName = ""

          // Try to parse with organ registry contract
          if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
            try {
              parsedLog = organContract.interface.parseLog({
                topics: log.topics,
                data: log.data,
              })
              eventName = parsedLog?.name || ""
            } catch {
              // Try matching contract if organ contract fails
              try {
                parsedLog = matchingContract.interface.parseLog({
                  topics: log.topics,
                  data: log.data,
                })
                eventName = parsedLog?.name || ""
              } catch {
                // Skip if can't parse
                continue
              }
            }

            if (parsedLog) {
              events.push({
                eventName: eventName,
                args: parsedLog.args,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                address: log.address,
              })
            }
          }
        } catch (error) {
          console.error("Error parsing log:", error)
        }
      }

      return events
    } catch (error) {
      console.error("Error parsing contract events:", error)
      return []
    }
  }

  // Get method name from transaction data
  private async getMethodName(data: string, contractAddress: string): Promise<string> {
    try {
      if (data.length < 10) return "unknown"

      const methodId = data.slice(0, 10)
      const organContract = getOrganRegistryContract(this.signer)
      const matchingContract = getMatchingContract(this.signer)

      // Try to find method in contract interfaces
      for (const fragment of organContract.interface.fragments) {
        if (fragment.type === "function") {
          try {
            const functionFragment = fragment as ethers.FunctionFragment
            const functionInterface = organContract.interface.getFunction(functionFragment.name)
            if (functionInterface && functionInterface.selector === methodId) {
              return functionFragment.name
            }
          } catch {
            continue
          }
        }
      }

      for (const fragment of matchingContract.interface.fragments) {
        if (fragment.type === "function") {
          try {
            const functionFragment = fragment as ethers.FunctionFragment
            const functionInterface = matchingContract.interface.getFunction(functionFragment.name)
            if (functionInterface && functionInterface.selector === methodId) {
              return functionFragment.name
            }
          } catch {
            continue
          }
        }
      }

      return "unknown"
    } catch (error) {
      console.error("Error getting method name:", error)
      return "unknown"
    }
  }

  // Store transaction data in backend
  private async storeTransactionInBackend(transaction: TransactionResult): Promise<void> {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          value: "0", // Most contract calls don't transfer BNB value
          gasUsed: transaction.gasUsed,
          gasPrice: transaction.gasPrice,
          blockNumber: transaction.blockNumber,
          timestamp: transaction.timestamp,
          status: transaction.status === "success" ? 1 : 0,
          methodName: transaction.methodName,
          contractAddress: transaction.contractAddress,
          bnbSpent: transaction.bnbAmount,
          events: transaction.events,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to store transaction: ${response.statusText}`)
      }

      console.log(`Transaction stored in backend: ${transaction.hash}`)
    } catch (error) {
      console.error("Error storing transaction in backend:", error)
      // Don't throw error here to avoid breaking the main flow
    }
  }

  // Get detailed transaction information
  async getTransactionDetails(txHash: string): Promise<TransactionDetails | null> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash),
      ])

      if (!tx || !receipt) {
        return null
      }

      const block = await this.provider.getBlock(receipt.blockNumber)
      if (!block) {
        return null
      }

      const bnbSpent = this.calculateBNBAmount(receipt.gasUsed, tx.gasPrice || BigInt(0))
      const methodName = await this.getMethodName(tx.data, receipt.to || "")
      const events = await this.parseContractEvents(receipt, receipt.to || "")

      return {
        hash: txHash,
        from: tx.from,
        to: tx.to || "",
        value: ethers.formatEther(tx.value),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: (tx.gasPrice || BigInt(0)).toString(),
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp * 1000,
        status: receipt.status || 0,
        methodName: methodName,
        contractAddress: receipt.to || "",
        bnbSpent: bnbSpent,
        confirmations: (await this.provider.getBlockNumber()) - receipt.blockNumber,
        events: events,
      }
    } catch (error) {
      console.error("Error getting transaction details:", error)
      return null
    }
  }

  async registerDonor(donorData: Omit<DonorData, "isVerified" | "registrationTime">): Promise<TransactionResult> {
    try {
      await this.validateNetwork()

      const contract = getOrganRegistryContract(this.signer)
      const gasPrice = await this.getCurrentGasPrice()

      // Add missing required parameters with default values
      const emergencyContact = donorData.emergencyContact || "Not specified"
      const location = donorData.location || "Not specified"

      const gasEstimate = await contract.registerDonor.estimateGas(
        donorData.name,
        donorData.bloodType,
        donorData.organs,
        donorData.medicalHash,
        emergencyContact,
        location,
      )

      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100)
      const estimatedBNB = this.calculateBNBAmount(gasLimit, gasPrice)

      console.log(`Registering donor with estimated cost: ${estimatedBNB} BNB`)

      const tx = await contract.registerDonor(
        donorData.name,
        donorData.bloodType,
        donorData.organs,
        donorData.medicalHash,
        emergencyContact,
        location,
        {
          gasLimit,
          gasPrice,
        },
      )

      console.log(`Transaction submitted: ${tx.hash}`)

      return {
        hash: tx.hash,
        status: "pending",
        bnbAmount: estimatedBNB,
        from: tx.from,
        to: await contract.getAddress(),
        methodName: "registerDonor",
        contractAddress: await contract.getAddress(),
      }
    } catch (error: any) {
      console.error("Error registering donor:", error)
      return {
        hash: "",
        status: "failed",
        error: this.getErrorMessage(error),
      }
    }
  }

  async addRecipient(recipientData: Omit<RecipientData, "isActive">): Promise<TransactionResult> {
    try {
      await this.validateNetwork()

      const contract = getOrganRegistryContract(this.signer)
      const gasPrice = await this.getCurrentGasPrice()

      // Add missing required parameters with default values
      const medicalCondition = recipientData.medicalCondition || "Not specified"
      const location = recipientData.location || "Not specified"

      const gasEstimate = await contract.registerRecipient.estimateGas(
        recipientData.name,
        recipientData.bloodType,
        recipientData.organ,
        recipientData.urgency,
        medicalCondition,
        location,
      )

      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100)
      const estimatedBNB = this.calculateBNBAmount(gasLimit, gasPrice)

      const tx = await contract.registerRecipient(
        recipientData.name,
        recipientData.bloodType,
        recipientData.organ,
        recipientData.urgency,
        medicalCondition,
        location,
        {
          gasLimit,
          gasPrice,
        },
      )

      console.log(`Recipient registration transaction: ${tx.hash}`)

      return {
        hash: tx.hash,
        status: "pending",
        bnbAmount: estimatedBNB,
        from: tx.from,
        to: await contract.getAddress(),
        methodName: "registerRecipient",
        contractAddress: await contract.getAddress(),
      }
    } catch (error: any) {
      console.error("Error adding recipient:", error)
      return {
        hash: "",
        status: "failed",
        error: this.getErrorMessage(error),
      }
    }
  }

  async createMatch(donorAddress: string, recipientAddress: string): Promise<TransactionResult> {
    try {
      await this.validateNetwork()

      const contract = getMatchingContract(this.signer)
      const gasPrice = await this.getCurrentGasPrice()

      const gasEstimate = await contract.createMatch.estimateGas(donorAddress, recipientAddress)
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100)
      const estimatedBNB = this.calculateBNBAmount(gasLimit, gasPrice)

      const tx = await contract.createMatch(donorAddress, recipientAddress, {
        gasLimit,
        gasPrice,
      })

      console.log(`Match creation transaction: ${tx.hash}`)

      return {
        hash: tx.hash,
        status: "pending",
        bnbAmount: estimatedBNB,
        from: tx.from,
        to: await contract.getAddress(),
        methodName: "createMatch",
        contractAddress: await contract.getAddress(),
      }
    } catch (error: any) {
      console.error("Error creating match:", error)
      return {
        hash: "",
        status: "failed",
        error: this.getErrorMessage(error),
      }
    }
  }

  async updateDonorConsent(newMedicalHash: string): Promise<TransactionResult> {
    try {
      await this.validateNetwork()

      const contract = getOrganRegistryContract(this.signer)
      const gasPrice = await this.getCurrentGasPrice()

      const gasEstimate = await contract.updateDonorConsent.estimateGas(newMedicalHash)
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100)
      const estimatedBNB = this.calculateBNBAmount(gasLimit, gasPrice)

      const tx = await contract.updateDonorConsent(newMedicalHash, {
        gasLimit,
        gasPrice,
      })

      console.log(`Consent update transaction: ${tx.hash}`)

      return {
        hash: tx.hash,
        status: "pending",
        bnbAmount: estimatedBNB,
        from: tx.from,
        to: await contract.getAddress(),
        methodName: "updateDonorConsent",
        contractAddress: await contract.getAddress(),
      }
    } catch (error: any) {
      console.error("Error updating consent:", error)
      return {
        hash: "",
        status: "failed",
        error: this.getErrorMessage(error),
      }
    }
  }

  // Enhanced waitForTransaction that uses the new method
  async waitForTransaction(txHash: string): Promise<TransactionResult> {
    // Get contract address from the transaction
    try {
      const tx = await this.provider.getTransaction(txHash)
      const contractAddress = tx?.to || ""
      return await this.waitForTransactionWithEvents(txHash, contractAddress)
    } catch (error) {
      return await this.waitForTransactionWithEvents(txHash, "")
    }
  }

  // Centralized error message handling
  private getErrorMessage(error: any): string {
    if (error.message?.includes("network changed")) {
      return "Network changed during transaction. Please ensure you stay on the same network and try again."
    } else if (error.message?.includes("Unsupported network")) {
      return error.message
    } else if (error.code === "NETWORK_ERROR") {
      return "Network error occurred. Please check your connection and try again."
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      return "Insufficient BNB balance for transaction fees."
    } else if (error.code === "USER_REJECTED" || error.code === 4001) {
      return "Transaction was rejected by user."
    } else if (error.message?.includes("gas")) {
      return "Gas estimation failed. Please try again with a higher gas limit."
    } else if (error.message?.includes("execution reverted")) {
      return "Smart contract execution failed. Please check your input data."
    } else {
      return error.message || "Transaction failed. Please try again."
    }
  }

  async getTransactionHistory(address: string): Promise<TransactionHistory[]> {
    try {
      await this.validateNetwork()

      const history: TransactionHistory[] = []
      const currentBlock = await this.provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 1000)

      console.log(`Fetching transaction history for ${address}`)

      const organContract = getOrganRegistryContract(this.signer)
      const matchingContract = getMatchingContract(this.signer)

      try {
        const donorEvents = await organContract.queryFilter(
          organContract.filters.DonorRegistered(address),
          fromBlock,
          currentBlock,
        )

        for (const event of donorEvents) {
          try {
            const tx = await event.getTransaction()
            const receipt = await event.getTransactionReceipt()
            const block = await event.getBlock()

            const bnbAmount = this.calculateBNBAmount(receipt.gasUsed, tx.gasPrice || BigInt(0))

            history.push({
              hash: tx.hash,
              type: "Donor Registration",
              status: receipt.status === 1 ? "success" : "failed",
              timestamp: block.timestamp * 1000,
              gasUsed: receipt.gasUsed.toString(),
              gasPrice: (tx.gasPrice || BigInt(0)).toString(),
              blockNumber: receipt.blockNumber,
              functionName: "registerDonor",
              bnbAmount: bnbAmount,
            })
          } catch (eventError) {
            console.error("Error processing donor event:", eventError)
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      }

      return history.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      return []
    }
  }

  async getDonor(address: string): Promise<DonorData | null> {
    try {
      await this.validateNetwork()
      const contract = getOrganRegistryContract(this.signer)
      const result = await contract.getDonor(address)

      return {
        name: result[0],
        bloodType: result[1],
        organs: result[2],
        medicalHash: result[3],
        isVerified: result[4],
        registrationTime: Number(result[5]),
      }
    } catch (error) {
      console.error("Error fetching donor:", error)
      return null
    }
  }

  async getRecipient(address: string): Promise<RecipientData | null> {
    try {
      await this.validateNetwork()
      const contract = getMatchingContract(this.signer)
      const result = await contract.getRecipient(address)

      return {
        name: result[0],
        bloodType: result[1],
        organ: result[2],
        urgency: Number(result[3]),
        isActive: result[4],
      }
    } catch (error) {
      console.error("Error fetching recipient:", error)
      return null
    }
  }

  async findMatches(bloodType: string, organ: string): Promise<string[]> {
    try {
      await this.validateNetwork()
      const contract = getOrganRegistryContract(this.signer)
      return await contract.findMatches(bloodType, organ)
    } catch (error) {
      console.error("Error finding matches:", error)
      return []
    }
  }

  async estimateTransactionCost(transactionType: string, parameters?: any): Promise<string> {
    try {
      await this.validateNetwork()

      const gasPrice = await this.getCurrentGasPrice()
      let gasEstimate: bigint

      switch (transactionType) {
        case "registerDonor":
          if (parameters) {
            const contract = getOrganRegistryContract(this.signer)
            gasEstimate = await contract.registerDonor.estimateGas(
              parameters.name,
              parameters.bloodType,
              parameters.organs,
              parameters.medicalHash || "0x",
            )
          } else {
            gasEstimate = BigInt(200000)
          }
          break
        case "addRecipient":
          gasEstimate = BigInt(150000)
          break
        case "createMatch":
          gasEstimate = BigInt(100000)
          break
        default:
          gasEstimate = BigInt(100000)
      }

      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100)
      const totalCost = this.calculateBNBAmount(gasLimit, gasPrice)

      console.log(`Estimated cost for ${transactionType}: ${totalCost} BNB`)
      return totalCost
    } catch (error) {
      console.error("Error estimating gas:", error)
      return "0.001"
    }
  }

  async getBNBBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error("Error getting BNB balance:", error)
      return "0"
    }
  }

  async hasEnoughBNB(address: string, estimatedCost: string): Promise<boolean> {
    try {
      const balance = await this.getBNBBalance(address)
      return Number.parseFloat(balance) >= Number.parseFloat(estimatedCost)
    } catch (error) {
      console.error("Error checking BNB balance:", error)
      return false
    }
  }
}
