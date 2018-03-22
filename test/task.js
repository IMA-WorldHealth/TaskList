import test from 'ava';
import Task from '../lib/task';

const isFn = v => typeof v === 'function';
const isStr = v => typeof v === 'string';

test('#constructor() exposes the task API', t => {
  const task = new Task('T');

  t.true(isFn(task.before));
  t.true(isFn(task.after));
  t.true(isFn(task.actions));
  t.true(isStr(task.name));
});

test('#constructor() createsa unique name if none is provided', t => {
  const task = new Task();
  t.true(isStr(task.name));
  t.true(task.name.includes('Task'));
});

test('#actions(fn) pushes an action onto the task queue', t => {
  const task = new Task();
  task.actions(() => 1);

  t.true(task._actions.length === 1);
});

test('#actions() returns the list of actions', t => {
  const task = new Task();
  task.actions(() => 1);

  const acts = task.actions();
  t.true(Array.isArray(acts));
  t.true(acts.length === 1);

  task.actions(() => 'ok');
  t.true(task.actions().length === 2);
});

test('#run() executes before(), actions(), and after() in order', async t => {
  const arr = [];
  const task = new Task();

  task.before(() => {
    arr.push(1);
  });

  task.after(() => {
    arr.push(3);
  });

  task.actions(() => {
    arr.push(2);
  });

  await task.run();

  t.deepEqual(arr, [1, 2, 3]);
});

test('#run() errors will stop execution of task chain', async t => {
  const arr = [];
  const task = new Task();

  task.before(() => {
    arr.push(1);
  });

  task.actions(() => {
    arr.push(2);
    throw new Error('Oops!');
  });

  task.after(() => {
    arr.push(3);
  });

  await t.throws(task.run());

  t.deepEqual(arr, [1, 2]);
});

test('#run() errors will not stop execution of the task chain if haltOnError = false', async t => {
  const arr = [];
  const task = new Task('WillNotHalt', false);

  task.before(() => {
    arr.push(1);
  });

  task.actions(() => {
    arr.push(2);
    throw new Error('Oops!');
  });

  task.after(() => {
    arr.push(3);
  });

  await task.run();
  t.deepEqual(arr, [1, 2, 3]);
});
