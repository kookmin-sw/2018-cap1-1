window.onload = function() {
  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
  } else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
  $.getJSON("OpenJournal.json", function(OpenJournal_json) {
    var MyContract = TruffleContract( OpenJournal_json );
    MyContract.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"));
    MyContract.deployed().then(function(instance) {
        return instance.getBalance.call(web3.eth.accounts[0]);
    }).then( function(balance) {
        // document.body.innerHTML = document.body.innerHTML  + " balance " + balance;
    });
  })
};