import { expect } from "chai";
import { ethers, waffle } from "hardhat";


const deploySplitter = async() => {
    const Splitter = await ethers.getContractFactory('Splitter')
    const splitter = await Splitter.deploy()
    await splitter.deployed();
    return splitter;
}

describe("Splitter", () => {
    let funder;
	let account1;
	let account2;
	let account3;

	beforeEach(async () => {
		[funder, account1, account2, account3] = await ethers.getSigners();
	});

    describe("initialize", () => {
        it("deploys successfully with the correct allocations", async() => {
            const splitter = await deploySplitter();

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
            const splitter = await deploySplitter();

            const percentages = [10, 30, 60];
            const accounts = [account1.address, account2.address, account3.address];

            await splitter.connect(funder).initialize(accounts, percentages);
            expect(await splitter.connect(funder).validate()).to.eq(true);
        });

        it("returns false when the allocations sum to 99", async () => {
            const splitter = await deploySplitter();

            const percentages = [10, 30, 59];
            const accounts = [account1.address, account2.address, account3.address];

            await splitter.connect(funder).initialize(accounts, percentages);
            expect(await splitter.connect(funder).validate()).to.eq(false);
        });

        it("returns false when the allocations sum to 101", async () => {
            const splitter = await deploySplitter();

            const percentages = [10, 30, 61];
            const accounts = [account1.address, account2.address, account3.address];

            await splitter.connect(funder).initialize(accounts, percentages);
            expect(await splitter.connect(funder).validate()).to.eq(false);
        });
    });

    describe("splitETH", () => {
        describe("when the contract has 100 ETH", () => {
            let splitter;

            beforeEach(async() => {
                splitter = await deploySplitter();
    
                const percentages = [10, 30, 60];
                const accounts = [account1.address, account2.address, account3.address];
    
                await splitter.connect(funder).initialize(accounts, percentages);
                
                const tx = await funder.sendTransaction({
                    to: splitter.address,
                    value: ethers.utils.parseEther("100")
                });
            });

            it("sends ETH according to the allocation", async () => {    
                await splitter.connect(funder).splitETH();

                const updatedSplitterBalance = await waffle.provider.getBalance(splitter.address);
                expect(updatedSplitterBalance.toString()).to.eq("0");
            });
        });
    });
});