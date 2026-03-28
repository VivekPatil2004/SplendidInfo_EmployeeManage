export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: "Engineering" | "HR" | "Sales" | "Marketing" | "Finance";
  role: string;
  salary: number;
  joiningDate: string;
  performanceRating: number; // 1 to 5
  isActive: boolean;
  skills: string[];
  address: {
    city: string;
    country: string;
  };
};

export const employees: Employee[] = [
  {
    id: 1,
    firstName: "Amit",
    lastName: "Sharma",
    email: "amit.sharma@email.com",
    phone: "9876543210",
    department: "Engineering",
    role: "Frontend Developer",
    salary: 90000,
    joiningDate: "2022-03-15",
    performanceRating: 4.5,
    isActive: true,
    skills: ["React", "TypeScript", "CSS"],
    address: { city: "Mumbai", country: "India" },
  },
  {
    id: 2,
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@email.com",
    phone: "9123456780",
    department: "HR",
    role: "HR Manager",
    salary: 75000,
    joiningDate: "2021-07-20",
    performanceRating: 4.2,
    isActive: true,
    skills: ["Recruitment", "Communication"],
    address: { city: "Ahmedabad", country: "India" },
  },
  {
    id: 3,
    firstName: "Rahul",
    lastName: "Verma",
    email: "rahul.verma@email.com",
    phone: "9988776655",
    department: "Sales",
    role: "Sales Executive",
    salary: 60000,
    joiningDate: "2023-01-10",
    performanceRating: 3.8,
    isActive: false,
    skills: ["Negotiation", "CRM"],
    address: { city: "Delhi", country: "India" },
  },
  {
    id: 4,
    firstName: "Sneha",
    lastName: "Iyer",
    email: "sneha.iyer@email.com",
    phone: "8899001122",
    department: "Marketing",
    role: "Digital Marketer",
    salary: 65000,
    joiningDate: "2022-09-05",
    performanceRating: 4.7,
    isActive: true,
    skills: ["SEO", "Content Marketing"],
    address: { city: "Bangalore", country: "India" },
  },
  {
    id: 5,
    firstName: "Arjun",
    lastName: "Reddy",
    email: "arjun.reddy@email.com",
    phone: "9001122334",
    department: "Finance",
    role: "Accountant",
    salary: 70000,
    joiningDate: "2020-11-25",
    performanceRating: 4.0,
    isActive: true,
    skills: ["Accounting", "Excel"],
    address: { city: "Hyderabad", country: "India" },
  },
  {
    id: 6,
    firstName: "Neha",
    lastName: "Kapoor",
    email: "neha.kapoor@email.com",
    phone: "9112233445",
    department: "Engineering",
    role: "Backend Developer",
    salary: 95000,
    joiningDate: "2021-04-18",
    performanceRating: 4.6,
    isActive: true,
    skills: ["Node.js", "MongoDB"],
    address: { city: "Pune", country: "India" },
  },
];