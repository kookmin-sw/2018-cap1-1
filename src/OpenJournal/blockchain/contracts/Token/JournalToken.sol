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
    uint256 constant public rate = 1000;                // The ratio of our token to Ether
    uint256 constant public mini_token_rate = 100;        // The ratio of our mini token to token

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

    event TokenToMini(
        address _msgSender,
        uint256 _token,
        uint256 _mini_token
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
        owner = msg.sender;
    }   

    /// @dev Fallback to calling deposit when ether is sent directly to contract.
    function() public payable {
        buyToken();
    }

    // @dev Buys tokens with Ether, exchanging them 1:rate
    function buyToken() public payable {
        require(msg.value > 0);

        uint256 amount = msg.value.mul(rate);
        balances[msg.sender] = balances[msg.sender].add(amount);
        totalSupply = totalSupply.add(amount);

        //owner.transfer(msg.value);
        emit BuyToken(msg.value, amount, totalSupply, msg.sender, decimals, symbol);
    }

    // Sells tokens with Ether
    function sellToken(uint256 _value) public {    // 1000으로 나누었을때 나머지가 0인 수만 받자.
        require(balances[msg.sender] >= _value && totalSupply >= _value && _value != 0);

        uint256 amount = _value.div(rate);
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);

        if (!msg.sender.send(amount)) throw;

        emit SellToken(_value, amount, totalSupply, msg.sender);
    }

    function tokenToMini(uint256 _value) public returns (bool) {
        require(balances[msg.sender] >= _value && balances[msg.sender] >= 0);
        balances[msg.sender] = balances[msg.sender].sub(_value);

        uint256 mini_value = _value.mul(mini_token_rate);
        mini_balances[msg.sender] = mini_balances[msg.sender].add(mini_value);

        emit TokenToMini(msg.sender, balances[msg.sender], mini_balances[msg.sender]);
        return true;
    }

    function miniToToken(uint256 _mini_value) public returns (bool) {
        require(mini_balances[msg.sender] >= _mini_value && mini_balances[msg.sender] >= 100); 
        uint256 value = _mini_value.div(mini_token_rate);

        mini_balances[msg.sender] = mini_balances[msg.sender].sub(value.mul(mini_token_rate));
        balances[msg.sender] = balances[msg.sender].add(value); 

        emit TokenToMini(msg.sender, balances[msg.sender], mini_balances[msg.sender]);
        return true;
    }

    function transferAll(address _to, uint256 _value, uint256 _mini_value) public returns (bool success) {
        require(balances[msg.sender].mul(mini_token_rate)+mini_balances[msg.sender] >= _value.mul(mini_token_rate) + _mini_value);
        tokenToMini(balances[msg.sender]);
        uint256 tempAmount = _value.mul(mini_token_rate).add(_mini_value);
        mini_balances[msg.sender] = mini_balances[msg.sender].sub(tempAmount);

        if(mini_balances[msg.sender].div(mini_token_rate) != 0)
            miniToToken(mini_balances[msg.sender]);
        
        balances[_to] = balances[_to].add(_value);
        mini_balances[_to] = mini_balances[_to].add(_mini_value);
        emit TransferAll(msg.sender, _to, _value, _mini_value);
        return true;
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

    function balanceOfMini(address _owner) public view returns (uint256 balance) {
        return mini_balances[_owner];
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
