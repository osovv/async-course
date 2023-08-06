# Business Requirements Analysis

## Event Storming

### Task Tracker

---

The task tracker shall be a separate dashboard and available to all employees of UberPopug Inc.

_A Read Model._

---

Authorization in the Task Tracker should be done through UberPopug Inc's general authorization service (we have an innovative beak shape-based authorization system there).

```
Actor: User
Command: Authorize User
Data: Account + Account Public Id
Event: Users.LoggedIn
```

---

New tasks can be created by anyone (administrator, supervisor, developer, manager and any other role). The task must have a description, status (completed or not) and a randomly selected parrot (except for manager and administrator) to whom the task is assigned.

```
Actor: Authorized User (with any role)
Command: Create Task
Data: Task + Task Public Id
Event: Tasks.Created + Tasks.Assigned
```

---

Managers or administrators should have a "assign tasks" button that will take all open tasks and randomly assign each one to any of the employees (except manager and administrator)

```
Actor: Authorized User (with `manager` or `administrator` role)
Command: Assign Tasks
Data: None
Event: Tasks.Assigned (for each task)
```

---

Each employee should be able to see the list of tasks assigned to him/her in a separate place

_A Read Model_

---

Each employee should be able to see the list of tasks assigned to him/her in a separate place

---

Every employee should be able to mark a task complete.

```
Actor: Authorized User
Command: Complete Task
Data: Task + User Public Id
Event: Tasks.Completed
```

### Accounting

---

Accounting should be in a separate dashboard and accessible only to administrators and accountants.

_A Read Model with role constraints_

---

Authorization in the Accounting Dashboard must be done through the UberPopug Inc. shared authentication service.

_A Constraint_

---

Each employee should have an account that shows how much money they have received today.

Showing is a _A Read Model_

Also, there is a Command

```
Actor: Task.Assigned + Task.Completed
Command: Change Balance
Data: Task Public Id + Task Costs
Event: Accounting.BalanceChanged
```

---

Pricing:

- Prices for a task are determined on a one-time basis, at the moment it appears in the system (it is possible with a minimum delay), prices are calculated without binding to an employee
- The formula that tells how much money to charge an employee for a completed task - `rand(-10..-20)$`
- The formula that says how much money to charge an employee for a completed task - `rand(20..40)$`.
- The money is written off immediately after the assay on the employee, and credited after the task is completed.
- A negative balance is carried over to the next day. The only way to pay it off is to close enough tasks during the day.

```
Actor: Tasks.Created
Command: Set Task Prices
Data: Task
Event: Accounting.PricesSet (not used)
```

```
Actor: Tasks.Assigned, Tasks.Completed
Command: Charge Money
Data: Task + Account Public Id
Event: Accounting.BalanceChanged
```

---

The account should have an audit log of what the money was charged or credited for, with a detailed description of each task.

```
Actor: Accounting.BalanceChanged
Command: Audit Balance Change
Data: Account + Balance Change
Event: Accounting.ChangeAudited
```

---

Dashboard should display the amount of money earned by top management today.

_A Read Model with role constraints_

---

At the end of the day, it is necessary to:

Actor: Cron
Command: Close Billing Period
Data: None
Event: Accounting.PeriodClosed

a) Count how much money the employee received during the workday

_A Read Model_

b) Send the amount of the payment to the e-mail.

```
Actor: Accounting.PeriodClosed
Command: Send Bill
Data: Account + Payment
Event: Accounting.BillSent
```

---

Once the balance has been paid (at the end of the day), it should reset to zero and the audit log of all account transactions should show that an amount has been paid.

```
Actor: Accounting.PeriodClosed
Command: Reset Balance
Data: Account
Event: Accounting.BalanceReset
```

```
Actor: Accounting.BalanceReset
Command: Audit Balance Reset
Data: Account
Event: Accounting.ResetAudited
```

---

Dashboard should display information by day, not for the whole period at once.

_A Read Model_

### Analytics

---

Analytics is a separate dashboard available only to admins.

_A Read Model with role constraints_

---

It is necessary to show how much the top management earned today and how many employees went into the minus.

_A Read Model_

---

It is necessary show the most expensive task for the day, week or month.

_A Read Model_

---

## Business Sequences

Format: `C: <Command Name> -> E: <Event Name> -> ...`

### Task Creation

`C: Create Task -> E: Tasks.Created -> C: Set Task Prices -> Accounting.PricesSet`

### Task Assignment

`C: Create Task / C: Assign Task -> E: Tasks.Assigned -> C: Charge Money -> E: Accounting.BalanceChanged -> E: Accounting.ChangeAudited`

### Task Completion

`C: Complete Task -> E: Tasks.Completed -> C: Charge Money -> E: Accounting.BalanceChanged -> E: Accounting.ChangeAudited`

### Closing a Day

`C: Close Billing Period -> E: Accounting.PeriodClosed -> C: Accounting.SendBill -> E: Accounting.BillSent`

`C: Close Billing Period -> E: Accounting.PeriodClosed -> C: Accounting.ResetBalance -> E: Accounting.BalanceReset -> C: Audit Balance Reset -> E: Accounting.ResetAudited`
