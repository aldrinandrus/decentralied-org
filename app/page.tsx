"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Shield, Users, Zap, Wallet, UserPlus, Search, Activity, UserCheck, Coins, Target, Loader2, Cloud, TestTube } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { isConnected, account, connectWallet, chainId, isConnecting } = useWeb3()
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalRecipients: 0,
    successfulMatches: 0,
    livesImpacted: 0,
  })

  useEffect(() => {
    // Simulate fetching stats from blockchain
    setStats({
      totalDonors: 1247,
      totalRecipients: 892,
      successfulMatches: 156,
      livesImpacted: 312,
    })
  }, [])

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error("Connection error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">DecentralizedOrganMatch</span>
            </div>
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Wallet className="h-3 w-3 mr-1" />
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </Badge>
                  <Link href="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-green-600 hover:bg-green-700">Register as Donor</Button>
                  </Link>
                </div>
              ) : (
                <Button 
                  onClick={connectWallet} 
                  disabled={isConnecting}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-2" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
            🚀 Blockchain-Powered Healthcare Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Saving Lives Through
            <span className="text-green-600 block">Decentralized Innovation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect donors and recipients through secure blockchain technology. Transparent, tamper-proof medical
            records with automated matching powered by smart contracts on BNB Smart Chain.
          </p>

          {!isConnected ? (
            <div className="mb-8">
              <Button 
                size="lg" 
                onClick={handleConnectWallet} 
                disabled={isConnecting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Wallet className="mr-2 h-5 w-5" />
                )}
                {isConnecting ? "Connecting to MetaMask..." : "Connect MetaMask to BNB Smart Chain"}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Make sure you have MetaMask installed and BNB Smart Chain configured
              </p>
              {isConnecting && (
                <p className="text-sm text-blue-600 mt-2">
                  ⚠️ If MetaMask doesn't pop up, check for pending connection requests in MetaMask
                </p>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Wallet className="h-3 w-3 mr-1" />
                  Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                </Badge>
                {chainId === 56 || chainId === 97 ? (
                  <Badge className="bg-green-600">{chainId === 56 ? "BSC Mainnet" : "BSC Testnet"}</Badge>
                ) : (
                  <Badge variant="destructive">Wrong Network</Badge>
                )}
              </div>
            </div>
          )}

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalDonors.toLocaleString()}</div>
              <div className="text-gray-600">Registered Donors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalRecipients.toLocaleString()}</div>
              <div className="text-gray-600">Active Recipients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.successfulMatches}</div>
              <div className="text-gray-600">Successful Matches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.livesImpacted}</div>
              <div className="text-gray-600">Lives Impacted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive blockchain solution for secure organ donation matching
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Tamper-Proof Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Immutable blockchain storage ensures medical data integrity and prevents fraud.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Smart Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI-powered algorithms automatically match compatible donors and recipients.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Multi-Stakeholder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Designed for hospitals, donors, and recipients with role-based access.</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Activity className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Real-Time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Instant notifications for matches and status updates via blockchain events.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      {isConnected && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <p className="text-xl text-gray-600">Get started with the platform</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Link href="/register">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <UserPlus className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <CardTitle>Register as Donor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Complete KYC verification and register your organs for donation.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/register-recipient">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <CardTitle>Register as Recipient</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Register as an organ recipient and find compatible donors.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/matching">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <CardTitle>Organ Matching</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Find compatible organ matches between donors and recipients.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Activity className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <CardTitle>View Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Monitor your registration status and view match notifications.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/faucet">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Coins className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <CardTitle>Get Testnet Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Get BNB testnet tokens for testing transactions and gas fees.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/search">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Search className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <CardTitle>Search Database</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Search through registered donors and recipients database.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/greenfield">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Cloud className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <CardTitle>Greenfield Storage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Store medical documents securely on BNB Greenfield.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/test-greenfield">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <TestTube className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <CardTitle>Test Greenfield</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">
                      Test Greenfield integration and functionality.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-green-600" />
                <span className="text-lg font-bold">DecentralizedOrganMatch</span>
              </div>
              <p className="text-gray-400">Revolutionizing organ donation through blockchain technology.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/register" className="hover:text-white">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/matching" className="hover:text-white">
                    Find Matches
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Smart Contracts
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DecentralizedOrganMatch. Saving lives through blockchain innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
