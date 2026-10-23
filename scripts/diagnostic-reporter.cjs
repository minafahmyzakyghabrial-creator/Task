module.exports = class {
  onTestEnd(test, result) { console.log(test.title, result.status, ...result.errors.map(e => e.message)); }
  onEnd(result) { console.log('RUN RESULT:', result.status); }
};
