
Table:
| Column Name  | Data Type    | Constraints                  | Description                                     |
| ------------ | ------------ | ---------------------------- | ----------------------------------------------- |
| `id`         | INT          | PRIMARY KEY, AUTO\_INCREMENT | Unique user ID                                  |
| `username`   | VARCHAR(255) | UNIQUE, NOT NULL             | User's login name (used as email in some logic) |
| `email`      | VARCHAR(255) | UNIQUE, NOT NULL             | User's email address                            |
| `password`   | VARCHAR(255) | NOT NULL                     | User's password                                 |
| `full_name`  | VARCHAR(255) | NULL                         | Full name of the user                           |


Note:
1.I am Using curl to test from backend.
2.It is an basic overview for sql query + nodejs testing.
3.Basic authentication logics used. Can be modified.
4.Email is used for finding the user and not changing email address for now. Code can tweaked acc. to requirements.
