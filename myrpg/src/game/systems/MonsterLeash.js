const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export function monsterIntent(target, player) {
    const {entity}=target, data=entity.data, home=entity.home;
    const limit=data.leashRange ?? data.chaseRange ?? 360;
    if (target.returning) return distance(entity.sprite,home) <= 14 ? 'arrived' : 'return';
    if (distance(entity.sprite,home) > limit || (target.aggro && (
        distance(player,home) > limit || distance(player,entity.sprite) > (data.chaseRange ?? 360)
    ))) return 'return';
    if (distance(player,home) <= limit && (target.aggro || distance(player,entity.sprite) <= (data.detectionRange ?? 260))) return 'chase';
    return 'patrol';
}
