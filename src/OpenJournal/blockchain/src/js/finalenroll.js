var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

function finalEnroll(){
    var value = document.getElementById("journal_price").value;
    var title = document.getElementById("journal_title").innerText;
    var description = document.getElementById("journal_abstract").innerText;
    var referenceList = []; // 현재는 논문의 번호를 이용하여 실행됨
    
    $("span[name=OJjournal]").each(function(idx){   
        var referenceJournal = $(this).html(); 
        referenceList.push(referenceJournal);
    });
    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data;
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
        contracts.OpenJournal.deployed().then(function(instance){
            var author = getAuthorAccount();
            instance.registJournal(value, title, description, referenceList, { from: author });
            console.log(instance);
        });
    })

    alert("논문 가격 : " + value + "\n" + "논문 제목 : " + title + "\n" + "논문 요약 : " + description + "\n정상 등록되었습니다.");
}

function getAuthorAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}
