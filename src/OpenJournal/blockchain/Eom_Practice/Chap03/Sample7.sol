pragma solidity ^0.4.2;

// delete 연산자 예제

contract sample{
    struct Struct{
        mapping (int => int) myMap;
        int myNumber;
    }

    init[] myArray;
    Struct myStruct;

    function sample(int key, int value, int number, int[] array){
        // 맵은 할당될 수 없으므로 구조체를 생성하는 동안 맵은 무시
        myStruct = Struct(number);

        // 맵 키/값을 설정
        myStruct.myMap[key] = value;
        myArray = array;
    }

    function reset(){
        // 이제 myArray의 길이는 0이다.
        delete myArray;

        // 이제 myNumber는 0이며 myMap은 현재 상태로 남아있는다.
        delete myStruct;
    }

    function deleteKey(int key){
        // 여기서 키를 삭제한다.
        delete myStruct.myMap[key];
    }
}