import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { ZERO_BYTES32 } from "../config/constants";

import setup from "../setup";
import { getCreate2Address } from "../utils";

import MirrorPublicationV1 from '../../artifacts/contracts/publish/MirrorPublicationV1.sol/MirrorPublicationV1.json';


describe("MirrorPublicationV1", async () => {
	let mirrorInviteToken;
	let mirrorENSRegistrar;
	let mirrorPublicationFactoryV1;
	let ensRegistry;
	let reverseRegistrar;
	let mirrorENSResolver;

	const [owner, account1, account2, account3] = await ethers.getSigners();

    let create2Address;

    let publication;

    const name = "Test Token";
    const symbol = "TESTEST";
    const numDecimals = 3;
    const label = "test-label"

    describe(`when deployed during registration by ${account1.address}`, () => {
        beforeEach(async () => {
            [
                mirrorInviteToken, mirrorENSRegistrar, mirrorPublicationFactoryV1, ensRegistry, reverseRegistrar, mirrorENSResolver
            ] = await setup();
            
            await mirrorInviteToken.connect(owner).mint(account1.address, 1);
    
            let label = "test";
    
            create2Address = getCreate2Address(mirrorPublicationFactoryV1.address, label, MirrorPublicationV1.bytecode);
            publication = new ethers.Contract(create2Address, JSON.stringify(MirrorPublicationV1.abi), waffle.provider);

            await mirrorInviteToken.connect(account1).register(label, name, symbol, numDecimals);
        });
    
    
        it(`has the given properties name: ${name}, symbol: ${symbol}, decimals: ${numDecimals}, owner: ${account1.address}`, async () => {
            expect(await publication.name()).to.eq(name)
            expect(await publication.symbol()).to.eq(symbol)
            expect(await publication.decimals()).to.eq(numDecimals)
            expect(await publication.owner()).to.eq(account1.address)
            
        });

        it(`has an allowance for ${account1.address} of 0 and a total supply of 0`, async () => {
            expect(await publication.totalSupply()).to.eq(0)
            expect(await publication.balanceOf(account1.address)).to.eq(0)
        })

        describe("#mint()", () => {
            describe("when called by a non-owner", () => {
                it("reverts", async () => {
                    const tx = publication.connect(account1).mint();
                    await expect(tx).to.be.reverted
                });
            })

            describe("when called by the non-owner", () => {
                it("mints a token, increasing balance and total supply", async () => {
                    await publication.connect(account1).mint(account2.address, 2);
                    expect(await publication.totalSupply()).to.eq(2)
                    expect(await publication.balanceOf(account2.address)).to.eq(2)
                    expect(await publication.balanceOf(account1.address)).to.eq(0)
                });
            })
        });

        describe("#transfer()", () => {
            describe("when by an account without a balance", () => {
                it("reverts", async () => {
                    const tx = publication.connect(account1).transfer(account2.address, 1);
                    await expect(tx).to.be.reverted
                });
            })

            describe("when called by an account with a balance", () => {
                it("transfers the token", async () => {
                    await publication.connect(account1).mint(account2.address, 2);
                    await publication.connect(account2).transfer(account1.address, 1)
                    expect(await publication.totalSupply()).to.eq(2)
                    expect(await publication.balanceOf(account2.address)).to.eq(1)
                    expect(await publication.balanceOf(account1.address)).to.eq(1)
                });
            })
        });
    });
});
