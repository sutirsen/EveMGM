var expMod = angular.module('eveMGM.expense',
    [
      'ui.router', 
      'angular-growl',
      'datatables',
      'eveMGM.services',
      'ui.select', 
      'ngSanitize',
      '720kb.datepicker'
    ]);

// Routes 
expMod.config(['$stateProvider', function($stateProvider){
  $stateProvider.state({
    name: 'expense',
    url: '/expenses',
    templateUrl: '/expense/expense_list.html',
    controller: 'ExpenseCtrl',
    resolve: {
      employees: [
      'EmployeeService',
      'UserService',
      function(EmployeeService, UserService) {
        return EmployeeService.find({
          token: UserService.token,
          isActive: true 
        });  
      }],
      events: [
      'EventService',
      'UserService',
      function(EventService, UserService) {
        return EventService.find({
          token: UserService.token 
        });  
      }]
    }
  });
}]);

expMod.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      var keys = Object.keys(props);

      items.forEach(function(item) {
        var itemMatches = false;

        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});

// Controller
expMod.controller('ExpenseCtrl', 
  [
    'UserService', 
    'EmployeeService',
    'EventExpenseService',
    '$location', 
    'growl', 
    '$scope', 
    '$rootScope',
    'employees',
    'events',
    'DTOptionsBuilder',
  function(
      UserService, 
      EmployeeService,
      EventExpenseService,
      $location, 
      growl, 
      $scope, 
      $rootScope,
      employees,
      events,
      DTOptionsBuilder) {
    if(!UserService.token) {
      $rootScope.currentPath = $location.path();
      $location.path('/login');
      return;
    }
    $scope.employees = employees.data;
    $scope.events = events.data;
    $scope.expenses = [];
    let getExpenses = function(){
      growl.info('Getting expenses ...');
      var exps = EventExpenseService.service.query({token: UserService.token }, 
        function(){
          $scope.expenses = exps;
          for(let i=0; i < $scope.expenses.length; i++){
            for(let em in $scope.employees) {
              if($scope.employees[em]._id == $scope.expenses[i].expense_made_by){
                $scope.expenses[i]['EmpName'] = $scope.employees[em].name;
                break;
              }             
            }
            for(let ev in $scope.events) {
              if($scope.events[ev]._id == $scope.expenses[i].event_id){
                $scope.expenses[i]['EventName'] = $scope.events[ev].name;
                break;
              }
            }
          }
        }
      );
    }
    getExpenses();
    $scope.expense = {};
    $scope.dataTableOptions = DTOptionsBuilder.newOptions().withOption('aaSorting', [[2, 'desc']]);
    $scope.insert = function() {
      $scope.expense.token = UserService.token;
      EventExpenseService.service.save($scope.expense).$promise.then(function(){
        growl.success('Expense added!');
        $scope.expense = {};
        $('#expInserter').collapse('hide');
        getExpenses();
      }, function(err){
        console.log(err);
        growl.error('Expense not added!');
      });
    };

    $scope.delete = function(expenseId){
      EventExpenseService.service.remove({ 
        token: UserService.token,
        expenseId: expenseId 
      }).$promise.then(function(){
        growl.success('Expense removed!');
        getExpenses();
      }, function(err){
        console.log(err);
        growl.error('Unable to remove expense!');
      });
    };
    
    $scope.closeInsert = function() {
      $scope.expense = {};
      $('#expInserter').collapse('hide');
    }
}]);