pragma solidity ^0.4.2;

// 구조체 예제

contract sample{
    struct myStruct{
        bool myBool;
        string myString;
    }

    myStruct s1;

    // 구조체 메소드가 보일 때마다 새로운 구조체가 생성된다.
    
    myStruct s2 = myStruct(true, ""); // 구조체 메소드 문법
    function sample(bool initBool, string initString){
        // 구조체의 인스턴스 생성
        s1 = myStruct(initBool, initString);

        // myStruct(initBool, initString)은 메모리에 인스턴스를 생성한다.
        myStruct memory s3 = myStruct(initBool, initString);
    }
}