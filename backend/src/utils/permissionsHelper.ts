import fs from 'fs';
import path from 'path';

export const configPath = path.join(__dirname, '../../../adminPermissions.json');

export const getAdminPermissions = (): string[] => {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return ['projects.read', 'projects.create', 'projects.update', 'projects.delete', 'users.read', 'users.create', 'users.update'];
};
