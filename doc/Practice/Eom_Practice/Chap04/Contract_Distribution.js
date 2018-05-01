var proof = proofContract.new({
    from: web3.eth.accounts[0],
    data: "0x606060405261068...",
    gas: "4700000"
    },
    function(e, contract){
        if(e){
            console.log("Error" + e);
        }
        else if (contract.address != undefined){
            console.log("Contract Address: " + contract.address);
        }
        else{
            console.log("Txn Hash: " + contract.transactionHash)
        }
    }
)
