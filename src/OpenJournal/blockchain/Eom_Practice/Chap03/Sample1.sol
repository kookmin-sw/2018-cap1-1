pragma solidity ^0.4.2;

// 스마트 컨트랙트 기본 구조

contract Sample
{
    // 상태 변수
    uint256 data;
    address owner; // 이더리움 지갑 주소(컨트랙트가 배포된 주소)

    // 이벤트 정의
    event logData(uint256 dataToLog); // data가 변경될 때마다 트리거

    // 함수 변경자
    modifier onlyOwner(){
        if(msg.sender != owner) throw;
        _;
    }

    // 생성자
    function Sample(uint256 initData, address initOwner){
        data = initData;
        owner = initOwner;
    }

    // 함수
    function getData() returns (uint256 returnedData){
        return data;
    }

    function setData(uint256 newData) onlyOwner{
        logData(newData);
        data = newData;
    }
}