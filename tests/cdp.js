// Minimal Chrome DevTools Protocol driver for headless play-testing.
// Usage: const T = await require('./cdp')(url); await T.eval('1+1'); await T.key('w'); await T.shot('/tmp/x.png'); T.close();
const { spawn } = require('child_process');
const fs = require('fs');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
module.exports = async function (url, opts = {}) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const dir = fs.mkdtempSync('/tmp/cdp-');
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${opts.w || 1440},${opts.h || 900}`, 'about:blank'], { stdio: 'ignore' });
  // never leave a headless Chrome behind (they kept playing the game's music after tests ended)
  process.on('exit', () => { try { proc.kill('SIGKILL'); } catch (e) {} });
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch (e) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.consoleAPICalled') logs.push(d.params.type + ': ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
    if (d.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    if (d.method === 'Log.entryAdded') logs.push('LOG ' + d.params.entry.level + ': ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: opts.w || 1440, height: opts.h || 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, opts.wait || 1500));
  const T = {
    logs,
    send,
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
      return r.result.result.value;
    },
    async key(k, ms = 250) {
      const map = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, Escape: 27, ' ': 32 };
      const code = map[k] || k.toUpperCase().charCodeAt(0);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, windowsVirtualKeyCode: code, text: k.length === 1 ? k : undefined });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: code });
      await new Promise((r) => setTimeout(r, ms));
    },
    async type(s) { for (const ch of s) await send('Input.dispatchKeyEvent', { type: 'char', text: ch }); },
    async click(x, y) {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    },
    async shot(path) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path, Buffer.from(r.result.data, 'base64'));
    },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    close() { try { ws.close(); } catch (e) {} proc.kill('SIGKILL'); },
  };
  return T;
};
