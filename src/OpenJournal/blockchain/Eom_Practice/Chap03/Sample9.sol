pragma solidity ^0.4.2;

// 외부 함수 호출 기본 구조

contract sample1
{
    int a;

    // "payable"은 기본으로 포함된(built-in)변경자
    // 다른 컨트랙트가 메소드를 호출하면서 이더를 전송할 때 이 변경자가 필요하다.

    function sample1(int b) payable
    {
        a = b;
    }
    function assign(int c)
    {
        a = c;
    }
    function makePayment(int d) payable
    {
        a = d;
    }
}

contract sample2
{
    function hello()
    {
    }

    function sample2(address addressOfContract)
    {
        // 컨트랙트 인스턴스를 생성하면서 12 wei 전송
        sample1 s = (new sample1).value(12)(23);
        s.makePayment(22);

        // 다시 ㅇ ㅣ더를 전송
        s.makePayment.value(45)(12);

        // 사용할 가스의 양 지정
        s.makePayment.gas(895)(12);

        // 이더를 전송하고 가스를 다시 지정
        s.makePayment.value(4).gas(900)(12);

        // hello()는 내부 호출이며 this.hello()는 외부 호출
        this.hello();

        // 이미 배포된 컨트랙트를 지정
        sample1 s2 = sample1(addressOfContract);
        
        s2.makePayment(112);
    }
}