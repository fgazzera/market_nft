async function main() {
    const GlobalNFT = await ethers.getContractFactory("GlobalNFT")
  
    // Start deployment, returning a promise that resolves to a contract object
    const globalNFT = await GlobalNFT.deploy()
    await globalNFT.deployed()
    console.log("Contract deployed to address:", globalNFT.address)
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
  