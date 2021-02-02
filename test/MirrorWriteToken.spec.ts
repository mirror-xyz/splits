import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import setup from "./setup";

const REGISTRATION_COST = "1000000000000000000";

describe("MirrorWriteToken", () => {
	// Contracts
	let token;
	let mirrorENSRegistrar;
	let ensRegistry;
	let reverseRegistrar;
	let mirrorENSResolver;

	// Accounts
	let owner;
	let account1;
	let account2;
	let account3;

	beforeEach(async () => {
		({
			mirrorWriteToken: token,
			mirrorENSRegistrar,
			ensRegistry,
			reverseRegistrar,
			mirrorENSResolver
		} = await setup());

		[owner, account1, account2, account3] = await ethers.getSigners();
	});

	describe("deployed", () => {
		it("has the correct name", async () => {
			const name = await token.name();
			expect(name).to.eq("Mirror Write Token");
		});

		it("has the correct token symbol", async () => {
			const symbol = await token.symbol();
			expect(symbol).to.eq("WRITE");
		});

		it("has the correct number of decimals", async () => {
			const decimals = await token.decimals();
			expect(decimals.toString()).to.eq("18");
		});

		it("has the correct registration cost", async () => {
			const cost = await token.registrationCost();
			expect(cost.toString()).to.eq(REGISTRATION_COST);
		});

		it("has the correct registrar", async () => {
			const registrar = await token.ensRegistrar();
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

				await token.connect(owner).mint(account1.address, 1);
			});

			it("mints a token for the account", async () => {
				const accountBalance = await token.balanceOf(accountToReceive.address);
				expect(accountBalance.toString()).to.equal("1");
			});

			it("other accounts still have 0 balance", async () => {
				const accountBalance = await token.balanceOf(accountNotToReceive.address);
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
				transaction = token.connect(nonOwner).mint(accountIntendedToReceive.address, 1);
				await expect(transaction).to.be.revertedWith("MirrorWriteToken: caller is not the owner");
			});

			it("the accounts all still have 0 balance", async () => {
				const accountBalance = await token.balanceOf(accountIntendedToReceive.address);
				expect(accountBalance.toString()).to.equal("0");
			});
		});
	});

	describe("#setENSRegistrar", () => {
		describe("when called by the owner", () => {
			it("updates the registrar appropriately", async () => {
				// Set it to a new address, and check that it updated correctly.
				const newAddress = "0xC85Ef1106632B9e7F8DE9cE0c0f1de1F70E67694";
				await token.connect(owner).setENSRegistrar(newAddress);

				expect(
					await token.ensRegistrar()
				).to.eq(newAddress);

				// Set it back to the actual registrar, and check that it updated correctly again.
				await token.connect(owner).setENSRegistrar(mirrorENSRegistrar.address);
				expect(
					await token.ensRegistrar()
				).to.eq(mirrorENSRegistrar.address);
			});
		});

		describe("when called by a non-owner account", () => {
			it("it reverts the transaction", async () => {
				// Set it to a new address, and check that it updated correctly.
				const newAddress = "0xC85Ef1106632B9e7F8DE9cE0c0f1de1F70E67694";
				const transaction = token.connect(account1).setENSRegistrar(newAddress);
				await expect(transaction).to.be.revertedWith("MirrorWriteToken: caller is not the owner");

				// Original registrar still set.
				expect(
					await token.ensRegistrar()
				).to.eq(mirrorENSRegistrar.address);
			})
		})
	});

	describe("#setRegistrable", () => {
		describe("when called by an address that is not the token owner", () => {
			it("reverts the transaction", async () => {
				const transaction = token.connect(account1).setRegistrable(false);
				await expect(transaction).to.be.revertedWith("MirrorWriteToken: caller is not the owner");
			});
		});

		describe("when called by the token owner", () => {
			it("updates the registrable variable appropriately", async () => {
				await token.connect(owner).setRegistrable(false);
				expect(await token.registrable()).to.eq(false);

				await token.connect(owner).setRegistrable(true);
				expect(await token.registrable()).to.eq(true);
			});
		});
	});

	describe("#register", () => {
		describe("when the account does not have an invite token", () => {
			it("reverts the transaction", async () => {
				const transaction = token.connect(account1).register("test", account1.address);
				await expect(transaction).to.be.reverted;
			});
		});

		describe("when the account has an invite token", () => {
			let transaction;
			let receipt;
			const label = "test";
			const initialTokens = 3;

			beforeEach(async () => {
				const numTokens = BigNumber.from(REGISTRATION_COST).mul(initialTokens);
				await token.connect(owner).mint(account1.address, numTokens);
				// Note: Here we actually register a label for a different account,
				// to test that it doesn't have to be the msg.sender's account that's registered.
				transaction = await token.connect(account1).register(
					label,
					account2.address,
				);
				receipt = await transaction.wait();
			});

			describe("when `registrable` is set to false", () => {
				it("reverts the transaction", async () => {
					await token.connect(owner).setRegistrable(false);
					const transaction = token.connect(account1).register(label, account1.address);
					await expect(transaction).to.be.revertedWith("MirrorWriteToken: registration is closed");
					await token.connect(owner).setRegistrable(false);
				});
			});

			describe("when a label has already been taken", () => {
				it("reverts the transaction", async () => {
					const transaction = token.connect(account1).register(
						label,
						account1.address
					);
					await expect(transaction).to.be.revertedWith("MirrorENSManager: label is already owned");
				});
			});

			it("burns the user's token", async () => {
				const accountBalance = await token.balanceOf(account1.address);
				const expectedBalance = BigNumber.from(REGISTRATION_COST).mul(initialTokens - 1);
				expect(accountBalance.toString()).to.equal(expectedBalance.toString());
			});

			it("registers the requested ENS label and assigns ownership to the owner", async () => {
				const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash(`${label}.mirror.xyz`))
				expect(subdomainOwner).to.eq(account2.address);
			});

			it("allows for reverse resolving", async () => {
				const node = await reverseRegistrar.node(account2.address);
				const name = await mirrorENSResolver.name(node);
				expect(name).to.eq(`${label}.mirror.xyz`);
			});

			it("uses 162794 gas", () => {
				const { gasUsed } = receipt;
				expect(gasUsed).to.eq(162794);
			});
		});
	});
});