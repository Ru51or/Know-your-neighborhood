
CREATE DATABASE IF NOT EXISTS aarif_hayak
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE aarif_hayak;

-- 1) جدول المستخدمين

DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS service_types;
DROP TABLE IF EXISTS neighborhoods;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(20)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,         
  full_name  VARCHAR(100) NOT NULL,
  api_token  VARCHAR(64)  DEFAULT NULL,      
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) جدول الأحياء

CREATE TABLE neighborhoods (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  image         VARCHAR(255),
  icon          VARCHAR(20),
  walkway_count INT DEFAULT 0,   
  school_count  INT DEFAULT 0,   
  park_count    INT DEFAULT 0,   
  clinic_count  INT DEFAULT 0    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) جدول أنواع الخدمات

CREATE TABLE service_types (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4) جدول الطلبات

CREATE TABLE requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  title           VARCHAR(60) NOT NULL,
  neighborhood_id INT NOT NULL,
  service_type_id INT NOT NULL,
  description     TEXT NOT NULL,
  attachment      VARCHAR(255) DEFAULT NULL,
  status          VARCHAR(30)  DEFAULT 'قيد المراجعة',
  created_at      DATE,

  CONSTRAINT fk_req_user  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  CONSTRAINT fk_req_hood  FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id),
  CONSTRAINT fk_req_type  FOREIGN KEY (service_type_id) REFERENCES service_types(id)
) ENGINE=InnoDB AUTO_INCREMENT=4214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO users (username, password, full_name) VALUES
('ruba', '$2a$10$S7LN7cGvr26K6EUWO.X1juugecpzKfaJRWsFBRT622gGZ4/DlS5wW', 'ربى');

INSERT INTO neighborhoods (name, description, image, icon, walkway_count, school_count, park_count, clinic_count) VALUES
('اليرموك',       'حي يطل على الواجهة البحرية يتميز بتنوع المرافق الترفيهية والممشى البحري.', 'assets/hood-1.jpg', '🌊', 3, 3, 3, 3),
('الفيصلية',      'مركز حيوي يضم العديد من المرافق والخدمات التجارية.',                      'assets/hood-2.jpg', '🏢', 3, 3, 3, 3),
('الشاطئ',        'مركز حيوي يضم العديد من المرافق والخدمات التجارية.',                      'assets/hood-3.jpg', '🌴', 3, 3, 3, 3),
('الحزام الذهبي', 'حي يطل على الواجهة البحرية يتميز بتنوع المرافق الترفيهية والممشى البحري.', 'assets/hood-4.jpg', '🌊', 3, 3, 3, 3),
('أجيال',         'حي يطل على الواجهة البحرية يتميز بتنوع المرافق الترفيهية والممشى البحري.', 'assets/hood-5.jpg', '🌊', 3, 3, 3, 3),
('الكورنيش',      'مركز حيوي يضم العديد من المرافق والخدمات التجارية.',                      'assets/hood-6.jpg', '🌴', 3, 3, 3, 3);

INSERT INTO service_types (name, icon) VALUES
('حديقة',  '🌳'),
('ممشى',   '🚶'),
('مدرسة',  '🏫'),
('مستوصف', '🏥'),
('روضة',   '🧸');

INSERT INTO requests (user_id, title, neighborhood_id, service_type_id, description, attachment, status, created_at) VALUES
(1, 'ألعاب في الحديقة', 3, 1, 'نأمل إضافة ألعاب أطفال آمنة في حديقة الحي مع مظلات وأرضية مطاطية.', NULL, 'قيد المراجعة', '2026-07-21'),
(1, 'إنارة الممشى',     1, 2, 'الإنارة ضعيفة في الجزء الشمالي من الممشى ونرجو معالجتها.',          NULL, 'مكتمل',       '2026-07-14');
