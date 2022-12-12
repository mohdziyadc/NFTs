const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random Ipfs Nft Unit Tests", () => {
          let randomIpfsNft, deployer;
          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture();
              randomIpfsNft = await ethers.getContract(
                  "RandomIpfsNft",
                  deployer
              );
          });
      });
