ALTER TABLE sellers ADD COLUMN email VARCHAR(190) NULL AFTER mobile_number;
ALTER TABLE sellers ADD UNIQUE KEY sellers_email_unique (email);
ALTER TABLE sellers MODIFY mobile_number VARCHAR(10) NULL;
