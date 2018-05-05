pragma solidity ^0.4.21;

import "./EIP20Interface.sol";
import "../Math/SafeMath.sol";

contract JournalToken is EIP20Interface {

    using SafeMath for uint256;

    uint256 constant private MAX_UINT256 = 2**256 - 1;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed; 
    
    string public name;                     // Token name
    uint8 public decimals;                  // How many decimals to show.
    string public symbol;                   // Token unit
    address public master;                  
    uint256 constant public rate = 1000;    // The ratio of our token to Ether

    event BuyToken(
        uint256 msgValue,
        uint256 amount,
        uint256 totalSupply,
        address msgSender,
        uint8 decimals,
        string symbol
    );    

    function JournalToken(
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol
    ) public {
        balances[msg.sender] = _initialAmount;                // Give the creator all initial tokens
        totalSupply = _initialAmount;                         // Update total supply
        name = _tokenName;                                    // Set the name for display purposes
        decimals = _decimalUnits;                             // Amount of decimals for display purrposes
        symbol = _tokenSymbol;
        master = msg.sender;
    }   

    /// @dev Fallback to calling deposit when ether is sent directly to contract.
    function() public payable {
        buyToken();
    }

    /// @dev Buys tokens with Ether, exchanging them 1:rate
    function buyToken() public payable {
        require(msg.value > 0);

        uint256 amount = msg.value.mul(rate);
        balances[msg.sender] = balances[msg.sender].add(amount);
        totalSupply = totalSupply.add(amount);

        master.transfer(msg.value);
        emit BuyToken(msg.value, amount, totalSupply, msg.sender, decimals, symbol);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
}
