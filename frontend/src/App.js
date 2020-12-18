import * as Web3 from 'web3'
import * as ethers from 'ethers'
import * as sigUtil from 'eth-sig-util'
import React, {Component} from 'react'
import {BN} from 'ethereumjs-util'
import {Transaction} from '@ethereumjs/tx'

import './App.css';

import MirrorInviteTokenABI from './abi/MirrorInviteToken.json'
import MirrorENSRegistrarABI from './abi/MirrorENSRegistrar.json'
import ENSRegistryABI from './abi/ENSRegistry.json'
import deployedAddresses from './config/deployed-addresses.json'

const NETWORK_MAP = {
    '0': 'mainnet',
    '3': 'ropsten',
    '1337': 'hardhat',
    '31337': 'hardhat',
}
const ZERO_BYTES32 = ethers.constants.HashZero;

let web3

if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
    window.ethereum.request({method: 'eth_requestAccounts'});
    web3 = new Web3(window.web3.currentProvider)
} else {
    console.log('not installed')
}

function App() {
    return (
        <div className="App">
            <Signer/>
        </div>
    );
}

class Signer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            textareaValue: `{
  "nonce": 0,
  "gasPrice": 30000000000,
  "gasLimit": 21000,
  "to": "0x443D2f2755DB5942601fa062Cc248aAA153313D3",
  "value": 0,
  "data": "0x"
}`,
            signedTx: '',
            label: '',
            mintAmount: '',
        }
    }

    async componentDidMount() {
        const chainId = await web3.eth.net.getId()
        const account = (await web3.eth.getAccounts())[0]

        const mirrorInviteTokenAddress = deployedAddresses[NETWORK_MAP[chainId]]['MirrorInviteToken']
        const mirrorInviteToken = new web3.eth.Contract((MirrorInviteTokenABI), mirrorInviteTokenAddress)
        const numTokens = await mirrorInviteToken.methods.balanceOf(account).call()

        this.setState({
            ...this.state,
            chainId,
            account,
            numTokens,
            mirrorInviteTokenAddress
        });
    }

    handleLabelChange(event) {
        this.setState({
            label: event.target.value
        })
    }

    async sign(input) {
        const account = (await web3.eth.getAccounts())[0]

        const txData = JSON.parse(input)
        const tx = Transaction.fromTxData(txData)
        const msgHash = '0x' + tx.getMessageToSign().toString('hex')

        let result = await web3.eth.sign(msgHash, account)

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

    // https://docs.metamask.io/guide/signing-data.html#sign-typed-data-v4
    // https://medium.com/metamask/eip712-is-coming-what-to-expect-and-how-to-use-it-bb92fd1a7a26
    async signMsg() {
        const msgParams = JSON.stringify({
            domain: {
                // Defining the chain aka Rinkeby testnet or Ethereum Main Net
                chainId: this.state.chainId,
                // Give a user friendly name to the specific contract you are signing for.
                name: 'MirrorInviteToken',
                // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
                verifyingContract: deployedAddresses[NETWORK_MAP[this.state.chainId]]['MirrorInviteToken'],
                // Just let's you know the latest version. Definitely make sure the field name is correct.
                version: '1',
            },

            // Defining the message signing data content.
            message: {
                owner: this.state.account,
                label: web3.utils.keccak256(this.state.label),
                validAfter: '0',
                validBefore: '1639082582', // one year from now
                nonce: ZERO_BYTES32,
            },
            // Refers to the keys of the *types* object below.
            primaryType: 'RegisterWithAuthorization',
            types: {
                // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
                EIP712Domain: [
                    {name: 'name', type: 'string'},
                    {name: 'version', type: 'string'},
                    {name: 'chainId', type: 'uint256'},
                    {name: 'verifyingContract', type: 'address'},
                ],
                RegisterWithAuthorization: [
                    {type: 'address', name: 'owner'},
                    {type: 'bytes32', name: 'label'},
                    {type: 'uint256', name: 'validAfter'},
                    {type: 'uint256', name: 'validBefore'},
                    {type: 'bytes32', name: 'nonce'},
                ],
            },
        });

        const from = (await web3.eth.getAccounts())[0].toLowerCase()
        console.log('from', from)

        web3.currentProvider.sendAsync({
            method: 'eth_signTypedData_v3',
            params: [from, msgParams],
            from: from,
        }, (err, result) => {
            if (err) return console.error(err)
            if (result.error) {
                return console.error(result.error.message)
            }

            const signature = result.result.substring(2);
            const r = '0x' + signature.substring(0, 64);
            const s = '0x' + signature.substring(64, 128);
            const v = parseInt(signature.substring(128, 130), 16);

            this.setState({
                ...this.state,
                signature: {v, r, s}
            })
            const recovered = sigUtil.recoverTypedSignature_v4({
                data: JSON.parse(msgParams),
                sig: result.result,
            })
            if (recovered === from) {
                console.log('Recovered signer: ' + from)
            } else {
                console.log('Failed to verify signer, got: ' + JSON.stringify(result))
            }
        })
    }

    async submitMetaTx() {
        const mirrorInviteToken = new web3.eth.Contract((MirrorInviteTokenABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['MirrorInviteToken'])
        const {v, r, s} = this.state.signature
        console.log('signature', this.state.signature)
        mirrorInviteToken.methods.registerWithAuthorization(this.state.account, this.state.label, '0', '1639082582', ZERO_BYTES32, /*'0x' + v.toString(16) */ v, r, s).send({from: this.state.account})
    }

    async submitTx() {
        const mirrorInviteToken = new web3.eth.Contract((MirrorInviteTokenABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['MirrorInviteToken'])
        mirrorInviteToken.methods.register(this.state.label, this.state.account).send({from: this.state.account})
    }

    async loadFields() {
        const mirrorInviteToken = new web3.eth.Contract((MirrorInviteTokenABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['MirrorInviteToken'])
        const domainSeparator = await mirrorInviteToken.methods.DOMAIN_SEPARATOR().call({
            from: this.state.account,
            gas: '800000'
        })
        console.log('domainSeparator', domainSeparator)

        const {v, r, s} = this.state.signature
        const recovered = await mirrorInviteToken.methods.debug(this.state.account, this.state.label, '0', '1639082582', '0x0', '0x' + v.toString(16), r, s).call({
            from: this.state.account,
            gas: '800000'
        })
        console.log('recovered', recovered)

        const mirrorENSRegistrar = new web3.eth.Contract((MirrorENSRegistrarABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['MirrorENSRegistrar'])
        const available = await mirrorENSRegistrar.methods.isAvailable(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.state.label))).call({
            from: this.state.account,
            gas: '800000'
        })
        console.log('available', available)

        const ensRegistry = new web3.eth.Contract((ENSRegistryABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['ENSRegistry'])
        const fullLabel = `${this.state.label}.mirror.xyz`
        console.log('node', fullLabel, ethers.utils.namehash(fullLabel))
        const owner = await ensRegistry.methods.owner(ethers.utils.namehash(fullLabel)).call({
            from: this.state.account,
            gas: '800000'
        })
        console.log('owner', owner)

    }

    handleReadLabelChange(event) {
        this.setState({
            readLabel: event.target.value
        })
    }

    async queryLabel() {
        const ensRegistry = new web3.eth.Contract((ENSRegistryABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['ENSRegistry'])
        const fullLabel = `${this.state.readLabel}.mirror.xyz`
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
        const mirrorInviteToken = new web3.eth.Contract((MirrorInviteTokenABI), deployedAddresses[NETWORK_MAP[this.state.chainId]]['MirrorInviteToken'])
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
                                <td>Mirror Token Address</td>
                                <td>{this.state.mirrorInviteTokenAddress}</td>
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
                            class="u-full-width"
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
                            }}>Submit Normal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default App;
