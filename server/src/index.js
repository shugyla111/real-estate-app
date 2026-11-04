import { app } from './app.js';
import { seedIfEmpty } from './seeder.js';

const port = Number(process.env.PORT) || 3000;

if (seedIfEmpty()) console.log('Empty database: demo offers and the demo agent were added.');

app.listen(port, () => {
  console.log(`Server: http://localhost:${port}`);
});
