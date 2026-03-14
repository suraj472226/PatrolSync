export interface Officer {
  id: string;
  name: string;
  role: "Admin" | "Supervisor" | "Field Officer";
  status: "Active" | "Inactive" | "On Leave";
  phone: string;
  site: string;
  lat?: number;
  lng?: number;
}

export interface Site {
  id: string;
  company: string;
  siteName: string;
  address: string;
  checkpoints: number;
  status: "Active" | "Inactive";
}

export interface Incident {
  id: string;
  dateTime: string;
  site: string;
  officerName: string;
  category: "Security" | "Maintenance" | "Safety" | "Vandalism" | "Trespassing";
  description: string;
  hasPhoto: boolean;
  severity: "Low" | "Medium" | "High" | "Critical";
}

export interface Alert {
  id: string;
  message: string;
  type: "warning" | "critical" | "info";
  time: string;
  site: string;
}

export const officers: Officer[] = [
  { id: "EMP001", name: "Rajesh Kumar", role: "Field Officer", status: "Active", phone: "9876543210", site: "Main Tech Park", lat: 12.9716, lng: 77.5946 },
  { id: "EMP002", name: "Suresh Patel", role: "Field Officer", status: "Active", phone: "9876543211", site: "Brigade Gateway", lat: 12.9815, lng: 77.5712 },
  { id: "EMP003", name: "Amit Singh", role: "Supervisor", status: "Active", phone: "9876543212", site: "Prestige Meridian", lat: 12.9352, lng: 77.6245 },
  { id: "EMP004", name: "Vikram Reddy", role: "Field Officer", status: "On Leave", phone: "9876543213", site: "Embassy Manyata", lat: 13.0475, lng: 77.6212 },
  { id: "EMP005", name: "Deepak Sharma", role: "Field Officer", status: "Active", phone: "9876543214", site: "RMZ Ecoworld", lat: 12.9279, lng: 77.6838 },
  { id: "EMP006", name: "Pradeep Yadav", role: "Admin", status: "Active", phone: "9876543215", site: "HQ Office" },
  { id: "EMP007", name: "Ravi Verma", role: "Field Officer", status: "Active", phone: "9876543216", site: "Salarpuria Sattva", lat: 12.9698, lng: 77.7500 },
  { id: "EMP008", name: "Manoj Tiwari", role: "Field Officer", status: "Inactive", phone: "9876543217", site: "Phoenix Marketcity" },
  { id: "EMP009", name: "Karan Joshi", role: "Supervisor", status: "Active", phone: "9876543218", site: "World Trade Center", lat: 12.9562, lng: 77.6955 },
  { id: "EMP010", name: "Sanjay Mishra", role: "Field Officer", status: "Active", phone: "9876543219", site: "Bagmane Tech Park", lat: 12.9604, lng: 77.6602 },
];

export const sites: Site[] = [
  { id: "SITE001", company: "Infosys Ltd.", siteName: "Main Tech Park", address: "Electronics City Phase 1, Bangalore", checkpoints: 12, status: "Active" },
  { id: "SITE002", company: "Brigade Group", siteName: "Brigade Gateway", address: "Rajajinagar, Bangalore", checkpoints: 8, status: "Active" },
  { id: "SITE003", company: "Prestige Estates", siteName: "Prestige Meridian", address: "MG Road, Bangalore", checkpoints: 15, status: "Active" },
  { id: "SITE004", company: "Embassy Group", siteName: "Embassy Manyata", address: "Hebbal, Bangalore", checkpoints: 20, status: "Active" },
  { id: "SITE005", company: "RMZ Corp", siteName: "RMZ Ecoworld", address: "Bellandur, Bangalore", checkpoints: 10, status: "Inactive" },
  { id: "SITE006", company: "Salarpuria Sattva", siteName: "Salarpuria Knowledge City", address: "ITPL Road, Bangalore", checkpoints: 6, status: "Active" },
  { id: "SITE007", company: "Phoenix Mills", siteName: "Phoenix Marketcity", address: "Whitefield, Bangalore", checkpoints: 14, status: "Active" },
  { id: "SITE008", company: "WTC Bangalore", siteName: "World Trade Center", address: "Brigade Road, Bangalore", checkpoints: 9, status: "Active" },
];

