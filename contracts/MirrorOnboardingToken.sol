pragma solidity 0.7.4;

import "../interfaces/IERC20.sol";
import "../interfaces/IENSManager.sol";

contract MirrorOnboardingToken is IERC20 {
    /*
        Token Information
    */
    string public constant name = 'Mirror Onboarding Token';
    string public constant symbol = 'MIRROR-1';

    uint8 public constant decimals = 6;
    uint public totalSupply;

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    /*
        Events
    */
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    event Redeemed(address addr);

    /*
        ENS Config
    */

    IENSManager internal constant _ENSManager = IENSManager(
        0x0 // TODO: add the manager address.
    );

    /**
     * @notice Burns 1 token, and registers the ENS subdomain.
     * @param _label ENS label of the new wallet, e.g. literature.
    */
    function redeem(
        string calldata _label
    ) {
        // First, burn one of the owner's tokens.
        _burn(msg.sender);

        // Then, register the domain for the user.
        _registerUserENS(msg.sender, _label);

        // Signal that the token has been redeemed.
        emit Redeemed(msg.sender);
    }

    /**
     * @notice A custom, private function to burn 1 token for a given address.
     * @param account address The account to burn the token from.
     */
    function _burn(address account) private {
        uint256 balancePriorToBurn = balanceOf[account];
        require(
            balancePriorToBurn > 0, "Must have a token balance."
        );

        // Decrement supply and account balance by 1 token.
        totalSupply = totalSupply.sub(1);
        balanceOf[account] = balancePriorToBurn - amount;

        // Emit an event signaling a transfer of 1 token to the null address.
        emit Transfer(account, address(0), 1);
    }

    /**
     * @notice Register an ENS subname to an address
     * @param _account The _account address.
     * @param _label ENS label of the new wallet (e.g. denis).
     */
    function _registerUserENS(address payable _account, string memory _label) internal {
        // claim reverse
        address ensResolver = IENSManager(ensManager).ensResolver();
        bytes memory methodData = abi.encodeWithSignature("claimWithResolver(address,address)", ensManager, ensResolver);
        address ensReverseRegistrar = IENSManager(ensManager).getENSReverseRegistrar();
        BaseWallet(_wallet).invoke(ensReverseRegistrar, 0, methodData);
        // register with ENS manager
        ENSManagerInterface(ensManager).register(_label, _account);
    }

    function approve(address spender, uint value) external returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) external returns (bool) {
        if (allowance[from][msg.sender] != uint(-1)) {
            allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
        }
        _transfer(from, to, value);
        return true;
    }

    function _mint(address to, uint value) internal {
        totalSupply = totalSupply.add(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(address(0), to, value);
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
}
