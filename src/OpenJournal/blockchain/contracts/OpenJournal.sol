pragma solidity ^0.4.21;

import "./Token/JournalToken.sol";

contract OpenJournal is JournalToken(0, "OJToken", 18, "OJ") {
    
    struct Journal {
        uint256 number;
        address author;
        string title;
        string description;     // 논문 해시값으로 대체해야 함
        uint8 value;
        uint[] subscribed;
        //uint[] reference_journal;
    }
    
    struct Subscriber {
        uint256 subscriber_number;          // 구독자 number(주소로 매칭시키기에는 무리가 있으므로)
        address subscriber_address;         // 구독자 주소
        uint[] subscriber_journal;          // 구독자가 구독한 리스트
    }    

    mapping (uint => Journal) public journals;                                  // 논문 번호 : Journal
    mapping (address => Subscriber) public subscribers;                         // 구독자 주소 : Subscriber
    mapping (address => mapping (uint => bool)) public is_subscribed;           // 구독자가 논문을 구독하였는지에 대한 여부

    uint256 public subscriberNumber;       // Subscriber 번호
    uint256 public journalNumber;          // Journal 번호
    uint8 public signUpCost;               // 회원가입시 주어질 토큰
    uint8 public upperbound_value;         // 저자가 논문 등록시 값의 상한선  

    event LogSignUp(
        uint256 _subscriber_number, 
        address _subscriber_address, 
        uint[] _subscriber_journal
    );  

    event LogRegistJournal(
        uint256 _number, 
        address _author, 
        string _title, 
        uint8 _value
    );  

    event LogSubscribeJournal(
        address _subscriber, 
        uint[] _myjournals, 
        uint[] _subscribed,
        bool _is_subscribed
    );

    event LogShowSubscribedJournal(
        uint[] _journals
    );  

    event LogShowJournalSubscriber(
        uint[] _subscriber
    );    

    event LogGetAuthorAddress (
        uint256 _number,
        address _author
    );

    event LogGetValue (
        uint256 _number,
        uint8 _value
    );

    function OpenJournal(
        uint256 _subscriberNumber,
        uint256 _journalNumber,
        uint8 _signUpCost,
        uint8 _upperbound_value
    ) public {
        subscriberNumber = _subscriberNumber;
        journalNumber = _journalNumber;
        signUpCost = _signUpCost;
        upperbound_value = _upperbound_value;
    }

    function signUp() public returns (bool) {
        subscriberNumber = subscriberNumber.add(1);            
        subscribers[msg.sender] = Subscriber(
            subscriberNumber,
            msg.sender,
            new uint[](0)
        );
        transferFromOwner(msg.sender, signUpCost);   
        emit LogSignUp(subscriberNumber, msg.sender, subscribers[msg.sender].subscriber_journal);
        return true;
    }

    function registJournal(uint8 _journalValue, string _title, string _description) public returns (bool) {
        require(_journalValue <= upperbound_value);
        journalNumber = journalNumber.add(1);
        journals[journalNumber] = Journal(
            journalNumber,
            msg.sender,
            _title,
            _description,
            _journalValue,
            new uint[](0)            
        );
        emit LogRegistJournal(journalNumber, msg.sender, _title, _journalValue);   
 
        return true;    
    }

    function subscribeJournal(uint256 _journalNumber) public returns (bool){
        require(_journalNumber > 0 && _journalNumber <= journalNumber && is_subscribed[msg.sender][_journalNumber] == false);        

        transfer(journals[_journalNumber].author, journals[_journalNumber].value);
        uint sub_id = subscribers[msg.sender].subscriber_number;

        subscribers[msg.sender].subscriber_journal.push(_journalNumber);  
        journals[_journalNumber].subscribed.push(sub_id);       
        is_subscribed[msg.sender][_journalNumber] = true;

        emit LogSubscribeJournal(
            msg.sender, 
            subscribers[msg.sender].subscriber_journal, 
            journals[_journalNumber].subscribed, 
            is_subscribed[msg.sender][_journalNumber]
        );

        return true;
    }

    function getAuthorAddress(uint256 _journalNumber) public view returns (address){
        return journals[_journalNumber].author;
    }

    function getValue(uint256 _journalNumber) public view returns (uint8){
        return journals[_journalNumber].value;
    }

    function showSubscribedJournal() public view returns (uint[]){
        return subscribers[msg.sender].subscriber_journal;
    }

    function showJournalSubscriber(uint _journalNumber) public view returns (uint[]) {
        return journals[_journalNumber].subscribed;
    }
}
