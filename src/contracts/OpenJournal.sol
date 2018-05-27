pragma solidity ^0.4.21;

import "./Token/JournalToken.sol";

contract OpenJournal is JournalToken(200000, "Journal Token", 18, "jt") {
    
    struct Journal {
        uint256 number;
        address author;
        string title;
        uint256 author_share;
        uint256 value;
        uint256 reference_count;
        uint[] subscribed;
        uint[] reference_journal;
        uint256[] contributors;
        uint256[] contributors_share;
        bool final_enroll;
    }

    struct User {
        uint256 user_number;                    
        address user_address;                   
        uint[] user_subscribe_journal;          
        uint[] user_regist_journal;
        bool is_user;             
    }    

    mapping (uint256 => Journal) public journals;                               
    mapping (uint256 => User) public users_by_number;
    mapping (address => User) public users_by_address;                                     

    mapping (address => mapping (uint => bool)) public is_subscribed;           

    uint256 public userNumber;               
    uint256 public signUpCost;               
    uint256 public upperbound_value;         
    uint256 public lowerbound_value;             
    
    uint user_num;

    event LogSignUp(
        uint256 _user_number, 
        address _user_address, 
        uint[] _user_subscribe_journal,
        uint[] _user_regist_journal,
        bool _is_user
    );  

    event LogRegistJournal(
        uint256 _number, 
        address _author, 
        string _title,
        uint256 _author_share,
        uint256 _value,
        uint[] _reference_journal,
        uint256[] _contributors,
        uint256[] _contributors_share        
    );  

    event LogSubscribeJournal(
        address _subscriber, 
        uint[] _myjournals, 
        uint[] _subscribed,
        bool _is_subscribed,
        uint256 _author_value
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
        uint256 _lowerbound_value
    ) public {
        userNumber = _userNumber;
        signUpCost = _signUpCost.mul(10**uint256(decimals));        // 테스트 값 signUpCost = _signUpCost.mul(10**uint256(4));
        upperbound_value = _upperbound_value;
        lowerbound_value = _lowerbound_value;
    }

    function signUp() public returns (bool) {
        userNumber = userNumber.add(1); 
        users_by_number[userNumber] = User(
            userNumber,
            msg.sender,
            new uint[](0),
            new uint[](0),
            true
        );

        users_by_address[msg.sender] = User(
            userNumber,
            msg.sender,
            new uint[](0),
            new uint[](0),
            true
        );
        transferFromOwner(msg.sender, signUpCost);   

        emit LogSignUp(
            userNumber, 
            msg.sender, 
            users_by_address[msg.sender].user_subscribe_journal, 
            users_by_address[msg.sender].user_regist_journal,
            users_by_address[msg.sender].is_user
        );

        return true;
    }

    function registJournal(uint256 _journal_number, 
                    string _title, 
                    uint256 _author_share, 
                    uint _journal_value, 
                    uint256[] _reference_journal,
                    uint256[] _contributors,
                    uint256[] _contributors_share
        ) public returns (bool) {

        require(_journal_value <= upperbound_value && _journal_value >= lowerbound_value);
    
        journals[_journal_number] = Journal(
            _journal_number,
            msg.sender,
            _title,
            _author_share,
            _journal_value.mul(10**uint256(decimals)),     // 테스트 값 _journal_value.mul(10**uint256(4))
            0,
            new uint[](0),
            new uint[](0),
            new uint[](0),
            new uint256[](0),
            true
        );

        for(uint256 ref = 0; ref <_reference_journal.length; ++ref)
            journals[_journal_number].reference_journal.push(_reference_journal[ref]);

        for(uint256 cont = 0; cont <_contributors.length; ++cont){
            journals[_journal_number].contributors.push(_contributors[cont]);
            journals[_journal_number].contributors_share.push(_contributors_share[cont]);
        }

        users_by_address[msg.sender].user_regist_journal.push(_journal_number);    

        emit LogRegistJournal(
            _journal_number,
            msg.sender,
            _title,
            _author_share,
            _journal_value,
            _reference_journal,
            _contributors,
            _contributors_share            
        );  
 
        return true;    
    }

    function subscribeJournal(uint256 _journal_number) public returns (bool){
        require(is_subscribed[msg.sender][_journal_number] == false); 

        uint256 author_token;
        uint256 contributor_token;
        uint256 contributor_each_token;               
        uint256 contributor_num = journals[_journal_number].contributors.length;        

        if(contributor_num == 0){
            author_token = journals[_journal_number].value;
        } else{
            uint256 author_share = journals[_journal_number].author_share;
            author_token = journals[_journal_number].value.mul(author_share).div(100);

            for(uint256 cont=0; cont < contributor_num; cont++){
                uint256 contributor_number = journals[_journal_number].contributors[cont];
                uint256 contributor_share = journals[_journal_number].contributors_share[cont];

                contributor_each_token = journals[_journal_number].value.mul(contributor_share).div(100);
                transfer(users_by_number[contributor_number].user_address, contributor_each_token);
            }
        }

        transfer(journals[_journal_number].author, author_token); 

        user_num = users_by_address[msg.sender].user_number;

        users_by_address[msg.sender].user_subscribe_journal.push(_journal_number);  
        journals[_journal_number].subscribed.push(user_num);       
        is_subscribed[msg.sender][_journal_number] = true;

        upReferenceCount(_journal_number);

        emit LogSubscribeJournal(
            msg.sender, 
            users_by_address[msg.sender].user_subscribe_journal, 
            journals[_journal_number].subscribed, 
            is_subscribed[msg.sender][_journal_number],
            author_token
        );

        return true;
    }

    function upReferenceCount(uint256 _journal_number) internal returns (bool) {
        uint256 reference_num = journals[_journal_number].reference_journal.length;
        uint256 reference_journal_num; 

        for(uint256 ref=0; ref < reference_num; ref++){
            reference_journal_num = journals[_journal_number].reference_journal[ref];
            journals[reference_journal_num].reference_count++;
        }

        return true;
    }

    function getIsJournalValid(uint _journal_number) public view returns (bool) {
        return journals[_journal_number].final_enroll;
    }

    function getAuthorAddress(uint256 _journal_number) public view returns (address){
        return journals[_journal_number].author;
    }

    function getJournalTitle(uint256 _journal_number) public view returns (string){
        return journals[_journal_number].title;
    }

    function getValue(uint256 _journal_number) public view returns (uint256){
        return journals[_journal_number].value;
    }

    function getJournalSubscriber(uint _journal_number) public view returns (uint[]) {
        return journals[_journal_number].subscribed;
    }

    function getReferenceJournal(uint _journal_number) public view returns (uint256[]) {
        return journals[_journal_number].reference_journal;
    }    

    function getIsSubscribedJournal(uint _journal_number) public view returns (bool) {
        return is_subscribed[msg.sender][_journal_number];
    }

    function getAuthorShare(uint _journal_number) public view returns (uint256) {
        return journals[_journal_number].author_share;
    }

    function getReferenceCount(uint _journal_number) public view returns (uint256) {
        return journals[_journal_number].reference_count;
    }

    function getContributors(uint _journal_number) public view returns (uint256[]) {
        return journals[_journal_number].contributors;
    }

    function getContributorsShare(uint _journal_number) public view returns (uint256[]) {
        return journals[_journal_number].contributors_share;
    }

    function getIsUserValid() public view returns (bool) {
        return users_by_address[msg.sender].is_user;
    }

    function getUserSubscribedJournals() public view returns (uint[]) {
        return users_by_address[msg.sender].user_subscribe_journal;
    }    

    function getUserRegistedJournals() public view returns (uint[]) {
        return users_by_address[msg.sender].user_regist_journal;
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
    
    function setSignupCost(uint256 _signUpCost) public onlyOwner{
        signUpCost = _signUpCost;
    }

    function setUpperboundValue(uint256 _upperbound_value) public onlyOwner{
        upperbound_value = _upperbound_value;
    }

    function setLowerboundValue(uint256 _lowerbound_value) public onlyOwner{
        lowerbound_value = _lowerbound_value;
    }

    function setAuthorShare(uint _journal_number, uint _author_share) public {
        journals[_journal_number].author_share = _author_share;
    }

    function setContributors(uint _journal_number, uint256[] _contributors) public {
        journals[_journal_number].contributors = _contributors;
    }

    function setContributorsShare(uint _journal_number, uint256[] _contributors_share) public {
        uint256 new_length = _contributors_share.length;
        uint256 new_total;

        for(uint i=0; i<new_length; i++)
            new_total = new_total.add(_contributors_share[i]);

        require(new_total == 100);

        journals[_journal_number].contributors_share = _contributors_share;
    }   
 }
