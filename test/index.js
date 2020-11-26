const { assert } = require('chai')
const namehash = require('eth-ens-namehash')

const BigNumber = ethers.BigNumber

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
    const [argentENSResolver, ensRegistry, mirrorENSRegistrar, mirrorInviteToken] = await setup()
    console.log('mint')
    await mirrorInviteToken.mint(user1.address, 1)
    console.log('minted')

    const result = await mirrorInviteToken.connect(user1).register('vitalik', user1.address, { from : user1.address })
    userBalance = await mirrorInviteToken.balanceOf(user1.address)
    console.log('userBalance', userBalance)
    assert.ok(userBalance.eq(BigNumber.from(0)))
  })
})


async function setup() {
  const [owner, user1, user2] = await ethers.getSigners()
  console.log('account', owner.address)

  const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
  const ArgentENSResolver = await ethers.getContractFactory('ArgentENSResolver')
  const MirrorENSRegistrar = await ethers.getContractFactory('MirrorENSRegistrar')
  const MirrorInviteToken = await ethers.getContractFactory('MirrorInviteToken')

  const ensRegistry = await ENSRegistry.deploy()
  const argentENSResolver = await ArgentENSResolver.deploy()
  const mirrorInviteToken = await MirrorInviteToken.deploy('MirrorInviteToken', 'MIRINVT')

  await ensRegistry.deployed()
  await argentENSResolver.deployed()
  await mirrorInviteToken.deployed()

  const rootName = 'mirror.xyz'
  const rootNode = namehash.hash(rootName)
  const mirrorENSRegistrar = await MirrorENSRegistrar.deploy(rootName, rootNode, ensRegistry.address, argentENSResolver.address, mirrorInviteToken.address)

  await mirrorENSRegistrar.deployed()

  // Post-deploy setup
  await mirrorInviteToken.setRegistrar(mirrorENSRegistrar.address)

  const result = await ensRegistry.owner(ethers.utils.formatBytes32String(''))
  console.log('result', result)
  return [
    argentENSResolver,
    ensRegistry,
    mirrorENSRegistrar,
    mirrorInviteToken,
  ]
}

describe('ENS', function() {
  it('should setup properly', async function() {
    const [ensRegistry] = await setup()
  })
})
