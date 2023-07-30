## Primary documentation

## Requirements

- There must be a _Auth_ service.
- There must be a _Task Tracker_ service
- There must be a _Accounting_ service.
- There must be a _Analytics_ service.
- A complex user interface is not required
- Will not be high load
- No real time required

---

### Auth.

SSO.

- Creates, stores, and synchronizes user sessions between other services;
- There are several user roles: `administrator` `manager` | `accountant` | `worker`.

#### Communications

- Generates `UserCreated`, `UserRemoved`, `UserLoggedIn`, `UserLoggedOut`, `UserRoleChanged` events.

---

### Task Tracker

Has a dashboard with tasks and a customizable task card.

- AuthN and AuthZ using the `Auth` service.
- Has only tasks, no projects, ranges, etc.
- New tasks can be created by any user. The task must have a description, status and assigned user.
- Users are assigned randomly.
- The `manager` and `administrator` roles cannot be assigned to a task.
- There must be a `Reassign Tasks` button that randomly reassigns all incomplete tasks. This is the only way to assign a task. Each user can have an unlimited number of tasks (0, 1, 100, etc).
- A task must always have an assignee. It is not possible to create an unassigned task.
- Each user must be able to complete a task and see a list of tasks assigned to them.

#### Communication

- Produces `TaskCreated`, `TaskReassigned`, `TaskCompleted` events.
- Consumes `UserCreated`, `UserRemoved`, `UserLoggedIn`, `UserLoggedOut`, `UserRoleChanged`, `TaskPriceSet` events.

---

### Accounting

- AuthN and AuthZ using the `Auth` service.
- Has a separate dashboard for the `administrator` and `bookkeeper` roles.
- Users who are not administrators must have their own dashboard
- Each task has two prices: `assign_price = rand(-10, 20)` and `complete_price = rand(20, 40)`.
- Prices are set once when registering a task in the system
- Negative balance is carried over to the next day

#### Communication

- Produces the `MoneyCharged` event.

- Consumes the `UserCreated`, `UserRemoved`, `UserLoggedIn`, `UserLoggedOut`, `UserRoleChanged`, `TaskCreated`, `TaskReassigned`, `TaskCompleted` events.

---

### Analytics

- AuthN and AuthZ using the `Auth` service.
- Available only for the `administrator` role
- Should show how much money top management made in a certain period (e.g. a day) and how many employees have a negative balance
- Should show the most expensive task in a specific period.

#### Communications

- Consumes `UserCreated`, `UserRemoved`, `UserLoggedIn`, `UserLoggedOut`, `UserRoleChanged`, `MoneyCharged` events.

---

## Problems

### The need for services

- It seems that the separation into services is unnecessary. The business logic is pretty simple and there won't be much load. So a simple monolith is fine.

### Network failure

- The system should track when a network failure occurred and reproduce/consume all failed events.

### Database Failure

- It should be possible to first send a message to the queue and then write to the database. In case of failure - use the produced event to re-execute the operation.
