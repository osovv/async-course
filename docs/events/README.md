# Events Description

## Business Events

- Users.RoleChanged:

```
  Producer: Auth Service
  Consumers: Task Tracker, Accounting, Analytics
```

- Task.Created

```
  Producer: Task Tracker
  Consumers: Accounting, Analytics
```

- Tasks.Assigned

```
  Producer: Task Tracker
  Consumers: Accounting, Analytics
```

- Tasks.Completed

```
  Producer: Task Tracker
  Consumers: Accounting, Analytics
```

- Accounting.PeriodClosed

```
  Producer: Accounting
  Consumers: Accounting
```

- Accounting.BalanceChanged

```
  Producer: Accounting
  Consumers: Accounting
```

- Accounting.BalanceReset

```
  Producer: Accounting
  Consumers: Accounting
```

- Accounting.ChangeAudited

```
  Producer: Accounting
  Consumers: Accounting
```

## CUD Events

- Users.Created

```
  Producer: Auth Service
  Consumers: Task Tracker, Accounting, Analytics
```

- Users.LoggedIn

```
  Producer: Auth Service
  Consumers: Task Tracker, Accounting, Analytics
```

- Users.LoggedOut

```
  Producer: Auth Service
  Consumers: Task Tracker, Accounting, Analytics
```

- Accounting.PricesSet

```
  Producer: Accounting
  Consumers: None
```

- Accounting.ChangeAudited

```
  Producer: Accounting
  Consumers: None
```

- Accounting.ResetAudited

```
  Producer: Accounting
  Consumers: None
```
