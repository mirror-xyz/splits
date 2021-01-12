import { ethers } from "hardhat";
import { ENS_REGISTRY_ADDRESS, ROOT_NAME, ROOT_NODE } from "../config/constants";

async function setup() {
    const [owner, user1, user2] = await ethers.getSigners();
  
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
  
    await mirrorInviteToken.setRegistrar(mirrorENSRegistrar.address);
  
    return [
        mirrorInviteToken,
        mirrorENSRegistrar
    ];
  }

  export default setup;