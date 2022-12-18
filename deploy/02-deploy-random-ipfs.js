const { network, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config");
require("dotenv").config();
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata");
const { verify } = require("../utils/verify");

const IMAGES_LOCATION = "./images/randomNft";
let tokenUris = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
];
const FUND_AMOUNT = "1000000000000000000000"; //10 LINK

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
};

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { deploy, log } = deployments;

    const chainId = network.config.chainId;
    //Uploading NFT images to Pinata
    // if (process.env.UPLOAD_TO_PINATA == "true") {
    //     tokenUris = await handleTokenUris();
    // }
    log("---------------------------------------");

    let vrfV2MockAddress, subscriptionId, vrfV2Coordinator;

    if (developmentChains.includes(network.name)) {
        vrfV2Coordinator = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfV2MockAddress = vrfV2Coordinator.address;
        const txResponse = await vrfV2Coordinator.createSubscription();
        const txReciept = await txResponse.wait(1);
        subscriptionId = txReciept.events[0].args.subId;
        await vrfV2Coordinator.fundSubscription(subscriptionId, FUND_AMOUNT);
    } else {
        vrfV2MockAddress = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }
    log("--------------------------------------");

    const args = [
        vrfV2MockAddress,
        networkConfig[chainId].gasLane,
        subscriptionId,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ];

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying.....");
        await verify(randomIpfsNft.address, args);
    }

    if (developmentChains.includes(network.name)) {
        //to avoid Invalid Consumer error
        vrfV2Coordinator.addConsumer(
            subscriptionId.toNumber(),
            randomIpfsNft.address
        );
    }
    log("---------------------------------------");
};

async function handleTokenUris() {
    tokenUris = [];
    //Store the image to IPFS --> already done by uploadToPinata
    //store the metadata
    const { responses, files } = await storeImages(IMAGES_LOCATION);

    for (responseIdx in responses) {
        let tokenUriMetadata = { ...metadataTemplate }; //Destructuring
        tokenUriMetadata.name = files[responseIdx].replace(".png", "");
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
        tokenUriMetadata.image = `ipfs://${responses[responseIdx].IpfsHash}`;
        console.log(`Uploading ${tokenUriMetadata.name}...`);
        //store the JSON to Pinata
        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        );
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
    }
    console.log("Token URIs uploaded!! Here it is!!");
    console.log(tokenUris);
    return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
