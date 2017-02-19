var app = angular.module('eveMGM', 
  [
    'ui.router', 
    'angular-growl', 
    'ngResource',
    'ngCookies',
    'datatables',
    'eveMGM.services',
    'eveMGM.employee',
    'eveMGM.event',
    'eveMGM.expense',
    'eveMGM.user'
  ]);

app.run([
  '$rootScope', 
  'UserService', 
  '$state', 
  function(
    $rootScope, 
    UserService, 
    $state){
  // The user is always logged out if the session is gone
  // no remembering till now
  // Remove: Set following key to false
  $rootScope.currentPath = null;
  $rootScope.loggedIn = false;
  $rootScope.loggedInUser = {};
  $rootScope.$state = $state;
  $rootScope.logout = function(){
    UserService.logout();
  }
}]);

app.config([
  'growlProvider',
  '$resourceProvider',
  '$httpProvider',
   function(
    growlProvider,
    $resourceProvider,
    $httpProvider
    ) {
  growlProvider.globalTimeToLive(
    {
      success: 1000, 
      error: 3000, 
      warning: 3000, 
      info: 2000
    }
  );

  $resourceProvider.defaults.stripTrailingSlashes = true;

  $httpProvider.defaults.headers.common = {};
  $httpProvider.defaults.headers.post = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  $httpProvider.defaults.headers.put = {};
  $httpProvider.defaults.headers.patch = {};
  $httpProvider.defaults.transformRequest = function(obj) {
    var str = [];
    for(var p in obj)
    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    return str.join("&");
  };
}]);

app.controller('HomeCtrl', ['UserService', '$scope', '$location', 'events', 'employees', 
  function(UserService, $scope, $location, events, employees) {
    if(!UserService.token) {
      $location.path('/login');
    }
    $scope.eventCount = events.data.length;
    $scope.employeeCount = employees.data.length;
    let totalInHand = 0;
    let totalExpense = 0;
    for(let i in events.data) {
      totalInHand += events.data[i].total_collection;
      totalInHand -= events.data[i].total_expense;
      totalExpense += events.data[i].total_expense;
    }
    $scope.totalInHand = totalInHand;
    $scope.totalExpense = totalExpense;
}]);

app.config(['$stateProvider', '$urlRouterProvider', 
  function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
    $stateProvider.state({
      name: 'home',
      url: '/home',
      templateUrl: '/home/home.html',
      controller: 'HomeCtrl',
      resolve: {
        events: [
          'EventService',
          'UserService',
          function(EventService, UserService) {
            return EventService.find({
              token: UserService.token
            });  
          }
        ],
        employees: [
          'EmployeeService',
          'UserService',
          function(EmployeeService, UserService) {
            return EmployeeService.find({
              token: UserService.token,
              isActive: true 
            });  
          }
        ]
      }
    });
}]);