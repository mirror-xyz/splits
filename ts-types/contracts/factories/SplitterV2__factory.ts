/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { SplitterV2 } from "../SplitterV2";

export class SplitterV2__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(wethAddress_: string, overrides?: Overrides): Promise<SplitterV2> {
    return super.deploy(wethAddress_, overrides || {}) as Promise<SplitterV2>;
  }
  getDeployTransaction(
    wethAddress_: string,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(wethAddress_, overrides || {});
  }
  attach(address: string): SplitterV2 {
    return super.attach(address) as SplitterV2;
  }
  connect(signer: Signer): SplitterV2__factory {
    return super.connect(signer) as SplitterV2__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SplitterV2 {
    return new Contract(address, _abi, signerOrProvider) as SplitterV2;
  }
}

const _abi = [
  {
    inputs: [
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "percent",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    name: "TransferETH",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "percent",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    name: "TransferToken",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint32",
        name: "percent",
        type: "uint32",
      },
    ],
    name: "amountFromPercent",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint32[]",
        name: "percentages",
        type: "uint32[]",
      },
    ],
    name: "encodeAllocation",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint32[]",
        name: "percentages",
        type: "uint32[]",
      },
    ],
    name: "executeETHSplit",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "allocationDigest_",
        type: "bytes32",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint32[]",
        name: "percentages",
        type: "uint32[]",
      },
    ],
    name: "validateAllocation",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
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
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const _bytecode =
  "0x60a060405234801561001057600080fd5b506040516109c03803806109c083398101604081905261002f91610044565b60601b6001600160601b031916608052610072565b600060208284031215610055578081fd5b81516001600160a01b038116811461006b578182fd5b9392505050565b60805160601c61092361009d6000396000818160dc015281816104b0015261057801526109236000f3fe6080604052600436106100695760003560e01c80637965ff9b116100435780637965ff9b146101235780639498bd7114610151578063fa81bb751461017357610070565b806312913953146100755780634b99ae73146100aa5780634f0e0ef3146100ca57610070565b3661007057005b600080fd5b34801561008157600080fd5b50610095610090366004610710565b610193565b60405190151581526020015b60405180910390f35b3480156100b657600080fd5b506100956100c5366004610710565b6101ae565b3480156100d657600080fd5b506100fe7f000000000000000000000000000000000000000000000000000000000000000081565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020016100a1565b34801561012f57600080fd5b5061014361013e3660046107b8565b6103c9565b6040519081526020016100a1565b34801561015d57600080fd5b5061017161016c3660046107a0565b6103f0565b005b34801561017f57600080fd5b5061014361018e366004610710565b610462565b60006101a185858585610462565b6001541495945050505050565b60006101bc85858585610193565b610227576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601560248201527f416c6c6f636174696f6e20697320696e76616c6964000000000000000000000060448201526064015b60405180910390fd5b5060014760005b858110156103bf5760006102ae88888481811061025b57634e487b7160e01b600052603260045260246000fd5b905060200201602081019061027091906106f6565b6102a98589898781811061029457634e487b7160e01b600052603260045260246000fd5b905060200201602081019061013e91906107e3565b61049b565b9050806102ba57600093505b7f85969c922fcef8a96679d163ec89951fce72dc20ee08befdee0768e06e36944f8888848181106102fb57634e487b7160e01b600052603260045260246000fd5b905060200201602081019061031091906106f6565b6103348589898781811061029457634e487b7160e01b600052603260045260246000fd5b88888681811061035457634e487b7160e01b600052603260045260246000fd5b905060200201602081019061036991906107e3565b6040805173ffffffffffffffffffffffffffffffffffffffff9094168452602084019290925263ffffffff1690820152821515606082015260800160405180910390a150806103b7816108bc565b91505061022e565b5050949350505050565b600060646103dd63ffffffff84168561089d565b6103e7919061087d565b90505b92915050565b60005460ff161561045d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601c60248201527f53706c697474657220616c726561647920696e697469616c697a656400000000604482015260640161021e565b600155565b60008282868660405160200161047b94939291906107fd565b604051602081830303815290604052805190602001209050949350505050565b60006104a783836105ff565b9050806103ea577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663d0e30db0836040518263ffffffff1660e01b81526004016000604051808303818588803b15801561051657600080fd5b505af115801561052a573d6000803e3d6000fd5b50506040517fa9059cbb00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8781166004830152602482018790527f000000000000000000000000000000000000000000000000000000000000000016935063a9059cbb92506044019050602060405180830381600087803b1580156105c057600080fd5b505af11580156105d4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105f89190610779565b5092915050565b6000808373ffffffffffffffffffffffffffffffffffffffff168361753090604051600060405180830381858888f193505050503d806000811461065f576040519150601f19603f3d011682016040523d82523d6000602084013e610664565b606091505b509095945050505050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461069357600080fd5b919050565b60008083601f8401126106a9578182fd5b50813567ffffffffffffffff8111156106c0578182fd5b6020830191508360208260051b85010111156106db57600080fd5b9250929050565b803563ffffffff8116811461069357600080fd5b600060208284031215610707578081fd5b6103e78261066f565b60008060008060408587031215610725578283fd5b843567ffffffffffffffff8082111561073c578485fd5b61074888838901610698565b90965094506020870135915080821115610760578384fd5b5061076d87828801610698565b95989497509550505050565b60006020828403121561078a578081fd5b81518015158114610799578182fd5b9392505050565b6000602082840312156107b1578081fd5b5035919050565b600080604083850312156107ca578182fd5b823591506107da602084016106e2565b90509250929050565b6000602082840312156107f4578081fd5b6103e7826106e2565b60008186825b8781101561082f5763ffffffff610819836106e2565b1683526020928301929190910190600101610803565b5085919050825b858110156108715773ffffffffffffffffffffffffffffffffffffffff61085c8461066f565b16825260209283019290910190600101610836565b50979650505050505050565b60008261089857634e487b7160e01b81526012600452602481fd5b500490565b60008160001904831182151516156108b7576108b76108d7565b500290565b60006000198214156108d0576108d06108d7565b5060010190565b634e487b7160e01b600052601160045260246000fdfea26469706673582212207f70caecb30ad79e5824949a15274e4f63a57b9d1b3d7e127851db0d1bc74eae64736f6c63430008030033";