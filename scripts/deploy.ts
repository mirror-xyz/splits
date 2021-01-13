import { ethers, waffle } from "hardhat";
import fs from "fs";

export const ZERO_BYTES32 = ethers.constants.HashZero;
export const ROOT = "xyz";
export const subnameWallet = "mirror";

// For production
// export const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
// export const ROOT_NAME = 'mirror.xyz';
// export const ROOT_NODE = ethers.utils.namehash(ROOT_NAME);

// For test
export const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
export const ROOT_NAME = 'mirror.test'
export const ROOT_NODE = ethers.utils.namehash(ROOT_NAME)

const NETWORK_MAP = {
  '0': 'mainnet',
  '3': 'ropsten',
  '4': 'rinkeby',
  '1337': 'hardhat',
  '31337': 'hardhat',
}

async function main() {
  const chainId = (await waffle.provider.getNetwork()).chainId;
  const networkName = NETWORK_MAP[chainId];

  console.log(`Deploying to ${networkName}`);

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

  const MirrorPublicationFactoryV1 = await ethers.getContractFactory("MirrorPublicationFactoryV1");
  const mirrorPublicationFactoryV1 = await MirrorPublicationFactoryV1.deploy();
  await mirrorPublicationFactoryV1.deployed();
  await mirrorPublicationFactoryV1.setInviteToken(mirrorInviteToken.address);

  await mirrorInviteToken.setENSRegistrar(mirrorENSRegistrar.address);
  await mirrorInviteToken.setPublicationFactory(mirrorPublicationFactoryV1.address);

  await mirrorENSResolver.transferOwnership(mirrorENSRegistrar.address)

    const info = {
      Contracts: {
        MirrorInviteToken: mirrorInviteToken.address,
        MirrorENSResolver: mirrorENSResolver.address,
        MirrorENSRegistrar: mirrorENSRegistrar.address,
        MirrorPublicationFactoryV1: mirrorPublicationFactoryV1.address,
      }
    };

    console.log(info);

    fs.writeFileSync(`${__dirname}/../networks/${networkName}.json`, JSON.stringify(info, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });