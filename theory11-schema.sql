-- Theory11 Attendance System - Supabase Schema Definition
-- Run this in your Supabase SQL Editor to initialize the database tables.

-- Create Employees (Seed Directory)
CREATE TABLE IF NOT EXISTS public.employees (
    id SERIAL PRIMARY KEY,
    eid VARCHAR(50) UNIQUE NOT NULL
);

-- If the table already existed without these columns, we add them:
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS rate_per_day NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS philhealth NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable Row Level Security (RLS) - Since Admin uses Anon keys in this MVP, we allow public CRUD.
-- (For production, you'd want actual Postgres roles or JWT validation)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for employees" ON public.employees FOR ALL USING (true);

-- Create Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id SERIAL PRIMARY KEY,
    eid VARCHAR(50) REFERENCES public.employees(eid) ON DELETE CASCADE,
    name VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    date DATE,
    remarks TEXT,
    tardiness INT DEFAULT 0,
    undertime INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Attendance Logs
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for attendance_logs" ON public.attendance_logs FOR ALL USING (true);

-- Insert initial seed data based on A102.txt
INSERT INTO public.employees (eid, name, full_name) VALUES
('251805', 'LEE LUZADAS', 'LEE LUZADAS'),
('1', 'GIDDEL MACALIPAY', 'GIDDEL MACALIPAY'),
('2', 'MARVIN RIVERO', 'MARVIN RIVERO'),
('3', 'LEANDRO VALIDO', 'LEANDRO VALIDO'),
('4', 'GERSON MENDOZA', 'GERSON MENDOZA'),
('5', 'MARK ANCEL GUTIERREZ', 'MARK ANCEL GUTIERREZ'),
('6', 'JAGER MIK AGUILA', 'JAGER MIK AGUILA'),
('7', 'CARL ANDRE NOCUM', 'CARL ANDRE NOCUM'),
('8', 'JACK KIRBY UY', 'JACK KIRBY UY'),
('9', 'JERSON AMBAL', 'JERSON AMBAL'),
('10', 'ANGELO ALBAÑO', 'ANGELO ALBAÑO'),
('11', 'GLENIEL PIONILLA', 'GLENIEL PIONILLA'),
('12', 'JHON JOVERICK SOGOCIO', 'JHON JOVERICK SOGOCIO'),
('13', 'JULIE ANN ALVAREZ', 'JULIE ANN ALVAREZ'),
('14', 'JERONCIUS LABIAL', 'JERONCIUS LABIAL'),
('15', 'ANGELO MARTINEZ', 'ANGELO MARTINEZ'),
('16', 'KENT SIMOUNE PIÑOL', 'KENT SIMOUNE PIÑOL'),
('17', 'MARY GRACE DIMATULAC', 'MARY GRACE DIMATULAC'),
('18', 'JONH WILFRED ZARSUELO', 'JONH WILFRED ZARSUELO'),
('19', 'MARK JOHNCELL REGIO', 'MARK JOHNCELL REGIO'),
('20', 'JOHN PAUL PORTE', 'JOHN PAUL PORTE')
ON CONFLICT (eid) DO UPDATE SET name = EXCLUDED.name, full_name = EXCLUDED.full_name;
