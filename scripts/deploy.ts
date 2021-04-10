import { ethers, waffle } from "hardhat";
import fs from "fs";

const config = {
  mainnet: {
    WETH_ADDRESS: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  rinkeby: {
    WETH_ADDRESS: "0xc778417e063141139fce010982780140aa0cd5ab",
  },
  hardhat: {
    // Note: This won't integrate, but will allow us to test deploys.
    WETH_ADDRESS: "0xc778417e063141139fce010982780140aa0cd5ab",
  },
};

const NETWORK_MAP = {
  "0": "mainnet",
  "4": "rinkeby",
  "1337": "hardhat",
  "31337": "hardhat",
};

let isLocal = false;

async function main() {
  const chainId = (await waffle.provider.getNetwork()).chainId;
  const networkName = NETWORK_MAP[chainId];

  console.log(`Deploying to ${networkName}`);

  const { WETH_ADDRESS } = config[networkName];

  const Splitter = await ethers.getContractFactory("SplitterV4");
  const splitter = await Splitter.deploy();
  await splitter.deployed();

  const SplitFactory = await ethers.getContractFactory("SplitFactory");
  const splitFactory = await SplitFactory.deploy(
    splitter.address,
    WETH_ADDRESS
  );
  await splitFactory.deployed();

  const info = {
    Contracts: {
      Splitter: splitter.address,
      SplitFactory: splitFactory.address,
    },
  };

  console.log(info);

  if (!isLocal) {
    fs.writeFileSync(
      `${__dirname}/../networks/${networkName}.json`,
      JSON.stringify(info, null, 2)
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
