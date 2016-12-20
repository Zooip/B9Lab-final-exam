pragma solidity ^0.4.2;

import "Project.sol";


contract FundingHub {
    Project[] public projects;

    event ProjectAdded(address projectAddress);
    
    function createProject(address _owner,uint _goal, uint _deadline )
        returns(address) {
        // if(_owner==address(0)) _owner=msg.sender;
        // if(_deadline==0) _deadline=now+1000;
        var newProject = new Project(_owner,_goal,_deadline);
        projects.push(newProject);
        ProjectAdded(newProject);
        return newProject;
    }
    
    function contribute(address project_address) payable{
        Project(project_address).fundFrom.value(msg.value)(msg.sender);
    }

    function projectsCount() constant returns(uint count) {
        return projects.length;
    }
}