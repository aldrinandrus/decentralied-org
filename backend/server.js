const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File paths
const GREENFIELD_FILE = path.join(__dirname, 'greenfield.json');
const BACKUP_FILE = path.join(__dirname, 'backup.json');

// Initialize storage files
async function initializeStorage() {
  const defaultData = {
    donors: [],
    recipients: [],
    matches: [],
    metadata: {
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalDonors: 0,
      totalRecipients: 0,
      totalMatches: 0
    }
  };

  try {
    // Check if greenfield.json exists
    try {
      await fs.access(GREENFIELD_FILE);
    } catch {
      await fs.writeFile(GREENFIELD_FILE, JSON.stringify(defaultData, null, 2));
      console.log('✅ Created greenfield.json');
    }

    // Check if backup.json exists
    try {
      await fs.access(BACKUP_FILE);
    } catch {
      await fs.writeFile(BACKUP_FILE, JSON.stringify(defaultData, null, 2));
      console.log('✅ Created backup.json');
    }
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  }
}

// Helper functions for file operations
async function readGreenfieldData() {
  try {
    const data = await fs.readFile(GREENFIELD_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading Greenfield data:', error);
    return { donors: [], recipients: [], matches: [], metadata: {} };
  }
}

async function writeGreenfieldData(data) {
  try {
    data.metadata.lastUpdated = new Date().toISOString();
    await fs.writeFile(GREENFIELD_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing Greenfield data:', error);
    throw error;
  }
}

async function readBackupData() {
  try {
    const data = await fs.readFile(BACKUP_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading backup data:', error);
    return { donors: [], recipients: [], matches: [], metadata: {} };
  }
}

async function writeBackupData(data) {
  try {
    data.metadata.lastUpdated = new Date().toISOString();
    await fs.writeFile(BACKUP_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing backup data:', error);
    throw error;
  }
}

// Matching logic
function findMatches(donors, recipients) {
  const matches = [];

  for (const donor of donors) {
    if (!donor.isActive || !donor.isVerified) continue;

    for (const recipient of recipients) {
      if (!recipient.isActive) continue;

      // Check blood type compatibility
      const isBloodCompatible = checkBloodCompatibility(donor.bloodType, recipient.bloodType);
      
      // Check organ compatibility
      const hasMatchingOrgan = donor.organs.some(organ => 
        organ.toLowerCase() === recipient.organ.toLowerCase()
      );

      if (isBloodCompatible && hasMatchingOrgan) {
        // Calculate match score
        const matchScore = calculateMatchScore(donor, recipient);
        
        // Check if match already exists
        const existingMatch = matches.find(m => 
          m.donorId === donor.id && m.recipientId === recipient.id
        );

        if (!existingMatch) {
          matches.push({
            id: `match_${donor.id}_${recipient.id}_${Date.now()}`,
            donorId: donor.id,
            recipientId: recipient.id,
            donorName: donor.name,
            recipientName: recipient.name,
            organ: recipient.organ,
            donorBloodType: donor.bloodType,
            recipientBloodType: recipient.bloodType,
            matchScore: matchScore,
            compatibility: {
              bloodType: isBloodCompatible,
              organ: hasMatchingOrgan,
              location: donor.location === recipient.location,
              urgency: recipient.urgency
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          });
        }
      }
    }
  }

  return matches;
}

function checkBloodCompatibility(donorBlood, recipientBlood) {
  // Universal donor (O-) can donate to anyone
  if (donorBlood === 'O-') return true;
  
  // Universal recipient (AB+) can receive from anyone
  if (recipientBlood === 'AB+') return true;
  
  // Same blood type
  if (donorBlood === recipientBlood) return true;
  
  // O+ can donate to A+, B+, AB+
  if (donorBlood === 'O+' && ['A+', 'B+', 'AB+'].includes(recipientBlood)) return true;
  
  // A- can donate to A+, A-, AB+, AB-
  if (donorBlood === 'A-' && ['A+', 'A-', 'AB+', 'AB-'].includes(recipientBlood)) return true;
  
  // A+ can donate to A+, AB+
  if (donorBlood === 'A+' && ['A+', 'AB+'].includes(recipientBlood)) return true;
  
  // B- can donate to B+, B-, AB+, AB-
  if (donorBlood === 'B-' && ['B+', 'B-', 'AB+', 'AB-'].includes(recipientBlood)) return true;
  
  // B+ can donate to B+, AB+
  if (donorBlood === 'B+' && ['B+', 'AB+'].includes(recipientBlood)) return true;
  
  // AB- can donate to AB+, AB-
  if (donorBlood === 'AB-' && ['AB+', 'AB-'].includes(recipientBlood)) return true;
  
  return false;
}

function calculateMatchScore(donor, recipient) {
  let score = 0;
  
  // Blood type compatibility (exact match = 100, compatible = 80)
  if (donor.bloodType === recipient.bloodType) {
    score += 100;
  } else if (checkBloodCompatibility(donor.bloodType, recipient.bloodType)) {
    score += 80;
  }
  
  // Organ match (100 points)
  const hasOrgan = donor.organs.some(organ => 
    organ.toLowerCase() === recipient.organ.toLowerCase()
  );
  if (hasOrgan) {
    score += 100;
  }
  
  // Location proximity (0-20 points)
  if (donor.location === recipient.location) {
    score += 20;
  } else if (donor.location && recipient.location) {
    // Same state/region
    const donorState = donor.location.split(',')[1]?.trim();
    const recipientState = recipient.location.split(',')[1]?.trim();
    if (donorState === recipientState) {
      score += 10;
    }
  }
  
  // Urgency bonus (0-30 points)
  if (recipient.urgency) {
    score += recipient.urgency * 6;
  }
  
  // Age compatibility (0-10 points)
  if (donor.age && recipient.age) {
    const ageDiff = Math.abs(donor.age - recipient.age);
    if (ageDiff <= 10) {
      score += 10;
    } else if (ageDiff <= 20) {
      score += 5;
    }
  }
  
  return Math.min(score, 100);
}

// API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Organ Donation Matching Backend'
  });
});

// Register donor
app.post('/api/donors', async (req, res) => {
  try {
    const {
      name,
      bloodType,
      organs,
      age,
      location,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      walletAddress
    } = req.body;

    // Validation
    if (!name || !bloodType || !organs || !Array.isArray(organs) || organs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, bloodType, and organs are required'
      });
    }

    // Create donor object
    const donor = {
      id: `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      bloodType,
      organs,
      age: age || null,
      location: location || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      medicalHistory: medicalHistory || '',
      walletAddress: walletAddress || '',
      isActive: true,
      isVerified: false, // Will be verified by medical professionals
      registrationDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Read current data
    const greenfieldData = await readGreenfieldData();
    const backupData = await readBackupData();

    // Check for duplicate registration
    const existingDonor = greenfieldData.donors.find(d => 
      d.walletAddress === walletAddress || 
      (d.name === name && d.bloodType === bloodType)
    );

    if (existingDonor) {
      return res.status(409).json({
        success: false,
        error: 'Donor already registered with this wallet address or details'
      });
    }

    // Add donor to both storage systems
    greenfieldData.donors.push(donor);
    greenfieldData.metadata.totalDonors = greenfieldData.donors.length;

    backupData.donors.push(donor);
    backupData.metadata.totalDonors = backupData.donors.length;

    // Find new matches
    const newMatches = findMatches([donor], greenfieldData.recipients);
    
    // Add new matches to storage
    greenfieldData.matches.push(...newMatches);
    greenfieldData.metadata.totalMatches = greenfieldData.matches.length;

    backupData.matches.push(...newMatches);
    backupData.metadata.totalMatches = backupData.matches.length;

    // Write to files
    await writeGreenfieldData(greenfieldData);
    await writeBackupData(backupData);

    console.log(`✅ New donor registered: ${donor.name} (${donor.bloodType})`);
    if (newMatches.length > 0) {
      console.log(`🤝 Found ${newMatches.length} new matches for donor ${donor.name}`);
    }

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully',
      data: {
        donor: donor,
        newMatches: newMatches,
        matchCount: newMatches.length
      }
    });

  } catch (error) {
    console.error('Error registering donor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register donor',
      details: error.message
    });
  }
});

// Register recipient
app.post('/api/recipients', async (req, res) => {
  try {
    const {
      name,
      bloodType,
      organ,
      urgency,
      age,
      location,
      medicalCondition,
      emergencyContact,
      emergencyPhone,
      walletAddress
    } = req.body;

    // Validation
    if (!name || !bloodType || !organ || !urgency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, bloodType, organ, and urgency are required'
      });
    }

    if (urgency < 1 || urgency > 5) {
      return res.status(400).json({
        success: false,
        error: 'Urgency must be between 1 and 5'
      });
    }

    // Create recipient object
    const recipient = {
      id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      bloodType,
      organ,
      urgency,
      age: age || null,
      location: location || '',
      medicalCondition: medicalCondition || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      walletAddress: walletAddress || '',
      isActive: true,
      registrationDate: new Date().toISOString(),
      waitingSince: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Read current data
    const greenfieldData = await readGreenfieldData();
    const backupData = await readBackupData();

    // Check for duplicate registration
    const existingRecipient = greenfieldData.recipients.find(r => 
      r.walletAddress === walletAddress || 
      (r.name === name && r.bloodType === bloodType && r.organ === organ)
    );

    if (existingRecipient) {
      return res.status(409).json({
        success: false,
        error: 'Recipient already registered with this wallet address or details'
      });
    }

    // Add recipient to both storage systems
    greenfieldData.recipients.push(recipient);
    greenfieldData.metadata.totalRecipients = greenfieldData.recipients.length;

    backupData.recipients.push(recipient);
    backupData.metadata.totalRecipients = backupData.recipients.length;

    // Find new matches
    const newMatches = findMatches(greenfieldData.donors, [recipient]);
    
    // Add new matches to storage
    greenfieldData.matches.push(...newMatches);
    greenfieldData.metadata.totalMatches = greenfieldData.matches.length;

    backupData.matches.push(...newMatches);
    backupData.metadata.totalMatches = backupData.matches.length;

    // Write to files
    await writeGreenfieldData(greenfieldData);
    await writeBackupData(backupData);

    console.log(`✅ New recipient registered: ${recipient.name} (${recipient.bloodType}, ${recipient.organ})`);
    if (newMatches.length > 0) {
      console.log(`🤝 Found ${newMatches.length} new matches for recipient ${recipient.name}`);
    }

    res.status(201).json({
      success: true,
      message: 'Recipient registered successfully',
      data: {
        recipient: recipient,
        newMatches: newMatches,
        matchCount: newMatches.length
      }
    });

  } catch (error) {
    console.error('Error registering recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register recipient',
      details: error.message
    });
  }
});

// Get all matches
app.get('/api/matches', async (req, res) => {
  try {
    const { source = 'greenfield', status, urgency, organ, bloodType } = req.query;

    // Read data from specified source
    let data;
    if (source === 'backup') {
      data = await readBackupData();
    } else {
      data = await readGreenfieldData();
    }

    let matches = data.matches || [];

    // Apply filters
    if (status) {
      matches = matches.filter(match => match.status === status);
    }

    if (urgency) {
      matches = matches.filter(match => match.compatibility.urgency >= parseInt(urgency));
    }

    if (organ) {
      matches = matches.filter(match => 
        match.organ.toLowerCase().includes(organ.toLowerCase())
      );
    }

    if (bloodType) {
      matches = matches.filter(match => 
        match.donorBloodType === bloodType || match.recipientBloodType === bloodType
      );
    }

    // Sort by match score (highest first) and urgency
    matches.sort((a, b) => {
      if (a.compatibility.urgency !== b.compatibility.urgency) {
        return b.compatibility.urgency - a.compatibility.urgency;
      }
      return b.matchScore - a.matchScore;
    });

    res.json({
      success: true,
      data: {
        matches: matches,
        total: matches.length,
        source: source,
        filters: { status, urgency, organ, bloodType },
        metadata: data.metadata
      }
    });

  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve matches',
      details: error.message
    });
  }
});

// Get specific match by ID
app.get('/api/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { source = 'greenfield' } = req.query;

    let data;
    if (source === 'backup') {
      data = await readBackupData();
    } else {
      data = await readGreenfieldData();
    }

    const match = data.matches.find(m => m.id === matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Get detailed donor and recipient information
    const donor = data.donors.find(d => d.id === match.donorId);
    const recipient = data.recipients.find(r => r.id === match.recipientId);

    res.json({
      success: true,
      data: {
        match: match,
        donor: donor,
        recipient: recipient
      }
    });

  } catch (error) {
    console.error('Error getting match details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve match details',
      details: error.message
    });
  }
});

// Update match status
app.put('/api/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'cancelled', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update in both storage systems
    const greenfieldData = await readGreenfieldData();
    const backupData = await readBackupData();

    const greenfieldMatch = greenfieldData.matches.find(m => m.id === matchId);
    const backupMatch = backupData.matches.find(m => m.id === matchId);

    if (!greenfieldMatch || !backupMatch) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Update match status
    const updateData = {
      status: status,
      lastUpdated: new Date().toISOString(),
      ...(notes && { notes: notes })
    };

    Object.assign(greenfieldMatch, updateData);
    Object.assign(backupMatch, updateData);

    // Write to files
    await writeGreenfieldData(greenfieldData);
    await writeBackupData(backupData);

    console.log(`✅ Match ${matchId} status updated to: ${status}`);

    res.json({
      success: true,
      message: 'Match status updated successfully',
      data: {
        match: greenfieldMatch
      }
    });

  } catch (error) {
    console.error('Error updating match status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update match status',
      details: error.message
    });
  }
});

// Get all donors
app.get('/api/donors', async (req, res) => {
  try {
    const { source = 'greenfield', verified, active, bloodType } = req.query;

    let data;
    if (source === 'backup') {
      data = await readBackupData();
    } else {
      data = await readGreenfieldData();
    }

    let donors = data.donors || [];

    // Apply filters
    if (verified !== undefined) {
      donors = donors.filter(donor => donor.isVerified === (verified === 'true'));
    }

    if (active !== undefined) {
      donors = donors.filter(donor => donor.isActive === (active === 'true'));
    }

    if (bloodType) {
      donors = donors.filter(donor => donor.bloodType === bloodType);
    }

    res.json({
      success: true,
      data: {
        donors: donors,
        total: donors.length,
        source: source
      }
    });

  } catch (error) {
    console.error('Error getting donors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve donors',
      details: error.message
    });
  }
});

// Get all recipients
app.get('/api/recipients', async (req, res) => {
  try {
    const { source = 'greenfield', active, organ, urgency } = req.query;

    let data;
    if (source === 'backup') {
      data = await readBackupData();
    } else {
      data = await readGreenfieldData();
    }

    let recipients = data.recipients || [];

    // Apply filters
    if (active !== undefined) {
      recipients = recipients.filter(recipient => recipient.isActive === (active === 'true'));
    }

    if (organ) {
      recipients = recipients.filter(recipient => 
        recipient.organ.toLowerCase().includes(organ.toLowerCase())
      );
    }

    if (urgency) {
      recipients = recipients.filter(recipient => recipient.urgency >= parseInt(urgency));
    }

    // Sort by urgency (highest first) and waiting time
    recipients.sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return b.urgency - a.urgency;
      }
      return new Date(a.waitingSince) - new Date(b.waitingSince);
    });

    res.json({
      success: true,
      data: {
        recipients: recipients,
        total: recipients.length,
        source: source
      }
    });

  } catch (error) {
    console.error('Error getting recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recipients',
      details: error.message
    });
  }
});

// Get system statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { source = 'greenfield' } = req.query;

    let data;
    if (source === 'backup') {
      data = await readBackupData();
    } else {
      data = await readGreenfieldData();
    }

    const stats = {
      totalDonors: data.donors?.length || 0,
      totalRecipients: data.recipients?.length || 0,
      totalMatches: data.matches?.length || 0,
      verifiedDonors: data.donors?.filter(d => d.isVerified).length || 0,
      activeDonors: data.donors?.filter(d => d.isActive).length || 0,
      activeRecipients: data.recipients?.filter(r => r.isActive).length || 0,
      pendingMatches: data.matches?.filter(m => m.status === 'pending').length || 0,
      completedMatches: data.matches?.filter(m => m.status === 'completed').length || 0,
      bloodTypeDistribution: {},
      organDistribution: {},
      urgencyDistribution: {},
      source: source,
      lastUpdated: data.metadata?.lastUpdated || new Date().toISOString()
    };

    // Calculate blood type distribution
    data.donors?.forEach(donor => {
      stats.bloodTypeDistribution[donor.bloodType] = 
        (stats.bloodTypeDistribution[donor.bloodType] || 0) + 1;
    });

    // Calculate organ distribution
    data.recipients?.forEach(recipient => {
      stats.organDistribution[recipient.organ] = 
        (stats.organDistribution[recipient.organ] || 0) + 1;
    });

    // Calculate urgency distribution
    data.recipients?.forEach(recipient => {
      stats.urgencyDistribution[recipient.urgency] = 
        (stats.urgencyDistribution[recipient.urgency] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      details: error.message
    });
  }
});

// Trigger manual matching
app.post('/api/matches/refresh', async (req, res) => {
  try {
    // Read current data
    const greenfieldData = await readGreenfieldData();
    const backupData = await readBackupData();

    // Find all possible matches
    const allMatches = findMatches(greenfieldData.donors, greenfieldData.recipients);
    
    // Filter out existing matches
    const existingMatchKeys = new Set(
      greenfieldData.matches.map(m => `${m.donorId}_${m.recipientId}`)
    );
    
    const newMatches = allMatches.filter(match => 
      !existingMatchKeys.has(`${match.donorId}_${match.recipientId}`)
    );

    // Add new matches to storage
    greenfieldData.matches.push(...newMatches);
    greenfieldData.metadata.totalMatches = greenfieldData.matches.length;

    backupData.matches.push(...newMatches);
    backupData.metadata.totalMatches = backupData.matches.length;

    // Write to files
    await writeGreenfieldData(greenfieldData);
    await writeBackupData(backupData);

    console.log(`🔄 Manual matching refresh completed. Found ${newMatches.length} new matches.`);

    res.json({
      success: true,
      message: 'Matching refresh completed',
      data: {
        newMatches: newMatches,
        newMatchCount: newMatches.length,
        totalMatches: greenfieldData.matches.length
      }
    });

  } catch (error) {
    console.error('Error refreshing matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh matches',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/donors',
      'POST /api/recipients',
      'GET /api/matches',
      'GET /api/matches/:matchId',
      'PUT /api/matches/:matchId',
      'GET /api/donors',
      'GET /api/recipients',
      'GET /api/stats',
      'POST /api/matches/refresh',
      'GET /health'
    ]
  });
});

// Initialize and start server
async function startServer() {
  try {
    await initializeStorage();
    
    app.listen(PORT, () => {
      console.log(`🚀 Organ Donation Matching Backend running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🤝 Matches endpoint: http://localhost:${PORT}/api/matches`);
      console.log(`👥 Donors endpoint: http://localhost:${PORT}/api/donors`);
      console.log(`🏥 Recipients endpoint: http://localhost:${PORT}/api/recipients`);
      console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/stats`);
      console.log(`💾 Storage: Greenfield simulation + Local backup`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;