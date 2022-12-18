const { network, ethers } = require("hardhat");

const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { deploy, log } = deployments;

    const chainId = network.config.chainId;
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdpriceFeedAddress;
    }

    const lowSvg = fs.readFileSync("./images/dynamicNft/frown.svg", {
        encoding: "utf8",
    });

    const highSvg = fs.readFileSync("./images/dynamicNft/happy.svg", {
        encoding: "utf8",
    });

    const args = [ethUsdPriceFeedAddress, highSvg, lowSvg];

    log("------------------------------------------");

    const dynamicSvgNft = await deploy("DynamicSvgNFT", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying....");
        await verify(dynamicSvgNft.address, args);
    }
};

module.exports.tags = ["all", "dynamicsvg", "main"];
