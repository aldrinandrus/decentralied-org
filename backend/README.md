# Organ Donation Matching Backend

A Node.js Express backend that handles donor and recipient registration, implements intelligent matching logic, and provides dual storage with Greenfield simulation and local backup.

## Features

- **Dual Storage System**: Data stored in both Greenfield simulation (`greenfield.json`) and local backup (`backup.json`)
- **Intelligent Matching**: Advanced algorithm considering blood type compatibility, organ availability, location, urgency, and age
- **Real-time Matching**: Automatic match detection when new donors/recipients are registered
- **Comprehensive API**: Full CRUD operations for donors, recipients, and matches
- **Blood Type Compatibility**: Implements proper blood donation compatibility rules
- **Match Scoring**: Calculates compatibility scores based on multiple factors
- **Filtering & Sorting**: Advanced filtering options for all endpoints

## API Endpoints

### Core Registration
- `POST /api/donors` - Register a new donor
- `POST /api/recipients` - Register a new recipient

### Matching System
- `GET /api/matches` - Get all matches with filtering options
- `GET /api/matches/:matchId` - Get specific match details
- `PUT /api/matches/:matchId` - Update match status
- `POST /api/matches/refresh` - Trigger manual matching refresh

### Data Retrieval
- `GET /api/donors` - Get all donors with filtering
- `GET /api/recipients` - Get all recipients with filtering
- `GET /api/stats` - Get system statistics

### System
- `GET /health` - Health check endpoint

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

3. **Server will start on port 3001 by default**

## Usage Examples

### Register a Donor
```bash
curl -X POST http://localhost:3001/api/donors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "bloodType": "O+",
    "organs": ["Heart", "Liver", "Kidney"],
    "age": 35,
    "location": "New York, NY",
    "emergencyContact": "Jane Doe",
    "emergencyPhone": "+1-555-0123",
    "walletAddress": "0x1234567890abcdef"
  }'
```

### Register a Recipient
```bash
curl -X POST http://localhost:3001/api/recipients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "bloodType": "O+",
    "organ": "Heart",
    "urgency": 5,
    "age": 42,
    "location": "New York, NY",
    "medicalCondition": "Severe heart failure",
    "emergencyContact": "Bob Smith",
    "emergencyPhone": "+1-555-0456",
    "walletAddress": "0xabcdef1234567890"
  }'
```

### Get All Matches
```bash
curl http://localhost:3001/api/matches
```

### Get Matches with Filters
```bash
curl "http://localhost:3001/api/matches?status=pending&urgency=4&organ=heart"
```

## Data Structure

### Donor Object
```json
{
  "id": "donor_1234567890_abc123",
  "name": "John Doe",
  "bloodType": "O+",
  "organs": ["Heart", "Liver", "Kidney"],
  "age": 35,
  "location": "New York, NY",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "+1-555-0123",
  "medicalHistory": "No significant medical history",
  "walletAddress": "0x1234567890abcdef",
  "isActive": true,
  "isVerified": false,
  "registrationDate": "2024-01-15T10:30:00.000Z",
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### Recipient Object
```json
{
  "id": "recipient_1234567890_def456",
  "name": "Alice Smith",
  "bloodType": "O+",
  "organ": "Heart",
  "urgency": 5,
  "age": 42,
  "location": "New York, NY",
  "medicalCondition": "Severe heart failure",
  "emergencyContact": "Bob Smith",
  "emergencyPhone": "+1-555-0456",
  "walletAddress": "0xabcdef1234567890",
  "isActive": true,
  "registrationDate": "2024-01-15T11:00:00.000Z",
  "waitingSince": "2024-01-15T11:00:00.000Z",
  "lastUpdated": "2024-01-15T11:00:00.000Z"
}
```

### Match Object
```json
{
  "id": "match_donor123_recipient456_1234567890",
  "donorId": "donor_1234567890_abc123",
  "recipientId": "recipient_1234567890_def456",
  "donorName": "John Doe",
  "recipientName": "Alice Smith",
  "organ": "Heart",
  "donorBloodType": "O+",
  "recipientBloodType": "O+",
  "matchScore": 95,
  "compatibility": {
    "bloodType": true,
    "organ": true,
    "location": true,
    "urgency": 5
  },
  "status": "pending",
  "createdAt": "2024-01-15T11:01:00.000Z",
  "lastUpdated": "2024-01-15T11:01:00.000Z"
}
```

## Matching Algorithm

The matching system considers multiple factors:

### Blood Type Compatibility
- **Universal Donor (O-)**: Can donate to anyone
- **Universal Recipient (AB+)**: Can receive from anyone
- **Same Blood Type**: Always compatible
- **Specific Compatibility Rules**: A+→AB+, B+→AB+, etc.

### Match Scoring (0-100 points)
- **Blood Type Match**: 100 points (exact), 80 points (compatible)
- **Organ Availability**: 100 points if donor has required organ
- **Location Proximity**: 20 points (same city), 10 points (same state)
- **Urgency Bonus**: 6-30 points based on recipient urgency (1-5 scale)
- **Age Compatibility**: 10 points (≤10 years difference), 5 points (≤20 years)

### Prioritization
1. **Urgency Level** (5 = Emergency, 1 = Low priority)
2. **Match Score** (Higher scores prioritized)
3. **Waiting Time** (Longer waiting time prioritized)

## Storage System

### Greenfield Simulation (`greenfield.json`)
Primary storage simulating BNB Greenfield decentralized storage:
- Stores all donors, recipients, and matches
- Includes metadata with timestamps and counts
- Simulates distributed storage behavior

### Local Backup (`backup.json`)
Secondary storage for redundancy:
- Identical structure to Greenfield storage
- Provides local backup and disaster recovery
- Enables offline access to data

### Data Synchronization
- Both storage systems are updated simultaneously
- Automatic consistency checks
- Metadata tracking for audit trails

## Error Handling

The API provides comprehensive error handling:
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate registration
- **500 Internal Server Error**: Server-side errors

All errors include detailed messages and suggestions for resolution.

## Security Considerations

- Input validation on all endpoints
- Duplicate registration prevention
- Wallet address verification
- Data integrity checks
- CORS enabled for frontend integration

## Development

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

### Environment Variables
Create a `.env` file:
```env
PORT=3001
NODE_ENV=development
```

## Integration with Frontend

The backend is designed to work seamlessly with the existing React frontend:

1. **CORS Enabled**: All frontend domains allowed
2. **JSON API**: RESTful JSON responses
3. **Error Handling**: Consistent error response format
4. **Real-time Updates**: Immediate match detection
5. **Filtering Support**: Advanced query parameters

## Monitoring and Logging

- Console logging for all major operations
- Request/response logging
- Error tracking with stack traces
- Performance monitoring capabilities

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Real-time WebSocket notifications
- Advanced matching algorithms with ML
- Integration with actual BNB Greenfield
- Authentication and authorization
- Rate limiting and security hardening
- Comprehensive test suite
- API documentation with Swagger