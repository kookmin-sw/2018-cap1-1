var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

$(document).ready(function () {
    $.ajax({
        url: "http://13.125.245.69/checkMyState",
        dataType: 'json',
        type: "get",
        success:function(data){
            checkContractState(data);
        }
	});
});

function checkContractState(info){

    var state = info["check_state"];

    if(state == 0){
        // 아무 트랜잭션이 생성되지 않은 경우
        return;
    }
    else if(state == 1){
        // 구독 트랜잭션이 생성되어 대기하는 경우
        $.getJSON("OpenJournal.json", function(data){
            var Artifact = data;
            contracts.OpenJournal = TruffleContract(Artifact);
            contracts.OpenJournal.setProvider(web3Provider);
            contracts.OpenJournal.deployed().then(function(instance){
                //loading 중일 때 써야하는 것 (첫줄에)
                var journal_number = info["journal_number"];
                var subscriber = getUserAccount();
                instance.getIsSubscribedJournal(journal_number, {from: subscriber}).then(function(res){
                    if(res == false){
                        document.getElementById("loading_journal").style.display = "block";
                    }
                    else{
                        completeState();
                    }
                });
            });
        });     
    }
    else if(state == 2){
        // 회원가입 트랜잭션이 생성되어 대기하는 경우
        $.getJSON("OpenJournal.json", function(data){
            var Artifact = data;
            contracts.OpenJournal = TruffleContract(Artifact);
            contracts.OpenJournal.setProvider(web3Provider);
            contracts.OpenJournal.deployed().then(function(instance){
                var newmember = getUserAccount();
                instance.getIsUserValid({from: newmember}).then(function(res){
                    if(res == false){
                        document.getElementById("loading_journal").style.display = "block";
                    }
                    else{
                        completeState();
                    }
                });
            });
        });
    }
    else if(state == 3){
        // 논문 최종 등록 트랜잭션이 생성되어 대기하는 경우
        $.getJSON("OpenJournal.json", function(data){
            var Artifact = data;
            contracts.OpenJournal = TruffleContract(Artifact);
            contracts.OpenJournal.setProvider(web3Provider);
            contracts.OpenJournal.deployed().then(function(instance){
                var journal_number = info["journal_number"];
                instance.getIsJournalValid(journal_number).then(function(res){
                    if(res == false){
                        document.getElementById("loading_journal").style.display = "block";
                    }
                    else{
                        completeState();
                    }
                });
            });
        });
    }
}

function completeState(){

    $.ajax({
        url: "http://13.125.245.69/completeState",
        dataType: "json",
        type: "post",
        success: function (data) {
            document.getElementById("loading_journal").style.display = "none";
            document.getElementById("complete_journal").style.display = "block";
            setTimeout(function(){
                document.getElementById("complete_journal").style.display = "none";
            }, 3000)
        }
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