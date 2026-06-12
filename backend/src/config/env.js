const path = require('path');
const dotenv = require('dotenv');

const envFiles = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env')
];

for (const file of envFiles) {
  dotenv.config({ path: file, quiet: true });
}
