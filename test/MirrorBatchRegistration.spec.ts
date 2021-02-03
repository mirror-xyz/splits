import { expect } from "chai";
import { ethers } from "hardhat";

import setup from "./setup";

describe("MirrorBatchRegistration", () => {
    // Contracts
    let token;
    let mirrorBatchRegistration;
    let ensRegistry;
    let reverseRegistrar;
    let mirrorENSResolver;

    // Accounts
    let owner;
    let account1;
    let account2;
    let account3;

    let registrationCost;

    beforeEach(async () => {
        ({
            mirrorWriteToken: token,
            mirrorBatchRegistration,
            mirrorENSResolver,
            ensRegistry,
            reverseRegistrar
        } = await setup());

        [owner, account1, account2, account3] = await ethers.getSigners();

        registrationCost = await token.registrationCost();
    });

    describe("#registerBatch", () => {
        describe("when the contract does not have an invite token", () => {
            it("reverts the transaction", async () => {
                const transaction = mirrorBatchRegistration.connect(account1).registerBatch(
                    ["test"],
                    [account1.address]
                );
                await expect(transaction).to.be.revertedWith("MirrorBatchRegistration: need to grant token allowance");
            });
        });

        describe("when the account has an invite token", () => {
            let transaction;
            let receipt;
            const initialTokens = 3;

            let labels;
            let owners;

            beforeEach(async () => {
                const numTokens = registrationCost.mul(initialTokens);
                await token.connect(owner).mint(account1.address, numTokens);
                // Set allowance
                await token.connect(account1).approve(mirrorBatchRegistration.address, numTokens);

                labels = ["label1", "label2", "label3"];
                owners = [account1.address, account2.address, account3.address];
                transaction = await mirrorBatchRegistration.connect(account1).registerBatch(
                    labels,
                    owners
                );
                receipt = await transaction.wait();
            });

            it("burns the user's token", async () => {
                const accountBalance = await token.balanceOf(account1.address);
                expect(accountBalance.toString()).to.equal((initialTokens - 3).toString());
            });

            it("registers the requested ENS label and assigns ownership to the owner", async () => {
                for (let i = 0; i < labels.length; i++) {
                    const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash(`${labels[i]}.mirror.xyz`))
                    expect(subdomainOwner).to.eq(owners[i]);

                    const node = await reverseRegistrar.node(owners[i]);
                    const name = await mirrorENSResolver.name(node);
                    expect(name).to.eq(`${labels[i]}.mirror.xyz`);
                }
            });

            it("uses 410559 gas", () => {
                const { gasUsed } = receipt;
                expect(gasUsed).to.eq(410559);
            });
        });
    });
});