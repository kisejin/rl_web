// Keep only a suffix that could be the beginning of a credential. This avoids
// leaking a key split across provider deltas without buffering ordinary tokens.
export function secretFilter(secret) {
  let pending = "";
  return {
    push(text) {
      pending += text;
      let output = "",
        index;
      while ((index = pending.indexOf(secret)) >= 0) {
        output += pending.slice(0, index) + "[redacted]";
        pending = pending.slice(index + secret.length);
      }
      let suffix = Math.min(secret.length - 1, pending.length);
      while (suffix && !secret.startsWith(pending.slice(-suffix))) suffix--;
      output += suffix ? pending.slice(0, -suffix) : pending;
      pending = suffix ? pending.slice(-suffix) : "";
      return output;
    },
    finish() {
      const text = pending;
      pending = "";
      return text;
    },
  };
}
