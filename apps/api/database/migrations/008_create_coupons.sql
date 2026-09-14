ALTER TABLE products ADD COLUMN base_price DECIMAL(12,2) NULL AFTER description;

CREATE TABLE IF NOT EXISTS coupon_claims (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  user_id CHAR(36) NULL,
  seller_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  original_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL,
  final_price DECIMAL(12,2) NOT NULL,
  status ENUM('CLAIMED','VERIFIED','REDEEMED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'CLAIMED',
  verification_status ENUM('UNVERIFIED','VERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
  claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  redeemed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT coupons_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT coupons_seller_fk FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  CONSTRAINT coupons_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX coupons_seller_status_idx (seller_id,status),
  INDEX coupons_user_idx (user_id),
  INDEX coupons_product_idx (product_id)
);