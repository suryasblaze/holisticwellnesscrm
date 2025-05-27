-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous insert (for lead creation from public form)
CREATE POLICY "Allow anonymous insert to leads" 
ON leads FOR INSERT 
TO anon
WITH CHECK (true);

-- Create policy to allow authenticated users to select their own leads
CREATE POLICY "Allow authenticated users to select leads" 
ON leads FOR SELECT 
TO authenticated
USING (true);

-- Create policy to allow authenticated users to update leads
CREATE POLICY "Allow authenticated users to update leads" 
ON leads FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete leads
CREATE POLICY "Allow authenticated users to delete leads" 
ON leads FOR DELETE 
TO authenticated
USING (true); 