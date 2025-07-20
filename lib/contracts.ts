import { ethers } from "ethers"

// Contract ABIs (simplified for demo)
export const ORGAN_REGISTRY_ABI = [
  "function registerDonor(string memory _name, string memory _bloodType, string[] memory _organs, string memory _medicalHash, string memory _emergencyContact, string memory _location) external",
  "function registerRecipient(string memory _name, string memory _bloodType, string memory _organ, uint256 _urgency, string memory _medicalCondition, string memory _location) external",
  "function getDonor(address _donor) external view returns (string memory name, string memory bloodType, string[] memory organs, string memory medicalHash, bool isVerified, bool isActive, uint256 registrationTime, string memory emergencyContact, string memory location)",
  "function getRecipient(address _recipient) external view returns (string memory name, string memory bloodType, string memory organ, uint256 urgency, bool isActive, uint256 registrationTime, string memory medicalCondition, string memory location, uint256 waitingSince)",
  "function verifyDonor(address _donor) external",
  "function createMatch(address _donor, address _recipient, string memory _organ) external returns (bytes32)",
  "function updateMatchStatus(bytes32 _matchId, string memory _newStatus) external",
  "function findMatches(string memory _bloodType, string memory _organ) external view returns (address[] memory)",
  "function getDonorCount() external view returns (uint256)",
  "function getRecipientCount() external view returns (uint256)",
  "function getMatchCount() external view returns (uint256)",
  "event DonorRegistered(address indexed donor, string name, string bloodType, uint256 timestamp)",
  "event RecipientRegistered(address indexed recipient, string name, string bloodType, string organ, uint256 timestamp)",
  "event DonorVerified(address indexed donor, address indexed verifier, uint256 timestamp)",
  "event MatchCreated(bytes32 indexed matchId, address indexed donor, address indexed recipient, string organ, uint256 matchScore, uint256 timestamp)",
  "event MatchStatusUpdated(bytes32 indexed matchId, string newStatus, uint256 timestamp)",
]

export const MATCHING_ABI = [
  "function addRecipient(string memory _name, string memory _bloodType, string memory _organ, uint256 _urgency) external",
  "function getRecipient(address _recipient) external view returns (string memory name, string memory bloodType, string memory organ, uint256 urgency, bool isActive)",
  "function findCompatibleDonors(address _recipient) external view returns (address[] memory)",
  "function createMatch(address _donor, address _recipient) external",
  "event RecipientAdded(address indexed recipient, string name, string bloodType, string organ)",
  "event MatchCreated(address indexed donor, address indexed recipient, uint256 timestamp)",
]

// Updated contract addresses for BSC Testnet (replace with actual deployed addresses)
export const ORGAN_REGISTRY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
export const MATCHING_CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"

export function getOrganRegistryContract(signer: ethers.Signer) {
  try {
    return new ethers.Contract(ORGAN_REGISTRY_ADDRESS, ORGAN_REGISTRY_ABI, signer)
  } catch (error) {
    console.error("Error creating organ registry contract:", error)
    throw new Error("Failed to create organ registry contract")
  }
}

export function getMatchingContract(signer: ethers.Signer) {
  try {
    return new ethers.Contract(MATCHING_CONTRACT_ADDRESS, MATCHING_ABI, signer)
  } catch (error) {
    console.error("Error creating matching contract:", error)
    throw new Error("Failed to create matching contract")
  }
}
