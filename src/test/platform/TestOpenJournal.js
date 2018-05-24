const OpenJournal = artifacts.require("./OpenJournal.sol")

const expect = require('chai').expect;
//decimasl가 18인 경우 테스트시 값이 너무 커지므로 decimals가 4인 경우로 가정하여 테스트하였습니다. JournalToken과 OpenJournal도 실제 deploy시 바꿔줘야합니다.
contract('OpenJournal Test', function(accounts) {

    let openJournal;
    let signup1, signup2, signup3;
    let regist1, regist2, regist3, regist4, regist5;
    let subscribe1, subscribe2, subscribe3;

    let master = accounts[0];
    let register1 = accounts[1];
    let register2 = accounts[2];
    let register3 = accounts[3];
    let register4 = accounts[4];
    let subscriber1= accounts[5];
    let subscriber2= accounts[6];

    let reference1 = [2018030120,2018050006,2018050012];
    let reference2 = [];

	beforeEach(async function () {       
        openJournal = await OpenJournal.new(0, 30, 10, 5, 80);
        await openJournal.buyToken({from : master, value : 5});
        signup1 = await openJournal.signUp({from:subscriber1});
        signup2 = await openJournal.signUp({from:subscriber2});
        signup3 = await openJournal.signUp({from:register1});
        signup4 = await openJournal.signUp({from:register2});
        signup5 = await openJournal.signUp({from:register3});
        signup6 = await openJournal.signUp({from:register4});
        regist1 = await openJournal.registJournal(2017010020, 'Journal 1', 10, reference1, {from:register1});   
        regist2 = await openJournal.registJournal(2018030120, 'Journal 2', 10, reference2, {from:register2});
        regist3 = await openJournal.registJournal(2018050006, 'Journal 3', 10, reference2, {from:register3});
        regist4 = await openJournal.registJournal(2018050012, 'Journal 4', 10, reference2, {from:register4});   
        regist5 = await openJournal.registJournal(2018050032, 'Journal 5', 10, reference2, {from:register1});
        subscribe1 = await openJournal.subscribeJournal(2017010020, {from:subscriber1});
        subscribe2 = await openJournal.subscribeJournal(2018030120, {from:subscriber1});
        subscribe3 = await openJournal.subscribeJournal(2018030120, {from:subscriber2});  
	});

    it('should be possible to sign up', async function () {
        let balance0 = await openJournal.balanceOf.call(accounts[0]);
        let balance1 = await openJournal.balanceOf.call(accounts[1]);
        let balance2 = await openJournal.balanceOf.call(accounts[2]);
        let balance3 = await openJournal.balanceOf.call(accounts[3]); 
        let balance4 = await openJournal.balanceOf.call(accounts[4]); 
        let balance5 = await openJournal.balanceOf.call(accounts[5]); 
        let balance6 = await openJournal.balanceOf.call(accounts[6]);

        let log_1 = signup2.logs[0];
        let from_1 = log_1.args._from;
        let to_1 = log_1.args._to;
        let value_1 = log_1.args._value;  

        let log_2 = signup2.logs[1];
        let user_number_2 = log_2.args._user_number;
        let user_address_2 = log_2.args._user_address;
        let user_subscribe_journal_2 = log_2.args._user_subscribe_journal;
        let user_regist_journal_2 = log_2.args._user_regist_journal;
        let is_user_2 = log2.args._is_user;    

        expect(balance0.toString()).to.equal('498200000');
        expect(balance1.toString()).to.equal('380002');
        expect(balance2.toString()).to.equal('506666');
        expect(balance3.toString()).to.equal('306666');
        expect(balance4.toString()).to.equal('306666');
        expect(balance5.toString()).to.equal('100000');
        expect(balance6.toString()).to.equal('200000');
        
        expect(from_1.toString()).to.equal(accounts[0]);
        expect(to_1.toString()).to.equal(accounts[6]);
        expect(value_1.toString()).to.equal('300000');

        expect(user_number_2.toString()).to.equal('2');
        expect(user_address_2.toString()).to.equal(accounts[6]);
        expect(user_subscribe_journal_2.toString()).to.equal('');
        expect(user_regist_journal_2.toString()).to.equal('');
        expect(is_user_2.toString()).to.equal('true');
    
    });

    it('should be possible to regist journal', async function () {
        let log_1 = regist1.logs[0];
        let number_1 = log_1.args._number;
        let author_1 = log_1.args._author;
        let title_1 = log_1.args._title;
        let value_1 = log_1.args._value;
        let reference_journal_1 = log_1.args._reference_journal;    
        let user_regist_journal_1 = log_1.args._user_regist_journal;

        let log_2 = regist2.logs[0];
        let number_2 = log_2.args._number;
        let author_2 = log_2.args._author;
        let title_2 = log_2.args._title;
        let value_2 = log_2.args._value;
        let reference_journal_2 = log_2.args._reference_journal;
        let user_regist_journal_2 = log_2.args._user_regist_journal;

        let log_5 = regist5.logs[0];
        let number_5 = log_5.args._number;
        let author_5 = log_5.args._author;
        let title_5 = log_5.args._title;
        let value_5 = log_5.args._value;
        let reference_journal_5 = log_5.args._reference_journal;
        let user_regist_journal_5 = log_5.args._user_regist_journal;

        expect(author_1.toString()).to.equal(accounts[1]);
        expect(author_2.toString()).to.equal(accounts[2]);
        expect(author_5.toString()).to.equal(accounts[1]);
        expect(reference_journal_1.toString()).to.equal('2018030120,2018050006,2018050012');
        expect(reference_journal_2.toString()).to.equal('');
        expect(reference_journal_5.toString()).to.equal('');
        expect(user_regist_journal_1.toString()).to.equal('2017010020');
        expect(user_regist_journal_2.toString()).to.equal('2018030120');
        expect(user_regist_journal_5.toString()).to.equal('2017010020,2018050032');
    });

    it('should be possible to subscribe1 journal', async function () {
        let log_1 = subscribe1.logs[0];
        let from_1 = log_1.args._from;
        let to_1 = log_1.args._to;
        let value_1 = log_1.args._value;

        let log_2 = subscribe1.logs[3];
        let from_2 = log_2.args._from;
        let to_2 = log_2.args._to;
        let value_2 = log_2.args._value;

        let log_4 = subscribe1.logs[4];
        let subscriber_4 = log_4.args._subscriber;
        let myjournals_4 = log_4.args._myjournals;
        let subscribed_4 = log_4.args._subscribed;
        let is_subscribed_4 = log_4.args._is_subscribed;
        let author_value_4 = log_4.args._author_value;
        let ref_value_4 = log_4.args._ref_value;

        expect(from_1.toString()).to.equal(subscriber1);
        expect(to_1.toString()).to.equal(register2);
        expect(value_1.toString()).to.equal('6666');

        expect(from_2.toString()).to.equal(subscriber1);
        expect(to_2.toString()).to.equal(register1);
        expect(value_2.toString()).to.equal('80002');    

        expect(subscriber_4.toString()).to.equal(subscriber1);
        expect(myjournals_4.toString()).to.equal('2017010020');
        expect(subscribed_4.toString()).to.equal('1');
        expect(is_subscribed_4.toString()).to.equal('true');
        expect(author_value_4.toString()).to.equal('80002');
        expect(ref_value_4.toString()).to.equal('6666');
    });

    it('should be possible to subscribe2 journal', async function () {
        let log_1 = subscribe2.logs[0];
        let from_1 = log_1.args._from;
        let to_1 = log_1.args._to;
        let value_1 = log_1.args._value;

        let log_2 = subscribe2.logs[1];
        let subscriber_2 = log_2.args._subscriber;
        let myjournals_2 = log_2.args._myjournals;
        let subscribed_2 = log_2.args._subscribed;
        let is_subscribed_2 = log_2.args._is_subscribed;
        let author_value_2 = log_2.args._author_value;
        let ref_value_2 = log_2.args._ref_value;

        expect(from_1.toString()).to.equal(subscriber1);
        expect(to_1.toString()).to.equal(register2);
        expect(value_1.toString()).to.equal('100000');

        expect(subscriber_2.toString()).to.equal(subscriber1);
        expect(myjournals_2.toString()).to.equal('2017010020,2018030120');
        expect(subscribed_2.toString()).to.equal('1');
        expect(is_subscribed_2.toString()).to.equal('true');
        expect(author_value_2.toString()).to.equal('100000');
        expect(ref_value_2.toString()).to.equal('0');
    });
});
