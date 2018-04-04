pragma solidity ^0.4.2;

// 문자열 예제

contact sample{
    // 문자열 리터럴이 보일 때마다 새로운 문자열 생성됨
    string myString = ""; // 문자열 리터럴
    bytes myRawString;

    function sample(string initString, bytes rawStringInit){
        myString = initString;

        // myString2는 myString으로의 포인터를 저장
        string myString2 = myString;

        // myString3는 메모리 내의 문자열
        string memory myString3 = "ABCDE";

        // 길이 및 내용 변경
        myString3 = "XYZ";
        myRawString = rawStringInit;

        // myRawString의 길이 증가
        myRawString.length++;

        // 컴파일 시 예외 발생
        string myString4 = "Example";

        // 컴파일 시 예외 발생
        string myString5 = initString;
    }
}