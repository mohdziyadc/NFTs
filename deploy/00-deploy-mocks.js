const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9;
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();

    const { deploy, log } = deployments;

    if (developmentChains.includes(network.name)) {
        log("Local Network Detected. Deploying Mocks......");

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        });

        log("Mocks Deployed!");
        log("-----------------------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
