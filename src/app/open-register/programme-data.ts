// src/app/open-register/programme-data.ts
// Source: ATU graduated students data + ATU Graduate School official programme list
// Top-Up variants removed where a direct-entry equivalent exists

export interface ProgrammeLevel {
  code: string;
  label: string;
}

export interface Faculty {
  name: string;
}

export interface Department {
  name: string;
  faculty: string;
}

export interface Programme {
  name: string;
  level: string;
  faculty: string;
  department: string;
}

export const PROGRAMME_LEVELS: ProgrammeLevel[] = [
  { code: 'HND',     label: 'HND (Higher National Diploma)' },
  { code: 'DEGREE',  label: 'Degree / B.Tech' },
  { code: 'DIPLOMA', label: 'Diploma' },
  { code: 'MASTERS', label: 'Masters (MSc / MTech)' },
];

export const FACULTIES: Faculty[] = [
  { name: 'Faculty of Applied Sciences and Mathematics' },
  { name: 'Faculty of Architecture and Built Environment' },
  { name: 'Faculty of Business and Management Studies' },
  { name: 'Faculty of Engineering' },
  { name: 'Faculty of Creative Arts and Technology' },
  { name: 'Faculty of Health and Allied Sciences' },
  { name: 'Graduate School' },
];

export const DEPARTMENTS: Department[] = [
  { name: 'Computer Science',                   faculty: 'Faculty of Applied Sciences and Mathematics' },
  { name: 'Science Laboratory Technology',      faculty: 'Faculty of Applied Sciences and Mathematics' },
  { name: 'Statistics',                         faculty: 'Faculty of Applied Sciences and Mathematics' },
  { name: 'Building Technology',                faculty: 'Faculty of Architecture and Built Environment' },
  { name: 'Civil Engineering',                  faculty: 'Faculty of Architecture and Built Environment' },
  { name: 'Interior Design and Technology',     faculty: 'Faculty of Architecture and Built Environment' },
  { name: 'Accountancy',                        faculty: 'Faculty of Business and Management Studies' },
  { name: 'Banking and Finance',                faculty: 'Faculty of Business and Management Studies' },
  { name: 'Marketing',                          faculty: 'Faculty of Business and Management Studies' },
  { name: 'Procurement and Supply Chain',       faculty: 'Faculty of Business and Management Studies' },
  { name: 'Secretaryship and Management',       faculty: 'Faculty of Business and Management Studies' },
  { name: 'Automobile Engineering',             faculty: 'Faculty of Engineering' },
  { name: 'Electrical Engineering',             faculty: 'Faculty of Engineering' },
  { name: 'Mechanical Engineering',             faculty: 'Faculty of Engineering' },
  { name: 'Fashion Design and Textiles',        faculty: 'Faculty of Creative Arts and Technology' },
  { name: 'Furniture Design and Production',    faculty: 'Faculty of Creative Arts and Technology' },
  { name: 'Multimedia Communication',           faculty: 'Faculty of Creative Arts and Technology' },
  { name: 'Hotel and Institutional Management', faculty: 'Faculty of Health and Allied Sciences' },
  { name: 'Medical Laboratory Science',         faculty: 'Faculty of Health and Allied Sciences' },
  { name: 'Graduate School',                    faculty: 'Graduate School' },
];

