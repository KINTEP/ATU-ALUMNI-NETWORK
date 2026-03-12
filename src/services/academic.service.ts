// src/app/services/academic.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { environment } from '../environments/environment';

export interface Faculty {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  faculty_id: number;
  faculty_name?: string;
}

export interface Program {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name?: string;
  faculty_name?: string;
}

export interface ProgramLevel {
  id: number;
  name: string;
  code: string;
  sort_order: number;
}

export interface DropdownData {
  program_levels: ProgramLevel[];
  faculties: Faculty[];
  departments: Department[];
  programs: Program[];
}

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  private apiUrl = `${environment.apiUrl}/academic`;

  constructor(private http: HttpClient) {}

  /**
   * Get dropdown data for forms
   */
  getDropdownData(): Observable<ApiResponse<DropdownData>> {
    return this.http.get<ApiResponse<DropdownData>>(`${this.apiUrl}/dropdown-data`);
  }

  /**
   * Get all faculties
   */
  getFaculties(): Observable<ApiResponse<Faculty[]>> {
    return this.http.get<ApiResponse<Faculty[]>>(`${this.apiUrl}/faculties`);
  }

  /**
   * Get departments by faculty
   */
  getDepartments(facultyId?: number): Observable<ApiResponse<Department[]>> {
    const url = facultyId 
      ? `${this.apiUrl}/departments?faculty_id=${facultyId}`
      : `${this.apiUrl}/departments`;
    return this.http.get<ApiResponse<Department[]>>(url);
  }

  /**
   * Get programs by department
   */
  getPrograms(departmentId?: number): Observable<ApiResponse<Program[]>> {
    const url = departmentId 
      ? `${this.apiUrl}/programs?department_id=${departmentId}`
      : `${this.apiUrl}/programs`;
    return this.http.get<ApiResponse<Program[]>>(url);
  }
}