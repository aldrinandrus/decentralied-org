import { type NextRequest, NextResponse } from "next/server"

// Simulated notification service
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 })
  }

  // Simulate fetching notifications for the user
  const notifications = [
    {
      id: 1,
      type: "match_found",
      title: "New Match Found",
      message: "A compatible recipient has been identified for kidney donation",
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        recipientId: "patient_1247",
        organ: "kidney",
        compatibility: "98%",
      },
    },
    {
      id: 2,
      type: "verification_complete",
      title: "Verification Complete",
      message: "Your donor registration has been successfully verified",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      data: {},
    },
  ]

  return NextResponse.json({ notifications })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { address, type, message, data } = body

  // Simulate creating a new notification
  const notification = {
    id: Date.now(),
    type,
    title: getNotificationTitle(type),
    message,
    timestamp: new Date().toISOString(),
    read: false,
    data: data || {},
  }

  // In a real implementation, this would be stored in a database
  console.log("New notification created:", notification)

  return NextResponse.json({ success: true, notification })
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case "match_found":
      return "New Match Found"
    case "verification_complete":
      return "Verification Complete"
    case "urgent_request":
      return "Urgent Request"
    default:
      return "Notification"
  }
}
