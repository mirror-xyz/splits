// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

/**
 * @title Interface for PartyDAO
 * @author (s):
 * https://github.com/PartyDAO/
 *
 * @dev I have yet to personally use PartyBid. DO NOT USE IN PRODUCTION.
 */
interface IPartyBid {
    //======== Deploy function =========
    function startParty(
        address _marketWrapper,
        address _nftContract,
        uint256 _tokenId,
        uint256 _auctionId,
        string memory _name,
        string memory _symbol
    ) external returns (address partyBidProxy);

    // ======== External: Contribute =========
    /**
     * @notice Contribute to the PartyBid's treasury
     * while the auction is still open
     * @dev Emits a Contributed event upon success; callable by anyone
     */
    function contribute() external payable;

    // ======== External: Bid =========
    /**
     * @notice Submit a bid to the Market
     * @dev Reverts if insufficient funds to place the bid and pay PartyDAO fees,
     * or if any external auction checks fail (including if PartyBid is current high bidder)
     * Emits a Bid event upon success.
     * Callable by any contributor
     */
    function bid() external;

    // ======== External: Finalize =========
    /**
     * @notice Finalize the state of the auction
     * @dev Emits a Finalized event upon success; callable by anyone
     */
    function finalize() external;

    // ======== External: Claim =========
    /**
     * @notice Claim the tokens and excess ETH owed
     * to a single contributor after the auction has ended
     * @dev Emits a Claimed event upon success
     * callable by anyone (doesn't have to be the contributor)
     * @param _contributor the address of the contributor
     */
    function claim(address _contributor) external;
}
