# ⚠️

## THIS REPOSITORY IS A FORK OF **_MIRROR.XYZ_**'S IMPLEMENTATION OF SPLIT SMART CONTRACTS

### The contracts in this repository are not audited, and not even peer-reviewed in the slightest.

## **Do not consider them safe for mainnet.**

View the original README here: https://github.com/mirror-xyz/splits/blob/main/README.md

<br/>
`npm i`
<br/>
`npm run test`
<br/>
https://discord.gg/GmmaBszDTK is the discord if you need help
---

# our-contracts

## The general **_idea_** here is that the SplitProxy now has a logic switch in its fallback().

Previously the fallback routed calls to the splitter with a DELEGATECALL.
Now the SplitProxy is Ownable. If the owner triggers fallback(), the call is now routed here.
Anyone but the owner - and it will behave the same as before.

Basically a SplitProxy can be the Creator of an NFT now. And receive royalties.
Or be a Curator, and approve Auction House proposals. Or start a crowdfund or PartyDAO.
Or whatever else you can think of, it just needs to be implemented in OurMinter.

<br/>

### A Zora NFT minted by a Split on Rinkeby:

https://www.ourz.network/nft/3689

& another: https://www.ourz.network/nft/3699

### The transaction that created the Split

https://rinkeby.etherscan.io/tx/0x71115ed05464a126d992fe51f4c55c93c410269317b2752161e11b2e29303ef8
https://dashboard.tenderly.co/tx/rinkeby/0x71115ed05464a126d992fe51f4c55c93c410269317b2752161e11b2e29303ef8

### The transaction that minted the NFT and sent it to Auction

https://rinkeby.etherscan.io/tx/0x385d3231135799c4be7364ef50eb4e08dd610e4df9e77a8e8d3b07f7a9e63382
https://dashboard.tenderly.co/tx/rinkeby/0x385d3231135799c4be7364ef50eb4e08dd610e4df9e77a8e8d3b07f7a9e63382

<br/>
Subgraph: https://thegraph.com/legacy-explorer/subgraph/nickadamson/ourzrinkebyv1?query=Example%20query

## Changes:

-   hardcode contract addresses where applicable to save gas
-   implement IERC721-Receiver on SplitProxy
-   add 'Ownable' to SplitProxy
    -   this allows the contract to have a switch in its fallback()
    -   depending on the address of msg.sender, the fallback will go to splitter or minter
-   add OurMinter.sol
    -   Basically lets a SplitProxy do things like mint a Zora NFT, be a curator, etc.
-   Revise Tests
    -   checks that 'owner' of SplitProxy is the EOA that called Proxy creation
    -   gas costs are more expensive for deploying logic contracts
    -   0.5 eth test fails but larger denominations do not
-   gas cost for creation of the OurProxy is around 2.5x the cost of the original SplitProxy.
    -   this can be reduced further if you remove the setApproval calls in constructor, or some of the access

# Critiques, ideas, and any other feedback are greatly appreciated. Open an issue, or email me: nickadamson@pm.me
