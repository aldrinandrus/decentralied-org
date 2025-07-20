"use client"

import { GreenfieldStorage } from "@/components/greenfield/greenfield-storage"
import { NetworkSwitcher } from "@/components/network/network-switcher"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Shield, Database, Globe, Zap, DollarSign, FileText, Target } from "lucide-react"
import Link from "next/link"

export default function GreenfieldPage() {
  const { isConnected, account } = useWeb3()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Cloud className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                BNB Greenfield Storage
              </h1>
              <p className="text-xl text-gray-600">
                Connect your wallet to access secure, decentralized document storage
              </p>
            </div>
            
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <h3 className="font-medium text-yellow-800 mb-2">Wallet Not Connected</h3>
                <p className="text-yellow-600 mb-4">
                  Please connect your MetaMask wallet to use Greenfield storage features.
                </p>
                <Link href="/">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Go to Homepage
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Greenfield Storage</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </Badge>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Network Status */}
          <div className="mb-8">
            <NetworkSwitcher />
          </div>

          {/* Greenfield Storage Component */}
          <GreenfieldStorage />

          {/* Additional Information */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>How Greenfield Works</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Upload Documents</h4>
                      <p className="text-sm text-gray-600">
                        Medical records and documents are encrypted and uploaded to the Greenfield network
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Distributed Storage</h4>
                      <p className="text-sm text-gray-600">
                        Data is distributed across multiple storage providers for redundancy and security
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Secure Access</h4>
                      <p className="text-sm text-gray-600">
                        Only authorized users can access documents through blockchain-based permissions
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Benefits for Organ Donation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Global Accessibility</h4>
                      <p className="text-sm text-gray-600">
                        Medical records accessible worldwide for organ matching
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="h-4 w-4 text-green-600" />
                    <div>
                      <h4 className="font-medium">Instant Verification</h4>
                      <p className="text-sm text-gray-600">
                        Real-time verification of medical documents and donor consent
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Cost Effective</h4>
                      <p className="text-sm text-gray-600">
                        Reduced costs compared to traditional medical record storage
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integration Info */}
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Integration with Organ Donation Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-medium text-blue-800">Medical Records</h4>
                  <p className="text-sm text-blue-700">
                    Store donor and recipient medical records securely
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-medium text-green-800">Organ Matching</h4>
                  <p className="text-sm text-green-700">
                    Match compatible donors and recipients using stored data
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-medium text-purple-800">Privacy & Security</h4>
                  <p className="text-sm text-purple-700">
                    HIPAA-compliant storage with blockchain-based access control
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 