# Electoral Data Extraction Tool

## Overview

This is a web application designed to extract electoral committee data from Arabic PDF documents and export the results to Excel format. The application processes PDF files containing voter information organized by committees, parses the data, and presents it in a structured table format with export capabilities.

The tool features a full RTL (Right-to-Left) Arabic interface built with Material Design principles, focusing on clarity and efficiency for administrative/electoral workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- Single Page Application (SPA) architecture

**UI Component System**
- Shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- RTL layout configured at the root level (`<html dir="rtl">`)
- Cairo font family from Google Fonts for Arabic typography
- Custom color scheme with CSS variables for theming support

**State Management**
- React Query (TanStack Query) for server state management and API data caching
- Local React state (useState) for UI state and form handling
- No global state management library - component-level state with prop drilling

**Data Processing Flow**
1. User uploads PDF file via drag-and-drop or file input
2. File is sent to backend via XMLHttpRequest (for upload progress tracking)
3. Backend extracts text and parses electoral data
4. Structured data is returned and displayed in a preview table
5. User can export data to Excel using ExcelJS library client-side

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- ESM (ES Modules) for modern JavaScript module system
- HTTP server created with Node's native `http` module

**File Upload Processing**
- Multer middleware for handling multipart/form-data file uploads
- In-memory storage (no disk writes) with 100MB file size limit
- PDF parsing using pdf-parse library (v2.x API with PDFParse class)
- Custom text extraction logic in `extractElectoralData()` function

**API Design**
- RESTful endpoint: `POST /api/process-pdf`
- Accepts single PDF file
- Returns JSON with structured electoral data (committees, voters, counts)
- Error handling with Arabic error messages

**Development Server**
- Vite middleware integration for hot module replacement in development
- Custom logging middleware for API request tracking
- Separate build process for client (Vite) and server (esbuild)

### Data Storage Solutions

**Current Implementation**
- No persistent database - stateless processing
- All data processing happens in-memory during request lifecycle
- Extracted data is returned to client and not stored server-side

**Database Configuration (Prepared but Unused)**
- Drizzle ORM configured with PostgreSQL dialect
- Connection configured via `DATABASE_URL` environment variable
- Neon Database serverless driver (`@neondatabase/serverless`)
- Schema defined in `shared/schema.ts` using Zod for validation
- Migration files configured to output to `./migrations` directory
- **Note**: Database is provisioned but not actively used in current workflow

**Data Schema**
- `Voter`: serialNumber, fullName
- `Committee`: name, subNumber, address (optional), voters array
- `ExtractedData`: committees array, totalVoters, totalCommittees
- `ExcelRow`: flattened structure for Excel export (committee info repeated per voter)

### External Dependencies

**Third-Party Libraries**

*UI & Styling*
- @radix-ui/* - Accessible UI component primitives (25+ components)
- tailwindcss - Utility-first CSS framework
- class-variance-authority - Component variant management
- lucide-react - Icon library

*Data Processing*
- pdf-parse - PDF text extraction library
- exceljs - Excel file generation (client-side)
- date-fns - Date manipulation utilities

*Forms & Validation*
- react-hook-form - Form state management
- @hookform/resolvers - Form validation resolvers
- zod - Schema validation library
- drizzle-zod - Drizzle ORM Zod integration

*Server*
- multer - File upload middleware
- connect-pg-simple - PostgreSQL session store (configured but unused)

*Build Tools*
- vite - Frontend build tool
- esbuild - Server-side bundler
- tsx - TypeScript execution for development
- drizzle-kit - Database migration toolkit

**External Services**
- Google Fonts API - Cairo font family for Arabic text
- Replit-specific plugins for development environment (@replit/vite-plugin-*)

**Browser APIs Used**
- XMLHttpRequest - For upload progress tracking
- File API - For file selection and reading
- Blob API - For Excel file download generation