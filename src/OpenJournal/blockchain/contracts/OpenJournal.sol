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
    
    struct User {
        uint256 user_number;                    
        address user_address;                   
        uint[] user_subscribe_journal;          
        uint[] user_regist_journal;             
    }    

    mapping (uint256 => Journal) public journals;                               
    mapping (address => User) public users;                                     
    mapping (address => mapping (uint => bool)) public is_subscribed;           

    uint256 public userNumber;               
    uint256 public signUpCost;               
    uint256 public upperbound_value;         
    uint256 public lowerbound_value;         
    uint256 public author_share;

    event LogSignUp(
        uint256 _user_number, 
        address _user_address, 
        uint[] _user_subscribe_journal,
        uint[] _user_regist_journal
    );  

    event LogRegistJournal(
        uint256 _number, 
        address _author, 
        string _title, 
        uint256 _value,
        uint256[] _reference_journal,
        uint[] _user_regist_journal
    );  

    event LogSubscribeJournal(
        address _subscriber, 
        uint[] _myjournals, 
        uint[] _subscribed,
        bool _is_subscribed,
        uint256 _author_value,
        uint256 _ref_value
    );

    event LogGetUserRegistedJournals(
        uint[] _user_regist_journal
    );

    event LogGetUserSubscribedJournals(
        uint _user_subscribe_journal
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
        uint256 _userNumber,
        uint256 _signUpCost,
        uint256 _upperbound_value,
        uint256 _lowerbound_value,
        uint256 _author_share
    ) public {
        userNumber = _userNumber;
        signUpCost = _signUpCost.mul(10**uint256(4));   // signUpCost = _signUpCost.mul(10**uint256(decimals))
        upperbound_value = _upperbound_value;
        lowerbound_value = _lowerbound_value;
        author_share = _author_share;
    }

    function signUp() public returns (bool) {
        userNumber = userNumber.add(1);            
        users[msg.sender] = User(
            userNumber,
            msg.sender,
            new uint[](0),
            new uint[](0)
        );
        transferFromOwner(msg.sender, signUpCost);   

        emit LogSignUp(
            userNumber, 
            msg.sender, 
            users[msg.sender].user_subscribe_journal, 
            users[msg.sender].user_regist_journal
        );

        return true;
    }

    function registJournal(uint256 _journalNumber, string _title, uint256 _journalValue, uint256[] _referenceJournal) public returns (bool) {
        require(_journalValue <= upperbound_value && _journalValue >= lowerbound_value);
    
        journals[_journalNumber] = Journal(
            _journalNumber,
            msg.sender,
            _title,
            _journalValue.mul(10**uint256(4)),     // _journalValue.mul(10**uint256(decimals))
            new uint[](0),
            new uint256[](0)
        );

        for(uint256 ref = 0; ref <_referenceJournal.length; ++ref)
            journals[_journalNumber].reference_journal.push(_referenceJournal[ref]);

        users[msg.sender].user_regist_journal.push(_journalNumber);
        
        emit LogRegistJournal(
            _journalNumber, 
            msg.sender, 
            _title, 
            _journalValue, 
            journals[_journalNumber].reference_journal,
            users[msg.sender].user_regist_journal
        );   
 
        return true;    
    }

    function subscribeJournal(uint256 _journalNumber) public returns (bool){
        require(is_subscribed[msg.sender][_journalNumber] == false); 

        uint256 author_token;
        uint256 reference_token;
        uint256 reference_each_token;
        uint256 reference_total_token;
        uint256 reference_num = journals[_journalNumber].reference_journal.length;

        if(reference_num == 0){
            author_token = journals[_journalNumber].value;
        } else{
            author_token = journals[_journalNumber].value.mul(author_share).div(100);
            reference_token = journals[_journalNumber].value.sub(author_token);
            reference_each_token = reference_token.div(reference_num);
            reference_total_token = reference_each_token.mul(reference_num);
            author_token = author_token.add(reference_token.sub(reference_total_token));

            for(uint256 ref = 0; ref < reference_num; ref++)
                transfer(journals[journals[_journalNumber].reference_journal[ref]].author, reference_each_token);                    
        }

        transfer(journals[_journalNumber].author, author_token); 

        uint sub_id = users[msg.sender].user_number;

        users[msg.sender].user_subscribe_journal.push(_journalNumber);  
        journals[_journalNumber].subscribed.push(sub_id);       
        is_subscribed[msg.sender][_journalNumber] = true;

        emit LogSubscribeJournal(
            msg.sender, 
            users[msg.sender].user_subscribe_journal, 
            journals[_journalNumber].subscribed, 
            is_subscribed[msg.sender][_journalNumber],
            author_token,
            reference_each_token
        );

        return true;
    }

    function getAuthorAddress(uint256 _journalNumber) public view returns (address){
        return journals[_journalNumber].author;
    }

    function getJournalTitle(uint256 _journalNumber) public view returns (string){
        return journals[_journalNumber].title;
    }

    function getValue(uint256 _journalNumber) public view returns (uint256){
        return journals[_journalNumber].value;
    }

    function getJournalSubscriber(uint _journalNumber) public view returns (uint[]) {
        return journals[_journalNumber].subscribed;
    }

    function getReferenceJournal(uint _journalNumber) public view returns (uint256[]) {
        return journals[_journalNumber].reference_journal;
    }

    function getIsSubscribedJournal(uint _journalNumber) public view returns (bool) {
        return is_subscribed[msg.sender][_journalNumber];
    }

    function getUserSubscribedJournals() public view returns (uint[]) {
        return users[msg.sender].user_subscribe_journal;
    }    

    function getUserRegistedJournals() public view returns (uint[]) {
        return users[msg.sender].user_regist_journal;
    } 

    function getSignupCost() public view returns (uint256) {
        return signUpCost;
    }

    function getUpperboundValue() public view returns (uint256) {
        return upperbound_value;
    }

    function getLowerboundValue() public view returns (uint256) {
        return lowerbound_value;
    }

    function getAuthorShare() public view returns (uint256) {
        return author_share;
    }

    function setSignupCost(uint256 _signUpCost) public onlyOwner{
        signUpCost = _signUpCost;
    }

    function setUpperboundValue(uint256 _upperbound_value) public onlyOwner{
        upperbound_value = _upperbound_value;
    }

    function setLowerboundValue(uint256 _lowerbound_value) public onlyOwner{
        lowerbound_value = _lowerbound_value;
    }

    function setAuthorShare(uint256 _author_share) public onlyOwner{
        author_share = _author_share;
    } 
 }
