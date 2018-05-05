const JournalToken = artifacts.require("./Token/JournalToken.sol");
const OpenJournal = artifacts.require("./OpenJournal.sol")

const expect = require('chai').expect;

contract('OpenJournal', function(accounts) {

	let journalToken;
  let openJournal;

	let master = accounts[0];
  let register1 = accounts[1];
  let register2 = accounts[2];
  let subscriber1= accounts[3];
  let subscriber2= accounts[4];

  //let myjournals = [1,2,3];
  //let subscribers = [4,7,9];
  
  let journalNumber = 1;
  let journalRegisterAddress = register1;
  let journalTitle = 'Journal 1';
  let journalDescription = 'This is Journal 1';
  let journalValue = 10;
  //let journalSubscriber = subscribers;
  
  //let subscriberNumber = 1;
  //let subscriberAddress = subscriber;
  //let subscriberJournals = myjournals;

	beforeEach(async function () {
		journalToken = await JournalToken.new(0, "OJToken", 18, "OJ");   
    await journalToken.buyToken({from : master, value : 50}); 
    openJournal = await OpenJournal.new(0, 0, 30, 50);
	});

  it('should be possible to sign up', async function () {
    await openJournal.signUp(subscriber1, {from:master});    
    let result = await openJournal.signUp(subscriber2, {from:master});  
    let balance = await journalToken.balanceOf(master); 
/*
    let log_1 = result.logs[0];
    let from_1 = log_1.args._from;
    let to_1 = log_1.args._to;
    let value_1 = log_1.args._value;  
*/
    let log_2 = result.logs[0];
    let subscriber_number_2 = log_2.args._subscriber_number;
    let subscriber_address_2 = log_2.args._subscriber_address;
    let subscriber_journal_2 = log_2.args._subscriber_journal;
    let a1 = log_2.args.a;
    let b1 = log_2.args.b;
   

    console.log(a1.toString(), b1.toString(), subscriber_address_2.toString(), balance.toString());
    
    //expect(author_1.toString()).to.equal(accounts[1]);
    //expect(author_2.toString()).to.equal(accounts[2]);


  });

/*
  it('should be possible to regist journal', async function () {

    let result1 = await openJournal.registJournal(10, 'Journal 1', 'This is Journal 1', {from:register1});
    let result2 = await openJournal.registJournal(7, 'Journal 2', 'This is Journal 2', {from:register2});

    let log_1 = result1.logs[0];
    let number_1 = log_1.args._number;
    let author_1 = log_1.args._author;
    let title_1 = log_1.args._title;
    let value_1 = log_1.args._value;    

    let log_2 = result2.logs[0];
    let number_2 = log_2.args._number;
    let author_2 = log_2.args._author;
    let title_2 = log_2.args._title;
    let value_2 = log_2.args._value;

    console.log(author_1, number_1.toNumber());
    console.log(author_2, number_2.toNumber());
    
    expect(author_1.toString()).to.equal(accounts[1]);
    expect(author_2.toString()).to.equal(accounts[2]);
  });
 
  it('should be possible to subscribe journal', async function () {
    await openJournal.registJournal(20, 'Journal 1', 'This is Journal 1', {from:register1});
    await openJournal.registJournal(7, 'Journal 2', 'This is Journal 2', {from:register2});
    await openJournal.subscribeJournal(1, {from:subscriber});
    let subscribe = await openJournal.subscribeJournal(2, {from:subscriber});

    let log_1 = subscribe.logs[0];
    let from_1 = log_1.args._from;
    let to_1 = log_1.args._to;
    let value_1 = log_1.args._value;

    let log_2 = subscribe.logs[0];
    let subscriber_1 = log_2.args._subscriber;
    let myjournals_1 = log_2.args._myjournals;
    let subscribed_1 = log_2.args._subscribed;

   console.log(log_1);
    console.log(subscribed_1.toString());

    expect(from_1.toString()).to.equal(subscriber);
    expect(to_1.toString()).to.equal(register1);
    expect(value_1.toString()).to.equal('10');
    expect(subscriber_1.toString()).to.equal(subscriber);
    expect(myjournals_1.toString()).to.equal('1');
    
  });




  it('should be possible to show journals of subscriber', async function () {
    await journalToken.transfer(accounts[1], 23, {from: master});
    let balance = await journalToken.balanceOf.call(accounts[1]);
    expect(balance.toString()).to.equal('23');
  });

  it('should be possible to show subscribers of journal', async function () {
    await journalToken.transfer(accounts[1], 23, {from: master});
    let balance = await journalToken.balanceOf.call(accounts[1]);
    expect(balance.toString()).to.equal('23');
  });
  */
  

});
