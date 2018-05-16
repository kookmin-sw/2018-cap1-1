pragma solidity ^0.4.21;

contract Owned {

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    address public owner;

    function Owned() public {owner = msg.sender;}

    function changeOwner(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }

    function getOwnerAddress() public view returns (address ownerAddress) {
        return owner;
    }
}