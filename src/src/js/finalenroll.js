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
    var authorShare = document.getElementById("journal_percentToken").value;
    var referenceList = []; // 현재는 논문의 번호를 이용하여 실행됨
    var contributeList = [];
    var pricePercentList = [];

    alert("id: " + _id + "\njournalNumber: " + journalNum);
    $("span[name=OJjournal]").each(function(idx){
        var referenceJournal = $(this).html();
        referenceList.push(referenceJournal);
    });
    $("span[name=OJcontributorNum]").each(function(idx){
        var contributeJournal = $(this).html();
        contributeList.push(contributeJournal);
    });
    $("span[name=price_percent]").each(function(idx){
        var pricePercent = $(this).html();
        pricePercentList.push(pricePercent);
    });


    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data;
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
        contracts.OpenJournal.deployed().then(function(instance){
            var author = getAuthorAccount();
            instance.registJournal(journalNum, title, authorShare, value, referenceList, contributeList, pricePercentList, { from: author });
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
  var inputString1 = prompt('변경할 번호를 입력하세요', x.parentElement.childNodes[1].getElementsByTagName("span")[0].innerText);
  var inputString2 = prompt('변경할 제목을 입력하세요', x.parentElement.childNodes[3].getElementsByTagName("span")[0].innerText);

  x.parentElement.childNodes[1].getElementsByTagName("span")[0].innerText = inputString1;
  x.parentElement.childNodes[3].getElementsByTagName("span")[0].innerText = inputString2;
}

function modifyContributerInfo(x){
  var inputString1 = prompt('변경할 Contributer의 아이디를 입력하세요', x.parentElement.childNodes[1].getElementsByTagName("span")[0].innerText);
  var inputString2 = prompt('변경할 Contributer의 이름을 입력하세요.', x.parentElement.childNodes[3].getElementsByTagName("span")[0].innerText);

  x.parentElement.childNodes[1].getElementsByTagName("span")[0].innerText = inputString1;
  x.parentElement.childNodes[3].getElementsByTagName("span")[0].innerText = inputString2;
}

function checkContributer(x){
  //contributer 값 가져올 때
  //contributer id :  x.parentElement.childNodes[1].getElementsByTagName("span")[0].innerText
  //contributer name : x.parentElement.childNodes[3].getElementsByTagName("span")[0].innerText
}

function checkPercent(){
  var arr = document.getElementsByName("price_percent");
  var sum = 0;
  for(i=0; i<arr.length; i++){
    sum += parseInt(arr[i].value, 10);
  }
  console.log(sum);
  if(sum!=100){
    var toastHTML = '<span style="color:red;">지분의 합이 100%가 아닙니다.</span>';
    M.toast({html : toastHTML}, 1000);
    document.getElementById("load_metamthisask").style.display = 'none';
  }
  else{
    var toastHTML = '<span style="color:yellow">지분의 합이 100%입니다.</span>';
    M.toast({html : toastHTML}, 1000);
    document.getElementById("load_metamthisask").style.display = 'inline-block';

  }
}




function checkReference(x){
   var journalNum =   x.parentElement.childNodes[1].getElementsByTagName("span")[0].innerText;
   var journalTitle =   x.parentElement.childNodes[3].getElementsByTagName("span")[0].innerText;

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
