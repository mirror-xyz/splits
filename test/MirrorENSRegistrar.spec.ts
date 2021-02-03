import { expect } from "chai";
import { ethers } from "hardhat";

import setup from "./setup";

describe("MirrorENSRegistrar", () => {
    // Contracts
    let mirrorENSRegistrar;

    // Accounts
    let owner;
    let account1;

    beforeEach(async () => {
        ({
            mirrorENSRegistrar
        } = await setup());

        [owner, account1] = await ethers.getSigners();
    });

    describe("#register", () => {
        describe("when called by an address that is not the Write token", () => {
            it("reverts the transaction", async () => {
                const transaction = mirrorENSRegistrar.connect(owner).register(
                    "test",
                    account1.address
                );
                await expect(transaction).to.be.revertedWith("MirrorENSRegistrar: caller is not the Mirror Write Token");
            });
        });

        // The rest of register is captured by the MirrorWriteToken spec.
    });

    describe("#changeRootNodeOwner", () => {
        describe("when called by an address that is not the owner token", () => {
            it("reverts the transaction", async () => {
                const transaction = mirrorENSRegistrar.connect(account1).changeRootNodeOwner(
                    account1.address
                );
                await expect(transaction).to.be.revertedWith("Ownable: caller is not the owner");
            });
        });
    });
});