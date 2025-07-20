"use client"

import { useState } from "react"
import { useGreenfield } from "@/hooks/use-greenfield"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Upload, 
  Download,
  Database,
  Cloud,
  FileText,
  AlertTriangle
} from "lucide-react"

export default function TestGreenfieldPage() {
  const { isConnected, account } = useWeb3()
  const { 
    isReady, 
    isInitializing, 
    isUploading, 
    isDownloading,
    initializeGreenfield,
    uploadMedicalDocument,
    downloadMedicalDocument,
    storeMedicalRecord,
    getMedicalRecord,
    storeOrganMatch,
    getStorageStats,
    bucketName
  } = useGreenfield()
  
  const { toast } = useToast()
  
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testData, setTestData] = useState({
    patientId: 'test-patient-123',
    bloodType: 'O+',
    organType: 'kidney',
    medicalHistory: 'Test medical history for Greenfield integration testing'
  })

  const addTestResult = (testName: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      name: testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    }])
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    try {
      // Test 1: Check wallet connection
      addTestResult(
        "Wallet Connection",
        isConnected,
        isConnected ? "Wallet is connected" : "Wallet is not connected",
        { account }
      )

      if (!isConnected) {
        addTestResult("Greenfield Initialization", false, "Cannot test Greenfield without wallet connection")
        return
      }

      // Test 2: Initialize Greenfield
      addTestResult("Greenfield Initialization", false, "Attempting to initialize Greenfield...")
      const initialized = await initializeGreenfield()
      addTestResult(
        "Greenfield Initialization",
        initialized,
        initialized ? "Greenfield initialized successfully" : "Failed to initialize Greenfield"
      )

      if (!initialized) {
        return
      }

      // Test 3: Check Greenfield readiness
      addTestResult(
        "Greenfield Readiness",
        isReady,
        isReady ? "Greenfield service is ready" : "Greenfield service is not ready"
      )

      // Test 4: Get storage stats
      try {
        const stats = await getStorageStats()
        addTestResult(
          "Storage Statistics",
          !!stats,
          stats ? `Storage stats retrieved: ${stats.totalObjects} objects, ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB` : "Failed to get storage stats",
          stats
        )
      } catch (error: any) {
        addTestResult("Storage Statistics", false, `Error: ${error.message}`)
      }

      // Test 5: Create test medical record
      try {
        const testRecord = {
          id: `test-record-${Date.now()}`,
          patientId: testData.patientId,
          bloodType: testData.bloodType,
          organType: testData.organType,
          medicalHistory: testData.medicalHistory,
          testResults: "Test results for Greenfield integration",
          doctorNotes: "Test doctor notes",
          timestamp: Date.now(),
          hash: "0x" + "0".repeat(64)
        }

        const recordId = await storeMedicalRecord(testRecord)
        addTestResult(
          "Medical Record Storage",
          !!recordId,
          recordId ? `Medical record stored with ID: ${recordId}` : "Failed to store medical record",
          { recordId, testRecord }
        )

        // Test 6: Retrieve medical record
        if (recordId) {
          try {
            const retrievedRecord = await getMedicalRecord(testData.patientId, testRecord.id)
            addTestResult(
              "Medical Record Retrieval",
              !!retrievedRecord,
              retrievedRecord ? "Medical record retrieved successfully" : "Failed to retrieve medical record",
              { retrievedRecord }
            )
          } catch (error: any) {
            addTestResult("Medical Record Retrieval", false, `Error: ${error.message}`)
          }
        }
      } catch (error: any) {
        addTestResult("Medical Record Storage", false, `Error: ${error.message}`)
      }

      // Test 7: Store organ match data
      try {
        const matchData = {
          matchId: `test-match-${Date.now()}`,
          donorId: 'test-donor-123',
          recipientId: 'test-recipient-456',
          organType: 'kidney',
          bloodTypeCompatibility: true,
          matchScore: 95,
          medicalCompatibility: 'High compatibility for kidney transplant',
          timestamp: Date.now(),
          status: 'pending' as const
        }

        const matchId = await storeOrganMatch(matchData)
        addTestResult(
          "Organ Match Storage",
          !!matchId,
          matchId ? `Organ match stored with ID: ${matchId}` : "Failed to store organ match",
          { matchId, matchData }
        )
      } catch (error: any) {
        addTestResult("Organ Match Storage", false, `Error: ${error.message}`)
      }

      // Test 8: File upload (if file is selected)
      if (testFile) {
        try {
          const document = await uploadMedicalDocument(
            testFile,
            'medical_report',
            testData.patientId,
            { test: true }
          )
          addTestResult(
            "File Upload",
            !!document,
            document ? `File uploaded successfully: ${document.fileName}` : "Failed to upload file",
            { document }
          )

          // Test 9: File download
          if (document) {
            try {
              await downloadMedicalDocument(document.objectName, document.fileName)
              addTestResult(
                "File Download",
                true,
                "File downloaded successfully"
              )
            } catch (error: any) {
              addTestResult("File Download", false, `Error: ${error.message}`)
            }
          }
        } catch (error: any) {
          addTestResult("File Upload", false, `Error: ${error.message}`)
        }
      }

    } catch (error: any) {
      addTestResult("Test Suite", false, `Test suite error: ${error.message}`)
    } finally {
      setIsRunningTests(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setTestFile(file)
    }
  }

  const getSuccessRate = () => {
    if (testResults.length === 0) return 0
    const successful = testResults.filter(result => result.success).length
    return Math.round((successful / testResults.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <TestTube className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Greenfield Integration Test</h1>
            <p className="text-gray-600">Comprehensive testing of BNB Greenfield storage functionality</p>
          </div>

          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Wallet Connection</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {isConnected ? `Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` : "Not connected"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {isReady ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Greenfield Status</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {isReady ? "Ready" : isInitializing ? "Initializing..." : "Not ready"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Bucket Name</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{bucketName}</p>
              </CardContent>
            </Card>
          </div>

          {/* Test Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    value={testData.patientId}
                    onChange={(e) => setTestData(prev => ({ ...prev, patientId: e.target.value }))}
                    placeholder="Enter patient ID"
                  />
                </div>
                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Input
                    id="bloodType"
                    value={testData.bloodType}
                    onChange={(e) => setTestData(prev => ({ ...prev, bloodType: e.target.value }))}
                    placeholder="e.g., O+"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="organType">Organ Type</Label>
                <Input
                  id="organType"
                  value={testData.organType}
                  onChange={(e) => setTestData(prev => ({ ...prev, organType: e.target.value }))}
                  placeholder="e.g., kidney"
                />
              </div>
              <div>
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={testData.medicalHistory}
                  onChange={(e) => setTestData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                  placeholder="Enter test medical history"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="testFile">Test File (Optional)</Label>
                <Input
                  id="testFile"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                {testFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {testFile.name} ({(testFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Run Tests Button */}
          <div className="text-center mb-8">
            <Button
              onClick={runAllTests}
              disabled={isRunningTests || !isConnected}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunningTests ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-5 w-5 mr-2" />
              )}
              {isRunningTests ? "Running Tests..." : "Run All Tests"}
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test Results</CardTitle>
                  <Badge className={getSuccessRate() >= 80 ? "bg-green-600" : getSuccessRate() >= 50 ? "bg-yellow-600" : "bg-red-600"}>
                    {getSuccessRate()}% Success Rate
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border ${
                        result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-gray-600">{result.message}</p>
                          {result.data && (
                            <details className="mt-2">
                              <summary className="text-sm text-gray-500 cursor-pointer">View Details</summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Instructions */}
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Test Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-blue-700">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <strong>Prerequisites:</strong> Make sure you have MetaMask connected and Greenfield testnet tokens
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Cloud className="h-4 w-4 mt-0.5" />
                  <div>
                    <strong>Environment:</strong> Ensure your .env file has the correct Greenfield configuration
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <div>
                    <strong>File Upload:</strong> Select a test file to test document upload/download functionality
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 