const JournalToken = artifacts.require('./token/JournalToken.sol');

const expect = require('chai').expect;

contract('JournalToken Test', function(accounts) {

  let journalToken;
  let master = accounts[0];
  let buyer1 = accounts[1];
  let buyer2 = accounts[2];

  beforeEach(async function () {
    journalToken = await JournalToken.new(100000, "OJToken", 18, "OJ");
    await journalToken.buyToken({from : buyer1, value : 30});
    await journalToken.buyToken({from : buyer2, value : 20});
  });

  it('should be possible to transfer tokens', async function () {
    await journalToken.transfer(buyer1, 10000, {from: master});
    let balance = await journalToken.balanceOf.call(buyer1);
    expect(balance.toString()).to.equal('310000');
  });

  it("should return correct balances after transfer", async function () {
    await journalToken.transfer(buyer1, 10000, {from: master});
    let balance0 = await journalToken.balanceOf.call(master);
    expect(balance0.toString()).to.equal('90000');

    let balance1 = await journalToken.balanceOf.call(buyer1);
    expect(balance1.toString()).to.equal('310000');
  });

  it('should be possible to approve', async function () {
    await journalToken.approve(buyer1, 10000, {from: master});
    let balance = await journalToken.allowance.call(master, buyer1);
    expect(balance.toString()).to.equal('10000');
  });

  it('should be possible to transferFrom', async function () {
    await journalToken.approve(buyer1, 10000, {from: master});
    await journalToken.transferFrom(master, buyer2, 10000, {from: buyer1});
    let balance = await journalToken.balanceOf.call(buyer2);
    expect(balance.toString()).to.equal('210000');
  });

  it("should return the correct allowance amount after approval", async function () {
    let approve = await journalToken.approve(buyer1, 10000);
    let allowance = await journalToken.allowance.call(master, buyer1);

    assert.equal(allowance, 10000);
  });

  it("should return correct balances after transfering from another account", async function () {
    let approve = await journalToken.approve(buyer1, 10000);
    let transferFrom = await journalToken.transferFrom(master, buyer2, 10000, {from: buyer1});

    let balance0 = await journalToken.balanceOf.call(master);
    expect(balance0.toString()).to.equal('90000');

    let balance1 = await journalToken.balanceOf.call(buyer2);
    assert.equal(balance1, 210000);    

    let balance2 = await journalToken.balanceOf.call(buyer1);
    expect(balance2.toString()).to.equal('300000');
  }); 

  it("should return correct balances after sell tokens", async function () {
    let etherBalance1 = await journalToken.balanceOfEther.call(buyer1);
    let sell = await journalToken.sellToken(50000, {from: buyer1});
    let etherBalance2 = await journalToken.balanceOfEther.call(buyer1);
    let tokenBalence = await journalToken.balanceOf.call(buyer1);

    expect(tokenBalence.toString()).to.equal('250000');
    console.log(etherBalance1.toString());
    console.log(etherBalance2.toString());

    let log_1 = sell.logs[0];
    let msgValue_1 = log_1.args._msgValue;
    let amount_1 = log_1.args._amount;
    let totalSupply_1 = log_1.args._totalSupply;
    let msgSender_1 = log_1.args._msgSender;

    expect(msgValue_1.toString()).to.equal('50000');
    expect(amount_1.toString()).to.equal('5');
    expect(totalSupply_1.toString()).to.equal('550000');
    expect(msgSender_1.toString()).to.equal(buyer1);       
  });  
});
