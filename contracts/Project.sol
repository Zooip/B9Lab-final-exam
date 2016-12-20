pragma solidity ^0.4.2;

contract Project {
    
    struct ProjectInfo {
        address owner;
        uint goal;
        uint deadline;
    }
    
    bool public open;
    
    event Payout;
    event Refund;
    event RefundError(address erroredAddress);
    
    ProjectInfo public projectInfo;
    mapping(address => uint) public pledges;
    address[] public pledgers;
    
    modifier onlyOpen{
        if(!open)throw;
        _;
    }
    
    function Project(address _owner,uint _goal,uint _deadline) {
        //params validation
        if(_goal==0)throw;
        if(_deadline<=now)throw;
        
        projectInfo=ProjectInfo(_owner,_goal,_deadline);
        open=true;
    }
    
    //Convenience function for web developping
    function getBalance() constant returns(uint){return this.balance;}
    
    function fund()
        payable onlyOpen{
            fundFrom(msg.sender);
        }
        
    function fundFrom(address pledger)
        payable onlyOpen {
           if(msg.value==0) throw;
            // register pledge before any action so last pledger
            // can be refund
            bool knownPledger;
            for(uint i0=0; i0<pledgers.length; i0++) {
                if(pledgers[i0]==pledger)knownPledger=true;
            }
            if(!knownPledger) pledgers.push(pledger);
            pledges[pledger]+=msg.value;
            
            //Call refund before payout because it's already too late
            if(now>projectInfo.deadline) refund();
            if(this.balance>=projectInfo.goal) payout();
   }
     
    function payout() onlyOpen{
        if(this.balance<projectInfo.goal) throw;
        open=false;
        Payout();
        if(!projectInfo.owner.send(this.balance)) throw;
    }
    
    function refund() onlyOpen{
        if(now<projectInfo.deadline) throw;
        open=false;
        Refund();
        for(uint i0=0; i0<pledgers.length; i0++) {
            if(pledgers[i0].send(pledges[pledgers[i0]])) RefundError(pledgers[i0]);
            //Do not test return value so if a pledgers
            //have an invalid fallback, it does not stop
            //next pledgers to get their money
        }
    }
    
}