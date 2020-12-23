import {ethers, waffle} from "hardhat";
import fs from "fs";
import {CONTRACT_NAMES, ENS_REGISTRY_ADDRESS, NETWORK_MAP, ROOT_NAME, ROOT_NODE, TOKEN_NAME} from "./config/constants";

const deploymentAddressFile = './frontend/src/config/deployed-addresses.json';

class MirrorProtocolDeployer {
    static call() {
        const service = new MirrorProtocolDeployer();
        return service.deploy();
    }

    constructor() {
        this.factories = {};
        this.contracts = {};
    }

    async deploy() {
        console.log("\n🏭  Setting Factories...");
        await this.setFactories();

        console.log("\n🤖  Deploying Contracts...");
        await this.deployContracts();

        console.log("\n🐘  Setting Contract State...");
        await this.updateContractState();
        console.log("\n🌈  Deployment Complete!...");

        console.log(`\n📝  Writing addresses to file...`);
        await this.writeAddressesToFile();

        console.log("\n");

        return {
            contracts: {
                [CONTRACT_NAMES.ENS_RESOLVER]: this.contracts.ensResolver.address,
                [CONTRACT_NAMES.INVITE_TOKEN]: this.contracts.mirrorInviteToken.address,
                [CONTRACT_NAMES.ENS_MANAGER]: this.contracts.mirrorENSManager.address,
            }
        };
    }

    async writeAddressesToFile() {
        const chainId = (await waffle.provider.getNetwork()).chainId
        const networkName = NETWORK_MAP[chainId]

        const deployedAddresses = {
            [networkName]:  {
                ENSResolver: this.contracts.ensResolver.address,
                MirrorInviteToken: this.contracts.mirrorInviteToken.address,
                MirrorENSRegistrar: this.contracts.mirrorENSManager.address,
            }
        };

        fs.writeFileSync(
            deploymentAddressFile,
            JSON.stringify(deployedAddresses, null, 2)
        );
    }

    async updateContractState() {
        console.log("   - Setting Registrar Address on Invite Token");
        await this.contracts.mirrorInviteToken.setRegistrar(this.contracts.mirrorENSManager.address);
        console.log("   - Adding ENS Manager to Resolver");
        await this.contracts.ensResolver.addManager(this.contracts.mirrorENSManager.address);
    }

    async deployContracts() {
        console.log("   - Deploying ENS Resolver");
        this.contracts.ensResolver = await this.factories.ENSResolver.deploy();
        console.log("   - Deploying Invite Token");
        this.contracts.mirrorInviteToken = await this.factories.MirrorInviteToken.deploy(
            CONTRACT_NAMES.INVITE_TOKEN,
            TOKEN_NAME
        );

        await this.contracts.mirrorInviteToken.deployed();
        await this.contracts.ensResolver.deployed();

        console.log("   - Deploying Mirror ENS Manager");
        this.contracts.mirrorENSManager = await this.factories.MirrorENSManager.deploy(
            ROOT_NAME,
            ROOT_NODE,
            ENS_REGISTRY_ADDRESS,
            this.contracts.ensResolver.address,
            this.contracts.mirrorInviteToken.address
        );

        await this.contracts.mirrorENSManager.deployed();
    }

    async setFactories() {
        console.log("   - Setting ENSResolver factory");
        this.factories.ENSResolver = await this.getContract(CONTRACT_NAMES.ENS_RESOLVER);
        console.log("   - Setting MirrorENSManager factory");
        this.factories.MirrorENSManager = await this.getContract(CONTRACT_NAMES.ENS_MANAGER);
        console.log("   - Deploying MirrorInviteToken factory");
        this.factories.MirrorInviteToken = await this.getContract(CONTRACT_NAMES.INVITE_TOKEN);
    }

    getContract(name) {
        return ethers.getContractFactory(name);
    }
}

export default MirrorProtocolDeployer;