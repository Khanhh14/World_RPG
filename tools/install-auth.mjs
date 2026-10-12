import fs from 'node:fs';
import path from 'node:path';
// Chạy từ thư mục myrpg: node tools/install-auth.mjs
const root = process.cwd();
const file = path.join(root, 'src/game/main.js');
if (!fs.existsSync(file)) throw new Error('Hãy chạy lệnh tại thư mục myrpg, nơi có src/game/main.js.');
const source = fs.readFileSync(file, 'utf8');
if (source.includes('export default withAuth(StartGame)')) {
  console.log('Auth đã được gắn. Không cần sửa lại.');
} else {
  const matches = [...source.matchAll(/^export[ \t]+default[ \t]+StartGame[ \t]*;?[ \t]*$/gm)];
  if (matches.length !== 1 || source.includes('withAuth')) throw new Error('File main.js khác mẫu. Chưa sửa file. Xem hướng dẫn tích hợp thủ công trong README.');
  let backup = file + '.before-auth.bak';
  if (fs.existsSync(backup)) backup = file + `.before-auth-${Date.now()}.bak`;
  fs.copyFileSync(file, backup);
  const updated = "import { withAuth } from '../auth/bootstrap.js';\n" + source.replace(/^export[ \t]+default[ \t]+StartGame[ \t]*;?[ \t]*$/m, 'export default withAuth(StartGame);');
  fs.writeFileSync(file, updated);
  console.log('Đã gắn đăng nhập trước khi tạo Phaser. Bản sao lưu: ' + path.basename(backup));
}
