const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { deploy, log } = deployments;

    const chainId = network.config.chainId;
    const args = [];
    log("---------------------------------------");
    const basicNFT = await deploy("BasicNFT", {
        from: deployer,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
        args: args,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying.....");
        await verify(basicNFT.address, args);
    }
    log("---------------------------------------");
};
