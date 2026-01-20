const dns = require('node:dns').promises;
// dns.setServers(['8.8.8.8', '8.8.4.4']); // Force use of Google DNS

async function runDnsTest() {
  const targets = [
    { name: 'Google (Standard)', host: 'google.com', type: 'A' },
    { name: 'Google (MX/SRV-like)', host: 'google.com', type: 'MX' },
    { name: 'Your MongoDB SRV', host: '_mongodb._tcp.cluster0.2stwrax.mongodb.net', type: 'SRV' }
  ];

  console.log('Current DNS Servers:', await dns.getServers());

  for (const target of targets) {
    try {
      console.log(`\nTesting ${target.name}...`);
      let result;
      if (target.type === 'SRV') {
        result = await dns.resolveSrv(target.host);
      } else if (target.type === 'MX') {
        result = await dns.resolveMx(target.host);
      } else {
        result = await dns.resolve4(target.host);
      }
      console.log(`✅ Success:`, JSON.stringify(result));
    } catch (err) {
      console.error(`❌ Failed: ${err.code} (${err.syscall})`);
    }
  }
}

runDnsTest();
