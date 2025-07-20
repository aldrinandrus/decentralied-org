import { Client, ClientConfig, Bucket, Object } from '@bnb-chain/greenfield-js-sdk'
import { ethers } from 'ethers'

// Types for organ donation data
export interface MedicalRecord {
  id: string
  patientId: string
  bloodType: string
  organType: string
  medicalHistory: string
  testResults: string
  doctorNotes: string
  timestamp: number
  hash: string
}

export interface DonorDocument {
  id: string
  donorId: string
  documentType: 'medical_report' | 'consent_form' | 'identity_proof' | 'organ_specific_test'
  fileName: string
  fileSize: number
  mimeType: string
  uploadDate: number
  greenfieldObjectId: string
  bucketName: string
  objectName: string
}

export interface RecipientDocument {
  id: string
  recipientId: string
  documentType: 'medical_report' | 'urgency_assessment' | 'identity_proof' | 'insurance_document'
  fileName: string
  fileSize: number
  mimeType: string
  uploadDate: number
  greenfieldObjectId: string
  bucketName: string
  objectName: string
}

export interface OrganMatchData {
  matchId: string
  donorId: string
  recipientId: string
  organType: string
  bloodTypeCompatibility: boolean
  matchScore: number
  medicalCompatibility: string
  timestamp: number
  status: 'pending' | 'approved' | 'completed' | 'cancelled'
}

class GreenfieldService {
  private client: Client | null = null
  private bucketName = 'organ-donation-platform'
  private isInitialized = false

  // Greenfield network configuration
  private readonly config: ClientConfig = {
    rpcUrl: process.env.NEXT_PUBLIC_GREENFIELD_RPC_URL || 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443',
    chainId: process.env.NEXT_PUBLIC_GREENFIELD_CHAIN_ID || '5600', // Testnet chain ID
    address: '',
    privateKey: '',
  }

  /**
   * Initialize Greenfield client with wallet credentials
   */
  async initialize(privateKey: string, address: string): Promise<void> {
    try {
      this.config.privateKey = privateKey
      this.config.address = address
      
      this.client = new Client(this.config)
      await this.ensureBucketExists()
      this.isInitialized = true
      
      console.log('✅ Greenfield service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Greenfield service:', error)
      throw error
    }
  }

  /**
   * Ensure the main bucket exists for storing organ donation data
   */
  private async ensureBucketExists(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized')

    try {
      // Check if bucket exists
      const bucket = await this.client.bucket.headBucket(this.bucketName)
      console.log('✅ Bucket already exists:', bucket)
    } catch (error: any) {
      if (error.message?.includes('NoSuchBucket')) {
        // Create bucket if it doesn't exist
        console.log('🔄 Creating bucket:', this.bucketName)
        await this.client.bucket.createBucket({
          bucketName: this.bucketName,
          creator: this.config.address,
          visibility: 'VISIBILITY_TYPE_PRIVATE',
          chargedReadQuota: '0',
          spInfo: {
            primarySpAddress: await this.getPrimarySPAddress(),
          },
        })
        console.log('✅ Bucket created successfully')
      } else {
        throw error
      }
    }
  }

  /**
   * Get primary storage provider address
   */
  private async getPrimarySPAddress(): Promise<string> {
    if (!this.client) throw new Error('Client not initialized')
    
    // Get list of storage providers and use the first one
    const sps = await this.client.sp.listStorageProviders()
    if (sps.length === 0) {
      throw new Error('No storage providers available')
    }
    return sps[0].operatorAddress
  }

  /**
   * Upload medical document to Greenfield
   */
  async uploadMedicalDocument(
    file: File,
    documentType: string,
    userId: string,
    metadata: Record<string, any> = {}
  ): Promise<DonorDocument | RecipientDocument> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const fileBuffer = await file.arrayBuffer()
      const fileName = `${documentType}_${userId}_${Date.now()}_${file.name}`
      const objectName = `documents/${documentType}/${fileName}`

      // Upload file to Greenfield
      const uploadResult = await this.client.object.createObject({
        bucketName: this.bucketName,
        objectName: objectName,
        body: Buffer.from(fileBuffer),
        txnHash: '', // Will be set after transaction
        visibility: 'VISIBILITY_TYPE_PRIVATE',
        contentType: file.type,
        expectChecksums: [],
      })

      // Create document record
      const document: DonorDocument | RecipientDocument = {
        id: `${userId}_${Date.now()}`,
        donorId: documentType.includes('donor') ? userId : '',
        recipientId: documentType.includes('recipient') ? userId : '',
        documentType: documentType as any,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadDate: Date.now(),
        greenfieldObjectId: uploadResult.id,
        bucketName: this.bucketName,
        objectName: objectName,
      }

