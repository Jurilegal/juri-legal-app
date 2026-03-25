-- Super Admin Portal Schema

-- Employees (HR)
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  position TEXT,
  department TEXT CHECK (department IN ('marketing','entwicklung','betrieb','hr','geschaeftsfuehrung')) DEFAULT 'betrieb',
  salary NUMERIC(10,2),
  start_date DATE,
  end_date DATE,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payroll records
CREATE TABLE payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  net_amount NUMERIC(10,2),
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contracts
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('versicherung','dienstleister','anwalt','miete','software','sonstiges')) NOT NULL,
  description TEXT,
  file_path TEXT,
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  monthly_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Department budgets
CREATE TABLE department_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT CHECK (department IN ('marketing','entwicklung','betrieb','hr','geschaeftsfuehrung')) NOT NULL,
  year INTEGER NOT NULL,
  total_budget NUMERIC(14,2) NOT NULL,
  spent NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(department, year)
);

-- Marketing campaigns
CREATE TABLE marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('google','meta','linkedin','tiktok','print','sonstiges')),
  budget NUMERIC(10,2),
  spent NUMERIC(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('geplant','aktiv','pausiert','beendet')) DEFAULT 'geplant',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT CHECK (department IN ('marketing','entwicklung','betrieb','hr','geschaeftsfuehrung')),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices (generated for sessions)
CREATE TABLE generated_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_payment_id UUID REFERENCES session_payments(id),
  mandant_id UUID REFERENCES auth.users(id),
  anwalt_id UUID REFERENCES auth.users(id),
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

-- RLS - admin only for all new tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_invoices ENABLE ROW LEVEL SECURITY;

-- Admin policies for all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['employees','payroll_records','contracts','department_budgets','marketing_campaigns','expenses','generated_invoices']
  LOOP
    EXECUTE format('CREATE POLICY "Admin full access on %I" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''))', tbl, tbl);
  END LOOP;
END;
$$;

-- Indexes
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX idx_contracts_type ON contracts(type);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_budgets_dept_year ON department_budgets(department, year);
CREATE INDEX idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_expenses_dept ON expenses(department);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_invoices_mandant ON generated_invoices(mandant_id);
