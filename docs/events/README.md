# Events Description

## Business Events

- Users.RoleChanged:

```
user_id: string
role: enum

```

```
Producer: Auth Service
Consumers: Task Tracker, Accounting, Analytics
```

- Task.Created

```
creator_id: string
description: string
```

```
Producer: Task Tracker
Consumers: Accounting, Analytics
```

- Tasks.Assigned

```
assignee_id: string
```

```
Producer: Task Tracker
Consumers: Accounting, Analytics
```

- Tasks.Completed

```
assignee_id: string
```

```
Producer: Task Tracker
Consumers: Accounting, Analytics
```

- Accounting.PeriodClosed

```
date_from: Timestamp with TZ
date_to: Timestamp with TZ
```

```
Producer: Accounting
Consumers: Accounting
```

- Accounting.MoneyWithdrawn

```
balance_id: string
amount: number
```

```
Producer: Accounting
Consumers: Accounting
```

- Accounting.MoneyDeposited

```
balance_id: string
amount: number
```

```
Producer: Accounting
Consumers: Accounting
```

- Accounting.BalanceReset

```
balance_id: string
```

```
Producer: Accounting
Consumers: Accounting
```

## CUD Events

- Users.Created

```
user_id: string
role: string
name: string
email: string
```

```
Producer: Auth Service
Consumers: Task Tracker, Accounting, Analytics
```

- Users.LoggedIn

```
user_id: string
```

```
Producer: Auth Service
Consumers: Task Tracker, Accounting, Analytics
```

- Users.LoggedOut

```
user_id: string
```

```
Producer: Auth Service
Consumers: Task Tracker, Accounting, Analytics
```

- Accounting.PricesSet

```
task_id: string
price_withdraw: string
price_deposit: string
```

```
Producer: Accounting
Consumers: None
```

- Accounting.ChangeAudited

```
balance_id: string
audit_log_entry_id: string
```

```
Producer: Accounting
Consumers: Accounting
```

- Accounting.ResetAudited

```
balance_id: string
```

```
Producer: Accounting
Consumers: None
```
