"use client"

import { useState, useEffect } from "react"
import { useDualStorage } from "@/hooks/use-dual-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Heart, 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  Filter, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from "lucide-react"
import type { MatchData } from "@/lib/dual-storage-service"

interface PriorityMatchListProps {
  showFilters?: boolean
  maxItems?: number
  userType?: 'donor' | 'recipient' | 'all'
}

export function PriorityMatchList({ 
  showFilters = true, 
  maxItems = 20,
  userType = 'all'
}: PriorityMatchListProps) {
  const { matches, loadMatches, updateMatchStatus, loading } = useDualStorage()
  const { toast } = useToast()
  const [filteredMatches, setFilteredMatches] = useState<MatchData[]>([])
  const [filters, setFilters] = useState({
    bloodType: '',
    organ: '',
    status: '',
    urgency: '',
  })

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  useEffect(() => {
    applyFilters()
  }, [matches, filters])

  const applyFilters = () => {
    let filtered = [...matches]

    if (filters.bloodType) {
      filtered = filtered.filter(match => match.bloodType === filters.bloodType)
    }

    if (filters.organ) {
      filtered = filtered.filter(match => match.organ === filters.organ)
    }

    if (filters.status) {
      filtered = filtered.filter(match => match.status === filters.status)
    }

    // Limit results
    filtered = filtered.slice(0, maxItems)

    setFilteredMatches(filtered)
  }

  const handleRefresh = async () => {
    await loadMatches()
    toast({
      title: "Matches Refreshed",
      description: "Match list has been updated with latest data",
    })
  }

  const handleStatusUpdate = async (matchId: string, newStatus: MatchData['status']) => {
    await updateMatchStatus(matchId, newStatus)
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 250) return 'text-red-600 bg-red-50 border-red-200'
    if (priority >= 200) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (priority >= 150) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 250) return 'Critical'
    if (priority >= 200) return 'High'
    if (priority >= 150) return 'Medium'
    return 'Standard'
  }

  const getUrgencyBadge = (priority: number) => {
    const urgency = Math.floor((priority - 100) / 30)
    const urgencyLabels = ['Low', 'Medium', 'High', 'Critical', 'Emergency']
    return urgencyLabels[Math.min(urgency, 4)] || 'Standard'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Priority Match List</h2>
          <p className="text-gray-600">Matches sorted by priority and compatibility score</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Matches</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select value={filters.bloodType} onValueChange={(value) => setFilters(prev => ({ ...prev, bloodType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any blood type</SelectItem>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="organ">Organ</Label>
                <Select value={filters.organ} onValueChange={(value) => setFilters(prev => ({ ...prev, organ: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any organ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any organ</SelectItem>
                    {['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea'].map((organ) => (
                      <SelectItem key={organ} value={organ}>{organ}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => setFilters({ bloodType: '', organ: '', status: '', urgency: '' })}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{filteredMatches.length}</div>
                <div className="text-sm text-gray-600">Total Matches</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredMatches.filter(m => m.priority >= 250).length}
                </div>
                <div className="text-sm text-gray-600">Critical Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredMatches.length > 0 
                    ? Math.round(filteredMatches.reduce((sum, m) => sum + m.matchScore, 0) / filteredMatches.length)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Match Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredMatches.filter(m => m.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending Matches</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading priority matches...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches found with current filters.</p>
              <Button 
                onClick={() => setFilters({ bloodType: '', organ: '', status: '', urgency: '' })}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map((match, index) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                    <div>
                      <CardTitle className="text-lg">{match.donorName} → {match.recipientName}</CardTitle>
                      <p className="text-sm text-gray-600">{match.organ} Transplant Match</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(match.priority)}>
                      <Star className="h-3 w-3 mr-1" />
                      {getPriorityLabel(match.priority)} Priority
                    </Badge>
                    <Badge variant={match.status === 'pending' ? 'secondary' : 
                                   match.status === 'approved' ? 'default' : 
                                   match.status === 'completed' ? 'default' : 'destructive'}>
                      {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Blood Type:</span>
                    <p className="font-medium flex items-center">
                      <Heart className="h-4 w-4 mr-1 text-red-500" />
                      {match.bloodType}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Match Score:</span>
                    <p className="font-medium text-green-600">{match.matchScore}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Priority Score:</span>
                    <p className="font-medium">{match.priority}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Urgency:</span>
                    <p className="font-medium">{getUrgencyBadge(match.priority)}</p>
                  </div>
                </div>

                {/* Compatibility Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <div className={`flex items-center space-x-1 text-sm ${match.compatibility.bloodType ? 'text-green-600' : 'text-red-600'}`}>
                    {match.compatibility.bloodType ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    <span>Blood Type</span>
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${match.compatibility.organ ? 'text-green-600' : 'text-red-600'}`}>
                    {match.compatibility.organ ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    <span>Organ</span>
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${match.compatibility.location ? 'text-green-600' : 'text-gray-500'}`}>
                    {match.compatibility.location ? <CheckCircle className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    <span>Location</span>
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${match.compatibility.age ? 'text-green-600' : 'text-gray-500'}`}>
                    {match.compatibility.age ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    <span>Age</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {match.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate(match.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve Match
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusUpdate(match.id, 'cancelled')}
                    >
                      Cancel Match
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                )}

                {match.status === 'approved' && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate(match.id, 'completed')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Mark Completed
                    </Button>
                    <Button size="sm" variant="outline">
                      Contact Hospital
                    </Button>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  Created: {new Date(match.createdAt).toLocaleDateString()} • 
                  Last Updated: {new Date(match.lastUpdated).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredMatches.length === maxItems && (
        <div className="text-center">
          <Button variant="outline" onClick={() => loadMatches()}>
            Load More Matches
          </Button>
        </div>
      )}
    </div>
  )
}