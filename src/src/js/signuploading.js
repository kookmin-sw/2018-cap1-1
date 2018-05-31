$(document).ready(function () {
    var web3Provider;
    var contracts = {};

    if(typeof web3 !== "undefined"){
        web3Provider = web3.currentProvider;
    }else {
        web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
    }
    web3 = new Web3(web3Provider);

    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data;
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
    	contracts.OpenJournal.deployed().then(async function(instance){
            var newUser = getUserAccount();
            console.log(newUser);
            await instance.signUp({from: newUser}).then(function(tx){
		console.log(tx.receipt);
		console.log(tx.receipt.transactionHash);
		console.log(tx.receipt.blockNumber);
		console.log(tx.receipt.from);
		alert(tx.receipt.from);
	    });
        });
    });

    setInterval(function() {
        $.getJSON("OpenJournal.json", function(data){
            var Artifact = data;
            contracts.OpenJournal = TruffleContract(Artifact);
            contracts.OpenJournal.setProvider(web3Provider);
            contracts.OpenJournal.deployed().then(function(instance){
                var newmember = getUserAccount();
                instance.getIsUserValid({from: newmember}).then(function(res){
                    console.log(res);
                    if(res == true){
                        location.href ="/";
                    }
                });
            });
        });
	}, 3000);
});

function getUserAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}