export const incidents: Incident[] = [
  { id: "INC001", dateTime: "2026-03-12 08:45", site: "Main Tech Park", officerName: "Rajesh Kumar", category: "Security", description: "Unauthorized vehicle found in restricted parking zone B3.", hasPhoto: true, severity: "High" },
  { id: "INC002", dateTime: "2026-03-12 07:30", site: "Brigade Gateway", officerName: "Suresh Patel", category: "Maintenance", description: "CCTV camera at Gate 2 found non-functional.", hasPhoto: true, severity: "Medium" },
  { id: "INC003", dateTime: "2026-03-11 22:15", site: "Prestige Meridian", officerName: "Amit Singh", category: "Trespassing", description: "Two individuals attempted to enter through service entrance after hours.", hasPhoto: false, severity: "Critical" },
  { id: "INC004", dateTime: "2026-03-11 19:00", site: "Embassy Manyata", officerName: "Vikram Reddy", category: "Vandalism", description: "Graffiti found on compound wall near Gate 4.", hasPhoto: true, severity: "Low" },
  { id: "INC005", dateTime: "2026-03-11 14:30", site: "RMZ Ecoworld", officerName: "Deepak Sharma", category: "Safety", description: "Fire extinguisher in Block C found expired.", hasPhoto: true, severity: "High" },
  { id: "INC006", dateTime: "2026-03-11 11:20", site: "Main Tech Park", officerName: "Rajesh Kumar", category: "Security", description: "Visitor badge not returned - Badge #V2045.", hasPhoto: false, severity: "Low" },
  { id: "INC007", dateTime: "2026-03-10 23:50", site: "Salarpuria Knowledge City", officerName: "Ravi Verma", category: "Security", description: "Suspicious package found near lobby entrance.", hasPhoto: true, severity: "Critical" },
  { id: "INC008", dateTime: "2026-03-10 16:15", site: "World Trade Center", officerName: "Karan Joshi", category: "Maintenance", description: "Water leakage in server room corridor.", hasPhoto: true, severity: "High" },
  { id: "INC009", dateTime: "2026-03-10 09:00", site: "Bagmane Tech Park", officerName: "Sanjay Mishra", category: "Safety", description: "Emergency exit on 3rd floor found blocked.", hasPhoto: false, severity: "High" },
  { id: "INC010", dateTime: "2026-03-09 21:30", site: "Phoenix Marketcity", officerName: "Manoj Tiwari", category: "Trespassing", description: "Person found sleeping in basement parking Level 2.", hasPhoto: true, severity: "Medium" },
];

export const alerts: Alert[] = [
  { id: "ALT001", message: "Missed Patrol at Main Tech Park - Checkpoint 7", type: "warning", time: "2 min ago", site: "Main Tech Park" },
  { id: "ALT002", message: "GPS Turned Off - Officer Vikram Reddy", type: "critical", time: "5 min ago", site: "Embassy Manyata" },
  { id: "ALT003", message: "SOS Triggered - Officer Ravi Verma", type: "critical", time: "8 min ago", site: "Salarpuria Knowledge City" },
  { id: "ALT004", message: "Checkpoint scan completed - Brigade Gateway", type: "info", time: "12 min ago", site: "Brigade Gateway" },
  { id: "ALT005", message: "Missed Patrol at RMZ Ecoworld - Checkpoint 3", type: "warning", time: "18 min ago", site: "RMZ Ecoworld" },
  { id: "ALT006", message: "New incident reported - World Trade Center", type: "info", time: "25 min ago", site: "World Trade Center" },
  { id: "ALT007", message: "Battery Low - Officer Deepak Sharma's device", type: "warning", time: "32 min ago", site: "RMZ Ecoworld" },
  { id: "ALT008", message: "Perimeter breach detected - Prestige Meridian", type: "critical", time: "45 min ago", site: "Prestige Meridian" },
];

export const dashboardStats = {
  activeOfficers: 7,
  sitesPatrolled: 6,
  criticalIncidents: 3,
  missedCheckpoints: 4,
};
