import {ethers, waffle} from "hardhat";
import fs from "fs";
import {CONTRACT_NAMES, ENS_REGISTRY_ADDRESS, NETWORK_MAP, ROOT_NAME, ROOT_NODE, TOKEN_NAME} from "./config/constants";

const deploymentAddressFile = './frontend/src/config/deployed-addresses.json';

class MirrorProtocolDeployer {
    static async call() {
        const service = new MirrorProtocolDeployer();
        await service.deploy();
    }

    constructor() {
        this.factories = {};
        this.contracts = {};

        console.log(
            `       🪞 Mirror Protocol Deployer 🪞
                
Starting deployment....`
        );
    }

    async deploy() {
        await this.setFactories();

        await this.deployContracts();

        await this.updateContractState();

        this.logContractAddresses();

        await this.writeAddressesToFile();

        console.log("Everything is done!");
    }

    async writeAddressesToFile() {
        console.log(`📝      Writing addresses to file...`);

        // const chainId = (await waffle.provider.getNetwork()).chainId
        // const networkName = NETWORK_MAP[chainId]
        //
        // let deployedAddresses = {}
        // deployedAddresses[networkName] = {
        //     ENSResolver: this.contracts.ensResolver.address,
        //     MirrorInviteToken: this.contracts.mirrorInviteToken.address,
        //     MirrorENSRegistrar: this.contracts.mirrorENSManager.address,
        // }
        //
        // fs.writeFileSync(
        //     deploymentAddressFile,
        //     JSON.stringify(deployedAddresses, null, 2)
        // );
    }

    async updateContractState() {
        // await this.contracts.mirrorInviteToken.setRegistrar(this.contracts.mirrorENSManager.address);
        // await this.contracts.ensResolver.addManager(this.contracts.mirrorENSManager.address);
    }

    logContractAddresses() {
        console.log(`🌈      Deployed the contracts!     🌈`);
        // console.log(CONTRACT_NAMES.ENS_RESOLVER, this.contracts.ensResolver.address);
        // console.log(CONTRACT_NAMES.INVITE_TOKEN, this.contracts.mirrorInviteToken.address);
        // console.log(CONTRACT_NAMES.ENS_MANAGER, this.contracts.mirrorENSManager.address);
    }

    async deployContracts() {
        // this.contracts.ensResolver = await this.factories.ENSResolver.deploy();
        // this.contracts.mirrorInviteToken = await this.factories.MirrorInviteToken.deploy(
        //     CONTRACT_NAMES.INVITE_TOKEN,
        //     TOKEN_NAME
        // );
        //
        // await this.contracts.mirrorInviteToken.deployed();
        // await this.contracts.ensResolver.deployed();
        //
        // this.contracts.mirrorENSManager = await this.factories.MirrorENSRegistrar.deploy(
        //     ROOT_NAME,
        //     ROOT_NODE,
        //     ENS_REGISTRY_ADDRESS,
        //     this.contracts.ensResolver.address,
        //     this.contracts.mirrorInviteToken.address
        // );
        //
        // await this.contracts.mirrorENSManager.deployed();
    }

    async setFactories() {
        this.factories.ENSResolver = await this.getContract(CONTRACT_NAMES.ENS_RESOLVER);
        this.factories.MirrorENSManager = await this.getContract(CONTRACT_NAMES.ENS_MANAGER);
        this.factories.MirrorInviteToken = await this.getContract(CONTRACT_NAMES.INVITE_TOKEN);
    }

    getContract(name) {
        return ethers.getContractFactory(name);
    }
}

export default MirrorProtocolDeployer;