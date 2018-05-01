pragma solidity ^0.4.2;

// 상속 예제

contract sample1
{
    function a(){}
    function b(){}
}

// sample2는 sample1을 상속한다.
contract sample2 is sample1
{
    function b(){}
}

contract sample3
{
    function sample3(int b)
    {
    }
}

// sample4는 sample1과 sample2를 상속
// sample1은 sample2의 부모이므로, 오직 하나의 sample1 인스턴스만 존재

contract sample4 is sample1, sample2
{
    function a(){}
    function c(){

        // 그 다음 sample3의 a 메소드 실행 => ??? 뭔말이지
        a();

        // 그 다음 sample1 컨트랙트의 a메소드 실행
        sample1.a();

        // sample2.b()가 부모 컨트랙트의 마지막에 있다. 
        // sample1.b()를 재정의했으므로 sample2.b()를 호출
        b();
    }
}

// 생성자가 인자를 받으면, 자식 컨트랙트 생성 시 제공돼야 함
// 솔리디티에서는 자식 컨트랙트가 부모의 생성자를 대신 호춣하지 않음. 부모가 초기화되어 자식에게 복사됨
contract sample5 is sample3(122)
{
}