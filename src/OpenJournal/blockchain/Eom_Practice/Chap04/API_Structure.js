// 동기식 요청
try
{
    console.log(web3.eth.getBlock(48));
}
catch(e)
{
    console.log(e);
}

// 비동기식 요청
// 해시를 이용해 블록에 대한 정보를 얻기 위해 사용됨.
web3.eth.getBlock(48, function(error, result){
    
    if(!error)
        console.log(result);
    else   
        console.log(error);
})