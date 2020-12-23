import React, {Component} from "react";
import deployedAddresses from "../config/deployed-addresses.json";
import MirrorInviteTokenABI from "../abi/MirrorInviteToken.json";
import ENSRegistryABI from "../abi/ENSRegistry.json";
import MirrorENSManagerABI from "../abi/MirrorENSManager.json";
import {Transaction} from "@ethereumjs/tx";
import {BN} from "ethereumjs-util";
import * as sigUtil from "eth-sig-util";
import * as ethers from "ethers";

import {CONTRACT_NAMES, NETWORK_MAP, ENS_REGISTRY_ADDRESS, ROOT_NODE} from "../config/constants";

const ZERO_BYTES32 = ethers.constants.HashZero;

class Signer extends Component {
    constructor(props) {
        super(props)

        this.web3 = props.web3;

        this.state = {
            label: '',
            mintAmount: '',
            newENSOwner: '',
        }
    }

    async componentDidMount() {
        const chainId = await this.web3.eth.net.getId();
        const account = (await this.web3.eth.getAccounts())[0];

        if (!account) {
            return;
        }

        console.log(CONTRACT_NAMES.ENS_MANAGER);
        console.log(NETWORK_MAP[chainId]);
        console.log(deployedAddresses[NETWORK_MAP[chainId]][CONTRACT_NAMES.ENS_MANAGER]);

        const mirrorInviteTokenAddress = deployedAddresses[NETWORK_MAP[chainId]][CONTRACT_NAMES.INVITE_TOKEN];
        const mirrorENSManagerAddress = deployedAddresses[NETWORK_MAP[chainId]][CONTRACT_NAMES.ENS_MANAGER];
        const mirrorENSResolverAddress = deployedAddresses[NETWORK_MAP[chainId]][CONTRACT_NAMES.ENS_RESOLVER];

        const mirrorInviteToken = new this.web3.eth.Contract((MirrorInviteTokenABI), mirrorInviteTokenAddress);
        const numTokens = await mirrorInviteToken.methods.balanceOf(account).call();
        const ensRegistry = new this.web3.eth.Contract(
            ENSRegistryABI,
            ENS_REGISTRY_ADDRESS
        );

        const ensOwner = await ensRegistry.methods.owner(ROOT_NODE).call();

        this.setState({
            ...this.state,
            chainId,
            account,
            numTokens,
            mirrorInviteTokenAddress,
            mirrorENSManagerAddress,
            mirrorENSResolverAddress,
            ensOwner
        });
    }

    handleLabelChange(event) {
        this.setState({
            label: event.target.value
        });
    }

    handleChangeENSOwnerInput(event) {
        const newENSOwner = event.target.value;
        console.log({newENSOwner});

        this.setState({
            newENSOwner,
        })
    }

    handleChangeENSOwner() {
        const {newENSOwner} = this.state;

        const mirrorENS = new this.web3.eth.Contract(
            MirrorENSManagerABI,
            deployedAddresses[NETWORK_MAP[this.state.chainId]][CONTRACT_NAMES.ENS_MANAGER]
        );

        mirrorENS.methods.changeRootnodeOwner(newENSOwner).send({from: this.state.account});
    }

    async sign(input) {
        const account = (await this.web3.eth.getAccounts())[0]

        const txData = JSON.parse(input)
        const tx = Transaction.fromTxData(txData)
        const msgHash = '0x' + tx.getMessageToSign().toString('hex')

        let result = await this.web3.eth.sign(msgHash, account)

        result = result.slice(2)
        const r = new BN(Buffer.from(result.slice(0, 64), 'hex'))
        const s = new BN(Buffer.from(result.slice(64, 128), 'hex'))
        const v = new BN(Buffer.from(result.slice(128, 130), 'hex'))
        const signedTxData = {...tx, r, s, v}
        console.log('signedTxData', signedTxData)
        console.log('', r.toString(), s.toString(), v.toString())
        const signedTx = Transaction.fromTxData(signedTxData).serialize().toString('hex')

        this.setState({
            ...this.state,
            signedTx,
        })
    }

    async submitTx() {
        const mirrorInviteToken = new this.web3.eth.Contract(
            MirrorInviteTokenABI,
            this.state.mirrorInviteTokenAddress
        );

        console.log("registering at", this.state.mirrorInviteTokenAddress);
        console.log("registering from", this.state.account);

        mirrorInviteToken.methods
            .register(this.state.label, this.state.account)
            .send({from: this.state.account})
    }

