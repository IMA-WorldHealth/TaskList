# TaskList

[![Build Status](https://travis-ci.org/IMA-WorldHealth/TaskList.svg?branch=master)](https://travis-ci.org/IMA-WorldHealth/TaskList)
[![Coverage Status](https://coveralls.io/repos/github/IMA-WorldHealth/TaskList/badge.svg?branch=master)](https://coveralls.io/github/IMA-WorldHealth/TaskList?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/IMA-WorldHealth/TaskList.svg)](https://greenkeeper.io/)

TaskList is a cron-like scheduler to make running tasks more intuitive and
readable.  Given a set of schedules TaskList provides an API to execute actions
before, during, and after the schedule.  For example:

```js
const TaskList = require('TaskList');
const fs = require('mz/fs');

// Add schedules to the task list using their cron syntax.
const schedules = {
  heartbeat : '* * * * *', // Every minute
  hourly : '30 * * * *',  // Every hour on the half hour
  daily : '30 23 * * *', // Run at 23:30 every day
};

const list = new TaskList({schedules});

list.beforeEach(() => {
  console.log('Check me out.');
});

// This will run on the schedule above
list.plan('heartbeat', () => {
  console.log('beep boop');
});

/
list.plan('daily', () => {
  console.log('I will only run once a day!');
});

list.plan('daily', () => {
  console.log('I will run after the daily plan.');
  console.log('You can schedule more than one task on each schedule.');
});

// This action returns a promise.  If it errors, no subsequent actions will
// be taken.
list.plan('hourly', () => fs.writeFile('hello.txt', 'Hello world!', 'utf8'));

// If the above function succeeded, we can clean up the file that we created.
list.after('hourly', () => fs.unlink('hello.txt'));

// start the scheduler
list.invoke();
```

As shown above, you can use cron syntax.  TaskList uses
[node-schedule](https://github.com/node-schedule/node-schedule) under the hood -
any valid schedule for node-schedule will work for TaskList.
