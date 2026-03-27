-- Complete RLS Policies for all tables

-- Table: users
CREATE POLICY "Select users" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Insert users" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Update users" ON users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Delete users" ON users
    FOR DELETE
    USING (auth.uid() = id);

-- Add more policies for other tables here
