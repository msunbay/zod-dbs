
-- USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  profile JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  roles ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer'
);
