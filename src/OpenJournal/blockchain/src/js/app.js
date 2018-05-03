App = {
  web3Provider: null,
  contracts: {},

  //초기화
  init: function() {
    //논문 배열을 가져와서 리스트를 만든다. 
    $.getJSON("../journals.json", function(data) {
      var journalsRow = $("#journalsRow");
      var journalTemplate = $("#journalTemplate");

      for (i = 0; i < data.length; i++) {
        journalTemplate.find(".panel-title").text(data[i].title);
        journalTemplate.find(".journal-number").text(data[i].number);
        journalTemplate.find(".journal-author").text(data[i].author);
        journalTemplate.find(".journal-description").text(data[i].description);
        journalTemplate.find(".btn-adopt").attr("data-id", data[i].id);

        journalsRow.append(journalTemplate.html());
      }
    });
    
    //지갑설정 함수를 실행한다. 
    return App.initWeb3();
  },

  
  initWeb3: function() {
    // web3 인스턴스가 있는지 확인
    if (typeof web3 !== "undefined") {
      //Metamask 가 실행시 현 지갑을 리턴한다. 
      App.web3Provider = web3.currentProvider;
    } else {
      //만약 지정된 지갑이 없는 경우 미리 설정된 Ganeche 지갑을 리턴한다. 
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },
  
  //계약 초기화
  initContract: function() {
    /*
    OpenJournal.JSON 형태 
    {
    "contractName": "OpenJournal",
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
       ...............
    */
    //OpenJournal 은 컴파일 시 나온 ABI JSON이다 여기에 기본 함수들이 표시가 된다. 
    //웹에서는 이 ABI JSON을 보고 실행을 할 수 있다.
    $.getJSON("OpenJournal.json", function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var SubscribeArtifact = data;
      //미리 제공된 truffleContract 를 통해 Subscribe 인스턴스 생성
      App.contracts.OpenJournal = TruffleContract(SubscribeArtifact);
      
      //지갑 설정
      App.contracts.OpenJournal.setProvider(App.web3Provider);
    
    });

    return App.bindEvents();
  },

  //이벤트 바인딩
  bindEvents: function() {
    $(document).on("click", ".btn-subscribe", App.handleSubscribe);
  },

  //Adopt 버튼 클릭시 adopt 함수 실행하는 함수이다. (트랙잭션이 발생된다.)
  handleSubscribe: function(event) {
    //기본 이벤트 블럭함
    event.preventDefault();

    //저널 번호를 number 를 통해 쿼리해옴
    var journalNumber = parseInt($(event.target).data("number"));

    var subscriptionInstance;
    
    //지갑상에 주소를 가져온다. 
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      //처음 주소를 가져온다. 
      var account = accounts[0];
      
      App.contracts.OpenJournal.deployed()
        .then(function(instance) {
          subcriptionInstance = instance;
          
          //journalNumber, account를 넣어서 함수를 실행한다. 
          return subscriptionInstance.subscribeJournal(journalId, { from: account });
        })
        .catch(function(err) {
          console.log(err.message);
        });
    });
  }
};

$(function() {
  $(window).load(function() {
  //초기화
    App.init();
  });
});
