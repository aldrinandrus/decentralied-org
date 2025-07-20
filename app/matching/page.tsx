"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { useDualStorage } from "@/hooks/use-dual-storage"
import { PriorityMatchList } from "@/components/matching/priority-match-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Users, Heart, MapPin, Clock, Filter, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const ORGANS = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea", "Skin", "Bone"]
const URGENCY_LEVELS = [
  { value: "1", label: "Low - Can wait 6+ months" },
  { value: "2", label: "Medium - Can wait 3-6 months" },
  { value: "3", label: "High - Can wait 1-3 months" },
  { value: "4", label: "Critical - Need within 1 month" },
  { value: "5", label: "Emergency - Need immediately" },
]

// Mock data for demonstration
const MOCK_DONORS = [
  {
    id: 1,
    name: "Donor #1247",
    bloodType: "O+",
    organs: ["Kidney", "Liver"],
    location: "New York, NY",
    compatibility: "98%",
    lastActive: "2 hours ago",
    verified: true,
    address: "0x1234...5678",
  },
  {
    id: 2,
    name: "Donor #1583",
    bloodType: "A+",
    organs: ["Heart", "Lung"],
    location: "Los Angeles, CA",
    compatibility: "95%",
    lastActive: "1 day ago",
    verified: true,
    address: "0x2345...6789",
  },
  {
    id: 3,
    name: "Donor #2091",
    bloodType: "B-",
    organs: ["Cornea", "Skin"],
    location: "Chicago, IL",
    compatibility: "85%",
    lastActive: "3 days ago",
    verified: true,
    address: "0x3456...7890",
  },
  {
    id: 4,
    name: "Donor #3124",
    bloodType: "AB+",
    organs: ["Kidney", "Pancreas"],
    location: "Miami, FL",
    compatibility: "92%",
    lastActive: "5 hours ago",
    verified: true,
    address: "0x4567...8901",
  },
]

const MOCK_RECIPIENTS = [
  {
    id: 1,
    name: "Patient #892",
    bloodType: "A+",
    organ: "Heart",
    location: "Los Angeles, CA",
    urgency: "4",
    urgencyLabel: "Critical",
    waitTime: "18 months",
    verified: true,
    address: "0x5678...9012",
  },
  {
    id: 2,
    name: "Patient #1245",
    bloodType: "O+",
    organ: "Kidney",
    location: "New York, NY",
    urgency: "3",
    urgencyLabel: "High",
    waitTime: "12 months",
    verified: true,
    address: "0x6789...0123",
  },
  {
    id: 3,
    name: "Patient #1567",
    bloodType: "B-",
    organ: "Cornea",
    location: "Chicago, IL",
    urgency: "2",
    urgencyLabel: "Medium",
    waitTime: "8 months",
    verified: true,
    address: "0x7890...1234",
  },
  {
    id: 4,
    name: "Patient #2034",
    bloodType: "AB+",
    organ: "Kidney",
    location: "Miami, FL",
    urgency: "5",
    urgencyLabel: "Emergency",
    waitTime: "2 months",
    verified: true,
    address: "0x8901...2345",
  },
]

