import fs from 'node:fs';
import path from 'node:path';
const changes = [];
function prepare(relative, transform) {
  const file = path.resolve(relative);
  if (!fs.existsSync(file)) throw new Error('Không tìm thấy ' + relative + '. Chạy lệnh tại myrpg.');
  const before = fs.readFileSync(file, 'utf8'), after = transform(before);
  if (after !== before) changes.push({ file, before, after });
}
prepare('src/game/scenes/BaseWorldScene.js', source => {
  if (source.includes('new FishingSystem(this)')) return source;
  const anchor = /this\.hud\s*=\s*new RPGHUD\([^;]+\);/g;
  if ([...source.matchAll(anchor)].length !== 1) throw new Error('BaseWorldScene.js khác mẫu. Chưa sửa file nào. Xem hướng dẫn thủ công.');
  return "import { FishingSystem } from '../systems/FishingSystem.js';\n" + source.replace(anchor, '$&\n        this.fishing = new FishingSystem(this);');
});
prepare('backend/src/app.js', source => {
  if (source.includes("require('./routes/fishing.routes')") || source.includes('require("./routes/fishing.routes")')) return source;
  const anchor = /app\.use\(\s*['"]\/api\/auth['"]\s*,\s*require\(\s*['"]\.\/routes\/auth\.routes['"]\s*\)\s*\)\s*;/g;
  if ([...source.matchAll(anchor)].length !== 1) throw new Error('app.js khác mẫu. Chưa sửa file nào. Xem hướng dẫn thủ công.');
  return source.replace(anchor, "$&\napp.use('/api/fishing', require('./routes/fishing.routes'));");
});
for (const change of changes) {
  let backup = change.file + '.before-fishing.bak';
  if (fs.existsSync(backup)) backup += '.' + Date.now();
  fs.writeFileSync(backup, change.before); fs.writeFileSync(change.file, change.after);
  console.log('Đã cập nhật: ' + change.file);
}
console.log(changes.length ? 'Đã gắn câu cá. Chạy fishing.sql, khởi động lại backend và frontend.' : 'Đã gắn câu cá từ trước. Không sửa trùng.');
