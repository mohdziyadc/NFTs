const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random Ipfs Nft Unit Tests", () => {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock, mintFee;

          const chainId = network.config.chainId;
          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture();
              randomIpfsNft = await ethers.getContract(
                  "RandomIpfsNft",
                  deployer
              );
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              );
              mintFee = await randomIpfsNft.getMintFee();
          });

          describe("constructor", () => {
              it("Initializes correctly", async () => {
                  const name = await randomIpfsNft.name();
                  const symbol = await randomIpfsNft.symbol();
                  const tokenCounter = await randomIpfsNft.getTokenCounter();
                  const neededMintFee = networkConfig[chainId].mintFee;
                  const dogTokenUriZero = await randomIpfsNft.getDogTokenUri(0);
                  const intializeTokenUris =
                      await randomIpfsNft.getTokenUrisIntialized();

                  assert.equal(name, "Random IPFS NFT");
                  assert.equal(symbol, "RIN");
                  assert.equal(tokenCounter.toString(), "0");
                  assert.equal(mintFee.toString(), neededMintFee.toString());
                  assert(dogTokenUriZero.includes("ipfs://"));
                  assert.equal(intializeTokenUris, true);
              });
          });

          describe("requestNft", () => {
              it("reverts if there isn't enough mint fee", async () => {
                  await expect(
                      randomIpfsNft.requestNft({
                          value: ethers.utils.parseEther("0.001"),
                      })
                  ).to.be.revertedWith("RandomIpfsNft__NotEnoughETH");
              });

              it("emits the event on request", async () => {
                  await expect(
                      randomIpfsNft.requestNft({ value: mintFee })
                  ).to.emit(randomIpfsNft, "NftRequested");
              });

              it("requests the random words", async () => {
                  const tx = await randomIpfsNft.requestNft({ value: mintFee });
                  const txReceipt = await tx.wait(1);
                  const requestId = txReceipt.events[1].args.requestId;
                  //   console.log(requestId.toNumber()); == 1
                  assert(requestId.toNumber() > 0);
              });
          });

          describe("withdraw", () => {
              beforeEach(async () => {
                  await randomIpfsNft.requestNft({ value: mintFee });
              });

              it("checks if only the owner can access", async () => {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];

                  const attackerConnect = await randomIpfsNft.connect(attacker);

                  await expect(attackerConnect.withdraw()).to.be.reverted;
              });
          });

          describe("fulfillRandomWords", () => {
              it("mints an NFT after a random number is requested", async () => {
                  /**
                   * 1. We need to request the random words by calling the requestRandomWords function in the mock contract.
                   * 2. Then we need to call the fulfillRandomWords in the mock.
                   * 3. Then we need to setup a listener which makes sure that our "NftMinted" event is
                   * emitted.
                   */
                  //3
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenCounter =
                                  await randomIpfsNft.getTokenCounter();
                              const dogTokenUriZero =
                                  await randomIpfsNft.getDogTokenUri(0);
                              assert.equal(tokenCounter.toString(), "1");
                              assert(dogTokenUriZero.includes("ipfs://"));
                              resolve();
                          } catch (e) {
                              console.log(e);
                              reject(e);
                          }
                      });
                      try {
                          //1
                          const requestNftTx = await randomIpfsNft.requestNft({
                              value: mintFee,
                          });
                          const requestNftReceipt = await requestNftTx.wait(1);
                          //2
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          );
                      } catch (e) {
                          console.log(e);
                          reject(e);
                      }
                  });
              });
          });

          describe("getBreedFromModdedRNG", () => {
              it("returns a pug if moddedRng < 10", async () => {
                  const pug = await randomIpfsNft.getBreedFromModdedRng(4);
                  assert.equal(pug.toString(), "0");
              });
              it("returns a shiba inu if moddedRng >= 10 and < 30", async () => {
                  const pug = await randomIpfsNft.getBreedFromModdedRng(10);
                  assert.equal(pug.toString(), "1");
              });
              it("returns a st bernard if moddedRng >=30 and <100", async () => {
                  const pug = await randomIpfsNft.getBreedFromModdedRng(30);
                  assert.equal(pug.toString(), "2");
              });
              it("revert if moddedRng > 100", async () => {
                  await expect(
                      randomIpfsNft.getBreedFromModdedRng(100)
                  ).to.be.revertedWith("RandomIpfsNft__RangeOutOfBounds");
              });
          });
      });
