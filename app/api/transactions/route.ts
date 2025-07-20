import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo (use proper database in production)
const transactionStore: any[] = []

// POST /api/transactions - Store transaction metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      "hash",
      "from",
      "to",
      "gasUsed",
      "gasPrice",
      "blockNumber",
      "timestamp",
      "status",
      "methodName",
      "bnbSpent",
    ]
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create transaction record
    const transaction = {
      id: Date.now().toString(),
      hash: body.hash,
      from: body.from,
      to: body.to,
      value: body.value || "0",
      gasUsed: body.gasUsed,
      gasPrice: body.gasPrice,
      blockNumber: body.blockNumber,
      timestamp: body.timestamp,
      status: body.status,
      methodName: body.methodName,
      contractAddress: body.contractAddress,
      bnbSpent: body.bnbSpent,
      events: body.events || [],
      createdAt: new Date().toISOString(),
      network: body.network || "BSC",
    }

    // Store transaction (in production, save to database)
    transactionStore.push(transaction)

    console.log(`Transaction stored: ${transaction.hash}`)
    console.log(`Method: ${transaction.methodName}`)
    console.log(`BNB Spent: ${transaction.bnbSpent}`)
    console.log(`Block: ${transaction.blockNumber}`)

    return NextResponse.json({
      success: true,
      message: "Transaction stored successfully",
      transactionId: transaction.id,
      data: transaction,
    })
  } catch (error) {
    console.error("Error storing transaction:", error)
    return NextResponse.json({ error: "Failed to store transaction" }, { status: 500 })
  }
}

// GET /api/transactions/:wallet - Fetch transactions for a wallet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Filter transactions for the wallet
    const walletTransactions = transactionStore.filter(
      (tx) => tx.from.toLowerCase() === wallet.toLowerCase() || tx.to.toLowerCase() === wallet.toLowerCase(),
    )

    // Sort by timestamp (newest first)
    const sortedTransactions = walletTransactions.sort((a, b) => b.timestamp - a.timestamp)

    // Apply pagination
    const paginatedTransactions = sortedTransactions.slice(offset, offset + limit)

    // Calculate summary statistics
    const summary = {
      totalTransactions: walletTransactions.length,
      totalBNBSpent: walletTransactions.reduce((sum, tx) => sum + Number.parseFloat(tx.bnbSpent || "0"), 0),
      successfulTransactions: walletTransactions.filter((tx) => tx.status === 1).length,
      failedTransactions: walletTransactions.filter((tx) => tx.status === 0).length,
      methodBreakdown: walletTransactions.reduce(
        (acc, tx) => {
          acc[tx.methodName] = (acc[tx.methodName] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    return NextResponse.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        summary: summary,
        pagination: {
          total: walletTransactions.length,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < walletTransactions.length,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
