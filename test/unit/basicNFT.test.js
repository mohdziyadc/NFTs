const { assert } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT Unit tests", () => {
          let basicNFT, deployer;

          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              //Only by doing this way we are getting the deployer address
              // if we do deployer = (await getNamedAccounts()).deployer, the deployer is undefined
              await deployments.fixture();
              basicNFT = await ethers.getContract("BasicNFT", deployer);
          });

          describe("constructor", () => {
              it("Intializes NFT correctly", async () => {
                  const name = await basicNFT.name();
                  const symbol = await basicNFT.symbol();
                  const tokenCounter = await basicNFT.getTokenCounter();
                  assert.equal(tokenCounter, "0");
                  assert.equal(name, "Doggie");
                  assert.equal(symbol, "DOG");
              });
          });
          describe("mintNft", () => {
              beforeEach(async () => {
                  const tx = await basicNFT.mintNft();
                  await tx.wait(1);
              });
              it("Allow users to mint an NFT & checks if token counter is incremented", async () => {
                  const tokenURI = await basicNFT.tokenURI(0);
                  const newTokenId = await basicNFT.getTokenCounter();
                  assert.equal(newTokenId.toString(), "1");
                  assert.equal(tokenURI, await basicNFT.TOKEN_URI());
              });

              it("Shows the correct balance and owner of NFT", async () => {
                  const deployerAddress = deployer.address;
                  const deployerBalance = await basicNFT.balanceOf(
                      deployerAddress
                  );
                  const owner = await basicNFT.ownerOf(0);

                  assert.equal(owner, deployerAddress);
                  //Owner should be equal to address with tokenId 0
                  //Balance of deployer should be 1 as he has minted 1 NFT.
                  assert.equal(deployerBalance.toString(), "1");
              });
          });
      });
