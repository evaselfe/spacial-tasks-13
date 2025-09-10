-- Fix RLS security warnings by enabling RLS on tables that need it

-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE testimonial_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_responses ENABLE ROW LEVEL SECURITY;