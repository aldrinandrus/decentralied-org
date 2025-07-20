# BNB Greenfield Integration

This document explains how BNB Greenfield is integrated into the decentralized organ donation platform for secure document storage.

## 🚀 Overview

BNB Greenfield is BNB Chain's decentralized storage solution that provides:
- **Decentralized Storage**: Data distributed across multiple storage providers
- **Blockchain Integration**: Native integration with BSC for data ownership and permissions
- **Cost-Effective**: Pay only for storage used
- **High Performance**: Global CDN-like access speeds

## 📁 What Gets Stored on Greenfield

### Medical Documents
- **Medical Reports**: Patient health records and test results
- **Consent Forms**: Donor consent and authorization documents
- **Identity Proof**: Government-issued identification documents
- **Organ-Specific Tests**: Compatibility and health assessments
- **Urgency Assessments**: Recipient priority evaluations
- **Insurance Documents**: Coverage and payment information

### Data Types
- **Medical Records**: JSON-structured patient data
- **Organ Match Data**: Compatibility and matching information
- **Document Metadata**: File information and access permissions

## 🔧 Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```env
# BNB Greenfield Configuration
NEXT_PUBLIC_GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443
NEXT_PUBLIC_GREENFIELD_CHAIN_ID=5600
NEXT_PUBLIC_GREENFIELD_PRIVATE_KEY=your_private_key_here
```

### 2. Get Greenfield Testnet Tokens

Visit the Greenfield testnet faucet to get test tokens:
- **Faucet URL**: https://testnet.binance.org/faucet-smart
- **Token Type**: tBNB (testnet BNB)
- **Amount**: 0.1 tBNB

### 3. Private Key Setup

**Important**: For production, implement secure key management. For testing:

1. Export your private key from MetaMask
2. Add it to the `.env` file
3. **Never commit private keys to version control**

## 🏗️ Architecture

### Components

1. **GreenfieldService** (`lib/greenfield-service.ts`)
   - Core service for Greenfield operations
   - Handles bucket creation, file upload/download
   - Manages document metadata

2. **useGreenfield Hook** (`hooks/use-greenfield.ts`)
   - React hook for Greenfield integration
   - Provides upload/download functions
   - Handles connection state

3. **GreenfieldStorage Component** (`components/greenfield/greenfield-storage.tsx`)
   - UI component for document management
   - File upload interface
   - Storage statistics display

### Storage Structure

```
organ-donation-platform/
├── documents/
│   ├── medical_report/
│   ├── consent_form/
│   ├── identity_proof/
│   └── organ_specific_test/
├── medical_records/
│   └── {patientId}/
└── matches/
    └── {matchId}.json
```

## 🔐 Security Features

### Access Control
- **Private Buckets**: All data stored in private buckets
- **Permission-Based Access**: Blockchain-based access control
- **Encrypted Storage**: Data encrypted at rest

### Privacy Compliance
- **HIPAA Compatible**: Meets healthcare privacy standards
- **Audit Trails**: All access logged on blockchain
- **Data Ownership**: Users maintain full control

## 📊 Usage Examples

### Upload Medical Document

```typescript
import { useGreenfield } from '@/hooks/use-greenfield'

const { uploadMedicalDocument } = useGreenfield()

const handleUpload = async (file: File) => {
  const document = await uploadMedicalDocument(
    file,
    'medical_report',
    'user123',
    { patientId: 'patient456' }
  )
  
  if (document) {
    console.log('Document uploaded:', document.greenfieldObjectId)
  }
}
```

### Store Medical Record

```typescript
import { useGreenfield } from '@/hooks/use-greenfield'

const { storeMedicalRecord } = useGreenfield()

const medicalRecord = {
  id: 'record123',
  patientId: 'patient456',
  bloodType: 'O+',
  organType: 'kidney',
  medicalHistory: '...',
  testResults: '...',
  doctorNotes: '...',
  timestamp: Date.now(),
  hash: '0x...'
}

const recordId = await storeMedicalRecord(medicalRecord)
```

### Download Document

```typescript
import { useGreenfield } from '@/hooks/use-greenfield'

const { downloadMedicalDocument } = useGreenfield()

const handleDownload = async (objectName: string, fileName: string) => {
  await downloadMedicalDocument(objectName, fileName)
}
```

## 🌐 Network Configuration

### Testnet
- **RPC URL**: `https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443`
- **Chain ID**: `5600`
- **Explorer**: https://testnet.greenfieldscan.com/

### Mainnet
- **RPC URL**: `https://greenfield-chain.bnbchain.org:443`
- **Chain ID**: `5600`
- **Explorer**: https://greenfieldscan.com/

## 💰 Cost Structure

### Storage Costs
- **Per GB/Month**: ~$0.01-0.02
- **Minimum Charge**: 128KB per object
- **Free Tier**: Available for testing

### Transaction Costs
- **Bucket Creation**: ~0.001 BNB
- **Object Upload**: ~0.0001 BNB per MB
- **Object Download**: Free (read operations)

## 🔍 Monitoring & Analytics

### Storage Statistics
- Total objects stored
- Storage size used
- Upload/download counts
- Cost tracking

### Health Monitoring
- Storage provider status
- Network performance
- Error rates and retry logic

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check RPC URL and chain ID
   - Verify private key format
   - Ensure sufficient testnet tokens

2. **Upload Failed**
   - Check file size limits (32GB max)
   - Verify bucket exists
   - Check storage provider availability

3. **Download Failed**
   - Verify object exists
   - Check access permissions
   - Ensure correct object name

### Error Codes

- `NoSuchBucket`: Bucket doesn't exist
- `NoSuchObject`: Object not found
- `AccessDenied`: Insufficient permissions
- `InsufficientBalance`: Not enough tokens

## 🔄 Integration Points

### Smart Contract Integration
- Store document hashes on BSC
- Link Greenfield objects to blockchain records
- Enable permission-based access

### Frontend Integration
- Document upload in registration forms
- Medical record display
- Match data storage

### API Integration
- RESTful endpoints for document operations
- Webhook notifications for uploads
- Batch operations for multiple files

## 📈 Future Enhancements

### Planned Features
- **IPFS Integration**: Hybrid storage solution
- **Advanced Permissions**: Role-based access control
- **Data Analytics**: Storage usage insights
- **Automated Backups**: Redundant storage
- **Mobile SDK**: Native mobile support

### Performance Optimizations
- **CDN Integration**: Global content delivery
- **Compression**: Automatic file compression
- **Caching**: Smart caching strategies
- **Parallel Uploads**: Concurrent file uploads

## 📞 Support

For Greenfield-specific issues:
- **Documentation**: https://docs.bnbchain.org/bnb-greenfield/
- **GitHub**: https://github.com/bnb-chain/greenfield
- **Discord**: BNB Chain Community

For platform integration issues:
- Check the main README.md
- Review the troubleshooting section
- Open an issue in the repository 