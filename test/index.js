const { assert } = require('chai')
const namehash = require('eth-ens-namehash')

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


async function setup() {
  const accounts = await ethers.getSigners()
  console.log('account', accounts[0].address)

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

  const result = await ensRegistry.owner(ethers.utils.formatBytes32String(''))
  console.log('result', result)
  return [ensRegistry]
}

describe('ENS', function() {
  it('should setup properly', async function() {
    const [ensRegistry] = await setup()
  })
})
