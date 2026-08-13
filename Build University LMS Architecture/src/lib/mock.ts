export type Role = 'admin' | 'professor' | 'student'
export type DegreeLevel = 'associate' | 'bachelor' | 'master' | 'doctorate'
export type EnrollmentStatus = 'active' | 'dropped' | 'completed'
export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: Role
  programId?: number
  phone: string
  status: boolean
}

export interface Faculty {
  id: number
  name: string
  code: string
}

export interface Program {
  id: number
  facultyId: number
  name: string
  degreeLevel: DegreeLevel
  durationYears: number
}

export interface Course {
  id: number
  programId: number
  code: string
  title: string
  creditHours: number
  description: string
}

export interface Semester {
  id: number
  name: string
  academicYear: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface CourseOffering {
  id: number
  courseId: number
  semesterId: number
  professorId: number
  section: string
  capacity: number
  enrolled: number
}

export interface Enrollment {
  id: number
  studentId: number
  courseOfferingId: number
  status: EnrollmentStatus
  enrolledAt: string
}

export interface Grade {
  id: number
  studentId: number
  courseOfferingId: number
  finalScore: number
  letterGrade: string
  gradePoints: number
}

export interface AttendanceRecord {
  id: number
  studentId: number
  courseOfferingId: number
  date: string
  status: AttendanceStatus
}

export interface Assignment {
  id: number
  courseOfferingId: number
  title: string
  instruction: string
  dueDate: string
  totalScore: number
}

export interface AssignmentSubmission {
  id: number
  assignmentId: number
  studentId: number
  comment: string
  score?: number
  submittedAt: string
}

export interface Lesson {
  id: number
  courseOfferingId: number
  title: string
  description: string
  publishDate: string
}

export interface Announcement {
  id: number
  authorId: number
  facultyId?: number
  courseOfferingId?: number
  title: string
  content: string
  createdAt: string
}

export interface Message {
  id: number
  senderId: number
  receiverId: number
  message: string
  isRead: boolean
  createdAt: string
}

export const faculties: Faculty[] = [
  { id: 1, name: 'Business Management', code: 'BM' },
  { id: 2, name: 'Tourism & Hospitality', code: 'TH' },
  { id: 3, name: 'Science & Technology', code: 'ST' },
  { id: 4, name: 'Education & Languages', code: 'EL' },
  { id: 5, name: 'Law & Social Science', code: 'LS' },
  { id: 6, name: 'Engineering & Architecture', code: 'EA' },
]

export const programs: Program[] = [
  { id: 1, facultyId: 1, name: 'Business Administration', degreeLevel: 'bachelor', durationYears: 4 },
  { id: 2, facultyId: 1, name: 'Accounting & Finance', degreeLevel: 'bachelor', durationYears: 4 },
  { id: 3, facultyId: 1, name: 'MBA', degreeLevel: 'master', durationYears: 2 },
  { id: 4, facultyId: 2, name: 'Tourism Management', degreeLevel: 'bachelor', durationYears: 4 },
  { id: 5, facultyId: 2, name: 'Hotel Management', degreeLevel: 'associate', durationYears: 2 },
  { id: 6, facultyId: 3, name: 'Computer Science', degreeLevel: 'bachelor', durationYears: 4 },
  { id: 7, facultyId: 3, name: 'Information Technology', degreeLevel: 'associate', durationYears: 2 },
  { id: 8, facultyId: 4, name: 'English for Communication', degreeLevel: 'bachelor', durationYears: 4 },
  { id: 9, facultyId: 5, name: 'Law', degreeLevel: 'bachelor', durationYears: 4 },
  { id: 10, facultyId: 6, name: 'Civil Engineering', degreeLevel: 'bachelor', durationYears: 4 },
  { id: 11, facultyId: 6, name: 'Architecture', degreeLevel: 'bachelor', durationYears: 5 },
]

export const courses: Course[] = [
  { id: 1, programId: 1, code: 'BM101', title: 'Principles of Management', creditHours: 3, description: 'Introduction to management theory and practice.' },
  { id: 2, programId: 1, code: 'BM201', title: 'Marketing Management', creditHours: 3, description: 'Strategic marketing planning and execution.' },
  { id: 3, programId: 1, code: 'BM301', title: 'Strategic Management', creditHours: 3, description: 'Corporate strategy and competitive analysis.' },
  { id: 4, programId: 2, code: 'AC101', title: 'Financial Accounting', creditHours: 3, description: 'Fundamentals of financial accounting and reporting.' },
  { id: 5, programId: 2, code: 'AC201', title: 'Managerial Accounting', creditHours: 3, description: 'Cost analysis and management decision-making.' },
  { id: 6, programId: 4, code: 'TM101', title: 'Introduction to Tourism', creditHours: 3, description: 'Overview of the global tourism industry.' },
  { id: 7, programId: 4, code: 'TM201', title: 'Tour Planning & Operations', creditHours: 3, description: 'Practical tour planning and itinerary design.' },
  { id: 8, programId: 6, code: 'CS101', title: 'Programming Fundamentals', creditHours: 3, description: 'Introduction to programming using Python.' },
  { id: 9, programId: 6, code: 'CS201', title: 'Data Structures & Algorithms', creditHours: 3, description: 'Fundamental data structures and algorithm design.' },
  { id: 10, programId: 6, code: 'CS301', title: 'Database Systems', creditHours: 3, description: 'Relational databases and SQL design.' },
  { id: 11, programId: 8, code: 'EL101', title: 'English Grammar & Writing', creditHours: 3, description: 'Advanced English grammar and academic writing.' },
  { id: 12, programId: 9, code: 'LW101', title: 'Introduction to Law', creditHours: 3, description: 'Fundamentals of the Cambodian legal system.' },
  { id: 13, programId: 10, code: 'CE101', title: 'Engineering Mathematics', creditHours: 4, description: 'Calculus, linear algebra, and differential equations.' },
  { id: 14, programId: 10, code: 'CE201', title: 'Structural Analysis', creditHours: 3, description: 'Analysis of structural systems and load calculations.' },
  { id: 15, programId: 11, code: 'AR101', title: 'Architectural Design I', creditHours: 4, description: 'Fundamentals of architectural design and space planning.' },
]

export const semesters: Semester[] = [
  { id: 1, name: 'Fall 2022–2023', academicYear: '2022-2023', startDate: '2022-09-05', endDate: '2023-01-13', isCurrent: false },
  { id: 2, name: 'Spring 2023–2024', academicYear: '2023-2024', startDate: '2024-02-05', endDate: '2024-06-14', isCurrent: false },
  { id: 3, name: 'Fall 2024–2025', academicYear: '2024-2025', startDate: '2024-09-02', endDate: '2025-01-10', isCurrent: false },
  { id: 4, name: 'Spring 2024–2025', academicYear: '2024-2025', startDate: '2025-02-03', endDate: '2025-06-13', isCurrent: true },
]

export const users: User[] = [
  { id: 1, firstName: 'Sophea', lastName: 'Mey', email: 'admin@bbu.edu.kh', role: 'admin', phone: '012-345-678', status: true },
  { id: 2, firstName: 'Pich', lastName: 'Sopheak', email: 'p.sopheak@bbu.edu.kh', role: 'professor', phone: '011-234-567', status: true },
  { id: 3, firstName: 'Vann', lastName: 'Dara', email: 'v.dara@bbu.edu.kh', role: 'professor', phone: '011-345-678', status: true },
  { id: 4, firstName: 'Sok', lastName: 'Kimheng', email: 's.kimheng@bbu.edu.kh', role: 'professor', phone: '011-456-789', status: true },
  { id: 5, firstName: 'Chan', lastName: 'Ratana', email: 'c.ratana@bbu.edu.kh', role: 'professor', phone: '011-567-890', status: true },
  { id: 6, firstName: 'Ly', lastName: 'Bopha', email: 'l.bopha@bbu.edu.kh', role: 'professor', phone: '011-678-901', status: true },
  { id: 7, firstName: 'Heng', lastName: 'Piseth', email: 'h.piseth@bbu.edu.kh', role: 'professor', phone: '011-789-012', status: true },
  { id: 8, firstName: 'Keo', lastName: 'Chanthou', email: 'k.chanthou@bbu.edu.kh', role: 'professor', phone: '011-890-123', status: true },
  { id: 9, firstName: 'Meas', lastName: 'Sothy', email: 'm.sothy@bbu.edu.kh', role: 'professor', phone: '011-901-234', status: true },
  { id: 10, firstName: 'Sok', lastName: 'Samnang', email: 'sok.samnang@student.bbu.edu.kh', role: 'student', programId: 1, phone: '096-234-567', status: true },
  { id: 11, firstName: 'Pich', lastName: 'Pisey', email: 'pich.pisey@student.bbu.edu.kh', role: 'student', programId: 6, phone: '096-345-678', status: true },
  { id: 12, firstName: 'Vann', lastName: 'Chanthy', email: 'vann.chanthy@student.bbu.edu.kh', role: 'student', programId: 1, phone: '096-456-789', status: true },
  { id: 13, firstName: 'Heng', lastName: 'Sophors', email: 'heng.sophors@student.bbu.edu.kh', role: 'student', programId: 6, phone: '096-567-890', status: true },
  { id: 14, firstName: 'Ly', lastName: 'Davi', email: 'ly.davi@student.bbu.edu.kh', role: 'student', programId: 4, phone: '096-678-901', status: true },
  { id: 15, firstName: 'Meas', lastName: 'Sreymom', email: 'meas.sreymom@student.bbu.edu.kh', role: 'student', programId: 2, phone: '096-789-012', status: true },
  { id: 16, firstName: 'Chan', lastName: 'Borey', email: 'chan.borey@student.bbu.edu.kh', role: 'student', programId: 9, phone: '096-890-123', status: true },
  { id: 17, firstName: 'Keo', lastName: 'Vichet', email: 'keo.vichet@student.bbu.edu.kh', role: 'student', programId: 10, phone: '096-901-234', status: true },
  { id: 18, firstName: 'Noun', lastName: 'Sreyleak', email: 'noun.sreyleak@student.bbu.edu.kh', role: 'student', programId: 8, phone: '096-012-345', status: true },
  { id: 19, firstName: 'Ros', lastName: 'Dara', email: 'ros.dara@student.bbu.edu.kh', role: 'student', programId: 6, phone: '097-123-456', status: true },
  { id: 20, firstName: 'Ung', lastName: 'Sophea', email: 'ung.sophea@student.bbu.edu.kh', role: 'student', programId: 1, phone: '097-234-567', status: true },
  { id: 21, firstName: 'Im', lastName: 'Chanveasna', email: 'im.chanveasna@student.bbu.edu.kh', role: 'student', programId: 4, phone: '097-345-678', status: true },
  { id: 22, firstName: 'Tep', lastName: 'Bunthoeun', email: 'tep.bunthoeun@student.bbu.edu.kh', role: 'student', programId: 6, phone: '097-456-789', status: true },
  { id: 23, firstName: 'Prak', lastName: 'Sreymao', email: 'prak.sreymao@student.bbu.edu.kh', role: 'student', programId: 2, phone: '097-567-890', status: true },
  { id: 24, firstName: 'San', lastName: 'Daro', email: 'san.daro@student.bbu.edu.kh', role: 'student', programId: 11, phone: '097-678-901', status: true },
  { id: 25, firstName: 'Men', lastName: 'Vicheka', email: 'men.vicheka@student.bbu.edu.kh', role: 'student', programId: 9, phone: '097-789-012', status: true },
  { id: 26, firstName: 'Chea', lastName: 'Sokha', email: 'chea.sokha@student.bbu.edu.kh', role: 'student', programId: 5, phone: '097-890-123', status: true },
  { id: 27, firstName: 'Nget', lastName: 'Sophanna', email: 'nget.sophanna@student.bbu.edu.kh', role: 'student', programId: 6, phone: '097-901-234', status: true },
  { id: 28, firstName: 'Hor', lastName: 'Sreylim', email: 'hor.sreylim@student.bbu.edu.kh', role: 'student', programId: 8, phone: '097-012-345', status: true },
  { id: 29, firstName: 'Seng', lastName: 'Monirith', email: 'seng.monirith@student.bbu.edu.kh', role: 'student', programId: 10, phone: '098-123-456', status: true },
]

// Current semester offerings (sem 4) + historical (sem 2, 3)
export const courseOfferings: CourseOffering[] = [
  // Current semester (4)
  { id: 1, courseId: 1, semesterId: 4, professorId: 2, section: 'A', capacity: 40, enrolled: 35 },
  { id: 2, courseId: 2, semesterId: 4, professorId: 2, section: 'B', capacity: 35, enrolled: 30 },
  { id: 3, courseId: 8, semesterId: 4, professorId: 4, section: 'A', capacity: 45, enrolled: 42 },
  { id: 4, courseId: 9, semesterId: 4, professorId: 4, section: 'A', capacity: 40, enrolled: 38 },
  { id: 5, courseId: 10, semesterId: 4, professorId: 4, section: 'B', capacity: 40, enrolled: 25 },
  { id: 6, courseId: 6, semesterId: 4, professorId: 3, section: 'A', capacity: 40, enrolled: 32 },
  { id: 7, courseId: 4, semesterId: 4, professorId: 5, section: 'A', capacity: 35, enrolled: 28 },
  { id: 8, courseId: 13, semesterId: 4, professorId: 7, section: 'A', capacity: 40, enrolled: 36 },
  { id: 9, courseId: 15, semesterId: 4, professorId: 8, section: 'A', capacity: 30, enrolled: 22 },
  { id: 10, courseId: 12, semesterId: 4, professorId: 6, section: 'A', capacity: 45, enrolled: 40 },
  // Fall 2024-2025 (sem 3) — historical
  { id: 11, courseId: 8, semesterId: 3, professorId: 4, section: 'A', capacity: 40, enrolled: 38 },
  { id: 12, courseId: 9, semesterId: 3, professorId: 4, section: 'A', capacity: 40, enrolled: 35 },
  { id: 13, courseId: 1, semesterId: 3, professorId: 2, section: 'A', capacity: 40, enrolled: 36 },
  // Spring 2023-2024 (sem 2) — historical
  { id: 21, courseId: 4, semesterId: 2, professorId: 5, section: 'A', capacity: 35, enrolled: 30 },
  { id: 22, courseId: 11, semesterId: 2, professorId: 5, section: 'A', capacity: 40, enrolled: 32 },
]

// Student 11 (Pich Pisey) enrollments
export const enrollments: Enrollment[] = [
  // Current semester
  { id: 1, studentId: 11, courseOfferingId: 3, status: 'active', enrolledAt: '2025-02-10' },
  { id: 2, studentId: 11, courseOfferingId: 4, status: 'active', enrolledAt: '2025-02-10' },
  { id: 3, studentId: 11, courseOfferingId: 5, status: 'active', enrolledAt: '2025-02-10' },
  // Fall 2024-2025
  { id: 4, studentId: 11, courseOfferingId: 11, status: 'completed', enrolledAt: '2024-09-05' },
  { id: 5, studentId: 11, courseOfferingId: 12, status: 'completed', enrolledAt: '2024-09-05' },
  { id: 6, studentId: 11, courseOfferingId: 13, status: 'completed', enrolledAt: '2024-09-05' },
  // Spring 2023-2024
  { id: 7, studentId: 11, courseOfferingId: 21, status: 'completed', enrolledAt: '2024-02-08' },
  { id: 8, studentId: 11, courseOfferingId: 22, status: 'completed', enrolledAt: '2024-02-08' },
  // Other students in current CS101 (offering 3)
  { id: 9, studentId: 13, courseOfferingId: 3, status: 'active', enrolledAt: '2025-02-10' },
  { id: 10, studentId: 19, courseOfferingId: 3, status: 'active', enrolledAt: '2025-02-10' },
  { id: 11, studentId: 22, courseOfferingId: 3, status: 'active', enrolledAt: '2025-02-10' },
  { id: 12, studentId: 27, courseOfferingId: 3, status: 'active', enrolledAt: '2025-02-10' },
  // Other students in CS201 (offering 4)
  { id: 13, studentId: 13, courseOfferingId: 4, status: 'active', enrolledAt: '2025-02-10' },
  { id: 14, studentId: 19, courseOfferingId: 4, status: 'active', enrolledAt: '2025-02-10' },
]

// Grades — historical semesters for student 11
export const grades: Grade[] = [
  // Spring 2023-2024 (sem 2)
  { id: 1, studentId: 11, courseOfferingId: 21, finalScore: 91, letterGrade: 'A', gradePoints: 4.0 },
  { id: 2, studentId: 11, courseOfferingId: 22, finalScore: 85, letterGrade: 'B+', gradePoints: 3.3 },
  // Fall 2024-2025 (sem 3)
  { id: 3, studentId: 11, courseOfferingId: 11, finalScore: 88, letterGrade: 'B+', gradePoints: 3.3 },
  { id: 4, studentId: 11, courseOfferingId: 12, finalScore: 93, letterGrade: 'A-', gradePoints: 3.7 },
  { id: 5, studentId: 11, courseOfferingId: 13, finalScore: 82, letterGrade: 'B', gradePoints: 3.0 },
  // Other students' grades (for professor grade entry demo)
  { id: 6, studentId: 13, courseOfferingId: 3, finalScore: 76, letterGrade: 'B-', gradePoints: 2.7 },
  { id: 7, studentId: 19, courseOfferingId: 3, finalScore: 94, letterGrade: 'A', gradePoints: 4.0 },
]

export const attendanceRecords: AttendanceRecord[] = [
  { id: 1, studentId: 11, courseOfferingId: 3, date: '2025-02-10', status: 'present' },
  { id: 2, studentId: 13, courseOfferingId: 3, date: '2025-02-10', status: 'present' },
  { id: 3, studentId: 19, courseOfferingId: 3, date: '2025-02-10', status: 'absent' },
  { id: 4, studentId: 22, courseOfferingId: 3, date: '2025-02-10', status: 'late' },
  { id: 5, studentId: 27, courseOfferingId: 3, date: '2025-02-10', status: 'present' },
  { id: 6, studentId: 11, courseOfferingId: 3, date: '2025-02-17', status: 'present' },
  { id: 7, studentId: 13, courseOfferingId: 3, date: '2025-02-17', status: 'late' },
  { id: 8, studentId: 19, courseOfferingId: 3, date: '2025-02-17', status: 'present' },
  { id: 9, studentId: 22, courseOfferingId: 3, date: '2025-02-17', status: 'present' },
  { id: 10, studentId: 27, courseOfferingId: 3, date: '2025-02-17', status: 'absent' },
  { id: 11, studentId: 11, courseOfferingId: 3, date: '2025-02-24', status: 'present' },
  { id: 12, studentId: 13, courseOfferingId: 3, date: '2025-02-24', status: 'present' },
  { id: 13, studentId: 19, courseOfferingId: 3, date: '2025-02-24', status: 'present' },
  { id: 14, studentId: 22, courseOfferingId: 3, date: '2025-02-24', status: 'absent' },
  { id: 15, studentId: 27, courseOfferingId: 3, date: '2025-02-24', status: 'present' },
]

export const lessons: Lesson[] = [
  { id: 1, courseOfferingId: 3, title: 'Introduction to Python', description: 'Setting up the development environment and writing your first Python program.', publishDate: '2025-02-10' },
  { id: 2, courseOfferingId: 3, title: 'Variables and Data Types', description: 'Understanding integers, floats, strings, and booleans in Python.', publishDate: '2025-02-17' },
  { id: 3, courseOfferingId: 3, title: 'Control Flow — If/Else', description: 'Conditional statements and boolean logic in Python.', publishDate: '2025-02-24' },
  { id: 4, courseOfferingId: 3, title: 'Loops and Iteration', description: 'for loops, while loops, and list comprehensions.', publishDate: '2025-03-03' },
  { id: 5, courseOfferingId: 4, title: 'Arrays and Linked Lists', description: 'Understanding fundamental linear data structures.', publishDate: '2025-02-10' },
  { id: 6, courseOfferingId: 4, title: 'Stacks and Queues', description: 'LIFO and FIFO structures with practical applications.', publishDate: '2025-02-17' },
  { id: 7, courseOfferingId: 5, title: 'Relational Model & SQL Basics', description: 'Tables, keys, and basic SELECT queries.', publishDate: '2025-02-10' },
]

export const assignments: Assignment[] = [
  { id: 1, courseOfferingId: 3, title: 'Hello World Program', instruction: 'Write a Python program that prints your full name and student ID.', dueDate: '2025-02-17', totalScore: 20 },
  { id: 2, courseOfferingId: 3, title: 'Calculator Application', instruction: 'Build a basic calculator in Python supporting addition, subtraction, multiplication, and division with error handling.', dueDate: '2025-03-03', totalScore: 50 },
  { id: 3, courseOfferingId: 4, title: 'Implement a Stack', instruction: 'Implement a stack data structure from scratch in Python without using the built-in list methods.', dueDate: '2025-02-24', totalScore: 50 },
  { id: 4, courseOfferingId: 5, title: 'Database Design ERD', instruction: 'Design an entity-relationship diagram for a library management system with at least 5 entities.', dueDate: '2025-03-10', totalScore: 60 },
]

export const submissionsMock: AssignmentSubmission[] = [
  { id: 1, assignmentId: 1, studentId: 11, comment: 'Completed the hello world program as required.', score: 19, submittedAt: '2025-02-15 14:30' },
  { id: 2, assignmentId: 1, studentId: 13, comment: 'Added extra formatting for readability.', score: 20, submittedAt: '2025-02-16 09:00' },
  { id: 3, assignmentId: 1, studentId: 19, comment: 'Completed on time.', submittedAt: '2025-02-17 11:45' },
]

export const announcements: Announcement[] = [
  { id: 1, authorId: 1, facultyId: 3, title: 'Spring 2024–2025 Registration Now Open', content: 'Course registration for Spring 2024–2025 is open until February 5, 2025. Students must register through the student portal.', createdAt: '2025-01-20' },
  { id: 2, authorId: 4, courseOfferingId: 3, title: 'CS101 Midterm Exam — March 17', content: 'The CS101 midterm exam will be held on March 17, 2025 from 8:00–10:00 AM in Room ST-201. The exam covers Chapters 1–5.', createdAt: '2025-02-28' },
  { id: 3, authorId: 1, title: 'University Holiday — Khmer New Year', content: 'The university will be closed from April 14–16 for Khmer New Year (ចូលឆ្នាំខ្មែរ). Classes resume April 17.', createdAt: '2025-03-15' },
  { id: 4, authorId: 4, courseOfferingId: 4, title: 'CS201 Office Hours This Week', content: 'Extra office hours for CS201 students will be held this Wednesday 2:00–4:00 PM in Room ST-105.', createdAt: '2025-03-01' },
]

export const messages: Message[] = [
  { id: 1, senderId: 11, receiverId: 4, message: 'Good morning, Professor Kimheng. Should the Calculator Assignment handle division by zero?', isRead: true, createdAt: '2025-02-25 08:30' },
  { id: 2, senderId: 4, receiverId: 11, message: 'Good morning, Pich Pisey. Yes — display an error message rather than crashing. Good catch!', isRead: true, createdAt: '2025-02-25 09:15' },
  { id: 3, senderId: 13, receiverId: 4, message: 'Professor, will there be extra office hours before the midterm exam?', isRead: false, createdAt: '2025-03-01 14:00' },
]

export const GRADE_SCALE: Record<string, number> = {
  'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0,
}

export function scoreToLetterGrade(score: number): { letter: string; points: number } {
  if (score >= 93) return { letter: 'A', points: 4.0 }
  if (score >= 90) return { letter: 'A-', points: 3.7 }
  if (score >= 87) return { letter: 'B+', points: 3.3 }
  if (score >= 83) return { letter: 'B', points: 3.0 }
  if (score >= 80) return { letter: 'B-', points: 2.7 }
  if (score >= 77) return { letter: 'C+', points: 2.3 }
  if (score >= 73) return { letter: 'C', points: 2.0 }
  if (score >= 70) return { letter: 'C-', points: 1.7 }
  if (score >= 67) return { letter: 'D+', points: 1.3 }
  if (score >= 60) return { letter: 'D', points: 1.0 }
  return { letter: 'F', points: 0.0 }
}
