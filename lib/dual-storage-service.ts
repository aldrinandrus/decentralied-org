import { greenfieldService, type MedicalRecord, type DonorDocument, type RecipientDocument } from './greenfield-service'

export interface DonorData {
  id: string
  name: string
  bloodType: string
  organs: string[]
  age: number
  location: string
  emergencyContact: string
  emergencyPhone: string
  medicalHistory: string
  walletAddress: string
  isActive: boolean
  isVerified: boolean
  registrationDate: string
  lastUpdated: string
  priority: number
  medicalDocuments?: DonorDocument[]
}

export interface RecipientData {
  id: string
  name: string
  bloodType: string
  organ: string
  urgency: number
  age: number
  location: string
  medicalCondition: string
  emergencyContact: string
  emergencyPhone: string
  walletAddress: string
  isActive: boolean
  registrationDate: string
  waitingSince: string
  lastUpdated: string
  priority: number
  medicalDocuments?: RecipientDocument[]
}

export interface MatchData {
  id: string
  donorId: string
  recipientId: string
  donorName: string
  recipientName: string
  organ: string
  bloodType: string
  matchScore: number
  compatibility: {
    bloodType: boolean
    organ: boolean
    location: boolean
    age: boolean
  }
  priority: number
  status: 'pending' | 'approved' | 'completed' | 'cancelled'
  createdAt: string
  lastUpdated: string
}

class DualStorageService {
  private readonly BACKEND_URL = 'http://localhost:3001'
  
