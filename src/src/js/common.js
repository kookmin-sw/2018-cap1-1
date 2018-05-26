var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

$(document).ready(function () {
		var _id = document.getElementById("userId").value;
		console.log(_id);
    setInterval(function() {
            $.ajax({
		url: "http://openjournal.io/checkMyState",
		type: "POST",
		cache: false,
		data: {userId: _id},
		dataType: "json",
		success: function(data){
			console.log("success!");
			console.log(data);
			//var obj = JSON.parse(data);
			//console.log(obj["check_state"] + " and " + obj["journal_number"]);
			//checkContractState(obj["check_state"], obj["journal_number"]);
		},
		error: function(thrownError){
			console.log("error: " + thrownError);
		}
	});
	}, 3000);
});

function checkContractState(state, journalNumber){

	console.log("checkContractState : " + state);
    if(state  == 0){
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
                var subscriber = getUserAccount();
                instance.getIsSubscribedJournal(journalNumber, {from: subscriber}).then(function(res){
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
		console.log("start getIsJournalValid");
                instance.getIsJournalValid(journalNumber).then(function(res){
			console.log(res);
                    if(res == false){
                        document.getElementById("loading_journal").style.display = "block";
                    }
                    else{
                        blockEnrollUpdate();
                    }
                });
            });
        });
    }
}

function blockEnrollUpdate(){
	document.getElementById("loading_journal").style.display = "none";
        document.getElementById("complete_journal").style.display = "block";
        setTimeout(function(){
		console.log("setTimeout..");
		document.getElementById("complete_journal").style.display = "none";
        }, 3000)
	location.href ="blockEnrollUpdate";
}

function getUserAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}
