import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { ORGAN_REGISTRY_ADDRESS, MATCHING_CONTRACT_ADDRESS, ORGAN_REGISTRY_ABI, MATCHING_ABI } from "@/lib/contracts"

// Real-time blockchain monitoring service
const eventListeners: Map<string, any> = new Map()
let isMonitoring = false

// POST /api/blockchain/monitor - Start monitoring blockchain events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, addresses, events } = body

    if (action === "start" && !isMonitoring) {
      await startBlockchainMonitoring(addresses, events)
      return NextResponse.json({
        success: true,
        message: "Blockchain monitoring started",
        monitoring: true,
      })
    } else if (action === "stop") {
      await stopBlockchainMonitoring()
      return NextResponse.json({
        success: true,
        message: "Blockchain monitoring stopped",
        monitoring: false,
      })
    } else if (action === "status") {
      return NextResponse.json({
        success: true,
        monitoring: isMonitoring,
        activeListeners: eventListeners.size,
      })
    }

    return NextResponse.json({ error: "Invalid action or monitoring already active" }, { status: 400 })
  } catch (error) {
    console.error("Error in blockchain monitor:", error)
    return NextResponse.json({ error: "Failed to manage blockchain monitoring" }, { status: 500 })
  }
}

// GET /api/blockchain/monitor - Get monitoring status
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        monitoring: isMonitoring,
        activeListeners: eventListeners.size,
        listenerTypes: Array.from(eventListeners.keys()),
      },
    })
  } catch (error) {
    console.error("Error getting monitor status:", error)
    return NextResponse.json({ error: "Failed to get monitoring status" }, { status: 500 })
  }
}

async function startBlockchainMonitoring(addresses: string[] = [], events: string[] = []) {
  try {
    // Connect to BNB Chain
    const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL || "https://bsc-dataseed.binance.org/")

    const organContract = new ethers.Contract(ORGAN_REGISTRY_ADDRESS, ORGAN_REGISTRY_ABI, provider)
    const matchingContract = new ethers.Contract(MATCHING_CONTRACT_ADDRESS, MATCHING_ABI, provider)

    console.log("Starting blockchain event monitoring...")

    // Monitor donor registration events
    const donorRegisteredListener = organContract.on("DonorRegistered", async (donor, name, bloodType, event) => {
      console.log("DonorRegistered event detected:", {
        donor,
        name,
        bloodType,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      })

      await handleContractEvent({
        eventName: "DonorRegistered",
        contractAddress: ORGAN_REGISTRY_ADDRESS,
        args: { donor, name, bloodType },
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        address: event.address,
      })
    })

    // Monitor donor verification events
    const donorVerifiedListener = organContract.on("DonorVerified", async (donor, verifier, event) => {
      console.log("DonorVerified event detected:", {
        donor,
        verifier,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      })

      await handleContractEvent({
        eventName: "DonorVerified",
        contractAddress: ORGAN_REGISTRY_ADDRESS,
        args: { donor, verifier },
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        address: event.address,
      })
    })

    // Monitor recipient registration events
    const recipientAddedListener = matchingContract.on(
      "RecipientAdded",
      async (recipient, name, bloodType, organ, event) => {
        console.log("RecipientAdded event detected:", {
          recipient,
          name,
          bloodType,
          organ,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        })

        await handleContractEvent({
          eventName: "RecipientAdded",
          contractAddress: MATCHING_CONTRACT_ADDRESS,
          args: { recipient, name, bloodType, organ },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          address: event.address,
        })
      },
    )

    // Monitor match creation events
    const matchCreatedListener = matchingContract.on("MatchCreated", async (donor, recipient, timestamp, event) => {
      console.log("MatchCreated event detected:", {
        donor,
        recipient,
        timestamp,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      })

      await handleContractEvent({
        eventName: "MatchCreated",
        contractAddress: MATCHING_CONTRACT_ADDRESS,
        args: { donor, recipient, timestamp },
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        address: event.address,
      })
    })

    // Store listeners for cleanup
    eventListeners.set("DonorRegistered", donorRegisteredListener)
    eventListeners.set("DonorVerified", donorVerifiedListener)
    eventListeners.set("RecipientAdded", recipientAddedListener)
    eventListeners.set("MatchCreated", matchCreatedListener)

    isMonitoring = true
    console.log("Blockchain monitoring started successfully")
  } catch (error) {
    console.error("Error starting blockchain monitoring:", error)
    throw error
  }
}

async function stopBlockchainMonitoring() {
  try {
    // Remove all event listeners
    for (const [eventName, listener] of eventListeners) {
      if (listener && typeof listener.removeAllListeners === "function") {
        listener.removeAllListeners()
      }
      console.log(`Stopped listening for ${eventName} events`)
    }

    eventListeners.clear()
    isMonitoring = false
    console.log("Blockchain monitoring stopped")
  } catch (error) {
    console.error("Error stopping blockchain monitoring:", error)
    throw error
  }
}

async function handleContractEvent(eventData: any) {
  try {
    // Store event in backend
    const response = await fetch("/api/blockchain/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...eventData,
        timestamp: Date.now(),
        processed: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to store event: ${response.statusText}`)
    }

    console.log(`Event stored: ${eventData.eventName} - ${eventData.transactionHash}`)

    // Trigger notifications or other actions based on event type
    await triggerEventActions(eventData)
  } catch (error) {
    console.error("Error handling contract event:", error)
  }
}

async function triggerEventActions(eventData: any) {
  try {
    switch (eventData.eventName) {
      case "DonorRegistered":
        // Send welcome notification to donor
        await sendNotification(eventData.args.donor, {
          type: "registration_success",
          title: "Registration Successful",
          message: "Your donor registration has been confirmed on the blockchain",
          data: eventData,
        })
        break

      case "DonorVerified":
        // Send verification notification
        await sendNotification(eventData.args.donor, {
          type: "verification_complete",
          title: "Verification Complete",
          message: "Your donor registration has been verified by medical professionals",
          data: eventData,
        })
        break

      case "MatchCreated":
        // Send match notifications to both parties
        await sendNotification(eventData.args.donor, {
          type: "match_found",
          title: "Match Found",
          message: "A compatible recipient has been found for your donation",
          data: eventData,
        })

        await sendNotification(eventData.args.recipient, {
          type: "match_found",
          title: "Match Found",
          message: "A compatible donor has been found for your needs",
          data: eventData,
        })
        break

      default:
        console.log(`No specific action for event: ${eventData.eventName}`)
    }
  } catch (error) {
    console.error("Error triggering event actions:", error)
  }
}

async function sendNotification(address: string, notification: any) {
  try {
    // In production, this would integrate with a notification service
    console.log(`Sending notification to ${address}:`, notification)

    // Store notification in database or send via push service
    // This is a placeholder for actual notification implementation
  } catch (error) {
    console.error("Error sending notification:", error)
  }
}
