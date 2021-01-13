/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface ResolverInterface extends ethers.utils.Interface {
  functions: {
    "setName(bytes32,string)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "setName",
    values: [BytesLike, string]
  ): string;

  decodeFunctionResult(functionFragment: "setName", data: BytesLike): Result;

  events: {};
}

export class Resolver extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: ResolverInterface;

  functions: {
    setName(
      node: BytesLike,
      name: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "setName(bytes32,string)"(
      node: BytesLike,
      name: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  setName(
    node: BytesLike,
    name: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "setName(bytes32,string)"(
    node: BytesLike,
    name: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    setName(
      node: BytesLike,
      name: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "setName(bytes32,string)"(
      node: BytesLike,
      name: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    setName(
      node: BytesLike,
      name: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "setName(bytes32,string)"(
      node: BytesLike,
      name: string,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    setName(
      node: BytesLike,
      name: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "setName(bytes32,string)"(
      node: BytesLike,
      name: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}
