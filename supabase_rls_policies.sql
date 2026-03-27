-- Row Level Security (RLS) Policies Setup Code

-- Enable RLS on the table
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- Create policies for different roles
CREATE POLICY select_policy ON your_table_name
  FOR SELECT
  USING (role = 'some_role');

CREATE POLICY insert_policy ON your_table_name
  FOR INSERT
  WITH CHECK (role = 'some_role');

CREATE POLICY update_policy ON your_table_name
  FOR UPDATE
  USING (role = 'some_role');

CREATE POLICY delete_policy ON your_table_name
  FOR DELETE
  USING (role = 'some_role');

-- Repeat or adjust policies based on your needs
