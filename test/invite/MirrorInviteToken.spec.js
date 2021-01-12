const { assert, expect } = require("chai")
const { ethers } = require("hardhat")

const BigNumber = ethers.BigNumber

const ZERO_BYTES32 = ethers.constants.HashZero
const root = "xyz"
const subnameWallet = "mirror"

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ROOT_NAME = 'mirror.test'
const ROOT_NODE = ethers.utils.namehash(ROOT_NAME)

async function setup() {
  const [owner, user1, user2] = await ethers.getSigners();

  const MirrorInviteToken = await ethers.getContractFactory("MirrorInviteToken");
  const mirrorInviteToken = await MirrorInviteToken.deploy("MirrorInviteToken", "WRITE");
  await mirrorInviteToken.deployed();

  const MirrorENSResolver = await ethers.getContractFactory("MirrorENSResolver");
  const mirrorENSResolver = await MirrorENSResolver.deploy();
  await mirrorENSResolver.deployed();

  const MirrorENSRegistrar = await ethers.getContractFactory("MirrorENSRegistrar");
  const mirrorENSRegistrar = await MirrorENSRegistrar.deploy(
	ROOT_NAME,
	ROOT_NODE,
	ENS_REGISTRY_ADDRESS,
	mirrorENSResolver.address,
	mirrorInviteToken.address
  );
  await mirrorENSRegistrar.deployed();

  await mirrorInviteToken.setRegistrar(mirrorENSRegistrar.address);

  return [
  	mirrorInviteToken
  ];
}

describe("MirrorInviteToken", () => {
	let mirrorInviteToken;

	beforeEach(async () => {
		[mirrorInviteToken] = await setup();
	});

	describe("#mint", () => {
		describe("when called by the owner for some account",  () => {
			let accountToReceive;
			let accountNotToReceive;

			beforeEach(async () => {
				const [owner, user1, user2] = await ethers.getSigners();

				accountToReceive = user1;
				accountNotToReceive = user2;

	    		await mirrorInviteToken.mint(user1.address, 1);
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
	});
});