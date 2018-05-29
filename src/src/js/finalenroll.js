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

    $("span[name=OJjournal]").each(function(idx){
        var referenceJournal = parseInt($(this).html());
        referenceList.push(referenceJournal);
    });
    $("span[name=OJcontributorNum]").each(function(idx){
        var contributeJournal = parseInt($(this).html());
        contributeList.push(contributeJournal);
    });
    $("input[name=price_percent]").each(function(idx){
	var pricePercent = parseInt(this.value);
        pricePercentList.push(pricePercent);
    });
    pricePercentList.pop();

    $.getJSON("OpenJournal.json", function(data){
        var Artifact = data;
        contracts.OpenJournal = TruffleContract(Artifact);
        contracts.OpenJournal.setProvider(web3Provider);
        contracts.OpenJournal.deployed().then(function(instance){
            var author = getAuthorAccount();
		console.log(journalNum);
		console.log(title);
		console.log(authorShare);
		console.log("value:"+value);
		console.log(referenceList);
		console.log(contributeList);
		console.log(pricePercentList);
		alert("STOP!");
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
    account = web3.eth["coinbase"];
    return account;
}

function modifyInfo(x){
  var inputString1 = prompt('변경할 번호를 입력하세요', x.previousElementSibling.previousElementSibling.innerText);
  var inputString2 = prompt('변경할 제목을 입력하세요', x.previousElementSibling.innerText);

  x.previousElementSibling.previousElementSibling.innerText = inputString1;
  x.previousElementSibling.innerText = inputString2;
}

function modifyContributorInfo(x){
  var inputString1 = prompt('변경할 Contributer의 아이디를 입력하세요', x.previousElementSibling.previousElementSibling.innerText);
  var inputString2 = prompt('변경할 Contributer의 이름을 입력하세요.', x.previousElementSibling.innerText);

  x.previousElementSibling.previousElementSibling.innerText = inputString1;
  x.previousElementSibling.innerText = inputString2;
}

function checkContributer(x){
  //contributer 값 가져올 때
  //contributer id :  x.previousElementSibling.previousElementSibling.previousElementSibling.innerText
  //contributer name : x.previousElementSibling.previousElementSibling.innerText
}

function checkPercent(){
  var arr = document.getElementsByName("price_percent");
  var sum = 0;
  for(i=0; i<arr.length; i++){
    sum += parseInt(arr[i].value, 10);
  }
  console.log(sum);
  if(sum!=100){
    // var toastHTML = '<span style="color:red;">지분의 합이 100%가 아닙니다.</span>';
    // M.toast({html : toastHTML}, 1000);
    document.getElementById("load_metamthisask").style.display = 'none';
  }
  else{
    var toastHTML = '<span style="color:yellow">지분의 합이 100%입니다.</span>';
    M.toast({html : toastHTML}, 1000);
    document.getElementById("load_metamthisask").style.display = 'inline-block';

  }
}




function checkReference(x){
   var journalNum =   x.previousElementSibling.previousElementSibling.previousElementSibling.innerText;
   var journalTitle =   x.previousElementSibling.previousElementSibling.innerText;


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
               x.nextElementSibling.firstElementChild.style.display="block";
               x.nextElementSibling.lastElementChild.style.display="none";
            }
            else{
                x.nextElementSibling.firstElementChild.style.display="none";
                x.nextElementSibling.lastElementChild.style.display="block";
            }
        });
    })
}
