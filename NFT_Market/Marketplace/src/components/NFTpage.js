import Navbar from "./Navbar";
import axie from "../tile.jpeg";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import ERC20JSON from "../ERC20.json"
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function NFTPage (props) {

const [data, updateData] = useState({});
const [dataFetched, updateDataFetched] = useState(false);
const [message, updateMessage] = useState("");
const [currAddress, updateCurrAddress] = useState("0x");
const [buttonDisabled, setButtonDisabled] = useState(false);
const [showPriceInput, setShowPriceInput] = useState(false);
const [resellPrice, setResellPrice] = useState(0);

async function getNFTData(tokenId) {
    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    //Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
    //create an NFT Token
    var tokenURI = await contract.tokenURI(tokenId);
    const listedToken = await contract.getListedTokenForId(tokenId);
    tokenURI = GetIpfsUrlFromPinata(tokenURI);
    let meta = await axios.get(tokenURI);
    meta = meta.data;
    console.log(listedToken);

    let item = {
        price: Math.round(listedToken.price/1e18),
        tokenId: tokenId,
        seller: listedToken.seller,
        owner: listedToken.owner,
        currentlyListed: listedToken.currentlyListed,
        image: meta.image,
        name: meta.name,
        description: meta.description,
    }
    console.log(item);
    updateData(item);
    setResellPrice(item.price.toString());
    updateDataFetched(true);
    console.log("address", addr)
    updateCurrAddress(addr);
}

async function buyNFT(tokenId, price) {
    try {
        setButtonDisabled(true);
        const ethers = require("ethers");
        price = price.toString();
        price = ethers.utils.parseUnits(price, 18)
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        let erc20contract = new ethers.Contract(ERC20JSON.address, ERC20JSON.abi, signer)
        //const salePrice = ethers.utils.parseUnits(data.price, 18)
        updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")

        //authorizing smart contract to spend tokens
        let authorization = await erc20contract.approve(MarketplaceJSON.address, price)
        await authorization.wait()

        //run the executeSale function
        let transaction = await contract.executeSale(tokenId);
        await transaction.wait();

        await getNFTData(tokenId);

        alert('You successfully bought the NFT!');
        updateMessage("");
        setButtonDisabled(false);
    }
    catch(e) {
        alert("Upload Error"+e)
    }
}

async function unlistNFT(tokenId) {
    try {
        setButtonDisabled(true);
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        
        updateMessage("Unlisting the NFT... Please Wait (Upto 5 mins)")

        //run the unlistToken function
        let transaction = await contract.unlistToken(tokenId);
        await transaction.wait();

        await getNFTData(tokenId);

        alert('You successfully unlisted the NFT!');
        updateMessage("");
        setButtonDisabled(false);
    }
    catch(e) {
        alert("Upload Error"+e)
    }
}

async function resellNFT(tokenId, price) {
    try {
        setButtonDisabled(true);
        const ethers = require("ethers");
        price = ethers.utils.parseUnits(price, 18)
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        let erc20contract = new ethers.Contract(ERC20JSON.address, ERC20JSON.abi, signer)
        //const salePrice = ethers.utils.parseUnits(data.price, 18)
        updateMessage("Relisting the NFT... Please Wait (Upto 5 mins)")

        //Get listing price
        let listingPrice = await contract.getListPrice()
        listingPrice = listingPrice.toString()

        //authorizing smart contract to spend tokens
        let authorization = await erc20contract.approve(MarketplaceJSON.address, listingPrice)
        await authorization.wait()

        //run the resellToken function
        let transaction = await contract.resellToken(tokenId, price);
        await transaction.wait();

        await getNFTData(tokenId);

        alert('You successfully relisted the NFT!');
        updateMessage("");
        setButtonDisabled(false)
    }
    catch(e) {
        alert("Upload Error"+e)
    }
}

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);
    if(typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);

    return(
        <div style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg p-10">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{data.price + "CC"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                    {
                        // Not the token owner
                        currAddress !== data.seller ?

                        (!data.currentlyListed ? 
                            // Token not listed
                            (<div className="text-emerald-700">This token is not for sale</div>) :
                            // Token listed for sale
                            <button disabled={buttonDisabled} className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId, data.price)}>Buy this NFT</button>
                        ) :

                        // Token owner
                        (!data.currentlyListed ? (
                            //Token not listed

                            (showPriceInput ? (
                                <>
                                    <label className="block text-white-500 text-sm font-bold mb-2" htmlFor="price">Price (in CC)</label>
                                    <input
                                    type="number"
                                    value={resellPrice}
                                    onChange={(e) => setResellPrice(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                    <button
                                    className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                                    onClick={() => resellNFT(tokenId, resellPrice)}
                                    disabled={buttonDisabled} // Disable the button when buttonDisabled is true
                                    >
                                    Confirm Price
                                    </button>
                                </>
                            ):
                            (<button disabled={buttonDisabled} className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => setShowPriceInput(true)}>Resell this NFT</button>)
                            )) :
                            // Token listed for sale
                            <button disabled={buttonDisabled} className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => unlistNFT(tokenId)}>Unlist this NFT</button>
                        )
                    }
                    
                    <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}