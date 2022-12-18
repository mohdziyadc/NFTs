/**
 * This file is needed bcz we wont have the consumer address for our
 * Chainlink VRF. Hence we need to deploy Random IPFS NFT and get the address
 * and then add the consumer to Chainlink VRF(create a new subscription ID).
 * Then only we can mint the random IPFS NFT.
 * Here we are minting 3 Nfts also but mainly this is for random IPFS NFT
 */

const { network, ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNFT", deployer);
    const basicMintTx = await basicNft.mintNft();
    await basicMintTx.wait(1);
    console.log(`Basic NFT index 0 tokenURI: ${await basicNft.tokenURI(0)}`);

    // Dynamic SVG  NFT
    const highValue = ethers.utils.parseEther("4000");
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNFT", deployer);
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue);
    await dynamicSvgNftMintTx.wait(1);
    console.log(
        `Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
    );

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
    const mintFee = await randomIpfsNft.getMintFee();
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({
        value: mintFee.toString(),
    });
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);
    // Need to listen for response
    await new Promise(async (resolve, reject) => {
        setTimeout(
            () => reject("Timeout: 'NFTMinted' event did not fire"),
            300000
        ); // 5 minute timeout time
        // setup listener for our event
        randomIpfsNft.once("NftMinted", async () => {
            resolve();
        });
        if (chainId == 31337) {
            const requestId =
                randomIpfsNftMintTxReceipt.events[1].args.requestId.toString();
            const vrfCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            );
            await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestId,
                randomIpfsNft.address
            );
        }
    });
    console.log(
        `Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`
    );
};
module.exports.tags = ["all", "mint"];
