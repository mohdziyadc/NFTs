//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract DynamicSvgNFT is ERC721 {
    uint256 private s_tokenCounter;
    string private i_highImg;
    string private i_lowImg;

    AggregatorV3Interface internal immutable i_priceFeed;

    mapping(uint256 => int256) public s_tokenIdToHighValue;

    event MintedNFT(uint256 indexed tokenId, int256 highValue);

    string private constant BASE64_URI_PREFIX = "data:image/svg+xml;base64,";

    /**
     * Happy image --> When the price is high
     * Frown image --> When the price is low
     */
    constructor(
        address priceFeedAddress,
        string memory highImage,
        string memory lowImage
    ) ERC721("DynamicSvgNFT", "DSN") {
        s_tokenCounter = 0;
        i_highImg = svgToImageURI(highImage);
        i_lowImg = svgToImageURI(lowImage);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function mintNft(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        s_tokenCounter += 1;

        _safeMint(msg.sender, s_tokenCounter);
        emit MintedNFT(s_tokenCounter, highValue);
    }

    //On chain base64 encoding to convert svg to image uri
    function svgToImageURI(
        string memory svg
    ) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );

        return string(abi.encodePacked(BASE64_URI_PREFIX, svgBase64Encoded));
        //string(abi.encodePacked(BASE64_URI_PREFIX, svgBase64Encoded)) concatentates
        //the 2 strings
        //abi.encode() is a global method
    }

    function _baseURI() internal view override returns (string memory) {
        //this is the base uri for json objects after base64 encoding.
        return "data:application/json;base64,";
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        // require(_exists(tokenId), "Check for nonexistent tokenIds");
        // if (!_exists(tokenId)) {
        //     revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        // }

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        //Dynamically changing
        string memory imageURI = i_lowImg;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImg;
        }
        /**
         * 1. Create a JSON String
           2. Typecast it into bytes for base64
           3. perform base64 encoding
                This gives us the 2nd part of uri
           4. concatenate the first part of uri and the second part using abi.encodePacked
           5. return a string
         */
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(), // You can add whatever name here
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getLowSVG() public view returns (string memory) {
        return i_lowImg;
    }

    function getHighSVG() public view returns (string memory) {
        return i_highImg;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return i_priceFeed;
    }
}
