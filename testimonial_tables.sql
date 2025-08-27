-- Create testimonial questions table
CREATE TABLE testimonial_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create testimonial responses table
CREATE TABLE testimonial_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES testimonial_questions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL, -- Generic agent id (could be coordinator, supervisor, group_leader, or pro)
  agent_type TEXT NOT NULL CHECK (agent_type IN ('coordinator', 'supervisor', 'group_leader', 'pro')),
  panchayath_id UUID NOT NULL REFERENCES panchayaths(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('yes', 'little', 'no')),
  score INTEGER NOT NULL CHECK (score IN (0, 5, 10)),
  respondent_name TEXT NOT NULL,
  respondent_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_testimonial_responses_agent ON testimonial_responses(agent_id, agent_type);
CREATE INDEX idx_testimonial_responses_panchayath ON testimonial_responses(panchayath_id);
CREATE INDEX idx_testimonial_responses_question ON testimonial_responses(question_id);
CREATE INDEX idx_testimonial_questions_active ON testimonial_questions(is_active, display_order);

-- Insert some default questions
INSERT INTO testimonial_questions (question, display_order) VALUES 
('Does the agent respond promptly to your requests?', 1),
('Is the agent knowledgeable about procedures?', 2),
('Does the agent treat you with respect?', 3),
('Would you recommend this agent to others?', 4);

-- Row Level Security
ALTER TABLE testimonial_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_responses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read questions
CREATE POLICY "Allow authenticated users to read questions" ON testimonial_questions FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert responses
CREATE POLICY "Allow authenticated users to insert responses" ON testimonial_responses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to read responses
CREATE POLICY "Allow authenticated users to read responses" ON testimonial_responses FOR SELECT USING (auth.role() = 'authenticated');

-- Allow super admin to manage questions (for now, we'll use a simple check)
CREATE POLICY "Allow question management" ON testimonial_questions FOR ALL USING (true);
CREATE POLICY "Allow response management" ON testimonial_responses FOR ALL USING (true);