<?php

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('طريقة الطلب غير مدعومة.', 405);

require_login();

/* arraing */
function map_hood($row) {
  return [
    'id'          => (int) $row['id'],
    'name'        => $row['name'],
    'description' => $row['description'],
    'image'       => $row['image'],
    'icon'        => $row['icon'],
    'services'    => [
      'walkway' => (int) $row['walkway_count'],
      'school'  => (int) $row['school_count'],
      'park'    => (int) $row['park_count'],
      'clinic'  => (int) $row['clinic_count']
    ]
  ];
}

$id = $_GET['id'] ?? null;

if ($id !== null) {
  $stmt = db()->prepare('SELECT * FROM neighborhoods WHERE id = ? LIMIT 1');
  $stmt->execute([(int) $id]);
  $row = $stmt->fetch();
  if (!$row) fail('الحي غير موجود.', 404);
  json_out(map_hood($row));
}

$rows = db()->query('SELECT * FROM neighborhoods ORDER BY id')->fetchAll();
json_out(array_map('map_hood', $rows));
