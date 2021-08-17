// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

/**
 * @title Minimal Interface for the entire MirrorXYZ Protocol
 * @author (s):
 * https://github.com/mirror-xyz/
 *
 * @notice combination of Editions, ReserveAuctionV3, and AuctionHouse contracts' interfaces.
 * @dev I don't have an account with Mirror, yet, nor any experience. DO NOT USE IN PRODUCTION.
 */

interface IMirror {
    /**
     * @notice Interface for the Reserve Auction contract
     */
    function createAuction(
        uint256 tokenId,
        uint256 duration,
        uint256 reservePrice,
        address creator,
        address payable creatorShareRecipient
    ) external;

    function createBid(uint256 tokenId) external payable;

    function endAuction(uint256 tokenId) external;

    function updateMinBid(uint256 _minBid) external;

    /**
     * @notice Interface for the Editions contract
     */
    function createEdition(
        // The number of tokens that can be minted and sold.
        uint256 quantity,
        // The price to purchase a token.
        uint256 price,
        // The account that should receive the revenue.
        address payable fundingRecipient
    ) external;

    function buyEdition(uint256 editionId) external payable;

    function withdrawFunds(uint256 editionId) external;

    /**
     * @notice Interface for the Crowdfund contracts
     */
    function createCrowdfund(
        string calldata name_,
        string calldata symbol_,
        address payable operator_,
        address payable fundingRecipient_,
        uint256 fundingCap_,
        uint256 operatorPercent_
    ) external returns (address crowdfundProxy);

    function closeFunding() external;
}
