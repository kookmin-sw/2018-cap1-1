pragma solidity ^0.4.8;

contract MappingSample {
    struct User {
        string name;
        uint age;
    }

    mapping(address=>User) public userList;     // value를 구조체(User)로 설정
    function setUser(string _name, uint _age) {
        userList[msg.sender].name = _name;
        userList[msg.sender].age = _age;
    }

    function getUser() returns (string, uint) {
        User storage u = userList[msg.sender];
        return (u.name, u.age);
    }
}