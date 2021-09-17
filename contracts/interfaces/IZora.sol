// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

/**
 * @title Interface for the entire Zora Protocol. Modified for OurMinter.sol
 * @author (s):
 * https://github.com/ourzora/
 *
 * @notice combination of Market, Media, and AuctionHouse contracts' interfaces.
 * @dev Some functions have been moved to more basic interfaces - eg IERCXXX.sol -
 * @dev to allow for the implementation of 'untrusted' universal functions in Minter.sol.
 * @dev They will work with Zora, with the additional benefit of working with other protocols.
 */
interface IZora {
    /**
     * @title Interface for Decimal
     */
    struct D256 {
        uint256 value;
    }

    /**
     * @title Interface for Zora Protocol's Media
     */
    struct EIP712Signature {
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct MediaData {
        // A valid URI of the content represented by this token
        string tokenURI;
        // A valid URI of the metadata associated with this token
        string metadataURI;
        // A SHA256 hash of the content pointed to by tokenURI
        bytes32 contentHash;
        // A SHA256 hash of the content pointed to by metadataURI
        bytes32 metadataHash;
    }

    event TokenURIUpdated(uint256 indexed _tokenId, address owner, string _uri);
    event TokenMetadataURIUpdated(
        uint256 indexed _tokenId,
        address owner,
        string _uri
    );

    // /**
    //  * @notice Return the metadata URI for a piece of media given the token URI
    //  */
    // function tokenMetadataURI(uint256 tokenId)
    //     external
    //     view
    //     returns (string memory);

    /**
     * @notice Mint new media for msg.sender.
     */
    function mint(MediaData calldata data, BidShares calldata bidShares)
        external;

    /**
     * @notice EIP-712 mintWithSig method. Mints new media for a creator given a valid signature.
     */
    function mintWithSig(
        address creator,
        MediaData calldata data,
        BidShares calldata bidShares,
        EIP712Signature calldata sig
    ) external;

    // /**
    //  * @notice Transfer the token with the given ID to a given address.
    //  * Save the previous owner before the transfer, in case there is a sell-on fee.
    //  * @dev This can only be called by the auction contract specified at deployment
    //  */
    // function auctionTransfer(uint256 tokenId, address recipient) external;

    // /**
    //  * @notice Revoke approval for a piece of media
    //  */
    // function revokeApproval(uint256 tokenId) external;

    /**
     * @notice Update the token URI
     */
    function updateTokenURI(uint256 tokenId, string calldata tokenURI) external;

    /**
     * @notice Update the token metadata uri
     */
    function updateTokenMetadataURI(
        uint256 tokenId,
        string calldata metadataURI
    ) external;

    /**
     * @notice EIP-712 permit method. Sets an approved spender given a valid signature.
     */
    function permit(
        address spender,
        uint256 tokenId,
        EIP712Signature calldata sig
    ) external;

    /**
     * @title Interface for Zora Protocol's Market
     */
    struct Bid {
        // Amount of the currency being bid
        uint256 amount;
        // Address to the ERC20 token being used to bid
        address currency;
        // Address of the bidder
        address bidder;
        // Address of the recipient
        address recipient;
        // % of the next sale to award the current owner
        D256 sellOnShare;
    }

    struct Ask {
        // Amount of the currency being asked
        uint256 amount;
        // Address to the ERC20 token being asked
        address currency;
    }

    struct BidShares {
        // % of sale value that goes to the _previous_ owner of the nft
        D256 prevOwner;
        // % of sale value that goes to the original creator of the nft
        D256 creator;
        // % of sale value that goes to the seller (current owner) of the nft
        D256 owner;
    }

    event BidCreated(uint256 indexed tokenId, Bid bid);
    event BidRemoved(uint256 indexed tokenId, Bid bid);
    event BidFinalized(uint256 indexed tokenId, Bid bid);
    event AskCreated(uint256 indexed tokenId, Ask ask);
    event AskRemoved(uint256 indexed tokenId, Ask ask);
    event BidShareUpdated(uint256 indexed tokenId, BidShares bidShares);

    // function bidForTokenBidder(uint256 tokenId, address bidder)
    //     external
    //     view
    //     returns (Bid memory);

    // function currentAskForToken(uint256 tokenId)
    //     external
    //     view
    //     returns (Ask memory);

    // function bidSharesForToken(uint256 tokenId)
    //     external
    //     view
    //     returns (BidShares memory);

    // function isValidBid(uint256 tokenId, uint256 bidAmount)
    //     external
    //     view
    //     returns (bool);

    // function isValidBidShares(BidShares calldata bidShares)
    //     external
    //     pure
    //     returns (bool);

    // function splitShare(D256 calldata sharePercentage, uint256 amount)
    //     external
    //     pure
    //     returns (uint256);

    // function configure(address mediaContractAddress) external;

    function setBidShares(uint256 tokenId, BidShares calldata bidShares)
        external;

    function setAsk(uint256 tokenId, Ask calldata ask) external;

    function removeAsk(uint256 tokenId) external;

    function setBid(
        uint256 tokenId,
        Bid calldata bid,
        address spender
    ) external;

    function removeBid(uint256 tokenId, address bidder) external;

    function acceptBid(uint256 tokenId, Bid calldata expectedBid) external;

    /**
     * @title Interface for Auction Houses
     */
    struct Auction {
        // ID for the ERC721 token
        uint256 tokenId;
        // Address for the ERC721 contract
        address tokenContract;
        // Whether or not the auction curator has approved the auction to start
        bool approved;
        // The current highest bid amount
        uint256 amount;
        // The length of time to run the auction for, after the first bid was made
        uint256 duration;
        // The time of the first bid
        uint256 firstBidTime;
        // The minimum price of the first bid
        uint256 reservePrice;
        // The sale percentage to send to the curator
        uint8 curatorFeePercentage;
        // The address that should receive the funds once the NFT is sold.
        address tokenOwner;
        // The address of the current highest bid
        address payable bidder;
        // The address of the auction's curator.
        // The curator can reject or approve an auction
        address payable curator;
        // The address of the ERC-20 currency to run the auction with.
        // If set to 0x0, the auction will be run in ETH
        address auctionCurrency;
    }

    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed tokenContract,
        uint256 duration,
        uint256 reservePrice,
        address tokenOwner,
        address curator,
        uint8 curatorFeePercentage,
        address auctionCurrency
    );

    event AuctionApprovalUpdated(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed tokenContract,
        bool approved
    );

    event AuctionReservePriceUpdated(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed tokenContract,
        uint256 reservePrice
    );

    event AuctionBid(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed tokenContract,
        address sender,
        uint256 value,
        bool firstBid,
        bool extended
    );

    event AuctionDurationExtended(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed tokenContract,
        uint256 duration
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed tokenContract,
        address tokenOwner,
        address curator,
        address winner,
        uint256 amount,
        uint256 curatorFee,
        address auctionCurrency
    );

    event AuctionCanceled(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed tokenContract,
        address tokenOwner
    );

    function createAuction(
        uint256 tokenId,
        address tokenContract,
        uint256 duration,
        uint256 reservePrice,
        address payable curator,
        uint8 curatorFeePercentage,
        address auctionCurrency
    ) external returns (uint256);

    function setAuctionApproval(uint256 auctionId, bool approved) external;

    function setAuctionReservePrice(uint256 auctionId, uint256 reservePrice)
        external;

    function createBid(uint256 auctionId, uint256 amount) external payable;

    function endAuction(uint256 auctionId) external;

    function cancelAuction(uint256 auctionId) external;
}
