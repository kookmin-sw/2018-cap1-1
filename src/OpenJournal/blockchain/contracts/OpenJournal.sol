pragma solidity ^0.4.21;

import "./Token/JournalToken.sol";

contract OpenJournal is JournalToken(0, "OJToken", 18, "OJ") {
    
    struct Journal {
        uint256 number;
        address author;
        string title;
        uint256 value;
        uint[] subscribed;
        uint256[] reference_journal;
    }
    
    struct Subscriber {
        uint256 subscriber_number;          // 구독자 number(주소로 매칭시키기에는 무리가 있으므로)
        address subscriber_address;         // 구독자 주소
        uint[] subscriber_journal;          // 구독자가 구독한 리스트
    }    

    mapping (uint256 => Journal) public journals;                                  // 논문 번호 : Journal
    mapping (address => Subscriber) public subscribers;                         // 구독자 주소 : Subscriber
    mapping (address => mapping (uint => bool)) public is_subscribed;           // 구독자가 논문을 구독하였는지에 대한 여부

    uint256 public subscriberNumber;         // Subscriber 번호
    uint256 public signUpCost;               // 회원가입시 주어질 토큰
    uint256 public upperbound_value;         // 저자가 논문 등록시 값의 상한선
    uint256 public lowerbound_value;         // 저자가 논문 등록시 값의 하한선
    uint256 public author_share;             // 논문 저자 지분   
    uint256 public reference_temp_token;

    event LogSignUp(
        uint256 _subscriber_number, 
        address _subscriber_address, 
        uint[] _subscriber_journal
    );  

    event LogRegistJournal(
        uint256 _number, 
        address _author, 
        string _title, 
        uint256 _value,
        uint256[] _reference
    );  

    event LogSubscribeJournal(
        address _subscriber, 
        uint[] _myjournals, 
        uint[] _subscribed,
        bool _is_subscribed,
        uint256 _author_value,
        uint256 _author_mini_token,
        uint256 _ref_value,
        uint256 _reference_mini_token
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
        uint256 _value
    );

    function OpenJournal(
        uint256 _subscriberNumber,
        uint256 _signUpCost,
        uint256 _upperbound_value,
        uint256 _lowerbound_value,
        uint256 _author_share
    ) public {
        subscriberNumber = _subscriberNumber;
        signUpCost = _signUpCost;
        upperbound_value = _upperbound_value;
        lowerbound_value = _lowerbound_value;
        author_share = _author_share;
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

    function registJournal(uint256 _journalNumber, string _title, uint256 _journalValue, uint256[] _referenceJournal) public returns (bool) {
        require(_journalValue <= upperbound_value && _journalValue >= lowerbound_value);
    
        journals[_journalNumber] = Journal(
            _journalNumber,
            msg.sender,
            _title,
            _journalValue,
            new uint[](0),
            new uint256[](0)
        );

        for(uint256 ref = 0; ref <_referenceJournal.length; ++ref)
            journals[_journalNumber].reference_journal.push(_referenceJournal[ref]);
        
        emit LogRegistJournal(
            _journalNumber, 
            msg.sender, 
            _title, 
            _journalValue, 
            journals[_journalNumber].reference_journal
        );   
 
        return true;    
    }

    function subscribeJournal(uint256 _journalNumber) public returns (bool){
        require(is_subscribed[msg.sender][_journalNumber] == false);  

        uint256 author_token;
        uint256 author_mini_token;
        uint256 reference_token;
        uint256 reference_mini_token;
        uint256 reference_temp_token;
        uint256 reference_num = journals[_journalNumber].reference_journal.length;

        if(reference_num == 0){
            author_token = journals[_journalNumber].value;
        } else{
            author_token = journals[_journalNumber].value.mul(author_share).div(mini_token_rate);
            reference_token = journals[_journalNumber].value.sub(author_token);

            if(reference_token % reference_num == 0 && reference_token / reference_num != 0){
                reference_token = reference_token.div(reference_num);
            } else{               
                reference_temp_token = reference_token;
                if(reference_token.div(reference_num) != 0){
                    reference_token = reference_token.div(reference_num);  
                } else{
                    reference_token = 0;
                }

                reference_temp_token = reference_temp_token.sub(reference_token.mul(reference_num)).mul(mini_token_rate);

                reference_mini_token = reference_temp_token.div(reference_num); 

                author_mini_token = reference_temp_token.sub(reference_mini_token.mul(reference_num));  
            }

            for(uint256 ref = 0; ref < reference_num; ref++)
                transferAll(journals[journals[_journalNumber].reference_journal[ref]].author, reference_token, reference_mini_token);
                    
        }

        transferAll(journals[_journalNumber].author, author_token, author_mini_token); 

        uint sub_id = subscribers[msg.sender].subscriber_number;

        subscribers[msg.sender].subscriber_journal.push(_journalNumber);  
        journals[_journalNumber].subscribed.push(sub_id);       
        is_subscribed[msg.sender][_journalNumber] = true;

        emit LogSubscribeJournal(
            msg.sender, 
            subscribers[msg.sender].subscriber_journal, 
            journals[_journalNumber].subscribed, 
            is_subscribed[msg.sender][_journalNumber],
            author_token,
            author_mini_token,
            reference_token, 
            reference_mini_token
        );

        return true;
    }

    function getAuthorAddress(uint256 _journalNumber) public view returns (address){
        return journals[_journalNumber].author;
    }

    function getValue(uint256 _journalNumber) public view returns (uint256){
        return journals[_journalNumber].value;
    }

    function showSubscribedJournal() public view returns (uint[]){
        return subscribers[msg.sender].subscriber_journal;
    }

    function showJournalSubscriber(uint _journalNumber) public view returns (uint[]) {
        return journals[_journalNumber].subscribed;
    }
}
