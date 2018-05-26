var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

function finalEnroll(_id, journalNum){
    var value = document.getElementById("journal_price").value;
    var title = document.getElementById("journal_title").innerText;
    var referenceList = []; // 현재는 논문의 번호를 이용하여 실행됨
    alert("id: " + _id + "\njournalNumber: " + journalNum);
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
            instance.registJournal(journalNum, title, value, referenceList, { from: author });
            console.log(instance);
		location.href ="enrollState?data="+_id+",3,"+journalNum;
	    //$.ajax({
            //    url: "http://www.openjournal.io/enrollState",
            //    type: 'POST',
            //   	data: JSON.stringify(sendData),
            //    success:function(data){
		//	alert("Journal value is " + value + "\nJournal title is " + title);
            //    },
	//	error: function(thrownError){
	//		alert("error: " + thrownError);
	//	}
          //  });
        });
    })
}

function getAuthorAccount(){
    var account;
    web3.eth.getAccounts(function(err, accounts){
        account = accounts[0];
    });
    return account;
}

function modifyInfo(x){
    var inputString1 = prompt('변경할 번호를 입력하세요', x.parentElement.firstElementChild.getElementsByTagName("span")[1].innerText);
    var inputString2 = prompt('변경할 제목을 입력하세요', x.parentElement.firstElementChild.getElementsByTagName("span")[3].innerText);

    x.parentElement.firstElementChild.getElementsByTagName("span")[1].innerText = inputString1;
    x.parentElement.firstElementChild.getElementsByTagName("span")[3].innerText = inputString2;
  }

function checkReference(x){
   var journalNum =   x.parentElement.firstElementChild.getElementsByTagName("span")[1].innerText;
   var journalTitle =   x.parentElement.firstElementChild.getElementsByTagName("span")[3].innerText;

   journalTitle = journalTitle.replace(/(\s*)/g,""); //띄워쓰기 다 붙임

   $.getJSON("OpenJournal.json", function(data){
       var Artifact = data;
       contracts.OpenJournal = TruffleContract(Artifact);
       contracts.OpenJournal.setProvider(web3Provider);
       contracts.OpenJournal.deployed().then(function(instance){
           var author = getAuthorAccount();
           var journalTitleInBlockChain;
           instance.getJournalTitle(journalNum).then(res => journalTitleInBlockChain = res['c'].toString());;
           journalTitleInBlockChain = journalTitleInBlockChain.replace(/(\s*)/g,"");
           if(journalTitle == journalTitleInBlockChain){
               x.parentElement.children[3].getElementById("correspond").style.display="block";
               x.parentElement.children[3].getElementById("notcorrespond").style.display="none";
            }
            else{
                x.parentElement.children[3].getElementsByTagName("p")[0].style.display="none";
                x.parentElement.children[3].getElementsByTagName("p")[1].style.display="block";
            }
        });
    })
}
