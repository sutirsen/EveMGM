#EveMGM
####A tiny event management system
EveMGM was created out of frustration of managing office party related funds manually. Features include adding new employees, adding new events, collecting money for those events and also recording expenditures for those events.

####Prerequisite 
1. [NodeJS](https://nodejs.org/en/)
2. [MongoDB](https://www.mongodb.com/)

####Starting the application
To start the application do
```
npm install
bower install
npm start
```
Currently the tests are written only for the api, to run the tests (good way to learn the app specs as well)
```
npm test
```
To add user send a get request with name, email, password and admin (a password which can be set and changed from /app/routes/index.js) parameters to /api/setup (**I know not secured and crappy**)

####What I used?
* [NodeJS](https://nodejs.org/en/)
* [MongoDB](https://www.mongodb.com/)
* [Mongoose](http://mongoosejs.com/)
* [Angular 1.6.x](https://angularjs.org/)
* [UI Router](https://github.com/angular-ui/ui-router)
* [Flat UI](http://designmodo.github.io/Flat-UI/)
* [720KB - DatePicker](https://720kb.github.io/angular-datepicker/)
* [Angular Modal Service](http://dwmkerr.github.io/angular-modal-service/)
* [Select](https://angular-ui.github.io/ui-select/)

This needs a lot of work, there is a insufficient TODO file as well. Go ahead and complete this if you have time! (or I will eventually)
