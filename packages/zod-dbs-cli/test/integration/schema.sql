CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  profile JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  roles TEXT[],
  dates TIMESTAMP[],
  CHECK (roles <@ ARRAY['admin', 'editor', 'viewer'])
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK ("status" IN ('draft', 'published', 'archived'))
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- hex color code
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE post_categories (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  parent_id INTEGER REFERENCES comments(id),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  weight REAL,
  dimensions POINT, -- geometric type
  is_active BOOLEAN DEFAULT true,
  barcode CHAR(13),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  status order_status DEFAULT 'pending',
  total_amount MONEY NOT NULL,
  tax_amount MONEY DEFAULT 0,
  shipping_cost MONEY DEFAULT 0,
  order_date DATE DEFAULT CURRENT_DATE,
  shipped_date DATE,
  delivery_time TIME,
  notes TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity SMALLINT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_percent/100)) STORED
);

CREATE TABLE inventory (
  product_id INTEGER PRIMARY KEY REFERENCES products(id),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  reorder_level SMALLINT DEFAULT 10,
  last_restocked DATE,
  supplier_info JSONB,
  warehouse_locations TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE network_logs (
  id BIGSERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  port_range INT4RANGE,
  mac_address MACADDR,
  request_time TIMESTAMPTZ DEFAULT now(),
  response_time INTERVAL,
  bytes_sent BIGINT DEFAULT 0,
  bytes_received BIGINT DEFAULT 0,
  protocol VARCHAR(10),
  status_code SMALLINT,
  user_agent TEXT,
  headers JSONB
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  checksum CHAR(64), -- SHA-256 hash
  binary_data BYTEA,
  is_encrypted BOOLEAN DEFAULT false,
  upload_time TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  metadata JSONB,
  tags TEXT[],
  access_count INTEGER DEFAULT 0
);

CREATE TABLE geographic_data (
  id SERIAL PRIMARY KEY,
  location_name VARCHAR(255) NOT NULL,
  coordinates POINT NOT NULL,
  boundary POLYGON,
  area_circle CIRCLE,
  elevation REAL,
  timezone VARCHAR(50),
  country_code CHAR(2),
  postal_codes TEXT[],
  population INTEGER,
  established_date DATE,
  last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE time_series (
  id BIGSERIAL PRIMARY KEY,
  sensor_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  temperature NUMERIC(5,2),
  humidity NUMERIC(5,2),
  pressure NUMERIC(7,2),
  readings NUMERIC[],
  anomaly_detected BOOLEAN DEFAULT false,
  data_quality SMALLINT CHECK (data_quality BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sensor_id, timestamp)
);

CREATE TABLE enum_tests (
  id SERIAL PRIMARY KEY,
  -- Different CHECK constraint styles for enum detection
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  color VARCHAR(20) CHECK ("color" IN ('red', 'green', 'blue', 'yellow')),
  size TEXT CHECK (size = ANY(ARRAY['xs', 's', 'm', 'l', 'xl', 'xxl'])),
  grade CHAR(1) CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  category VARCHAR(30) CHECK (category IN ('electronics', 'clothing', 'books', 'home-garden')),
  mood TEXT CHECK ("mood" = ANY(ARRAY['happy', 'sad', 'angry', 'excited', 'calm'])),
  direction VARCHAR(10) CHECK (direction IN ('north', 'south', 'east', 'west')),
  weather_condition TEXT CHECK (weather_condition = ANY(ARRAY['sunny', 'cloudy', 'rainy', 'snowy', 'foggy'])),
  task_status VARCHAR(20) CHECK ("task_status" IN ('todo', 'in-progress', 'done', 'cancelled')),
  difficulty INTEGER CHECK (difficulty IN (1, 2, 3, 4, 5)),
  weekday VARCHAR(10) CHECK (weekday IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  payment_method TEXT CHECK ("payment_method" = ANY(ARRAY['cash', 'credit-card', 'debit-card', 'paypal', 'bank-transfer'])),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE constraint_variations (
  id SERIAL PRIMARY KEY,
  -- Various constraint formats to test parsing
  animal VARCHAR(20) CHECK (animal IN ('cat', 'dog', 'bird', 'fish')),
  fruit TEXT CHECK ("fruit" IN ('apple', 'banana', 'orange', 'grape')),
  vehicle VARCHAR(15) CHECK (vehicle = ANY(ARRAY['car', 'truck', 'motorcycle', 'bicycle'])),
  language CHAR(2) CHECK ("language" IN ('en', 'es', 'fr', 'de', 'it')),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  active_status BOOLEAN CHECK (active_status IN (true, false)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Column descriptions for posts table
COMMENT ON TABLE posts IS 'Table containing blog posts';
COMMENT ON COLUMN posts.views IS 'Number of views for the post';
COMMENT ON COLUMN posts.tags IS 'Array of tags associated with the post';
COMMENT ON COLUMN posts.metadata IS 'Additional metadata for the post';
COMMENT ON COLUMN posts.published_at IS 'Timestamp when the post was published';
COMMENT ON COLUMN posts.updated_at IS 'Timestamp when the post was last updated';

-- Column descriptions for categories table
COMMENT ON COLUMN categories.id IS 'Primary key for categories table';
COMMENT ON COLUMN categories.name IS 'Name of the category';
COMMENT ON COLUMN categories.description IS 'Description of the category';
COMMENT ON COLUMN categories.color IS 'Hex color code for the category';
COMMENT ON COLUMN categories.created_at IS 'Timestamp when the category was created';

-- Column descriptions for post_categories table
COMMENT ON COLUMN post_categories.post_id IS 'ID of the post';
COMMENT ON COLUMN post_categories.category_id IS 'ID of the category';

-- Column descriptions for comments table
COMMENT ON COLUMN comments.id IS 'Primary key for comments table';
COMMENT ON COLUMN comments.post_id IS 'ID of the post this comment belongs to';
COMMENT ON COLUMN comments.user_id IS 'ID of the user who wrote the comment';
COMMENT ON COLUMN comments.parent_id IS 'ID of the parent comment for nested comments';
COMMENT ON COLUMN comments.content IS 'Content of the comment';
COMMENT ON COLUMN comments.is_approved IS 'Whether the comment has been approved by moderators';
COMMENT ON COLUMN comments.created_at IS 'Timestamp when the comment was created';
COMMENT ON COLUMN comments.updated_at IS 'Timestamp when the comment was last updated';

-- Column descriptions for user_sessions table
COMMENT ON COLUMN user_sessions.id IS 'Primary key for user sessions table';
COMMENT ON COLUMN user_sessions.user_id IS 'ID of the user this session belongs to';
COMMENT ON COLUMN user_sessions.token_hash IS 'Hashed session token';
COMMENT ON COLUMN user_sessions.expires_at IS 'Timestamp when the session expires';
COMMENT ON COLUMN user_sessions.created_at IS 'Timestamp when the session was created';
COMMENT ON COLUMN user_sessions.last_used_at IS 'Timestamp when the session was last used';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP address of the client';
COMMENT ON COLUMN user_sessions.user_agent IS 'User agent string of the client';

-- Column descriptions for audit_logs table
COMMENT ON COLUMN audit_logs.id IS 'Primary key for audit logs table';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.table_name IS 'Name of the table affected';
COMMENT ON COLUMN audit_logs.record_id IS 'ID of the record affected';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values before the change';
COMMENT ON COLUMN audit_logs.new_values IS 'New values after the change';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when the action was performed';

-- Column descriptions for products table
COMMENT ON COLUMN products.id IS 'Primary key for products table';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.sku IS 'Stock keeping unit identifier';
COMMENT ON COLUMN products.price IS 'Product price with 2 decimal precision';
COMMENT ON COLUMN products.cost IS 'Product cost with 2 decimal precision';
COMMENT ON COLUMN products.weight IS 'Product weight in kilograms';
COMMENT ON COLUMN products.dimensions IS 'Product dimensions as geometric point';
COMMENT ON COLUMN products.is_active IS 'Whether the product is active';
COMMENT ON COLUMN products.barcode IS 'Product barcode (13 characters)';
COMMENT ON COLUMN products.description IS 'Product description';
COMMENT ON COLUMN products.created_at IS 'Timestamp when product was created';

-- Column descriptions for orders table
COMMENT ON COLUMN orders.id IS 'Primary key for orders table';
COMMENT ON COLUMN orders.order_number IS 'Unique order number';
COMMENT ON COLUMN orders.user_id IS 'ID of the user who placed the order';
COMMENT ON COLUMN orders.status IS 'Current status of the order';
COMMENT ON COLUMN orders.total_amount IS 'Total order amount';
COMMENT ON COLUMN orders.tax_amount IS 'Tax amount for the order';
COMMENT ON COLUMN orders.shipping_cost IS 'Shipping cost for the order';
COMMENT ON COLUMN orders.order_date IS 'Date when order was placed';
COMMENT ON COLUMN orders.shipped_date IS 'Date when order was shipped';
COMMENT ON COLUMN orders.delivery_time IS 'Expected delivery time';
COMMENT ON COLUMN orders.notes IS 'Array of order notes';
COMMENT ON COLUMN orders.metadata IS 'Additional order metadata';
COMMENT ON COLUMN orders.created_at IS 'Timestamp when order was created';

-- Column descriptions for order_items table
COMMENT ON COLUMN order_items.id IS 'Primary key for order items table';
COMMENT ON COLUMN order_items.order_id IS 'ID of the order this item belongs to';
COMMENT ON COLUMN order_items.product_id IS 'ID of the product';
COMMENT ON COLUMN order_items.quantity IS 'Quantity of the product ordered';
COMMENT ON COLUMN order_items.unit_price IS 'Price per unit';
COMMENT ON COLUMN order_items.discount_percent IS 'Discount percentage applied';
COMMENT ON COLUMN order_items.line_total IS 'Calculated line total';

-- Column descriptions for inventory table
COMMENT ON COLUMN inventory.product_id IS 'ID of the product';
COMMENT ON COLUMN inventory.stock_quantity IS 'Current stock quantity';
COMMENT ON COLUMN inventory.reserved_quantity IS 'Quantity reserved for orders';
COMMENT ON COLUMN inventory.reorder_level IS 'Minimum stock level before reorder';
COMMENT ON COLUMN inventory.last_restocked IS 'Date when last restocked';
COMMENT ON COLUMN inventory.supplier_info IS 'Supplier information in JSON format';
COMMENT ON COLUMN inventory.warehouse_locations IS 'Array of warehouse locations';
COMMENT ON COLUMN inventory.updated_at IS 'Timestamp when inventory was last updated';

-- Column descriptions for network_logs table
COMMENT ON COLUMN network_logs.id IS 'Primary key for network logs table';
COMMENT ON COLUMN network_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN network_logs.port_range IS 'Port range used';
COMMENT ON COLUMN network_logs.mac_address IS 'MAC address of the device';
COMMENT ON COLUMN network_logs.request_time IS 'Timestamp of the request';
COMMENT ON COLUMN network_logs.response_time IS 'Response time duration';
COMMENT ON COLUMN network_logs.bytes_sent IS 'Number of bytes sent';
COMMENT ON COLUMN network_logs.bytes_received IS 'Number of bytes received';
COMMENT ON COLUMN network_logs.protocol IS 'Network protocol used';
COMMENT ON COLUMN network_logs.status_code IS 'HTTP status code';
COMMENT ON COLUMN network_logs.user_agent IS 'User agent string';
COMMENT ON COLUMN network_logs.headers IS 'Request headers in JSON format';

-- Column descriptions for files table
COMMENT ON COLUMN files.id IS 'Primary key for files table';
COMMENT ON COLUMN files.filename IS 'Original filename';
COMMENT ON COLUMN files.file_path IS 'Path to the file';
COMMENT ON COLUMN files.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN files.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN files.checksum IS 'SHA-256 checksum of the file';
COMMENT ON COLUMN files.binary_data IS 'Binary data of the file';
COMMENT ON COLUMN files.is_encrypted IS 'Whether the file is encrypted';
COMMENT ON COLUMN files.upload_time IS 'Timestamp when file was uploaded';
COMMENT ON COLUMN files.expiry_date IS 'Expiry date of the file';
COMMENT ON COLUMN files.metadata IS 'File metadata in JSON format';
COMMENT ON COLUMN files.tags IS 'Array of file tags';
COMMENT ON COLUMN files.access_count IS 'Number of times file was accessed';

-- Column descriptions for geographic_data table
COMMENT ON COLUMN geographic_data.id IS 'Primary key for geographic data table';
COMMENT ON COLUMN geographic_data.location_name IS 'Name of the location';
COMMENT ON COLUMN geographic_data.coordinates IS 'Geographic coordinates';
COMMENT ON COLUMN geographic_data.boundary IS 'Geographic boundary as polygon';
COMMENT ON COLUMN geographic_data.area_circle IS 'Area represented as circle';
COMMENT ON COLUMN geographic_data.elevation IS 'Elevation above sea level';
COMMENT ON COLUMN geographic_data.timezone IS 'Timezone of the location';
COMMENT ON COLUMN geographic_data.country_code IS 'ISO country code';
COMMENT ON COLUMN geographic_data.postal_codes IS 'Array of postal codes';
COMMENT ON COLUMN geographic_data.population IS 'Population count';
COMMENT ON COLUMN geographic_data.established_date IS 'Date when location was established';
COMMENT ON COLUMN geographic_data.last_updated IS 'Timestamp when data was last updated';

-- Column descriptions for time_series table
COMMENT ON COLUMN time_series.id IS 'Primary key for time series table';
COMMENT ON COLUMN time_series.sensor_id IS 'Identifier of the sensor';
COMMENT ON COLUMN time_series.timestamp IS 'Timestamp of the reading';
COMMENT ON COLUMN time_series.temperature IS 'Temperature reading';
COMMENT ON COLUMN time_series.humidity IS 'Humidity reading';
COMMENT ON COLUMN time_series.pressure IS 'Pressure reading';
COMMENT ON COLUMN time_series.readings IS 'Array of numeric readings';
COMMENT ON COLUMN time_series.anomaly_detected IS 'Whether an anomaly was detected';
COMMENT ON COLUMN time_series.data_quality IS 'Data quality score (1-10)';
COMMENT ON COLUMN time_series.created_at IS 'Timestamp when record was created';

-- Column descriptions for enum_tests table
COMMENT ON COLUMN enum_tests.id IS 'Primary key for enum tests table';
COMMENT ON COLUMN enum_tests.priority IS 'Task priority level';
COMMENT ON COLUMN enum_tests.color IS 'Color selection';
COMMENT ON COLUMN enum_tests.size IS 'Size option';
COMMENT ON COLUMN enum_tests.grade IS 'Letter grade';
COMMENT ON COLUMN enum_tests.category IS 'Product category';
COMMENT ON COLUMN enum_tests.mood IS 'Current mood state';
COMMENT ON COLUMN enum_tests.direction IS 'Compass direction';
COMMENT ON COLUMN enum_tests.weather_condition IS 'Current weather condition';
COMMENT ON COLUMN enum_tests.task_status IS 'Status of the task';
COMMENT ON COLUMN enum_tests.difficulty IS 'Difficulty level (1-5)';
COMMENT ON COLUMN enum_tests.weekday IS 'Day of the week';
COMMENT ON COLUMN enum_tests.payment_method IS 'Payment method used';
COMMENT ON COLUMN enum_tests.created_at IS 'Timestamp when record was created';

-- Column descriptions for constraint_variations table
COMMENT ON COLUMN constraint_variations.id IS 'Primary key for constraint variations table';
COMMENT ON COLUMN constraint_variations.animal IS 'Type of animal';
COMMENT ON COLUMN constraint_variations.fruit IS 'Type of fruit';
COMMENT ON COLUMN constraint_variations.vehicle IS 'Type of vehicle';
COMMENT ON COLUMN constraint_variations.language IS 'Language code';
COMMENT ON COLUMN constraint_variations.rating IS 'Rating score (1-5)';
COMMENT ON COLUMN constraint_variations.active_status IS 'Whether the item is active';
COMMENT ON COLUMN constraint_variations.created_at IS 'Timestamp when record was created';

create view view_user_posts as
select u.id as user_id, u.name as user_name, p.id as post_id, p.title as post_title, p.content as post_content
from users u
join posts p on u.id = p.user_id
where p.published = true;
--- IGNORE ---
-- This view selects user IDs and names along with their published posts.
-- It joins the users and posts tables on user_id, filtering for published posts.
-- This is useful for generating schemas that include user-post relationships.

create materialized view mv_user_posts as
select u.id as user_id, u.name as user_name, p.id as post_id, p.title as post_title, p.content as post_content
from users u
join posts p on u.id = p.user_id
where p.published = true
with data;