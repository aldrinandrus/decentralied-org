import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo (use proper database in production)
const transactionStore: any[] = []

// GET /api/transactions/[hash] - Get specific transaction details
export async function GET(request: NextRequest, { params }: { params: { hash: string } }) {
  try {
    const hash = params.hash

    if (!hash) {
      return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 })
    }

    // Find transaction by hash
    const transaction = transactionStore.find((tx) => tx.hash.toLowerCase() === hash.toLowerCase())

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Add additional computed fields
    const enhancedTransaction = {
      ...transaction,
      confirmations: transaction.blockNumber ? Math.max(0, Date.now() - transaction.timestamp) / 1000 : 0,
      age: Date.now() - transaction.timestamp,
      gasEfficiency: transaction.gasUsed
        ? (Number.parseFloat(transaction.bnbSpent) / Number.parseFloat(transaction.gasUsed)) * 1e18
        : 0,
    }

    return NextResponse.json({
      success: true,
      data: enhancedTransaction,
    })
  } catch (error) {
    console.error("Error fetching transaction details:", error)
    return NextResponse.json({ error: "Failed to fetch transaction details" }, { status: 500 })
  }
}

// PUT /api/transactions/[hash] - Update transaction status
export async function PUT(request: NextRequest, { params }: { params: { hash: string } }) {
  try {
    const hash = params.hash
    const body = await request.json()

    if (!hash) {
      return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 })
    }

    // Find and update transaction
    const transactionIndex = transactionStore.findIndex((tx) => tx.hash.toLowerCase() === hash.toLowerCase())

    if (transactionIndex === -1) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Update transaction
    transactionStore[transactionIndex] = {
      ...transactionStore[transactionIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      data: transactionStore[transactionIndex],
    })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
