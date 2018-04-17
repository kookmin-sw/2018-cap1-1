pragma solidity ^0.4.2;

// 함수 변경자 예제

contract sample
{
    int a = 90;

    modifier myModifier1(int b){
        int c = b;
        _; // 다음 변경자 바디나 함수 바디 중 먼저 오는 것이 삽입된다.
        c = a;
        a = 8;
    }

    modifier myModifier2{
        int c = a;
        _;
    }

    modifier myModifier3{
        a = 96;
        return;
        _;
        a = 99;
    }

    modifier myModifier4{
        int c = a;
        _;
    }

    function myFunction() myModifier1(a) myModifier2 myModifier3 returns (int d)
    {
        a = 1;
        return a;
    }
}