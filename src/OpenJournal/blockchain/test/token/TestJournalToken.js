const JournalToken = artifacts.require('./token/JournalToken.sol');

const expect = require('chai').expect;

contract('JournalToken Test', function(accounts) {

  let journalToken;
  let master = accounts[0];
  let buyer1 = accounts[1];
  let buyer2 = accounts[2];

  beforeEach(async function () {
    journalToken = await JournalToken.new(10000, "OJToken", 18, "OJ");
    await journalToken.buyToken({from : buyer1, value : 30});
    await journalToken.buyToken({from : buyer2, value : 20});
  });

  it('should be possible to transfer tokens', async function () {
    await journalToken.transfer(buyer1, 1000, {from: master});
    let balance = await journalToken.balanceOf.call(buyer1);
    expect(balance.toString()).to.equal('31000');
  });

  it("should return correct balances after transfer", async function () {
    await journalToken.transfer(buyer1, 1000, {from: master});
    let balance0 = await journalToken.balanceOf.call(master);
    expect(balance0.toString()).to.equal('9000');

    let balance1 = await journalToken.balanceOf.call(buyer1);
    expect(balance1.toString()).to.equal('31000');
  });

  it('should be possible to approve', async function () {
    await journalToken.approve(buyer1, 1000, {from: master});
    let balance = await journalToken.allowance.call(master, buyer1);
    expect(balance.toString()).to.equal('1000');
  });

  it('should be possible to transferFrom', async function () {
    await journalToken.approve(buyer1, 1000, {from: master});
    await journalToken.transferFrom(master, buyer2, 1000, {from: buyer1});
    let balance = await journalToken.balanceOf.call(buyer2);
    expect(balance.toString()).to.equal('21000');
  });

  it("should return the correct allowance amount after approval", async function () {
    let approve = await journalToken.approve(buyer1, 1000);
    let allowance = await journalToken.allowance.call(master, buyer1);

    assert.equal(allowance, 1000);
  });

  it("should return correct balances after transfering from another account", async function () {
    let approve = await journalToken.approve(buyer1, 1000);
    let transferFrom = await journalToken.transferFrom(master, buyer2, 1000, {from: buyer1});

    let balance0 = await journalToken.balanceOf.call(master);
    expect(balance0.toString()).to.equal('9000');

    let balance1 = await journalToken.balanceOf.call(buyer2);
    assert.equal(balance1, 21000);    

    let balance2 = await journalToken.balanceOf.call(buyer1);
    expect(balance2.toString()).to.equal('30000');
  });
});
