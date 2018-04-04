pragma solidity ^0.4.2;

// 열거형 예제

contract sample{
    
    // 모든 열거형 값을 포함할 수 있는 가장 작은 정수형이 열거 값을 갖기 위해 선택된다.
    enum OS{ Windows, Linux, OSX, UNIX }

    OS choice;

    function sample(OS chosen){
        choice = chosen;
    }

    function setLinuxOS(){
        choice = OS.Linux;
    }

    function getChoice() returns (OS chosenOS){
        return choice;
    }
}