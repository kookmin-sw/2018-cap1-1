var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

$(document).ready(function () {
    var state;
    $.ajax({
        url: "http://13.125.245.69/checkMyState",
        dataType: 'json',
        type: "get",
        success:function(data){
            state = data["check_state"];
            checkContractState(state);
        }
	});
});

function checkContractState(_checkState){

    if(_checkState == 0){
        // 아무 트랜잭션이 생성되지 않은 경우
        return;
    }
    else if(_checkState == 1){
        // 구독 트랜잭션이 생성되어 대기하는 경우
        $.getJSON("OpenJournal.json", function(data){
            var Artifact = data;
            contracts.OpenJournal = TruffleContract(Artifact);
            contracts.OpenJournal.setProvider(web3Provider);
            contracts.OpenJournal.deployed().then(function(instance){
                //loading 중일 때 써야하는 것 (첫줄에)
                document.getElementById("loading_journal").style.display = "block";
                alert("구독이 완료되기까지 1분이 소요될 수 있습니다.");
            });
        });     
    }
    else if(_checkState == 2){
        // 회원가입 트랜잭션이 생성되어 대기하는 경우
        $.getJSON("OpenJournal.json", function(data){
            var Artifact = data;
            contracts.OpenJournal = TruffleContract(Artifact);
            contracts.OpenJournal.setProvider(web3Provider);
            contracts.OpenJournal.deployed().then(function(instance){
                document.getElementById("loading_journal").style.display = "block";
                alert("회원가입이 완료되기까지 1분이 소요될 수 있습니다.");
            });
        });
    }
    else if(_checkState == 3){
        // 논문 최종 등록 트랜잭션이 생성되어 대기하는 경우
        $.getJSON("OpenJournal.json", function(data){
            var Artifact = data;
            contracts.OpenJournal = TruffleContract(Artifact);
            contracts.OpenJournal.setProvider(web3Provider);
            contracts.OpenJournal.deployed().then(function(instance){
                document.getElementById("loading_journal").style.display = "block";
                alert("논문 등록이 완료되기까지 1분이 소요될 수 있습니다.");
            });
        });
    }
    else if(_checkState == 4){
        // 트랜잭션이 블록에 정상적으로 올라간 경우
        document.getElementById("loading_journal").style.display = "none";
        document.getElementById("complete_journal").style.display = "block";
        setTimeout(function(){
            document.getElementById("complete_journal").style.display = "none";
        }, 3000);
    }
    else{
        
    }
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