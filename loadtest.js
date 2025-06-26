import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  vus: 1000,
  duration: '30s',
};

const users = [
  { username: 'jayesh4@example.com', password: '2secure' },
  { username: 'pratham@egmail.com', password: 'supersecret123' },
  { username: 'prathambl@egmail.com', password: 'supersecret123' },
  { username: 'pratham123@gmail.com', password: 'supersecret123' },
];

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
};

export default function () {
  // Round-robin based on virtual user ID
  const user = users[__VU % users.length];

  const payload = 
    `grant_type=password&username=${encodeURIComponent(user.username)}&password=${encodeURIComponent(user.password)}&client_id=my-client-id&client_secret=my-client-secret`;

  const res = http.post('http://localhost:8000/login/token', payload, { headers });

  check(res, {
    'status was 200': (r) => r.status === 200,
  });

  sleep(0.2); // short delay to reduce hammering
}
