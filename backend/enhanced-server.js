const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Storage files
const dataFile = path.join(__dirname, 'organ-donation-data.json');

// Initialize storage
const initializeStorage = () => {
  const initialData = {
    donors: [],
    recipients: [],
    matches: [],
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalDonors: 0,
      totalRecipients: 0,
      totalMatches: 0,
      successfulTransplants: 0
    }
  };

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
    console.log('✅ Initialized storage file');
  }
};

// Helper functions
const readData = () => {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { donors: [], recipients: [], matches: [], metadata: {} };
  }
};

const writeData = (data) => {
  try {
    data.metadata.lastUpdated = new Date().toISOString();
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

// Blood type compatibility checker
const isBloodTypeCompatible = (donorType, recipientType) => {
  const compatibility = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };
  
  return compatibility[donorType]?.includes(recipientType) || false;
};

// Calculate match score
const calculateMatchScore = (donor, recipient) => {
  let score = 0;
  
  // Blood type compatibility (40 points)
  if (donor.bloodType === recipient.bloodType) {
    score += 40;
  } else if (isBloodTypeCompatible(donor.bloodType, recipient.bloodType)) {
    score += 30;
  }
  
  // Organ availability (30 points)
  if (donor.organs.includes(recipient.organ)) {
    score += 30;
  }
  
  // Location proximity (15 points)
  if (donor.location === recipient.location) {
    score += 15;
  } else if (donor.location.split(',')[1]?.trim() === recipient.location.split(',')[1]?.trim()) {
    score += 8;
  }
  
  // Age compatibility (10 points)
  const ageDiff = Math.abs(donor.age - recipient.age);
  if (ageDiff <= 10) score += 10;
  else if (ageDiff <= 20) score += 5;
  
  // Urgency factor (5 points)
  score += recipient.urgency;
  
  return Math.min(score, 100);
};

// Calculate priority
const calculateDonorPriority = (donor) => {
  let priority = 100;
  
  if (donor.age <= 30) priority += 20;
  else if (donor.age <= 45) priority += 10;
  else if (donor.age <= 60) priority += 5;
  
  priority += donor.organs.length * 5;
  
  if (!donor.medicalHistory || donor.medicalHistory.toLowerCase().includes('healthy')) {
    priority += 15;
  }
  
  return Math.min(priority, 200);
};

const calculateRecipientPriority = (recipient) => {
  let priority = 100;
  
  priority += recipient.urgency * 30;
  
  if (recipient.age <= 18) priority += 25;
  else if (recipient.age <= 35) priority += 15;
  else if (recipient.age <= 50) priority += 10;
  
  // Waiting time bonus
  const waitingDays = Math.floor((Date.now() - new Date(recipient.waitingSince).getTime()) / (1000 * 60 * 60 * 24));
  priority += Math.floor(waitingDays / 30); // 1 point per month
  
  return Math.min(priority, 300);
};

// Find and create matches
const findAndCreateMatches = (data, newDonor = null, newRecipient = null) => {
  const newMatches = [];
  
  if (newDonor) {
    // Find recipients for new donor
    data.recipients.forEach(recipient => {
      if (recipient.isActive && 
          isBloodTypeCompatible(newDonor.bloodType, recipient.bloodType) &&
          newDonor.organs.includes(recipient.organ)) {
        
        const matchScore = calculateMatchScore(newDonor, recipient);
        const match = {
          id: `match_${newDonor.id}_${recipient.id}_${Date.now()}`,
          donorId: newDonor.id,
          recipientId: recipient.id,
          donorName: newDonor.name,
          recipientName: recipient.name,
          organ: recipient.organ,
          bloodType: recipient.bloodType,
          matchScore,
          compatibility: {
            bloodType: isBloodTypeCompatible(newDonor.bloodType, recipient.bloodType),
            organ: newDonor.organs.includes(recipient.organ),
            location: newDonor.location === recipient.location,
            age: Math.abs(newDonor.age - recipient.age) <= 20
          },
          priority: recipient.priority + matchScore,
          status: 'pending',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        newMatches.push(match);
      }
    });
  }
  
  if (newRecipient) {
    // Find donors for new recipient
    data.donors.forEach(donor => {
      if (donor.isActive && donor.isVerified &&
          isBloodTypeCompatible(donor.bloodType, newRecipient.bloodType) &&
          donor.organs.includes(newRecipient.organ)) {
        
        const matchScore = calculateMatchScore(donor, newRecipient);
        const match = {
          id: `match_${donor.id}_${newRecipient.id}_${Date.now()}`,
          donorId: donor.id,
          recipientId: newRecipient.id,
          donorName: donor.name,
          recipientName: newRecipient.name,
          organ: newRecipient.organ,
          bloodType: newRecipient.bloodType,
          matchScore,
          compatibility: {
            bloodType: isBloodTypeCompatible(donor.bloodType, newRecipient.bloodType),
            organ: donor.organs.includes(newRecipient.organ),
            location: donor.location === newRecipient.location,
            age: Math.abs(donor.age - newRecipient.age) <= 20
          },
          priority: newRecipient.priority + matchScore,
          status: 'pending',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        newMatches.push(match);
      }
    });
  }
  
  return newMatches;
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Enhanced Organ Donation Matching System API',
    version: '2.0.0',
    features: [
      'Dual storage (localhost + Greenfield)',
      'Priority-based matching',
      'Real-time compatibility checking',
      'Advanced filtering and sorting'
    ],
    endpoints: {
      'POST /api/donors': 'Register a new donor',
      'POST /api/recipients': 'Register a new recipient',
      'GET /api/donors': 'Get all donors with filtering',
      'GET /api/recipients': 'Get all recipients with filtering',
      'GET /api/matches': 'Get all matches sorted by priority',
      'GET /api/stats': 'Get system statistics'
    }
  });
});

