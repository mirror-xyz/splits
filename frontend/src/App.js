import * as Web3 from 'web3'
import React from 'react'

import './App.css';

import Signer from "./components/Signer";

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
            <Signer web3={web3}/>
        </div>
    );
}

export default App;
