import { expect } from "chai";
import { ethers } from "hardhat";

import setup from "../setup";

describe("MirrorInviteToken", () => {
	let mirrorInviteToken;

	beforeEach(async () => {
		[mirrorInviteToken] = await setup();
	});

	describe("deployed", () => {
		it("has the correct name", async () => {
			const name = await mirrorInviteToken.name();
			expect(name).to.eq("MirrorInviteToken");
		});
	
		it("has the correct token symbol", async () => {
			const symbol = await mirrorInviteToken.symbol();
			expect(symbol).to.eq("WRITE");
		});
	
		it("has the correct number of decimals", async () => {
			const decimals = await mirrorInviteToken.decimals();
			expect(decimals.toString()).to.eq("0");
		});
	});

	describe("#mint", () => {
		describe("when called by the owner to be given to another account",  () => {
			let accountToReceive;
			let accountNotToReceive;

			beforeEach(async () => {
				const [owner, user1, user2] = await ethers.getSigners();

				accountToReceive = user1;
				accountNotToReceive = user2;

	    		await mirrorInviteToken.connect(owner).mint(user1.address, 1);
			});

			it("mints a token for the account", async () => {
				const accountBalance = await mirrorInviteToken.balanceOf(accountToReceive.address);
				expect(accountBalance.toString()).to.equal("1");
			});

			it("other accounts still have 0 balance", async () => {
				const accountBalance = await mirrorInviteToken.balanceOf(accountNotToReceive.address);
				expect(accountBalance.toString()).to.equal("0");
			});
		});

		describe("when called by a non-owner to be given to another account",  () => {
			let nonOwner;
			let accountIntendedToReceive;
			let transaction;

			beforeEach(async () => {
				const [owner, user1, user2] = await ethers.getSigners();

				nonOwner = user1;
				accountIntendedToReceive = user2;    		
			});

			it("reverts the transaction", async () => {
				transaction = mirrorInviteToken.connect(nonOwner).mint(accountIntendedToReceive.address, 1);
				await expect(transaction).to.be.revertedWith('Ownable: caller is not the owner');
			});

			it("the accounts all still have 0 balance", async () => {
				const accountBalance = await mirrorInviteToken.balanceOf(accountIntendedToReceive.address);
				expect(accountBalance.toString()).to.equal("0");
			});
		});
	});
});