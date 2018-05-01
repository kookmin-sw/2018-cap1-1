pragma solidity ^0.4.2;

// 라이브러리 예제
// for 사용 : using A for B 지시자는 라이브러리 함수를 attach하는데 사용
// using A for * 은 라이브러리 A의 함수를 모든 유형에 attach하는 효과

library math
{
    struct myStruct1{
        int a;
    }

    struct myStruct2{
        int a;
    }

    // 참조할 수 있도록 's'위치 저장소를 만들어야 함
    // 그렇지 않으면 호출한 myStruct1 대신 다른 myStruct1 인스턴스를 접근/수정하게 된다
    function addInt(myStruct1 storage s, int b) returns (int c){
        return s.a + b;
    }

    function subInt(myStruct2 storage s, int b) returns (int c){
        return s.a + b;
    }
}

contract sample
{
    // "*"는 함수를 모든 구조체에 attach한다
    using math for *;
    math.myStruct1 s1;
    math.myStruct2 s2;

    function sample()
    {
        s1 = math.myStruct1(9);
        s2 = math.myStruct2(9);
        s1.addInt(2);

        //addInt의 첫번째 매개변수가 myStruct1 유형이므로 myStruct2에 attach 되지 않아 컴파일오류 발생
        s2.addInt(1);
    }
}
