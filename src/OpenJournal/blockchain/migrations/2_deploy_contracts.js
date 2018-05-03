//var journalToken = artifacts.require("./Token/JournalToken.sol");
var openJournal = artifacts.require("./OpenJournal.sol");
//var safeMath = artifacts.require("./Math/SafeMath.sol");

module.exports = function(deployer) {
//	deployer.deploy(journalToken, 100000, "JournalToken", 18, "jt");
	deployer.deploy(openJournal, 0, 0, 100, 10);
//	deployer.deploy(safeMath);
}