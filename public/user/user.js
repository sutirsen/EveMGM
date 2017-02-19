var userMod = angular.module('eveMGM.user',
    [
      'ui.router', 
      'angular-growl',
      'ngCookies',
      'eveMGM.services'
    ]);

userMod.config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state({
      name: 'login',
      url: '/login',
      templateUrl: '/user/login.html',
      controller: 'LoginCtrl'
    });
  }
]);

userMod.controller('LoginCtrl', [
  'UserService', 
  'growl', 
  '$location', 
  '$rootScope',
  '$cookies', 
  '$http', 
  function(
    UserService, 
    growl, 
    $location, 
    $rootScope, 
    $cookies, 
    $http) {
    var self = this;
    var cookieToken = $cookies.get('token');
    if(cookieToken && cookieToken != ''){
      $http.get(`/api/protected?token=${cookieToken}`).then(function(){
        UserService.token=cookieToken;
        UserService.user=$cookies.getObject('user');
        $rootScope.loggedIn = true;
        $rootScope.loggedInUser = $cookies.getObject('user');
        growl.success(`Welcome back ${UserService.user.name}!`);
        if($rootScope.currentPath) {
          $location.path($rootScope.currentPath);
        } else {
          $location.path('/home');
        }
        
      }, function(err){
        $cookies.remove('token');
        $cookies.remove('user');
      })
    }
    self.login = function(){
      UserService.login(self.user.email, self.user.password)
      .then(function(resp){
        UserService.token=resp.data.token;
        UserService.user=resp.data.user;
        $rootScope.loggedIn = true;
        $rootScope.loggedInUser = resp.data.user;
        if(self.remember) {
          $cookies.putObject('user', resp.data.user);
          $cookies.put('token', resp.data.token);
        }
        growl.success(`Welcome ${UserService.user.name}!`);
        if($rootScope.currentPath) {
          $location.path($rootScope.currentPath);
        } else {
          $location.path('/home');
        }
      }, function(err) {
        growl.error("Unable to login!");
      });   
    };
}]);