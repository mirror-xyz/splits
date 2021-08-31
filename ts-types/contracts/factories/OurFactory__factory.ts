/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { OurFactory } from "../OurFactory";

export class OurFactory__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(pylon_: string, overrides?: Overrides): Promise<OurFactory> {
    return super.deploy(pylon_, overrides || {}) as Promise<OurFactory>;
  }
  getDeployTransaction(
    pylon_: string,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(pylon_, overrides || {});
  }
  attach(address: string): OurFactory {
    return super.attach(address) as OurFactory;
  }
  connect(signer: Signer): OurFactory__factory {
    return super.connect(signer) as OurFactory__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): OurFactory {
    return new Contract(address, _abi, signerOrProvider) as OurFactory;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "pylon_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "ourProxy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "proxyOwner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "splitRecipients",
        type: "string",
      },
    ],
    name: "ProxyCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "merkleRoot_",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "splitRecipients_",
        type: "string",
      },
    ],
    name: "createSplit",
    outputs: [
      {
        internalType: "address",
        name: "ourProxy",
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
    name: "pylon",
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
  "0x60a060405234801561001057600080fd5b506040516106f13803806106f183398101604081905261002f91610044565b60601b6001600160601b031916608052610072565b600060208284031215610055578081fd5b81516001600160a01b038116811461006b578182fd5b9392505050565b60805160601c61066261008f6000396000606701526106626000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632eb4a7ab1461004657806346847794146100625780635cd6fc40146100a1575b600080fd5b61004f60005481565b6040519081526020015b60405180910390f35b6100897f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b039091168152602001610059565b6100896100af3660046101e9565b6000838155604080516020810186905201604051602081830303815290604052805190602001206040516100e290610166565b8190604051809103906000f5905080158015610102573d6000803e3d6000fd5b5090506000805560008060008551602087016000865af1141561012457600080fd5b7ff6d2909e43c0a43861d485afb2afe249c4b52ab0ab1c7b825f63208b093246808133846040516101579392919061027c565b60405180910390a19392505050565b61032b8061030283390190565b600067ffffffffffffffff8084111561018e5761018e6102eb565b604051601f8501601f19908116603f011681019082821181831017156101b6576101b66102eb565b816040528093508581528686860111156101cf57600080fd5b858560208301376000602087830101525050509392505050565b6000806000606084860312156101fd578283fd5b83359250602084013567ffffffffffffffff8082111561021b578384fd5b818601915086601f83011261022e578384fd5b61023d87833560208501610173565b93506040860135915080821115610252578283fd5b508401601f81018613610263578182fd5b61027286823560208401610173565b9150509250925092565b600060018060a01b0380861683526020818616818501526060604085015284519150816060850152825b828110156102c2578581018201518582016080015281016102a6565b828111156102d35783608084870101525b5050601f01601f191691909101608001949350505050565b634e487b7160e01b600052604160045260246000fdfe608060405234801561001057600080fd5b50336001600160a01b031663468477946040518163ffffffff1660e01b8152600401602060405180830381600087803b15801561004c57600080fd5b505af1158015610060573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100849190610125565b600260006101000a8154816001600160a01b0302191690836001600160a01b03160217905550336001600160a01b0316632eb4a7ab6040518163ffffffff1660e01b8152600401602060405180830381600087803b1580156100e557600080fd5b505af11580156100f9573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061011d9190610153565b60005561016b565b600060208284031215610136578081fd5b81516001600160a01b038116811461014c578182fd5b9392505050565b600060208284031215610164578081fd5b5051919050565b6101b18061017a6000396000f3fe60806040526004361061004a5760003560e01c80632eb4a7ab146100855780633fc8cef3146100ae57806346847794146100ee57806381e580d31461010c578063ba0bafb41461012c575b600061005e6002546001600160a01b031690565b905060405136600082376000803683855af43d806000843e818015610081578184f35b8184fd5b34801561009157600080fd5b5061009b60005481565b6040519081526020015b60405180910390f35b3480156100ba57600080fd5b506100d673c778417e063141139fce010982780140aa0cd5ab81565b6040516001600160a01b0390911681526020016100a5565b3480156100fa57600080fd5b506002546001600160a01b03166100d6565b34801561011857600080fd5b5061009b610127366004610163565b610142565b34801561013857600080fd5b5061009b60015481565b6003818154811061015257600080fd5b600091825260209091200154905081565b600060208284031215610174578081fd5b503591905056fea26469706673582212201a245e4fd0099a4c9a9834e2037d054bcf83a1a47176f8ae2754c5946153341364736f6c63430008040033a2646970667358221220fbb10b88d11e8ab8562bd4b1ae8e8d55ad72d5939849c1c6cd06e571476f3d8564736f6c63430008040033";
