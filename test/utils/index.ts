import { ethers } from "hardhat";

const {
    utils: {
        getAddress,
        keccak256,
        toUtf8Bytes
    }
} = ethers;

export function getCreate2Address(
    factoryAddress: string,
    label: string,
    bytecode: string
): string {
    const create2Inputs = [
        '0xff',
        factoryAddress,
        keccak256(toUtf8Bytes(label)),
        keccak256(bytecode)
    ];

    const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`;

    return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
}