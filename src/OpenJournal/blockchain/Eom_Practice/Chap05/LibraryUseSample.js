var provider = new HookedWeb3Provider({
    // host : 노드의 HTTP URL
    host: "http://localhost:8545",
    // transaction_singer : 커스텀 공급자가 트랜잭션을 서명하기 위해 통신하는 객체
    transaction_singer: {
        // hasAddress 와 singTransaction 이라는 두 개의 속성을 갖고 있음.
        hasAddress: function(address, callback){
            // hasAddress : 트랜잭션이 서명될 수 있는지 => 즉 트랜잭션 서명자가 from주소 계좌의 개인키를 가졌는지 검사하기 위해 호출            
            callback(null, true); // (null, true) => 개인키 발견 or (오류 메시지, false) => 개인 키 발견 X
        },
        // 만약 주소의 개인 키가 있는 경우 트랜잭션 서명을 위해 singTransaction 호출
        singTransaction: function(tx_param, callback){
            var rawTx = {
                gasPrice: web3.toHex(tx_param.gasPrice),
                gasLimit: web3.toHex(tx_param.gas),
                value: web3.toHex(tx_param.value),
                from: tx_param.from,
                to: tx_param.to,
                nonce: web3.toHex(tx_param.nonce)
            };
            // 개인 키를 저장하기 위한 버퍼 생성
            var privateKey = EthJS.Util.toBuffer('0x1a56e47492bf3df9', 'hex');
            var tx = new EthJS.Tx(rawTx); 
            tx.sign(privateKey);
            callback(null, tx.serialize().toString('hex'));
        }
    }
});
var web3 = new Web3(provider);
web3.eth.sendTransaction({
    from: "0xba6406ddf8817620393ab1310ab4d0c2deda714d",
    to: "0x2bdbec0ccd70307a00c66de02789e394c2c7d549",
    value: web3.toWei("0.1", "ether"),
    gasPrice: "2000000000",
    gas: "21000"
}, function(error, result){
    console.log(error, result)
})
