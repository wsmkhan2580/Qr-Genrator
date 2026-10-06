-- ============================================================
-- Ticket QR Generator - Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('WORKER', 'MANAGER', 'ADMIN');
CREATE TYPE ticket_status AS ENUM ('ACTIVE', 'USED', 'CANCELLED', 'EXPIRED');

-- ----------------------------
-- Users
-- ----------------------------
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(120)  NOT NULL,
  email          VARCHAR(255)  NOT NULL UNIQUE,
  password_hash  TEXT          NOT NULL,
  role           user_role     NOT NULL DEFAULT 'WORKER',
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- ----------------------------
-- Tickets
-- ----------------------------
CREATE TABLE tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code      VARCHAR(32)  NOT NULL UNIQUE,
  qr_payload       TEXT         NOT NULL,
  customer_name    VARCHAR(160) NOT NULL,
  customer_phone   VARCHAR(32)  NOT NULL,
  customer_email   VARCHAR(255),
  event_name       VARCHAR(200) NOT NULL,
  event_date       DATE         NOT NULL,
  ticket_type      VARCHAR(60)  NOT NULL,
  quantity         INTEGER      NOT NULL CHECK (quantity > 0 AND quantity <= 1000),
  status           ticket_status NOT NULL DEFAULT 'ACTIVE',
  created_by       UUID         NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  validated_at     TIMESTAMPTZ,
  validated_by     UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_tickets_ticket_code ON tickets (ticket_code);
CREATE INDEX idx_tickets_customer_phone ON tickets (customer_phone);
CREATE INDEX idx_tickets_customer_email ON tickets (customer_email);
CREATE INDEX idx_tickets_status ON tickets (status);
CREATE INDEX idx_tickets_created_by ON tickets (created_by);
CREATE INDEX idx_tickets_created_at ON tickets (created_at DESC);

-- ----------------------------
-- Audit Log
-- ----------------------------
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  action       VARCHAR(80)  NOT NULL,
  entity_type  VARCHAR(60)  NOT NULL,
  entity_id    UUID,
  metadata     JSONB,
  ip_address   VARCHAR(64),
  user_agent   TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ----------------------------
-- updated_at trigger helper
-- ----------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
