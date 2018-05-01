pragma solidity ^0.4.19;

// 문자열 저장 계약
contract KeyValueStore {
    // 키 상태 변수 정의
    uint256 keyIndex;
    
    // 값 상태 변수 정의
    struct values {
        string value1;
        string value2;
    }

    // 키와 값의 맵핑 정의
    mapping (uint256 => values) Obj;

    // 키에 대한 값 1과 2를 등록하는 함수
    function setValue(string _value1, string _value2) constant returns (uint256) {
        Obj[keyIndex].value1 = _value1;
        Obj[keyIndex].value2 = _value2;
        keyIndex++;
        return keyIndex;
    }

    // 키에 대한 값 1을 가져오는 함수
    function getValue1(uint _key) constant returns (string) {
        return Obj[_key].value1;
    }

    // 키에 대한 값 2를 가져오는 함수
    function getValue2(uint _key) constant returns (string) {
        return Obj[_key].value2;
    }
}

