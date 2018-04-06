pragma solidity ^0.4.8;

contract OreOreCoin {
    string public name;         // 토큰 이름
    string public symbol;       // 토큰 단위
    uint8 public decimals;      // 소수점 이하 자릿수
    uint256 public totalSupply;  // 토큰 총량
    mapping (address => uint256) public balanceOf;      // 각 주소의 잔고
    mapping (address => int8) public blackList;         // 블랙리스트
    mappint (address => int8) public cashbackRate;      // 각 주소의 캐시백 비율
    address public owner;       // 소유자 주소
    
    // 수식자
    modifier onlyOwner()    { if (msg.sender != owner)  revert(); _; }
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Blacklisted(address indexed target);
    event DeleteFromBlacklist(address indexed target);
    event RejectedPaymentToBlacklistedAddr(address indexed from, address indexed to, uint256 value);
    event RejectedPaymentFromBlacklistedAddr(address indexed from, address indexed to, uint256 value);
    event SetCashback(address indexed addr, int8 rate);
    event Cashback(address indexed from, address indexed to, uint256 value);

    // 생성자
    function OreOreCoin(uint256 _supply, string _name, string _symbol, uint8 _decimals) {
        balanceOf[msg.sender] = _supply;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _supply;
        owner = msg.sender;
    }

    // 블랙리스트를 등록
    function blacklisting(address _addr) onlyOwner {
        blackList[_addr] = 1;
        Blacklisted(_addr);
    }

    // 블랙리스트에서 제거
    function deleteFromBlacklist(address _addr) onlyOwner {
        blackList[_addr] = -1;
        DeleteFromBlacklist(_addr);
    }

    // 캐시백 비율 설정
    function setCashbackRate(int8 _rate) {
        if(_rate < 1) {
            _rate = -1;
        } else if (_rate > 100) {
            _rate = 100;
        }
        cashbackRate[msg.sender] = _rate;
        if(_rate < 1) {
            _rate = 0;
        }
        SetCashback(msg.sender, _rate);
    }

    // 송금
    function transfer(address _to, uint256 _value) {
        // 부정 송금을 확인
        if(balanceOf[msg.sender] < _value)  revert();
        if(balanceOf[msg.sender] + _value < balanceOf[_to])     revert();

        if(blackList[msg.sender] > 0) {
            RejectedPaymentFromBlacklistedAddr(msg.sender, _to, _value);
        } else if(blackList[_to] > 0) {
            RejectedPaymentToBlacklistedAddr(msg.sender, _to, _value);
        } else { 
            uint256 cashback = 0;
            if(cashbackRate[_to] > 0)   cashback = _value / 100 * uint256(cashbackRate[_to]);

            balanceOf[msg.sender] -= (_value - cashback);
            balanceOf[_to] += (_value - cashback);

            Transfer(msg.sender, _to, _value);
            Cashback(_to, msg.sender, cashback);
        }        
    }
}