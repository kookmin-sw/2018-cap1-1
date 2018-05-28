var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

function subscribeJournal(_id){

    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data;
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
        contracts.OpenJournal.deployed().then(function(instance){
        	var journalNumber = getJournalNumber();
        	var subscriberAccount = getSubscriberAccount();    
		instance.subscribeJournal(journalNumber, { from: subscriberAccount });
        	alert("subscriber : " + subscriberAccount + ", number : " + journalNumber + "\n구독이 완료되기까지 1분이 소요될 수 있습");
        	location.href ="subscribeState?data="+_id+",1,"+journalNumber;
	});
    });
    
}

function getJournalNumber(){
    var number = parseInt(document.getElementById("journal_number").value);
    console.log("number: " + number);
    console.log("type : "+ typeof(number));
    return number;
}

function getSubscriberAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}
