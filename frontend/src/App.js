import React, { Component } from 'react'
import { Transaction } from '@ethereumjs/tx'
import { BN } from 'ethereumjs-util'
import * as Web3 from 'web3'
import * as sigUtil from 'eth-sig-util'

import logo from './logo.svg';
import './App.css';

import MirrorInviteTokenABI from './abi/MirrorInviteToken.json'
import deployedAddresses from './config/deployed-addresses.json'

const NETWORK_MAP = {
  '0': 'mainnet',
  '3': 'ropsten',
}

let web3

if (typeof window.ethereum !== 'undefined') {
  console.log('MetaMask is installed!');
  window.ethereum.request({ method: 'eth_requestAccounts' });
  web3 = new Web3(window.web3.currentProvider)
} else {
  console.log('not installed')
}

function App() {
  return (
    <div className="App">
      <Signer />
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
      signedTx: ''
    }
  }

  async componentDidMount() {
    const chainId = await web3.eth.net.getId()
    const account = (await web3.eth.getAccounts())[0]
    this.setState({
      chainId,
      account,
    })
  }

  handleChange(event) {
    this.setState({
      textareaValue: event.target.value
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
    const signedTxData = { ...tx, r, s, v }
    console.log('signedTxData', signedTxData)
    console.log('', r.toString(), s.toString(), v.toString())
    const signedTx = Transaction.fromTxData(signedTxData).serialize().toString('hex')

    this.setState({ signedTx })
  }

  async refresh() {
    const mirrorInviteToken = new web3.eth.Contract((MirrorInviteTokenABI), deployedAddresses['ropsten']['MirrorInviteToken'])
    const domainSeparator = await mirrorInviteToken.methods.DOMAIN_SEPARATOR().call()
    this.setState({ domainSeparator })
  }

  // https://docs.metamask.io/guide/signing-data.html#sign-typed-data-v4
  // https://medium.com/metamask/eip712-is-coming-what-to-expect-and-how-to-use-it-bb92fd1a7a26
  async signMsg() {
    console.log('', deployedAddresses)
    console.log('#', deployedAddresses[NETWORK_MAP[this.state.chainId]])
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
        label: 'daniel',
        validAfter: '1639082582', // one year from now
        validBefore: '0',
        nonce: '0',
      },
      // Refers to the keys of the *types* object below.
      primaryType: 'RegisterWithAuthorization',
      types: {
        // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        RegisterWithAuthorization: [
          { type: 'address', name: 'owner' },
          { type: 'string', name: 'label' },
          { type: 'uint256', name: 'validAfter' },
          { type: 'uint256', name: 'validBefore' },
          { type: 'bytes32', name: 'nonce' },
        ],
      },
    });

    const from = (await web3.eth.getAccounts())[0].toLowerCase()
    console.log('from', from)

    web3.currentProvider.sendAsync({
      method: 'eth_signTypedData_v4',
      params: [from, msgParams],
      from: from,
    }, function (err, result) {
      if (err) return console.error(err)
      if (result.error) {
        return console.error(result.error.message)
      }
      console.log('result', result)

      const signature = result.result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);

      console.log('', { v, r, s })
      const recovered = sigUtil.recoverTypedSignature_v4({
        data: JSON.parse(msgParams),
        sig: result.result,
      })
      console.log('recovered', recovered, 'from', from)
      if (recovered === from ) {
        alert('Recovered signer: ' + from)
      } else {
        alert('Failed to verify signer, got: ' + JSON.stringify(result))
      }
    })
  }

  render() {
    return (
      <div>
        <h1>Offline Sign</h1>
        <div>Domain Separator: {this.state.domainSeparator}</div>
        <h2>Input</h2>
        <div>Warning: be careful about what you sign.</div>
        <div>
          <textarea
          value={ this.state.textareaValue }
          onChange={(event) => { this.handleChange(event) }}
          style={{ width: '600px', height: '250px' }}
        />
          </div>
          <div>
            <button onClick={() => { this.signMsg() }}>Sign</button>
          </div>
          <div>
            <button onClick={() => { this.refresh() }}>Refresh</button>
          </div>
          <h2>Output</h2>
          <textarea
          disabled
          value={ this.state.signedTx }
          style={{ width: '600px', height: '250px' }}
        />
          </div>
    )
  }
}

export default App;
