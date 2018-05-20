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
        journalTemplate.find(".btn-subscribe").attr("data-id", data[i].number);

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
      var Artifact = data;
      //미리 제공된 truffleContract 를 통해 Subscribe 인스턴스 생성
      App.contracts.OpenJournal = TruffleContract(Artifact);
      
      //지갑 설정
      App.contracts.OpenJournal.setProvider(App.web3Provider);

      // App.enrollJournal(); 
      // 1번째 : 0x9bee130db55d1493465c66655b837f16eab9dff4b465e44fa6ec2fc2c6b98297으로 등록됨
      // 2번째 : 
      
      // App.signUp();
      // App.buyToken();
      // App.getOwner();
      // App.getBalance();
      // App.enrollJournal();

    });
    return App.bindEvents();
  },

  getOwner: function(){
    App.contracts.OpenJournal.deployed().then(function(instance){
      var owner = instance.getOwnerAddress();
      console.log(owner);
    });
  },

  getBalance: function(){
    App.contracts.OpenJournal.deployed().then(function(instance){
      web3.eth.getAccounts(function(error, accounts){
        var subscriber = accounts[0];
        // var currentBalance = instance.balanceOf(subscriber);
        console.log(subscriber);
        var currentBalance = instance.balanceOf(subscriber);
        console.log(currentBalance);
      });
    });
  },

  buyToken: function(){
    App.contracts.OpenJournal.deployed().then(function(instance){

      web3.eth.getAccounts(function(error, accounts){
        var subscriber = accounts[0];
        console.log(subscriber);
        instance.buyToken({from: subscriber, value : 30});
        
      });
    });
  },

  signUp: function(){
    App.contracts.OpenJournal.deployed().then(function(instance){

      web3.eth.getAccounts(function(error, accounts){
        var subscriber = accounts[0];
        console.log(subscriber);
        instance.signUp({from: subscriber});
      });
    });
  },

  // 논문을 등록하는 함수 (Test 중)
  enrollJournal: function() {
    App.contracts.OpenJournal.deployed().then(function(instance){
      let register;
      register = "0x23A2c86ca20B8700F9517A88C20a46C5a85D209b"; // 1번계좌: "0xC29dcebbcA87357F24963383024c8eDdDb4396E7"
      console.log(instance);
      instance.registJournal(2018050003, "Title:test3", 8, [2018050001, 2018050002] , {from:register});
      console.log("registed.");
    });
  },
  
  //이벤트 바인딩
  bindEvents: function() {
    $(document).on("click", ".btn-subscribe", App.handleSubscribe);
  },

  //Subscribe 버튼 클릭시 subscribeJournal 함수 실행하는 함수이다. (트랙잭션이 발생된다.)
  handleSubscribe: function(event) {
    //기본 이벤트 블럭함
    event.preventDefault();

    //저널 번호를 number 를 통해 쿼리해옴
    var journalNumber = parseInt($(event.target).data("id"));

    var subscriptionInstance;
    
    //지갑상에 주소를 가져온다. 
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      //처음 주소를 가져온다. 
      var account = accounts[0];
      
      App.contracts.OpenJournal.deployed().then(function(instance) {
          var authorAddress;
          authorAddress = instance.getAuthorAddress.call(journalNumber);
          console.log(authorAddress);

          //journalNumber, account를 넣어서 함수를 실행한다.
          return instance.subscribeJournal(journalNumber, { from: account });
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
