pragma solidity ^0.4.8;

contract SelfDestructSample {
    address public owner = msg.sender;      // 계약을 배포한 주소를 소유자로 한다.
    // 송금을 받는다.
    function() payable { }

    // 계약을 파기한다.
    funtion close() {
        if(owner != msg.sender) revert();
        selfdestruct(owner);
    }

    // 계약 잔고를 반환한다.
    function Balance() constant returns (uint) {
        return this.balance;    //close() 뒤에 호출하면 오류가 발생
    }
}