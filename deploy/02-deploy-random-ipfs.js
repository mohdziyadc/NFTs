const { network, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config");
const { storeImages } = require("../utils/uploadToPinata");
const { verify } = require("../utils/verify");

const IMAGES_LOCATION = "./images/randomNft";
let tokenUris;

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { deploy, log } = deployments;

    const chainId = network.config.chainId;
    //Uploading NFT images to Pinata
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris();
    }
    log("---------------------------------------");

    let vrfV2MockAddress, subscriptionId;

    if (developmentChains.includes(network.name)) {
        const vrfV2Coordinator = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        );
        vrfV2MockAddress = vrfV2Coordinator.address;
        const txResponse = await vrfV2Coordinator.createSubscription();
        const txReciept = await txResponse.wait(1);
        subscriptionId = txReciept.events[0].args.subId;
    } else {
        vrfV2Coordinator = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }
    log("--------------------------------------");
    await storeImages(IMAGES_LOCATION);

    // const args = [
    //     vrfV2MockAddress,
    //     networkConfig[chainId].gasLane,
    //     subscriptionId,
    //     networkConfig[chainId].callbackGasLimit,
    //     ,
    //     /*Dog Token Uris */ networkConfig[chainId].mintFee,
    // ];
};

async function handleTokenUris() {
    tokenUris = [];

    return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
