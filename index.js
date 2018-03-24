/* eslint promise/prefer-await-to-then: off */

const ns = require('node-schedule');
const debug = require('debug')('TaskList');

const Task = require('./lib/task');

const schedules = {
  daily: '30 23 * * *', // 23:30 daily
  weekly: '30 23 * * 7', // 23:30 on Sunday
  monthly: '30 23 1 * *' // 23:30 on the first day of the month.
};

// Pretty a time stamp for debug logs
const ts = () =>
  new Date().toISOString().replace('T', ' ').slice(0, 19);

class TaskList {
  constructor(opts = {}) {
    this.schedules = opts.schedules || schedules;

    // Creates a map of task names to task instances for each schedule
    this.tasks = Object.keys(this.schedules)
      .map(name => new Task(name, opts.haltTasksOnError))
      .reduce((tasks, task) => {
        tasks[task.name] = task;
        return tasks;
      }, {});
  }

  heartbeat(callback) {
    this._heartbeat = callback;
  }

  plan(scheduleKey, callback) {
    this.tasks[scheduleKey].actions(callback);
  }

  beforeEach(callback) {
    Object.keys(this.tasks).forEach(key => {
      const task = this.tasks[key];
      task.before(callback);
    });
  }

  afterEach(callback) {
    Object.keys(this.tasks).forEach(key => {
      const task = this.tasks[key];
      task.after(callback);
    });
  }

  invoke() {
    Object.entries(this.tasks)
      .forEach(([name, task]) => {
        const crontab = this.schedules[name];

        debug(`[${ts()}] Scheduling ${task.name} with crontab ${crontab}.`);
        ns.scheduleJob(crontab, () => {
          debug(`[${ts()}] Executing ${task.name}.`);
          task.run()
            .then(() => {
              debug(`[${ts()}] Task ${task.name} completed successfully.`);
            })
            .catch(err => {
              debug(`[${ts()}] Task ${task.name} errored with ${err}.`);
            });
        });
      });

    // Schedules the heartbeat
    if (this._heartbeat) {
      ns.scheduleJob('* * * * *', () => this._heartbeat());
    }

    const size = Object.keys(this.tasks).length;
    debug(`[${ts()}] Scheduled ${size} tasks.`);
  }
}

TaskList.schedules = schedules;

module.exports = TaskList;
