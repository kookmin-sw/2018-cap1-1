pragma solidity ^0.4.2;

// 매핑 예제

contract sample{
    mapping (int => string) myMap;

    function sample(int key, string value){
        myMap[key] = value;

        // myMap2는 myMap의 참조다
        mapping (int => string) myMap2 = myMap;
    }
}