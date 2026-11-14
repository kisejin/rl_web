// CPython runs locally in a disposable Pyodide worker. Bootstrap and execution
// have separate limits so the first runtime download does not count as code time.
export function runCode(source, lab, timeout = 3000) {
  return new Promise((resolve) => {
    const worker = new Worker("/python-worker.js", { type: "module" });
    let finished = false;
    let timer = setTimeout(
      () =>
        finish({
          error:
            "Python runtime loading timed out. Check your connection and retry.",
        }),
      60000,
    );
    function finish(result) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    }
    worker.onmessage = ({ data }) => {
      if (data.type === "ready") {
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            finish({
              error:
                "Exceeded 3 seconds. Check the stopping condition of your loop.",
            }),
          timeout,
        );
        worker.postMessage({ source, name: lab.fn, tests: lab.tests });
      } else finish(data);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish({
        error:
          event.message || "Could not start the Python worker. Please retry.",
      });
    };
  });
}
