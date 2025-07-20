const express = require("express")
const cors = require("cors")
const { ethers } = require("ethers")
const fs = require("fs")
const path = require("path")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Blockchain configuration
const NETWORK = process.env.NETWORK || "bscTestnet"
const RPC_URL = process.env.BNB_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/"
const CONTRACT_ADDRESS = process.env.ORGAN_REGISTRY_ADDRESS
const PRIVATE_KEY = process.env.PRIVATE_KEY

// Initialize provider and contract
let provider, contract, wallet

try {
  provider = new ethers.JsonRpcProvider(RPC_URL)

  if (PRIVATE_KEY && CONTRACT_ADDRESS) {
    wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    // Load contract ABI
    const contractABI = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../artifacts/contracts/OrganRegistry.sol/OrganRegistry.json"), "utf8"),
    ).abi

    contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet)
    console.log("✅ Blockchain connection established")
    console.log("📋 Contract Address:", CONTRACT_ADDRESS)
    console.log("🌐 Network:", NETWORK)
  } else {
    console.warn("⚠️ Missing PRIVATE_KEY or CONTRACT_ADDRESS - blockchain features disabled")
  }
} catch (error) {
  console.error("❌ Failed to initialize blockchain connection:", error.message)
}

// In-memory storage (use database in production)
const storage = {
  transactions: [],
  events: [],
  notifications: [],
  users: new Map(),
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    blockchain: {
      connected: !!contract,
      network: NETWORK,
      contractAddress: CONTRACT_ADDRESS,
    },
  })
})

// Blockchain status endpoint
app.get("/api/blockchain/status", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const [network, blockNumber, stats] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      contract.getContractStats(),
    ])

    res.json({
      success: true,
      data: {
        network: {
          name: network.name,
          chainId: Number(network.chainId),
        },
        blockNumber,
        contractAddress: CONTRACT_ADDRESS,
        stats: {
          totalDonors: Number(stats._totalDonors),
          totalRecipients: Number(stats._totalRecipients),
          totalMatches: Number(stats._totalMatches),
          successfulTransplants: Number(stats._successfulTransplants),
          verifiedDonors: Number(stats._verifiedDonors),
        },
      },
    })
  } catch (error) {
    console.error("Error getting blockchain status:", error)
    res.status(500).json({ error: "Failed to get blockchain status" })
  }
})

// Register donor endpoint
app.post("/api/donors/register", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { name, bloodType, organs, medicalHash, emergencyContact, location, userAddress } = req.body

    // Validate input
    if (!name || !bloodType || !organs || !Array.isArray(organs) || organs.length === 0) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Estimate gas
    const gasEstimate = await contract.registerDonor.estimateGas(
      name,
      bloodType,
      organs,
      medicalHash || "",
      emergencyContact || "",
      location || "",
    )

    // Execute transaction
    const tx = await contract.registerDonor(
      name,
      bloodType,
      organs,
      medicalHash || "",
      emergencyContact || "",
      location || "",
      {
        gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
      },
    )

    console.log("📝 Donor registration transaction:", tx.hash)

    // Wait for confirmation
    const receipt = await tx.wait()

    // Store transaction
    const transactionData = {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: tx.gasPrice.toString(),
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      status: receipt.status,
      type: "donor_registration",
      userAddress,
    }

    storage.transactions.push(transactionData)

    res.json({
      success: true,
      message: "Donor registered successfully",
      data: {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      },
    })
  } catch (error) {
    console.error("Error registering donor:", error)
    res.status(500).json({
      error: "Failed to register donor",
      details: error.message,
    })
  }
})

// Register recipient endpoint
app.post("/api/recipients/register", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { name, bloodType, organ, urgency, medicalCondition, location, userAddress } = req.body

    // Validate input
    if (!name || !bloodType || !organ || !urgency) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (urgency < 1 || urgency > 5) {
      return res.status(400).json({ error: "Urgency must be between 1 and 5" })
    }

    // Execute transaction
    const tx = await contract.registerRecipient(name, bloodType, organ, urgency, medicalCondition || "", location || "")

    console.log("📝 Recipient registration transaction:", tx.hash)

    const receipt = await tx.wait()

    // Store transaction
    const transactionData = {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: tx.gasPrice.toString(),
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      status: receipt.status,
      type: "recipient_registration",
      userAddress,
    }

    storage.transactions.push(transactionData)

    res.json({
      success: true,
      message: "Recipient registered successfully",
      data: {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      },
    })
  } catch (error) {
    console.error("Error registering recipient:", error)
    res.status(500).json({
      error: "Failed to register recipient",
      details: error.message,
    })
  }
})

