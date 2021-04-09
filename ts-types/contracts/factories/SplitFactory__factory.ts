/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { SplitFactory } from "../SplitFactory";

export class SplitFactory__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    splitter_: string,
    wethAddress_: string,
    overrides?: Overrides
  ): Promise<SplitFactory> {
    return super.deploy(
      splitter_,
      wethAddress_,
      overrides || {}
    ) as Promise<SplitFactory>;
  }
  getDeployTransaction(
    splitter_: string,
    wethAddress_: string,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(splitter_, wethAddress_, overrides || {});
  }
  attach(address: string): SplitFactory {
    return super.attach(address) as SplitFactory;
  }
  connect(signer: Signer): SplitFactory__factory {
    return super.connect(signer) as SplitFactory__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SplitFactory {
    return new Contract(address, _abi, signerOrProvider) as SplitFactory;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "splitter_",
        type: "address",
      },
      {
        internalType: "address",
        name: "wethAddress_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "merkleRoot_",
        type: "bytes32",
      },
    ],
    name: "createSplit",
    outputs: [
      {
        internalType: "address",
        name: "splitProxy",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "merkleRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "splitter",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "wethAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x60c060405234801561001057600080fd5b506040516105a13803806105a183398101604081905261002f91610069565b6001600160601b0319606092831b8116608052911b1660a05261009b565b80516001600160a01b038116811461006457600080fd5b919050565b6000806040838503121561007b578182fd5b6100848361004d565b91506100926020840161004d565b90509250929050565b60805160601c60a05160601c6104dd6100c4600039600060be01526000607201526104dd6000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80632eb4a7ab146100515780633cd8045e1461006d5780634f0e0ef3146100b957806381a77c8c146100e0575b600080fd5b61005a60005481565b6040519081526020015b60405180910390f35b6100947f000000000000000000000000000000000000000000000000000000000000000081565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610064565b6100947f000000000000000000000000000000000000000000000000000000000000000081565b6100946100ee366004610159565b6000818155604080516020810184905201604051602081830303815290604052805190602001206040516101219061014c565b8190604051809103906000f5905080158015610141573d6000803e3d6000fd5b506000805592915050565b6103368061017283390190565b60006020828403121561016a578081fd5b503591905056fe608060405234801561001057600080fd5b50336001600160a01b0316633cd8045e6040518163ffffffff1660e01b8152600401602060405180830381600087803b15801561004c57600080fd5b505af1158015610060573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061008491906101be565b600360006101000a8154816001600160a01b0302191690836001600160a01b03160217905550336001600160a01b0316634f0e0ef36040518163ffffffff1660e01b8152600401602060405180830381600087803b1580156100e557600080fd5b505af11580156100f9573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061011d91906101be565b600260006101000a8154816001600160a01b0302191690836001600160a01b03160217905550336001600160a01b0316632eb4a7ab6040518163ffffffff1660e01b8152600401602060405180830381600087803b15801561017e57600080fd5b505af1158015610192573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101b691906101ec565b600055610204565b6000602082840312156101cf578081fd5b81516001600160a01b03811681146101e5578182fd5b9392505050565b6000602082840312156101fd578081fd5b5051919050565b610123806102136000396000f3fe60806040526004361060335760003560e01c80632eb4a7ab14607f5780633cd8045e1460a6578063ba0bafb41460d9576039565b36603957005b6000605960035473ffffffffffffffffffffffffffffffffffffffff1690565b905060405136600082376000803683855af43d806000843e818015607b578184f35b8184fd5b348015608a57600080fd5b50609360005481565b6040519081526020015b60405180910390f35b34801560b157600080fd5b5060035460405173ffffffffffffffffffffffffffffffffffffffff9091168152602001609d565b34801560e457600080fd5b5060936001548156fea26469706673582212207f370a0d2f87b7e05a71917a1e1d1a4485ad91634028bcc60afc3139227539ec64736f6c63430008030033a26469706673582212209c68daab5e2ce0c222d409514864c8930a169ca141a4c7d10587141bb81d8f7a64736f6c63430008030033";
