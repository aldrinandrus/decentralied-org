"use client"

import { useState } from "react"
import { useWeb3 } from "@/components/providers/web3-provider"
import { useDualStorage } from "@/hooks/use-dual-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { NetworkSwitcher } from "@/components/network/network-switcher"
import { Heart, Upload, Shield, CheckCircle, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const ORGANS = ["Heart", "Liver", "Kidney", "Lung", "Pancreas", "Cornea", "Skin", "Bone"]

export default function RegisterPage() {
  const { isConnected, signer, account, chainId } = useWeb3()
  const { registerDonor, loading: storageLoading } = useDualStorage()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    age: 0,
    bloodType: "",
    selectedOrgans: [] as string[],
    location: "",
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
    
    // Auto-calculate age from date of birth
    if (field === 'dateOfBirth' && value) {
      const birthDate = new Date(value)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      setFormData((prev) => ({ ...prev, age }))
    }
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
    if (!isConnected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Register donor using dual storage
      const donor = await registerDonor({
        name: formData.fullName,
        bloodType: formData.bloodType,
        organs: formData.selectedOrgans,
        age: formData.age,
        location: formData.location,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        medicalHistory: formData.medicalHistory,
        isActive: true,
        isVerified: false,
      })

      if (donor) {
        toast({
          title: "Registration Successful!",
          description: "Your donor registration has been saved and you'll be notified of potential matches",
        })

        // Redirect to dashboard after successful registration
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 2000)
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Registration Failed",
        description: error.message || "There was an error registering your information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age || ''}
                        onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
                        placeholder="Enter your age"
                        min="18"
                        max="80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="City, State"
                      />
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
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Dual Storage System:</strong>
                        <br />• Your data will be stored locally for fast access
                        <br />• Medical records will be securely stored on BNB Greenfield
                        <br />• Automatic matching with compatible recipients
                        <br />• Priority-based listing for optimal organ allocation
                      </AlertDescription>
                    </Alert>

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
                      disabled={!formData.consentGiven || !formData.kycVerified || loading || storageLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading || storageLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering Donor...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}