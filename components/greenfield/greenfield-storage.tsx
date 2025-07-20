"use client"

import { useState, useRef } from "react"
import { useGreenfield } from "@/hooks/use-greenfield"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Upload, 
  Download, 
  FileText, 
  Database, 
  Cloud, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink
} from "lucide-react"

export function GreenfieldStorage() {
  const { 
    isReady, 
    isInitializing, 
    isUploading, 
    isDownloading,
    initializeGreenfield,
    uploadMedicalDocument,
    downloadMedicalDocument,
    getStorageStats,
    deleteDocument,
    bucketName
  } = useGreenfield()
  
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [storageStats, setStorageStats] = useState<any>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !userId) {
      toast({
        title: "Missing Information",
        description: "Please select a file, document type, and user ID",
        variant: "destructive",
      })
      return
    }

    const document = await uploadMedicalDocument(selectedFile, documentType, userId)
    if (document) {
      setUploadedDocuments(prev => [...prev, document])
      setSelectedFile(null)
      setDocumentType('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async (objectName: string, fileName: string) => {
    await downloadMedicalDocument(objectName, fileName)
  }

  const handleDelete = async (objectName: string) => {
    const success = await deleteDocument(objectName)
    if (success) {
      setUploadedDocuments(prev => prev.filter(doc => doc.objectName !== objectName))
    }
  }

  const loadStorageStats = async () => {
    const stats = await getStorageStats()
    if (stats) {
      setStorageStats(stats)
    }
  }

  const documentTypes = [
    { value: 'medical_report', label: 'Medical Report' },
    { value: 'consent_form', label: 'Consent Form' },
    { value: 'identity_proof', label: 'Identity Proof' },
    { value: 'organ_specific_test', label: 'Organ Specific Test' },
    { value: 'urgency_assessment', label: 'Urgency Assessment' },
    { value: 'insurance_document', label: 'Insurance Document' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Greenfield Storage</h2>
          <p className="text-gray-600">Secure document storage on BNB Greenfield</p>
        </div>
        <div className="flex items-center space-x-2">
          {isReady ? (
            <Badge className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!isReady && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-yellow-800">Greenfield Not Connected</h3>
                <p className="text-sm text-yellow-600">
                  Connect to BNB Greenfield to store medical documents securely
                </p>
              </div>
              <Button 
                onClick={initializeGreenfield}
                disabled={isInitializing}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isInitializing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4 mr-2" />
                )}
                {isInitializing ? "Connecting..." : "Connect Greenfield"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Stats */}
      {isReady && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Storage Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {storageStats ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{storageStats.totalObjects}</div>
                  <div className="text-sm text-gray-600">Total Objects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(storageStats.totalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className="text-sm text-gray-600">Total Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{storageStats.bucketName}</div>
                  <div className="text-sm text-gray-600">Bucket Name</div>
                </div>
              </div>
            ) : (
              <Button onClick={loadStorageStats} variant="outline">
                Load Storage Stats
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      {isReady && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Medical Document</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="mt-1"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="mt-1"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !documentType || !userId || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? "Uploading..." : "Upload to Greenfield"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Uploaded Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {doc.documentType} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc.objectName, doc.fileName)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc.objectName)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Shield className="h-5 w-5" />
            <span>Greenfield Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">🔒 Secure Storage</h4>
              <p className="text-sm text-blue-700">
                Medical documents stored on decentralized BNB Greenfield network
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">🌐 Decentralized</h4>
              <p className="text-sm text-blue-700">
                No single point of failure, distributed across multiple storage providers
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">⚡ Fast Access</h4>
              <p className="text-sm text-blue-700">
                Quick upload and download with global CDN-like performance
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">💰 Cost Effective</h4>
              <p className="text-sm text-blue-700">
                Pay only for storage used, no upfront infrastructure costs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 