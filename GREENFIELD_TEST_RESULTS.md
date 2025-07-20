# Greenfield Integration Test Results

## 🧪 Test Summary

### ✅ **SDK Installation Test - PASSED**
- **Greenfield SDK**: Successfully installed version ^2.2.2
- **Node.js**: v22.14.0 (Windows x64)
- **Dependencies**: All required packages present
- **Import Test**: SDK imports correctly
- **Client Creation**: Client instance created successfully

### ✅ **SDK Structure Test - PASSED**
Available modules detected:
- ✅ `account` - Account management
- ✅ `basic` - Basic operations
- ✅ `bucket` - Bucket operations
- ✅ `challenge` - Challenge operations
- ✅ `crosschain` - Cross-chain operations
- ✅ `distribution` - Distribution operations
- ✅ `feegrant` - Fee grant operations
- ✅ `gashub` - Gas hub operations
- ✅ `group` - Group operations
- ✅ `object` - Object operations
- ✅ `payment` - Payment operations
- ✅ `proposal` - Proposal operations
- ✅ `queryClient` - Query client
- ✅ `sp` - Storage provider operations
- ✅ `spClient` - Storage provider client
- ✅ `storage` - Storage operations
- ✅ `txClient` - Transaction client
- ✅ `offchainauth` - Off-chain authentication
- ✅ `validator` - Validator operations
- ✅ `virtualGroup` - Virtual group operations

## 🚀 **How to Test Greenfield Integration**

### **Method 1: Automated SDK Test**
```bash
npm run test:greenfield
```

### **Method 2: Web Interface Test**
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the test page:
   ```
   http://localhost:3001/test-greenfield
   ```

3. Follow the test instructions on the page

### **Method 3: Manual Storage Test**
1. Visit the Greenfield storage page:
   ```
   http://localhost:3001/greenfield
   ```

2. Connect your wallet
3. Upload test documents
4. Verify storage operations

## 🔧 **Prerequisites for Testing**

### **1. Environment Setup**
Create a `.env` file with:
```env
# BNB Greenfield Configuration
NEXT_PUBLIC_GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443
NEXT_PUBLIC_GREENFIELD_CHAIN_ID=5600
NEXT_PUBLIC_GREENFIELD_PRIVATE_KEY=your_private_key_here
```

### **2. Get Testnet Tokens**
- Visit: https://testnet.binance.org/faucet-smart
- Enter your wallet address
- Request testnet BNB (tBNB)

### **3. Wallet Connection**
- Install MetaMask
- Connect to BSC Testnet (Chain ID: 97)
- Ensure wallet is unlocked

## 📋 **Test Checklist**

### **Basic Functionality Tests**
- [ ] Wallet connection
- [ ] Greenfield initialization
- [ ] Storage statistics retrieval
- [ ] Medical record storage
- [ ] Medical record retrieval
- [ ] Organ match data storage
- [ ] File upload (if file selected)
- [ ] File download (if file uploaded)

### **Advanced Tests**
- [ ] Bucket creation
- [ ] Object listing
- [ ] Public URL generation
- [ ] Document deletion
- [ ] Error handling
- [ ] Network connectivity

## 🎯 **Expected Test Results**

### **Success Indicators**
- ✅ All tests pass with 80%+ success rate
- ✅ Greenfield service initializes successfully
- ✅ Storage operations complete without errors
- ✅ Documents upload and download correctly
- ✅ Medical records store and retrieve properly

### **Common Issues & Solutions**

#### **Issue: "Private Key Not Available"**
**Solution**: Add your private key to `.env` file
```env
NEXT_PUBLIC_GREENFIELD_PRIVATE_KEY=your_actual_private_key_here
```

#### **Issue: "Insufficient Balance"**
**Solution**: Get testnet tokens from faucet
- Visit: https://testnet.binance.org/faucet-smart
- Request 0.1 tBNB

#### **Issue: "Network Connection Failed"**
**Solution**: Check network configuration
- Verify RPC URL is correct
- Ensure internet connection
- Check if Greenfield testnet is accessible

#### **Issue: "Bucket Creation Failed"**
**Solution**: This is expected for first-time users
- Bucket will be created automatically
- May take a few seconds for first creation

## 📊 **Performance Benchmarks**

### **Expected Performance**
- **Initialization**: < 5 seconds
- **File Upload**: < 30 seconds (1MB file)
- **File Download**: < 10 seconds (1MB file)
- **Record Storage**: < 5 seconds
- **Record Retrieval**: < 3 seconds

### **Storage Limits**
- **Max File Size**: 32GB per object
- **Min Charge Size**: 128KB
- **Bucket Limit**: 100 buckets per account
- **Object Limit**: No practical limit

## 🔍 **Debugging Tips**

### **Console Logs**
Check browser console for detailed error messages:
```javascript
// Enable debug logging
localStorage.setItem('greenfield-debug', 'true')
```

### **Network Tab**
Monitor network requests in browser dev tools:
- Look for Greenfield API calls
- Check response status codes
- Verify request payloads

### **Environment Variables**
Verify all required environment variables are set:
```bash
# Check if variables are loaded
echo $NEXT_PUBLIC_GREENFIELD_RPC_URL
echo $NEXT_PUBLIC_GREENFIELD_CHAIN_ID
```

## 📈 **Test Metrics**

### **Success Criteria**
- **SDK Installation**: 100% success rate
- **Basic Operations**: 90%+ success rate
- **File Operations**: 85%+ success rate
- **Error Handling**: Proper error messages displayed

### **Performance Metrics**
- **Response Time**: < 10 seconds for most operations
- **Error Rate**: < 5% for standard operations
- **Uptime**: 99%+ availability

## 🎉 **Test Completion**

When all tests pass successfully, you should see:
- ✅ Green checkmarks for all test categories
- 📊 Success rate of 80% or higher
- 🔗 Working links to Greenfield storage interface
- 📁 Ability to upload and download documents
- 💾 Medical records stored and retrieved correctly

## 📞 **Support**

If tests fail or you encounter issues:
1. Check the troubleshooting section in `GREENFIELD_INTEGRATION.md`
2. Verify your environment configuration
3. Ensure you have sufficient testnet tokens
4. Check network connectivity
5. Review browser console for error messages

## 🔄 **Next Steps After Testing**

1. **Deploy to Production**: Update environment variables for mainnet
2. **Security Review**: Implement proper key management
3. **Performance Optimization**: Add caching and compression
4. **Monitoring**: Set up alerts and logging
5. **Documentation**: Update user documentation 