pragma solidity ^0.4.2;

// 제어 구조 예제

contract sample{
    int a = 12;
    int[] b;
    function sample()
    {
        // "=="은 복합 유형에 대해 예외를 발생시킨다
        if(a == 12)
        {}
        else if(a == 34)
        {}
        else
        {}
        
        var temp = 10;

        while(temp < 20)
        {
            if(temp == 17)
            {
                break;
            }
            else
            {
                continue;
            }
            temp++;
        }

        for(var iii=0; iii < b.length; iii++)
        {
            
        }
    }
}