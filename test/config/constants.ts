const { ethers } = require("hardhat");

export const ZERO_BYTES32 = ethers.constants.HashZero;
export const root = "xyz";
export const subnameWallet = "mirror";
export const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
export const ROOT_NAME = 'mirror.test';
export const ROOT_NODE = ethers.utils.namehash(ROOT_NAME);
