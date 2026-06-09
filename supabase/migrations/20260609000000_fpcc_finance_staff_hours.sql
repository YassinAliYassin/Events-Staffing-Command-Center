-- FPCC finance + staff-hours schema for Supabase.
-- Run with: supabase db push

create table if not exists staff (
  id serial primary key,
  name text not null,
  phone text default '',
  role text default '',
  rate numeric default 0,
  department text default '',
  uniform boolean default false,
  email text default '',
  pin text default '',
  total_hours numeric default 0
);

create table if not exists clients (
  id serial primary key,
  name text default '',
  email text default '',
  vat_no text default '',
  address text default '',
  phone text default '',
  hourly_rate numeric default 90
);

create table if not exists events (
  id text primary key,
  title text,
  date text,
  duration numeric default 5,
  staff_assigned text,
  venue text default '',
  client_id integer,
  start_time text default '',
  end_time text default '',
  staff_ids text,
  color text default '',
  notes text default ''
);

create table if not exists finance_documents (
  id serial primary key,
  doc_no text unique,
  doc_type text,
  client_id integer,
  event_id text,
  issue_date text,
  due_date text,
  valid_until text,
  status text default 'draft',
  include_tax boolean default true,
  tax_rate numeric default 15,
  lines jsonb default '[]'::jsonb,
  notes text default '',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists staff_hours (
  id serial primary key,
  staff_id integer,
  staff_name text,
  cycle_start text,
  cycle_end text,
  hours numeric default 0,
  earnings numeric default 0,
  assignments_count integer default 0,
  event_ids jsonb default '[]'::jsonb,
  updated_at timestamptz default now(),
  unique (staff_id, cycle_start, cycle_end)
);

alter table staff add column if not exists rate numeric default 0;
alter table staff add column if not exists department text default '';
alter table staff add column if not exists uniform boolean default false;
alter table staff add column if not exists email text default '';
alter table staff add column if not exists pin text default '';
alter table staff add column if not exists total_hours numeric default 0;

alter table clients add column if not exists name text default '';
alter table clients add column if not exists email text default '';
alter table clients add column if not exists vat_no text default '';
alter table clients add column if not exists address text default '';
alter table clients add column if not exists phone text default '';
alter table clients add column if not exists hourly_rate numeric default 90;

alter table events add column if not exists venue text default '';
alter table events add column if not exists client_id integer;
alter table events add column if not exists start_time text default '';
alter table events add column if not exists end_time text default '';
alter table events add column if not exists staff_ids text;
alter table events add column if not exists color text default '';
alter table events add column if not exists notes text default '';
alter table events add column if not exists duration numeric default 5;

create unique index if not exists staff_hours_cycle_idx
on staff_hours (staff_id, cycle_start, cycle_end);
