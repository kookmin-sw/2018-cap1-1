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

// 크라우드 세일
contract Crowdsale is Owned {
    uint256 public fundingGoal;         // 목표 금액
    uint256 public deadline;            // 기한
    uint256 public price;               // 토큰 기본 가격
    uint256 public transferableToken;   // 전송 가능한 토큰
    uint256 public soldToken;           // 판매된 토큰
    uint256 public startTime;           // 개시 시간
    OreOreCoin public tokenReward;      // 지불에 사용할 토큰
    bool public fundingGoalReached;     // 목표 도달 플래그
    bool public isOpened;               // 크라우드 세일 개시 플래그
    mapping (address => Property) public funderProperty;        // 자금 제공자의 자산 정보

    // 자산정보 구조체
    struct Property {
        uint256 paymentEther;       // 지불한 paymentEther
        uint256 reservedToken;      // 받은 토큰
        bool withdrawed;            // 인출 플래그
    }

    event CrowdsaleStart(uint fundingGoal, uint deadline, uint transferableToken, address beneficiary);
    event ReservedToken(address backer, uint amount, uint token);
    event CheckGoalReached(address beneficiary, uint fundingGoal, uint amountRaised, bool reached, uint raisedToken);
    event WithdrawalToken(address addr, uint amount, bool result);
    event WithdrawalEther(address addr, uint amount, bool result);

    modifier afterDeadline()    { if (now >= deadline) _;}

    function Crowdsale(uint _fundingGoalInEthers, uint _transferableToken, 
            uint _amountOfTokenPerEther, OreOreCoin _addressOfTokenUsedAsReward){
                fundingGoal = _fundingGoalInEthers * 1 ether;
                price = 1 ether / _amountOfTokenPerEther;
                transferableToken = _transferableToken;
                tokenReward = OreOreCoin(_addressOfTokenUsedAsReward);
            }
    
    // 이름 없는 함수(Ether 받기)
    function () payable {
        if(!isOpened || now >= deadline)    revert();

        // 받은 Ether와 판매 예정 토큰
        uint amount = msg.value;
        uint token = amount / price * (100 + currentSwapRate()) / 100;

        // 판매 예정 토큰의 확인(예정 수를 초과하는 경우는 예외 처리)
        if(token == 0 || soldToken + token > transferableToken) revert();

        // 자산 제공자의 자산 정보 변경
        funderProperty[msg.sender].paymentEther += amount;
        funderProperty[msg.sender].reservedToken += token;
        soldToken += token;
        ReservedToken(msg.sender, amount, token);
    }

    // 토큰이 예정한 수 이상 있다면 개시
    function start(uint _durationInMinutes) onlyOwner {
        if(fundingGoal == 0 || price == 0 || transferableToken == 0 ||
            tokenReward == address(0) || _durationInMinutes == 0 || startTime != 0)
            {   revert();   }
        
        if(tokenReward.balanceOf(this) >= transferableToken){
            startTime = now;
            deadline = now + _durationInMinutes * 1 minutes;
            isOpened = true;
            CrowdsaleStart(fundingGoal, deadline, transferableToken, owner);
        }
    }

    // 개시 시작부터 시간이 적게 경과할수록 더 많은 보상
    function currentSwapRate() constant returns(uint) {
        if(startTime + 3 minutes > now){
            return 100;
        } else if(startTime + 5 minutes > now) {
            return 50;
        } else if(startTime + 10 minutes > now) {
            return 20;
        } else{
            return 0;
        }
    }

    // 남은 시간과 목표와의 차이, 토큰 확인용 메서드
    function getRemainingTimeEthToken() constant returns(uint min, uint shortage, uint remainToken) {
        if(now < deadline) {
            min = (deadline - now) / (1 minutes);
        }
        shortage = (fundingGoal - this.balance) / (1 ether);
        remainToken = transferableToken - soldToken;
    }

    // 목표 도달 확인(기한 후 실시 가능)
    function checkGoalReached() afterDeadline {
        if(isOpened) {
            // 모인 Ether와 목표 Ether 비교
            if(this.balance >= fundingGoal) {
                fundingGoalReached = true;
            }
            isOpened = false;
            CheckGoalReached(owner, fundingGoal, this.balance, fundingGoalReached, soldToken);
        }
    }

    // 소유자용 인출 메서드(판매 종료 후 실시 가능)
    function withdrawalOwner() onlyOwner {
        if(isOpened)    revert();

        if(fundingGoalReached) {
            // Ether
            uint amount = this.balance;
            if(amount > 0) {
                bool ok = msg.sender.call.value(amount)();
                WithdrawalEther(msg.sender, amount, ok);
            }
            // 남은 토큰
            uint val = transferableToken - soldToken;
            if(val > 0) {
                tokenReward.transfer(msg.sender, transferableToken - soldToken);
                WithdrawalToken(msg.sender, val, true);
            }
        } else{
            // 토큰
            uint val2 = tokenReward.balanceOf(this);
            tokenReward.transfer(msg.sender, val2);
            WithdrawalToken(msg.sender, val2, true);
        }
    }

    // 자금 제공자용 인출 메서드(세일 종료 후 실시 가능)
    function withdrawal() {
        if(isOpened)    revert();

        // 이미 인출된 경우 예외 처리
        if(funderProperty[msg.sender].withdrawed)   revert();
        
        if(fundingGoalReached) {
            if(funderProperty[msg.sender].reservedToken > 0) {
                tokenReward.transfer(msg.sender, funderProperty[msg.sender].reservedToken);
                funderProperty[msg.sender].withdrawed = true;
                WithdrawalToken(
                    msg.sender,
                    funderProperty[msg.sender].reservedToken,
                    funderProperty[msg.sender].withdrawed
                );
            }
        } else {
            if(funderProperty[msg.sender].paymentEther > 0) {
                if(msg.sender.call.value(funderProperty[msg.sender].paymentEther)()) {
                    funderProperty[msg.sender].withdrawed = true;
                }
                WithdrawalEther(
                    msg.sender,
                    funderProperty[msg.sender].paymentEther,
                    funderProperty[msg.sender].withdrawed
                );
            }
        }
    }
}