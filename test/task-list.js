import test from 'ava';
import TaskList from '..';

const isFn = v => typeof v === 'function';
const isObj = v => typeof v === 'object';

test('new TaskList() creates a new TaskList w/o options', t => {
  const list = new TaskList();
  t.true(list instanceof TaskList);

  t.true(isObj(list.tasks));
  t.true(isObj(list.schedules));

  t.true(isFn(list.beforeEach));
  t.true(isFn(list.afterEach));
  t.true(isFn(list.plan));
  t.true(isFn(list.invoke));
  t.true(isFn(list.heartbeat));
});

test('TaskList exposes default schedules via the schedules property', t => {
  t.true(typeof TaskList.schedules === 'object');
});

test('TaskList defaults to default schedules if none are provided', t => {
  const list = new TaskList();
  t.is(TaskList.schedules, list.schedules);
});

test('TaskList supports passing in custom schedules', t => {
  const schedules = {custom: '5 * * * *'};
  const list = new TaskList({schedules});

  t.is(schedules, list.schedules);
});

test.cb('plan(key, callback) calls the callback on schedule', t => {
  t.plan(1);

  // This test uses node-schedule's flexibility to speed the test up, avoiding
  // the need to wait for ~1 minute to listen to the heartbeat.
  const OneSecondInFuture = new Date();
  OneSecondInFuture.setSeconds(OneSecondInFuture.getSeconds() + 1);

  const list = new TaskList({schedules: {OneSecondTest: OneSecondInFuture}});
  list.plan('OneSecondTest', () => {
    t.pass();
    t.end();
  });

  list.invoke();
});

test.cb('beforeEach(callback) calls the callback before each schedule', t => {
  t.plan(3);

  // This test uses node-schedule's flexibility to speed the test up, avoiding
  // the need to wait for ~1 minute to listen to the heartbeat.
  const OneSecondInFuture = new Date();
  OneSecondInFuture.setSeconds(OneSecondInFuture.getSeconds() + 1);

  const TwoSecondInFuture = new Date();
  TwoSecondInFuture.setSeconds(TwoSecondInFuture.getSeconds() + 2);

  const ThreeSecondInFuture = new Date();
  ThreeSecondInFuture.setSeconds(ThreeSecondInFuture.getSeconds() + 3);

  const schedules = {OneSecondInFuture, TwoSecondInFuture, ThreeSecondInFuture};

  const list = new TaskList({schedules});

  list.beforeEach(() => {
    t.pass();
  });

  list.plan('ThreeSecondInFuture', () => {
    t.end();
  });

  list.invoke();
});

test.cb('afterEach(callback) calls the callback after each schedule', t => {
  // This test uses node-schedule's flexibility to speed the test up, avoiding
  // the need to wait for ~1 minute to listen to the heartbeat.
  const OneSecondInFuture = new Date();
  OneSecondInFuture.setSeconds(OneSecondInFuture.getSeconds() + 1);

  const TwoSecondInFuture = new Date();
  TwoSecondInFuture.setSeconds(TwoSecondInFuture.getSeconds() + 2);

  const ThreeSecondInFuture = new Date();
  ThreeSecondInFuture.setSeconds(ThreeSecondInFuture.getSeconds() + 3);

  const schedules = {OneSecondInFuture, TwoSecondInFuture, ThreeSecondInFuture};

  const list = new TaskList({schedules});

  list.afterEach(() => {
    t.end();
  });

  list.plan('ThreeSecondInFuture', () => {
    t.pass();
  });

  list.invoke();
});
