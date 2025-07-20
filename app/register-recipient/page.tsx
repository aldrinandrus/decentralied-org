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
import { Heart, Upload, Shield, CheckCircle, Loader2, AlertTriangle, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { TransactionResult } from "@/lib/blockchain"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const ORGANS = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea", "Skin", "Bone"]
const URGENCY_LEVELS = [
  { value: "1", label: "Low - Can wait 6+ months" },
  { value: "2", label: "Medium - Can wait 3-6 months" },
  { value: "3", label: "High - Can wait 1-3 months" },
  { value: "4", label: "Critical - Need within 1 month" },
  { value: "5", label: "Emergency - Need immediately" },
]

export default function RegisterRecipientPage() {
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
    neededOrgan: "",
    urgency: "",
    medicalCondition: "",
    hospital: "",
    doctorName: "",
    emergencyContact: "",
    emergencyPhone: "",
    consentGiven: false,
    kycVerified: false,
  })

  const [files, setFiles] = useState({
    medicalReports: null as File | null,
    doctorReferral: null as File | null,
    consentForm: null as File | null,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

    if (!formData.neededOrgan) {
      toast({
        title: "Validation Error",
        description: "Please select the organ you need",
        variant: "destructive",
      })
      return false
    }

    if (!formData.urgency) {
      toast({
        title: "Validation Error",
        description: "Please select urgency level",
        variant: "destructive",
      })
      return false
    }

    if (!formData.consentGiven) {
      toast({
        title: "Consent Required",
        description: "Please provide consent for organ transplantation",
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

      // Register recipient on blockchain
      const result = await transactionService.addRecipient({
        name: formData.fullName,
        bloodType: formData.bloodType,
        organ: formData.neededOrgan,
        urgency: parseInt(formData.urgency),
      })

      setTransactionResult(result)
      setShowTransactionFeedback(true)

      if (result.status === "pending") {
        toast({
          title: "Registration Submitted",
          description: "Your recipient registration is being processed on the blockchain",
        })

        // Monitor transaction
        transactionService.onTransactionUpdate(result.hash, (updatedResult) => {
          setTransactionResult(updatedResult)

          if (updatedResult.status === "success") {
            toast({
              title: "Registration Successful!",
              description: "Your recipient registration has been confirmed on the blockchain",
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
    } catch (error: any) {
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
            <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please connect your MetaMask wallet to register as a recipient.</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">Go Back to Home</Button>
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
            <UserCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register as Organ Recipient</h1>
            <p className="text-gray-600">Complete your registration to find compatible organ donors</p>
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
                className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
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
                      <Label htmlFor="neededOrgan">Organ Needed *</Label>
                      <Select value={formData.neededOrgan} onValueChange={(value) => handleInputChange("neededOrgan", value)}>
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
                      <Label htmlFor="urgency">Urgency Level *</Label>
                      <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency level" />
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
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hospital">Hospital</Label>
                      <Input
                        id="hospital"
                        value={formData.hospital}
                        onChange={(e) => handleInputChange("hospital", e.target.value)}
                        placeholder="Enter hospital name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="doctorName">Doctor Name</Label>
                      <Input
                        id="doctorName"
                        value={formData.doctorName}
                        onChange={(e) => handleInputChange("doctorName", e.target.value)}
                        placeholder="Enter doctor's name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="medicalCondition">Medical Condition Description</Label>
                    <Textarea
                      id="medicalCondition"
                      value={formData.medicalCondition}
                      onChange={(e) => handleInputChange("medicalCondition", e.target.value)}
                      placeholder="Describe your medical condition and why you need the organ"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="medicalReports">Medical Reports</Label>
                      <Input
                        id="medicalReports"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload("medicalReports", e.target.files?.[0] || null)}
                      />
                      <p className="text-sm text-gray-500 mt-1">Upload recent medical reports and diagnosis</p>
                    </div>
                    <div>
                      <Label htmlFor="doctorReferral">Doctor's Referral</Label>
                      <Input
                        id="doctorReferral"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload("doctorReferral", e.target.files?.[0] || null)}
                      />
                      <p className="text-sm text-gray-500 mt-1">Upload doctor's referral letter</p>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="consentGiven"
                        checked={formData.consentGiven}
                        onCheckedChange={(checked) => handleInputChange("consentGiven", checked)}
                      />
                      <Label htmlFor="consentGiven">I consent to organ transplantation and understand the risks involved</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="kycVerified"
                        checked={formData.kycVerified}
                        onCheckedChange={(checked) => handleInputChange("kycVerified", checked)}
                      />
                      <Label htmlFor="kycVerified">I confirm that my KYC verification is complete and accurate</Label>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      By registering as a recipient, you agree to provide accurate medical information and understand that
                      this information will be stored on the blockchain for matching purposes.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Previous Step
                  </Button>
                )}
                {step < 3 ? (
                  <Button 
                    onClick={() => setStep(step + 1)} 
                    className="ml-auto"
                    disabled={
                      (step === 1 && (!formData.fullName || !formData.bloodType || !formData.neededOrgan || !formData.urgency)) ||
                      (step === 2 && (!formData.emergencyContact || !formData.emergencyPhone))
                    }
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.consentGiven || !formData.kycVerified}
                    className="ml-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Register as Recipient
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Feedback */}
          {showTransactionFeedback && transactionResult && (
            <TransactionFeedback
              transaction={transactionResult}
              isOpen={showTransactionFeedback}
              onRetry={retryTransaction}
              onClose={() => setShowTransactionFeedback(false)}
            />
          )}

          {/* Gas Estimator */}
          <div className="mt-8">
            <GasEstimator transactionType="addRecipient" />
          </div>
        </div>
      </div>
    </div>
  )
} 