// Register donor
app.post('/api/donors', (req, res) => {
  try {
    const donorData = req.body;
    
    // Validation
    if (!donorData.name || !donorData.bloodType || !donorData.organs || !Array.isArray(donorData.organs)) {
      return res.status(400).json({ error: 'Missing required fields: name, bloodType, organs' });
    }
    
    const data = readData();
    
    // Check for duplicate
    const existingDonor = data.donors.find(d => d.walletAddress === donorData.walletAddress);
    if (existingDonor) {
      return res.status(409).json({ error: 'Donor already registered with this wallet address' });
    }
    
    // Create donor with calculated priority
    const donor = {
      ...donorData,
      id: donorData.id || `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      priority: calculateDonorPriority(donorData),
      registrationDate: donorData.registrationDate || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    data.donors.push(donor);
    data.metadata.totalDonors = data.donors.length;
    
    // Find and create matches
    const newMatches = findAndCreateMatches(data, donor);
    data.matches.push(...newMatches);
    data.metadata.totalMatches = data.matches.length;
    
    writeData(data);
    
    console.log(`✅ Donor registered: ${donor.name} (${donor.bloodType}) - ${newMatches.length} new matches found`);
    
    res.status(201).json({
      success: true,
      donor,
      newMatches: newMatches.length,
      matches: newMatches
    });
    
  } catch (error) {
    console.error('Error registering donor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register recipient
app.post('/api/recipients', (req, res) => {
  try {
    const recipientData = req.body;
    
    // Validation
    if (!recipientData.name || !recipientData.bloodType || !recipientData.organ) {
      return res.status(400).json({ error: 'Missing required fields: name, bloodType, organ' });
    }
    
    const data = readData();
    
    // Check for duplicate
    const existingRecipient = data.recipients.find(r => r.walletAddress === recipientData.walletAddress);
    if (existingRecipient) {
      return res.status(409).json({ error: 'Recipient already registered with this wallet address' });
    }
    
    // Create recipient with calculated priority
    const recipient = {
      ...recipientData,
      id: recipientData.id || `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      priority: calculateRecipientPriority(recipientData),
      registrationDate: recipientData.registrationDate || new Date().toISOString(),
      waitingSince: recipientData.waitingSince || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    data.recipients.push(recipient);
    data.metadata.totalRecipients = data.recipients.length;
    
    // Find and create matches
    const newMatches = findAndCreateMatches(data, null, recipient);
    data.matches.push(...newMatches);
    data.metadata.totalMatches = data.matches.length;
    
    writeData(data);
    
    console.log(`✅ Recipient registered: ${recipient.name} (${recipient.bloodType}, ${recipient.organ}) - ${newMatches.length} new matches found`);
    
    res.status(201).json({
      success: true,
      recipient,
      newMatches: newMatches.length,
      matches: newMatches
    });
    
  } catch (error) {
    console.error('Error registering recipient:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get donors with filtering
app.get('/api/donors', (req, res) => {
  try {
    const { bloodType, organ, location, verified, active, limit = 50, offset = 0 } = req.query;
    const data = readData();
    
    let filteredDonors = data.donors;
    
    // Apply filters
    if (bloodType) {
      filteredDonors = filteredDonors.filter(d => d.bloodType === bloodType);
    }
    
    if (organ) {
      filteredDonors = filteredDonors.filter(d => d.organs.includes(organ));
    }
    
    if (location) {
      filteredDonors = filteredDonors.filter(d => 
        d.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (verified !== undefined) {
      filteredDonors = filteredDonors.filter(d => d.isVerified === (verified === 'true'));
    }
    
    if (active !== undefined) {
      filteredDonors = filteredDonors.filter(d => d.isActive === (active === 'true'));
    }
    
    // Sort by priority (highest first)
    filteredDonors.sort((a, b) => b.priority - a.priority);
    
    // Apply pagination
    const paginatedDonors = filteredDonors.slice(Number(offset), Number(offset) + Number(limit));
    
    res.json({
      success: true,
      donors: paginatedDonors,
      total: filteredDonors.length,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < filteredDonors.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recipients with filtering
app.get('/api/recipients', (req, res) => {
  try {
    const { bloodType, organ, location, urgency, active, limit = 50, offset = 0 } = req.query;
    const data = readData();
    
    let filteredRecipients = data.recipients;
    
    // Apply filters
    if (bloodType) {
      filteredRecipients = filteredRecipients.filter(r => r.bloodType === bloodType);
    }
    
    if (organ) {
      filteredRecipients = filteredRecipients.filter(r => r.organ === organ);
    }
    
    if (location) {
      filteredRecipients = filteredRecipients.filter(r => 
        r.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (urgency) {
      filteredRecipients = filteredRecipients.filter(r => r.urgency >= Number(urgency));
    }
    
    if (active !== undefined) {
      filteredRecipients = filteredRecipients.filter(r => r.isActive === (active === 'true'));
    }
    
    // Sort by priority (highest first)
    filteredRecipients.sort((a, b) => b.priority - a.priority);
    
    // Apply pagination
    const paginatedRecipients = filteredRecipients.slice(Number(offset), Number(offset) + Number(limit));
    
    res.json({
      success: true,
      recipients: paginatedRecipients,
      total: filteredRecipients.length,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < filteredRecipients.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get matches with filtering and priority sorting
app.get('/api/matches', (req, res) => {
  try {
    const { bloodType, organ, status, urgency, userId, limit = 50, offset = 0 } = req.query;
    const data = readData();
    
    let filteredMatches = data.matches;
    
    // Apply filters
    if (bloodType) {
      filteredMatches = filteredMatches.filter(m => m.bloodType === bloodType);
    }
    
    if (organ) {
      filteredMatches = filteredMatches.filter(m => m.organ === organ);
    }
    
    if (status) {
      filteredMatches = filteredMatches.filter(m => m.status === status);
    }
    
    if (urgency) {
      // Find recipient and check urgency
      filteredMatches = filteredMatches.filter(m => {
        const recipient = data.recipients.find(r => r.id === m.recipientId);
        return recipient && recipient.urgency >= Number(urgency);
      });
    }
    
    if (userId) {
      filteredMatches = filteredMatches.filter(m => 
        m.donorId === userId || m.recipientId === userId
      );
    }
    
    // Sort by priority (highest first), then by match score
    filteredMatches.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.matchScore - a.matchScore;
    });
    
    // Apply pagination
    const paginatedMatches = filteredMatches.slice(Number(offset), Number(offset) + Number(limit));
    
    res.json({
      success: true,
      matches: paginatedMatches,
      total: filteredMatches.length,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < filteredMatches.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create match endpoint
app.post('/api/matches', (req, res) => {
  try {
    const matchData = req.body;
    const data = readData();
    
    data.matches.push(matchData);
    data.metadata.totalMatches = data.matches.length;
    
    writeData(data);
    
    res.status(201).json({
      success: true,
      match: matchData
    });
    
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update match status
app.put('/api/matches/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const { status, lastUpdated } = req.body;
    const data = readData();
    
    const matchIndex = data.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    data.matches[matchIndex].status = status;
    data.matches[matchIndex].lastUpdated = lastUpdated || new Date().toISOString();
    
    if (status === 'completed') {
      data.metadata.successfulTransplants = (data.metadata.successfulTransplants || 0) + 1;
    }
    
    writeData(data);
    
    res.json({
      success: true,
      match: data.matches[matchIndex]
    });
    
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system statistics
app.get('/api/stats', (req, res) => {
  try {
    const data = readData();
    
    const stats = {
      totalDonors: data.donors.length,
      totalRecipients: data.recipients.length,
      totalMatches: data.matches.length,
      pendingMatches: data.matches.filter(m => m.status === 'pending').length,
      completedMatches: data.matches.filter(m => m.status === 'completed').length,
      verifiedDonors: data.donors.filter(d => d.isVerified).length,
      activeDonors: data.donors.filter(d => d.isActive).length,
      activeRecipients: data.recipients.filter(r => r.isActive).length,
      successfulTransplants: data.metadata.successfulTransplants || 0,
      averageMatchScore: data.matches.length > 0 
        ? data.matches.reduce((sum, m) => sum + m.matchScore, 0) / data.matches.length 
        : 0
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh matches endpoint
app.post('/api/matches/refresh', (req, res) => {
  try {
    const data = readData();
    
    // Clear existing matches
    data.matches = [];
    
    // Recreate all matches
    data.donors.forEach(donor => {
      if (donor.isActive && donor.isVerified) {
        const newMatches = findAndCreateMatches(data, donor);
        data.matches.push(...newMatches);
      }
    });
    
    data.metadata.totalMatches = data.matches.length;
    writeData(data);
    
    console.log(`🔄 Matches refreshed: ${data.matches.length} total matches`);
    
    res.json({
      success: true,
      message: 'Matches refreshed successfully',
      totalMatches: data.matches.length
    });
    
  } catch (error) {
    console.error('Error refreshing matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize storage and start server
initializeStorage();

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Data storage: ${dataFile}`);
  console.log(`🌐 API endpoints available at http://localhost:${PORT}`);
  console.log(`📋 Features: Dual storage, Priority matching, Real-time compatibility`);
  console.log(`🔗 Test the API: curl http://localhost:${PORT}/`);
});

module.exports = app;