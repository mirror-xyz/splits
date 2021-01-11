//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

import "./interfaces/IMirrorPublicationV1.sol";
import "./lib/SafeMath.sol";

contract MirrorPublicationV1 is IMirrorPublicationV1 {
    using SafeMath for uint;

    /*
     * Construction and initialization properties
     *  - Only a "Mirror Publication Factory" can initialize the publication.
     */

    address private _factory;

    modifier onlyFactory() {
        require(isFactory(), "MirrorPublicationV1: caller is not the factory");
        _;
    }

    /*
     * Operation properties
     *  - Publications have an operator account that can manage contributors.
     */

    address private _operator;
  
    modifier onlyOperator() {
        require(isOperator(), "MirrorPublicationV1: caller is not the operator.");
        _;
    }

    /*
     * Contributor properties
     *  - Publications hold data about contributors.
     *  - Contributors can be added or disabled by the operator.
     */
    
    // Mapping of contributor address to their status.
    mapping (address => bool) private _contributors;
    // Events that allow clients to maintain a list of active contributors.
    event ContributorAdded (address account);
    event ContributorDisabled (address account);

    /*
     * Token properties
     *  - Publications can mint tokens.
     */

    string public override name;
    string public override symbol;
    uint8 public override decimals;
    uint public override totalSupply;
    mapping(address => uint) public override balanceOf;
    mapping(address => mapping(address => uint)) public override allowance;
    event Mint(address indexed to, uint256 amount);

    /*
     * Construction and initialization functionality
     *  - Only a "Mirror Publication Factory" can initialize the publication.
     */

    constructor() {
        _factory = msg.sender;
    }

    function initialize(
        address operator,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint8 tokenDecimals
    ) external override onlyFactory {
        _operator = operator;

        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
    }

    function factory() external override view returns (address) {
        return _factory;
    }

    function isFactory() public view returns (bool) {
        return msg.sender == _factory;
    }

    /*
        Operation Functionality
    */

    function operator() external override view returns (address) {
        return _operator;
    }

    function isOperator() public view returns (bool) {
        return msg.sender == _operator;
    }

    function disableContributor(address account) external override onlyOperator {
        _contributors[account] = false;
        emit ContributorDisabled(account);
    }

    function addContributor(address account) external override onlyOperator {
        _contributors[account] = true;
        emit ContributorAdded(account);
    }

    /*
        Token Functionality
    */

    function _mint(address to, uint256 amount) internal {
        totalSupply = totalSupply.add(amount);
        balanceOf[to] = balanceOf[to].add(amount);
        emit Mint(to, amount);
    }

    function _burn(address from, uint value) internal {
        balanceOf[from] = balanceOf[from].sub(value);
        totalSupply = totalSupply.sub(value);
        emit Transfer(from, address(0), value);
    }

    function _approve(address owner, address spender, uint value) private {
        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function _transfer(address from, address to, uint value) private {
        balanceOf[from] = balanceOf[from].sub(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(from, to, value);
    }

    function approve(address spender, uint value) external override returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint value) external override returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) external override returns (bool) {
        if (allowance[from][msg.sender] != uint(-1)) {
            allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
        }
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external override onlyOperator returns (bool) {
        _mint(to, amount);
        return true;
    }
}