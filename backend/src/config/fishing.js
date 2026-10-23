module.exports = {
  durationMs: 5000,
  capacity: 24,
  rodId: 'starter_fishing_rod',
  rodPrice: 50,
  // Tọa độ world theo map Atlast 48px/tile: mép phải sàn gỗ cols 17..21.
  spot: { mapId: 'atlast-lake', minX: 936, maxX: 1000, minY: 850, maxY: 974 },
  merchant: { mapId: 'atlast-lake', minX: 816, maxX: 960, minY: 816, maxY: 1008 },
  fish: [
    { id: 'fish_perch', weight: 50, price: 50 },
    { id: 'fish_carp', weight: 30, price: 60 },
    { id: 'fish_catfish', weight: 15, price: 70 },
    { id: 'fish_gold', weight: 5, price: 1000 },
  ],
};
