import { assert, expect } from "chai";
import { ethers, waffle } from "hardhat";

const deploySplitter = async (fakeWETHAddress: string) => {
  const Splitter = await ethers.getContractFactory("SplitterV2");
  const splitter = await Splitter.deploy(fakeWETHAddress);

  await splitter.deployed();
  return splitter;
};

describe("Splitter", () => {
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

  describe("encodeAllocation", () => {
    it("returns a hash", async () => {
      const splitter = await deploySplitter(fakeWETH.address);

      const percentages = [10, 30, 60];
      const accounts = [account1.address, account2.address, account3.address];

      const encoded = await splitter
        .connect(funder)
        .encodeAllocation(accounts, percentages);
    });
  });

  describe("validateAllocation", () => {
    it("returns true when given the correct validation", async () => {
      const splitter = await deploySplitter(fakeWETH.address);

      const percentages = [10, 30, 60];
      const accounts = [account1.address, account2.address, account3.address];

      const encoded = await splitter
        .connect(funder)
        .encodeAllocation(accounts, percentages);

      await splitter.connect(funder).initialize(encoded);

      expect(
        await splitter.connect(funder).validateAllocation(accounts, percentages)
      ).to.eq(true);
    });

    it("returns false when given an incorrect validation", async () => {
      const splitter = await deploySplitter(fakeWETH.address);

      const percentages = [10, 30, 60];
      const accounts = [account1.address, account2.address, account3.address];

      const encoded = await splitter
        .connect(funder)
        .encodeAllocation(accounts, percentages);

      await splitter.connect(funder).initialize(encoded);

      expect(
        await splitter.connect(funder).validateAllocation([funder.address], [5])
      ).to.eq(false);
    });
  });

  describe("executeETHSplit", () => {
    describe("when the contract has 100 ETH and is split 16 ways with a valid allocation", () => {
      let splitter;
      let tx;
      let receipt;
      // Original balances.
      let balance1;

      beforeEach(async () => {
        splitter = await deploySplitter(fakeWETH.address);

        const percentages = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 86];
        const accounts = [
          account1.address,
          account2.address,
          account3.address,
          account4.address,
          account5.address,
          account6.address,
          account7.address,
          account8.address,
          account9.address,
          account10.address,
          account11.address,
          account12.address,
          account13.address,
          account14.address,
          account15.address,
        ];

        const encoded = await splitter
          .connect(funder)
          .encodeAllocation(accounts, percentages);

        await splitter.connect(funder).initialize(encoded);

        await funder.sendTransaction({
          to: splitter.address,
          value: ethers.utils.parseEther("100"),
        });

        const splitterBalance = await waffle.provider.getBalance(
          splitter.address
        );
        balance1 = await waffle.provider.getBalance(account1.address);

        // Sanity check.
        assert(
          splitterBalance.toString() ===
            ethers.utils.parseEther("100").toString(),
          `Splitter balance ${splitterBalance.toString()}`
        );

        tx = await splitter.connect(funder).executeETHSplit(
          accounts, percentages
        );
        receipt = await tx.wait();
      });

      it("it decreases ETH in the splitter", async () => {
        const updatedSplitterBalance = await waffle.provider.getBalance(
          splitter.address
        );
        expect(updatedSplitterBalance.toString()).to.eq("0");
      });

      it("it increases ETH in the recipients according to the allocation percentages", async () => {
        // Account 1
        const updatedBalance1 = await waffle.provider.getBalance(
          account1.address
        );
        expect(updatedBalance1.sub(balance1).toString()).to.eq(
          ethers.utils.parseEther("1").toString()
        );
      });

      it("uses 202910 gas", async () => {
        const { gasUsed } = receipt;
        expect(gasUsed.toString()).to.eq("202910");
      });
    });
  });
});
