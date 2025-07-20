import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo (use proper database in production)
const eventStore: any[] = []

// POST /api/blockchain/events - Store blockchain events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const event = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
    }

    eventStore.push(event)

    console.log(`Blockchain event stored: ${event.eventName} - ${event.transactionHash}`)

    return NextResponse.json({
      success: true,
      message: "Event stored successfully",
      eventId: event.id,
    })
  } catch (error) {
    console.error("Error storing blockchain event:", error)
    return NextResponse.json({ error: "Failed to store event" }, { status: 500 })
  }
}

// GET /api/blockchain/events - Get blockchain events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const eventName = searchParams.get("eventName")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredEvents = eventStore

    // Filter by address if provided
    if (address) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.args &&
          Object.values(event.args).some(
            (value: any) => typeof value === "string" && value.toLowerCase() === address.toLowerCase(),
          ),
      )
    }

    // Filter by event name if provided
    if (eventName) {
      filteredEvents = filteredEvents.filter((event) => event.eventName === eventName)
    }

    // Sort by timestamp (newest first)
    const sortedEvents = filteredEvents.sort((a, b) => b.timestamp - a.timestamp)

    // Apply pagination
    const paginatedEvents = sortedEvents.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        events: paginatedEvents,
        pagination: {
          total: filteredEvents.length,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < filteredEvents.length,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching blockchain events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
