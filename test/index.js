const { assert, expect } = require('chai')
const { ethers } = require('hardhat')

const BigNumber = ethers.BigNumber

const ZERO_BYTES32 = ethers.constants.HashZero
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

  const rootOwner = await ensRegistry.owner(ZERO_BYTES32)
  const xyzOwner = await ensRegistry.owner(ethers.utils.namehash(root))


  // Hardcode to 31337 (default) since ethers.network is undefined for some reason
  //const chainId = ethers.network.chainId
  const chainId = 31337

  domainSeparator = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
        ),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MirrorInviteToken')),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('1')),
        chainId,
        mirrorInviteToken.address,
      ]
    )
  )

  console.log('domainSeparator', domainSeparator)

  return [
    ensResolver,
    ensRegistry,
    mirrorENSRegistrar,
    mirrorInviteToken,
    domainSeparator,
  ]
}

describe('Mirror Onboarding', () => {
  let ensResolver
  let ensRegistry
  let mirrorENSRegistrar
  let mirrorInviteToken
  let domainSeparator

  beforeEach(async () => {
    [ensResolver, ensRegistry, mirrorENSRegistrar, mirrorInviteToken, domainSeparator] = await setup()
  })


  it('should register user with token through token contract', async () => {
    const [owner, user1, user2] = await ethers.getSigners()

    await mirrorInviteToken.mint(user1.address, 1)
    await mirrorInviteToken.connect(user1).register('vitalik', user1.address)

    const userBalance = await mirrorInviteToken.balanceOf(user1.address)
    const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash('vitalik.mirror.xyz'))
    assert(userBalance.eq(BigNumber.from(0)))
    assert.equal(subdomainOwner, user1.address)
  })

  it('should fail to register if user doesn\'t have token', async () => {
    const [owner, user1, user2] = await ethers.getSigners()

    await expect(
      mirrorInviteToken.connect(user1).register('vitalik', user1.address)
    ).revertedWith('VM Exception while processing transaction: revert ERC20: burn amount exceeds balance')

    const userBalance = await mirrorInviteToken.balanceOf(user1.address)
    const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash('vitalik.mirror.xyz'))
    assert(userBalance.eq(BigNumber.from(0)))
    assert.equal(subdomainOwner, '0x0000000000000000000000000000000000000000')
  })

  it('should register user with token through registrar directly', async () => {
    const [owner, user1, user2] = await ethers.getSigners()

    await mirrorInviteToken.mint(user1.address, 1)
    await mirrorInviteToken.connect(user1).approve(mirrorENSRegistrar.address, 1)
    await mirrorENSRegistrar.connect(user1).register('vitalik', user1.address, user1.address)

    const userBalance = await mirrorInviteToken.balanceOf(user1.address)
    const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash('vitalik.mirror.xyz'))
    assert(userBalance.eq(BigNumber.from(0)))
    assert.equal(subdomainOwner, user1.address)
  })

  it('should initialize with correct domain seperator', async () => {
    const [owner, user1, user2] = await ethers.getSigners()

    assert.equal(await mirrorInviteToken.DOMAIN_SEPARATOR(), domainSeparator, 'domain domain separator should match')

    await mirrorInviteToken.mint(user1.address, 1)
    await mirrorInviteToken.connect(user1).approve(mirrorENSRegistrar.address, 1)
    await mirrorENSRegistrar.connect(user1).registerWithAuthorization('vitalik', user1.address, user1.address)

    const userBalance = await mirrorInviteToken.balanceOf(user1.address)
    const subdomainOwner = await ensRegistry.owner(ethers.utils.namehash('vitalik.mirror.xyz'))
    assert(userBalance.eq(BigNumber.from(0)))
    assert.equal(subdomainOwner, user1.address)
  })
})
