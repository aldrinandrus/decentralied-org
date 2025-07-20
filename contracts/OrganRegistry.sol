// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract OrganRegistry is Ownable, ReentrancyGuard, Pausable {
    struct Donor {
        string name;
        string bloodType;
        string[] organs;
        string medicalHash; // IPFS hash of medical documents
        bool isVerified;
        bool isActive;
        uint256 registrationTime;
        address donorAddress;
        string emergencyContact;
        string location;
    }

    struct Recipient {
        string name;
        string bloodType;
        string organ;
        uint256 urgency; // 1-5 scale (5 being most urgent)
        bool isActive;
        uint256 registrationTime;
        address recipientAddress;
        string medicalCondition;
        string location;
        uint256 waitingSince;
    }

    struct Match {
        address donor;
        address recipient;
        string organ;
        uint256 matchScore;
        uint256 timestamp;
        bool isActive;
        string status; // "pending", "approved", "completed", "cancelled"
    }

    // State variables
    mapping(address => Donor) public donors;
    mapping(address => Recipient) public recipients;
    mapping(bytes32 => Match) public matches;
    mapping(string => address[]) public donorsByBloodType;
    mapping(string => address[]) public recipientsByOrgan;
    mapping(address => bool) public verifiers; // Medical professionals
    mapping(address => bytes32[]) public userMatches;
    
    address[] public allDonors;
    address[] public allRecipients;
    bytes32[] public allMatches;
    
    uint256 public totalDonors;
    uint256 public totalRecipients;
    uint256 public totalMatches;
    uint256 public successfulTransplants;

    // Events
    event DonorRegistered(address indexed donor, string name, string bloodType, uint256 timestamp);
    event RecipientRegistered(address indexed recipient, string name, string bloodType, string organ, uint256 timestamp);
    event DonorVerified(address indexed donor, address indexed verifier, uint256 timestamp);
    event MatchCreated(bytes32 indexed matchId, address indexed donor, address indexed recipient, string organ, uint256 matchScore, uint256 timestamp);
    event MatchStatusUpdated(bytes32 indexed matchId, string newStatus, uint256 timestamp);
    event DonorStatusChanged(address indexed donor, bool isActive, uint256 timestamp);
    event RecipientStatusChanged(address indexed recipient, bool isActive, uint256 timestamp);
    event VerifierAdded(address indexed verifier, uint256 timestamp);
    event VerifierRemoved(address indexed verifier, uint256 timestamp);
    event EmergencyAction(address indexed user, string action, uint256 timestamp);

    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Only verifiers can call this function");
        _;
    }

    modifier onlyRegisteredDonor() {
        require(donors[msg.sender].registrationTime > 0, "Not a registered donor");
        _;
    }

    modifier onlyRegisteredRecipient() {
        require(recipients[msg.sender].registrationTime > 0, "Not a registered recipient");
        _;
    }

    constructor() {
        verifiers[msg.sender] = true;
    }

    // Admin functions
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier, block.timestamp);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Donor functions
    function registerDonor(
        string memory _name,
        string memory _bloodType,
        string[] memory _organs,
        string memory _medicalHash,
        string memory _emergencyContact,
        string memory _location
    ) external whenNotPaused nonReentrant {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_bloodType).length > 0, "Blood type cannot be empty");
        require(_organs.length > 0, "At least one organ must be specified");
        require(donors[msg.sender].registrationTime == 0, "Donor already registered");

        donors[msg.sender] = Donor({
            name: _name,
            bloodType: _bloodType,
            organs: _organs,
            medicalHash: _medicalHash,
            isVerified: false,
            isActive: true,
            registrationTime: block.timestamp,
            donorAddress: msg.sender,
            emergencyContact: _emergencyContact,
            location: _location
        });

        allDonors.push(msg.sender);
        donorsByBloodType[_bloodType].push(msg.sender);
        totalDonors++;

        emit DonorRegistered(msg.sender, _name, _bloodType, block.timestamp);
    }

    function registerRecipient(
        string memory _name,
        string memory _bloodType,
        string memory _organ,
        uint256 _urgency,
        string memory _medicalCondition,
        string memory _location
    ) external whenNotPaused nonReentrant {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_bloodType).length > 0, "Blood type cannot be empty");
        require(bytes(_organ).length > 0, "Organ cannot be empty");
        require(_urgency >= 1 && _urgency <= 5, "Urgency must be between 1 and 5");
        require(recipients[msg.sender].registrationTime == 0, "Recipient already registered");

        recipients[msg.sender] = Recipient({
            name: _name,
            bloodType: _bloodType,
            organ: _organ,
            urgency: _urgency,
            isActive: true,
            registrationTime: block.timestamp,
            recipientAddress: msg.sender,
            medicalCondition: _medicalCondition,
            location: _location,
            waitingSince: block.timestamp
        });

        allRecipients.push(msg.sender);
        recipientsByOrgan[_organ].push(msg.sender);
        totalRecipients++;

        emit RecipientRegistered(msg.sender, _name, _bloodType, _organ, block.timestamp);
    }

    function verifyDonor(address _donor) external onlyVerifier whenNotPaused {
        require(donors[_donor].registrationTime > 0, "Donor not registered");
        require(!donors[_donor].isVerified, "Donor already verified");

        donors[_donor].isVerified = true;
        emit DonorVerified(_donor, msg.sender, block.timestamp);
    }

    function createMatch(
        address _donor,
        address _recipient,
        string memory _organ
    ) external onlyVerifier whenNotPaused nonReentrant returns (bytes32) {
        require(donors[_donor].isVerified && donors[_donor].isActive, "Donor not verified or inactive");
        require(recipients[_recipient].isActive, "Recipient not active");
        
        // Verify compatibility
        require(
            keccak256(bytes(donors[_donor].bloodType)) == keccak256(bytes(recipients[_recipient].bloodType)),
            "Blood type incompatible"
        );
        
        // Check if donor has the required organ
        bool hasOrgan = false;
        for (uint i = 0; i < donors[_donor].organs.length; i++) {
            if (keccak256(bytes(donors[_donor].organs[i])) == keccak256(bytes(_organ))) {
                hasOrgan = true;
                break;
            }
        }
        require(hasOrgan, "Donor doesn't have the required organ");

        // Calculate match score (simplified algorithm)
        uint256 matchScore = calculateMatchScore(_donor, _recipient);
        
        bytes32 matchId = keccak256(abi.encodePacked(_donor, _recipient, _organ, block.timestamp));
        
        matches[matchId] = Match({
            donor: _donor,
            recipient: _recipient,
            organ: _organ,
            matchScore: matchScore,
            timestamp: block.timestamp,
            isActive: true,
            status: "pending"
        });

        allMatches.push(matchId);
        userMatches[_donor].push(matchId);
        userMatches[_recipient].push(matchId);
        totalMatches++;

        emit MatchCreated(matchId, _donor, _recipient, _organ, matchScore, block.timestamp);
        return matchId;
    }

    function updateMatchStatus(bytes32 _matchId, string memory _newStatus) external onlyVerifier {
        require(matches[_matchId].timestamp > 0, "Match does not exist");
        
        matches[_matchId].status = _newStatus;
        
        if (keccak256(bytes(_newStatus)) == keccak256(bytes("completed"))) {
            successfulTransplants++;
            // Deactivate both donor and recipient for this organ
            donors[matches[_matchId].donor].isActive = false;
            recipients[matches[_matchId].recipient].isActive = false;
        }
        
        emit MatchStatusUpdated(_matchId, _newStatus, block.timestamp);
    }

    function calculateMatchScore(address _donor, address _recipient) internal view returns (uint256) {
        uint256 score = 100; // Base score
        
        // Add urgency bonus
        score += recipients[_recipient].urgency * 10;
        
        // Add waiting time bonus
        uint256 waitingDays = (block.timestamp - recipients[_recipient].waitingSince) / 86400;
        score += waitingDays / 30; // 1 point per month waiting
        
        // Location proximity bonus (simplified)
        if (keccak256(bytes(donors[_donor].location)) == keccak256(bytes(recipients[_recipient].location))) {
            score += 20;
        }
        
        return score;
    }

    // View functions
    function getDonor(address _donor) external view returns (
        string memory name,
        string memory bloodType,
        string[] memory organs,
        string memory medicalHash,
        bool isVerified,
        bool isActive,
        uint256 registrationTime,
        string memory emergencyContact,
        string memory location
    ) {
        Donor memory donor = donors[_donor];
        return (
            donor.name,
            donor.bloodType,
            donor.organs,
            donor.medicalHash,
            donor.isVerified,
            donor.isActive,
            donor.registrationTime,
            donor.emergencyContact,
            donor.location
        );
    }

    function getRecipient(address _recipient) external view returns (
        string memory name,
        string memory bloodType,
        string memory organ,
        uint256 urgency,
        bool isActive,
        uint256 registrationTime,
        string memory medicalCondition,
        string memory location,
        uint256 waitingSince
    ) {
        Recipient memory recipient = recipients[_recipient];
        return (
            recipient.name,
            recipient.bloodType,
            recipient.organ,
            recipient.urgency,
            recipient.isActive,
            recipient.registrationTime,
            recipient.medicalCondition,
            recipient.location,
            recipient.waitingSince
        );
    }

    function getMatch(bytes32 _matchId) external view returns (
        address donor,
        address recipient,
        string memory organ,
        uint256 matchScore,
        uint256 timestamp,
        bool isActive,
        string memory status
    ) {
        Match memory matchData = matches[_matchId];
        return (
            matchData.donor,
            matchData.recipient,
            matchData.organ,
            matchData.matchScore,
            matchData.timestamp,
            matchData.isActive,
            matchData.status
        );
    }

    function findCompatibleDonors(string memory _bloodType, string memory _organ) 
        external view returns (address[] memory) {
        address[] memory potentialDonors = donorsByBloodType[_bloodType];
        address[] memory compatibleDonors = new address[](potentialDonors.length);
        uint256 count = 0;

        for (uint256 i = 0; i < potentialDonors.length; i++) {
            address donorAddr = potentialDonors[i];
            Donor memory donor = donors[donorAddr];
            
            if (donor.isVerified && donor.isActive) {
                for (uint256 j = 0; j < donor.organs.length; j++) {
                    if (keccak256(bytes(donor.organs[j])) == keccak256(bytes(_organ))) {
                        compatibleDonors[count] = donorAddr;
                        count++;
                        break;
                    }
                }
            }
        }

        // Resize array to actual count
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = compatibleDonors[i];
        }

        return result;
    }

    function getUserMatches(address _user) external view returns (bytes32[] memory) {
        return userMatches[_user];
    }

    function getContractStats() external view returns (
        uint256 _totalDonors,
        uint256 _totalRecipients,
        uint256 _totalMatches,
        uint256 _successfulTransplants,
        uint256 _verifiedDonors
    ) {
        uint256 verifiedCount = 0;
        for (uint256 i = 0; i < allDonors.length; i++) {
            if (donors[allDonors[i]].isVerified) {
                verifiedCount++;
            }
        }
        
        return (totalDonors, totalRecipients, totalMatches, successfulTransplants, verifiedCount);
    }

    // Emergency functions
    function emergencyDeactivateDonor(address _donor) external onlyOwner {
        donors[_donor].isActive = false;
        emit EmergencyAction(_donor, "donor_deactivated", block.timestamp);
    }

    function emergencyDeactivateRecipient(address _recipient) external onlyOwner {
        recipients[_recipient].isActive = false;
        emit EmergencyAction(_recipient, "recipient_deactivated", block.timestamp);
    }

    // Self-management functions
    function updateDonorStatus(bool _isActive) external onlyRegisteredDonor {
        donors[msg.sender].isActive = _isActive;
        emit DonorStatusChanged(msg.sender, _isActive, block.timestamp);
    }

    function updateRecipientStatus(bool _isActive) external onlyRegisteredRecipient {
        recipients[msg.sender].isActive = _isActive;
        emit RecipientStatusChanged(msg.sender, _isActive, block.timestamp);
    }

    function updateDonorMedicalHash(string memory _newMedicalHash) external onlyRegisteredDonor {
        require(bytes(_newMedicalHash).length > 0, "Medical hash cannot be empty");
        donors[msg.sender].medicalHash = _newMedicalHash;
    }
}
