pragma solidity ^0.4.2;

// 배열 예제

contract sample{
    // 동적 크기 배열
    // 배열 리터럴이 보일 때마다 새로운 배열이 생성된다. 배열 리터럴이 명시돼 있으면 스토리지에 저장되고,
    // 함수 내부에서 발견되면 메모리에 저장된다.
    int[] myArray = [0, 0];

    function sample(uint index, int value){
        // 배열의 인덱스는 uint256 유형이여야 한다.
        myArray[index] = value;

        int[] myArray2 = myArray; // myArray2는 myArray의 포인터를 저장

        // 메모리 내 고정된 크기의 배열
        // 여기서는 99999가 최댓값이며 이 값을 위해 필요한 최대 크기가 24비트이므로 여기서는 uint24를 사용해야 한다.
        uint24[3] memory myArray3 = [1, 2, 99999]; // 배열 리터럴

        // myArray4에 메모리 내 복합 유형을 할당할 수 없으므로 예외가 발생한다.
        uint8[2] myArray4 = [1, 2];
    }
}