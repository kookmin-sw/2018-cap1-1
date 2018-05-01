var journalToken = artifacts.require("./JournalToken.sol");

module.exports = function(deployer) {
	deployer.deploy(journalToken);
}