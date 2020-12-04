const { assert, expect } = require('chai')
const namehash = require('eth-ens-namehash')

const BigNumber = ethers.BigNumber

const ZERO_BYTES32 = ethers.constants.HashZero;

const root = 'xyz'
const subnameWallet = 'mirror'

async function setup() {
  const [owner, user1, user2] = await ethers.getSigners()

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
  const xyzOwner = await ensRegistry.owner(ethers.utils.namehash(root))
  return [
    ensResolver,
    ensRegistry,
    mirrorENSRegistrar,
    mirrorInviteToken,
  ]
}
describe('MirrorInviteToken', () => {
  it('should', async () => {
    const MirrorInviteToken = await ethers.getContractFactory('MirrorInviteToken')
    const token = await MirrorInviteToken.deploy('MirrorInviteToken', 'MIRINVT')

    await token.deployed()
    const totalSupply = await token.totalSupply()

    const name = await token.name()
  })
})

describe('Mirror', () => {
  describe('Integration test', () => {
    it('should register user with token', async () => {
      const [owner, user1, user2] = await ethers.getSigners()
      const [ensResolver, ensRegistry, mirrorENSRegistrar, mirrorInviteToken] = await setup()

      await mirrorInviteToken.mint(user1.address, 1)
      await mirrorInviteToken.connect(user1).register('vitalik', user1.address)

      const userBalance = await mirrorInviteToken.balanceOf(user1.address)
      const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash('vitalik.mirror.xyz'))
      assert(userBalance.eq(BigNumber.from(0)))
      assert.equal(subdomainOwner, user1.address)
    })

    it('should fail to register if user doesn\'t have token', async () => {
      const [owner, user1, user2] = await ethers.getSigners()
      const [ensResolver, ensRegistry, mirrorENSRegistrar, mirrorInviteToken] = await setup()

      await expect(
        mirrorInviteToken.connect(user1).register('vitalik', user1.address)
      ).revertedWith('VM Exception while processing transaction: revert ERC20: burn amount exceeds balance')

      const userBalance = await mirrorInviteToken.balanceOf(user1.address)
      const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash('vitalik.mirror.xyz'))
      assert(userBalance.eq(BigNumber.from(0)))
      assert.equal(subdomainOwner, '0x0000000000000000000000000000000000000000')
    })
  })
})

describe('ENS', () => {
  it('should setup properly', async () => {
    const [ensRegistry] = await setup()
  })
})