      console.log('✅ Document uploaded to Greenfield:', document)
      return document
    } catch (error) {
      console.error('❌ Failed to upload document:', error)
      throw error
    }
  }

  /**
   * Download medical document from Greenfield
   */
  async downloadMedicalDocument(objectName: string): Promise<ArrayBuffer> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const downloadResult = await this.client.object.getObject({
        bucketName: this.bucketName,
        objectName: objectName,
      })

      return downloadResult.body
    } catch (error) {
      console.error('❌ Failed to download document:', error)
      throw error
    }
  }

  /**
   * Store medical record data
   */
  async storeMedicalRecord(record: MedicalRecord): Promise<string> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const objectName = `medical_records/${record.patientId}/${record.id}.json`
      const recordData = JSON.stringify(record, null, 2)

      const uploadResult = await this.client.object.createObject({
        bucketName: this.bucketName,
        objectName: objectName,
        body: Buffer.from(recordData, 'utf-8'),
        txnHash: '',
        visibility: 'VISIBILITY_TYPE_PRIVATE',
        contentType: 'application/json',
        expectChecksums: [],
      })

      console.log('✅ Medical record stored in Greenfield:', uploadResult.id)
      return uploadResult.id
    } catch (error) {
      console.error('❌ Failed to store medical record:', error)
      throw error
    }
  }

  /**
   * Retrieve medical record data
   */
  async getMedicalRecord(patientId: string, recordId: string): Promise<MedicalRecord> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const objectName = `medical_records/${patientId}/${recordId}.json`
      
      const downloadResult = await this.client.object.getObject({
        bucketName: this.bucketName,
        objectName: objectName,
      })

      const recordData = new TextDecoder().decode(downloadResult.body)
      return JSON.parse(recordData)
    } catch (error) {
      console.error('❌ Failed to retrieve medical record:', error)
      throw error
    }
  }

  /**
   * Store organ match data
   */
  async storeOrganMatch(matchData: OrganMatchData): Promise<string> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const objectName = `matches/${matchData.matchId}.json`
      const matchDataString = JSON.stringify(matchData, null, 2)

      const uploadResult = await this.client.object.createObject({
        bucketName: this.bucketName,
        objectName: objectName,
        body: Buffer.from(matchDataString, 'utf-8'),
        txnHash: '',
        visibility: 'VISIBILITY_TYPE_PRIVATE',
        contentType: 'application/json',
        expectChecksums: [],
      })

      console.log('✅ Organ match data stored in Greenfield:', uploadResult.id)
      return uploadResult.id
    } catch (error) {
      console.error('❌ Failed to store organ match:', error)
      throw error
    }
  }

  /**
   * List all documents for a user
   */
  async listUserDocuments(userId: string): Promise<(DonorDocument | RecipientDocument)[]> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const objects = await this.client.object.listObjects({
        bucketName: this.bucketName,
        prefix: `documents/${userId}/`,
        maxKeys: 100,
      })

      // This would need to be enhanced to actually parse the document metadata
      // For now, returning empty array as placeholder
      return []
    } catch (error) {
      console.error('❌ Failed to list user documents:', error)
      throw error
    }
  }

  /**
   * Create a public URL for document sharing (if needed)
   */
  async createPublicUrl(objectName: string, expiryHours: number = 24): Promise<string> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const signedUrl = await this.client.object.getObjectReadSignedUrl({
        bucketName: this.bucketName,
        objectName: objectName,
        timestamp: Math.floor(Date.now() / 1000) + (expiryHours * 3600),
      })

      return signedUrl
    } catch (error) {
      console.error('❌ Failed to create public URL:', error)
      throw error
    }
  }

  /**
   * Delete a document from Greenfield
   */
  async deleteDocument(objectName: string): Promise<void> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      await this.client.object.deleteObject({
        bucketName: this.bucketName,
        objectName: objectName,
      })

      console.log('✅ Document deleted from Greenfield:', objectName)
    } catch (error) {
      console.error('❌ Failed to delete document:', error)
      throw error
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalObjects: number
    totalSize: number
    bucketName: string
  }> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Greenfield service not initialized')
    }

    try {
      const bucketInfo = await this.client.bucket.headBucket(this.bucketName)
      
      return {
        totalObjects: parseInt(bucketInfo.objectCount || '0'),
        totalSize: parseInt(bucketInfo.storageSize || '0'),
        bucketName: this.bucketName,
      }
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error)
      throw error
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null
  }

  /**
   * Get bucket name
   */
  getBucketName(): string {
    return this.bucketName
  }
}

// Export singleton instance
export const greenfieldService = new GreenfieldService()

// Export types
export type { MedicalRecord, DonorDocument, RecipientDocument, OrganMatchData } 