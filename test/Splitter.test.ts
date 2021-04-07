import { assert, expect } from "chai";
import { ethers, waffle } from "hardhat";

const deploySplitter = async (fakeWETHAddress: string) => {
  const Splitter = await ethers.getContractFactory("Splitter");
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

  describe("initialize", () => {
    it("deploys successfully with the correct allocations", async () => {
      const splitter = await deploySplitter(fakeWETH.address);

      const percentages = [10, 30, 60];
      const accounts = [account1.address, account2.address, account3.address];

      await splitter.connect(funder).initialize(accounts, percentages);

      expect(await splitter.accounts(0)).to.eq(accounts[0]);
      expect(await splitter.accounts(1)).to.eq(accounts[1]);
      expect(await splitter.accounts(2)).to.eq(accounts[2]);

      expect(await splitter.percentages(0)).to.eq(percentages[0]);
      expect(await splitter.percentages(1)).to.eq(percentages[1]);
      expect(await splitter.percentages(2)).to.eq(percentages[2]);
    });
  });

  describe("validate", () => {
    it("returns true when the allocations sum to 100", async () => {
      const splitter = await deploySplitter(fakeWETH.address);

      const percentages = [10, 30, 60];
      const accounts = [account1.address, account2.address, account3.address];

      await splitter.connect(funder).initialize(accounts, percentages);
      expect(await splitter.connect(funder).validate()).to.eq(true);
    });

    it("returns false when the allocations sum to 99", async () => {
      const splitter = await deploySplitter(fakeWETH.address);

      const percentages = [10, 30, 59];
      const accounts = [account1.address, account2.address, account3.address];

      await splitter.connect(funder).initialize(accounts, percentages);
      expect(await splitter.connect(funder).validate()).to.eq(false);
    });

    it("returns false when the allocations sum to 101", async () => {
      const splitter = await deploySplitter(fakeWETH.address);

      const percentages = [10, 30, 61];
      const accounts = [account1.address, account2.address, account3.address];

      await splitter.connect(funder).initialize(accounts, percentages);
      expect(await splitter.connect(funder).validate()).to.eq(false);
    });
  });

  // Basic Example.
  describe("splitETH", () => {
    describe("when the contract has 100 ETH and is split 3 ways", () => {
      let splitter;
      let tx;
      let receipt;
      // Original balances.
      let balance1;
      let balance2;
      let balance3;

      beforeEach(async () => {
        splitter = await deploySplitter(fakeWETH.address);

        const percentages = [10, 30, 60];
        const accounts = [account1.address, account2.address, account3.address];

        await splitter.connect(funder).initialize(accounts, percentages);

        await funder.sendTransaction({
          to: splitter.address,
          value: ethers.utils.parseEther("100"),
        });

        const splitterBalance = await waffle.provider.getBalance(
          splitter.address
        );
        balance1 = await waffle.provider.getBalance(account1.address);
        balance2 = await waffle.provider.getBalance(account2.address);
        balance3 = await waffle.provider.getBalance(account3.address);

        // Sanity check.
        assert(
          splitterBalance.toString() ===
            ethers.utils.parseEther("100").toString(),
          `Splitter balance ${splitterBalance.toString()}`
        );

        tx = await splitter.connect(funder).splitETH();
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
          ethers.utils.parseEther("10").toString()
        );
        // Account 2
        const updatedBalance2 = await waffle.provider.getBalance(
          account2.address
        );
        expect(updatedBalance2.sub(balance2).toString()).to.eq(
          ethers.utils.parseEther("30").toString()
        );
        // Account 3
        const updatedBalance3 = await waffle.provider.getBalance(
          account3.address
        );
        expect(updatedBalance3.sub(balance3).toString()).to.eq(
          ethers.utils.parseEther("60").toString()
        );
      });

      it("uses 81248 gas", async () => {
        const { gasUsed } = receipt;
        expect(gasUsed.toString()).to.eq("81248");
      });
    });

    describe("when the contract has 100 ETH and is split 16 ways", () => {
      let splitter;
      let tx;
      let receipt;
      // Original balances.
      let balance1;

      beforeEach(async () => {
        splitter = await deploySplitter(fakeWETH.address);

        console.log({
            tx: (await splitter.deployTransaction.wait()).gasUsed.toString()
        })

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

        await splitter.connect(funder).initialize(accounts, percentages);

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
        // Sanity check accounts.
        expect(await splitter.accounts(0)).to.eq(accounts[0]);
        expect(await splitter.accounts(1)).to.eq(accounts[1]);
        expect(await splitter.accounts(2)).to.eq(accounts[2]);
        expect(await splitter.accounts(3)).to.eq(accounts[3]);
        expect(await splitter.accounts(4)).to.eq(accounts[4]);
        expect(await splitter.accounts(5)).to.eq(accounts[5]);
        expect(await splitter.accounts(6)).to.eq(accounts[6]);
        expect(await splitter.accounts(7)).to.eq(accounts[7]);
        expect(await splitter.accounts(8)).to.eq(accounts[8]);
        expect(await splitter.accounts(9)).to.eq(accounts[9]);
        expect(await splitter.accounts(10)).to.eq(accounts[10]);
        expect(await splitter.accounts(11)).to.eq(accounts[11]);
        expect(await splitter.accounts(12)).to.eq(accounts[12]);
        expect(await splitter.accounts(13)).to.eq(accounts[13]);
        expect(await splitter.accounts(14)).to.eq(accounts[14]);
        // Sanity check percentages.
        expect(await splitter.percentages(0)).to.eq(percentages[0]);
        expect(await splitter.percentages(1)).to.eq(percentages[1]);
        expect(await splitter.percentages(2)).to.eq(percentages[2]);
        expect(await splitter.percentages(3)).to.eq(percentages[3]);
        expect(await splitter.percentages(4)).to.eq(percentages[4]);
        expect(await splitter.percentages(5)).to.eq(percentages[5]);
        expect(await splitter.percentages(6)).to.eq(percentages[6]);
        expect(await splitter.percentages(7)).to.eq(percentages[7]);
        expect(await splitter.percentages(8)).to.eq(percentages[8]);
        expect(await splitter.percentages(9)).to.eq(percentages[9]);
        expect(await splitter.percentages(10)).to.eq(percentages[10]);
        expect(await splitter.percentages(11)).to.eq(percentages[11]);
        expect(await splitter.percentages(12)).to.eq(percentages[12]);
        expect(await splitter.percentages(13)).to.eq(percentages[13]);
        expect(await splitter.percentages(14)).to.eq(percentages[14]);


        tx = await splitter.connect(funder).splitETH();
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

      it("uses 318146 gas", async () => {
        const { gasUsed } = receipt;
        expect(gasUsed.toString()).to.eq("318146");
      });
    });
  });
});
