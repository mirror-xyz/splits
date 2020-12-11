const { ethers } = require('hardhat')
const fs = require('fs')


const NETWORK_MAP = {
  '0': 'mainnet',
  '3': 'ropsten',
  '1337': 'hardhat',
  '31337': 'hardhat',
}
const ZERO_BYTES32 = ethers.constants.HashZero;
const root = 'xyz'
const subnameWallet = 'mirror'

async function main() {
  const [owner, user1, user2] = await ethers.getSigners()

  const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
  const ENSResolver = await ethers.getContractFactory('ArgentENSResolver')
  const MirrorENSRegistrar = await ethers.getContractFactory('MirrorENSRegistrar')
  const MirrorInviteToken = await ethers.getContractFactory('MirrorInviteToken')
  const ReverseRegistrar = await ethers.getContractFactory('MirrorENSReverseRegistrar')

  const ensRegistry = await ENSRegistry.deploy()
  const ensResolver = await ENSResolver.deploy()
  const mirrorInviteToken = await MirrorInviteToken.deploy('MirrorInviteToken', 'WRITE')
  const reverseRegistrar = await ReverseRegistrar.deploy(ensRegistry.address, ensResolver.address)

  await ensRegistry.deployed()
  await ensResolver.deployed()
  await mirrorInviteToken.deployed()

  const rootName = 'mirror.xyz'
  const rootNode = ethers.utils.namehash(rootName)
  const mirrorENSRegistrar = await MirrorENSRegistrar.deploy(rootName, rootNode, ensRegistry.address, ensResolver.address, mirrorInviteToken.address)

  await mirrorENSRegistrar.deployed()

  // Post-deploy setup
  await mirrorInviteToken.setRegistrar(mirrorENSRegistrar.address)

  await ensResolver.addManager(mirrorENSRegistrar.address)

  // Set up ENS infrastructure
  await ensRegistry.setSubnodeOwner(
    ZERO_BYTES32,
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(root)),
    owner.address)
  await ensRegistry.setSubnodeOwner(
    ethers.utils.namehash(root),
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes('mirror')),
    mirrorENSRegistrar.address);
  await ensRegistry.setSubnodeOwner(
    ZERO_BYTES32,
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes('reverse')),
    owner.address)
  await ensRegistry.setSubnodeOwner(
    ethers.utils.namehash('reverse'),
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes('addr')),
    reverseRegistrar.address,
  )

  console.log('ENSRegistry', ensRegistry.address)
  console.log('ENSResolver', ensResolver.address)
  console.log('MirrorInviteToken', mirrorInviteToken.address)
  console.log('MirrorENSRegistrar', mirrorENSRegistrar.address)
  console.log('ReverseRegistrar', reverseRegistrar.address)

  const chainId = (await waffle.provider.getNetwork()).chainId
  const networkName = NETWORK_MAP[chainId]
  let deployedAddresses = {}
  deployedAddresses[networkName] = {
    ENSRegistry: ensRegistry.address,
    ENSResolver: ensResolver.address,
    MirrorInviteToken: mirrorInviteToken.address,
    MirrorENSRegistrar: mirrorENSRegistrar.address,
    ReverseRegistrar: reverseRegistrar.address,
  }

  fs.writeFileSync(
    './frontend/src/config/deployed-addresses.json',
    JSON.stringify(deployedAddresses, null, 2)
  )
  console.log('wrote to deployed-addresses.json')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
