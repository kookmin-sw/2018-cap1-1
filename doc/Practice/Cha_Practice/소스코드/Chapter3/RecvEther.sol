pragma solidity ^0.4.8;

contract RecvEther {
    address public sender;      //보내는 주소 확인용
    uint public recvEther;      //받은 Ether

    //송금 받기
    function () payable {
        sender = msg.sender;    //확인을 위해 상태 변수 갱신
        recvEther += msg.value;
    }
}