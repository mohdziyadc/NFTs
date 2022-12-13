//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NotEnoughETH();
error RandomIpfsNft__TransferFailed();
error RandomIpfsNft__AlreadyIntialized();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    bytes32 private immutable i_gaslane;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint256 internal immutable i_mintFee;
    bool private s_intialized;

    mapping(uint256 => address) public s_requestIdToSender;

    //NFT Variables
    uint256 public s_tokenCounter;
    uint256 private constant MAX_CHANCE_VALUE = 100;
    string[] internal s_tokenUris; //instead of hardcoding the URI strings we're gonna pass it to the constructor.

    //Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        bytes32 gaslane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        string[3] memory tokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gaslane = gaslane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        _intialize(tokenUris);
        i_mintFee = mintFee;
        s_tokenCounter = 0;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NotEnoughETH();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gaslane, //also called keyHash
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        /**
         * This function is called by the Chainlink VRF Node. So
         * here msg.sender = VRF Node and not the person who
         * requested the NFT. Hence mapping is needed
         */

        address nftOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        s_tokenCounter += 1;
        uint256 moddedRNG = randomWords[0] % MAX_CHANCE_VALUE; //So we get numbers b/w 0 & 100

        Breed dogBreed = getBreedFromModdedRng(moddedRNG);
        _safeMint(nftOwner, newTokenId);
        _setTokenURI(newTokenId, s_tokenUris[uint256(dogBreed)]); //setting image of the NFT

        emit NftMinted(dogBreed, nftOwner);
    }

    function getBreedFromModdedRng(
        uint256 moddedRng
    ) public pure returns (Breed) {
        uint256 totalSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        /**
         * Logic -
         * if the random number is b/w 0 & 10 - return PUG
         * else if the random number is b/w 10 & 30 - return SHIBA_INU
         * else if the random number is b/w 30 & 100 - return ST_BERNARD
         *
         */
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                moddedRng >= totalSum && moddedRng < totalSum + chanceArray[i]
            ) {
                return Breed(i);
            } //Awesome Logic
            totalSum += chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    //_setTokenURI() takes care of this function
    // function tokenURI(
    //     uint256 tokenId
    // ) public view virtual override returns (string memory) {}

    function _intialize(string[3] memory dogTokenUris) private {
        if (s_intialized) {
            revert RandomIpfsNft__AlreadyIntialized();
        }
        s_tokenUris = dogTokenUris;
        s_intialized = true;
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUri(uint256 index) public view returns (string memory) {
        return s_tokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getTokenUrisIntialized() public view returns (bool) {
        return s_intialized;
    }
}
