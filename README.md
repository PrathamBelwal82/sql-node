
Table:
| Column Name  | Data Type    | Constraints                  | Description                                     |
| ------------ | ------------ | ---------------------------- | ----------------------------------------------- |
| `id`         | INT          | PRIMARY KEY, AUTO\_INCREMENT | Unique user ID                                  |
| `username`   | VARCHAR(255) | UNIQUE, NOT NULL             | User's login name (used as email in some logic) |
| `email`      | VARCHAR(255) | UNIQUE, NOT NULL             | User's email address                            |
| `password`   | VARCHAR(255) | NOT NULL                     | User's password                                 |
| `full_name`  | VARCHAR(255) | NULL                         | Full name of the user                           |

### 📌 Notes

- I am using curl to test from the backend.
- This is a basic overview for SQL queries + Node.js testing.
- Basic authentication logic is used. Can be modified.
- Email field is used for finding the user so not updating the email address for now . The code can be tweaked as per requirements.
- Most logics like same email or username are added through sql table only using UNIQUE Constraint.
- Used both HTTP request headers and cookies for practice while authorizing OAuth access token.
