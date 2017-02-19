let Event           = require('../app/models/event');
let EventExpense    = require('../app/models/event_expense');
let EventCollection = require('../app/models/event_collection');
let Employee        = require('../app/models/employee');

let newEmployee = (empName, empId, unixId, emailId) => {
  let emp           = new Employee();
  emp.name          = empName || 'John Smith';
  emp.email         = emailId || 'john.smith@example.com';
  emp.employee_id   = empId || 987456321;
  emp.unix_id       = unixId || 'jsmith';
  emp.date_of_birth = '1990-01-01';
  return emp;
}

let newEvent = (name, amount, excluded_employees) => {
  let ev                = new Event();
  ev.name               = name || 'Random Event';
  ev.type               = 'Birthday';
  ev.date_of_event      = '2016-01-01';
  ev.collectible_amount = (amount == 'undefined') ? 300 : amount;
  ev.excluded_employees = excluded_employees || [];
  return ev;
}

let newEventExpense = (event, madeBy, name, amount) => {
  let evex              = new EventExpense();
  evex.name             = name || 'Random Stuff';
  evex.amount           = (amount == 'undefined') ? 300 : amount;
  evex.expense_date     = '2016-06-06';
  evex.event_id         = event || null;
  evex.expense_made_by  = madeBy || null;
  evex.misc_details     = 'TransactionID:NA';
  return evex;
}

let newEventCollection = (event, contributor, amount = 300) => {
  let evCol               = new EventCollection();
  evCol.amount            = amount;
  evCol.contribution_date = '2016-06-06'; 
  evCol.mode_of_payment   = 'PayTm';
  evCol.event_id          = event || null;
  evCol.contributor       = contributor || null;
  evCol.misc_details      = 'TransactionID:NA';
  return evCol;
}

module.exports = {
  newEmployee,
  newEvent,
  newEventExpense,
  newEventCollection
}
