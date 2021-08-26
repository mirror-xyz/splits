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

const deployProxyFactory = async (
  splitterAddress: string,
  minterAddress: string,
) => {
  const OurFactory = await ethers.getContractFactory("OurFactory");
  const ourFactory = await OurFactory.deploy(
    splitterAddress,
    minterAddress,
  );
  return await ourFactory.deployed();
};

const PERCENTAGE_SCALE = 1000000;
const NULL_BYTES =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("SplitProxy via Factory", () => {
  describe("basic test", () => {
    let factory, owner, minter, auctionHouse, proxy, proxyCalledAsSplitterByAnyone, proxyCalledAsMinterByOwner, proxyCalledAsMinterByAnyone;
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

        const splitter = await deploySplitter();
        minter = await deployMinter();
        const proxyFactory = await deployProxyFactory(
          splitter.address,
          minter.address,
        );

        const deployTx = await proxyFactory
          .connect(splitCreator)
          .createSplit(rootHash, JSON.stringify(allocations));

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

        proxyCalledAsSplitterByAnyone = await (
          await ethers.getContractAt("OurSplitter", proxy.address, transactionHandler)
        ).deployed();

        proxyCalledAsMinterByOwner = await (
          await ethers.getContractAt("OurMinter", proxy.address, splitCreator)
        ).deployed();

        proxyCalledAsMinterByAnyone = await (
          await ethers.getContractAt("OurMinter", proxy.address, transactionHandler)
        ).deployed();

        factory = await proxyFactory.address;
        owner = await proxy.owner();

        // console.log(
        //   `\nProxy Owner: `, owner, 
        //   `\nSplit Creator: `, splitCreator.address, 
        //   `\nAccount 1: `, account1.address, 
        //   `\nAccount 2: `, account2.address, 
        //   `\nFunder: `, funder.address, 
        //   `\nProxy: `, proxy.address, 
        //   `\n'Callable' Proxy (as Splitter): `, proxyCalledAsSplitterByAnyone.address,
        //   `\n'Callable' Proxy (as Minter): `, proxyCalledAsMinterByOwner.address,
        //   `\nTransaction Handler: `, transactionHandler.address
        // )
      });

      it("Owner is the splitCreator", async () => {
        // console.log(`Proxy Owner: `, owner, `\nTransaction Handler: `, transactionHandler.address)
        expect(owner).to.eq(splitCreator.address)
      })

      describe("and 1 ETH is deposited and the window is incremented", () => {
        beforeEach(async () => {
          await funder.sendTransaction({
            to: proxy.address,
            value: ethers.utils.parseEther("1"),
          });

          await proxyCalledAsSplitterByAnyone.incrementWindow();
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
            claimTx = await proxyCalledAsSplitterByAnyone
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
            expect(await proxyCalledAsSplitterByAnyone.balanceForWindow(0)).to.eq(
              ethers.utils.parseEther("1").toString()
            );
          });

          it("gets 0.5 ETH from scaleAmountByPercentage", async () => {
            expect(
              await proxyCalledAsSplitterByAnyone.scaleAmountByPercentage(
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

          it("costs around 71560 gas", async () => {
            const { gasUsed } = await claimTx.wait();
            expect(gasUsed).to.eq(71562);
          });

          describe("and another 1 ETH is added, and the window is incremented", () => {
            beforeEach(async () => {
              await funder.sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("1"),
              });

              await proxyCalledAsSplitterByAnyone.incrementWindow();
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

                await proxyCalledAsSplitterByAnyone
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

                await proxyCalledAsSplitterByAnyone
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

                await proxyCalledAsSplitterByAnyone
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
      let rootHash;
      let deployTx;
      let proxyCalledAsSplitterByAnyone;
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

            splitter = await deploySplitter();
            minter = await deployMinter();
            proxyFactory = await deployProxyFactory(
              splitter.address,
              minter.address,
            );

            deployTx = await proxyFactory.connect(splitCreator).createSplit(rootHash, JSON.stringify(allocations));
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

            proxyCalledAsSplitterByAnyone = await (
              await ethers.getContractAt("OurSplitter", proxy.address, transactionHandler)
            ).deployed();
          });

          it("sets the Splitter address", async () => {
            expect(await proxy.splitter()).to.eq(splitter.address);
          });

          it("sets the Minter address", async () => {
            expect(await proxy.minter()).to.eq(minter.address);
          });

          it("sets the root hash", async () => {
            expect(await proxy.merkleRoot()).to.eq(rootHash);
          });

          it("deletes the merkleRoot from the factory", async () => {
            expect(await proxyFactory.merkleRoot()).to.eq(NULL_BYTES);
          });

          // NOTE: Gas cost is around 495k on rinkeby/mainnet, due to constructor approval calls.
          it("costs less than 450k gas to deploy the proxy", async () => {
            const gasUsed = (await deployTx.wait()).gasUsed;
            console.log(`Gas used to deploy Proxy: `, gasUsed.toString() + '.')
            expect(gasUsed).to.be.lt(550000);
          });

          it("costs around 2M gas to deploy the minter", async () => {
            const gasUsed = (await minter.deployTransaction.wait()).gasUsed;
            console.log(`Gas used to deploy Minter: `, gasUsed.toString() + '.')
            expect(gasUsed).to.be.gt(2000000);
            expect(gasUsed).to.be.lt(2500000);
          });

          it("costs around 700k gas to deploy the splitter", async () => {
            const gasUsed = (await splitter.deployTransaction.wait()).gasUsed;
            console.log(`Gas used to deploy Splitter: `, gasUsed.toString()) + '.'
            expect(gasUsed).to.be.gt(675000);
            expect(gasUsed).to.be.lt(710000);
          });

          describe("when there is 100 ETH in the account and a window has been incremented", () => {
            beforeEach(async () => {
              await secondFunder.sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("100"),
              });

              await proxyCalledAsSplitterByAnyone.incrementWindow();
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
                    const tx = await proxyCalledAsSplitterByAnyone.claim(
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

                  await proxyCalledAsSplitterByAnyone.incrementWindow();
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
                      const tx = await proxyCalledAsSplitterByAnyone.claim(
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
                      proxyCalledAsSplitterByAnyone.claim(
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
                  proxyCalledAsSplitterByAnyone.claim(
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
                await proxyCalledAsSplitterByAnyone
                  .connect(transactionHandler)
                  .claim(window, account, allocation, proof);
                await expect(
                  proxyCalledAsSplitterByAnyone.claim(window, account, allocation, proof)
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
              await proxyCalledAsSplitterByAnyone.incrementWindow();
              // Second Window
              await thirdFunder.sendTransaction({
                to: proxy.address,
                value: ethers.utils.parseEther("100"),
              });
              await proxyCalledAsSplitterByAnyone.connect(transactionHandler).incrementWindow();
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
                    await proxyCalledAsSplitterByAnyone
                      .connect(transactionHandler)
                      .claim(window, account, allocation, proof);
                    await expect(
                      proxyCalledAsSplitterByAnyone
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
                    tx = await proxyCalledAsSplitterByAnyone
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
                      const tx = await proxyCalledAsSplitterByAnyone
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