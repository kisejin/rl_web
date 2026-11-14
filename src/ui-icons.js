// Consistent control icons, independent of the operating system's symbol font.
const paths = {
  chat: "M21 11.5a8.4 8.4 0 0 1-9 8.5 10 10 0 0 1-4-.8L3 21l1.8-5A9 9 0 1 1 21 11.5Z",
  close: "m6 6 12 12M6 18 18 6",
  send: "m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13",
  stop: "M6 6h12v12H6Z",
  copy: "M9 9h12v12H9ZM15 5V3H3v12h2",
  book: "M12 5v16M3 3h4a5 5 0 0 1 5 2 5 5 0 0 1 5-2h4v16h-4a5 5 0 0 0-5 2 5 5 0 0 0-5-2H3Z",
  sparkles: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",

  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  "arrow-left": "M19 12H5m6 6-6-6 6-6",
  "arrow-up-right": "M7 17 17 7M7 7h10v10",
  "chevron-left": "m15 18-6-6 6-6",
  "chevron-right": "m9 6 6 6-6 6",
  sun: "M12 3v1m0 16v1M3 12h1m16 0h1M5.6 5.6l.7.7m11.4 11.4.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20.5 13a8.5 8.5 0 1 1-9.5-9.5A7 7 0 0 0 20.5 13Z",
  monitor: "M4 4h16v12H4ZM8 20h8m-4-4v4",
  undo: "M3 10h11a6 6 0 0 1 0 12M3 10l5-5M3 10l5 5",
  redo: "M21 10H10a6 6 0 0 0 0 12M21 10l-5-5m5 5-5 5",
  reset: "M3 10a9 9 0 1 1 1 8M3 4v6h6",
  play: "m8 5 11 7-11 7Z",
  pause: "M8 5v14M16 5v14",
  sliders: "M4 7h16M4 17h16M8 4v6m8 4v6",
};
export function uiIcon(name) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[name] || paths["arrow-right"]}"/></svg>`;
}
