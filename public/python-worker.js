// Each run receives a fresh CPython interpreter in a disposable worker.
(async () => {
  try {
    const { loadPyodide } = await import("/python-runtime/pyodide.mjs");
    const python = await loadPyodide({ indexURL: "/python-runtime/" });
    let stdout = [];
    python.setStdout({
      batched: (text) => {
        if (stdout.join("").length < 16000) stdout.push(text);
      },
    });
    python.setStderr({
      batched: (text) => {
        if (stdout.join("").length < 16000) stdout.push(text);
      },
    });
    self.onmessage = ({ data }) => {
      stdout = [];
      try {
        python.globals.set("_request_json", JSON.stringify(data));
        const serialized = python.runPython(`
import json as _json, math as _math, copy as _copy, traceback as _traceback
_request = _json.loads(_request_json)
def _equal(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) is type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return _math.isfinite(a) and abs(a-b) <= 1e-7 * max(1, abs(b))
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(_equal(x,y) for x,y in zip(a,b))
    return a == b

def _judge():
    namespace = {'__name__': '__main__'}
    try:
        exec(compile(_request['source'], '<solution>', 'exec'), namespace)
        function = namespace.get(_request['name'])
        if not callable(function):
            raise NameError('Function not found: ' + _request['name'])
    except BaseException:
        return {'error': _traceback.format_exc(limit=6)}
    results = []
    for test in _request['tests']:
        expected = 'raise ValueError' if test.get('throws') else repr(test.get('expected'))
        try:
            actual = function(*_copy.deepcopy(test['args']))
            results.append({'pass': not test.get('throws', False) and _equal(actual, test.get('expected')), 'actual': repr(actual)[:16000], 'expected': expected})
        except BaseException as error:
            results.append({'pass': bool(test.get('throws')) and isinstance(error, ValueError), 'error': type(error).__name__ + ': ' + str(error), 'actual': type(error).__name__ + ': ' + str(error), 'expected': expected})
    return {'results': results}
_json.dumps(_judge())
`);
        self.postMessage({
          ...JSON.parse(serialized),
          stdout: stdout.join("\n"),
        });
      } catch (error) {
        self.postMessage({ error: error.message, stdout: stdout.join("\n") });
      }
    };
    self.postMessage({ type: "ready" });
  } catch (error) {
    self.postMessage({
      error:
        "Could not load Python. Check your connection and retry. " +
        error.message,
    });
  }
})();
