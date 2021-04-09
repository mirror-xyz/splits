import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, waffle } from "hardhat";
import AllocationTree from "../merkle-tree/balance-tree";
import { SplitterV3 } from "../ts-types/contracts";

const deploySplitter = async () => {
  const Splitter = await ethers.getContractFactory("SplitterV4");
  const splitter = await Splitter.deploy();
  return await splitter.deployed();
};

const deployProxy = async (
  splitterAddress: string,
  fakeWETHAddress: string
) => {
  const SplitterProxy = await ethers.getContractFactory("SplitterProxyV2");
  const proxy = await SplitterProxy.deploy(splitterAddress, fakeWETHAddress);
  return await proxy.deployed();
};

describe("SplitterProxy", () => {
  let funder;
  let fakeWETH;
  let account1;
  let account2;
  let account3;
  let account4;

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
    let proxy, splitter;

    beforeEach(async () => {
      splitter = await deploySplitter();
      proxy = await deployProxy(splitter.address, fakeWETH.address);
    });

    it("sets the Splitter address", async () => {
      expect(await proxy.splitter()).to.eq(splitter.address);
    });

    it("costs 272336 gas", async () => {
      const gasUsed = (await proxy.deployTransaction.wait()).gasUsed;
      expect(gasUsed.toString()).to.eq("272336");
    });
  });

  describe("initialize", () => {
    let splitter, proxy, rootHash, tx, receipt;

    beforeEach(async () => {
      splitter = await deploySplitter();
      proxy = await deployProxy(splitter.address, fakeWETH.address);

      const tree = new AllocationTree([
        { account: account1.address, allocation: BigNumber.from(10) },
        { account: account2.address, allocation: BigNumber.from(30) },
        { account: account3.address, allocation: BigNumber.from(60) },
      ]);

      rootHash = tree.getHexRoot();
      tx = await proxy.connect(funder).initialize(rootHash);
      receipt = await tx.wait();
    });

    it("sets initialized to true", async () => {
      expect(await proxy.initialized()).to.eq(true);
    });

    it("sets the root hash", async () => {
      expect(await proxy.merkleRoot()).to.eq(rootHash);
    });

    it("cannot be called twice", async () => {
      await expect(proxy.initialize(rootHash)).revertedWith(
        "Proxy already initialized"
      );
    });

    it("costs 48492 gas", async () => {
      await expect(receipt.gasUsed.toString()).to.eq("48492");
    });
  });

  describe("when initialized with a root that allocates account1 10%, account2 30%, and account3 60%", () => {
    let allocations,
      tree,
      splitter,
      proxy,
      rootHash,
      tx,
      receipt,
      callableProxy;

    beforeEach(async () => {
      splitter = await deploySplitter();
      proxy = await deployProxy(splitter.address, fakeWETH.address);

      allocations = [
        { account: account1.address, allocation: BigNumber.from(10) },
        { account: account2.address, allocation: BigNumber.from(30) },
        { account: account3.address, allocation: BigNumber.from(60) },
      ];
      tree = new AllocationTree(allocations);

      rootHash = tree.getHexRoot();
      tx = await proxy.connect(funder).initialize(rootHash);
      receipt = await tx.wait();

      callableProxy = await (
        await ethers.getContractAt("SplitterV4", proxy.address)
      ).deployed();
    });

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
          const accountBalanceAfter = await waffle.provider.getBalance(account);
          expect(accountBalanceAfter.sub(accountBalanceBefore)).to.eq(
            ethers.utils.parseEther("10")
          );
        });

        it("costs 60872 gas", async () => {
          expect(gasUsed.toString()).to.eq("60872");
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
            ).to.eq(ethers.utils.parseEther(allocation.toString()));
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
          tx = await callableProxy.claimForAllWindows(account, allocation, proof);
          const accountBalanceAfter = await waffle.provider.getBalance(account);
          expect(
            accountBalanceAfter.sub(accountBalanceBefore).toString()
          ).to.eq(ethers.utils.parseEther("60"));
        });

        it("costs 43674 gas", async () => {
          const receipt = await tx.wait();
          expect(receipt.gasUsed).to.eq("43674");
        })
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
