var servicesMod = angular.module('eveMGM.services',
  [
    'ngResource',
    'ngCookies'
  ]);

servicesMod.factory('UserService',
  [
    '$http', 
    '$cookies', 
    '$rootScope', 
    '$location', 
  function(
    $http, 
    $cookies, 
    $rootScope, 
    $location){
  let authUrl = '/api/authenticate';
  return {
    // Remove: Set following two keys to null
    token: null,
    user: null,
    login: function(email, password) {
      return $http({
          method: 'POST',
          url: authUrl,
          data: {email: email, password: password}
      });
    },
    logout: function(){
      this.token = null;
      this.user = null;
      $cookies.remove('token');
      $cookies.remove('user');
      $rootScope.loggedIn = false;
      $rootScope.loggedInUser = {};
      $location.path('/login');
    }
  };
}]);

var convertObjToQueryString = function(obj){
  let qryStringArr = [];
  for(var i in obj) {
    qryStringArr.push(`${i}=${obj[i]}`);
  }
  return qryStringArr.join('&');
}

servicesMod.factory('EmployeeService', ['$resource', '$http',
  function($resource, $http){
    return {
      service: $resource('/api/employees/:empId?token=:token',{
        token: '@token',
        empId: '@empId'
      }),
      find: function(obj) {
        let qryString = convertObjToQueryString(obj);
        return $http.get('/api/employees/find?'+qryString);
      }
    };
}]);

servicesMod.factory('EventService', ['$resource', '$http',
  function($resource, $http){
    return {
      service: $resource('/api/events/:evId?token=:token',{
        token: '@token',
        evId: '@evId'
      }),
      find: function(obj) {
        let qryString = convertObjToQueryString(obj);
        return $http.get('/api/events/find?'+qryString);
      }
    };
}]);

servicesMod.factory('EventCollectionService', ['$resource', '$http',
  function($resource, $http){
    return {
      service: $resource('/api/event_collections/:collectionId?token=:token',{
        token: '@token',
        collectionId: '@collectionId'
      }),
      find: function(obj) {
        let qryString = convertObjToQueryString(obj);
        return $http.get('/api/event_collections/find?'+qryString);
      }
    };
}]);

servicesMod.factory('EventExpenseService', ['$resource', '$http',
  function($resource, $http){
    return {
      service: $resource('/api/event_expenses/:expenseId?token=:token',{
        token: '@token',
        expenseId: '@expenseId'
      }),
      find: function(obj) {
        let qryString = convertObjToQueryString(obj);
        return $http.get('/api/event_expenses/find?'+qryString);
      }
    };
}]);



