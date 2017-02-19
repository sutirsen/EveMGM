var evMod = angular.module('eveMGM.event',
    [
      'ui.router', 
      'angular-growl',
      'datatables',
      'ui.select', 
      'ngSanitize',
      'eveMGM.services',
      '720kb.datepicker',
      'angularModalService', 
      'ngAnimate'
    ]);

// Routes 
evMod.config(['$stateProvider',
 function($stateProvider){
  $stateProvider.state({
    name: 'event',
    url: '/events',
    templateUrl: '/event/event_list.html',
    controller: 'EventCtrl',
    resolve: {
      employees: [
      'EmployeeService',
      'UserService',
      function(EmployeeService, UserService) {
        return EmployeeService.find({
          token: UserService.token,
          isActive: true 
        });  
      }]
    }
  });
}]);

evMod.filter('propsFilter', function() {
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

evMod.controller('ExcludedEmployeeModalCtrl',[
  '$scope', 
  'employees',
  'close', 
  function($scope, employees, close) {
    $scope.employees = employees;
    $scope.close = close;
  }
]);

evMod.controller('EventCollectionModalCtrl', [
  '$scope',
  '$element',
  'eventId',
  'eligibleEmps',
  'contributors',
  'close',
  'growl',
  'UserService',
  'EventCollectionService',
  function(
      $scope,
      $element, 
      eventId, 
      eligibleEmps,
      contributors,
      close, 
      growl,
      UserService,
      EventCollectionService
    ) {
    $scope.close = close;
    $scope.contributors = contributors;
    $scope.eligibleEmps = eligibleEmps;
    $scope.eventId = eventId;
    $scope.collection_types = ['Cash', 'NetBanking', 'PayTm', 'Other'];
    $scope.collection = { contributor: '' };
    $scope.insert = function() {
      $scope.collection['event_id'] = eventId;
      $scope.collection.token = UserService.token;
      EventCollectionService.service.save($scope.collection)
      .$promise.then(function(){        
        $scope.collection = {};
        $element.modal('hide');
        close({ type: 'success', msg: 'Collection added!' }, 500);
      }, function(err){
        console.log(err);
        $element.modal('hide');
        close({ type: 'error', msg: 'Unable to add collection' }, 500);
      });
    }
    $scope.delete = function(collectionId) {
      EventCollectionService.service.remove({ 
        token: UserService.token,
        collectionId: collectionId 
      }).$promise.then(function(){
        $element.modal('hide');
        close({ type: 'success', msg: 'Collection removed!'}, 500);
      }, function(err){
        console.log(err);
        $element.modal('hide');
        close({ type: 'error', msg: 'Unable to remove collection!'}, 500);
      });
    }
  }
]);

evMod.controller('EventCtrl', 
  [
    'UserService', 
    'EventService', 
    'EmployeeService',
    'EventCollectionService',
    '$location', 
    'growl', 
    '$scope', 
    '$rootScope',
    'ModalService',
    'employees',
    'DTOptionsBuilder',
  function(
    UserService, 
    EventService, 
    EmployeeService,
    EventCollectionService, 
    $location, 
    growl, 
    $scope, 
    $rootScope,
    ModalService,
    employees,
    DTOptionsBuilder) {
    if(!UserService.token) {
      $rootScope.currentPath = $location.path();
      $location.path('/login');
      return;
    }
    $scope.dataTableOptions = DTOptionsBuilder.newOptions().withOption('aaSorting', [[2, 'desc']]);
    $scope.events = [];
    $scope.employees = employees.data;
    $scope.event_types = ['Marriage', 'Birthday', 'Farewell', 'Visit', 'Misc'];;
    let getEvents = function(){
      growl.info('Getting events ...');
      var evs = EventService.service.query({token: UserService.token }, 
        function(){
          $scope.events = evs;
        }
      );
    }
    let getEmployees = function(){
      var emps = EmployeeService.find({
        token: UserService.token,
        isActive: true 
      }).then(
        function(resp){
          console.log(resp.data);
          $scope.employees = resp.data;
        }
      ); 
    };
    getEvents();
    //getEmployees();
    $scope.event = {};
    $scope.insert = function() {
      //console.log($scope.event);
      $scope.event.token = UserService.token;
      EventService.service.save($scope.event).$promise.then(function(){
        growl.success('Event added!');
        $scope.event = {};
        $('#eventInserter').collapse('hide');
        getEvents();
      }, function(err){
        console.log(err);
        growl.error('Event not added!');
      });
    }
    
    $scope.closeInsert = function() {
      $scope.event = {};
      $('#eventInserter').collapse('hide');
    }

    $scope.showExcludedEmployees = function(empIds) {
      var exEmps = [];
      for(let empKey=0; empKey < $scope.employees.length; empKey++) {
        let emp = $scope.employees[empKey];
        for(let eid in empIds) {
          if(emp._id == empIds[eid]) {
            exEmps.push(emp);
          }          
        }
      }
      ModalService.showModal({
        templateUrl: '/event/excluded_employees_modal.html',
        controller: 'ExcludedEmployeeModalCtrl',
        inputs: {
          employees: exEmps
        }
      }).then(function(modal) {
        modal.element.modal();
      });
    }

    $scope.showCollectionModal = function(eventId, excludedEmpIds) {
      var collections = EventCollectionService.find({ 
        token: UserService.token,  
        event_id: eventId
      }).then(function(results){
        results = results.data;
        //Employees who can contribute
        let eligibleEmps = [];
        for(var k in $scope.employees) {
          let notEligible = false;
          for(var n in results) {
            if($scope.employees[k]._id == results[n].contributor) {
              notEligible = true;
              results[n].contributor_name = $scope.employees[k].name;
              results[n].contributor_email = $scope.employees[k].email;
              results[n].contributor_unix_id = $scope.employees[k].unix_id;
              break;
            }
          }
          if(!notEligible) {
            for(var i in excludedEmpIds) {
              if($scope.employees[k]._id == excludedEmpIds[i]) {
                notEligible = true;
                break;
              }
            }
          }

          if(!notEligible) {
            eligibleEmps.push($scope.employees[k]);
          }
        }
        ModalService.showModal({
          templateUrl: '/event/event_collection_modal.html',
          controller: 'EventCollectionModalCtrl',
          inputs: {
            eventId: eventId,
            eligibleEmps: eligibleEmps,
            contributors: results
          }
        }).then(function(modal) {
          modal.element.modal();
          modal.closed.then(function(result) {
            if(result) {
              if(result.type == 'success') {
                growl.success(result.msg);
              } else if(result.type == 'error') {
                growl.error(result.msg);
              } else {
                growl.info(result.msg);
              }              
            }
            getEvents();
          });
        });

      }, function(err) {
        console.log(err);
      });
    }
}]);