    async queryLabel() {
        const ensRegistry = new this.web3.eth.Contract((ENSRegistryABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['ENSRegistry'])
        const fullLabel = `${this.state.readLabel}.mirror.test`
        const owner = await ensRegistry.methods.owner(ethers.utils.namehash(fullLabel)).call({
            from: this.state.account,
            gas: '800000'
        })
        this.setState({
            readOwner: owner,
        })
    }

    handleMintAddressLabelChange(event) {
        this.setState({
            mintAddress: event.target.value
        })
    }

    handleMintAmountLabelChange(event) {
        this.setState({
            mintAmount: event.target.value
        })
    }

    async mint() {
        const mirrorInviteToken = new this.web3.eth.Contract((MirrorInviteTokenABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['MirrorInviteToken'])
        mirrorInviteToken.methods.mint(this.state.mintAddress, this.state.mintAmount).send({from: this.state.account})
    }

    render() {
        return (
            <div className="container">
                <div className="header">
                    <div className="container">
                        <h2>Mirror Onboarding Token Admin</h2>
                        <p>Perform actions against the Mirror Onboarding Token</p>
                    </div>
                </div>

                <div>
                    <div className="section">
                        <h3>Connection Details</h3>
                        <table className="horizontal-table u-full-width">
                            <tbody>
                            <tr>
                                <td>Chain ID</td>
                                <td>{this.state.chainId}</td>
                            </tr>
                            <tr>
                                <td>ENS Manager Controller Address</td>
                                <td>{this.state.ensOwner}</td>
                            </tr>
                            <tr>
                                <td>Mirror Token Address</td>
                                <td>{this.state.mirrorInviteTokenAddress}</td>
                            </tr>
                            <tr>
                                <td>Mirror Manager Address</td>
                                <td>{this.state.mirrorENSManagerAddress}</td>
                            </tr>
                            <tr>
                                <td>Mirror ENS Resolver</td>
                                <td>{this.state.mirrorENSResolverAddress}</td>
                            </tr>
                            <tr>
                                <td>Connected Account Address</td>
                                <td>{this.state.account}</td>
                            </tr>
                            <tr>
                                <td>Tokens Owned</td>
                                <td>{this.state.numTokens}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="section">
                        <h3>Mint Tokens</h3>
                        <label htmlFor="receiverAddress">Receiver Address</label>
                        <input
                            className="u-full-width"
                            placeholder={"0x"}
                            id="receiverAddress"
                            value={this.state.mintAddress}
                            onChange={(event) => {
                                this.handleMintAddressLabelChange(event)
                            }}
                        />
                        <label htmlFor="mintAmount">Number of tokens to mint</label>
                        <input
                            className="u-full-width"
                            placeholder={"100"}
                            id={"mintAmount"}
                            value={this.state.mintAmount}
                            onChange={(event) => {
                                this.handleMintAmountLabelChange(event)
                            }}
                        />
                        <div>
                            <button className="button-primary" onClick={() => {
                                this.mint()
                            }}>Mint
                            </button>
                        </div>
                    </div>

                    <div className="section">
                        <h3>Register a Label</h3>
                        <label htmlFor="labelName">Label name</label>
                        <input
                            id={"labelName"}
                            className="u-full-width"
                            placeholder={"metablog"}
                            value={this.state.label}
                            onChange={(event) => {
                                this.handleLabelChange(event)
                            }}
                        />
                        <div>
                            <button className="button-primary" onClick={() => {
                                this.submitTx()
                            }}>Register ENS
                            </button>
                        </div>
                    </div>

                    <div className="section">
                        <h3>Change ENS Owner</h3>
                        <label htmlFor="ownerAddress">New owner address</label>
                        <input
                            id={"ownerAddress"}
                            className="u-full-width"
                            placeholder={"0x"}
                            value={this.state.newENSOwner}
                            onChange={(event) => {
                                this.handleChangeENSOwnerInput(event)
                            }}
                        />
                        <div>
                            <button className="button-primary" onClick={() => {
                                this.handleChangeENSOwner()
                            }}>Change Owner
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Signer;