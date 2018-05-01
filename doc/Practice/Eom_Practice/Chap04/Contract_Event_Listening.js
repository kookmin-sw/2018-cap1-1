// 컨트랙트 인스턴스에서 이벤트와 이름이 같은 메소드를 호출하는 방식으로 이벤트 객체를 얻는다.
// null => 필터값 default
// fromBlock => 가장 빠른 블록   toBlock => 최신 블록 ,  address => 로그를 가져올 주소의 목록
var event = proof.logFileAddedStatus(null, {
    fromBlock: 0,
    toBlock: "latest"
});

// get은 블록범위에 있는 모든 이벤트를 얻기 위해 사용됨.
event.get(function(error, result){
    if(!error){
        console.log(result);
    }
    else{
        console.log(error);
    }
})

// watch는 get과 비슷하지만 
event.watch(function(error, result){
    if(!error){
        console.log(result.args.status);
    }
    else{
        console.log(error);
    }
})

setTimeout(function(){
    // stopWatching은 변경 사항에 대한 감시를 멈추기 위해 사용됨.
    event.stopWatching();
}, 60000)

// allEvents : 컨트랙트의 모든 이벤트 검색
var events = proof.allEvents({
    fromBlock: 0,
    toBlock: "latest"
});

events.get(function(error, result){
    if(!error){
        console.log(result);
    }
    else{
        console.log(error);
    }
})

events.watch(function(error, result){
    if(!error){
        console.log(result.args.status);
    }
    else{
        console.log(error);
    }
})

setTimeout(function(){
    events.stopWatching();
}, 60000)
