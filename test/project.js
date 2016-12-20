//project.js

contract('Project', function(accounts) {
	it("should refund users", function() {
      console.log("Start 'should refund users'");
	    var hub = FundingHub.deployed()

      var coinbase=accounts[0];
      var account1=accounts[1];
      var account2=accounts[2];

      var account1_initial_balance
      var account2_initial_balance

      var project;

      var deadline=Math.floor(Date.now() / 1000) + 3

      return hub.createProject(coinbase,10000000000000000000, deadline,{from:coinbase,gas:3000000}).then(function() {
        console.log("Project created");
        return hub.projectsCount()
      }).then(function(count){
        var projectCount = web3.toDecimal(count);
        console.log("Number of projects = "+projectCount);
        return hub.projects.call(projectCount-1)
      }).then(function(address){
        console.log("Project address = "+address.valueOf());
        project=Project.at(address.valueOf())
        return hub.contribute(project.address,{from:account1, gas: 300000, value: 1000000000000000000})
      }).then(function(txn){
        console.log("Txn number = "+txn);
        return web3.eth.getTransactionReceiptMined(txn);
      }).then(function(receipt){
        console.log("Txn receipt = "+receipt);
        return hub.contribute(project.address,{from:account2, gas: 300000, value: 1000000000000000000})
      }).then(function(txn){
        console.log("Txn number = "+txn);
        return web3.eth.getTransactionReceiptMined(txn);
      }).then(function(receipt){
        return new Promise(function(resolve, reject) {
          var time=Math.max(deadline-Math.floor(Date.now()/1000)+1,0)*1000
          console.log("waiting for (ms) : "+time)
          setTimeout(function() {
            resolve();
          }, time); // Wait 3s then resolve.
        });
      }).then(function(){
        account1_initial_balance=web3.eth.getBalance(accounts[1]).valueOf();
        account2_initial_balance=web3.eth.getBalance(accounts[1]).valueOf();
        console.log("Trigger refund");
        return project.refund({from:coinbase,gas:3000000})
      }).then(function(txn){
        console.log("Txn number = "+txn);
        return web3.eth.getTransactionReceiptMined(txn);
      }).then(function(receipt){
        console.log("Txn receipt = "+receipt);
        assert.equal(account1_initial_balance, web3.eth.getBalance(accounts[1]).valueOf(), "Account 1 balances should be reset (before : "+account1_initial_balance+" ; after : "+web3.eth.getBalance(accounts[1]).valueOf()+" )");
        assert.equal(account1_initial_balance, web3.eth.getBalance(accounts[2]).valueOf(), "Account 1 balances should be reset (before : "+account2_initial_balance+" ; after : "+web3.eth.getBalance(accounts[2]).valueOf()+" )");
      });
	  });
});

web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
  var transactionReceiptAsync;
  interval |= 500;
  transactionReceiptAsync = function(txnHash, resolve, reject) {
      try {
          var receipt = web3.eth.getTransactionReceipt(txnHash);
          if (receipt == null) {
              setTimeout(function () {
                  transactionReceiptAsync(txnHash, resolve, reject);
              }, interval);
          } else {
              console.log(receipt);
              resolve(receipt);
          }
      } catch(e) {
          reject(e);
      }
  };

  return new Promise(function (resolve, reject) {
      transactionReceiptAsync(txnHash, resolve, reject);
  });
};
