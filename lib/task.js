/* eslint promise/prefer-await-to-then: off */

/**
 * @class Task
 *
 * @description
 * The Task class provides a container for actions run before, during, and after
 * a particular task.  These are exposed via the Task API methods before(),
 * actions(), and after() respectively.
 *
 * Importantly, all actions in a task are serialized into a promise chain.  By
 * default, if any action fails, regardless of it is in the before(), actions(),
 * or after() portion of the class, it will halt the subsequent actions.  To
 * prevent this action, pass 'false' as the second parameter to the constructor.
 */
const debug = require('debug')('TaskList::Task');

const uid = (seed = 3) => `Task${Math.floor(Math.random() * (10 ** seed))}`;

class Task {
  constructor(name = uid(), haltOnError = true) {
    this.name = name;
    this._haltOnError = haltOnError;
    this._before = [];
    this._after = [];
    this._actions = [];

    const makeApiFn = key => (
      callback => {
        if (callback) {
          this[key].push(callback);
        }

        return this[key];
      }
    );

    // Expose the before(), after(), and actions() methods
    this.before = makeApiFn('_before');
    this.after = makeApiFn('_after');
    this.actions = makeApiFn('_actions');
  }

  // Combines all promises and runs them in order
  run() {
    const combined = [...this.before(), ...this.actions(), ...this.after()];
    debug(`Task[${this.name}] Executing ${combined.length} actions.`);

    const shouldHaltOnError = this._haltOnError;

    // If the chain should halt on error, the task function is returned to the
    // .then(), propagating errors.  If the task chain should not halt on error,
    // the task is insulated in a Promise.resolve() which will always return
    // true.
    const enqueue = (chain, task) => chain
      .then(task)
      .catch(err => {
        debug(`Task[${this.name}] Error ${err}.`);
        if (shouldHaltOnError) {
          debug(`Task[${this.name}] Exiting due to error.`);
          return Promise.reject(err);
        }

        debug(`Task[${this.name}] haltOnError = false, continuing despite error.`);
        return Promise.resolve();
      });

    return combined.reduce(enqueue, Promise.resolve());
  }

  // Pretty print the task to the console.
  toString() {
    return `Task[${this.name}] {
      before: ${this._before.length} actions,
      tasks: ${this._actions.length} actions,
      after: ${this._after.length} actions,
    }`;
  }
}

module.exports = Task;