// Get donor information
app.get("/api/donors/:address", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { address } = req.params

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" })
    }

    const donorData = await contract.getDonor(address)

    // Check if donor exists
    if (donorData.registrationTime.toString() === "0") {
      return res.status(404).json({ error: "Donor not found" })
    }

    res.json({
      success: true,
      data: {
        name: donorData.name,
        bloodType: donorData.bloodType,
        organs: donorData.organs,
        medicalHash: donorData.medicalHash,
        isVerified: donorData.isVerified,
        isActive: donorData.isActive,
        registrationTime: Number(donorData.registrationTime),
        emergencyContact: donorData.emergencyContact,
        location: donorData.location,
      },
    })
  } catch (error) {
    console.error("Error getting donor:", error)
    res.status(500).json({ error: "Failed to get donor information" })
  }
})

// Get recipient information
app.get("/api/recipients/:address", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { address } = req.params

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" })
    }

    const recipientData = await contract.getRecipient(address)

    // Check if recipient exists
    if (recipientData.registrationTime.toString() === "0") {
      return res.status(404).json({ error: "Recipient not found" })
    }

    res.json({
      success: true,
      data: {
        name: recipientData.name,
        bloodType: recipientData.bloodType,
        organ: recipientData.organ,
        urgency: Number(recipientData.urgency),
        isActive: recipientData.isActive,
        registrationTime: Number(recipientData.registrationTime),
        medicalCondition: recipientData.medicalCondition,
        location: recipientData.location,
        waitingSince: Number(recipientData.waitingSince),
      },
    })
  } catch (error) {
    console.error("Error getting recipient:", error)
    res.status(500).json({ error: "Failed to get recipient information" })
  }
})

// Find compatible donors
app.get("/api/matching/donors", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { bloodType, organ } = req.query

    if (!bloodType || !organ) {
      return res.status(400).json({ error: "bloodType and organ parameters are required" })
    }

    const compatibleDonors = await contract.findCompatibleDonors(bloodType, organ)

    // Get detailed information for each donor
    const donorDetails = await Promise.all(
      compatibleDonors.map(async (address) => {
        try {
          const donorData = await contract.getDonor(address)
          return {
            address,
            name: donorData.name,
            bloodType: donorData.bloodType,
            organs: donorData.organs,
            isVerified: donorData.isVerified,
            isActive: donorData.isActive,
            location: donorData.location,
            registrationTime: Number(donorData.registrationTime),
          }
        } catch (error) {
          console.error(`Error getting donor ${address}:`, error)
          return null
        }
      }),
    )

    // Filter out null results
    const validDonors = donorDetails.filter((donor) => donor !== null)

    res.json({
      success: true,
      data: {
        donors: validDonors,
        count: validDonors.length,
        searchCriteria: { bloodType, organ },
      },
    })
  } catch (error) {
    console.error("Error finding compatible donors:", error)
    res.status(500).json({ error: "Failed to find compatible donors" })
  }
})

// Verify donor (admin only)
app.post("/api/donors/:address/verify", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { address } = req.params

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" })
    }

    // Execute verification transaction
    const tx = await contract.verifyDonor(address)
    console.log("✅ Donor verification transaction:", tx.hash)

    const receipt = await tx.wait()

    res.json({
      success: true,
      message: "Donor verified successfully",
      data: {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      },
    })
  } catch (error) {
    console.error("Error verifying donor:", error)
    res.status(500).json({
      error: "Failed to verify donor",
      details: error.message,
    })
  }
})

