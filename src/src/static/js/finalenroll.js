var web3Provider;
var contracts = {};

if(typeof web3 !== "undefined"){
    web3Provider = web3.currentProvider;
}else {
    web3Provider = new web3Provider.providers.HttpProvider("http://localhost:7545");
}
web3 = new Web3(web3Provider);

function finalEnroll(_id){
    var value = document.getElementById("journal_price").value;
    var title = document.getElementById("journal_title").innerText;
    var description = document.getElementById("journal_abstract").innerText;
    var referenceList = []; // 현재는 논문의 번호를 이용하여 실행됨
    
    $("span[name=OJjournal]").each(function(idx){   
        var referenceJournal = $(this).html(); 
        referenceList.push(referenceJournal);
    });
    var instance = OpenJournal.at("0xddf4F12e72691f31A9098Af235D712988f227d6d");
    var author = getAuthorAccount();
    instance.registJournal(value, title, description, referenceList, { from: author });
    console.log(instance);
    alert(_id);
    // location.href ="enrollState?data="+3;
    $.ajax({
        url: "http://http://52.79.222.139/enrollState",
        dataType: 'json',
        type: "post",
        data: {obId: _id, state: 3},
        success:function(data){
    alert("논문 가격 : " + value + "\n" + "논문 제목 : " + title + "\n" + "논문 요약 : " + description + "\n정상 등록되었습니다.");
        }
    });
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

   var instance = OpenJournal.at("0xddf4F12e72691f31A9098Af235D712988f227d6d");
   var author = getAuthorAccount();
   var journalTitleInBlockChain;
   instance.getJournalTitle(journalNum).then(res => journalTitleInBlockChain = res['c'].toString());
   journalTitleInBlockChain = journalTitleInBlockChain.replace(/(\s*)/g,"");
   if(journalTitle == journalTitleInBlockChain){
       x.parentElement.children[3].getElementById("correspond").style.display="block";
       x.parentElement.children[3].getElementById("notcorrespond").style.display="none";
    }
    else{
        x.parentElement.children[3].getElementsByTagName("p")[0].style.display="none";
        x.parentElement.children[3].getElementsByTagName("p")[1].style.display="block";
    }
}