  /**
   * Store donor data in both localhost and Greenfield
   */
  async storeDonor(donorData: Omit<DonorData, 'id' | 'registrationDate' | 'lastUpdated' | 'priority'>): Promise<DonorData> {
    const donor: DonorData = {
      ...donorData,
      id: `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registrationDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      priority: this.calculateDonorPriority(donorData),
    }

    try {
      // Store in localhost backend
      const localhostResponse = await fetch(`${this.BACKEND_URL}/api/donors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donor),
      })

      if (!localhostResponse.ok) {
        throw new Error('Failed to store donor in localhost')
      }

      // Store in Greenfield
      if (greenfieldService.isReady()) {
        const medicalRecord: MedicalRecord = {
          id: donor.id,
          patientId: donor.walletAddress,
          bloodType: donor.bloodType,
          organType: donor.organs.join(','),
          medicalHistory: donor.medicalHistory,
          testResults: 'Pending medical evaluation',
          doctorNotes: 'Initial registration',
          timestamp: Date.now(),
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        }

        await greenfieldService.storeMedicalRecord(medicalRecord)
        console.log('✅ Donor data stored in Greenfield')
      }

      // Trigger matching after storing donor
      await this.findAndCreateMatches(donor)

      return donor
    } catch (error) {
      console.error('Error storing donor:', error)
      throw error
    }
  }

  /**
   * Store recipient data in both localhost and Greenfield
   */
  async storeRecipient(recipientData: Omit<RecipientData, 'id' | 'registrationDate' | 'waitingSince' | 'lastUpdated' | 'priority'>): Promise<RecipientData> {
    const recipient: RecipientData = {
      ...recipientData,
      id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registrationDate: new Date().toISOString(),
      waitingSince: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      priority: this.calculateRecipientPriority(recipientData),
    }

    try {
      // Store in localhost backend
      const localhostResponse = await fetch(`${this.BACKEND_URL}/api/recipients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipient),
      })

      if (!localhostResponse.ok) {
        throw new Error('Failed to store recipient in localhost')
      }

      // Store in Greenfield
      if (greenfieldService.isReady()) {
        const medicalRecord: MedicalRecord = {
          id: recipient.id,
          patientId: recipient.walletAddress,
          bloodType: recipient.bloodType,
          organType: recipient.organ,
          medicalHistory: recipient.medicalCondition,
          testResults: 'Pending medical evaluation',
          doctorNotes: `Urgency level: ${recipient.urgency}`,
          timestamp: Date.now(),
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        }

        await greenfieldService.storeMedicalRecord(medicalRecord)
        console.log('✅ Recipient data stored in Greenfield')
      }

      // Trigger matching after storing recipient
      await this.findAndCreateMatches(null, recipient)

      return recipient
    } catch (error) {
      console.error('Error storing recipient:', error)
      throw error
    }
  }

  /**
   * Calculate donor priority based on various factors
   */
  private calculateDonorPriority(donor: any): number {
    let priority = 100 // Base priority

    // Age factor (younger donors get higher priority)
    if (donor.age <= 30) priority += 20
    else if (donor.age <= 45) priority += 10
    else if (donor.age <= 60) priority += 5

    // Number of organs (more organs = higher priority)
    priority += donor.organs.length * 5

    // Medical history factor
    if (!donor.medicalHistory || donor.medicalHistory.toLowerCase().includes('healthy')) {
      priority += 15
    }

    return Math.min(priority, 200) // Cap at 200
  }

  /**
   * Calculate recipient priority based on urgency and waiting time
   */
  private calculateRecipientPriority(recipient: any): number {
    let priority = 100 // Base priority

    // Urgency factor (most important)
    priority += recipient.urgency * 30

    // Age factor (younger recipients get higher priority)
    if (recipient.age <= 18) priority += 25 // Children get highest priority
    else if (recipient.age <= 35) priority += 15
    else if (recipient.age <= 50) priority += 10

    return Math.min(priority, 300) // Cap at 300
  }

  /**
   * Find compatible matches and create them
   */
  private async findAndCreateMatches(donor?: DonorData | null, recipient?: RecipientData | null): Promise<void> {
    try {
      if (donor) {
        // Find compatible recipients for this donor
        const recipients = await this.getRecipients({
          bloodType: donor.bloodType,
          organs: donor.organs,
        })

        for (const compatibleRecipient of recipients) {
          if (this.isCompatible(donor, compatibleRecipient)) {
            await this.createMatch(donor, compatibleRecipient)
          }
        }
      }

      if (recipient) {
        // Find compatible donors for this recipient
        const donors = await this.getDonors({
          bloodType: recipient.bloodType,
          organ: recipient.organ,
        })

        for (const compatibleDonor of donors) {
          if (this.isCompatible(compatibleDonor, recipient)) {
            await this.createMatch(compatibleDonor, recipient)
          }
        }
      }
    } catch (error) {
      console.error('Error finding matches:', error)
    }
  }

  /**
   * Check if donor and recipient are compatible
   */
  private isCompatible(donor: DonorData, recipient: RecipientData): boolean {
    // Blood type compatibility
    const bloodCompatible = this.isBloodTypeCompatible(donor.bloodType, recipient.bloodType)
    
    // Organ availability
    const organCompatible = donor.organs.includes(recipient.organ)
    
    // Both must be active
    const bothActive = donor.isActive && recipient.isActive
    
    // Donor must be verified
    const donorVerified = donor.isVerified

    return bloodCompatible && organCompatible && bothActive && donorVerified
  }

  /**
   * Blood type compatibility checker
   */
  private isBloodTypeCompatible(donorType: string, recipientType: string): boolean {
    const compatibility: Record<string, string[]> = {
      'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      'O+': ['O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'A+', 'AB-', 'AB+'],
      'A+': ['A+', 'AB+'],
      'B-': ['B-', 'B+', 'AB-', 'AB+'],
      'B+': ['B+', 'AB+'],
      'AB-': ['AB-', 'AB+'],
      'AB+': ['AB+']
    }
    
    return compatibility[donorType]?.includes(recipientType) || false
  }

  /**
   * Create a match between donor and recipient
   */
  private async createMatch(donor: DonorData, recipient: RecipientData): Promise<MatchData> {
    const matchScore = this.calculateMatchScore(donor, recipient)
    
    const match: MatchData = {
      id: `match_${donor.id}_${recipient.id}_${Date.now()}`,
      donorId: donor.id,
      recipientId: recipient.id,
      donorName: donor.name,
      recipientName: recipient.name,
      organ: recipient.organ,
      bloodType: recipient.bloodType,
      matchScore,
      compatibility: {
        bloodType: this.isBloodTypeCompatible(donor.bloodType, recipient.bloodType),
        organ: donor.organs.includes(recipient.organ),
        location: donor.location === recipient.location,
        age: Math.abs(donor.age - recipient.age) <= 20,
      },
      priority: recipient.priority + matchScore,
      status: 'pending',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }

    try {
      // Store match in localhost
      await fetch(`${this.BACKEND_URL}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(match),
      })

      // Store match in Greenfield
      if (greenfieldService.isReady()) {
        await greenfieldService.storeOrganMatch({
          matchId: match.id,
          donorId: donor.id,
          recipientId: recipient.id,
          organType: recipient.organ,
          bloodTypeCompatibility: match.compatibility.bloodType,
          matchScore: match.matchScore,
          medicalCompatibility: `Score: ${match.matchScore}/100`,
          timestamp: Date.now(),
          status: 'pending',
        })
      }

      console.log('✅ Match created:', match.id)
      return match
    } catch (error) {
      console.error('Error creating match:', error)
      throw error
    }
  }

  /**
   * Calculate match score between donor and recipient
   */
  private calculateMatchScore(donor: DonorData, recipient: RecipientData): number {
    let score = 0

    // Blood type compatibility (40 points)
    if (donor.bloodType === recipient.bloodType) {
      score += 40
    } else if (this.isBloodTypeCompatible(donor.bloodType, recipient.bloodType)) {
      score += 30
    }

    // Organ availability (30 points)
    if (donor.organs.includes(recipient.organ)) {
      score += 30
    }

    // Location proximity (15 points)
    if (donor.location === recipient.location) {
      score += 15
    } else if (donor.location.split(',')[1]?.trim() === recipient.location.split(',')[1]?.trim()) {
      score += 8
    }

    // Age compatibility (10 points)
    const ageDiff = Math.abs(donor.age - recipient.age)
    if (ageDiff <= 10) score += 10
    else if (ageDiff <= 20) score += 5

    // Urgency factor (5 points)
    score += recipient.urgency

    return Math.min(score, 100)
  }

  /**
   * Get all donors with optional filtering
   */
  async getDonors(filters?: { bloodType?: string; organs?: string[]; organ?: string }): Promise<DonorData[]> {
    try {
      let url = `${this.BACKEND_URL}/api/donors`
      const params = new URLSearchParams()

      if (filters?.bloodType) params.append('bloodType', filters.bloodType)
      if (filters?.organ) params.append('organ', filters.organ)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch donors')
      }

      const data = await response.json()
      return data.donors || []
    } catch (error) {
      console.error('Error fetching donors:', error)
      return []
    }
  }

  /**
   * Get all recipients with optional filtering
   */
  async getRecipients(filters?: { bloodType?: string; organs?: string[]; organ?: string }): Promise<RecipientData[]> {
    try {
      let url = `${this.BACKEND_URL}/api/recipients`
      const params = new URLSearchParams()

      if (filters?.bloodType) params.append('bloodType', filters.bloodType)
      if (filters?.organs) {
        filters.organs.forEach(organ => params.append('organ', organ))
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch recipients')
      }

      const data = await response.json()
      return data.recipients || []
    } catch (error) {
      console.error('Error fetching recipients:', error)
      return []
    }
  }

  /**
   * Get all matches sorted by priority
   */
  async getMatches(filters?: { 
    bloodType?: string
    organ?: string
    status?: string
    urgency?: number
  }): Promise<MatchData[]> {
    try {
      let url = `${this.BACKEND_URL}/api/matches`
      const params = new URLSearchParams()

      if (filters?.bloodType) params.append('bloodType', filters.bloodType)
      if (filters?.organ) params.append('organ', filters.organ)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.urgency) params.append('urgency', filters.urgency.toString())

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }

      const data = await response.json()
      const matches = data.matches || []

      // Sort by priority (highest first)
      return matches.sort((a: MatchData, b: MatchData) => b.priority - a.priority)
    } catch (error) {
      console.error('Error fetching matches:', error)
      return []
    }
  }

  /**
   * Get matches for a specific user
   */
  async getUserMatches(userId: string): Promise<MatchData[]> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/matches?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user matches')
      }

      const data = await response.json()
      const matches = data.matches || []

      // Sort by priority (highest first)
      return matches.sort((a: MatchData, b: MatchData) => b.priority - a.priority)
    } catch (error) {
      console.error('Error fetching user matches:', error)
      return []
    }
  }

  /**
   * Update match status
   */
  async updateMatchStatus(matchId: string, status: MatchData['status']): Promise<void> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, lastUpdated: new Date().toISOString() }),
      })

      if (!response.ok) {
        throw new Error('Failed to update match status')
      }

      console.log('✅ Match status updated:', matchId, status)
    } catch (error) {
      console.error('Error updating match status:', error)
      throw error
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    totalDonors: number
    totalRecipients: number
    totalMatches: number
    pendingMatches: number
    completedMatches: number
    verifiedDonors: number
  }> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch system stats')
      }

      const data = await response.json()
      return data.stats
    } catch (error) {
      console.error('Error fetching system stats:', error)
      return {
        totalDonors: 0,
        totalRecipients: 0,
        totalMatches: 0,
        pendingMatches: 0,
        completedMatches: 0,
        verifiedDonors: 0,
      }
    }
  }
}

export const dualStorageService = new DualStorageService()
export type { DonorData, RecipientData, MatchData }