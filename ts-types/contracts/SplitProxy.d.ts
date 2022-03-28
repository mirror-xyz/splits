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
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface SplitProxyInterface extends ethers.utils.Interface {
  functions: {
    "balanceForWindow(uint256)": FunctionFragment;
    "currentWindow()": FunctionFragment;
    "merkleRoot()": FunctionFragment;
    "splitter()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "balanceForWindow",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "currentWindow",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "merkleRoot",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "splitter", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "balanceForWindow",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "currentWindow",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "merkleRoot", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "splitter", data: BytesLike): Result;

  events: {};
}

export class SplitProxy extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: SplitProxyInterface;

  functions: {
    balanceForWindow(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "balanceForWindow(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    currentWindow(overrides?: CallOverrides): Promise<[BigNumber]>;

    "currentWindow()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    merkleRoot(overrides?: CallOverrides): Promise<[string]>;

    "merkleRoot()"(overrides?: CallOverrides): Promise<[string]>;

    splitter(overrides?: CallOverrides): Promise<[string]>;

    "splitter()"(overrides?: CallOverrides): Promise<[string]>;
  };

  balanceForWindow(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "balanceForWindow(uint256)"(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  currentWindow(overrides?: CallOverrides): Promise<BigNumber>;

  "currentWindow()"(overrides?: CallOverrides): Promise<BigNumber>;

  merkleRoot(overrides?: CallOverrides): Promise<string>;

  "merkleRoot()"(overrides?: CallOverrides): Promise<string>;

  splitter(overrides?: CallOverrides): Promise<string>;

  "splitter()"(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    balanceForWindow(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "balanceForWindow(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    currentWindow(overrides?: CallOverrides): Promise<BigNumber>;

    "currentWindow()"(overrides?: CallOverrides): Promise<BigNumber>;

    merkleRoot(overrides?: CallOverrides): Promise<string>;

    "merkleRoot()"(overrides?: CallOverrides): Promise<string>;

    splitter(overrides?: CallOverrides): Promise<string>;

    "splitter()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    balanceForWindow(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "balanceForWindow(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    currentWindow(overrides?: CallOverrides): Promise<BigNumber>;

    "currentWindow()"(overrides?: CallOverrides): Promise<BigNumber>;

    merkleRoot(overrides?: CallOverrides): Promise<BigNumber>;

    "merkleRoot()"(overrides?: CallOverrides): Promise<BigNumber>;

    splitter(overrides?: CallOverrides): Promise<BigNumber>;

    "splitter()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    balanceForWindow(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "balanceForWindow(uint256)"(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    currentWindow(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "currentWindow()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    merkleRoot(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "merkleRoot()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    splitter(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "splitter()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}