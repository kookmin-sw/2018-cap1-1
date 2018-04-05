pragma solidity ^0.4.8;

contract ArraySample {
    uint[5] public fArray = [uint(10), 20, 30, 40, 50]; // 고정 길이 배열
    uint[] public dArray;       // 가변 길이 배열

    function getFixedArray() constant returns (uint[5]) {
        uint[5] storage a = fArray;
        for(uint i = 0; i < a.length; i++) { 
            a[i] = i + 1;
        }
        return a;
    }

    function getFixedArray2() constant returns (uint[5]) {
        uint[5] storage b = fArray;
        return b;
    }

    function pushFixedArray(uint x) constant returns (uint) {
        //fArray.push(x)는 컴파일 오류 발생
        return fArray.length;
    }

    function pushDarray(uint x) returns (uint) {
        return dArray.push(x);
    }

    function getDarrayLength() returns (uint) {
        return dArray.length;
    }

    function initDarray(uint len) {
        dArray.length = len;    //가변 길이 배열의 크기를 변경
        for(uint i = 0; i < len; i++){
            dArray[i] = i + 1;
        }
    }

    function getDarray() constant returns (uint[]) {
        return dArray;
    }
    
    function delDarray() returns (uint) {
        delete dArray;           // 가변 길이 배열 삭제   
        return dArray.length;    // 0을 반환
    }

    function delFarray() returns (uint) {
        delete fArray;              // 고정 길이 배열 삭제 => 각 요소가 0이 됨
        return fArray.length;       // 길이는 변하지 않으므로 5를 반환
    }
}