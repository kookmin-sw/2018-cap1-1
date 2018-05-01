pragma solidity ^0.4.8;

contract A {
    uint public a;
    function setA(uint _a) {
        a = _a;
    }
    function getData() constant returns (uint) {
        return a;
    }
}

contract B is A {       // B는 A의 하위 계약
    function getData() constant returns (uint) {
        return a * 10;
    }
}

contract C {
    A[] internal c;     // 데이터 형식을 계약 A 형식의 가변 길이 배열로 설정해 c로 선언
    function makeContract() returns (uint, uint) {
        c.length = 2;
        A a = new A();
        a.setA(1);
        c[0] = a;
        B b = new B();
        b.setA(1);
        c[1] = b;
        return (c[0].getData(), c[1].getData());
    }
}