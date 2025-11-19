// Storage interface for the application
// This application processes PDFs client-side and doesn't need persistent storage

export interface IStorage {
  // Add storage methods here if needed in the future
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage
  }
}

export const storage = new MemStorage();
