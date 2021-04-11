import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, waffle } from "hardhat";
import AllocationTree from "../merkle-tree/balance-tree";

let proxyFactory;

const deploySplitter = async () => {
  const Splitter = await ethers.getContractFactory("Splitter");
  const splitter = await Splitter.deploy();
  return await splitter.deployed();
};

const deployProxyFactory = async (
  splitterAddress: string,
  fakeWETHAddress: string
) => {
  const SplitFactory = await ethers.getContractFactory("SplitFactory");
  const proxyFactory = await SplitFactory.deploy(
    splitterAddress,
    fakeWETHAddress
  );
  return await proxyFactory.deployed();
};

const PERCENTAGE_SCALE = 1000000;
const NULL_BYTES =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("SplitterProxy via Factory", () => {
  let funder;
  let fakeWETH;
  let account1;
  let account2;
  let account3;
  let account4;
  // Setup
  let proxy;
  let splitter;
  let rootHash;
  let deployTx;
  let callableProxy;
  let allocations;
  let tree;

  beforeEach(async () => {
    [
      funder,
      fakeWETH,
      account1,
      account2,
      account3,
      account4,
    ] = await ethers.getSigners();
  });

  describe("deployment", () => {
    beforeEach(async () => {
      allocations = [
        {
          account: account1.address,
          allocation: BigNumber.from(10 * PERCENTAGE_SCALE),
        },
        {
          account: account2.address,
          allocation: BigNumber.from(30 * PERCENTAGE_SCALE),
        },
        {
          account: account3.address,
          allocation: BigNumber.from(60 * PERCENTAGE_SCALE),
        },
      ];

      tree = new AllocationTree(allocations);
      rootHash = tree.getHexRoot();

      splitter = await deploySplitter();
      proxyFactory = await deployProxyFactory(
        splitter.address,
        fakeWETH.address
      );

      deployTx = await proxyFactory.connect(funder).createSplit(rootHash);
      // Compute address.
      const constructorArgs = ethers.utils.defaultAbiCoder.encode(
        ["bytes32"],
        [rootHash]
      );
      const salt = ethers.utils.keccak256(constructorArgs);
      const proxyBytecode = (await ethers.getContractFactory("SplitProxy"))
        .bytecode;
      const codeHash = ethers.utils.keccak256(proxyBytecode);
      const proxyAddress = await ethers.utils.getCreate2Address(
        proxyFactory.address,
        salt,
        codeHash
      );
      proxy = await (
        await ethers.getContractAt("SplitProxy", proxyAddress)
      ).deployed();

      callableProxy = await (
        await ethers.getContractAt("Splitter", proxy.address)
      ).deployed();
    });

    it("sets the Splitter address", async () => {
      expect(await proxy.splitter()).to.eq(splitter.address);
    });

    it("sets the root hash", async () => {
      expect(await proxy.merkleRoot()).to.eq(rootHash);
    });

    it("deletes the merkleRoot from the factory", async () => {
      expect(await proxyFactory.merkleRoot()).to.eq(NULL_BYTES);
    });

    it("costs 182676 gas to deploy the proxy", async () => {
      const gasUsed = (await deployTx.wait()).gasUsed;
      expect(gasUsed.toString()).to.eq("182676");
    });

    it("costs 691565 gas to deploy the splitter", async () => {
      const gasUsed = (await splitter.deployTransaction.wait()).gasUsed;
      expect(gasUsed.toString()).to.eq("691565");
    });

    describe("when initialized with a root that allocates account1 10%, account2 30%, and account3 60%", () => {
      describe("when there is 100 ETH in the account and a window has been incremented", () => {
        beforeEach(async () => {
          await funder.sendTransaction({
            to: proxy.address,
            value: ethers.utils.parseEther("100"),
          });

          await callableProxy.incrementWindow();
        });

        describe("and account 1 tries to claim 10 ETH", () => {
          let gasUsed;

          it("successfully claims 10 ETH", async () => {
            const index = 0;
            const window = 0;
            const ref = allocations[index];
            const { account, allocation } = ref;
            const proof = tree.getProof(account, allocation);
            const accountBalanceBefore = await waffle.provider.getBalance(
              account
            );
            const tx = await callableProxy.claim(
              window,
              account,
              allocation,
              proof
            );
            gasUsed = (await tx.wait()).gasUsed;
            const accountBalanceAfter = await waffle.provider.getBalance(
              account
            );
            expect(
              accountBalanceAfter.sub(accountBalanceBefore).toString()
            ).to.eq(ethers.utils.parseEther("10"));
          });

          it("costs 61826 gas", async () => {
            expect(gasUsed.toString()).to.eq("61826");
          });
        });

        describe("and an account without an allocation tries to claim 10 ETH with account1's proof", () => {
          it("reverts with 'Invalid proof'", async () => {
            const index = 0;
            const window = 0;
            const ref = allocations[index];
            const { account, allocation } = ref;
            const proof = tree.getProof(account, allocation);
            await expect(
              callableProxy.claim(
                window,
                // Here we change the address!
                account4.address,
                allocation,
                proof
              )
            ).revertedWith("Invalid proof");
          });
        });

        describe("and account1 tries to claim 10 ETH and account2 claims 30 ETH", () => {
          it("successfully claims 10 ETH and 30 ETH", async () => {
            for (let index = 0; index < 2; index++) {
              const window = 0;
              const ref = allocations[index];
              const { account, allocation } = ref;
              const proof = tree.getProof(account, allocation);
              const accountBalanceBefore = await waffle.provider.getBalance(
                account
              );
              await callableProxy.claim(window, account, allocation, proof);
              const accountBalanceAfter = await waffle.provider.getBalance(
                account
              );
              expect(
                accountBalanceAfter.sub(accountBalanceBefore).toString()
              ).to.eq(
                ethers.utils.parseEther(
                  allocation.div(PERCENTAGE_SCALE).toString()
                )
              );
            }
          });
        });

        describe("and account 1 tries to claim 10 ETH twice in one window", () => {
          it("reverts on the second attempt", async () => {
            const index = 0;
            const window = 0;
            const ref = allocations[index];
            const { account, allocation } = ref;
            const proof = tree.getProof(account, allocation);
            await callableProxy.claim(window, account, allocation, proof);
            await expect(
              callableProxy.claim(window, account, allocation, proof)
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
          await callableProxy.incrementWindow();
          // Second Window
          await funder.sendTransaction({
            to: proxy.address,
            value: ethers.utils.parseEther("100"),
          });
          await callableProxy.incrementWindow();
        });

        describe("and account 1 tries to claim 10 ETH twice in one window", () => {
          it("reverts on the second attempt", async () => {
            const index = 0;
            const window = 0;
            const ref = allocations[index];
            const { account, allocation } = ref;
            const proof = tree.getProof(account, allocation);
            await callableProxy.claim(window, account, allocation, proof);
            await expect(
              callableProxy.claim(window, account, allocation, proof)
            ).revertedWith("Account already claimed the given window");
          });
        });

        describe("and account 2 tries to claim 60 ETH using claimForAllWindows", () => {
          let tx;
          it("successfully claims 60 ETH", async () => {
            const ref = allocations[1];
            const { account, allocation } = ref;
            const proof = tree.getProof(account, allocation);
            const accountBalanceBefore = await waffle.provider.getBalance(
              account
            );
            tx = await callableProxy.claimForAllWindows(
              account,
              allocation,
              proof
            );
            const accountBalanceAfter = await waffle.provider.getBalance(
              account
            );
            expect(
              accountBalanceAfter.sub(accountBalanceBefore).toString()
            ).to.eq(ethers.utils.parseEther("60"));
          });

          it("costs 88004 gas", async () => {
            const receipt = await tx.wait();
            expect(receipt.gasUsed.toString()).to.eq("88004");
          });
        });

        describe("and account 1 tries to claim 10 ETH twice across both windows", () => {
          it("successfully claims 10 ETH on each window", async () => {
            for (let window = 0; window < 2; window++) {
              const index = 0;
              const ref = allocations[index];
              const { account, allocation } = ref;
              const proof = tree.getProof(account, allocation);
              const accountBalanceBefore = await waffle.provider.getBalance(
                account
              );
              const tx = await callableProxy.claim(
                window,
                account,
                allocation,
                proof
              );
              const accountBalanceAfter = await waffle.provider.getBalance(
                account
              );
              expect(accountBalanceAfter.sub(accountBalanceBefore)).to.eq(
                ethers.utils.parseEther("10")
              );
            }
          });
        });
      });
    });
  });
});
