pragma solidity ^0.4.2;

// 다수의 값 리턴 예제

contract sample
{
    function a() returns (int a, string c)
    {
        return (1, "ss");
    }

    function b()
    {
        int A;
        string memory B;

        // A는 1이고 B는 "ss"다.
        (A, B) = a();

        // A는 1
        (A,) = a();

        // B는 "ss"
        (, B) = a();
    }
}
