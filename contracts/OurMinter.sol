// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

/// @us The Future Is Ourz

import { OurManagement } from "./OurManagement.sol";
import { IZora } from "./interfaces/IZora.sol";
import { IMirror } from "./interfaces/IMirror.sol";
import { IPartyBid } from "./interfaces/IPartyBid.sol";
import { IERC721 } from "./interfaces/IERC721.sol";
import { IERC20 } from "./interfaces/IERC20.sol";

/**
 * @title OurMinter
 * @author Nick Adamson - nickadamson@pm.me
 * 
 * Building on the work from:
 * @author Mirror       @title Splits   https://github.com/mirror-xyz/splits
 * @author Gnosis       @title Safe     https://github.com/gnosis/safe-contracts
 * & of course, @author OpenZeppelin
 *
 * @notice Some functions are marked as 'untrusted'Function. Use caution when interacting
 * with these, as any contracts you supply could be potentially unsafe.
 * 'Trusted' functions on the other hand -- implied by the absence of 'untrusted' --
 * are hardcoded to use the Zora Protocol/MirrorXYZ/PartyDAO addresses.
 * https://consensys.github.io/smart-contract-best-practices/recommendations/#mark-untrusted-contracts
 */
contract OurMinter is OurManagement {
    /// @notice RINKEBY ADDRESSES
    address public constant _zoraMedia = 0x7C2668BD0D3c050703CEcC956C11Bd520c26f7d4;
    address public constant _zoraMarket = 0x85e946e1Bd35EC91044Dc83A5DdAB2B6A262ffA6;
    address public constant _zoraAH = 0xE7dd1252f50B3d845590Da0c5eADd985049a03ce;
    address public constant _mirrorAH = 0x2D5c022fd4F81323bbD1Cc0Ec6959EC8CC1C5A11;
    address public constant _mirrorCrowdfund = 0xeac226B370D77f436b5780b4DD4A49E59e8bEA37;
    address public constant _mirrorEditions = 0xa8b8F7cC0C64c178ddCD904122844CBad0021647;
    address public constant _partyBid = 0xB725682D5AdadF8dfD657f8e7728744C0835ECd9;
    address public constant _weth = 0xc778417E063141139Fce010982780140Aa0cD5Ab;

    /**======== IZora =========
     * @notice Various functions allowing a Split to interact with Zora Protocol
     * @dev see IZora.sol
     * Starts with metatransactions for QoL, followed by single tx
     * implementations of Zora's contracts. Media -> Market -> AH
     */

    /** QoL
     * @notice Approve the splitOwner and Zora Auction House to manage Split's ERC-721s
     * @dev Called in Proxy's Constructor, hence internal
     */

    function setupApprovalForAH() internal {
        IERC721(_zoraMedia).setApprovalForAll(_zoraAH, true);
    }

    /** QoL
     * @notice Mints a Zora NFT with this Split as the Creator,
     * and then list it on AuctionHouse for ETH
     */
    function mintToAuctionForETH(
        IZora.MediaData calldata mediaData,
        IZora.BidShares calldata bidShares,
        uint256 duration,
        uint256 reservePrice
    ) external onlyOwners {
        IZora(_zoraMedia).mint(mediaData, bidShares);
        uint256 index = IERC721(_zoraMedia).totalSupply() - 1;
        uint256 tokenId_ = IERC721(_zoraMedia).tokenByIndex(index);
        IZora(_zoraAH).createAuction(
            tokenId_,
            _zoraMedia,
            duration,
            reservePrice,
            payable(address(this)),
            0,
            address(0)
        );
    }

    /** Media
     * @notice Mint new Zora NFT for Split Contract.
     */
    function mintZora(IZora.MediaData calldata mediaData, IZora.BidShares calldata bidShares)
        external
        onlyOwners
    {
        IZora(_zoraMedia).mint(mediaData, bidShares);
    }

    /** Media
     * @notice EIP-712 mintWithSig. Mints new new Zora NFT for a creator on behalf of split contract.
     */
    function mintZoraWithSig(
        address creator,
        IZora.MediaData calldata mediaData,
        IZora.BidShares calldata bidShares,
        IZora.EIP712Signature calldata sig
    ) external onlyOwners {
        IZora(_zoraMedia).mintWithSig(creator, mediaData, bidShares, sig);
    }

    /** Media
     * @notice Update the token URIs for a Zora NFT owned by Split Contract
     */
    function updateZoraMediaURIs(
        uint256 tokenId,
        string calldata tokenURI,
        string calldata metadataURI
    ) external onlyOwners {
        IZora(_zoraMedia).updateTokenURI(tokenId, tokenURI);
        IZora(_zoraMedia).updateTokenMetadataURI(tokenId, metadataURI);
    }

    /** Media
     * @notice Update the token URI
     */
    function updateZoraMediaTokenURI(uint256 tokenId, string calldata tokenURI) external onlyOwners {
        IZora(_zoraMedia).updateTokenURI(tokenId, tokenURI);
    }

    /** Media
     * @notice Update the token metadata uri
     */
    function updateZoraMediaMetadataURI(uint256 tokenId, string calldata metadataURI) external {
        IZora(_zoraMedia).updateTokenMetadataURI(tokenId, metadataURI);
    }

    /** Market
     * @notice Update zora/core/market bidShares (NOT zora/auctionHouse)
     */
    function setZoraMarketBidShares(uint256 tokenId, IZora.BidShares calldata bidShares) external {
        IZora(_zoraMarket).setBidShares(tokenId, bidShares);
    }

    /** Market
     * @notice Update zora/core/market ask
     */
    function setZoraMarketAsk(uint256 tokenId, IZora.Ask calldata ask) external onlyOwners {
        IZora(_zoraMarket).setAsk(tokenId, ask);
    }

    /** Market
     * @notice Remove zora/core/market ask
     */
    function removeZoraMarketAsk(uint256 tokenId) external onlyOwners {
        IZora(_zoraMarket).removeAsk(tokenId);
    }

    /** Market
     * @notice Set zora/core/market bid (NOT zora/auctionHouse)
     */
    function setZoraMarketBid(
        uint256 tokenId,
        IZora.Bid calldata bid,
        address spender
    ) external onlyOwners {
        IZora(_zoraMarket).setBid(tokenId, bid, spender);
    }

    /** Market
     * @notice Remove zora/core/market bid (NOT zora/auctionHouse)
     */
    function removeZoraMarketBid(uint256 tokenId, address bidder) external onlyOwners {
        IZora(_zoraMarket).removeBid(tokenId, bidder);
    }

    /** Market
     * @notice Accept zora/core/market bid
     */
    function acceptZoraMarketBid(uint256 tokenId, IZora.Bid calldata expectedBid) external onlyOwners {
        IZora(_zoraMarket).acceptBid(tokenId, expectedBid);
    }

    /** AuctionHouse
     * @notice Create auction on Zora's AuctionHouse for an owned/approved NFT
     * @dev requires currency ETH or WETH
     */
    function createZoraAuction(
        uint256 tokenId,
        address tokenContract,
        uint256 duration,
        uint256 reservePrice,
        address payable curator,
        uint8 curatorFeePercentage,
        address auctionCurrency
    ) external onlyOwners {
        require(auctionCurrency == address(0) || auctionCurrency == _weth);
        IZora(_zoraAH).createAuction(
            tokenId,
            tokenContract,
            duration,
            reservePrice,
            curator,
            curatorFeePercentage,
            auctionCurrency
        );
    }

    /** AuctionHouse
     * @notice SPLITS DO NOT SUPPORT ERC20. MUST BE HANDLED MANUALLY.
     * NOTE: Marked as >> unsafe << as FUNDS WILL NOT BE SPLIT.
     * @dev Provided as option in case you know what you're doing.
     */
    function unsafeCreateZoraAuction(
        uint256 tokenId,
        address tokenContract,
        uint256 duration,
        uint256 reservePrice,
        address payable curator,
        uint8 curatorFeePercentage,
        address auctionCurrency
    ) external onlyOwners {
        IZora(_zoraAH).createAuction(
            tokenId,
            tokenContract,
            duration,
            reservePrice,
            curator,
            curatorFeePercentage,
            auctionCurrency
        );
    }

    /** AuctionHouse
     * @notice Approve Auction; aka Split Contract is now the Curator
     */
    function setZoraAuctionApproval(uint256 auctionId, bool approved) external onlyOwners {
        IZora(_zoraAH).setAuctionApproval(auctionId, approved);
    }

    /** AuctionHouse
     * @notice Set Auction's reserve price
     */
    function setZoraAuctionReservePrice(uint256 auctionId, uint256 reservePrice) external onlyOwners {
        IZora(_zoraAH).setAuctionReservePrice(auctionId, reservePrice);
    }

    /** AuctionHouse
     * @notice Cancel an Auction before any bids have been placed
     */
    function cancelZoraAuction(uint256 auctionId) external onlyOwners {
        IZora(_zoraAH).cancelAuction(auctionId);
    }
    //======== /IZora =========

    /**======== IMirror =========
     * @notice Various functions allowing a Split to interact with MirrorXYZ
     * @dev see IMirror.sol
     */
    /** ReserveAuctionV3
     * @notice Create Reserve Auction
     */
    function createMirrorAuction(
        uint256 tokenId,
        uint256 duration,
        uint256 reservePrice,
        address creator,
        address payable creatorShareRecipient
    ) external onlyOwners {
        IMirror(_mirrorAH).createAuction(tokenId, duration, reservePrice, creator, creatorShareRecipient);
    }

    /** ReserveAuctionV3
     * @notice Update Minimum Bid on Reserve Auction
     */
    function updateMirrorMinBid(uint256 minBid) external onlyOwners {
        IMirror(_mirrorAH).updateMinBid(minBid);
    }

    /** Editions
     * @notice Create an Edition
     */
    function createMirrorEdition(
        uint256 quantity,
        uint256 price,
        address payable fundingRecipient
    ) external onlyOwners {
        IMirror(_mirrorEditions).createEdition(quantity, price, fundingRecipient);
    }

    /** Editions
     * @notice Withdraw funds from Edition
     */
    function withdrawEditionFunds(uint256 editionId) external onlyOwners {
        IMirror(_mirrorEditions).withdrawFunds(editionId);
    }

    /** Crowdfund
     * @notice Create a Crowdfund
     */
    function createMirrorCrowdfund(
        string calldata name,
        string calldata symbol,
        address payable operator,
        address payable fundingRecipient,
        uint256 fundingCap,
        uint256 operatorPercent
    ) external onlyOwners {
        IMirror(_mirrorCrowdfund).createCrowdfund(
            name,
            symbol,
            operator,
            fundingRecipient,
            fundingCap,
            operatorPercent
        );
    }

    /** Crowdfund
     * @notice Marked as >> untrusted << Use caution when supplying crowdfundProxy_
     * @dev Close Funding period for Crowdfund
     */
    function untrustedCloseCrowdFunding(address crowdfundProxy_) external onlyOwners {
        IMirror(crowdfundProxy_).closeFunding();
    }
    //======== /IMirror =========

    /**======== IPartyBid =========
     * @notice Various functions allowing a Split to interact with PartyDAO
     * @dev see IPartyBid.sol
     */
    /** PartyBid
     * @notice Starts a Party Bid
     */
    function startSplitParty(
        address marketWrapper,
        address nftContract,
        uint256 tokenId,
        uint256 auctionId,
        string memory name,
        string memory symbol
    ) external onlyOwners {
        IPartyBid(_partyBid).startParty(marketWrapper, nftContract, tokenId, auctionId, name, symbol);
    }
    //======== /IPartyBid =========

    /**======== IERC721 =========
     * NOTE: Althought OurMinter.sol is generally implemented to work with Zora (or Mirror),
     * the functions below allow a Split to work with any ERC-721 spec'd platform
     * @dev see IERC721.sol
     */

    /**
     * NOTE: Marked as >> untrusted << Use caution when supplying tokenContract_
     * this should be changed if you know you will be using a different protocol.
     * @dev mint non-Zora ERC721 with one parameter, eg Foundation.app. See IERC721.sol
     * @dev mint(string contentURI/IPFSHash || address to_ || etc...)
     */
    //   function untrustedMint721(address tokenContract_, string contentURI_ || address to_ || etc...)
    //       external
    //   {
    //       IERC721(tokenContract_).mint(contentURI_ || address to_ || etc...);
    //   }

    /**
     * NOTE: Marked as >> untrusted << Use caution when supplying tokenContract_
     * @dev In case non-Zora ERC721 gets stuck in Account.
     * @notice safeTransferFrom(address from, address to, uint256 tokenId)
     */
    function untrustedSafeTransfer721(
        address tokenContract_,
        address newOwner_,
        uint256 tokenId_
    ) external onlyOwners {
        IERC721(tokenContract_).safeTransferFrom(address(msg.sender), newOwner_, tokenId_);
    }



    /**
     * NOTE: Marked as >> untrusted << Use caution when supplying tokenContract_
     * @dev sets approvals for non-Zora ERC721 contract
     * @notice setApprovalForAll(address operator, bool approved)
     */
    function untrustedSetApproval721(
        address tokenContract_,
        address operator_,
        bool approved_
    ) external onlyOwners {
        IERC721(tokenContract_).setApprovalForAll(operator_, approved_);
    }

    /**
     * NOTE: Marked as >> untrusted << Use caution when supplying tokenContract_
     * @dev burns non-Zora ERC721 that Split contract owns/isApproved
     * @notice setApprovalForAll(address operator, bool approved)
     */
    function untrustedBurn721(address tokenContract_, uint256 tokenId_) external onlyOwners {
        IERC721(tokenContract_).burn(tokenId_);
    }
    //======== /IERC721 =========
}
