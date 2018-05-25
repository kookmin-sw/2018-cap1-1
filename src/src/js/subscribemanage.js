var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

function subscribeJournal(callback){

    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data;
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
        contracts.OpenJournal.deployed().then(function(instance){
            var subscriber = getUserAccount();
            var journalNumber = getJournalNumber();
            instance.subscribeJournal(journalNumber, { from: subscriber });
            alert("subscriber : " + subscriber + ", number : " + journalNumber + "\n구독이 완료되기까지 1분이 소요될 수 있습니다.");
        });
    });
    
}

function getJournalNumber(){
    var number = document.getElementById("journal_number").value;
    return number;
}

function getUserAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}
