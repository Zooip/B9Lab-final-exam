module.exports = function(deployer) {
  hub = FundingHub.deployed()
  hub.createProject(web3.eth.accounts[0],25000, Math.floor(Date.now() / 1000)+1000).then(function() {
  		console.log("Project created");
	  }).catch(function(e) {
	  	console.log("Error during Project creation");
	  });
};
