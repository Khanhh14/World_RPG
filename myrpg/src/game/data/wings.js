export const WING_CATALOG = {
  "styles": [
    {
      "id": "verdant",
      "name": "Cánh Lục Diệp",
      "subtitle": "Lá rừng • Ngọc lục bảo",
      "colors": [
        "#18392e",
        "#377950",
        "#79bd67",
        "#d9ef9d"
      ],
      "base": {
        "attack": 2,
        "defense": 1,
        "maxHP": 10
      }
    },
    {
      "id": "seraph",
      "name": "Cánh Thiên Vũ",
      "subtitle": "Lông vũ • Ánh bình minh",
      "colors": [
        "#33496a",
        "#789ebd",
        "#c8e8ef",
        "#fff4c9"
      ],
      "base": {
        "attack": 1,
        "defense": 2,
        "maxHP": 15
      }
    },
    {
      "id": "phoenix",
      "name": "Cánh Hỏa Phượng",
      "subtitle": "Phượng hoàng • Hổ phách",
      "colors": [
        "#612d3b",
        "#bc514b",
        "#f4a85d",
        "#ffe6a0"
      ],
      "base": {
        "attack": 3,
        "defense": 0,
        "maxHP": 5
      }
    }
  ],
  "stones": [
    {
      "id": "wing_stone_1",
      "tier": 1,
      "name": "Đá nâng cấp cánh cấp 1",
      "price": 500,
      "color": "#7bd7a0"
    },
    {
      "id": "wing_stone_2",
      "tier": 2,
      "name": "Đá nâng cấp cánh cấp 2",
      "price": 750,
      "color": "#8fc9ff"
    },
    {
      "id": "wing_stone_3",
      "tier": 3,
      "name": "Đá nâng cấp cánh cấp 3",
      "price": 1000,
      "color": "#d6a0ff"
    },
    {
      "id": "wing_stone_4",
      "tier": 4,
      "name": "Đá nâng cấp cánh cấp 4",
      "price": 1000,
      "color": "#ffcc71"
    }
  ],
  "maxLevel": 2147483647,
  "perLevel": {
    "attack": 2,
    "defense": 1,
    "maxHP": 10
  },
  "merchant": {
    "mapId": "yuna-outskirts",
    "x": 696,
    "feetY": 624,
    "range": 110
  }
};
export const wingStyle = id => WING_CATALOG.styles.find(item => item.id === id);
export function wingStats(id, level = 0) {
 const style = wingStyle(id); if (!style) return { attack:0, defense:0, maxHP:0 };
 return Object.fromEntries(Object.entries(style.base).map(([key, base]) => [key, base + WING_CATALOG.perLevel[key] * level]));
}
export const nextStone = level => WING_CATALOG.stones[Math.min(3, Math.floor(level / 3))] || null;
