-- USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  profile JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  roles JSON NULL COMMENT 'Allowed: admin, editor, viewer',
  dates JSON NULL COMMENT 'Originally TIMESTAMP[] array'
) COMMENT='Users table';
