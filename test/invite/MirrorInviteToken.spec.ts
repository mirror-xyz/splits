import { expect } from "chai";
import { ethers } from "hardhat";
import { ZERO_BYTES32 } from "../config/constants";

import setup from "../setup";

describe("MirrorInviteToken", () => {
	let mirrorInviteToken;
	let mirrorENSRegistrar;
	let owner;
	let account1;
	let account2;
	let account3;

	beforeEach(async () => {
		[mirrorInviteToken, mirrorENSRegistrar] = await setup();

		[owner, account1, account2, account3] = await ethers.getSigners();
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

		it("has the correct registrar", async () => {
			const registrar = await mirrorInviteToken.registrar();
			expect(registrar).to.eq(mirrorENSRegistrar.address);
		});
	});

	describe("#mint", () => {
		describe("when called by the owner to be given to another account", () => {
			let accountToReceive;
			let accountNotToReceive;

			beforeEach(async () => {
				accountToReceive = account1;
				accountNotToReceive = account2;

				await mirrorInviteToken.connect(owner).mint(account1.address, 1);
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

		describe("when called by a non-owner to be given to another account", () => {
			let nonOwner;
			let accountIntendedToReceive;
			let transaction;

			beforeEach(async () => {
				nonOwner = account1;
				accountIntendedToReceive = account2;
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

	describe("#setRegistrar", () => {
		describe("when called by the owner", () => {
			it("updates the registrar appropriately", async () => {
				// Set it to a new address, and check that it updated correctly.
				const newAddress = "0xC85Ef1106632B9e7F8DE9cE0c0f1de1F70E67694";
				await mirrorInviteToken.connect(owner).setRegistrar(newAddress);

				expect(
					await mirrorInviteToken.registrar()
				).to.eq(newAddress);

				// Set it back to the actual registrar, and check that it updated correctly again.
				await mirrorInviteToken.connect(owner).setRegistrar(mirrorENSRegistrar.address);
				expect(
					await mirrorInviteToken.registrar()
				).to.eq(mirrorENSRegistrar.address);
			})
		});

		describe("when called by a non-owner account", () => {
			it("it reverts the transaction", async () => {
				// Set it to a new address, and check that it updated correctly.
				const newAddress = "0xC85Ef1106632B9e7F8DE9cE0c0f1de1F70E67694";
				const transaction = mirrorInviteToken.connect(account1).setRegistrar(newAddress);
				await expect(transaction).to.be.revertedWith('Ownable: caller is not the owner');

				// Original registrar still set.
				expect(
					await mirrorInviteToken.registrar()
				).to.eq(mirrorENSRegistrar.address);
			})
		})
	});

	describe("#register", () => {
		describe("when the account does not have an invite token", () => {
			it("reverts the transaction", async () => {
				const transaction = mirrorInviteToken.connect(account1).register("test", "TestToken", "TEST", 0);
				await expect(transaction).to.be.revertedWith('ERC20: burn amount exceeds balance');
			});
		});

		describe("when the account has an invite token", () => {
			it("reverts the transaction", async () => {
				await mirrorInviteToken.connect(owner).mint(account1.address, 1);

				const transaction = mirrorInviteToken.connect(account1).register("test", "TestToken", "TEST", 0);
				await expect(transaction).to.be.revertedWith('lala: burn amount exceeds allowance');
			});
		});
	});
});