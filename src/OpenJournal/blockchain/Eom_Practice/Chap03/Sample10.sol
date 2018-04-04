pragma solidity ^0.4.2;

// 컨트랙트의 특징 1 - 가시성

contract sample1
{
    int public b = 78;
    int internal c = 90;

    function sample1()
    {
        // 외부(external) 접근
        this.a();

        // 컴파일 에러
        a();

        // 내부(internal) 접근
        b = 12;

        // 외부 접근
        this.b;
        this.b();
        
        // 컴파일 오류
        this.b(8);

        // 컴파일 오류
        this.c();

        // 내부 접근
        c = 9;
    }
    function a() external
    {
    
    }
}

contract sample2
{
    int internal d = 9;
    int private e = 90;
}

// sample3는 sample2를 상속
contract sample3 is sample2
{
    sample1 s;

    function sample3()
    {
        s = new sample1();

        // 외부 접근
        s.a();

        // 외부 접근
        var f = s.b;

        // 접근자를 통해 값을 할당할 수 없으므로 컴파일 오류
        s.b = 18;

        // 컴파일 오류
        s.c();

        // 내부 접근
        d = 8;

        // 컴파일 오류
        e = 7;
    }
}
