-- USERS
CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) UNIQUE,
  status NVARCHAR(20) DEFAULT 'active',
  profile NVARCHAR(MAX) NULL, -- Use NVARCHAR(MAX) for JSON in SQL Server 2016+
  created_at DATETIME2 DEFAULT SYSDATETIME(),
  roles NVARCHAR(20) DEFAULT 'viewer'
);

-- If you want to enforce allowed values for 'roles', use a CHECK constraint:
ALTER TABLE users ADD CONSTRAINT chk_roles CHECK (roles IN ('admin', 'editor', 'viewer'));