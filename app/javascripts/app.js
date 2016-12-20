

var accounts;
var account;
var fundingHub;
var projects;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function refreshBalance() {
  var balance=web3.fromWei(web3.eth.getBalance(account).valueOf())

  var balance_element = document.getElementById("balance");
  balance_element.innerHTML = balance;
  
};

function createProject(_name,_goal,_deadline) {
  console.log("Create new project ...")
  fundingHub.createProject(account,_goal,_deadline,{from:account, gas: 3000000}).then(function(txn){
    console.log(txn);
    web3.eth.getTransactionReceiptMined(txn);
    return true;
  }).then(function(){
    console.log("Project added");
    return refreshProjectList();
  }).catch(function(e) {
    console.log(e);
    return false;
  });
}

function refreshProjectList() {
  projects=[]
  projectCount=0;
  fundingHub.projectsCount().then(function(value){
    projectCount = web3.toDecimal(value);
    console.log("ProjectsCount = " + projectCount);
    for (i = 0; i < projectCount; i++) { 
      fundingHub.projects.call(i).then(function(value){
        console.log(value);
        projects.push(Project.at(value.valueOf()));
        return true;
      });
    }
    waitfor(function(){return projects.length}, projectCount,100, 0,'', 
      function(){
        refreshProjectListDisplayer();
        return projects;
      })
    return true;
  });
  return true;
};

function refreshProjectListDisplayer() {
  console.log("refreshProjectListDisplayer()");
  projectsDisplayer=document.getElementById("projects");
  projectsDisplayer.innerHTML ="";
  for (i = 0; i < projects.length; i++) {
    var p=projects[i];
    appendProject(p);
    updateBalanceFor(p);
    updateStatusFor(p);
  }
}

function appendProject(project){
  console.log(project.address);
  projectsDisplayer=document.getElementById("projects");
  project.projectInfo.call().then(function(infos){
    var text= projectView("Some Project",project.address,infos[1].valueOf(),infos[2].valueOf());
    projectsDisplayer.innerHTML = projectsDisplayer.innerHTML + text;
    return text; 
  });
}

function projectView(name,address,goal,deadline) {
  return "<tr class=\"project-line\" id=\"project-"+address+"\"><td class=\"name-cell\"><div class=\"name\">"+name+"</div><div class=\"address\">"+address+"</div></td><td class=\"current-cell\"></td><td class=\"goal-cell\">"+web3.fromWei(goal)+" ETH</td><td class=\"deadline-cell\">"+(new Date(deadline*1000))+"</td><td class=\"contribute-cell\"></td></tr>";
}


window.onload = function() {

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

  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

    accounts = accs;
    account = accounts[0];

    refreshBalance();

    fundingHub=FundingHub.deployed();

    fundingHub.ProjectAdded({fromBlock: "latest"}).watch(function(error, result) {
      if (error == null) {
        console.log("EVENEMENT !!!!!!!!!!!!!!");
        console.log(result.args);
      }
    })

    refreshProjectList();
  });
}

function fillDeadlineFieldWithNow() {
  now=new Date;
  $('#deadline_field_group #y')[0].value=now.getFullYear();
  $('#deadline_field_group #m')[0].value=now.getMonth();
  $('#deadline_field_group #d')[0].value=now.getDate();
  $('#deadline_field_group #m22')[0].value=now.getHours();
  $('#deadline_field_group #min')[0].value=now.getMinutes();
  $('#deadline_field_group #sec')[0].value=now.getSeconds();
}

function submitCreateProjectForm() {
  var d=new Date($('#deadline_field_group #y')[0].value,
    $('#deadline_field_group #m')[0].value,
    $('#deadline_field_group #d')[0].value,
    $('#deadline_field_group #m22')[0].value,
    $('#deadline_field_group #min')[0].value,
    $('#deadline_field_group #sec')[0].value);
  createProject($('#name_field_group #name')[0].value,valueOfField('#goal_field_group'),Math.floor(parseInt(d.getTime())/1000));
}

function updateBalanceFor(project) {
  project.getBalance().then(function(balance){
    b=balance.valueOf()
    cell=$('#project-'+project.address+' .current-cell')[0]
    cell.innerHTML=web3.fromWei(b)+" ETH"
  })
}

function updateStatusFor(project) {
  project.open().then(function(open){
    cell=$('#project-'+project.address+' .contribute-cell')[0];
    if(open.valueOf()){
      cell.innerHTML=contributeButtonFor(project)
    } else {
      cell.innerHTML="<span class=\"closed\">closed</span>"
    }
  })
}

function contributeTo(projectAddress,value) {
  fundingHub.contribute(projectAddress,{from:account, gas: 300000, value: value}).then(function(txn){
    console.log(txn);
    web3.eth.getTransactionReceiptMined(txn);
    return true;
  }).then(function(){
    console.log("Contributed "+value+" weis to project "+projectAddress);
    return refreshProjectList();
  }).catch(function(e) {
    console.log(e);
    return false;
  });
}

function submitContribution(projectAddress) {

  contributeTo(projectAddress,valueOfField('#project-'+projectAddress+' .contribute-cell'));
}

function contributeButtonFor(project) {
  return '<input class="contribute-value-field" type="number" id="goal" name="value-'+project.address+'" min="1" placeholder="amount"><div class="switch"><input id="toggle-'+project.address+'" class="eth-wei-toggle" type="checkbox"><div class="eth-wei-toggle-buttons"><label for="toggle-'+project.address+'" class="eth-wei-toggle-but eth-wei-toggle-but-left eth-wei-toggle-wei">Wei</label><label for="toggle-'+project.address+'" class="eth-wei-toggle-but eth-wei-toggle-but-right eth-wei-toggle-eth">Eth</label></div></div><input class="small-button" type="button" value="Contribute" onclick="submitContribution(\''+project.address+'\');" />'
}

function valueOfField(id) {
  console.log(id);
  var raw_value=parseInt($(id+' input')[0].value)
  var multiplier= $(id+' .switch input.eth-wei-toggle')[0].checked ? 1000000000000000000 : 1
  console.log
  return raw_value*multiplier
}




//**********************************************************************
// function waitfor - Wait until a condition is met
//        
// Needed parameters:
//    test: function that returns a value
//    expectedValue: the value of the test function we are waiting for
//    msec: delay between the calls to test
//    callback: function to execute when the condition is met
// Parameters for debugging:
//    count: used to count the loops
//    source: a string to specify an ID, a message, etc
//**********************************************************************
function waitfor(test, expectedValue, msec, count, source, callback) {
    // Check if condition met. If not, re-check later (msec).
    while (test() !== expectedValue) {
        count++;
        setTimeout(function() {
            waitfor(test, expectedValue, msec, count, source, callback);
        }, msec);
        return;
    }
    // Condition finally met. callback() can be executed.
    console.log(source + ': ' + test() + ', expected: ' + expectedValue + ', ' + count + ' loops.');
    return callback();
}

//Qui debug on promises
function getValue(x){console.log(x.valueOf());return x;}