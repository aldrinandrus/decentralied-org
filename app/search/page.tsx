"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Heart, MapPin, Clock, Filter, Eye, UserCheck, UserPlus } from "lucide-react"
import Link from "next/link"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const ORGANS = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea", "Skin", "Bone"]

export default function SearchPage() {
  const { isConnected, account } = useWeb3()
  const [searchFilters, setSearchFilters] = useState({
    type: "all", // "all", "donors", "recipients"
    bloodType: "",
    organ: "",
    location: "",
    verified: "all", // "all", "verified", "unverified"
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("donors")

  // Mock data for demonstration
  const mockDonors = [
    {
      id: 1,
      type: "donor",
      name: "John Smith",
      bloodType: "O+",
      organs: ["Kidney", "Liver"],
      location: "New York, NY",
      verified: true,
      lastActive: "2 hours ago",
      compatibility: "98%",
    },
    {
      id: 2,
      type: "donor",
      name: "Sarah Johnson",
      bloodType: "A+",
      organs: ["Heart", "Cornea"],
      location: "Los Angeles, CA",
      verified: true,
      lastActive: "1 day ago",
      compatibility: "85%",
    },
    {
      id: 3,
      type: "donor",
      name: "Mike Wilson",
      bloodType: "B-",
      organs: ["Kidney"],
      location: "Chicago, IL",
      verified: false,
      lastActive: "3 days ago",
      compatibility: "92%",
    },
  ]

  const mockRecipients = [
    {
      id: 4,
      type: "recipient",
      name: "Patient #1247",
      bloodType: "O+",
      organ: "Kidney",
      location: "Boston, MA",
      verified: true,
      urgency: "High",
      waitTime: "6 months",
    },
    {
      id: 5,
      type: "recipient",
      name: "Patient #1892",
      bloodType: "A+",
      organ: "Heart",
      location: "Miami, FL",
      verified: true,
      urgency: "Critical",
      waitTime: "2 months",
    },
    {
      id: 6,
      type: "recipient",
      name: "Patient #2156",
      bloodType: "B+",
      organ: "Liver",
      location: "Seattle, WA",
      verified: false,
      urgency: "Medium",
      waitTime: "12 months",
    },
  ]

  useEffect(() => {
    if (isConnected) {
      performSearch()
    }
  }, [isConnected, searchFilters])

  const performSearch = () => {
    setLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      let results = []
      
      if (searchFilters.type === "all" || searchFilters.type === "donors") {
        results = [...mockDonors]
      }
      
      if (searchFilters.type === "all" || searchFilters.type === "recipients") {
        results = [...results, ...mockRecipients]
      }

      // Apply filters
      if (searchFilters.bloodType) {
        results = results.filter(item => item.bloodType === searchFilters.bloodType)
      }

      if (searchFilters.organ) {
        if (searchFilters.type === "donors" || searchFilters.type === "all") {
          results = results.filter(item => 
            item.type === "donor" ? item.organs.includes(searchFilters.organ) : item.organ === searchFilters.organ
          )
        } else {
          results = results.filter(item => item.organ === searchFilters.organ)
        }
      }

      if (searchFilters.location) {
        results = results.filter(item => 
          item.location.toLowerCase().includes(searchFilters.location.toLowerCase())
        )
      }

      if (searchFilters.verified === "verified") {
        results = results.filter(item => item.verified === true)
      } else if (searchFilters.verified === "unverified") {
        results = results.filter(item => item.verified === false)
      }

      setSearchResults(results)
      setLoading(false)
    }, 500)
  }

  const handleFilterChange = (field: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }))
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Search className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please connect your MetaMask wallet to access the search database.</p>
            <Link href="/">
              <Button className="bg-orange-600 hover:bg-orange-700">Go Back to Home</Button>
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
              <h1 className="text-2xl font-bold text-gray-900">Search Database</h1>
              <p className="text-gray-600">Browse registered donors and recipients</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Search Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={searchFilters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="donors">Donors Only</SelectItem>
                      <SelectItem value="recipients">Recipients Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={searchFilters.bloodType} onValueChange={(value) => handleFilterChange("bloodType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any blood type</SelectItem>
                      {BLOOD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="organ">Organ</Label>
                  <Select value={searchFilters.organ} onValueChange={(value) => handleFilterChange("organ", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any organ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any organ</SelectItem>
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
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="verified">Verification</Label>
                  <Select value={searchFilters.verified} onValueChange={(value) => handleFilterChange("verified", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="unverified">Unverified Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="donors" className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Donors ({searchResults.filter(r => r.type === "donor").length})</span>
              </TabsTrigger>
              <TabsTrigger value="recipients" className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>Recipients ({searchResults.filter(r => r.type === "recipient").length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donors" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching donors...</p>
                </div>
              ) : searchResults.filter(r => r.type === "donor").length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No donors found matching your criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.filter(r => r.type === "donor").map((donor) => (
                    <Card key={donor.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{donor.name}</CardTitle>
                          <Badge variant={donor.verified ? "default" : "secondary"}>
                            {donor.verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">Blood Type: {donor.bloodType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Organs: {donor.organs.join(", ")}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{donor.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Last active: {donor.lastActive}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-green-600">
                            Compatibility: {donor.compatibility}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching recipients...</p>
                </div>
              ) : searchResults.filter(r => r.type === "recipient").length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recipients found matching your criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.filter(r => r.type === "recipient").map((recipient) => (
                    <Card key={recipient.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{recipient.name}</CardTitle>
                          <Badge variant={recipient.verified ? "default" : "secondary"}>
                            {recipient.verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">Blood Type: {recipient.bloodType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Needs: {recipient.organ}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{recipient.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Wait time: {recipient.waitTime}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={recipient.urgency === "Critical" ? "destructive" : "outline"}
                            className={recipient.urgency === "High" ? "text-orange-600" : ""}
                          >
                            {recipient.urgency} Priority
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="outline">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 