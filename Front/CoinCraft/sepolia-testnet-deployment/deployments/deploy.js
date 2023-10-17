const fs = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    const weiAmount = (await deployer.getBalance()).toString();
    
    console.log("Account balance:", (await ethers.utils.formatEther(weiAmount)));
  
    // make sure to replace the "GoofyGoober" reference with your own ERC-20 name!
    const Token = await ethers.getContractFactory("CoinCraft");
    const token = await Token.deploy();
  
    console.log("Token address:", token.address);
    const data = {
      address: token.address,
    }
    fs.writeFileSync('../../src/CoinCraft.json', JSON.stringify(data))
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
  });