var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

function buyJournalToken(){
    var value = document.getElementById("input_eth").value;
    value = value * 10**18;
    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data; // Wei로 단위 통일
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
        contracts.OpenJournal.deployed().then(function(instance){
            var user = getUserAccount();
            instance.buyToken(value, { from: subscriberAccount }); // wei 곱하기 추가
            alert("'이더->토큰' 거래가 시작되었습니다. \n예상 대기시간은 1분입니다.");
	    });
    });
}

function sellJournalToken(){
    var value = document.getElementById("input_OJ").value;
    value = value * 10**18; // Wei로 단위 통일
    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data;
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
        contracts.OpenJournal.deployed().then(function(instance){
            var user = getUserAccount();
            instance.sell(value, { from: subscriberAccount });
            alert("'토큰->이더' 거래가 진행중입니다.  \n예상 대기시간은 1분입니다.");
	    });
    });
}

function getUserAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}