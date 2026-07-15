// Core entities for home services CRM

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: 'form' | 'phone' | 'referral' | 'website' | 'other';
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  properties?: string[]; // Property IDs
}

export interface Property {
  id: string;
  contactId: string; // Link to contact/customer
  address: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  serviceType: 'HVAC' | 'Plumbing' | 'Electrical' | 'General';
  value: number;
  stage: 'new' | 'scheduled' | 'in_progress' | 'complete' | 'invoiced';
  
  // Relationships
  contactId: string; // Customer
  propertyId: string; // Service location
  crewId?: string; // Assigned crew
  invoiceId?: string; // Linked invoice
  
  // Scheduling
  scheduledDate?: Date;
  scheduledStartTime?: string; // "09:00 AM"
  estimatedDuration?: number; // Hours
  completedDate?: Date;
  completedTime?: string;
  
  // Documentation
  photos: Photo[];
  notes: string;
  
  // Metadata
  priority: 'routine' | 'urgent' | 'emergency';
  lostReason?: string; // If stage = "lost"
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: Date;
}

export interface Crew {
  id: string;
  name: string; // e.g., "Mike's HVAC Team"
  leadPerson: string;
  skills: ('HVAC' | 'Plumbing' | 'Electrical' | 'General')[];
  serviceAreas: string[]; // Cities or zip codes
  capacity: number; // Max jobs per day
  phone: string;
  email?: string;
  availability: Availability[];
  avgRating: number;
  jobsCompletedThisMonth: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  startTime: string; // "08:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
}

export interface Invoice {
  id: string;
  jobId: string;
  contactId: string;
  amount: number;
  itemized: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  sentDate?: Date;
  paidDate?: Date;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  linkedContactId?: string;
  linkedJobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  linkedContactId?: string;
  linkedJobId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Form {
  id: string;
  name: string;
  fields: FormField[];
  submissions: FormSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[]; // For select fields
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
  createdContactId?: string; // Auto-created contact from submission
}