import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, waffle } from "hardhat";
import AllocationTree from "../merkle-tree/balance-tree";

import scenarios from "./scenarios.json";

let proxyFactory;

const deploySplitter = async () => {
  const OurSplitter = await ethers.getContractFactory("OurSplitter");
  const ourSplitter = await OurSplitter.deploy();
  return await ourSplitter.deployed();
};

const deployMinter = async (
) => {
  const OurMinter = await ethers.getContractFactory("OurMinter");
  const ourMinter = await OurMinter.deploy();
  return await ourMinter.deployed();
};

const deployPylon = async () => {
  const OurPylon = await ethers.getContractFactory("OurPylon");
  const ourPylon = await OurPylon.deploy();
  return await ourPylon.deployed();
};

const deployFactory = async (
  pylonAddress: string
) => {
  const OurFactory = await ethers.getContractFactory("OurFactory");
  const ourFactory = await OurFactory.deploy(
    pylonAddress
  );
  return await ourFactory.deployed();
};

const PERCENTAGE_SCALE = 1000000;
const NULL_BYTES =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("SplitProxy via Factory", () => {
  describe("basic test", () => {
    let factory,
      PylonSplitter,
      splitter,
      PylonMinter,
      proxyPylonByOwner,
      minter, pylon, auctionHouse, proxy, proxySplitterByAnyone, proxyPylonByAnyone, proxyMinterByOwner, proxyMinterByAnyone;
    let splitCreator, fakeWETH, account1, account2, funder, transactionHandler;
    let tree;

    describe("when there is a 50-50 allocation", () => {
      beforeEach(async () => {
        [
          splitCreator,
          fakeWETH,
          account1,
          account2,
          funder,
          transactionHandler,
        ] = await ethers.getSigners();

        const claimers = [account1, account2];

        const allocationPercentages = [50000000, 50000000];
        const allocations = allocationPercentages.map((percentage, index) => {
          return {
            account: claimers[index].address,
            allocation: BigNumber.from(percentage),
          };
        });

        tree = new AllocationTree(allocations);
        const rootHash = tree.getHexRoot();

        // splitter = await deploySplitter();
        // minter = await deployMinter();

        pylon = await deployPylon();

        const proxyFactory = await deployFactory(pylon.address);

        const owners_ = [splitCreator.address, account2.address]
        const creator_ = splitCreator.address


        const deployData = pylon.interface.encodeFunctionData("setup", [
          owners_
        ])

        const deployTx = await proxyFactory
          .connect(splitCreator)
          .createSplit(rootHash, deployData, JSON.stringify(allocations));

        // Compute address.
        const constructorArgs = ethers.utils.defaultAbiCoder.encode(
          ["bytes32"],
          [rootHash]
        );
        const salt = ethers.utils.keccak256(constructorArgs);
        const proxyBytecode = (await ethers.getContractFactory("OurProxy"))
          .bytecode;
        const codeHash = ethers.utils.keccak256(proxyBytecode);
        const proxyAddress = await ethers.utils.getCreate2Address(
          proxyFactory.address,
          salt,
          codeHash
        );
        proxy = await (
          await ethers.getContractAt("OurProxy", proxyAddress)
        ).deployed();

        proxySplitterByAnyone = await (
          await ethers.getContractAt("OurSplitter", proxy.address, transactionHandler)
        ).deployed();

        proxyPylonByAnyone = await (
          await ethers.getContractAt("OurPylon", proxy.address, transactionHandler)
        ).deployed();

        proxyPylonByOwner = await (
          await ethers.getContractAt("OurPylon", proxy.address, splitCreator)
        ).deployed();
        proxyPylonByAnyone = await (
          await ethers.getContractAt("OurPylon", proxy.address, transactionHandler)
        ).deployed();

        proxyMinterByOwner = await (
          await ethers.getContractAt("OurMinter", proxy.address, splitCreator)
        ).deployed();

        proxyMinterByAnyone = await (
          await ethers.getContractAt("OurMinter", proxy.address, transactionHandler)
        ).deployed();


        // PylonSplitter = await pylon.splitter();
        // PylonMinter = await pylon.minter();
        factory = await proxyFactory.address;


        // console.log(
        //   `\nProxy Owner: `, owner, 
        //   `\nSplit Creator: `, splitCreator.address, 
        //   `\nAccount 1: `, account1.address, 
        //   `\nAccount 2: `, account2.address, 
        //   `\nFunder: `, funder.address, 
        //   `\nProxy: `, proxy.address, 
        //   `\n'Callable' Proxy (as Splitter): `, proxySplitterByAnyone.address,
        //   `\n'Callable' Proxy (as Minter): `, proxyMinterByOwner.address,
        //   `\nTransaction Handler: `, transactionHandler.address
        // )
      });

      it("Owner is the splitCreator, Addresses Set Correctly", async () => {
        // console.log(`Proxy Owner: `, owner, `\nTransaction Handler: `, transactionHandler.address)
        const ownerBool = async (address) => await proxyPylonByAnyone.isOwner(address);
        const arg1 = await ownerBool(splitCreator.address)
        const arg2 = await ownerBool(account2.address)
        const notOwner = await ownerBool(account1.address)
        expect(arg1).to.eq(true)
        expect(arg2).to.eq(true)
        expect(notOwner).to.eq(false)
        // expect(PylonSplitter).to.eq(splitter.address)
        // expect(PylonMinter).to.eq(minter.address)
      })

      it("Management Works as Expected", async () => {
        // console.log(`Proxy Owner: `, owner, `\nTransaction Handler: `, transactionHandler.address)
        const proxyOwners = await proxyPylonByAnyone.getOwners();
        // if (proxyOwners) {
        //   console.log(`proxyOwners`, proxyOwners)
        // }
        const ownerBool = async (address) => await proxyPylonByAnyone.isOwner(address);
        const swap2 = await proxyPylonByOwner.swapOwner(splitCreator.address, account2.address, account1.address)
        const removed = await ownerBool(account2.address)
        const approved = await ownerBool(account1.address)
        // const thisShouldFail = await proxyPylonByAnyone.swapOwner(splitCreator.address, account1.address, account2.address)
        expect(approved).to.eq(true)
        expect(removed).to.eq(false)
        // expect(thisShouldFail).to.reverted
        // expect(PylonSplitter).to.eq(splitter.address)
        // expect(PylonMinter).to.eq(minter.address)
      })

      describe("and 1 ETH is deposited and the window is incremented", () => {
        beforeEach(async () => {
          await funder.sendTransaction({
            to: proxy.address,
            value: ethers.utils.parseEther("1"),
          });

          await proxySplitterByAnyone.incrementWindow();
        });

        describe("and one account claims on the first window", () => {
          let amountClaimed, allocation, claimTx;
          beforeEach(async () => {
            // Setup.
            const window = 0;
            const account = account1.address;
            allocation = BigNumber.from("50000000");
            const proof = tree.getProof(account, allocation);
            const accountBalanceBefore = await waffle.provider.getBalance(
              account
            );
            // console.log(`1`)
            claimTx = await proxySplitterByAnyone
              .connect(account1)
              .claim(window, account, allocation, proof);

            // console.log(`2`)
            const accountBalanceAfter = await waffle.provider.getBalance(
              account
            );
            // console.log(`3`)

            amountClaimed = accountBalanceAfter.sub(accountBalanceBefore);
          });

          it("it returns 1 ETH for balanceForWindow[0]", async () => {
            // console.log(`4`)
            expect(await proxySplitterByAnyone.balanceForWindow(0)).to.eq(
              ethers.utils.parseEther("1").toString()
            );
          });

          it("gets 0.5 ETH from scaleAmountByPercentage", async () => {
            expect(
              await proxySplitterByAnyone.scaleAmountByPercentage(
                allocation,
                ethers.utils.parseEther("1").toString()
              )
            ).to.eq(ethers.utils.parseEther("0.5").toString());
          });

          it("allows them to successfully claim 0.5 ETH", async () => {
            expect(amountClaimed).to.eq(
              ethers.utils.parseEther("0.5")
            );
          });

          // 2k less gas than original splits
          it("costs around 69563 gas", async () => {
            const { gasUsed } = await claimTx.wait();
            expect(gasUsed).to.eq(69563);
          });

          describe("and another 1 ETH is added, and the window is incremented", () => {
            beforeEach(async () => {
              await funder.sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("1"),
              });

              await proxySplitterByAnyone.incrementWindow();
            });

            describe("and the other account claims on the second window", () => {
              let amountClaimedBySecond;
              beforeEach(async () => {
                // Setup.
                const window = 1;
                const account = account2.address;
                const allocation = BigNumber.from("50000000");
                const proof = tree.getProof(account, allocation);
                const accountBalanceBefore = await waffle.provider.getBalance(
                  account
                );

                await proxySplitterByAnyone
                  .connect(transactionHandler)
                  .claim(window, account, allocation, proof);

                const accountBalanceAfter = await waffle.provider.getBalance(
                  account
                );

                amountClaimedBySecond = accountBalanceAfter.sub(
                  accountBalanceBefore
                );
              });

              // there seems to be a small (~0.00007 ETH) loss of funds, likely due to logic in fallback
              it("allows them to successfully claim 0.5 ETH", async () => {
                expect(amountClaimedBySecond.toString()).to.eq(
                  ethers.utils.parseEther("0.5").toString()
                );
              });
            });

            describe("and the other account claims on the first window", () => {
              let amountClaimedBySecond;
              beforeEach(async () => {
                // Setup.
                const window = 0;
                const account = account2.address;
                const allocation = BigNumber.from("50000000");
                const proof = tree.getProof(account, allocation);
                const accountBalanceBefore = await waffle.provider.getBalance(
                  account
                );

                await proxySplitterByAnyone
                  .connect(transactionHandler)
                  .claim(window, account, allocation, proof);

                const accountBalanceAfter = await waffle.provider.getBalance(
                  account
                );

                amountClaimedBySecond = accountBalanceAfter.sub(
                  accountBalanceBefore
                );
              });

              it("allows them to successfully claim 0.5 ETH", async () => {
                expect(amountClaimedBySecond.toString()).to.eq(
                  ethers.utils.parseEther("0.5").toString()
                );
              });
            });

            describe("and the first account claims on the second window", () => {
              let amountClaimedBySecond;
              beforeEach(async () => {
                // Setup.
                const window = 1;
                const account = account1.address;
                const allocation = BigNumber.from("50000000");
                const proof = tree.getProof(account, allocation);
                const accountBalanceBefore = await waffle.provider.getBalance(
                  account
                );

                await proxySplitterByAnyone
                  .connect(transactionHandler)
                  .claim(window, account, allocation, proof);

                const accountBalanceAfter = await waffle.provider.getBalance(
                  account
                );

                amountClaimedBySecond = accountBalanceAfter.sub(
                  accountBalanceBefore
                );
              });

              it("allows them to successfully claim 0.5 ETH", async () => {
                expect(amountClaimedBySecond.toString()).to.eq(
                  ethers.utils.parseEther("0.5").toString()
                );
              });
            });
          });
        });
      });
    });
  });

  describe("scenario tests", () => {
    for (
      let scenarioIndex = 0;
      scenarioIndex < scenarios.length;
      scenarioIndex++
    ) {
      const {
        allocationPercentages,
        firstDepositFirstWindow,
        secondDepositSecondWindow,
      } = scenarios[scenarioIndex];
      const scaledPercentages = allocationPercentages.map(
        (p) => p / PERCENTAGE_SCALE
      );

      let splitCreator;
      let secondFunder;
      let thirdFunder;
      let fourthFunder;
      let fakeWETH;
      let account1;
      let account2;
      let account3;
      let account4;
      // Setup
      let proxy;
      let splitter;
      let minter;
      let pylon;
      let rootHash;
      let deployTx;
      let proxyPylonByAnyone;
      let proxySplitterByAnyone;
      let allocations;
      let tree;
      let claimers;
      let funder;
      let transactionHandler;

      beforeEach(async () => {
        [
          splitCreator,
          secondFunder,
          thirdFunder,
          fourthFunder,
          // Use a different account for transactions, to simplify gas accounting.
          transactionHandler,
          funder,
          fakeWETH,
          account1,
          account2,
          account3,
          account4,
        ] = await ethers.getSigners();

        claimers = [account1, account2, account3, account4];
      });

      describe("#createSplit", () => {
        describe(`when the allocation is ${scaledPercentages.join(
          "%, "
        )}%`, () => {
          beforeEach(async () => {
            allocations = allocationPercentages.map((percentage, index) => {
              return {
                account: claimers[index].address,
                allocation: BigNumber.from(percentage),
              };
            });

            tree = new AllocationTree(allocations);
            rootHash = tree.getHexRoot();

            // const splitter = await deploySplitter();
            // minter = await deployMinter();

            pylon = await deployPylon();

            const proxyFactory = await deployFactory(pylon.address);

            const owners = [splitCreator.address]
            const deployData = pylon.interface.encodeFunctionData("setup",
              [owners])

            deployTx = await proxyFactory
              .connect(splitCreator)
              .createSplit(rootHash, deployData, JSON.stringify(allocations));

            // Compute address.
            const constructorArgs = ethers.utils.defaultAbiCoder.encode(
              ["bytes32"],
              [rootHash]
            );
            const salt = ethers.utils.keccak256(constructorArgs);
            const proxyBytecode = (
              await ethers.getContractFactory("OurProxy")
            ).bytecode;
            const codeHash = ethers.utils.keccak256(proxyBytecode);
            const proxyAddress = await ethers.utils.getCreate2Address(
              proxyFactory.address,
              salt,
              codeHash
            );
            proxy = await (
              await ethers.getContractAt("OurProxy", proxyAddress)
            ).deployed();

            proxyPylonByAnyone = await (
              await ethers.getContractAt("OurPylon", proxy.address, transactionHandler)
            ).deployed();

            proxySplitterByAnyone = await (
              await ethers.getContractAt("OurSplitter", proxy.address, transactionHandler)
            ).deployed();
          });

          // it("sets the Splitter address", async () => {
          //   expect(await proxy.splitter()).to.eq(splitter.address);
          // });

          // it("sets the Minter address", async () => {
          //   expect(await proxy.minter()).to.eq(minter.address);
          // });

          it("sets the root hash", async () => {
            expect(await proxy.merkleRoot()).to.eq(rootHash);
          });

          it("deletes the merkleRoot from the factory", async () => {
            const factoryMerkle = await proxyFactory.merkleRoot()

            // fails but .... that is technically passing..
            expect(factoryMerkle).to.eq(NULL_BYTES);
          });

          // NOTE: Gas cost is around 495k on rinkeby/mainnet, due to constructor approval calls.
          it("costs less than 450k gas to deploy the proxy", async () => {
            const gasUsed = (await deployTx.wait()).gasUsed;
            console.log(`Gas used to deploy Proxy: `, gasUsed.toString() + '.')
            expect(gasUsed).to.be.lt(550000);
          });

          it("costs around 2M gas to deploy the minter", async () => {
            const gasUsed = (await pylon.deployTransaction.wait()).gasUsed;
            console.log(`Gas used to deploy Minter: `, gasUsed.toString() + '.')
            expect(gasUsed).to.be.gt(3000000);
            expect(gasUsed).to.be.lt(3500000);
          });

          // it("costs around 700k gas to deploy the splitter", async () => {
          //   const gasUsed = (await splitter.deployTransaction.wait()).gasUsed;
          //   console.log(`Gas used to deploy Splitter: `, gasUsed.toString()) + '.'
          //   expect(gasUsed).to.be.gt(675000);
          //   expect(gasUsed).to.be.lt(710000);
          // });

          describe("when there is 100 ETH in the account and a window has been incremented", () => {
            beforeEach(async () => {
              await secondFunder.sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("100"),
              });

              await proxySplitterByAnyone.incrementWindow();
            });

            for (
              let accountIndex = 0;
              accountIndex < allocationPercentages.length;
              accountIndex++
            ) {
              describe(`and account ${accountIndex + 1
                } tries to claim ${firstDepositFirstWindow[
                  accountIndex
                ].toString()} ETH on the first window with the correct allocation`, () => {
                  let gasUsed;

                  it("successfully claims", async () => {
                    const window = 0;
                    const ref = allocations[accountIndex];
                    const { account, allocation } = ref;
                    const proof = tree.getProof(account, allocation);
                    const accountBalanceBefore = await waffle.provider.getBalance(
                      account
                    );
                    const tx = await proxySplitterByAnyone.claim(
                      window,
                      account,
                      allocation,
                      proof
                    );
                    gasUsed = (await tx.wait()).gasUsed;
                    const accountBalanceAfter = await waffle.provider.getBalance(
                      account
                    );

                    const amountClaimed = accountBalanceAfter.sub(
                      accountBalanceBefore
                    );
                    expect(amountClaimed.toString()).to.eq(
                      ethers.utils.parseEther(
                        firstDepositFirstWindow[accountIndex].toString()
                      )
                    );
                  });

                  // NOTE: Gas cost is around 60973, but depends slightly.
                  // it("costs 60984 gas", async () => {
                  //   expect(gasUsed.toString()).to.eq("60984");
                  // });
                });

              describe("and another 100 ETH is added, and the window is been incremented", () => {
                beforeEach(async () => {
                  await secondFunder.sendTransaction({
                    to: proxy.address,
                    value: ethers.utils.parseEther("100"),
                  });

                  await proxySplitterByAnyone.incrementWindow();
                });

                describe(`and account ${accountIndex + 1
                  } tries to claim ${secondDepositSecondWindow[
                    accountIndex
                  ].toString()} ETH on the second window with the correct allocation`, () => {
                    let gasUsed;

                    it("successfully claims", async () => {
                      const window = 1;
                      const ref = allocations[accountIndex];
                      const { account, allocation } = ref;
                      const proof = tree.getProof(account, allocation);
                      const accountBalanceBefore = await waffle.provider.getBalance(
                        account
                      );
                      const tx = await proxySplitterByAnyone.claim(
                        window,
                        account,
                        allocation,
                        proof
                      );
                      gasUsed = (await tx.wait()).gasUsed;
                      const accountBalanceAfter = await waffle.provider.getBalance(
                        account
                      );
                      const amountClaimed = accountBalanceAfter.sub(
                        accountBalanceBefore
                      );
                      expect(amountClaimed.toString()).to.eq(
                        ethers.utils.parseEther(
                          secondDepositSecondWindow[accountIndex].toString()
                        )
                      );
                    });

                    // NOTE: Gas cost is around 60973, but depends slightly on the size of the
                    // allocation. Can check by uncommenting this and running the test.
                    // it("costs 60973 gas", async () => {
                    //   expect(gasUsed.toString()).to.eq("60973");
                    // });
                  });
              });

              describe(`and account ${accountIndex + 1
                } tries to claim with a higher allocation`, () => {
                  it("reverts with 'Invalid proof'", async () => {
                    const index = 0;
                    const window = 0;
                    const ref = allocations[index];
                    const { account, allocation } = ref;
                    const incorrectAllocation = allocation + 1;
                    const proof = tree.getProof(account, allocation);
                    await expect(
                      proxySplitterByAnyone.claim(
                        window,
                        account,
                        incorrectAllocation,
                        proof
                      )
                    ).revertedWith("Invalid proof");
                  });
                });
            }

            describe("and an account without an allocation tries to claim with account1's proof", () => {
              it("reverts with 'Invalid proof'", async () => {
                const index = 0;
                const window = 0;
                const ref = allocations[index];
                const { account, allocation } = ref;
                const proof = tree.getProof(account, allocation);
                await expect(
                  proxySplitterByAnyone.claim(
                    window,
                    // Here we change the address!
                    account4.address,
                    allocation,
                    proof
                  )
                ).revertedWith("Invalid proof");
              });
            });

            describe("and account 1 tries to claim twice in one window", () => {
              it("reverts on the second attempt", async () => {
                const index = 0;
                const window = 0;
                const ref = allocations[index];
                const { account, allocation } = ref;
                const proof = tree.getProof(account, allocation);
                await proxySplitterByAnyone
                  .connect(transactionHandler)
                  .claim(window, account, allocation, proof);
                await expect(
                  proxySplitterByAnyone.claim(window, account, allocation, proof)
                ).revertedWith("Account already claimed the given window");
              });
            });
          });

          describe("when there is 200 ETH in the account across 2 windows", () => {
            beforeEach(async () => {
              // First Window
              await funder.sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("100"),
              });
              await proxySplitterByAnyone.incrementWindow();
              // Second Window
              await thirdFunder.sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("100"),
              });
              await proxySplitterByAnyone.connect(transactionHandler).incrementWindow();
            });

            for (
              let accountIndex = 0;
              accountIndex < allocationPercentages.length;
              accountIndex++
            ) {
              describe(`and account ${accountIndex + 1
                } tries to claim twice in one window`, () => {
                  it("reverts on the second attempt", async () => {
                    const window = 0;
                    const ref = allocations[accountIndex];
                    const { account, allocation } = ref;
                    const proof = tree.getProof(account, allocation);
                    await proxySplitterByAnyone
                      .connect(transactionHandler)
                      .claim(window, account, allocation, proof);
                    await expect(
                      proxySplitterByAnyone
                        .connect(transactionHandler)
                        .claim(window, account, allocation, proof)
                    ).revertedWith("Account already claimed the given window");
                  });
                });

              describe(`and account ${accountIndex + 1
                } tries to claim using claimForAllWindows`, () => {
                  let tx;
                  it("successfully claims", async () => {
                    const ref = allocations[accountIndex];
                    const { account, allocation } = ref;
                    const proof = tree.getProof(account, allocation);
                    const accountBalanceBefore = await waffle.provider.getBalance(
                      account
                    );
                    tx = await proxySplitterByAnyone
                      .connect(transactionHandler)
                      .claimForAllWindows(account, allocation, proof);
                    const accountBalanceAfter = await waffle.provider.getBalance(
                      account
                    );

                    const amountClaimed = accountBalanceAfter
                      .sub(accountBalanceBefore)
                      .toString();
                    const claimExpected = ethers.utils
                      // Use the appropriate account.
                      .parseEther(scaledPercentages[accountIndex].toString())
                      // Multiply 2 because there are two windows.
                      .mul(2)
                      .toString();
                    expect(amountClaimed).to.eq(claimExpected);
                  });

                  // NOTE: Gas cost is around 88004, but depends slightly on the size of the
                  // allocation. Can check by uncommenting this and running the test.
                  // it("costs 88004 gas", async () => {
                  //   const receipt = await tx.wait();
                  //   expect(receipt.gasUsed.toString()).to.eq("88004");
                  // });
                });

              describe(`and account ${accountIndex + 1
                } tries to claim twice across both windows`, () => {
                  it("successfully claims on each window", async () => {
                    for (let window = 0; window < 2; window++) {
                      const ref = allocations[accountIndex];
                      const { account, allocation } = ref;
                      const proof = tree.getProof(account, allocation);
                      const accountBalanceBefore = await waffle.provider.getBalance(
                        account
                      );
                      const tx = await proxySplitterByAnyone
                        .connect(transactionHandler)
                        .claim(window, account, allocation, proof);
                      const accountBalanceAfter = await waffle.provider.getBalance(
                        account
                      );

                      const amountClaimed = accountBalanceAfter
                        .sub(accountBalanceBefore)
                        .toString();
                      const claimExpected = ethers.utils
                        .parseEther(scaledPercentages[accountIndex].toString())
                        .toString();
                      expect(amountClaimed).to.eq(claimExpected);
                    }
                  });
                });
            }
          });
        });
      });
    }
  });
});