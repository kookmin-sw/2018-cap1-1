pragma solidity ^0.4.18;

import "./EIP20Interface.sol";

contract JournalToken is EIP20Interface {
    uint256 constant private MAX_UINT256 = 2**256 - 1;
	mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;       
    
    string public name;                     //fancy name: eg Simon Bucks
    uint8 public decimals;                  //How many decimals to show.
    string public symbol;                   //An identifier: eg SBX   

	function JournalToken(/*
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol
    */) public {
        balances[msg.sender] = MAX_UINT256;                 // Give the creator all initial tokens
        totalSupply = MAX_UINT256;                          // Update total supply
        name = "JournalCoin";                                  // Set the name for display purposes
        decimals = 10;                                      // Amount of decimals for display purrposes
        symbol = "jc";
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        Transfer(msg.sender, _to, _value);
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
        Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    // msg.sender가 spender에게 value만큼의 토큰을 쓸 수 있도록 승인
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    // owner가 spender에게 얼만큼의 토큰을 쓸 수 있도록 승인
    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
}
