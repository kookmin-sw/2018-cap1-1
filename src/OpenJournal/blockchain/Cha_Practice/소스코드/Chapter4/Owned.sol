pragma solidity ^0.4.8;

// 소유자 관리용 계약
contract Owned {
    address public owner;

    event TransferOwnership(address oldaddr, address newaddr);

    modifier onlyOwner() { if (msg.sender != owner) revert(); _; }

    function Owned() {
        owner = msg.sender;
    }

    function transferOwnership(address _new) onlyOwner {
        address oldaddr = owner;
        owner = _new;
        TransferOwnership(oldaddr, owner);
    }
}

// 회원 관리용 계약
contract Members is Owned {
    address public coin;                // 토큰 주소
    MemberStatus[] public status;       // 회원 등급 배열
    mapping(address => History) public tradingHistory;      // 회원별 거래 이력

    // 회원 등급용 구조체
    struct MemberStatus {
        string name;        // 등급명
        uint256 times;      // 최저 거래 횟수
        uint256 sum;        // 최저 거래 금액
        int8 rate;          // 캐시백 비율
    }

    // 거래 이력용 구조체
    struct History {
        uint256 times;          // 거래 횟수
        uint256 sum;            // 거래 금액
        uint256 statusIndex;    // 등급 인덱스         
    }

    // 토큰 한정 메서드용 수식자
    modifier onlyCoin() { if (msg.sender == coin) _; }

    // 토큰 주소 설정
    function setCoin(address _addr) onlyOwner {
        coin = _addr;
    }

    // 회원 등급 추가(Bronze, Silver, Gold 등...)
    function pushStatus(string _name, uint256 _times, uint256 _sum, int8 _rate) onlyOwner {
        status.push(MemberStatus({
            name: _name,
            times: _times,
            sum: _sum,
            rate: _rate
        }));
    }

    // 회원 등급 내용 변경
    function editStatus(uint256 _index, string _name, uint256 _times, uint256 _sum, int8 _rate) onlyOwner {
        if(_index < status.length) {
            status[_index].name = _name;
            status[_index].times = _times;
            status[_index].sum = _sum;
            status[_index].rate = _rate;
        }
    }

    // 거래 내역 갱신
    function updateHistory(address _member, uint256 _value) onlyCoin {
        tradingHistory[_member].times += 1;
        tradingHistory[_member].sum += _value;

        // 새로운 회원 등급을 결정해야 함
        uint256 index;
        int8 tmprate;
        for(uint i=0; i < status.length; i++) {
            // 최저 거래 횟수, 최저 거래 금액 충족 시 가장 캐시백 비율이 좋은 등급으로 설정
            if(tradingHistory[_member].times >= status[i].times &&
                tradingHistory[_member].sum >= status[i].sum &&
                tmprate < status[i].rate){
                    index = i;
            }
        }
        tradingHistory[_member].statusIndex = index;
    }

    // 캐시백 비율 획득(회원의 등급에 해당하는 비율 확인)
    function getCashbackRate(address _member) constant returns (int8 rate) {
        rate = status[tradingHistory[_member].statusIndex].rate;
    }
}

// 회원 관리 기능이 구현된 가상 화폐
contract OreOreCoin is Owned {
    string public name;         // 토큰 이름
    string public symbol;       // 토큰 단위
    uint8 public decimals;      // 소수점 이하 자릿수
    uint256 public totalSupply;  // 토큰 총량
    mapping (address => uint256) public balanceOf;      // 각 주소의 잔고
    mapping (address => int8) public blackList;         // 블랙리스트
    mapping (address => Members) public members;        // 각 주소의 회원 정보
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Blacklisted(address indexed target);
    event DeleteFromBlacklist(address indexed target);
    event RejectedPaymentToBlacklistedAddr(address indexed from, address indexed to, uint256 value);
    event RejectedPaymentFromBlacklistedAddr(address indexed from, address indexed to, uint256 value);
    event Cashback(address indexed from, address indexed to, uint256 value);

    // 생성자
    function OreOreCoin(uint256 _supply, string _name, string _symbol, uint8 _decimals) {
        balanceOf[msg.sender] = _supply;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _supply;
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

    // 회원 관리 계약 설정
    function setMembers(Members _members) {
        members[msg.sender] = Members(_members);
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
            if(members[_to] > address(0)) {
                cashback = _value / 100 * uint256(members[_to].getCashbackRate(msg.sender));
                members[_to].updateHistory(msg.sender, _value);
            }

            balanceOf[msg.sender] -= (_value - cashback);
            balanceOf[_to] += (_value - cashback);

            Transfer(msg.sender, _to, _value);
            Cashback(_to, msg.sender, cashback);
        }        
    }
}