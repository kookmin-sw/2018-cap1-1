const JournalToken = artifacts.require("./Token/JournalToken.sol");
const OpenJournal = artifacts.require("./OpenJournal.sol")

const expe을t = require('chai').expect;

contract('OpenJournal Test', function(accounts) {

	let journalToken;
  let openJournal;
  let signup1;
  let signup2;
  let regist1;
  let regist2;  
  let subscribe1;
  let subscribe2;

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
    await openJournal.buyToken({from : master, value : 50});
    signup1 = await openJournal.signUp({from:subscriber1});
    signup2 = await openJournal.signUp({from:subscriber2});
    regist1 = await openJournal.registJournal(2017010020, 'Journal 1', 10, reference1, {from:register1}); 
    regist2 = await openJournal.registJournal(2018030120, 'Journal 2', 10, reference2, {from:register2});
    regist3 = await openJournal.registJournal(2018050006, 'Journal 3', 10, reference2, {from:register3});
    regist4 = await openJournal.registJournal(2018050012, 'Journal 4', 10, reference2, {from:register4});   
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
    
    let minibalance1 = await openJournal.balanceOfMini.call(accounts[1]); 
    let minibalance2 = await openJournal.balanceOfMini.call(accounts[2]); 
    let minibalance3 = await openJournal.balanceOfMini.call(accounts[3]); 
    let minibalance4 = await openJournal.balanceOfMini.call(accounts[4]);

    let log_1 = signup2.logs[0];
    let from_1 = log_1.args._from;
    let to_1 = log_1.args._to;
    let value_1 = log_1.args._value;  

    let log_2 = signup2.logs[1];
    let subscriber_number_2 = log_2.args._subscriber_number;
    let subscriber_address_2 = log_2.args._subscriber_address;
    let subscriber_journal_2 = log_2.args._subscriber_journal;

    expect(balance0.toString()).to.equal('49940');
    expect(balance1.toString()).to.equal('8');
    expect(balance2.toString()).to.equal('20');
    expect(balance3.toString()).to.equal('0');
    expect(balance4.toString()).to.equal('0');
    expect(balance5.toString()).to.equal('10');
    expect(balance6.toString()).to.equal('20');
    
    expect(minibalance1.toString()).to.equal('2');
    expect(minibalance2.toString()).to.equal('66');
    expect(minibalance3.toString()).to.equal('66');
    expect(minibalance4.toString()).to.equal('66');    

    expect(from_1.toString()).to.equal(accounts[0]);
    expect(to_1.toString()).to.equal(accounts[6]);
    expect(value_1.toString()).to.equal('30');

    expect(subscriber_number_2.toString()).to.equal('2');
    expect(subscriber_address_2.toString()).to.equal(accounts[6]);
    expect(subscriber_journal_2.toString()).to.equal('');
  });

  it('should be possible to regist journal', async function () {
    let log_1 = regist1.logs[0];
    let number_1 = log_1.args._number;
    let author_1 = log_1.args._author;
    let title_1 = log_1.args._title;
    let value_1 = log_1.args._value;
    let reference_1 = log_1.args._reference;    

    let log_2 = regist2.logs[0];
    let number_2 = log_2.args._number;
    let author_2 = log_2.args._author;
    let title_2 = log_2.args._title;
    let value_2 = log_2.args._value;
    let reference_2 = log_2.args._reference;

    expect(author_1.toString()).to.equal(accounts[1]);
    expect(author_2.toString()).to.equal(accounts[2]);
    expect(reference_1.toString()).to.equal('2018030120,2018050006,2018050012');
    expect(reference_2.toString()).to.equal('');
  });

  it('should be possible to subscribe1 journal', async function () {
    let log_1 = subscribe1.logs[0];
    let msgSender_1 = log_1.args._msgSender;
    let token_1 = log_1.args._token;
    let mini_token_1 = log_1.args._mini_token;

    let log_2 = subscribe1.logs[1];
    let msgSender_2 = log_2.args._msgSender;
    let token_2 = log_2.args._token;
    let mini_token_2 = log_2.args._mini_token;

    let log_3 = subscribe1.logs[2];
    let from_3 = log_3.args._from;
    let to_3 = log_3.args._to;
    let value_3 = log_3.args._value;
    let mini_value_3 = log_3.args._mini_value;

    let log_12 = subscribe1.logs[12];
    let subscriber_12 = log_12.args._subscriber;
    let myjournals_12 = log_12.args._myjournals;
    let subscribed_12 = log_12.args._subscribed;
    let is_subscribed_12 = log_12.args._is_subscribed;
    let author_value_12 = log_12.args._author_value;
    let author_mini_token_12 = log_12.args._author_mini_token;
    let ref_value_12 = log_12.args._ref_value;
    let reference_mini_token_12 = log_12.args._reference_mini_token;

    expect(msgSender_1.toString()).to.equal(subscriber1);
    expect(token_1.toString()).to.equal('0');
    expect(mini_token_1.toString()).to.equal('3000');

    expect(msgSender_2.toString()).to.equal(subscriber1);
    expect(token_2.toString()).to.equal('29');
    expect(mini_token_2.toString()).to.equal('34');

    expect(from_3.toString()).to.equal(subscriber1);
    expect(to_3.toString()).to.equal(register2);
    expect(value_3.toString()).to.equal('0');
    expect(mini_value_3.toString()).to.equal('66');

    expect(subscriber_12.toString()).to.equal(subscriber1);
    expect(myjournals_12.toString()).to.equal('2017010020');
    expect(subscribed_12.toString()).to.equal('1');
    expect(is_subscribed_12.toString()).to.equal('true');
    expect(author_value_12.toString()).to.equal('8');
    expect(author_mini_token_12.toString()).to.equal('2');
    expect(ref_value_12.toString()).to.equal('0');
    expect(reference_mini_token_12.toString()).to.equal('66');
  });

  it('should be possible to subscribe2 journal', async function () {
    let log_1 = subscribe2.logs[0];
    let msgSender_1 = log_1.args._msgSender;
    let token_1 = log_1.args._token;
    let mini_token_1 = log_1.args._mini_token;

    let log_2 = subscribe2.logs[1];
    let msgSender_2 = log_2.args._msgSender;
    let token_2 = log_2.args._token;
    let mini_token_2 = log_2.args._mini_token;

    let log_3 = subscribe2.logs[2];
    let from_3 = log_3.args._from;
    let to_3 = log_3.args._to;
    let value_3 = log_3.args._value;
    let mini_value_3 = log_3.args._mini_value;

    let log_4 = subscribe2.logs[3];
    let subscriber_4 = log_4.args._subscriber;
    let myjournals_4 = log_4.args._myjournals;
    let subscribed_4 = log_4.args._subscribed;
    let is_subscribed_4 = log_4.args._is_subscribed;
    let author_value_4 = log_4.args._author_value;
    let author_mini_token_4 = log_4.args._author_mini_token;
    let ref_value_4 = log_4.args._ref_value;
    let reference_mini_token_4 = log_4.args._reference_mini_token;

    expect(msgSender_1.toString()).to.equal(subscriber1);
    expect(token_1.toString()).to.equal('0');
    expect(mini_token_1.toString()).to.equal('2000');

    expect(msgSender_2.toString()).to.equal(subscriber1);
    expect(token_2.toString()).to.equal('10');
    expect(mini_token_2.toString()).to.equal('0');

    expect(from_3.toString()).to.equal(subscriber1);
    expect(to_3.toString()).to.equal(register2);
    expect(value_3.toString()).to.equal('10');
    expect(mini_value_3.toString()).to.equal('0');

    expect(subscriber_4.toString()).to.equal(subscriber1);
    expect(myjournals_4.toString()).to.equal('2017010020,2018030120');
    expect(subscribed_4.toString()).to.equal('1');
    expect(is_subscribed_4.toString()).to.equal('true');
    expect(author_value_4.toString()).to.equal('10');
    expect(author_mini_token_4.toString()).to.equal('0');
    expect(ref_value_4.toString()).to.equal('0');
    expect(reference_mini_token_4.toString()).to.equal('0');
  });
