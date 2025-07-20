const { ethers } = require("hardhat")

async function main() {
  console.log("🚀 Starting contract deployment...")

  // Get the contract factory
  const OrganRegistry = await ethers.getContractFactory("OrganRegistry")
  console.log("📋 OrganRegistry contract factory loaded")

  // Deploy the contract
  console.log("⏳ Deploying OrganRegistry contract...")
  const organRegistry = await OrganRegistry.deploy()
  
  // Wait for deployment to finish
  await organRegistry.waitForDeployment()
  
  const organRegistryAddress = await organRegistry.getAddress()
  console.log(`✅ OrganRegistry deployed to: ${organRegistryAddress}`)

  console.log("\n🎉 Deployment completed successfully!")
  console.log("📝 Contract addresses:")
  console.log(`   OrganRegistry: ${organRegistryAddress}`)
  
  console.log("\n📋 Next steps:")
  console.log("1. Update the contract address in lib/contracts.ts")
  console.log("2. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env file")
  console.log("3. Verify contract on BSCScan (optional)")
  console.log("4. Test the contract with the frontend")
  
  console.log("\n🔗 BSCScan Testnet Explorer:")
  console.log(`   https://testnet.bscscan.com/address/${organRegistryAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
