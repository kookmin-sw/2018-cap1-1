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
			var obj = JSON.parse(JSON.stringify(data));
			// console.log(obj.check_state + " and " + obj.journal_number);
			checkContractState(obj["check_state"], obj["journal_number"]);
		},
		error: function(thrownError){
			console.log("error: " + thrownError);
		}
	});
	}, 3000);
});

function checkContractState(state, journalNumber){

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
                        blockSubscribeUpdate();
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
                instance.getIsJournalValid(journalNumber).then(function(res){
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
 
function getTransactionsByAccount(myaccount, startBlockNumber, endBlockNumber) {
  
  console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);

  for (var i = startBlockNumber; i <= endBlockNumber; i++) {
    if (i % 1000 == 0) {
      console.log("Searching block " + i);
    }
    console.log(i);
    var block;
    web3.eth.getBlock(i, function(error, result){
	if(!error){
		console.log(result);
		block = result;
	}
	else
		console.error(error);
    });
    if (block != null && block.transactions != null) {
      block.transactions.forEach( function(e) {
        if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
          console.log("  tx hash          : " + e.hash + "\n"
            + "   nonce           : " + e.nonce + "\n"
            + "   blockHash       : " + e.blockHash + "\n"
            + "   blockNumber     : " + e.blockNumber + "\n"
            + "   transactionIndex: " + e.transactionIndex + "\n"
            + "   from            : " + e.from + "\n" 
            + "   to              : " + e.to + "\n"
            + "   value           : " + e.value + "\n"
            + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
            + "   gasPrice        : " + e.gasPrice + "\n"
            + "   gas             : " + e.gas + "\n"
            + "   input           : " + e.input);
        }
      })
    }
  }
  alert("STOP");
}


async function blockEnrollUpdate(){
/*
	var startBlockNumber;
	var endBlockNumber;
	await web3.eth.getBlockNumber(function(error, result){
		if(!error){
			endBlockNumber = result;
                        console.log("Using endBlockNumber: " + endBlockNumber);
                        startBlockNumber = endBlockNumber - 5;
                        console.log("Using startBlockNumber: " + startBlockNumber);
                        getTransactionsByAccount(web3.eth.coinbase, startBlockNumber, endBlockNumber);
		}
                else
                        console.error(error);
        });
*/
	document.getElementById("loading_journal").style.display = "none";
  document.getElementById("complete_journal").style.display = "block";
  setTimeout(function(){
		console.log("setTimeout..");
		document.getElementById("complete_journal").style.display = "none";
    }, 3000)
	// alert("STOP !!!!!!!!!!!");
	location.href ="blockEnrollUpdate";
}

function blockSubscribeUpdate(){
	document.getElementById("loading_journal").style.display = "none";
        document.getElementById("complete_journal").style.display = "block";
        setTimeout(function(){
                console.log("setTimeout..");
                document.getElementById("complete_journal").style.display = "none";
        }, 3000)
        Materialize.toast('회원가입이 완료되었습니다. 새로 로그인을 해주시기 바랍니다.', 2000) // 4000 is the duration of the toast
        location.href ="blockSubscribeUpdate";
}

function getUserAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}
