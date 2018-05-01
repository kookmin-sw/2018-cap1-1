pragma solidity ^0.4.8;

contract DataTypeSamle {
    function getValueType() constant returns (uint) {
        uint a;         //uint형 변수 a이고 0으로 초기화 된다.
        a = 1;
        uint b = a;     //변수 b에 a의 값 1이 대입
        b = 2;          //b의 값이 2가 된다.
        return a;
    }

    function getReferenceType() constant return (uint[2]) {
        uint[2] a;
        a[0] = 1;
        a[1] = 2;
        uint[2] b = a;  //a는 데이터 영역 주소이기 때문에 b는 a와 동일한 데이터 영역을 참조
        b[0] = 10;
        b[1] = 20;
        return a;
    }
}