var openJournal = artifacts.require("./OpenJournal.sol");

module.exports = function(deployer) {
	deployer.deploy(openJournal, 0, 0, 100, 10);
}