/*
  it('should be possible get journal register', async function() {
    get_auth = await openJournal.getAuthorAddress(1);
    let log_1 = get_auth.logs[0];
    let number_1 = log_1.args._number;
    let author_1 = log_1.args._author;

    expect(number_1.toString()).to.equal('1');
    expect(author_1.toString()).to.equal(register1);
  })

  it('should be possible get journal value', async function() {
    get_value = await openJournal.getValue(1);
    let log_1 = get_value.logs[0];
    let number_1 = log_1.args._number;
    let value_1 = log_1.args._value;

    expect(number_1.toString()).to.equal('1');
    expect(value_1.toString()).to.equal('10');
  })

  it('should be possible to show journals of subscriber', async function () {
    let result1 = await openJournal.showSubscribedJournal({from:subscriber1});
    let result2 = await openJournal.showSubscribedJournal({from:subscriber2});

    expect(result1.toString()).to.equal('1,2');
    expect(result2.toString()).to.equal('2');
  });

  it('should be possible to show subscribers of journal', async function () {
    let result1 = await openJournal.showJournalSubscriber(1);
    let result2 = await openJournal.showJournalSubscriber(2);

    expect(result1.toString()).to.equal('1');
    expect(result2.toString()).to.equal('1,2');
  }); 
*/
});
