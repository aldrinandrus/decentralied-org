import { useState, useCallback } from 'react'
import { useWeb3 } from '@/components/providers/web3-provider'
import { greenfieldService, type MedicalRecord, type DonorDocument, type RecipientDocument, type OrganMatchData } from '@/lib/greenfield-service'
import { useToast } from '@/hooks/use-toast'

export function useGreenfield() {
  const { account, signer } = useWeb3()
  const { toast } = useToast()
  const [isInitializing, setIsInitializing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  /**
   * Initialize Greenfield service with current wallet
   */
  const initializeGreenfield = useCallback(async () => {
    if (!account || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return false
    }

    setIsInitializing(true)
    try {
      // For now, we'll use a placeholder approach since getting private key from MetaMask is complex
      // In production, you'd want to implement proper key management
      toast({
        title: "Greenfield Setup Required",
        description: "Please add your private key to .env file for Greenfield authentication",
        variant: "destructive",
      })
      
      // For demonstration, we'll use a placeholder private key
      // In real implementation, this should come from secure key management
      const privateKey = process.env.NEXT_PUBLIC_GREENFIELD_PRIVATE_KEY || ''
      
      if (!privateKey) {
        toast({
          title: "Private Key Not Available",
          description: "Please add GREENFIELD_PRIVATE_KEY to your environment variables",
          variant: "destructive",
        })
        return false
      }

      await greenfieldService.initialize(privateKey, account)
      
      toast({
        title: "Greenfield Connected",
        description: "Successfully connected to BNB Greenfield storage",
      })
      
      return true
    } catch (error: any) {
      console.error('Greenfield initialization error:', error)
      toast({
        title: "Greenfield Connection Failed",
        description: error.message || "Failed to connect to Greenfield storage",
        variant: "destructive",
      })
      return false
    } finally {
      setIsInitializing(false)
    }
  }, [account, signer, toast])

  /**
   * Upload medical document
   */
  const uploadMedicalDocument = useCallback(async (
    file: File,
    documentType: string,
    userId: string,
    metadata: Record<string, any> = {}
  ): Promise<DonorDocument | RecipientDocument | null> => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return null
    }

    setIsUploading(true)
    try {
      const document = await greenfieldService.uploadMedicalDocument(file, documentType, userId, metadata)
      
      toast({
        title: "Document Uploaded",
        description: `${file.name} uploaded to Greenfield successfully`,
      })
      
      return document
    } catch (error: any) {
      console.error('Document upload error:', error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document to Greenfield",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }, [initializeGreenfield, toast])

  /**
   * Download medical document
   */
  const downloadMedicalDocument = useCallback(async (objectName: string, fileName: string) => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return null
    }

    setIsDownloading(true)
    try {
      const fileData = await greenfieldService.downloadMedicalDocument(objectName)
      
      // Create download link
      const blob = new Blob([fileData])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Document Downloaded",
        description: `${fileName} downloaded successfully`,
      })
      
      return fileData
    } catch (error: any) {
      console.error('Document download error:', error)
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download document from Greenfield",
        variant: "destructive",
      })
      return null
    } finally {
      setIsDownloading(false)
    }
  }, [initializeGreenfield, toast])

  /**
   * Store medical record
   */
  const storeMedicalRecord = useCallback(async (record: MedicalRecord): Promise<string | null> => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return null
    }

    try {
      const recordId = await greenfieldService.storeMedicalRecord(record)
      
      toast({
        title: "Medical Record Stored",
        description: "Medical record stored securely in Greenfield",
      })
      
      return recordId
    } catch (error: any) {
      console.error('Medical record storage error:', error)
      toast({
        title: "Storage Failed",
        description: error.message || "Failed to store medical record in Greenfield",
        variant: "destructive",
      })
      return null
    }
  }, [initializeGreenfield, toast])

  /**
   * Retrieve medical record
   */
  const getMedicalRecord = useCallback(async (patientId: string, recordId: string): Promise<MedicalRecord | null> => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return null
    }

    try {
      const record = await greenfieldService.getMedicalRecord(patientId, recordId)
      return record
    } catch (error: any) {
      console.error('Medical record retrieval error:', error)
      toast({
        title: "Retrieval Failed",
        description: error.message || "Failed to retrieve medical record from Greenfield",
        variant: "destructive",
      })
      return null
    }
  }, [initializeGreenfield, toast])

  /**
   * Store organ match data
   */
  const storeOrganMatch = useCallback(async (matchData: OrganMatchData): Promise<string | null> => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return null
    }

    try {
      const matchId = await greenfieldService.storeOrganMatch(matchData)
      
      toast({
        title: "Match Data Stored",
        description: "Organ match data stored securely in Greenfield",
      })
      
      return matchId
    } catch (error: any) {
      console.error('Organ match storage error:', error)
      toast({
        title: "Storage Failed",
        description: error.message || "Failed to store organ match data in Greenfield",
        variant: "destructive",
      })
      return null
    }
  }, [initializeGreenfield, toast])

  /**
   * Create public URL for document sharing
   */
  const createPublicUrl = useCallback(async (objectName: string, expiryHours: number = 24): Promise<string | null> => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return null
    }

    try {
      const publicUrl = await greenfieldService.createPublicUrl(objectName, expiryHours)
      return publicUrl
    } catch (error: any) {
      console.error('Public URL creation error:', error)
      toast({
        title: "URL Creation Failed",
        description: error.message || "Failed to create public URL for document",
        variant: "destructive",
      })
      return null
    }
  }, [initializeGreenfield, toast])

  /**
   * Get storage statistics
   */
  const getStorageStats = useCallback(async () => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return null
    }

    try {
      const stats = await greenfieldService.getStorageStats()
      return stats
    } catch (error: any) {
      console.error('Storage stats error:', error)
      toast({
        title: "Stats Retrieval Failed",
        description: error.message || "Failed to retrieve storage statistics",
        variant: "destructive",
      })
      return null
    }
  }, [initializeGreenfield, toast])

  /**
   * Delete document
   */
  const deleteDocument = useCallback(async (objectName: string): Promise<boolean> => {
    if (!greenfieldService.isReady()) {
      const initialized = await initializeGreenfield()
      if (!initialized) return false
    }

    try {
      await greenfieldService.deleteDocument(objectName)
      
      toast({
        title: "Document Deleted",
        description: "Document deleted from Greenfield successfully",
      })
      
      return true
    } catch (error: any) {
      console.error('Document deletion error:', error)
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete document from Greenfield",
        variant: "destructive",
      })
      return false
    }
  }, [initializeGreenfield, toast])

  return {
    // State
    isInitializing,
    isUploading,
    isDownloading,
    isReady: greenfieldService.isReady(),
    
    // Actions
    initializeGreenfield,
    uploadMedicalDocument,
    downloadMedicalDocument,
    storeMedicalRecord,
    getMedicalRecord,
    storeOrganMatch,
    createPublicUrl,
    getStorageStats,
    deleteDocument,
    
    // Service info
    bucketName: greenfieldService.getBucketName(),
  }
} 