export const PROGRAMMES: Programme[] = [

  // ── HND (16) ──────────────────────────────────────────────────────────────
  { name: 'Accountancy (HND)',                               level: 'HND', faculty: 'Faculty of Business and Management Studies',    department: 'Accountancy' },
  { name: 'Bilingual Secretaryship (HND)',                   level: 'HND', faculty: 'Faculty of Business and Management Studies',    department: 'Secretaryship and Management' },
  { name: 'Building Technology (HND)',                       level: 'HND', faculty: 'Faculty of Architecture and Built Environment',  department: 'Building Technology' },
  { name: 'Civil Engineering (HND)',                         level: 'HND', faculty: 'Faculty of Architecture and Built Environment',  department: 'Civil Engineering' },
  { name: 'Computer Science (HND)',                          level: 'HND', faculty: 'Faculty of Applied Sciences and Mathematics',    department: 'Computer Science' },
  { name: 'Electrical Engineering (HND)',                    level: 'HND', faculty: 'Faculty of Engineering',                        department: 'Electrical Engineering' },
  { name: 'Fashion Design and Textiles (HND)',               level: 'HND', faculty: 'Faculty of Creative Arts and Technology',       department: 'Fashion Design and Textiles' },
  { name: 'Furniture Design and Production (HND)',           level: 'HND', faculty: 'Faculty of Creative Arts and Technology',       department: 'Furniture Design and Production' },
  { name: 'Hotel Catering and Institutional Management (HND)', level: 'HND', faculty: 'Faculty of Health and Allied Sciences',      department: 'Hotel and Institutional Management' },
  { name: 'Interior Design and Technology (HND)',            level: 'HND', faculty: 'Faculty of Architecture and Built Environment',  department: 'Interior Design and Technology' },
  { name: 'Marketing (HND)',                                 level: 'HND', faculty: 'Faculty of Business and Management Studies',    department: 'Marketing' },
  { name: 'Mechanical Engineering (HND)',                    level: 'HND', faculty: 'Faculty of Engineering',                        department: 'Mechanical Engineering' },
  { name: 'Purchasing & Supply (HND)',                       level: 'HND', faculty: 'Faculty of Business and Management Studies',    department: 'Procurement and Supply Chain' },
  { name: 'Science Laboratory Technology (HND)',             level: 'HND', faculty: 'Faculty of Applied Sciences and Mathematics',   department: 'Science Laboratory Technology' },
  { name: 'Secretaryship & Management Studies (HND)',        level: 'HND', faculty: 'Faculty of Business and Management Studies',    department: 'Secretaryship and Management' },
  { name: 'Statistics (HND)',                                level: 'HND', faculty: 'Faculty of Applied Sciences and Mathematics',   department: 'Statistics' },

  // ── DEGREE / B.Tech ───────────────────────────────────────────────────────
  // Top-Up only (no direct entry equivalent — kept as-is)
  { name: 'B.Tech Automobile Engineering (Top-Up)',              level: 'DEGREE', faculty: 'Faculty of Engineering',                        department: 'Automobile Engineering' },
  { name: 'B.Tech Building Technology (Top-Up)',                 level: 'DEGREE', faculty: 'Faculty of Architecture and Built Environment',  department: 'Building Technology' },
  { name: 'B.Tech Civil Engineering (Top-Up)',                   level: 'DEGREE', faculty: 'Faculty of Architecture and Built Environment',  department: 'Civil Engineering' },
  { name: 'B.Tech Computer Science (Top-Up)',                    level: 'DEGREE', faculty: 'Faculty of Applied Sciences and Mathematics',    department: 'Computer Science' },
  { name: 'B.Tech Electrical and Electronic Engineering (Top-Up)', level: 'DEGREE', faculty: 'Faculty of Engineering',                      department: 'Electrical Engineering' },
  { name: 'B.Tech Hospitality Management (Top-Up)',              level: 'DEGREE', faculty: 'Faculty of Health and Allied Sciences',          department: 'Hotel and Institutional Management' },
  { name: 'B.Tech Procurement and Supply Chain Management (Top-Up)', level: 'DEGREE', faculty: 'Faculty of Business and Management Studies', department: 'Procurement and Supply Chain' },
  { name: 'B.Tech Science Laboratory Technology (Top-Up)',       level: 'DEGREE', faculty: 'Faculty of Applied Sciences and Mathematics',   department: 'Science Laboratory Technology' },
  { name: 'Bachelor of Technology in Banking and Finance (Top-Up)', level: 'DEGREE', faculty: 'Faculty of Business and Management Studies', department: 'Banking and Finance' },
  { name: 'Bachelor of Technology in Marketing (Top-Up)',        level: 'DEGREE', faculty: 'Faculty of Business and Management Studies',    department: 'Marketing' },
  { name: 'Bachelor of Technology in Mechanical Engineering (Top-Up)', level: 'DEGREE', faculty: 'Faculty of Engineering',                  department: 'Mechanical Engineering' },
  { name: 'Bachelor of Technology in Public Relations with Digital Communications (Top-Up)', level: 'DEGREE', faculty: 'Faculty of Business and Management Studies', department: 'Marketing' },
  { name: 'Bachelor of Technology in Secretaryship and Management Studies (Top-Up)', level: 'DEGREE', faculty: 'Faculty of Business and Management Studies', department: 'Secretaryship and Management' },
  { name: 'Bachelor of Technology in Statistics (Top-Up)',       level: 'DEGREE', faculty: 'Faculty of Applied Sciences and Mathematics',   department: 'Statistics' },

  // Direct entry only (no Top-Up variant — or Top-Up removed as duplicate)
  { name: 'Bachelor of Technology in Accounting and Finance Analytics', level: 'DEGREE', faculty: 'Faculty of Business and Management Studies', department: 'Accountancy' },
  { name: 'Bachelor of Technology in Cyber Security',           level: 'DEGREE', faculty: 'Faculty of Applied Sciences and Mathematics',    department: 'Computer Science' },
  { name: 'Bachelor of Technology in Electrical and Electronics Engineering', level: 'DEGREE', faculty: 'Faculty of Engineering',            department: 'Electrical Engineering' },
  { name: 'Bachelor of Technology in Interior Design and Technology', level: 'DEGREE', faculty: 'Faculty of Architecture and Built Environment', department: 'Interior Design and Technology' },
  { name: 'Bachelor of Technology in Medical Laboratory Science', level: 'DEGREE', faculty: 'Faculty of Health and Allied Sciences',         department: 'Medical Laboratory Science' },
  { name: 'Bachelor of Technology in Water and Sanitation Engineering', level: 'DEGREE', faculty: 'Faculty of Engineering',                  department: 'Civil Engineering' },

  // ── DIPLOMA (5) ───────────────────────────────────────────────────────────
  { name: 'Advanced Diploma in Procurement and Supply Chain Management', level: 'DIPLOMA', faculty: 'Faculty of Business and Management Studies', department: 'Procurement and Supply Chain' },
  { name: 'Diploma in Banking Technology and Accounting',        level: 'DIPLOMA', faculty: 'Faculty of Business and Management Studies',    department: 'Banking and Finance' },
  { name: 'Diploma in Business Administration',                  level: 'DIPLOMA', faculty: 'Faculty of Business and Management Studies',    department: 'Accountancy' },
  { name: 'Diploma in Computerized Accounting',                  level: 'DIPLOMA', faculty: 'Faculty of Business and Management Studies',    department: 'Accountancy' },
  { name: 'Diploma in Public Relations',                         level: 'DIPLOMA', faculty: 'Faculty of Business and Management Studies',    department: 'Marketing' },

  // ── MASTERS — MSc (5) ─────────────────────────────────────────────────────
  { name: 'MSc in Applied Accounting and Finance',               level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MSc in Construction Project Management',              level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MSc in Financial Analytics',                          level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MSc in Marketing Strategy & Innovation',              level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MSc in Procurement and Supply Chain Management',      level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },

  // ── MASTERS — MTech (13) ──────────────────────────────────────────────────
  { name: 'MTech in Administration and Management',              level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Automotive Engineering',                     level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Communications and Brands Management',       level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Construction and Management',                level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Data Science and Industrial Analytics',      level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Fashion Production Management',              level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Food and Bioprocess Engineering',            level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Interior Design and Technology',             level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Medical Laboratory Science',                 level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Medical Laboratory Science (Medical Microbiology)', level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Multimedia Communication',                   level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Plant Maintenance Engineering',              level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
  { name: 'MTech in Sustainable Electrical Power Engineering',   level: 'MASTERS', faculty: 'Graduate School', department: 'Graduate School' },
];