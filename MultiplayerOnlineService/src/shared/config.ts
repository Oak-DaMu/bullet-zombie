import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '/', 'config.yml');
const yamlLoad: any = yaml.load(readFileSync(filePath, 'utf-8'));

export default () => ({
  isTest: process.env.NODE_ENV === 'test',
  isOnline: process.env.NODE_ENV === 'online',
  port: process.env.PORT,
  apiPrefix: process.env.API_PREFIX,
  domain: process.env.DOMAIN,
  staticPath: path.join(process.cwd(), '/static'),
  template: {
    secret: process.env.TEMPLATE_SECRET || yamlLoad.jwtServer.secret,
    expiresIn: process.env.TEMPLATE_EXPIRE || yamlLoad.jwtServer.exp,
    email_auth_user: process.env.TEMPLATE_MAIL_AUTH_USER || yamlLoad.emailServer.user,
    email_pass: process.env.TEMPLATE_MAIL_AUTH_PASS || yamlLoad.emailServer.pass
  },
});
