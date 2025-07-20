import { useState, useCallback } from 'react'
import { useWeb3 } from '@/components/providers/web3-provider'
import { dualStorageService, type DonorData, type RecipientData, type MatchData } from '@/lib/dual-storage-service'
import { useToast } from '@/hooks/use-toast'

export function useDualStorage() {
  const { account } = useWeb3()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [donors, setDonors] = useState<DonorData[]>([])
  const [recipients, setRecipients] = useState<RecipientData[]>([])
  const [matches, setMatches] = useState<MatchData[]>([])

  /**
   * Register a new donor
   */
  const registerDonor = useCallback(async (donorData: Omit<DonorData, 'id' | 'registrationDate' | 'lastUpdated' | 'priority'>) => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return null
    }

    setLoading(true)
    try {
      const donor = await dualStorageService.storeDonor({
        ...donorData,
        walletAddress: account,
      })

      toast({
        title: "Donor Registered Successfully",
        description: `${donor.name} has been registered and stored in both localhost and Greenfield`,
      })

      // Refresh donors list
      await loadDonors()
      await loadMatches()

      return donor
    } catch (error: any) {
      console.error('Error registering donor:', error)
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register donor",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [account, toast])

  /**
   * Register a new recipient
   */
  const registerRecipient = useCallback(async (recipientData: Omit<RecipientData, 'id' | 'registrationDate' | 'waitingSince' | 'lastUpdated' | 'priority'>) => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return null
    }

    setLoading(true)
    try {
      const recipient = await dualStorageService.storeRecipient({
        ...recipientData,
        walletAddress: account,
      })

      toast({
        title: "Recipient Registered Successfully",
        description: `${recipient.name} has been registered and stored in both localhost and Greenfield`,
      })

      // Refresh recipients list
      await loadRecipients()
      await loadMatches()

      return recipient
    } catch (error: any) {
      console.error('Error registering recipient:', error)
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register recipient",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [account, toast])

  /**
   * Load all donors
   */
  const loadDonors = useCallback(async (filters?: { bloodType?: string; organ?: string }) => {
    try {
      const donorsList = await dualStorageService.getDonors(filters)
      setDonors(donorsList)
      return donorsList
    } catch (error) {
      console.error('Error loading donors:', error)
      return []
    }
  }, [])

  /**
   * Load all recipients
   */
  const loadRecipients = useCallback(async (filters?: { bloodType?: string; organ?: string }) => {
    try {
      const recipientsList = await dualStorageService.getRecipients(filters)
      setRecipients(recipientsList)
      return recipientsList
    } catch (error) {
      console.error('Error loading recipients:', error)
      return []
    }
  }, [])

  /**
   * Load all matches sorted by priority
   */
  const loadMatches = useCallback(async (filters?: { 
    bloodType?: string
    organ?: string
    status?: string
    urgency?: number
  }) => {
    try {
      const matchesList = await dualStorageService.getMatches(filters)
      setMatches(matchesList)
      return matchesList
    } catch (error) {
      console.error('Error loading matches:', error)
      return []
    }
  }, [])

  /**
   * Get matches for current user
   */
  const getUserMatches = useCallback(async () => {
    if (!account) return []

    try {
      const userMatches = await dualStorageService.getUserMatches(account)
      return userMatches
    } catch (error) {
      console.error('Error loading user matches:', error)
      return []
    }
  }, [account])

  /**
   * Find compatible matches for specific criteria
   */
  const findCompatibleMatches = useCallback(async (bloodType: string, organ: string) => {
    try {
      const compatibleMatches = await dualStorageService.getMatches({
        bloodType,
        organ,
        status: 'pending',
      })

      return compatibleMatches
    } catch (error) {
      console.error('Error finding compatible matches:', error)
      return []
    }
  }, [])

  /**
   * Update match status
   */
  const updateMatchStatus = useCallback(async (matchId: string, status: MatchData['status']) => {
    try {
      await dualStorageService.updateMatchStatus(matchId, status)
      
      toast({
        title: "Match Updated",
        description: `Match status updated to ${status}`,
      })

      // Refresh matches
      await loadMatches()
    } catch (error: any) {
      console.error('Error updating match status:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update match status",
        variant: "destructive",
      })
    }
  }, [toast, loadMatches])

  /**
   * Get system statistics
   */
  const getSystemStats = useCallback(async () => {
    try {
      return await dualStorageService.getSystemStats()
    } catch (error) {
      console.error('Error getting system stats:', error)
      return {
        totalDonors: 0,
        totalRecipients: 0,
        totalMatches: 0,
        pendingMatches: 0,
        completedMatches: 0,
        verifiedDonors: 0,
      }
    }
  }, [])

  return {
    // State
    loading,
    donors,
    recipients,
    matches,

    // Actions
    registerDonor,
    registerRecipient,
    loadDonors,
    loadRecipients,
    loadMatches,
    getUserMatches,
    findCompatibleMatches,
    updateMatchStatus,
    getSystemStats,
  }
}