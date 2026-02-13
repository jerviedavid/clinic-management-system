-- Create ReceptionistProfile table
CREATE TABLE ReceptionistProfile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,
    dateOfBirth TEXT,
    address TEXT,
    phone TEXT,
    emergencyContactName TEXT,
    emergencyContactPhone TEXT,
    position TEXT,
    yearsOfExperience INTEGER,
    skills TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
