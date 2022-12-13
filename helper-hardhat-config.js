const { ethers } = require("hardhat");

const networkConfig = {
    5: {
        name: "goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", //150 key hash
        subscriptionId: "6070",
        callbackGasLimit: "500000",
        mintFee: ethers.utils.parseEther("0.01"),
    },

    31337: {
        name: "hardhat",
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8dc1a89", //doesn't really matter bcz we are deploying a mock with a gaslane but it should be of same length as the key hash
        callbackGasLimit: "500000",
        mintFee: ethers.utils.parseEther("0.01"),
    },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains,
};
