const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Storage files
const greenfieldFile = path.join(__dirname, 'greenfield.json');
const backupFile = path.join(__dirname, 'backup.json');

// Initialize storage files
const initializeStorage = () => {
  const initialData = {
    donors: [],
    recipients: [],
    matches: []
  };

  if (!fs.existsSync(greenfieldFile)) {
    fs.writeFileSync(greenfieldFile, JSON.stringify(initialData, null, 2));
  }

  if (!fs.existsSync(backupFile)) {
    fs.writeFileSync(backupFile, JSON.stringify(initialData, null, 2));
  }
};

// Helper functions
const readStorage = (file) => {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return { donors: [], recipients: [], matches: [] };
  }
};

const writeStorage = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
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

// Matching logic
const findMatches = (donors, recipients) => {
  const matches = [];
  
  donors.forEach(donor => {
    recipients.forEach(recipient => {
      if (isBloodTypeCompatible(donor.bloodType, recipient.bloodType) &&
          donor.organs.includes(recipient.organ)) {
        
        const match = {
          id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          donor: donor,
          recipient: recipient,
          matchScore: calculateMatchScore(donor, recipient),
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        matches.push(match);
      }
    });
  });
  
  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

const calculateMatchScore = (donor, recipient) => {
  let score = 0;
  
  // Blood type compatibility (base score)
  if (isBloodTypeCompatible(donor.bloodType, recipient.bloodType)) {
    score += 50;
  }
  
  // Organ availability
  if (donor.organs.includes(recipient.organ)) {
    score += 30;
  }
  
  // Urgency factor
  score += (recipient.urgency || 1) * 5;
  
  // Age compatibility (closer ages get higher scores)
  const ageDiff = Math.abs((donor.age || 30) - (recipient.age || 30));
  score += Math.max(0, 15 - ageDiff);
  
  return Math.min(100, score);
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Organ Donation Matching System API',
    version: '1.0.0',
    endpoints: {
      'POST /api/donors': 'Register a new donor',
      'POST /api/recipients': 'Register a new recipient',
      'GET /api/matches': 'Get all matches',
      'GET /api/donors': 'Get all donors',
      'GET /api/recipients': 'Get all recipients'
    }
  });
});

// Register donor
app.post('/api/donors', (req, res) => {
  try {
    const { name, bloodType, organs, age, location, walletAddress } = req.body;
    
    if (!name || !bloodType || !organs || !Array.isArray(organs)) {
      return res.status(400).json({ error: 'Missing required fields: name, bloodType, organs' });
    }
    
    const donor = {
      id: `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      bloodType,
      organs,
      age: age || null,
      location: location || null,
      walletAddress: walletAddress || null,
      registeredAt: new Date().toISOString()
    };
    
    // Read current data
    const greenfieldData = readStorage(greenfieldFile);
    const backupData = readStorage(backupFile);
    
    // Add donor to both storages
    greenfieldData.donors.push(donor);
    backupData.donors.push(donor);
    
    // Find new matches
    const newMatches = findMatches([donor], greenfieldData.recipients);
    greenfieldData.matches.push(...newMatches);
    backupData.matches.push(...newMatches);
    
    // Write to both files
    writeStorage(greenfieldFile, greenfieldData);
    writeStorage(backupFile, backupData);
    
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
    const { name, bloodType, organ, urgency, age, location, walletAddress } = req.body;
    
    if (!name || !bloodType || !organ) {
      return res.status(400).json({ error: 'Missing required fields: name, bloodType, organ' });
    }
    
    const recipient = {
      id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      bloodType,
      organ,
      urgency: urgency || 1,
      age: age || null,
      location: location || null,
      walletAddress: walletAddress || null,
      registeredAt: new Date().toISOString()
    };
    
    // Read current data
    const greenfieldData = readStorage(greenfieldFile);
    const backupData = readStorage(backupFile);
    
    // Add recipient to both storages
    greenfieldData.recipients.push(recipient);
    backupData.recipients.push(recipient);
    
    // Find new matches
    const newMatches = findMatches(greenfieldData.donors, [recipient]);
    greenfieldData.matches.push(...newMatches);
    backupData.matches.push(...newMatches);
    
    // Write to both files
    writeStorage(greenfieldFile, greenfieldData);
    writeStorage(backupFile, backupData);
    
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

// Get all matches
app.get('/api/matches', (req, res) => {
  try {
    const data = readStorage(greenfieldFile);
    res.json({
      success: true,
      matches: data.matches,
      total: data.matches.length
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all donors
app.get('/api/donors', (req, res) => {
  try {
    const data = readStorage(greenfieldFile);
    res.json({
      success: true,
      donors: data.donors,
      total: data.donors.length
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all recipients
app.get('/api/recipients', (req, res) => {
  try {
    const data = readStorage(greenfieldFile);
    res.json({
      success: true,
      recipients: data.recipients,
      total: data.recipients.length
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize storage and start server
initializeStorage();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Greenfield storage: ${greenfieldFile}`);
  console.log(`💾 Backup storage: ${backupFile}`);
  console.log(`🌐 API available at http://localhost:${PORT}`);
});

module.exports = app;