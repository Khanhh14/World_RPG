import fs from 'node:fs';
import path from 'node:path';
const pending = [];
function patch(relative, transform) {
  const file = path.resolve(relative);
  if (!fs.existsSync(file)) throw new Error('Không thấy ' + relative + '. Hãy chạy tại thư mục myrpg.');
  const before = fs.readFileSync(file, 'utf8'), after = transform(before);
  if (after !== before) pending.push({ file, before, after });
}
patch('src/auth/bootstrap.js', source => {
  source = source.replaceAll("../characters/CharacterCreationUI.js", "../game/characters/CharacterCreationUI.js")
    .replaceAll("../characters/characterSession.js", "../game/characters/characterSession.js")
    .replace(/setCharacterProfile\(character\s*\)/g, 'setCharacterProfile(character, user)');
  if (source.includes('chooseCharacter(user)')) return source;
  const anchor = /const user\s*=\s*await new AuthUI\(\)\.wait\(\);/;
  if (!anchor.test(source)) throw new Error('bootstrap.js khác mẫu. Chưa sửa file nào.');
  return "import { chooseCharacter } from '../game/characters/CharacterCreationUI.js';\nimport { setCharacterProfile } from '../game/characters/characterSession.js';\n" + source.replace(anchor, '$&\n      const character = await chooseCharacter(user);\n      setCharacterProfile(character, user);').replace('name.textContent = user.username;', "name.textContent = character.name + ' · ' + character.class.name;");
});
patch('src/game/systems/RPGState.js', source => {
  if (!source.includes('createCharacterState(RPGState, userId)')) throw new Error('Hãy chép RPGState.js trong bản sửa mới vào src/game/systems trước khi chạy.');
  return source;
});
patch('src/game/data/items.js', source => {
  if (source.includes('ITEMS.starter_axe')) return source;
  if (!/export\s+const\s+ITEMS\s*=/.test(source) || source.includes('Object.freeze(ITEMS)')) throw new Error('items.js khác mẫu. Chưa sửa file nào.');
  return source + "\n// Vũ khí khởi đầu của Đấu sĩ.\nITEMS.starter_axe = {name:'Rìu tập sự',frame:118,type:'weapon',category:'weapon',level:1,price:35,maxStack:1,attack:6,description:'+6 công. Vũ khí khởi đầu của Đấu sĩ.'};\n";
});
patch('src/game/scenes/BaseWorldScene.js', source => {
  source = source.replaceAll('../../characters/characterSession.js', '../characters/characterSession.js');
  if (source.includes('applyCharacterToScene(this)')) return source;
  const anchor = /this\.hud\s*=\s*new RPGHUD\([^;]+\);/g;
  if ([...source.matchAll(anchor)].length !== 1) throw new Error('BaseWorldScene.js khác mẫu. Chưa sửa file nào.');
  return "import { applyCharacterToScene } from '../characters/characterSession.js';\n" + source.replace(anchor, '$&\n        applyCharacterToScene(this);');
});
patch('backend/src/app.js', source => {
  if (/app\.use\(\s*['"]\/api\/characters['"]/.test(source)) return source;
  const anchor = /app\.use\(\s*['"]\/api\/auth['"]\s*,\s*require\(\s*['"]\.\/routes\/auth\.routes['"]\s*\)\s*\)\s*;/g;
  if ([...source.matchAll(anchor)].length !== 1) throw new Error('backend app.js khác mẫu. Chưa sửa file nào.');
  return source.replace(anchor, "$&\napp.use('/api/characters', require('./routes/character.routes'));");
});
for (const p of pending) {
  let backup = p.file + '.before-character.bak'; if (fs.existsSync(backup)) backup += '.' + Date.now();
  fs.writeFileSync(backup, p.before); fs.writeFileSync(p.file, p.after); console.log('Đã cập nhật: ' + p.file);
}
console.log(pending.length ? 'Đã gắn tạo nhân vật. Chạy SQL, khởi động lại backend và frontend.' : 'Đã gắn trước đó, không sửa trùng.');
