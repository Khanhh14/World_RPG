module.exports = {
  durationMs: 5000,
  capacity: 24,
  rodId: 'starter_fishing_rod',
  // Tọa độ world theo map Atlast 48px/tile: mép phải sàn gỗ cols 17..21.
  spot: { mapId: 'atlast-lake', minX: 936, maxX: 1000, minY: 850, maxY: 974 },
  fish: [
    { id: 'fish_perch', weight: 50 }, { id: 'fish_carp', weight: 30 },
    { id: 'fish_catfish', weight: 15 }, { id: 'fish_gold', weight: 5 },
  ],
};
