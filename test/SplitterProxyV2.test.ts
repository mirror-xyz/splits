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
  let account5;
  let account6;
  let account7;
  let account8;
  let account9;
  let account10;
  let account11;
  let account12;
  let account13;
  let account14;
  let account15;

  beforeEach(async () => {
    [
      funder,
      fakeWETH,
      account1,
      account2,
      account3,
      account4,
      account5,
      account6,
      account7,
      account8,
      account9,
      account10,
      account11,
      account12,
      account13,
      account14,
      account15,
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

    it("costs 265214 gas", async () => {
      const gasUsed = (await proxy.deployTransaction.wait()).gasUsed;
      expect(gasUsed.toString()).to.eq("265214");
    });
  });

  // describe("encodeAllocation", () => {
  //   it("returns a hash", async () => {
  //     const splitter = await deploySplitter();
  //     const percentages = [10, 30, 60];
  //     const accounts = [account1.address, account2.address, account3.address];
  //     const encoded = await splitter
  //       .connect(funder)
  //       .encodeAllocation(accounts, percentages);
  //     expect(encoded).to.eq(
  //       "0x3656b3608b731bc20efc848510b21bd59dc5735970965544dda9d21d5a78811b"
  //     );
  //   });
  // });

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

    it("costs 48514 gas", async () => {
      await expect(receipt.gasUsed.toString()).to.eq("48514");
    });
  });

  // const callableProxy = ethers.getContractAt("SplitterV3", proxy.address);

  describe("when initialized with a root", () => {
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

    describe("getClaimHash", () => {
      it("returns a hash for a given index and window", async () => {
        const window = 0;
        const index = 1;
        const result = await callableProxy.getClaimHash(window, index);
        expect(result).to.eq(
          "0xa6eef7e35abe7026729641147f7915573c7e97b47efa546f5f6e3230263bcb49"
        );
      });
    });

    describe("when there is 100 ETH in the account", () => {
      beforeEach(async () => {
        await funder.sendTransaction({
          to: proxy.address,
          value: ethers.utils.parseEther("100"),
        });
      });

      describe("and account 1 tries to claim 10 ETH", () => {
        it("successfully claims 10 ETH", async () => {
          const index = 0;
          const window = 0;
          const ref = allocations[index];
          const { account, allocation } = ref;
          const proof = tree.getProof(index, account, allocation);
          const accountBalanceBefore = await waffle.provider.getBalance(
            account
          );
          const tx = await callableProxy.claim(
            window,
            index,
            account,
            allocation,
            proof
          );
          const accountBalanceAfter = await waffle.provider.getBalance(account);
          expect(accountBalanceAfter.sub(accountBalanceBefore)).to.eq(
            ethers.utils.parseEther("10")
          );
        });

        describe("and account 1 tries to claim 10 ETH twice in one window", () => {
          it("reverts on the second attempt", async () => {
            const index = 0;
            const window = 0;
            const ref = allocations[index];
            const { account, allocation } = ref;
            const proof = tree.getProof(index, account, allocation);
            await callableProxy.claim(
              window,
              index,
              account,
              allocation,
              proof
            );
            await expect(callableProxy.claim(
              window,
              index,
              account,
              allocation,
              proof
            )).revertedWith("Account already claimed the given window");
          });
        })

        describe("and a new window is incremented", () => {

        });
      });
    });
  });
  //   it("returns true when given the correct validation", async () => {
  //     const splitter = await deploySplitter(fakeWETH.address);

  //     const percentages = [10, 30, 60];
  //     const accounts = [account1.address, account2.address, account3.address];

  //     const encoded = await splitter
  //       .connect(funder)
  //       .encodeAllocation(accounts, percentages);

  //     await splitter.connect(funder).initialize(encoded);

  //     expect(
  //       await splitter.connect(funder).validateAllocation(accounts, percentages)
  //     ).to.eq(true);
  //   });

  //   it("returns false when given an incorrect validation", async () => {
  //     const splitter = await deploySplitter(fakeWETH.address);

  //     const percentages = [10, 30, 60];
  //     const accounts = [account1.address, account2.address, account3.address];

  //     const encoded = await splitter
  //       .connect(funder)
  //       .encodeAllocation(accounts, percentages);

  //     await splitter.connect(funder).initialize(encoded);

  //     expect(
  //       await splitter.connect(funder).validateAllocation([funder.address], [5])
  //     ).to.eq(false);
  //   });
  // });

  // describe("executeETHSplit", () => {
  //   let proxy, splitter;

  //   beforeEach(async () => {
  //     splitter = await deploySplitter();
  //     proxy = await deployProxy(splitter.address, fakeWETH.address);
  //   });

  //   describe("when the proxy has 100 ETH and is split 16 ways with a valid allocation", () => {
  //     let tx, receipt, balance1;

  //     beforeEach(async () => {
  //       const percentages = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 86];
  //       const accounts = [
  //         account1.address,
  //         account2.address,
  //         account3.address,
  //         account4.address,
  //         account5.address,
  //         account6.address,
  //         account7.address,
  //         account8.address,
  //         account9.address,
  //         account10.address,
  //         account11.address,
  //         account12.address,
  //         account13.address,
  //         account14.address,
  //         account15.address,
  //       ];

  //       const encoded = await splitter
  //         .connect(funder)
  //         .encodeAllocation(accounts, percentages);

  //       await proxy.connect(funder).initialize(encoded);

  //       await funder.sendTransaction({
  //         to: proxy.address,
  //         value: ethers.utils.parseEther("100"),
  //       });

  //       const proxyBalance = await waffle.provider.getBalance(proxy.address);
  //       balance1 = await waffle.provider.getBalance(account1.address);

  //       // Sanity check.
  //       assert(
  //         proxyBalance.toString() === ethers.utils.parseEther("100").toString(),
  //         `Proxy balance is ${proxyBalance.toString()}`
  //       );

  //       const callableProxy = await (
  //         await ethers.getContractAt("SplitterV3", proxy.address)
  //       ).deployed();

  //       tx = await callableProxy
  //         .connect(funder)
  //         .executeETHSplit(accounts, percentages);
  //       receipt = await tx.wait();
  //     });

  //     it("it decreases ETH in the splitter", async () => {
  //       const updatedProxyBalance = await waffle.provider.getBalance(
  //         proxy.address
  //       );
  //       expect(updatedProxyBalance.toString()).to.eq("0");
  //     });

  //     it("it increases ETH in the recipients according to the allocation percentages", async () => {
  //       // Account 1
  //       const updatedBalance1 = await waffle.provider.getBalance(
  //         account1.address
  //       );
  //       expect(updatedBalance1.sub(balance1).toString()).to.eq(
  //         ethers.utils.parseEther("1").toString()
  //       );
  //     });

  //     it("uses 206792 gas", async () => {
  //       const { gasUsed } = receipt;
  //       expect(gasUsed.toString()).to.eq("206792");
  //     });
  //   });
  // });
});
