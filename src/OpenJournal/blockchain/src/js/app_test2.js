window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      web3provider = new Web3(web3.currentProvider);
    } else {
      // Handle the case where the user doesn't have web3. Probably 
      // show them a message telling them to install Metamask in 
      // order to use our app.
      web3provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
  })
  
  $.getJSON("OpenJournal.json", function(data) {
    
    var Artifact = data;
    console.log(Artifact); 
    var OpenJournalContract = TruffleContract(Artifact);
    console.log(OpenJournalContract);
    OpenJournalContract.setProvider(web3.currentProvider);
  
    var OpenJournalInstance;
    OpenJournalContract.deployed().then(function(instance){
      OpenJournalInstance = instance;
      console.log(OpenJournalInstance);
      // register Test용 코드
      // let register;
      // register = "0xC29dcebbcA87357F24963383024c8eDdDb4396E7";
      // OpenJournalInstance.registJournal(5, 'Title : test', 'Desc : This is Journal for test', {from:register});
      var authorAddress;
      authorAddress = OpenJournalInstance.getAuthorAddress.call(1);
      console.log(authorAddress);
    });
    
  });
  
  $.getJSON("../journals.json", function(data) {
    var journalsRow = $("#journalsRow");
    var journalTemplate = $("#journalTemplate");
  
    for (i = 0; i < data.length; i++) {
      journalTemplate.find(".panel-title").text(data[i].title);
      journalTemplate.find(".journal-number").text(data[i].number);
      journalTemplate.find(".journal-author").text(data[i].author);
      journalTemplate.find(".journal-description").text(data[i].description);
      journalTemplate.find(".btn-subscribe").attr("data-id", data[i].number);
  
      journalsRow.append(journalTemplate.html());
    }
  });