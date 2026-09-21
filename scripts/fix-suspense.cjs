const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Remove Suspense wrapper around ParticleCanvas
code = code.replace(
  `      {/* ══════════════════════════ PARTICLES (SITE-WIDE) ══════════════════════════ */}\r\n      <Suspense fallback={null}>\n        <ParticleCanvas theme={activeTheme} />\n      </Suspense>`,
  `      {/* ══════════════════════════ PARTICLES (SITE-WIDE) ══════════════════════════ */}\r\n      <ParticleCanvas theme={activeTheme} />`
);

fs.writeFileSync('src/pages/Home.tsx', code);
console.log('Suspense removed, done. Lines now:', code.split('\n').length);
