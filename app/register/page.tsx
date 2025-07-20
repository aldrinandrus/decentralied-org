"use client"

import { useState } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { TransactionService } from "@/lib/transaction-service"
import { TransactionFeedback } from "@/components/transaction/transaction-feedback"
import { GasEstimator } from "@/components/transaction/gas-estimator"
import { NetworkSwitcher } from "@/components/network/network-switcher"
import { Heart, Upload, Shield, CheckCircle, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { TransactionResult } from "@/lib/blockchain"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const ORGANS = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea", "Skin", "Bone"]

export default function RegisterPage() {
  const { isConnected, signer, account, chainId } = useWeb3()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null)
  const [showTransactionFeedback, setShowTransactionFeedback] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    bloodType: "",
    selectedOrgans: [] as string[],
    medicalHistory: "",
    emergencyContact: "",
    emergencyPhone: "",
    consentGiven: false,
    kycVerified: false,
  })

  const [files, setFiles] = useState({
    medicalReports: null as File | null,
    idDocument: null as File | null,
    consentForm: null as File | null,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleOrganToggle = (organ: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedOrgans: prev.selectedOrgans.includes(organ)
        ? prev.selectedOrgans.filter((o) => o !== organ)
        : [...prev.selectedOrgans, organ],
    }))
  }

  const handleFileUpload = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }))
  }

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Simulate IPFS upload - in production, use actual IPFS service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`ipfs://QmHash${Math.random().toString(36).substr(2, 9)}`)
      }, 1000)
    })
  }

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name",
        variant: "destructive",
      })
      return false
    }

    if (!formData.bloodType) {
      toast({
        title: "Validation Error",
        description: "Please select your blood type",
        variant: "destructive",
      })
      return false
    }

    if (formData.selectedOrgans.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one organ for donation",
        variant: "destructive",
      })
      return false
    }

    if (!formData.consentGiven) {
      toast({
        title: "Consent Required",
        description: "Please provide consent for organ donation",
        variant: "destructive",
      })
      return false
    }

    if (!formData.kycVerified) {
      toast({
        title: "KYC Verification Required",
        description: "Please confirm KYC verification",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive",
      })
      return
    }

    // Check if on correct network
    if (chainId !== 56 && chainId !== 97) {
      toast({
        title: "Wrong Network",
        description: "Please switch to BNB Smart Chain before submitting the transaction",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Upload medical documents to IPFS
      let medicalHash = ""
      if (files.medicalReports) {
        medicalHash = await uploadToIPFS(files.medicalReports)
      }

      // Create transaction service instance
      const transactionService = new TransactionService(signer)

      // Register donor on blockchain
      const result = await transactionService.registerDonor({
        name: formData.fullName,
        bloodType: formData.bloodType,
        organs: formData.selectedOrgans,
        medicalHash: medicalHash,
      })

      setTransactionResult(result)
      setShowTransactionFeedback(true)

      if (result.status === "pending") {
        toast({
          title: "Transaction Submitted",
          description: "Your registration is being processed on the blockchain",
        })

        // Monitor transaction
        transactionService.onTransactionUpdate(result.hash, (updatedResult) => {
          setTransactionResult(updatedResult)

          if (updatedResult.status === "success") {
            toast({
              title: "Registration Successful!",
              description: "Your donor registration has been confirmed on the blockchain",
            })
            // Redirect to home page after successful registration
            setTimeout(() => {
              window.location.href = "/"
            }, 3000)
          } else if (updatedResult.status === "failed") {
            toast({
              title: "Registration Failed",
              description: updatedResult.error || "Transaction failed on the blockchain",
              variant: "destructive",
            })
          }
        })
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration Failed",
        description: "There was an error registering your information. Please try again.",
        variant: "destructive",
      })
      setTransactionResult({
        hash: "",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
      setShowTransactionFeedback(true)
    } finally {
      setLoading(false)
    }
  }

  const retryTransaction = () => {
    setShowTransactionFeedback(false)
    setTransactionResult(null)
    handleSubmit()
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Heart className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please connect your MetaMask wallet to register as an organ donor.</p>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">Go Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCorrectNetwork = chainId === 56 || chainId === 97

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Heart className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register as Organ Donor</h1>
            <p className="text-gray-600">Complete your registration to join the decentralized organ donation network</p>
          </div>

          {/* Network Switcher */}
          <div className="max-w-4xl mx-auto mb-6">
            <NetworkSwitcher />
          </div>

          {/* Show warning if not on correct network */}
          {!isCorrectNetwork && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Network Error:</strong> You must be connected to BNB Smart Chain to register. Please switch
                networks before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? "bg-green-600" : "bg-gray-200"}`}></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? "bg-green-600" : "bg-gray-200"}`}></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                3
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && "Personal Information"}
                {step === 2 && "Medical Information & Documents"}
                {step === 3 && "Consent & Verification"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bloodType">Blood Type *</Label>
                    <Select value={formData.bloodType} onValueChange={(value) => handleInputChange("bloodType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your blood type" />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                        placeholder="Emergency contact phone"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)} className="bg-green-600 hover:bg-green-700">
                      Next Step
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label>Organs Available for Donation *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {ORGANS.map((organ) => (
                        <div key={organ} className="flex items-center space-x-2">
                          <Checkbox
                            id={organ}
                            checked={formData.selectedOrgans.includes(organ)}
                            onCheckedChange={() => handleOrganToggle(organ)}
                          />
                          <Label htmlFor={organ} className="text-sm">
                            {organ}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                      placeholder="Brief medical history (optional)"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="medicalReports">Medical Reports *</Label>
                      <div className="mt-2 flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> medical reports
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload("medicalReports", e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                      {files.medicalReports && (
                        <p className="text-sm text-green-600 mt-2">✓ {files.medicalReports.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="idDocument">ID Document *</Label>
                      <div className="mt-2 flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> ID document
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload("idDocument", e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                      {files.idDocument && <p className="text-sm text-green-600 mt-2">✓ {files.idDocument.name}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Previous
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-green-600 hover:bg-green-700">
                      Next Step
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center space-x-3 mb-4">
                        <Shield className="h-6 w-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-green-800">Data Security & Privacy</h3>
                      </div>
                      <ul className="space-y-2 text-green-700">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Your data is encrypted and stored on blockchain</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Only authorized medical professionals can access your information</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>You maintain full control over your data</span>
                        </li>
                      </ul>
                    </div>

                    {/* Gas Estimator */}
                    {isCorrectNetwork && <GasEstimator transactionType="registerDonor" parameters={formData} />}

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="consent"
                          checked={formData.consentGiven}
                          onCheckedChange={(checked) => handleInputChange("consentGiven", checked)}
                        />
                        <Label htmlFor="consent" className="text-sm leading-relaxed">
                          I hereby give my informed consent for organ donation and understand that:
                          <ul className="mt-2 ml-4 space-y-1 list-disc">
                            <li>My medical information will be stored securely on the blockchain</li>
                            <li>I can revoke this consent at any time</li>
                            <li>Only verified medical institutions can access my data</li>
                            <li>I will be notified of any potential matches</li>
                          </ul>
                        </Label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="kyc"
                          checked={formData.kycVerified}
                          onCheckedChange={(checked) => handleInputChange("kycVerified", checked)}
                        />
                        <Label htmlFor="kyc" className="text-sm">
                          I confirm that all information provided is accurate and I agree to KYC verification
                        </Label>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> After registration, your information will be verified by medical
                        professionals. You will receive a notification once verification is complete.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Previous
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!formData.consentGiven || !formData.kycVerified || loading || !isCorrectNetwork}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Transaction...
                        </>
                      ) : (
                        "Complete Registration"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Feedback Modal */}
      <TransactionFeedback
        transaction={transactionResult}
        isOpen={showTransactionFeedback}
        onClose={() => setShowTransactionFeedback(false)}
        onRetry={retryTransaction}
      />
    </div>
  )
}
