const JournalToken = artifacts.require('./token/JournalToken.sol');

const expect = require('chai').expect;

contract('JournalToken Test', function(accounts) {

  let journalToken;
  let master = accounts[0];

  beforeEach(async function () {
    journalToken = await JournalToken.new(100, "OJToken", 18, "OJ");
    await journalToken.buyToken({from : master, value : 50});
  });

  it('should be possible to transfer tokens', async function () {
    await journalToken.transfer(accounts[1], 23, {from: master});
    let balance = await journalToken.balanceOf.call(accounts[1]);
    expect(balance.toString()).to.equal('23');
  });

  it("should return correct balances after transfer", async function () {
    await journalToken.transfer(accounts[1], 100);
    let balance0 = await journalToken.balanceOf(accounts[0]);
    expect(balance0.toString()).to.equal('50000');

    let balance1 = await journalToken.balanceOf(accounts[1]);
    expect(balance1.toString()).to.equal('100');
  });

  it('should be possible to approve', async function () {
    await journalToken.approve(accounts[1], 23, {from: accounts[0]});
    let balance = await journalToken.allowance.call(accounts[0], accounts[1]);
    expect(balance.toString()).to.equal('23');
  });

  it('should be possible to transferFrom', async function () {
    await journalToken.approve(accounts[1], 23, {from: accounts[0]});
    await journalToken.transferFrom(accounts[0], accounts[2], 23, {from: accounts[1]});
    let balance = await journalToken.balanceOf.call(accounts[2]);
    expect(balance.toString()).to.equal('23');
  });

  it("should return the correct allowance amount after approval", async function () {
    let approve = await journalToken.approve(accounts[1], 100);
    let allowance = await journalToken.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 100);
  });

  it("should return correct balances after transfering from another account", async function () {
    let approve = await journalToken.approve(accounts[1], 100);
    let transferFrom = await journalToken.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

    let balance0 = await journalToken.balanceOf(accounts[0]);
    expect(balance0.toString()).to.equal('50000');

    let balance1 = await journalToken.balanceOf(accounts[2]);
    assert.equal(balance1, 100);    

    let balance2 = await journalToken.balanceOf(accounts[1]);
    expect(balance2.toString()).to.equal('0');
  });
});
