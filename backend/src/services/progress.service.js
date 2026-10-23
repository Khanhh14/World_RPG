// Chỉ backend quyết định số EXP/vàng được thưởng.
function characterView(c) {
  return { id: String(c.id), level: Number(c.level), exp: Number(c.exp),
    gold: Number(c.gold), gems: Number(c.gems || 0),
    hp: Number(c.hp), mana: Number(c.mana), revision: Number(c.progress_version || 0) };
}
async function reward(c, character, expGain, goldGain) {
  let level = Number(character.level), exp = Number(character.exp) + expGain;
  let hp = Number(character.hp), mana = Number(character.mana);
  while (level < 100 && exp >= level * 100) {
    exp -= level * 100; level++;
    hp = 100 + (level - 1) * 10; mana = 50 + (level - 1) * 5;
  }
  if (level === 100) exp = Math.min(exp, 9999);
  const gold = Math.min(9999999, Number(character.gold) + goldGain);
  await c.execute('UPDATE characters SET level = ?, exp = ?, gold = ?, hp = ?, mana = ?, progress_version = progress_version + 1 WHERE id = ?', [level, exp, gold, hp, mana, character.id]);
  Object.assign(character, { level, exp, gold, hp, mana, progress_version: Number(character.progress_version || 0) + 1 });
  return character;
}
module.exports = { characterView, reward };
