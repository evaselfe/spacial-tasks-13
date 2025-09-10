-- Create todos table
CREATE TABLE public.todos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  status text NOT NULL DEFAULT 'unfinished' CHECK (status IN ('finished', 'unfinished')),
  remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create policies for todos
CREATE POLICY "Users can view their own todos" 
ON public.todos 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own todos" 
ON public.todos 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own todos" 
ON public.todos 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own todos" 
ON public.todos 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();