export default function MatchingPage() {
  const { isConnected, signer, account } = useWeb3()
  const { 
    donors, 
    recipients, 
    matches, 
    loadDonors, 
    loadRecipients, 
    loadMatches,
    findCompatibleMatches,
    loading 
  } = useDualStorage()
  const [searchFilters, setSearchFilters] = useState({
    bloodType: "",
    organ: "",
    location: "",
    urgency: "",
  })
  const [searchResults, setSearchResults] = useState<{
    donors: any[]
    recipients: any[]
    matches: any[]
  }>({
    donors: [],
    recipients: [],
    matches: []
  })
  const [activeTab, setActiveTab] = useState("search")
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (isConnected) {
      loadDonors()
      loadRecipients()
      loadMatches()
    }
  }, [isConnected, loadDonors, loadRecipients, loadMatches])

  const handleSearch = async () => {
    if (!searchFilters.bloodType || !searchFilters.organ) {
      return
    }

    setHasSearched(true)

    try {
      // Filter donors
      const filteredDonors = donors.filter((donor) => {
        const bloodMatch = isBloodCompatible(donor.bloodType, searchFilters.bloodType)
        const organMatch = donor.organs.includes(searchFilters.organ)
        const locationMatch = !searchFilters.location || 
          donor.location.toLowerCase().includes(searchFilters.location.toLowerCase())
        
        return bloodMatch && organMatch && locationMatch && donor.isActive && donor.isVerified
      })

      // Filter recipients
      const filteredRecipients = recipients.filter((recipient) => {
        const bloodMatch = recipient.bloodType === searchFilters.bloodType
        const organMatch = recipient.organ === searchFilters.organ
        const locationMatch = !searchFilters.location || 
          recipient.location.toLowerCase().includes(searchFilters.location.toLowerCase())
        const urgencyMatch = !searchFilters.urgency || recipient.urgency === searchFilters.urgency
        
        return bloodMatch && organMatch && locationMatch && urgencyMatch && recipient.isActive
      })

      // Find compatible matches
      const compatibleMatches = await findCompatibleMatches(searchFilters.bloodType, searchFilters.organ)

      setSearchResults({
        donors: filteredDonors,
        recipients: filteredRecipients,
        matches: compatibleMatches
      })

    } catch (error) {
      console.error("Search error:", error)
    }
  }

  const clearFilters = () => {
    setSearchFilters({
      bloodType: "",
      organ: "",
      location: "",
      urgency: "",
    })
    setSearchResults({
      donors: [],
      recipients: [],
      matches: []
    })
    setHasSearched(false)
  }

  const getCompatibilityScore = (donor: any, recipient: any) => {
    let score = 0
    
    // Blood type compatibility (exact match = 100, compatible = 80, incompatible = 0)
    if (donor.bloodType === recipient.bloodType) {
      score += 100
    } else if (isBloodCompatible(donor.bloodType, recipient.bloodType)) {
      score += 80
    } else {
      return 0 // Incompatible
    }
    
    // Organ match (100 points)
    if (donor.organs.includes(recipient.organ)) {
      score += 100
    } else {
      return 0 // No organ match
    }
    
    // Location proximity (0-20 points)
    if (donor.location === recipient.location) {
      score += 20
    } else if (donor.location.split(',')[1]?.trim() === recipient.location.split(',')[1]?.trim()) {
      score += 10
    }
    
    // Urgency bonus (0-30 points)
    const urgencyBonus = parseInt(recipient.urgency) * 6
    score += urgencyBonus
    
    return Math.min(score, 100)
  }

  const isBloodCompatible = (donorBlood: string, recipientBlood: string) => {
    // Universal donor (O-) can donate to anyone
    if (donorBlood === "O-") return true
    
    // Universal recipient (AB+) can receive from anyone
    if (recipientBlood === "AB+") return true
    
    // Same blood type
    if (donorBlood === recipientBlood) return true
    
    // O+ can donate to A+, B+, AB+
    if (donorBlood === "O+" && ["A+", "B+", "AB+"].includes(recipientBlood)) return true
    
    // A+ can donate to AB+
    if (donorBlood === "A+" && recipientBlood === "AB+") return true
    
    // B+ can donate to AB+
    if (donorBlood === "B+" && recipientBlood === "AB+") return true
    
    return false
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Search className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please connect your MetaMask wallet to access the matching system.</p>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">Go Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Matching System</h1>
              <p className="text-gray-600">Find compatible donors and recipients</p>
            </div>
            <Badge variant="outline">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="search">Search Matches</TabsTrigger>
            <TabsTrigger value="donors">Available Donors</TabsTrigger>
            <TabsTrigger value="recipients">Waiting Recipients</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Search Filters</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Enter blood type and organ to find compatible matches
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bloodType">Blood Type *</Label>
                    <Select
                      value={searchFilters.bloodType}
                      onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, bloodType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="organ">Organ *</Label>
                    <Select
                      value={searchFilters.organ}
                      onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, organ: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organ" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORGANS.map((organ) => (
                          <SelectItem key={organ} value={organ}>
                            {organ}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={searchFilters.location}
                      onChange={(e) => setSearchFilters((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <Select
                      value={searchFilters.urgency}
                      onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, urgency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        {URGENCY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={handleSearch} 
                    disabled={loading || !searchFilters.bloodType || !searchFilters.organ} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Searching..." : "Search Matches"}
                    <Search className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {(!searchFilters.bloodType || !searchFilters.organ) && (
                  <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Please select both blood type and organ to search for compatible matches.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Search Results */}
            {hasSearched && (
              <div className="space-y-6">
                {/* Compatibility Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Compatibility Results</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Found {searchResults.donors.length} compatible donors, {searchResults.recipients.length} matching recipients, and {searchResults.matches.length} active matches
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Heart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">{searchResults.donors.length}</div>
                        <div className="text-sm text-gray-600">Compatible Donors</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{searchResults.recipients.length}</div>
                        <div className="text-sm text-gray-600">Matching Recipients</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-600">{searchResults.matches.length}</div>
                        <div className="text-sm text-gray-600">Active Matches</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Matches */}
                {hasSearched && searchResults.matches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                        <span>Priority Matches</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Active matches for {searchFilters.organ} with {searchFilters.bloodType} blood type, sorted by priority
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.matches.slice(0, 5).map((match, index) => (
                          <div key={match.id} className="border rounded-lg p-3 bg-purple-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-purple-600">#{index + 1}</Badge>
                                <span className="font-medium">{match.donorName} → {match.recipientName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">Priority: {match.priority}</Badge>
                                <Badge variant="outline">Score: {match.matchScore}%</Badge>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {match.organ} • {match.bloodType} • Status: {match.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compatible Donors */}
                {searchResults.donors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Heart className="h-5 w-5 text-green-600" />
                        <span>Compatible Donors</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Donors with {searchFilters.bloodType} blood type and {searchFilters.organ} available
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {searchResults.donors.map((donor) => (
                          <div key={donor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                <h3 className="font-semibold">{donor.name}</h3>
                                {donor.verified && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Verified • Priority: {donor.priority}
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="default" className="bg-green-600">
                                Donor
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Blood Type:</span>
                                <p className="font-medium">{donor.bloodType}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Available Organs:</span>
                                <p className="font-medium">{donor.organs.join(", ")}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Location:</span>
                                <p className="font-medium flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {donor.location}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Compatibility:</span>
                                <p className="font-medium text-green-600">{donor.matchScore || 'N/A'}%</p>
                              </div>
                            </div>

                            <div className="mt-4 flex space-x-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                View Profile
                              </Button>
                              <Button size="sm" variant="outline">
                                Contact Hospital
                              </Button>
                              <Button size="sm" variant="outline">
                                Request Match
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Matching Recipients */}
                {searchResults.recipients.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span>Matching Recipients</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Recipients needing {searchFilters.organ} with {searchFilters.bloodType} blood type
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {searchResults.recipients.map((recipient) => (
                          <div key={recipient.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                <h3 className="font-semibold">{recipient.name}</h3>
                                {recipient.verified && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    Verified • Priority: {recipient.priority}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={recipient.urgencyLabel === "Emergency" || recipient.urgencyLabel === "Critical" ? "destructive" : "secondary"}>
                                  {recipient.urgencyLabel} Priority
                                </Badge>
                                <Badge variant="secondary">
                                  Recipient
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Blood Type:</span>
                                <p className="font-medium">{recipient.bloodType}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Needed Organ:</span>
                                <p className="font-medium">{recipient.organ}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Location:</span>
                                <p className="font-medium flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {recipient.location}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Wait Time:</span>
                                <p className="font-medium flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {recipient.waitTime}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex space-x-2">
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                View Medical Profile
                              </Button>
                              <Button size="sm" variant="outline">
                                Contact Hospital
                              </Button>
                              <Button size="sm" variant="outline">
                                Offer Match
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* No Results */}
                {searchResults.donors.length === 0 && searchResults.recipients.length === 0 && searchResults.matches.length === 0 && hasSearched && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span>No Compatible Matches Found</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          No donors or recipients found matching your criteria. Try adjusting your search filters or check back later.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="donors" className="space-y-6">
            <PriorityMatchList userType="donor" maxItems={10} />
          </TabsContent>

          <TabsContent value="recipients" className="space-y-6">
            <PriorityMatchList userType="recipient" maxItems={10} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}