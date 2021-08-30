// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import { OurStorage } from "./OurStorage.sol";
import { OurManagement } from "./OurManagement.sol";
import { OurIntrospector } from "./OurIntrospector.sol";

contract OurPylon is 
  OurStorage, 
  OurManagement,
  OurIntrospector 
{
  event ProxySetup(address indexed initiator, address[] owners, uint256 threshold, address initializer, address fallbackHandler);
  event ExecutionFailure(bytes32 txHash, uint256 payment);
  event ExecutionSuccess(bytes32 txHash, uint256 payment);

  // This constructor ensures that this contract cannot be modified
  constructor() {
    threshold = 1;
  }

  /// @dev Setup function sets initial storage of contract.
  /// @param owners_ List of addresses that can execute transactions other than claiming funds.
  /// @param splitter_ Contract address that handles fallbacks for anyone other than owners.
  function setup(
      address[] calldata owners_,
      address splitter_
  ) external {
      // setupOwners checks if the Threshold is already set, therefore preventing that this method is called twice
      setupOwners(_owners);
      splitter = splitter_;

      emit ProxySetup(msg.sender, _owners, _threshold, to, fallbackHandler);
  }

  /// @dev Allows to execute a Safe transaction confirmed by required number of owners and then pays the account that submitted the transaction.
  ///      Note: The fees are always transferred, even if the user transaction fails.
  /// @param to Destination address of Safe transaction.
  /// @param value Ether value of Safe transaction.
  /// @param data Data payload of Safe transaction.
  /// @param operation Operation type of Safe transaction.
  /// @param safeTxGas Gas that should be used for the Safe transaction.
  /// @param baseGas Gas costs that are independent of the transaction execution(e.g. base transaction fee, signature check, payment of the refund)
  /// @param gasPrice Gas price that should be used for the payment calculation.
  /// @param gasToken Token address (or 0 if ETH) that is used for the payment.
  /// @param refundReceiver Address of receiver of gas payment (or 0 if tx.origin).
  /// @param signatures Packed signature data ({bytes32 r}{bytes32 s}{uint8 v})
  function execTransaction(
      address to,
      uint256 value,
      bytes calldata data,
      Enum.Operation operation,
      uint256 safeTxGas,
      uint256 baseGas,
      uint256 gasPrice,
      address gasToken,
      address payable refundReceiver,
      bytes memory signatures
  ) public payable virtual returns (bool success) {
      bytes32 txHash;
      // Use scope here to limit variable lifetime and prevent `stack too deep` errors
      {
          bytes memory txHashData =
              encodeTransactionData(
                  // Transaction info
                  to,
                  value,
                  data,
                  operation,
                  safeTxGas,
                  // Payment info
                  baseGas,
                  gasPrice,
                  gasToken,
                  refundReceiver,
                  // Signature info
                  nonce
              );
          // Increase nonce and execute transaction.
          nonce++;
          txHash = keccak256(txHashData);
          checkSignatures(txHash, txHashData, signatures);
      }
      address guard = getGuard();
      {
          if (guard != address(0)) {
              Guard(guard).checkTransaction(
                  // Transaction info
                  to,
                  value,
                  data,
                  operation,
                  safeTxGas,
                  // Payment info
                  baseGas,
                  gasPrice,
                  gasToken,
                  refundReceiver,
                  // Signature info
                  signatures,
                  msg.sender
              );
          }
      }
      // We require some gas to emit the events (at least 2500) after the execution and some to perform code until the execution (500)
      // We also include the 1/64 in the check that is not send along with a call to counteract potential shortings because of EIP-150
      require(gasleft() >= ((safeTxGas * 64) / 63).max(safeTxGas + 2500) + 500, "GS010");
      // Use scope here to limit variable lifetime and prevent `stack too deep` errors
      {
          uint256 gasUsed = gasleft();
          // If the gasPrice is 0 we assume that nearly all available gas can be used (it is always more than safeTxGas)
          // We only substract 2500 (compared to the 3000 before) to ensure that the amount passed is still higher than safeTxGas
          success = execute(to, value, data, operation, gasPrice == 0 ? (gasleft() - 2500) : safeTxGas);
          gasUsed = gasUsed.sub(gasleft());
          // If no safeTxGas and no gasPrice was set (e.g. both are 0), then the internal tx is required to be successful
          // This makes it possible to use `estimateGas` without issues, as it searches for the minimum gas where the tx doesn't revert
          require(success || safeTxGas != 0 || gasPrice != 0, "GS013");
          // We transfer the calculated tx costs to the tx.origin to avoid sending it to intermediate contracts that have made calls
          uint256 payment = 0;
          if (gasPrice > 0) {
              payment = handlePayment(gasUsed, baseGas, gasPrice, gasToken, refundReceiver);
          }
          if (success) emit ExecutionSuccess(txHash, payment);
          else emit ExecutionFailure(txHash, payment);
      }
      {
          if (guard != address(0)) {
              Guard(guard).checkAfterExecution(txHash, success);
          }
      }
  }
    // don't actually want this.
//   function execute(
//         address to,
//         uint256 value,
//         bytes memory data,
//         Enum.Operation operation,
//         uint256 txGas
//     ) internal returns (bool success) {
//         if (operation == Enum.Operation.DelegateCall) {
//             // solhint-disable-next-line no-inline-assembly
//             assembly {
//                 success := delegatecall(txGas, to, add(data, 0x20), mload(data), 0, 0)
//             }
//         } else {
//             // solhint-disable-next-line no-inline-assembly
//             assembly {
//                 success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
//             }
//         }
//     }
    
  function handlePayment(
      uint256 gasUsed,
      uint256 baseGas,
      uint256 gasPrice,
      address gasToken,
      address payable refundReceiver
  ) private returns (uint256 payment) {
      // solhint-disable-next-line avoid-tx-origin
      address payable receiver = refundReceiver == address(0) ? payable(tx.origin) : refundReceiver;
      if (gasToken == address(0)) {
          // For ETH we will only adjust the gas price to not be higher than the actual used gas price
          payment = gasUsed.add(baseGas).mul(gasPrice < tx.gasprice ? gasPrice : tx.gasprice);
          require(receiver.send(payment), "GS011");
      } else {
          payment = gasUsed.add(baseGas).mul(gasPrice);
          require(transferToken(gasToken, receiver, payment), "GS012");
      }
  }

      /// @dev Transfers a token and returns if it was a success
    /// @param token Token that should be transferred
    /// @param receiver Receiver to whom the token should be transferred
    /// @param amount The amount of tokens that should be transferred
    function transferToken(
        address token,
        address receiver,
        uint256 amount
    ) internal returns (bool transferred) {
        // 0xa9059cbb - keccack("transfer(address,uint256)")
        bytes memory data = abi.encodeWithSelector(0xa9059cbb, receiver, amount);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // We write the return value to scratch space.
            // See https://docs.soliditylang.org/en/v0.7.6/internals/layout_in_memory.html#layout-in-memory
            let success := call(sub(gas(), 10000), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            switch returndatasize()
                case 0 {
                    transferred := success
                }
                case 0x20 {
                    transferred := iszero(or(iszero(success), iszero(mload(0))))
                }
                default {
                    transferred := 0
                }
        }
    }
}