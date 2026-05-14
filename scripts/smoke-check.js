const fetch = global.fetch || require('node-fetch');

const endpoints = [
  'http://localhost:3000/api/semesters',
  'http://localhost:3000/capstone'
];

async function check(url) {
  try {
    const res = await fetch(url);
    const ok = res.ok;
    const status = res.status;
    return { ok, status };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  }
}

async function main() {
  const timeoutMs = 30000;
  const start = Date.now();

  for (const url of endpoints) {
    let last = null;
    while (Date.now() - start < timeoutMs) {
      const res = await check(url);
      if (res.ok) {
        console.log(`${url} => OK (${res.status})`);
        last = res;
        break;
      } else {
        process.stdout.write('.');
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!last) {
      console.error(`\n${url} did not respond within ${timeoutMs}ms`);
      process.exit(2);
    }
  }
  console.log('Smoke check passed');
  process.exit(0);
}

main();
