"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BlockchainService, type DonorData } from "@/lib/blockchain"
import { Heart, Shield, Clock, Users, CheckCircle, AlertCircle, Activity, UserPlus, UserCheck, LogOut, Wallet } from "lucide-react"
import Link from "next/link"
import { TransactionMonitor } from "@/components/transaction/transaction-monitor"

export default function DashboardPage() {
  const { isConnected, account, signer, disconnectWallet } = useWeb3()
  const [donorData, setDonorData] = useState<DonorData | null>(null)
  const [recipientData, setRecipientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [userType, setUserType] = useState<"donor" | "recipient" | "none" | null>(null)

  useEffect(() => {
    if (isConnected && signer && account) {
      loadDashboardData()
    }
  }, [isConnected, signer, account])

  const loadDashboardData = async () => {
    if (!signer || !account) return

    try {
      const blockchainService = new BlockchainService(signer)
      
      // Check if user is registered as donor
      const donor = await blockchainService.getDonor(account)
      if (donor) {
        setDonorData(donor)
        setUserType("donor")
      } else {
        // Check if user is registered as recipient
        const recipient = await blockchainService.getRecipient(account)
        if (recipient) {
          setRecipientData(recipient)
          setUserType("recipient")
        } else {
          setUserType("none")
        }
      }

      // Simulate loading matches and notifications
      setMatches([
        {
          id: 1,
          recipientName: "Patient #1247",
          organ: "Kidney",
          compatibility: "98%",
          urgency: "High",
          location: "New York, NY",
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          recipientName: "Patient #1892",
          organ: "Liver",
          compatibility: "85%",
          urgency: "Medium",
          location: "Los Angeles, CA",
          timestamp: new Date().toISOString(),
        },
      ])

      setNotifications([
        {
          id: 1,
          type: "match",
          message: "New potential match found for kidney donation",
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: 2,
          type: "verification",
          message: "Your donor registration has been verified",
          timestamp: new Date().toISOString(),
          read: true,
        },
      ])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setUserType("none")
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Heart className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please connect your MetaMask wallet to view your dashboard.</p>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">Go Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (userType === "none") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome to the organ donation platform</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </Badge>
                <Button onClick={handleDisconnect} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <Heart className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Not Registered</CardTitle>
              <p className="text-gray-600">
                You are not registered yet. Choose how you would like to participate in the organ donation platform.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Register as Donor */}
                <Link href="/register">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-400">
                    <CardHeader className="text-center">
                      <UserPlus className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <CardTitle>Register as Donor</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-4">
                        Register your organs for donation and help save lives. Complete KYC verification and medical screening.
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>KYC Verification</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Medical Screening</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Organ Registration</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Register as Recipient */}
                <Link href="/register-recipient">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-400">
                    <CardHeader className="text-center">
                      <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <CardTitle>Register as Recipient</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-4">
                        Register as an organ recipient to find compatible donors. Provide medical information and urgency details.
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Medical Assessment</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Urgency Evaluation</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Donor Matching</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Choose your role in the organ donation ecosystem
                </p>
                <div className="flex justify-center space-x-4">
                  <Link href="/matching">
                    <Button variant="outline">
                      <Activity className="h-4 w-4 mr-2" />
                      Browse Matches
                    </Button>
                  </Link>
                  <Link href="/faucet">
                    <Button variant="outline">
                      <Wallet className="h-4 w-4 mr-2" />
                      Get Testnet Tokens
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show donor dashboard
  if (userType === "donor" && donorData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
                <p className="text-gray-600">Welcome back, {donorData.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant={donorData.isVerified ? "default" : "secondary"} className="bg-green-600">
                  {donorData.isVerified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified Donor
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Verification
                    </>
                  )}
                </Badge>
                <Badge variant="outline">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </Badge>
                <Button onClick={handleDisconnect} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registration Status</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{donorData.isVerified ? "Verified" : "Pending"}</div>
                <p className="text-xs text-muted-foreground">
                  {donorData.isVerified ? "Ready for matching" : "Under review"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered Organs</CardTitle>
                <Heart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{donorData.organs.length}</div>
                <p className="text-xs text-muted-foreground">Available for donation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential Matches</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{matches.length}</div>
                <p className="text-xs text-muted-foreground">Compatible recipients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blood Type</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{donorData.bloodType}</div>
                <p className="text-xs text-muted-foreground">Compatibility factor</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matches">Potential Matches</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donor Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Donor Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-lg">{donorData.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Blood Type</label>
                      <p className="text-lg">{donorData.bloodType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registered Organs</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {donorData.organs.map((organ, index) => (
                          <Badge key={index} variant="outline">
                            {organ}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="text-lg">{new Date(donorData.registrationTime * 1000).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {notifications.slice(0, 3).map((notification) => (
                        <div key={notification.id} className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${notification.read ? "bg-gray-300" : "bg-green-600"}`}
                          ></div>
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Verification Status */}
              {!donorData.isVerified && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-yellow-800">
                      <AlertCircle className="h-5 w-5" />
                      <span>Verification Pending</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-yellow-700 mb-4">
                      Your donor registration is currently under review by medical professionals. This process typically
                      takes 2-3 business days.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Personal information submitted</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Medical documents uploaded</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Medical verification in progress</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="matches" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Potential Matches</CardTitle>
                  <p className="text-sm text-gray-600">
                    Compatible recipients based on your registered organs and blood type
                  </p>
                </CardHeader>
                <CardContent>
                  {matches.length > 0 ? (
                    <div className="space-y-4">
                      {matches.map((match) => (
                        <div key={match.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{match.recipientName}</h3>
                            <Badge variant={match.urgency === "High" ? "destructive" : "secondary"}>
                              {match.urgency} Priority
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Organ:</span>
                              <p className="font-medium">{match.organ}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Compatibility:</span>
                              <p className="font-medium text-green-600">{match.compatibility}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <p className="font-medium">{match.location}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <p className="font-medium">{new Date(match.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex space-x-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              Contact Hospital
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No potential matches found yet.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        We'll notify you when compatible recipients are identified.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-4 ${!notification.read ? "bg-green-50 border-green-200" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && <Badge className="bg-green-600">New</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Wallet Address</label>
                      <p className="text-lg font-mono">{account}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Status</label>
                      <p className="text-lg">{donorData.isVerified ? "Verified" : "Pending Verification"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Medical Hash</label>
                      <p className="text-lg font-mono text-sm">{donorData.medicalHash}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Blockchain Network</label>
                      <p className="text-lg">BNB Smart Chain</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Allow matching notifications</p>
                          <p className="text-sm text-gray-500">Receive alerts when potential matches are found</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Share anonymized data for research</p>
                          <p className="text-sm text-gray-500">Help improve organ matching algorithms</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <p className="text-sm text-gray-600">Your blockchain transactions and interactions</p>
                </CardHeader>
                <CardContent>
                  <TransactionMonitor />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // Show recipient dashboard (placeholder for future implementation)
  if (userType === "recipient" && recipientData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recipient Dashboard</h1>
                <p className="text-gray-600">Welcome back, {recipientData.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="default" className="bg-blue-600">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Recipient
                </Badge>
                <Badge variant="outline">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </Badge>
                <Button onClick={handleDisconnect} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Recipient Dashboard</CardTitle>
              <p className="text-gray-600">
                Your recipient dashboard is under development. Check back soon for full functionality.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-gray-600">
                  You are registered as a recipient. The full recipient dashboard will include:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium">Compatible Donors</p>
                    <p className="text-gray-500">Find matching donors</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium">Wait List Status</p>
                    <p className="text-gray-500">Track your position</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium">Urgency Updates</p>
                    <p className="text-gray-500">Priority notifications</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
