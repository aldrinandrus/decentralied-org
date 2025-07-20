const { expect } = require("chai")
const { ethers } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

describe("OrganRegistry", () => {
  let organRegistry
  let owner, donor1, donor2, recipient1, verifier

  beforeEach(async () => {
    ;[owner, donor1, donor2, recipient1, verifier] = await ethers.getSigners()

    const OrganRegistry = await ethers.getContractFactory("OrganRegistry")
    organRegistry = await OrganRegistry.deploy()
    await organRegistry.deployed()

    // Add verifier
    await organRegistry.addVerifier(verifier.address)
  })

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      expect(await organRegistry.owner()).to.equal(owner.address)
    })

    it("Should add owner as verifier", async () => {
      expect(await organRegistry.verifiers(owner.address)).to.be.true
    })
  })

  describe("Donor Registration", () => {
    it("Should register a donor successfully", async () => {
      const name = "John Doe"
      const bloodType = "O+"
      const organs = ["Heart", "Liver"]
      const medicalHash = "QmTestHash"
      const emergencyContact = "Jane Doe"
      const location = "New York"

      await expect(
        organRegistry.connect(donor1).registerDonor(name, bloodType, organs, medicalHash, emergencyContact, location),
      )
        .to.emit(organRegistry, "DonorRegistered")
        .withArgs(donor1.address, name, bloodType, await time.latest())

      const donorData = await organRegistry.getDonor(donor1.address)
      expect(donorData.name).to.equal(name)
      expect(donorData.bloodType).to.equal(bloodType)
      expect(donorData.organs).to.deep.equal(organs)
      expect(donorData.isVerified).to.be.false
      expect(donorData.isActive).to.be.true
    })

    it("Should not allow duplicate registration", async () => {
      await organRegistry
        .connect(donor1)
        .registerDonor("John Doe", "O+", ["Heart"], "QmTestHash", "Jane Doe", "New York")

      await expect(
        organRegistry.connect(donor1).registerDonor("John Doe", "O+", ["Liver"], "QmTestHash2", "Jane Doe", "New York"),
      ).to.be.revertedWith("Donor already registered")
    })
  })

  describe("Recipient Registration", () => {
    it("Should register a recipient successfully", async () => {
      const name = "Alice Smith"
      const bloodType = "O+"
      const organ = "Heart"
      const urgency = 5
      const medicalCondition = "Heart failure"
      const location = "New York"

      await expect(
        organRegistry
          .connect(recipient1)
          .registerRecipient(name, bloodType, organ, urgency, medicalCondition, location),
      ).to.emit(organRegistry, "RecipientRegistered")

      const recipientData = await organRegistry.getRecipient(recipient1.address)
      expect(recipientData.name).to.equal(name)
      expect(recipientData.bloodType).to.equal(bloodType)
      expect(recipientData.organ).to.equal(organ)
      expect(recipientData.urgency).to.equal(urgency)
      expect(recipientData.isActive).to.be.true
    })
  })

  describe("Donor Verification", () => {
    beforeEach(async () => {
      await organRegistry
        .connect(donor1)
        .registerDonor("John Doe", "O+", ["Heart"], "QmTestHash", "Jane Doe", "New York")
    })

    it("Should allow verifier to verify donor", async () => {
      await expect(organRegistry.connect(verifier).verifyDonor(donor1.address))
        .to.emit(organRegistry, "DonorVerified")
        .withArgs(donor1.address, verifier.address, await time.latest())

      const donorData = await organRegistry.getDonor(donor1.address)
      expect(donorData.isVerified).to.be.true
    })

    it("Should not allow non-verifier to verify donor", async () => {
      await expect(organRegistry.connect(donor2).verifyDonor(donor1.address)).to.be.revertedWith(
        "Only verifiers can call this function",
      )
    })
  })

  describe("Matching", () => {
    beforeEach(async () => {
      // Register and verify donor
      await organRegistry
        .connect(donor1)
        .registerDonor("John Doe", "O+", ["Heart"], "QmTestHash", "Jane Doe", "New York")
      await organRegistry.connect(verifier).verifyDonor(donor1.address)

      // Register recipient
      await organRegistry
        .connect(recipient1)
        .registerRecipient("Alice Smith", "O+", "Heart", 5, "Heart failure", "New York")
    })

    it("Should create a match successfully", async () => {
      await expect(organRegistry.connect(verifier).createMatch(donor1.address, recipient1.address, "Heart")).to.emit(
        organRegistry,
        "MatchCreated",
      )

      const stats = await organRegistry.getContractStats()
      expect(stats._totalMatches).to.equal(1)
    })

    it("Should find compatible donors", async () => {
      const compatibleDonors = await organRegistry.findCompatibleDonors("O+", "Heart")
      expect(compatibleDonors).to.include(donor1.address)
    })
  })

  describe("Contract Stats", () => {
    it("Should return correct stats", async () => {
      // Register donor
      await organRegistry
        .connect(donor1)
        .registerDonor("John Doe", "O+", ["Heart"], "QmTestHash", "Jane Doe", "New York")

      // Register recipient
      await organRegistry
        .connect(recipient1)
        .registerRecipient("Alice Smith", "O+", "Heart", 5, "Heart failure", "New York")

      const stats = await organRegistry.getContractStats()
      expect(stats._totalDonors).to.equal(1)
      expect(stats._totalRecipients).to.equal(1)
      expect(stats._totalMatches).to.equal(0)
      expect(stats._verifiedDonors).to.equal(0)
    })
  })
})
