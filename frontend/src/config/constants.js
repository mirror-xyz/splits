import * as ethers from "ethers";

export const NETWORK_MAP = {
    '0': 'mainnet',
    '3': 'ropsten',
    '4': 'rinkeby',
    '1337': 'hardhat',
    '31337': 'hardhat',
}

export const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

export const ROOT_NAME = 'mirror.test'

export const ROOT_NODE = ethers.utils.namehash(ROOT_NAME)

export const CONTRACT_NAMES = {
    ENS_REGISTRY: "ENSRegistry",
    ENS_RESOLVER: "ArgentENSResolver",
    ENS_MANAGER: "MirrorENSManager",
    INVITE_TOKEN: "MirrorInviteToken",
};

export const TOKEN_NAME = "WRITE";