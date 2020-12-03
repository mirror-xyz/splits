const { assert } = require('chai')
const namehash = require('eth-ens-namehash')

const BigNumber = ethers.BigNumber

const ZERO_BYTES32 = ethers.constants.HashZero;

const root = 'xyz'
const subnameWallet = 'mirror'

async function setup() {
  const [owner, user1, user2] = await ethers.getSigners()
  console.log('account', owner.address)

  const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
  const ENSResolver = await ethers.getContractFactory('ArgentENSResolver')
  const MirrorENSRegistrar = await ethers.getContractFactory('MirrorENSRegistrar')
  const MirrorInviteToken = await ethers.getContractFactory('MirrorInviteToken')
  const ReverseRegistrar = await ethers.getContractFactory('MirrorENSReverseRegistrar')

  const ensRegistry = await ENSRegistry.deploy()
  const ensResolver = await ENSResolver.deploy()
  const mirrorInviteToken = await MirrorInviteToken.deploy('MirrorInviteToken', 'MIRINVT')
  const reverseRegistrar = await ReverseRegistrar.deploy(ensRegistry.address, ensResolver.address)

  await ensRegistry.deployed()
  await ensResolver.deployed()
  await mirrorInviteToken.deployed()

  const rootName = 'mirror.xyz'
  const rootNode = namehash.hash(rootName)
  const mirrorENSRegistrar = await MirrorENSRegistrar.deploy(rootName, rootNode, ensRegistry.address, ensResolver.address, mirrorInviteToken.address)

  await mirrorENSRegistrar.deployed()

  // Post-deploy setup
  await mirrorInviteToken.setRegistrar(mirrorENSRegistrar.address)
  await mirrorInviteToken.mint(user1.address, 1)

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

  const rootOwner = await ensRegistry.owner(ZERO_BYTES32)
  console.log('rootOwner', rootOwner)
  const xyzOwner = await ensRegistry.owner(ethers.utils.namehash(root))
  console.log('xyzOwner', xyzOwner)
  return [
    ensResolver,
    ensRegistry,
    mirrorENSRegistrar,
    mirrorInviteToken,
  ]
}
describe('MirrorInviteToken', function() {
  it('should', async function() {
    const MirrorInviteToken = await ethers.getContractFactory('MirrorInviteToken')
    const token = await MirrorInviteToken.deploy('MirrorInviteToken', 'MIRINVT')

    await token.deployed()
    const totalSupply = await token.totalSupply()
    console.log('totalSupply', totalSupply)

    const name = await token.name()
    console.log('name', name)
  })
})

describe('Integration test', function() {
  it('should', async function() {
    const [owner, user1, user2] = await ethers.getSigners()
    const [ensResolver, ensRegistry, mirrorENSRegistrar, mirrorInviteToken] = await setup()

    const result = await mirrorInviteToken.connect(user1).register('vitalik', user1.address)
    const userBalance = await mirrorInviteToken.balanceOf(user1.address)
    console.log('userBalance', userBalance)
    assert.ok(userBalance.eq(BigNumber.from(0)))
  })
})

describe('ENS', function() {
  it('should setup properly', async function() {
    const [ensRegistry] = await setup()
  })
})
