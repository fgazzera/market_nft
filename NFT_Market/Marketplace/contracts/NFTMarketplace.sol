// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    uint256 private balance;

    //The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 1 ether;

    // Custom ERC20 token address
    address public immutable customToken;

    struct ListedToken {
        uint256 tokenId;
        address owner;
        address seller;
        uint256 price;
        bool exists;
        bool currentlyListed;
    }

    event TokenListedSuccess(
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    mapping(uint256 => ListedToken) private idToListedToken;

    constructor(address _customToken) ERC721("NFTMarketplace", "NFTM") {
        customToken = _customToken;
        balance = 0;
    }

    // Function for users to list new NFTs for sale
    function createToken(string memory tokenURI, uint256 price) public returns (uint) {
        // Increment the tokenId counter
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Mint the NFT with tokenId newTokenId to the address who called createToken
        _safeMint(msg.sender, newTokenId);

        // Map the tokenId to the tokenURI (which is an IPFS URL with the NFT metadata)
        _setTokenURI(newTokenId, tokenURI);

        // Helper function to update Global variables and emit an event
        createListedToken(newTokenId, price);

        return newTokenId;
    }

    // Function for users to list new NFTs for sale
    function createListedToken(uint256 tokenId, uint256 price) private {

        require(price > 0, "Make sure the price isn't negative");

        // Update the mapping of tokenId to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            address(this),
            msg.sender,
            price,
            true,
            true
        );

        // Transfer the NFT to the smart contract
        _transfer(msg.sender, address(this), tokenId);

        // The seller has to pay the listing price
        // Check if the seller has enough balance
        require(IERC20(customToken).balanceOf(msg.sender) >= listPrice, "Insuficient balance of ERC20 Token");

        // Check if the contract is allowed to transfer tokens
        require(IERC20(customToken).allowance(msg.sender, address(this)) >= listPrice, 
        "This contract needs approval from msg.sender");

        // Transfer list price to contract
        IERC20(customToken).transferFrom(msg.sender, address(this), listPrice);
        balance += listPrice;

        // Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }

    // Function to execute the sale using custom ERC20 tokens
    function executeSale(uint256 tokenId) public {
        // Check if token exists
        require(idToListedToken[tokenId].exists, "Token doesn't exist");

        uint price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;

        // The buyer has to pay the NFT price
        // Check if the buyer has enough balance
        require(IERC20(customToken).balanceOf(msg.sender) >= price, "Insuficient balance of CC Token");

        // Check if the contract is allowed to transfer tokens
        require(IERC20(customToken).allowance(msg.sender, address(this)) >= price, 
        "This contract needs approval from msg.sender");

        // Pay the seller
        IERC20(customToken).transferFrom(msg.sender, seller, price);

        idToListedToken[tokenId].currentlyListed = false;
        idToListedToken[tokenId].seller = msg.sender;
        _itemsSold.increment();

        // Actually transfer the NFT to the new owner
        _transfer(address(this), msg.sender, tokenId);

        // Approve the marketplace to sell NFTs on your behalf
        approve(address(this), tokenId);
    }

    // Function to resell purchased token
    function resellToken(uint256 tokenId, uint256 price) public {
        require(idToListedToken[tokenId].exists, "Token doesn't exist");
        require(msg.sender == idToListedToken[tokenId].seller, "Only the token owner can resell it");

        // Update data in mapping
        idToListedToken[tokenId].price = price;
        idToListedToken[tokenId].currentlyListed = true;

        // Transfer the NFT to the smart contract
        _transfer(msg.sender, address(this), tokenId);

        // The seller has to pay the listing price
        // Check if the seller has enough balance
        require(IERC20(customToken).balanceOf(msg.sender) >= listPrice, "Insuficient balance of CC Token");

        // Check if the contract is allowed to transfer tokens
        require(IERC20(customToken).allowance(msg.sender, address(this)) >= listPrice, 
        "This contract needs approval from msg.sender");

        // Transfer list price to contract
        IERC20(customToken).transferFrom(msg.sender, address(this), listPrice);
        balance += listPrice;
    }

    // Function to unlist listed token
    function unlistToken(uint256 tokenId) public {
        require(idToListedToken[tokenId].exists, "Token doesn't exist");
        require(msg.sender == idToListedToken[tokenId].seller, "Only the token owner can resell it");

        // Update data in mapping
        idToListedToken[tokenId].currentlyListed = false;

        // Transfer the NFT back to it's owner
        _transfer(address(this), msg.sender, tokenId);
    }


    // Function to retrieve all the NFTs currently listed for sale
    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;

        for (uint i = 0; i < nftCount; i++) {
            uint currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];

            if (currentItem.currentlyListed) {
                tokens[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        // Resize the tokens array to remove empty slots caused by filtered NFTs
        assembly {
            mstore(tokens, currentIndex)
        }

        return tokens;
    }

    // Function to retrieve all the NFTs that the current user is the owner or seller of
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        // Important to get a count of all the NFTs that belong to the user before we can make an array for them
        for (uint i = 0; i < totalItemCount; i++) {
            if (
                idToListedToken[i + 1].owner == msg.sender ||
                idToListedToken[i + 1].seller == msg.sender
            ) {
                itemCount += 1;
            }
        }

        // Once you have the count of relevant NFTs, create an array then store all the NFTs in it
        ListedToken[] memory items = new ListedToken[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (
                idToListedToken[i + 1].owner == msg.sender ||
                idToListedToken[i + 1].seller == msg.sender
            ) {
                uint currentId = i + 1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // Function to update the listing price
    function updateListPrice(uint256 _listPrice) public onlyOwner {
        listPrice = _listPrice;
    }

    // Function to get the current listing price
    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    // Function to get the details of the latest listed token
    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    // Function to get the details of a listed token by its tokenId
    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    // Function to get the current token ID
    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    // Owner can collect contract balance
    function collectBalance() public onlyOwner {
        IERC20(customToken).transfer(owner(), balance);
        balance = 0;
    }
}

contract CoinCraft is Ownable {
    IERC20 public customToken; // Cambia el tipo de token si es necesario
    uint256 public tokensPerDay;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => bool) public hasClaimedTokens;

    event TokensClaimed(address indexed recipient, uint256 amount);

    constructor(
        address _customToken, // Cambia el tipo de token si es necesario
        uint256 _tokensPerDay
    ) {
        customToken = IERC20(_customToken);
        tokensPerDay = _tokensPerDay;
    }

    modifier onlyOnceADay() {
        require(
            block.timestamp - lastClaimTime[msg.sender] >= 1 days,
            "Can only claim once a day"
        );
        _;
    }

    function setTokensPerDay(uint256 _tokensPerDay) public onlyOwner {
        tokensPerDay = _tokensPerDay;
    }

    function claimTokens() public onlyOnceADay {
        require(
            !hasClaimedTokens[msg.sender],
            "Tokens already claimed"
        );

        require(
            customToken.balanceOf(address(this)) >= tokensPerDay,
            "Insufficient tokens in the faucet"
        );

        lastClaimTime[msg.sender] = block.timestamp;
        customToken.transfer(msg.sender, tokensPerDay);
        emit TokensClaimed(msg.sender, tokensPerDay);

        hasClaimedTokens[msg.sender] = true; // Marcar al usuario como que ha reclamado
    }

    function withdrawTokens(uint256 amount) public onlyOwner {
        customToken.transfer(owner(), amount);
    }
}