var empMod = angular.module('eveMGM.employee',
    [
      'ui.router', 
      'angular-growl',
      'datatables',
      'eveMGM.services',
      '720kb.datepicker'
    ]);

// Routes 
empMod.config(['$stateProvider', function($stateProvider){
  $stateProvider.state({
    name: 'employee',
    url: '/employees',
    templateUrl: '/employee/employee_list.html',
    controller: 'EmployeeCtrl'
  });
}]);

// Controller
empMod.controller('EmployeeCtrl', 
  [
    'UserService', 
    'EmployeeService', 
    '$location', 
    'growl', 
    '$scope', 
    '$rootScope',
  function(
      UserService, 
      EmployeeService, 
      $location, 
      growl, 
      $scope, 
      $rootScope) {
    if(!UserService.token) {
      $rootScope.currentPath = $location.path();
      $location.path('/login');
      return;
    }
    $scope.employees = [];
    let getEmps = function(){
      growl.info('Getting employees ...');
      var emps = EmployeeService.service.query({token: UserService.token }, 
        function(){
          $scope.employees = emps;
        }
      );
    }
    getEmps();
    $scope.emp = {};
    $scope.insert = function() {
      console.log($scope.emp);
      $scope.emp.token = UserService.token;
      EmployeeService.service.save($scope.emp).$promise.then(function(){
        growl.success('Employee added!');
        $scope.emp = {};
        $('#empInserter').collapse('hide');
        getEmps();
      }, function(err){
        console.log(err);
        growl.error('Employee not added!');
      });
    }
    
    $scope.closeInsert = function() {
      $scope.emp = {};
      $('#empInserter').collapse('hide');
    }
}]);