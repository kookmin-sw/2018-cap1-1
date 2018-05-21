$(document).ready(function () {
    if (isContractRunning) {
        var user = getUserAccount();
        var journal = getJournalNumber();
        var list = instance.getJournalSubscriber();
        
        if (list.contains(user)) {
            
        }
    }
});