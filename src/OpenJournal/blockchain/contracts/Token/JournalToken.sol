pragma solidity ^0.4.21;

import "./EIP20Interface.sol";
import "../Math/SafeMath.sol";
import "../Owner/Owned.sol";

contract JournalToken is EIP20Interface, Owned {

    using SafeMath for uint256;

    uint256 constant private MAX_UINT256 = 2**256 - 1;
    mapping (address => uint256) public balances;
    mapping (address => uint256) public mini_balances;
    mapping (address => mapping (address => uint256)) public allowed; 
    
    string public name;                                 // Token name
    uint8 public decimals;                              // How many decimals to show.
    string public symbol;                               // Token unit
    address public owner;                  
    uint256 constant public rate = 10000;                       // The ratio of our token to Ether
    uint256 public constant tokenGenerationMax = 1 * (10**7) * (10**uint256(decimals));

    event BuyToken(
        uint256 _msgValue,
        uint256 _amount,
        uint256 _totalSupply,
        address _msgSender,
        uint8 _decimals,
        string _symbol
    );

    event SellToken(
        uint256 _msgValue,
        uint256 _amount,
        uint256 _totalSupply,
        address _msgSender
    );    

    function JournalToken(
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol
    ) public {
        owner = msg.sender;
        name = _tokenName;                                          // Set the name for display purposes
        symbol = _tokenSymbol;
        decimals = _decimalUnits;                                   // Amount of decimals for display purrposes
        totalSupply = _initialAmount.mul(10**uint256(decimals));    // Update total supply
        balances[msg.sender] = totalSupply;                         // Give the creator all initial tokens 
    }   

    /// @dev Fallback to calling deposit when ether is sent directly to contract.
    function() public payable {
        buyToken();
    }

    // @dev Buys tokens with Ether, exchanging them 1:rate
    function buyToken() public payable {
        require(msg.value > 0);

        uint256 amount = msg.value.mul(rate);                       // 테스트할 때 : uint256 amount = msg.value.mul(10**uint256(4)).mul(rate);
        balances[msg.sender] = balances[msg.sender].add(amount);
        totalSupply = totalSupply.add(amount);

        require(totalSupply <= tokenGenerationMax);

        emit BuyToken(msg.value, amount, totalSupply, msg.sender, decimals, symbol);
    }

    // Sells tokens with Ether
    function sellToken(uint256 _value) public {    
        require(balances[msg.sender] >= _value && totalSupply >= _value && _value != 0);

        uint256 amount = _value.div(rate);
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);

        if (!msg.sender.send(amount)) revert();

        emit SellToken(_value, amount, totalSupply, msg.sender);
    }

    // Withdraw Ether form contracts
    function withdrawEther() public onlyOwner {
        owner.transfer(this.balance);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    } 

    function transferFromOwner(address _to, uint256 _value) public returns (bool success) {
        require(balances[owner] >= _value);
        balances[owner] = balances[owner].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(owner, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        balances[_to] = balances[_to].add(_value);
        balances[_from] = balances[_from].sub(_value);
        if (allowance < MAX_UINT256) {
            allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        }
        emit Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function balanceOfEther(address _to) public constant returns (uint256) { 
        return _to.balance; 
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
