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

let isLocal = false;

async function main() {
  const chainId = (await waffle.provider.getNetwork()).chainId;
  const networkName = NETWORK_MAP[chainId];

  console.log(`Deploying to ${networkName}`);

  isLocal = (networkName === "hardhat");

  let owner;
  let ensAddress;
  let ensRegistry;

  if (isLocal) {
    console.log("deploying ENS registry");
    const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
    ensRegistry = await ENSRegistry.deploy()
    await ensRegistry.deployed()

    ensAddress = ensRegistry.address;
  } else {
    ensAddress = ENS_REGISTRY_ADDRESS;
  }

  console.log("Deploying $WRITE");
  const MirrorWriteToken = await ethers.getContractFactory("MirrorWriteToken");
  const mirrorWriteToken = await MirrorWriteToken.deploy();
  await mirrorWriteToken.deployed();

  console.log("Deploying Batch Registration");
  const MirrorBatchRegistration = await ethers.getContractFactory("MirrorBatchRegistration");
  const mirrorBatchRegistration = await MirrorBatchRegistration.deploy(mirrorWriteToken.address);
  await mirrorBatchRegistration.deployed();

  console.log("Deploying ENS Resolver");
  const MirrorENSResolver = await ethers.getContractFactory("MirrorENSResolver");
  const mirrorENSResolver = await MirrorENSResolver.deploy();
  await mirrorENSResolver.deployed();

  console.log("Deploying ENS Registrar");
  const MirrorENSRegistrar = await ethers.getContractFactory("MirrorENSRegistrar");
  const mirrorENSRegistrar = await MirrorENSRegistrar.deploy(
    ROOT_NAME,
    ROOT_NODE,
    ensAddress,
    mirrorENSResolver.address,
    mirrorWriteToken.address
  );
  await mirrorENSRegistrar.deployed();

  console.log("is local", isLocal);
  if (isLocal) {
    const accounts = await ethers.getSigners();
    owner = accounts[0].address;
    owner = accounts[0];

    const ReverseRegistrar = await ethers.getContractFactory('MirrorENSReverseRegistrar')
    const reverseRegistrar = await ReverseRegistrar.deploy(ensRegistry.address, mirrorENSRegistrar.address)
    await reverseRegistrar.deployed()

    // Setup root.
    await ensRegistry.setSubnodeOwner(
      ZERO_BYTES32,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("xyz")),
      owner.address
    );
    await ensRegistry.setSubnodeOwner(
      ethers.utils.namehash("xyz"),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("mirror")),
      mirrorENSRegistrar.address
    );
    await ensRegistry.setSubnodeOwner(
      ZERO_BYTES32,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('reverse')),
      owner.address
    )
    await ensRegistry.setSubnodeOwner(
      ethers.utils.namehash('reverse'),
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes('addr')),
      reverseRegistrar.address,
    )
  }

  console.log("Setting registrar on $WRITE");
  await mirrorWriteToken.setENSRegistrar(mirrorENSRegistrar.address);
  console.log("Transferring ownership of Resolver to Registrar");
  await mirrorENSResolver.transferOwnership(mirrorENSRegistrar.address);
  console.log("Updating ENS Reverse Registrar");
  await mirrorENSRegistrar.updateENSReverseRegistrar();

  const info = {
    Contracts: {
      MirrorWriteToken: mirrorWriteToken.address,
      MirrorENSResolver: mirrorENSResolver.address,
      MirrorENSRegistrar: mirrorENSRegistrar.address,
      MirrorBatchRegistration: mirrorBatchRegistration.address,
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