import Navbar from "./Navbar";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import NFTTile from "./NFTTile";

export default function Profile () {
    const [data, updateData] = useState([]);
    const [dataFetched, updateFetched] = useState(false);
    const [address, updateAddress] = useState("0x");
    const [totalPrice, updateTotalPrice] = useState("0");
    const [owner, updateOwner] = useState("0x");
    const [listPrice, updateListPrice] = useState(0);
    const [showInput, updateShowInput] = useState(false);

    async function getNFTData() {
        try {
          const ethers = require("ethers");
          
          // Get the Ethereum provider and signer
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const addr = await signer.getAddress();
          updateAddress(addr);
          
          // Get the contract instance
          const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
          const contractOwner = await contract.owner();
          updateOwner(contractOwner);
          
          // Get the NFTs data
          const transaction = await contract.getMyNFTs();

          let sumPrice = 0;
      
          // Process NFT data
          const items = await Promise.all(transaction.map(async (i) => {
            const tokenURI = await contract.tokenURI(i.tokenId);
            const meta = (await axios.get(tokenURI)).data;
            let price;

            if (i && i.price !== undefined) {
                price = ethers.utils.formatUnits(i.price.toString(), 'ether');
                sumPrice += parseFloat(price);
            }
    
            const item = {
              price,
              tokenId: i.tokenId.toNumber(),
              seller: i.seller,
              owner: i.owner,
              image: meta.image,
              name: meta.name,
              description: meta.description,
            };
      
            return item;
          }));
      
          // Update component state
          updateData(items);
          updateFetched(true);
          updateAddress(addr);
          updateTotalPrice(sumPrice);
          console.log(sumPrice);
        } catch (error) {
          console.error("Error fetching NFT data:", error);
          // Handle the error gracefully, e.g., by showing an error message to the user
        }
      }

      async function collectFunds() {
        try {
            const ethers = require("ethers");
            // Get the Ethereum provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const addr = await signer.getAddress();

            // Get the contract instance
            const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

            // Call the collectBalance function
            let transaction = await contract.collectBalance();
            await transaction.wait();

            await getNFTData();

            // You may want to update the component state or show a message here
            console.log("Funds collected successfully");
            alert("Funds collected successfully");
        } catch (error) {
            console.error("Error collecting funds:", error);
            // Handle the error gracefully, e.g., by showing an error message to the user
        }
    }

    async function changeListPrice(newListPrice) {
        try {
            const ethers = require("ethers");
            // Get the Ethereum provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Get the contract instance
            const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

            // Parse list price to CC
            newListPrice = ethers.utils.parseUnits(newListPrice, 18)

            // Call the updateListPrice function
            let transaction = await contract.updateListPrice(newListPrice);
            await transaction.wait();

            updateShowInput(false);
            await getNFTData();

            // You may want to update the component state or show a message here
            console.log("List price updated successfully");
            alert("List price updated successfully");
            
        } catch (error) {
            console.error("Error updating list price:", error);
            // Handle the error gracefully, e.g., by showing an error message to the user
        }
    }
      

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);

    return (
        <div className="profileClass" style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="profileClass">
            <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
                <div className="mb-5">
                    <h2 className="font-bold">Wallet Address</h2>  
                    {address}
                </div>
            </div>
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        <h2 className="font-bold">No. of NFTs</h2>
                        {data.length}
                    </div>
                    <div className="ml-20">
                        <h2 className="font-bold">Total Value</h2>
                        {totalPrice} CC
                    </div>
            </div>
            <div className="flex flex-col text-center items-center mt-11 text-white">
                <h2 className="font-bold">Your NFTs</h2>
                <div className="flex justify-center flex-wrap max-w-screen-xl">
                    {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
                <div className="mt-10 text-xl">
                    {data.length === 0 ? "Oops, No NFT data to display (Are you logged in?)":""}
                </div>
            </div>
            {owner === address &&
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <button onClick={collectFunds} className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">
                        Collect Funds
                    </button>

                    {showInput ? (
                                <>
                                    <label className="block text-white-500 text-sm font-bold mb-2" htmlFor="price">List Price (in CC)</label>
                                    <input
                                    type="number"
                                    placeholder="List Price"
                                    value={listPrice}
                                    onChange={(e) => updateListPrice(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                    <button
                                    className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                                    onClick={() => changeListPrice(listPrice)}
                                    >
                                    Confirm Price
                                    </button>
                                </>
                            ):
                            (<button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => updateShowInput(true)}>Update List Price</button>)
                    }


            </div>
            }
            </div>
        </div>
    )
};