// Create match (admin only)
app.post("/api/matching/create", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { donorAddress, recipientAddress, organ } = req.body

    if (!donorAddress || !recipientAddress || !organ) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (!ethers.isAddress(donorAddress) || !ethers.isAddress(recipientAddress)) {
      return res.status(400).json({ error: "Invalid addresses" })
    }

    // Execute match creation transaction
    const tx = await contract.createMatch(donorAddress, recipientAddress, organ)
    console.log("🤝 Match creation transaction:", tx.hash)

    const receipt = await tx.wait()

    // Extract match ID from events
    let matchId = null
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log)
        if (parsedLog.name === "MatchCreated") {
          matchId = parsedLog.args.matchId
          break
        }
      } catch (error) {
        // Skip logs that can't be parsed
      }
    }

    res.json({
      success: true,
      message: "Match created successfully",
      data: {
        matchId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      },
    })
  } catch (error) {
    console.error("Error creating match:", error)
    res.status(500).json({
      error: "Failed to create match",
      details: error.message,
    })
  }
})

// Get user matches
app.get("/api/users/:address/matches", async (req, res) => {
  try {
    if (!contract) {
      return res.status(503).json({ error: "Blockchain not connected" })
    }

    const { address } = req.params

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" })
    }

    const matchIds = await contract.getUserMatches(address)

    // Get detailed information for each match
    const matchDetails = await Promise.all(
      matchIds.map(async (matchId) => {
        try {
          const matchData = await contract.getMatch(matchId)
          return {
            matchId,
            donor: matchData.donor,
            recipient: matchData.recipient,
            organ: matchData.organ,
            matchScore: Number(matchData.matchScore),
            timestamp: Number(matchData.timestamp),
            isActive: matchData.isActive,
            status: matchData.status,
          }
        } catch (error) {
          console.error(`Error getting match ${matchId}:`, error)
          return null
        }
      }),
    )

    // Filter out null results
    const validMatches = matchDetails.filter((match) => match !== null)

    res.json({
      success: true,
      data: {
        matches: validMatches,
        count: validMatches.length,
      },
    })
  } catch (error) {
    console.error("Error getting user matches:", error)
    res.status(500).json({ error: "Failed to get user matches" })
  }
})

// Get transactions for a user
app.get("/api/transactions", (req, res) => {
  try {
    const { wallet, limit = 50, offset = 0 } = req.query

    let transactions = storage.transactions

    if (wallet) {
      transactions = transactions.filter(
        (tx) =>
          tx.from?.toLowerCase() === wallet.toLowerCase() || tx.userAddress?.toLowerCase() === wallet.toLowerCase(),
      )
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp)

    // Apply pagination
    const paginatedTransactions = transactions.slice(Number(offset), Number(offset) + Number(limit))

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        total: transactions.length,
        limit: Number(limit),
        offset: Number(offset),
      },
    })
  } catch (error) {
    console.error("Error getting transactions:", error)
    res.status(500).json({ error: "Failed to get transactions" })
  }
})

// Event listener setup
if (contract) {
  // Listen for donor registration events
  contract.on("DonorRegistered", (donor, name, bloodType, timestamp, event) => {
    console.log("🎉 New donor registered:", { donor, name, bloodType })

    storage.events.push({
      type: "DonorRegistered",
      data: { donor, name, bloodType, timestamp: Number(timestamp) },
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: Date.now(),
    })
  })

  // Listen for recipient registration events
  contract.on("RecipientRegistered", (recipient, name, bloodType, organ, timestamp, event) => {
    console.log("🎉 New recipient registered:", { recipient, name, bloodType, organ })

    storage.events.push({
      type: "RecipientRegistered",
      data: { recipient, name, bloodType, organ, timestamp: Number(timestamp) },
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: Date.now(),
    })
  })

  // Listen for match creation events
  contract.on("MatchCreated", (matchId, donor, recipient, organ, matchScore, timestamp, event) => {
    console.log("🤝 New match created:", { matchId, donor, recipient, organ })

    storage.events.push({
      type: "MatchCreated",
      data: { matchId, donor, recipient, organ, matchScore: Number(matchScore), timestamp: Number(timestamp) },
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: Date.now(),
    })
  })

  console.log("👂 Event listeners set up successfully")
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error)
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 Blockchain status: http://localhost:${PORT}/api/blockchain/status`)
})

module.exports = app
