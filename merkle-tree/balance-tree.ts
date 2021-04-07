import MerkleTree from './merkle-tree'
import { BigNumber, utils } from 'ethers'

export default class BalanceTree {
  private readonly tree: MerkleTree
  constructor(balances: { account: string; allocation: BigNumber }[]) {
    this.tree = new MerkleTree(
      balances.map(({ account, allocation }, index) => {
        return BalanceTree.toNode(index, account, allocation)
      })
    )
  }

  public static verifyProof(
    index: number | BigNumber,
    account: string,
    allocation: BigNumber,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = BalanceTree.toNode(index, account, allocation)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  // keccak256(abi.encode(index, account, allocation))
  public static toNode(index: number | BigNumber, account: string, allocation: BigNumber): Buffer {
    return Buffer.from(
      utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, allocation]).substr(2),
      'hex'
    )
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  public getProof(index: number | BigNumber, account: string, allocation: BigNumber): string[] {
    return this.tree.getHexProof(BalanceTree.toNode(index, account, allocation))
  }
}