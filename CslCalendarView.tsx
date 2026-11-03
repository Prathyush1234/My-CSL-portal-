import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Eye, Clock, CheckCircle2, Award, Info, Pencil, FileText, Download, Printer, X,
  Sparkles, MapPin, Flag, ExternalLink, Filter, Search, CalendarDays, Check,
  AlertCircle, Sun, Briefcase, RotateCcw, Bookmark, ShieldAlert, Utensils, Anchor,
  ClipboardCheck, IndianRupee, Fingerprint, Plus, HeartPulse, ShieldCheck, MessageSquare, Loader2, Share2
} from 'lucide-react';
import { CslLogo } from './CslLogo';
import { CslTugBackground } from './CslTugBackground';
import { Language } from '../types';
import { CSL_SHIFTS, CSL_SHIFT_CODES, CslShiftCode, DutyPunchData, calculateDutyAndOT, isSundayDate, isCslHolidayDate, getRecommendedShiftForDate, getIstDate, MONTH_SHORT_NAMES, getAttendanceLogsKey, ensureMonthlyRolloverAndArchive } from '../data/cslShifts';
import { getWeeklyShiftForDate, getCurrentAndNextWeekShift, setCurrentWeekShift, getEffectiveShiftForDate, getSyncedActiveShiftForToday, syncShiftFromCalendarEverywhere } from '../utils/shiftRotation';
import { HalfDayWhatsAppShareModal } from './HalfDayWhatsAppShareModal';
import { CslMonthlyPdfViewerModal } from './CslMonthlyPdfViewerModal';
import { CslNextMonthOtViewerModal } from './CslNextMonthOtViewerModal';
import { HalfDayPunchShareParams } from '../utils/whatsappShare';
import { DutyPunchModal } from './DutyPunchModal';
import { 
  generateAndDownloadMonthlyPdf, shareMonthlyPdf, openMonthlyPdfInNewTab, prepareMonthlyPdf, MonthlyPdfData,
  NextMonthOtPdfData, NextMonthOtItem, generateAndDownloadNextMonthOtPdf, shareNextMonthOtPdf, prepareNextMonthOtPdf
} from '../utils/cslPdfGenerator';

interface CslCalendarViewProps {
  language: Language;
  currentUser?: {
    name: string;
    token: string;
    phone: string;
    department?: string;
    category?: string;
  };
  onBackToQuickAccess: () => void;
  onEditProfile?: () => void;
  onOpenAttendance?: () => void;
  onOpenSalary?: () => void;
}

// Authentic CSL 2026 Monthly Thematic Features & Specifications
export interface CslMonthFeature {
  monthIndex: number;
  name: string;
  hindi: string;
  malayalam: string;
  kollavarshamEra: string; // e.g. കന്നി - തുലാം 1202
  days: number;
  startDay: number; // 0 = Sun, 1 = Mon ...
  holidaysCount: number;
  workingDays: number;
  weeklyOffs: number;
  vesselName: string;
  vesselNameMl: string;
  unitName: string;
  unitNameMl: string;
  category: string;
  sloganEn: string;
  sloganMl: string;
  specs: string[];
  themeGradient: string;
  accentColor: string;
  bgGlow: string;
  description: string;
}

export const cslMonthsConfig: CslMonthFeature[] = [
  {
    monthIndex: 0,
    name: 'January',
    hindi: 'जनवरी',
    malayalam: 'ജനുവരി',
    kollavarshamEra: 'ധനു - മകരം 1201',
    days: 31,
    startDay: 4, // Thursday
    holidaysCount: 1,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'Main Shipyard & Building Docks',
    vesselNameMl: 'പ്രധാന കപ്പൽ നിർമ്മാണ ശാല & ഡ്രൈ ഡോക്കുകൾ',
    unitName: 'CSL Kochi Main Yard, Kerala',
    unitNameMl: 'കൊച്ചി പ്രധാന ഷിപ്പ്‌യാർഡ്',
    category: 'Shipbuilding & Heavy Marine Infrastructure',
    sloganEn: 'Engineering Giants of the Seas since 1972',
    sloganMl: 'സമുദ്ര വിജയത്തിന്റെ ശില്പികൾ · 1972 മുതൽ',
    specs: ['300,000 DWT Building Dock', '125,000 DWT Repair Dock', '2000+ Skilled Workforce', 'Pan-India Marine Leader'],
    themeGradient: 'from-[#032030] via-[#05394d] to-[#011926]',
    accentColor: '#38bdf8',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    description: 'The foundation of Indian commercial & naval shipbuilding with premier dry docks and heavy fabrication bays on the Arabian Sea.',
  },
  {
    monthIndex: 1,
    name: 'February',
    hindi: 'फ़रवरी',
    malayalam: 'ഫെബ്രുവരി',
    kollavarshamEra: 'മകരം - കുംഭം 1201',
    days: 28,
    startDay: 0, // Sunday
    holidaysCount: 0,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'INS Vikrant (IAC-1) · Indigenous Aircraft Carrier',
    vesselNameMl: 'ഐ.എൻ.എസ് വിക്രാന്ത് - ഭാരതത്തിന്റെ അഭിമാനം',
    unitName: 'Indian Navy & CSL Defense Division',
    unitNameMl: 'ഇന്ത്യൻ നേവി & പ്രതിരോധ ഡിവിഷൻ',
    category: 'Indigenous Naval Defense Flagship',
    sloganEn: 'Pride of Sovereign India · Defending Our Waters',
    sloganMl: 'പരമാധികാര ഭാരതത്തിന്റെ സമുദ്ര കാവലാൾ',
    specs: ['262m Overall Length', '45,000 Tonnes Displacement', '76% Indigenous Content', 'STOBAR Carrier Configuration'],
    themeGradient: 'from-[#1a1c35] via-[#242b5c] to-[#0f1226]',
    accentColor: '#818cf8',
    bgGlow: 'rgba(129, 140, 248, 0.15)',
    description: 'The greatest milestone in Indian shipbuilding history: fully designed, built, and delivered to the Indian Navy by Cochin Shipyard.',
  },
  {
    monthIndex: 2,
    name: 'March',
    hindi: 'मार्च',
    malayalam: 'മാർച്ച്',
    kollavarshamEra: 'കുംഭം - മീനം 1201',
    days: 31,
    startDay: 0, // Sunday
    holidaysCount: 1,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'Kochi Water Metro · Electric Hybrid Catamarans',
    vesselNameMl: 'കൊച്ചി വാട്ടർ മെട്രോ - അത്യാധുനിക ഇലക്ട്രിക് ഫെറി',
    unitName: 'Kochi Water Metro Project, Kerala',
    unitNameMl: 'വാട്ടർ മെട്രോ നിർമ്മാണ പദ്ധതി',
    category: 'Sustainable Urban Water Mobility',
    sloganEn: 'Silent, Clean & Green Commute on Urban Waters',
    sloganMl: 'ഹരിത നഗര ജലഗതാഗത വിപ്ലവം',
    specs: ['23 Fast Catamaran Ferries', 'LTO Battery Powered Hybrid', 'Zero Emission Operation', 'Air-Conditioned Passenger Comfort'],
    themeGradient: 'from-[#042825] via-[#084c47] to-[#021f1d]',
    accentColor: '#2dd4bf',
    bgGlow: 'rgba(45, 212, 191, 0.15)',
    description: 'Asias largest integrated electric boat urban transit system, designed and crafted by CSL for zero-pollution island connectivity.',
  },
  {
    monthIndex: 3,
    name: 'April',
    hindi: 'अप्रैल',
    malayalam: 'ഏപ്രിൽ',
    kollavarshamEra: 'മീനം - മേടം 1201',
    days: 30,
    startDay: 3, // Wednesday
    holidaysCount: 2,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'International Ship Repair Facility (ISRF)',
    vesselNameMl: 'ഇന്റർനാഷണൽ ഷിപ്പ് റിപ്പയർ ഫെസിലിറ്റി (ISRF)',
    unitName: 'Willingdon Island, Kochi',
    unitNameMl: 'വില്ലിങ്ഡൻ ഐലൻഡ്, കൊച്ചി',
    category: 'Global Marine Repair Infrastructure',
    sloganEn: 'Speed, Quality & Reliability in Marine Overhauls',
    sloganMl: 'ആഗോള കപ്പൽ അറ്റകുറ്റപ്പണി കേന്ദ്രം',
    specs: ['6,000 Tonnes Ship Lift', '6 Deep-water Workstation Berths', '80+ Vessels Annual Capacity', 'State-of-the-Art Transfer Cars'],
    themeGradient: 'from-[#1e2330] via-[#2d3748] to-[#12161f]',
    accentColor: '#38bdf8',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    description: 'CSLs flagship global ship repair destination, transforming Kochi into the premier vessel maintenance capital of South Asia.',
  },
  {
    monthIndex: 4,
    name: 'May',
    hindi: 'मई',
    malayalam: 'മെയ്',
    kollavarshamEra: 'മേടം - ഇടവം 1201',
    days: 31,
    startDay: 5, // Friday
    holidaysCount: 2,
    workingDays: 21,
    weeklyOffs: 6,
    vesselName: 'New 310m Stepped Dry Dock & 600T Goliath Gantry',
    vesselNameMl: 'പുതിയ 310 മീറ്റർ ഡ്രൈ ഡോക്ക് & 600T ഗോളിയാത്ത് ക്രെയിൻ',
    unitName: 'CSL Mega Expansion Project, Kochi',
    unitNameMl: 'സി.എസ്.എൽ മെഗാ വികസന പദ്ധതി',
    category: 'Mega Dry Dock for Dual Carriers & Capesize Ships',
    sloganEn: 'Powering Next-Generation Mega Ships for India',
    sloganMl: 'അടുത്ത തലമുറ മെഗാ കപ്പലുകൾക്കായി',
    specs: ['310m Length × 75m Width', 'Stepped Dock Basin', '600-Tonne Goliath Gantry Crane', 'Dual Aircraft Carrier Capable'],
    themeGradient: 'from-[#2e1d0d] via-[#4d3014] to-[#1a1007]',
    accentColor: '#fbbf24',
    bgGlow: 'rgba(251, 191, 36, 0.15)',
    description: 'Inaugurated by Honble Prime Minister of India, one of the largest stepped dry docks in Asia, handling mega commercial and defense ships.',
  },
  {
    monthIndex: 5,
    name: 'June',
    hindi: 'जून',
    malayalam: 'ജൂൺ',
    kollavarshamEra: 'ഇടവം - മിഥുനം 1201',
    days: 30,
    startDay: 1, // Monday
    holidaysCount: 0,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'Hooghly Cochin Shipyard Limited (HCSL), Kolkata',
    vesselNameMl: 'ഹൂഗ്ലി കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് (HCSL), കൊൽക്കത്ത',
    unitName: 'Nazirgunge, Howrah, West Bengal',
    unitNameMl: 'ഹൗറ, പശ്ചിമ ബംഗാൾ',
    category: 'Inland Waterways & National Waterway 1 & 2 Vessels',
    sloganEn: 'Connecting Eastern Waters with Modern Marine Craft',
    sloganMl: 'കിഴക്കൻ ജലപാതകളുടെ നവീകരണം',
    specs: ['Ganga & Brahmaputra Crafts', 'River-Sea Barges & Tugs', 'Modern Side Launch Slipway', 'Jal Marg Vikas Project Partner'],
    themeGradient: 'from-[#0b292e] via-[#12414a] to-[#071c20]',
    accentColor: '#2dd4bf',
    bgGlow: 'rgba(45, 212, 191, 0.15)',
    description: 'CSLs specialized subsidiary advancing the National Inland Waterways initiative with river passenger vessels and cargo barges.',
  },
  {
    monthIndex: 6,
    name: 'July',
    hindi: 'जुलाई',
    malayalam: 'ജൂലൈ',
    kollavarshamEra: 'മിഥുനം - കർക്കടകം 1201',
    days: 31,
    startDay: 3, // Wednesday
    holidaysCount: 1,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'Udupi Cochin Shipyard Limited (UCSL), Malpe',
    vesselNameMl: 'ഉഡുപ്പി കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് (UCSL), മാൽപ്പേ',
    unitName: 'Malpe Port, Karnataka',
    unitNameMl: 'മാൽപ്പേ തുറമുഖം, കർണാടക',
    category: 'Coastal Ships & High Bollard Pull Harbour Tugs',
    sloganEn: 'Precision Engineering for Coastal Ports & Tugs',
    sloganMl: 'തീരദേശ തുറമുഖങ്ങൾക്കായി ശക്തമായ ടഗ്ഗുകൾ',
    specs: ['62T & 70T Bollard Pull Tugs', 'ASTDS Standard Designs', 'Deep-sea Fishing Vessels', 'Port Automation Engineering'],
    themeGradient: 'from-[#191e3b] via-[#242b56] to-[#0d1021]',
    accentColor: '#60a5fa',
    bgGlow: 'rgba(96, 165, 250, 0.15)',
    description: 'Constructing indigenous tugboats under the Green Tug Transition Program and specialized coastal and fishing crafts for India.',
  },
  {
    monthIndex: 7,
    name: 'August',
    hindi: 'अगस्त',
    malayalam: 'ആഗസ്റ്റ്',
    kollavarshamEra: 'കർക്കടകം - ചിങ്ങം 1202',
    days: 31,
    startDay: 6, // Saturday
    holidaysCount: 2,
    workingDays: 21,
    weeklyOffs: 6,
    vesselName: 'ASW Shallow Water Crafts for Indian Navy (INS Mahe Class)',
    vesselNameMl: 'ആന്റി-സബ്‌മറൈൻ വാർഫെയർ ക്രാഫ്റ്റുകൾ',
    unitName: 'CSL Naval Combatant Programs',
    unitNameMl: 'നാവിക സേനാ പ്രോജക്റ്റുകൾ',
    category: 'High-Speed Subsurface Naval Combatants',
    sloganEn: 'Guardians of Indias Maritime Borders · Independence Month',
    sloganMl: 'തീരദേശ സമുദ്ര അതിർത്തികളുടെ കാവൽക്കാർ',
    specs: ['8 Advanced ASW Vessels', 'Waterjet Propulsion System', '25+ Knots High Speed', 'State-of-the-Art Indigenous Sonar'],
    themeGradient: 'from-[#132a22] via-[#1a3d31] to-[#0a1813]',
    accentColor: '#34d399',
    bgGlow: 'rgba(52, 211, 153, 0.15)',
    description: 'Equipped with indigenous light-weight torpedoes and anti-submarine rockets, protecting Indian coastal waters and harbour perimeters.',
  },
  {
    monthIndex: 8,
    name: 'September',
    hindi: 'सितंबर',
    malayalam: 'സെപ്റ്റംബർ',
    kollavarshamEra: 'ചിങ്ങം - കന്നി 1202',
    days: 30,
    startDay: 2, // Tuesday
    holidaysCount: 1,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'Indigenous Hydrogen Fuel Cell Catamaran Ferry',
    vesselNameMl: 'ഹൈഡ്രജൻ ഫ്യൂവൽ സെൽ കപ്പൽ - ഹരിത ഭാരതം',
    unitName: 'Green Vessels Division, CSL',
    unitNameMl: 'ഹരിത വെസ്സൽ ഡിവിഷൻ',
    category: 'Pioneering Clean Hydrogen Maritime Technology',
    sloganEn: 'Leading Indias Maritime Hydrogen Green Transition',
    sloganMl: 'സീറോ എമിഷൻ ക്ലീൻ എനർജി വിപ്ലവം',
    specs: ['Zero Emission Technology', 'Hydrogen PEM Fuel Cells', 'Pure Water Vapour Exhaust', 'National Green Hydrogen Mission'],
    themeGradient: 'from-[#072d36] via-[#0c4756] to-[#041a1f]',
    accentColor: '#38bdf8',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    description: 'India’s pioneering zero-emission vessel developed by CSL in partnership with Indian tech institutes, paving the way for net-zero shipping.',
  },
  {
    monthIndex: 9,
    name: 'October',
    hindi: 'अक्टूबर',
    malayalam: 'ഒക്ടോബർ',
    kollavarshamEra: 'കന്നി - തുലാം 1202',
    days: 31,
    startDay: 4, // Thursday
    holidaysCount: 2,
    workingDays: 23,
    weeklyOffs: 6,
    vesselName: 'Autonomous Electric Cargo Ships for Europe (ASKO & Utkrisht)',
    vesselNameMl: 'യൂറോപ്പിലേക്കുള്ള ഓട്ടോണമസ് ഇലക്ട്രിക് ചരക്കുകപ്പലുകൾ',
    unitName: 'CSL International Commercial Shipbuilding',
    unitNameMl: 'അന്താരാഷ്ട്ര വാണിജ്യ കപ്പൽ നിർമ്മാണം',
    category: 'High-Tech Commercial Green Export Vessels',
    sloganEn: 'Global Benchmark in Autonomous Clean Marine Logistics',
    sloganMl: 'ആഗോള നിലവാരമുള്ള അത്യാധുനിക എക്സ്പോർട്ട് കപ്പലുകൾ',
    specs: ['Zero-Emission Battery Driven', 'Auto-Mooring & Nav Systems', 'Export for ASKO Maritime Norway', 'International Clean Shipping Award'],
    themeGradient: 'from-[#022735] via-[#05445e] to-[#011822]',
    accentColor: '#38bdf8',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    description: 'Pioneering European export success: autonomous and zero-emission electric cargo freight vessels traversing Scandinavian fjords.',
  },
  {
    monthIndex: 10,
    name: 'November',
    hindi: 'नवंबर',
    malayalam: 'നവംബർ',
    kollavarshamEra: 'തുലാം - വൃശ്ചികം 1202',
    days: 30,
    startDay: 0, // Sunday
    holidaysCount: 1,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'Mumbai & Andaman Ship Repair Units (MSRU / ANSRU)',
    vesselNameMl: 'മുംബൈ & ആൻഡമാൻ ഷിപ്പ് റിപ്പയർ യൂണിറ്റുകൾ',
    unitName: 'MSRU (Mumbai) & ANSRU (Port Blair)',
    unitNameMl: 'മുംബൈ & പോർട്ട് ബ്ലെയർ യൂണിറ്റുകൾ',
    category: 'Strategic Defense & Commercial Fleet Overhauls',
    sloganEn: 'Round-the-Clock Support for Merchant & Naval Fleets',
    sloganMl: 'ദേശീയ നാവിക വ്യൂഹത്തിന് രാപ്പകൽ സാങ്കേതിക പിന്തുണ',
    specs: ['Port Blair Island Strategic Unit', 'Mumbai Port Trust Dry Docks', 'Coast Guard FPV Refits', 'Naval Offshore Patrol Support'],
    themeGradient: 'from-[#221c38] via-[#332a54] to-[#130f21]',
    accentColor: '#a78bfa',
    bgGlow: 'rgba(167, 139, 250, 0.15)',
    description: 'Expanding CSL repair footprint across Indias coastline: providing specialized refit expertise for Coast Guard and Merchant vessels.',
  },
  {
    monthIndex: 11,
    name: 'December',
    hindi: 'दिसंबर',
    malayalam: 'ഡിസംബർ',
    kollavarshamEra: 'വൃശ്ചികം - ധനു 1202',
    days: 31,
    startDay: 2, // Tuesday
    holidaysCount: 1,
    workingDays: 22,
    weeklyOffs: 6,
    vesselName: 'Commissioning Service Operation Vessels (CSOV) for Offshore Wind',
    vesselNameMl: 'ഓഫ്‌ഷോർ വിൻഡ് ഫാം സർവീസ് കപ്പലുകൾ (CSOV)',
    unitName: 'CSL International Offshore Renewable Division',
    unitNameMl: 'അന്താരാഷ്ട്ര ഓഫ്‌ഷോർ റിന്യൂവബിൾ ഡിവിഷൻ',
    category: 'High-End Offshore Windfarm Service Ships',
    sloganEn: 'Harnessing Global Renewable Winds with World-Class Vessels',
    sloganMl: 'ആഗോള കാറ്റാടിപ്പാടങ്ങൾക്കായി അത്യാധുനിക കപ്പലുകൾ',
    specs: ['DP2 Dynamic Positioning', '3D Motion-Compensated Gangway', 'Hybrid Eco-Diesel Propulsion', 'European Offshore Operators'],
    themeGradient: 'from-[#032338] via-[#053d61] to-[#021524]',
    accentColor: '#38bdf8',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    description: 'High-end specialized vessels for European offshore wind installations, featuring heave-compensated technology and luxury crew accommodations.',
  },
];

export const CSL_MONTH_IMAGES: Record<number, string> = {
  0: '/vessel3.jpg',     // Jan: Main Shipyard & Building Docks
  1: '/vessel1.jpg',     // Feb: INS Vikrant (IAC-1) Aircraft Carrier
  2: '/vessel2.jpg',     // Mar: Kochi Water Metro Electric Catamarans
  3: '/vessel3.jpg',     // Apr: International Ship Repair Facility (ISRF)
  4: '/vessel3.jpg',     // May: New 310m Stepped Dry Dock & 600T Goliath Gantry
  5: '/osv_ship.jpg',    // Jun: Hooghly Cochin Shipyard (HCSL)
  6: '/osv_ship.jpg',    // Jul: Udupi Cochin Shipyard (UCSL) Harbour Tugs
  7: '/vessel4.jpg',     // Aug: ASW Shallow Water Crafts
  8: '/vessel2.jpg',     // Sep: Indigenous Hydrogen Fuel Cell Catamaran Ferry
  9: '/kl_saltfjord.jpg',// Oct: Autonomous Electric Cargo Ships for Europe (ASKO)
  10: '/vessel4.jpg',    // Nov: Mumbai & Andaman Ship Repair Units
  11: '/vessel1.jpg',    // Dec: Commissioning Service Operation Vessels (CSOV)
};

export interface MalayalamPanchangamData {
  kollavarshamMonth: string;
  kollavarshamDay: number;
  kollavarshamYear: number;
  kollavarshamText: string;
  sakaEraText: string;
  hijraEraText: string;
  nakshathram: string;
  thithi: string;
  rahuKaalam: string;
  nallaNeram: string;
  gulikaKaalam: string;
  sunrise: string;
  sunset: string;
  isPournami?: boolean;
  isAmavasi?: boolean;
}

// 27 Traditional Malayalam Nakshathrams
const MALAYALAM_STARS = [
  'അശ്വതി', 'ഭരണി', 'കാർത്തിക', 'രോഹിണി', 'മകയിരം', 'തിരുവാതിര',
  'പുണർതം', 'പൂയം', 'ആയില്യം', 'മകം', 'പൂരം', 'ഉത്രം',
  'അത്തം', 'ചിത്തിര', 'ചോതി', 'വിശാഖം', 'അനിഴം', 'തൃക്കേട്ട',
  'മൂലം', 'പൂരാടം', 'ഉത്രാടം', 'തിരുവോണം', 'അവിട്ടം', 'ചതയം',
  'പൂരുരുട്ടാതി', 'ഉത്രട്ടാതി', 'രേവതി'
];

export const KERALA_DAY_PANCHANGAM: Record<number, {
  rahu: string;
  nallaNeram: string;
  gulika: string;
}> = {
  0: { rahu: '04:30 PM - 06:00 PM', nallaNeram: '06:15 AM - 07:15 AM, 02:00 PM - 03:00 PM', gulika: '03:00 PM - 04:30 PM' },
  1: { rahu: '07:30 AM - 09:00 AM', nallaNeram: '06:30 AM - 07:30 AM, 04:30 PM - 05:30 PM', gulika: '01:30 PM - 03:00 PM' },
  2: { rahu: '03:00 PM - 04:30 PM', nallaNeram: '07:30 AM - 08:30 AM, 05:00 PM - 06:00 PM', gulika: '12:00 PM - 01:30 PM' },
  3: { rahu: '12:00 PM - 01:30 PM', nallaNeram: '09:15 AM - 10:15 AM, 03:30 PM - 04:30 PM', gulika: '10:30 AM - 12:00 PM' },
  4: { rahu: '01:30 PM - 03:00 PM', nallaNeram: '09:00 AM - 10:00 AM, 04:00 PM - 05:00 PM', gulika: '09:00 AM - 10:30 AM' },
  5: { rahu: '10:30 AM - 12:00 PM', nallaNeram: '06:15 AM - 07:15 AM, 03:30 PM - 04:30 PM', gulika: '07:30 AM - 09:00 AM' },
  6: { rahu: '09:00 AM - 10:30 AM', nallaNeram: '07:15 AM - 08:15 AM, 04:30 PM - 05:30 PM', gulika: '06:00 AM - 07:30 AM' },
};

export const getMalayalamPanchangam = (monthIndex: number, day: number, dayOfWeek: number): MalayalamPanchangamData => {
  let kMonth = 'കന്നി';
  let kDay = day;
  let kYear = 1202;

  switch (monthIndex) {
    case 0: // Jan: Dhanu 17-29, Makaram 1-18 (1201)
      kYear = 1201;
      if (day <= 13) { kMonth = 'ധനു'; kDay = day + 16; }
      else { kMonth = 'മകരം'; kDay = day - 13; }
      break;
    case 1: // Feb: Makaram 19-30, Kumbham 1-16 (1201)
      kYear = 1201;
      if (day <= 12) { kMonth = 'മകരം'; kDay = day + 18; }
      else { kMonth = 'കുംഭം'; kDay = day - 12; }
      break;
    case 2: // Mar: Kumbham 17-30, Meenam 1-17 (1201)
      kYear = 1201;
      if (day <= 14) { kMonth = 'കുംഭം'; kDay = day + 16; }
      else { kMonth = 'മീനം'; kDay = day - 14; }
      break;
    case 3: // Apr: Meenam 18-30, Medam 1-17 (1201)
      kYear = 1201;
      if (day <= 13) { kMonth = 'മീനം'; kDay = day + 17; }
      else { kMonth = 'മേടം'; kDay = day - 13; }
      break;
    case 4: // May: Medam 18-31, Edavam 1-17 (1201)
      kYear = 1201;
      if (day <= 14) { kMonth = 'മേടം'; kDay = day + 17; }
      else { kMonth = 'ഇടവം'; kDay = day - 14; }
      break;
    case 5: // Jun: Edavam 18-31, Mithunam 1-16 (1201)
      kYear = 1201;
      if (day <= 14) { kMonth = 'ഇടവം'; kDay = day + 17; }
      else { kMonth = 'മിഥുനം'; kDay = day - 14; }
      break;
    case 6: // Jul: Mithunam 17-31, Karkidakam 1-16 (1201)
      kYear = 1201;
      if (day <= 15) { kMonth = 'മിഥുനം'; kDay = day + 16; }
      else { kMonth = 'കർക്കടകം'; kDay = day - 15; }
      break;
    case 7: // Aug: Karkidakam 17-31 (1201), Chingam 1-15 (1202 New Year!)
      if (day <= 16) { kYear = 1201; kMonth = 'കർക്കടകം'; kDay = day + 16; }
      else { kYear = 1202; kMonth = 'ചിങ്ങം'; kDay = day - 16; }
      break;
    case 8: // Sep: Chingam 16-31, Kanni 1-14 (1202)
      kYear = 1202;
      if (day <= 16) { kMonth = 'ചിങ്ങം'; kDay = day + 15; }
      else { kMonth = 'കന്നി'; kDay = day - 16; }
      break;
    case 9: // Oct: Kanni 15-30, Thulam 1-15 (1202)
      kYear = 1202;
      if (day <= 16) { kMonth = 'കന്നി'; kDay = day + 14; }
      else { kMonth = 'തുലാം'; kDay = day - 16; }
      break;
    case 10: // Nov: Thulam 16-30, Vrischikam 1-15 (1202)
      kYear = 1202;
      if (day <= 15) { kMonth = 'തുലാം'; kDay = day + 15; }
      else { kMonth = 'വൃശ്ചികം'; kDay = day - 15; }
      break;
    case 11: // Dec: Vrischikam 16-30, Dhanu 1-16 (1202)
      kYear = 1202;
      if (day <= 15) { kMonth = 'വൃശ്ചികം'; kDay = day + 15; }
      else { kMonth = 'ധനു'; kDay = day - 15; }
      break;
  }

  // Calculate day-of-year star offset
  const starOffset = (monthIndex * 31 + day + 3) % 27;
  const nakshathram = MALAYALAM_STARS[starOffset];

  // Thithi for October 2026
  let thithi = 'ശുക്ലപക്ഷ പഞ്ചമി';
  let isPournami = false;
  let isAmavasi = false;

  if (monthIndex === 9) {
    if (day === 10) { thithi = 'അമാവാസി (കറുത്തവാവ്)'; isAmavasi = true; }
    else if (day === 25) { thithi = 'പൗർണ്ണമി (വെളുത്തവാവ്)'; isPournami = true; }
    else if (day < 10) {
      const tNames = ['പ്രഥമ', 'ദ്വിതീയ', 'തൃതീയ', 'ചതുർത്ഥി', 'പഞ്ചമി', 'ഷഷ്ഠി', 'സപ്തമി', 'അഷ്ടമി', 'നവമി'];
      thithi = `കൃഷ്ണപക്ഷ ${tNames[(day - 1) % 9]}`;
    } else if (day <= 24) {
      const tNames = ['പ്രഥമ', 'ദ്വിതീയ', 'തൃതീയ', 'ചതുർത്ഥി', 'പഞ്ചമി', 'ഷഷ്ഠി', 'സപ്തമി', 'അഷ്ടമി', 'നവമി', 'ദശമി (വിജയദശമി)', 'ഏകാദശി', 'ദ്വാദശി', 'ത്രയോദശി', 'ചതുർദ്ദശി'];
      thithi = `ശുക്ലപക്ഷ ${tNames[(day - 11) % tNames.length]}`;
    } else {
      const tNames = ['പ്രഥമ', 'ദ്വിതീയ', 'തൃതീയ', 'ചതുർത്ഥി', 'പഞ്ചമി', 'ഷഷ്ഠി'];
      thithi = `കൃഷ്ണപക്ഷ ${tNames[(day - 26) % tNames.length]}`;
    }
  } else {
    thithi = (day % 15 === 0) ? (day === 15 ? 'പൗർണ്ണമി' : 'അമാവാസി') : (day < 15 ? `ശുക്ലപക്ഷ തിഥി ${day}` : `കൃഷ്ണപക്ഷ തിഥി ${day - 15}`);
  }

  const timing = KERALA_DAY_PANCHANGAM[dayOfWeek] || KERALA_DAY_PANCHANGAM[4];

  return {
    kollavarshamMonth: kMonth,
    kollavarshamDay: kDay,
    kollavarshamYear: kYear,
    kollavarshamText: `${kYear} ${kMonth} ${kDay}`,
    sakaEraText: monthIndex >= 2 && monthIndex <= 11 ? 'ശകവർഷം 1948' : 'ശകവർഷം 1947',
    hijraEraText: 'ഹിജ്‌റ 1448',
    nakshathram,
    thithi,
    rahuKaalam: timing.rahu,
    nallaNeram: timing.nallaNeram,
    gulikaKaalam: timing.gulika,
    sunrise: '06:12 AM',
    sunset: '06:08 PM',
    isPournami,
    isAmavasi,
  };
};

// Complete 12 Official Closed Gazetted Holidays for Cochin Shipyard Limited 2026
export const cslOfficial12Holidays2026 = [
  {
    id: 1,
    name: 'Republic Day',
    hindiName: 'गणतंत्र दिवस',
    malayalamName: 'റിപ്പബ്ലിക് ദിനം',
    date: '26',
    month: 'JAN',
    fullDate: '26 January 2026',
    dayOfWeek: 'Monday',
    monthIndex: 0,
    category: 'National' as const,
    badge: 'National Holiday',
    description: 'National Day · Shipyard Closed · Ceremonial Flag Hoisting at Parade Ground with CMD & workforce honours',
    location: 'All CSL Units & Corporate Offices',
    isWeekend: false,
  },
  {
    id: 2,
    name: 'Id-ul-Fitr (Ramzan)',
    hindiName: 'ईद-उल-फ़ित्र',
    malayalamName: 'ഈദുൽ ഫിത്ർ',
    date: '21',
    month: 'MAR',
    fullDate: '21 March 2026',
    dayOfWeek: 'Saturday',
    monthIndex: 2,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Gazetted Festival · 3rd Saturday Closed Holiday across all workshops and dry docks',
    location: 'Kochi Shipyard & Repair Docks',
    isWeekend: true,
  },
  {
    id: 3,
    name: 'Good Friday',
    hindiName: 'गुड फ्राइडे',
    malayalamName: 'ദുഃഖവെള്ളി',
    date: '03',
    month: 'APR',
    fullDate: '03 April 2026',
    dayOfWeek: 'Friday',
    monthIndex: 3,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Christian Holy Day · Official Gazetted Closed Holiday for yard and administration',
    location: 'All Yard Establishments',
    isWeekend: false,
  },
  {
    id: 4,
    name: 'Dr. B.R. Ambedkar Jayanthi / Vishu',
    hindiName: 'आंबेडकर जयंती / विषु',
    malayalamName: 'അംബേദ്കർ ജയന്തി / വിഷു',
    date: '14',
    month: 'APR',
    fullDate: '14 April 2026',
    dayOfWeek: 'Tuesday',
    monthIndex: 3,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Birth Anniversary of Dr. B.R. Ambedkar & Traditional Kerala Vishu Festival · CSL Closed Gazetted Holiday',
    location: 'All CSL Establishments & Yards',
    isWeekend: false,
  },
  {
    id: 5,
    name: 'May Day (Labour Day)',
    hindiName: 'मई दिवस / श्रमिक दिवस',
    malayalamName: 'മെയ് ദിനം (തൊഴിലാളി ദിനം)',
    date: '01',
    month: 'MAY',
    fullDate: '01 May 2026',
    dayOfWeek: 'Friday',
    monthIndex: 4,
    category: 'National' as const,
    badge: 'National Holiday',
    description: 'International Workers’ Day · Trade Union & Shipbuilders Commemoration · Complete yard closure',
    location: 'All CSL Shipyards & Docks',
    isWeekend: false,
  },
  {
    id: 6,
    name: 'Bakrid / Id-ul-Zuha',
    hindiName: 'बकरीद (ईद-उल-ज़ुहा)',
    malayalamName: 'ബക്രീദ് (ബലിപെരുന്നാൾ)',
    date: '27',
    month: 'MAY',
    fullDate: '27 May 2026',
    dayOfWeek: 'Wednesday',
    monthIndex: 4,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Islamic Holy Feast of Sacrifice · Official Gazetted Closed Holiday',
    location: 'All CSL Establishments',
    isWeekend: false,
  },
  {
    id: 7,
    name: 'Muharram',
    hindiName: 'मुहर्रम',
    malayalamName: 'മുഹറം',
    date: '26',
    month: 'JUL',
    fullDate: '26 July 2026',
    dayOfWeek: 'Sunday',
    monthIndex: 6,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Sacred Day of Remembrance · Coincides with Sunday Weekly Off',
    location: 'Kerala & Central PSUs',
    isWeekend: true,
  },
  {
    id: 8,
    name: 'Independence Day',
    hindiName: 'स्वतंत्रता दिवस',
    malayalamName: 'സ്വാതന്ത്ര്യദിനം',
    date: '15',
    month: 'AUG',
    fullDate: '15 August 2026',
    dayOfWeek: 'Saturday',
    monthIndex: 7,
    category: 'National' as const,
    badge: 'National Holiday',
    description: '80th National Independence Day · Ceremonial Flag Hoisting & Shipbuilder Meritorious Honours (3rd Sat)',
    location: 'National Closed Holiday',
    isWeekend: true,
  },
  {
    id: 9,
    name: 'Thiruvonam (Onam Day 1)',
    hindiName: 'तिरुवोणम (ओणम)',
    malayalamName: 'തിരുവോണം',
    date: '27',
    month: 'AUG',
    fullDate: '27 August 2026',
    dayOfWeek: 'Thursday',
    monthIndex: 7,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Harvest Festival of Kerala · Grand Shipyard Floral Onapookkalam & Cultural Celebrations',
    location: 'Kochi & Malabar Yards',
    isWeekend: false,
  },
  {
    id: 10,
    name: 'Sree Narayana Guru Jayanthi',
    hindiName: 'श्री नारायण गुरु जयंती',
    malayalamName: 'ശ്രീ നാരായണ ഗുരു ജയന്തി',
    date: '04',
    month: 'SEP',
    fullDate: '04 September 2026',
    dayOfWeek: 'Friday',
    monthIndex: 8,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Commemoration of Philosopher & Social Reformer Sree Narayana Guru · CSL Closed Holiday',
    location: 'Kerala State / CSL Closed',
    isWeekend: false,
  },
  {
    id: 11,
    name: 'Gandhi Jayanthi',
    hindiName: 'गांधी जयंती',
    malayalamName: 'ഗാന്ധി ജയന്തി',
    date: '02',
    month: 'OCT',
    fullDate: '02 October 2026',
    dayOfWeek: 'Friday',
    monthIndex: 9,
    category: 'National' as const,
    badge: 'National Holiday',
    description: '157th Birth Anniversary of Mahatma Gandhi · Shipyard Closed · Swachhata Hi Seva & Tributes at Admin Complex',
    location: 'National Closed Holiday',
    isWeekend: false,
  },
  {
    id: 12,
    name: 'Vijayadasami (Mahanavami / Dussehra)',
    hindiName: 'विजयादशमी / महानवमी',
    malayalamName: 'വിജയദശമി',
    date: '21',
    month: 'OCT',
    fullDate: '21 October 2026',
    dayOfWeek: 'Wednesday',
    monthIndex: 9,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted',
    description: 'Official CSL Gazetted Closed Holiday across all workshops, docks, and offices',
    location: 'All Workshops & Outfitting Yards',
    isWeekend: false,
  },
  {
    id: 13,
    name: 'Christmas',
    hindiName: 'क्रिसमस',
    malayalamName: 'ക്രിസ്മസ്',
    date: '25',
    month: 'DEC',
    fullDate: '25 December 2026',
    dayOfWeek: 'Friday',
    monthIndex: 11,
    category: 'CSL Gazetted' as const,
    badge: 'CSL Gazetted Holiday',
    description: 'Feast of the Nativity of Jesus Christ · Official CSL Gazetted Closed Holiday across all shipyard workshops, building docks, ISRF & corporate offices',
    location: 'All CSL Shipyards, Docks & Offshore Units',
    isWeekend: false,
  },
];

// CSL Employee Service Leave Entitlements & Policy Schedule
export const cslLeaveEntitlements = [
  {
    id: 'cl',
    code: 'CL',
    name: 'Casual Leave',
    malayalamName: 'കാഷ്വൽ ലീവ്',
    daysPerYear: '12 Days / Year',
    credited: 'Credited 1.0 Day per calendar month (Total 12 Days/Year)',
    maxAccumulation: 'Non-cumulative (Lapses on 31st December)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'ആകസ്മിക ആവശ്യങ്ങൾക്കും പെട്ടെന്നുള്ള അത്യാഹിതങ്ങൾക്കുമായി അനുവദിക്കുന്ന ലീവ്. ശമ്പളം കുറയ്ക്കില്ല.',
    rules: [
      'Allowed for sudden or urgent personal matters without loss of pay or allowances.',
      'Can be taken up to a maximum of 3 days continuously at a stretch.',
      'Cannot be combined with Earned Leave (EL) or Medical Leave.',
      'Prior intimation or same-day notification to Department Head / Section Supervisor required.'
    ],
  },
  {
    id: 'el',
    code: 'EL / PL',
    name: 'Earned Leave / Privilege Leave',
    malayalamName: 'ഏൺഡ് ലീവ് (പ്രിവിലേജ് ലീവ്)',
    daysPerYear: '30 Days / Year',
    credited: 'Advance credit: 15 days on Jan 1st & 15 days on Jul 1st',
    maxAccumulation: 'Up to 300 Days (Encashable on retirement/LTC)',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'സേവനകാലയളവിൽ ആർജ്ജിച്ച ലീവ്. 300 ദിവസം വരെ സ്വരൂപിക്കാം, അവധിക്കാലത്തോ വിരമിക്കുമ്പോഴോ പണമാക്കി മാറ്റാം.',
    rules: [
      'Credited in advance in two equal instalments of 15 days on 1st January and 1st July.',
      'Accumulation permitted up to an aggregate ceiling of 300 days as per DPE / CSL service regulations.',
      'Can be encashed during Leave Travel Concession (LTC) and upon superannuation.',
      'Application should ordinarily be submitted at least 7 days before commencement.'
    ],
  },
  {
    id: 'ml',
    code: 'ML',
    name: 'Medical Leave (Debited from EL)',
    malayalamName: 'മെഡിക്കൽ ലീവ് (EL ക്വാട്ടയിൽ നിന്ന് കുറയും)',
    daysPerYear: 'Deducted from EL Quota',
    credited: 'Debited against Earned Leave (EL / PL) balance upon submitting Doctor Certificate',
    maxAccumulation: 'Subject to available EL balance',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'അസുഖം മൂലമോ ചികിത്സയ്ക്കായോ എടുക്കുന്ന മെഡിക്കൽ അവധി. ഇത് Earned Leave (EL) ക്വാട്ടയിൽ നിന്നാണ് കുറയുന്നത്.',
    rules: [
      'Taken on medical grounds supported by doctor certificate / CSL hospital report.',
      'Deduction principle: Directly debited from employee Earned Leave (EL) quota.',
      'Medical certificate must be countersigned and submitted upon resuming duty.'
    ],
  },
  {
    id: 'hpl',
    code: 'HPL',
    name: 'Half Pay Leave (HPL)',
    malayalamName: 'ഹാഫ് പേ ലീവ് (HPL)',
    daysPerYear: '20 Days / Year',
    credited: 'Advance credit: 10 days on Jan 1st & 10 days on Jul 1st',
    maxAccumulation: 'No ceiling on accumulation',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'അർദ്ധവേതന അവധി (Half Pay Leave). പ്രതിവർഷം 20 ദിവസത്തെ അർദ്ധവേതന അവധി അനുവദിക്കപ്പെടുന്നു.',
    rules: [
      '20 days Half Pay Leave credited per year of completed service.',
      'Accumulation without limit throughout service.',
      'Can be availed as Half Pay Leave as per CSL service regulations.'
    ],
  },
  {
    id: 'rh',
    code: 'RH',
    name: 'Restricted Holiday',
    malayalamName: 'റെസ്ട്രിക്റ്റഡ് ലീവ് (നിയന്ത്രിത അവധി)',
    daysPerYear: '2 Days / Year',
    credited: 'Chosen from 7 approved CSL festival dates',
    maxAccumulation: 'Must be availed within the current year',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'സി.എസ്.എൽ അംഗീകരിച്ച ഉത്സവങ്ങളിൽ നിന്ന് ജീവനക്കാരന് സ്വന്തം ഇഷ്ടപ്രകാരം തിരഞ്ഞെടുക്കാവുന്ന 2 പ്രത്യേക അവധികൾ.',
    rules: [
      'Employees are entitled to choose any 2 days from the official CSL Restricted Holiday list.',
      'Subject to shift operational requirements and supervisor confirmation.',
      'Cannot be carried forward to subsequent calendar years.'
    ],
  },
  {
    id: 'coff',
    code: 'C-OFF',
    name: 'Compensatory Off',
    malayalamName: 'കോമ്പൻസേറ്ററി ഓഫ്',
    daysPerYear: 'As Earned',
    credited: 'Granted for performing urgent ship duty on Sunday or holiday',
    maxAccumulation: 'Must be availed within 30 days',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'ഞായറാഴ്ചകളിലോ അവധി ദിവസങ്ങളിലോ ഡ്രൈ ഡോക്ക് / ഷിപ്പ് അടിയന്തര ഡ്യൂട്ടി ചെയ്ത ജീവനക്കാർക്ക് നൽകുന്ന പകരമുള്ള ലീവ്.',
    rules: [
      'Granted when employee works on scheduled weekly off days or closed gazetted holidays.',
      'Must be availed within 30 calendar days from the date duty was performed.',
      'Requires Division Head attendance endorsement.'
    ],
  },
  {
    id: 'special',
    code: 'SCL',
    name: 'Special Casual Leave / Maternity / Paternity',
    malayalamName: 'പ്രത്യേക ലീവുകൾ (സ്പെഷ്യൽ / മെറ്റേണിറ്റി / പെറ്റേണിറ്റി)',
    daysPerYear: 'As per event',
    credited: 'Maternity: 180 Days · Paternity: 15 Days · Blood Donation: 1 Day',
    maxAccumulation: 'Specific to qualifying occasion',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'പ്രസവാവധി (180 ദിവസം), പിതൃത്വ അവധി (15 ദിവസം), രക്തദാനം, ഔദ്യോഗിക സ്പോർട്സ് പങ്കാളിത്തം എന്നിവയ്ക്കുള്ള ലീവ്.',
    rules: [
      'Maternity Leave: 180 days on full pay for female employees with less than two surviving children.',
      'Paternity Leave: 15 days on full pay for male employees during confinement of spouse.',
      'Voluntary blood donation in CSL medical camp: 1 day Special Casual Leave.'
    ],
  },
];

// CSL Restricted Holidays List 2026 (Employees may avail any 2)
export const cslRestrictedHolidays2026 = [
  { id: 'rh1', name: 'Maha Shivratri', mlName: 'മഹാശിവരാത്രി', date: '17 Feb 2026', day: 'Tuesday', occasion: 'Religious Observance · Night Vigil' },
  { id: 'rh2', name: 'Easter Sunday', mlName: 'ഈസ്റ്റർ', date: '05 Apr 2026', day: 'Sunday', occasion: 'Christian Feast of the Resurrection' },
  { id: 'rh3', name: 'Vishu Eve', mlName: 'വിഷു തലേന്ന്', date: '13 Apr 2026', day: 'Monday', occasion: 'Traditional Kerala New Year Eve' },
  { id: 'rh4', name: 'Muharram Eve', mlName: 'മുഹറം തലേന്ന്', date: '25 Jul 2026', day: 'Saturday', occasion: 'Islamic Day of Remembrance Eve' },
  { id: 'rh5', name: '4th Onam / Chathayam', mlName: 'നാലാം ഓണം / ചതയം', date: '29 Aug 2026', day: 'Saturday', occasion: 'Sree Narayana Guru Jayanthi / Onam Day 4' },
  { id: 'rh6', name: 'Deepavali', mlName: 'ദീപാവലി', date: '08 Nov 2026', day: 'Sunday', occasion: 'Festival of Lights' },
  { id: 'rh7', name: 'Christmas Eve', mlName: 'ക്രിസ്തുമസ് തലേന്ന്', date: '24 Dec 2026', day: 'Thursday', occasion: 'Christian Festival Eve' },
];

export type CslLeaveType = 'CL' | 'EL' | 'HPL' | 'SCL' | 'ML' | 'RH' | 'C-OFF';

export interface DayLeaveDetails {
  type: CslLeaveType;
  duration?: 'Full Day' | 'Half Day (FN)' | 'Half Day (AN)';
  reason?: string;
  appliedDate?: string;
  medicalCert?: boolean;
  specialOccasion?: string;
}

export const CSL_LEAVE_TYPES_MAP: Record<CslLeaveType, {
  code: CslLeaveType;
  nameEn: string;
  nameMl: string;
  badgeShort: string;
  quota: string;
  balanceDefault: number;
  maxAnnual: number;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  tileBg: string;
  tileBorder: string;
  tileText: string;
  badgeClass: string;
  descriptionEn: string;
  descriptionMl: string;
  ruleNotice: string;
}> = {
  CL: {
    code: 'CL',
    nameEn: 'Casual Leave',
    nameMl: 'കാഷ്വൽ ലീവ്',
    badgeShort: 'CL',
    quota: '12 Days / Year',
    balanceDefault: 8,
    maxAnnual: 12,
    colorBorder: 'border-amber-400',
    colorBg: 'bg-[#241706]',
    colorText: 'text-amber-300',
    tileBg: 'bg-amber-300 hover:bg-amber-400',
    tileBorder: 'border-amber-400',
    tileText: 'text-slate-950 font-black',
    badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-400',
    descriptionEn: 'For sudden or urgent personal matters without loss of pay or allowances.',
    descriptionMl: 'ആകസ്മിക ആവശ്യങ്ങൾക്കും പെട്ടെന്നുള്ള അത്യാഹിതങ്ങൾക്കുമായി അനുവദിക്കുന്ന ലീവ്.',
    ruleNotice: 'Deduction: 1.0 Day CL · Non-cumulative (Lapses 31st Dec) · Max 3 consecutive days.',
  },
  EL: {
    code: 'EL',
    nameEn: 'Earned Leave (Privilege Leave)',
    nameMl: 'ഏൺഡ് ലീവ് (പ്രിവിലേജ് ലീവ്)',
    badgeShort: 'EL',
    quota: '30 Days / Year',
    balanceDefault: 24,
    maxAnnual: 30,
    colorBorder: 'border-teal-400',
    colorBg: 'bg-[#052621]',
    colorText: 'text-teal-300',
    tileBg: 'bg-teal-300 hover:bg-teal-400',
    tileBorder: 'border-teal-400',
    tileText: 'text-slate-950 font-black',
    badgeClass: 'bg-teal-950/90 text-teal-300 border-teal-400',
    descriptionEn: 'Earned through service. Advance credit: 15 days Jan 1st & 15 days Jul 1st. Encashable on LTC / Retirement.',
    descriptionMl: 'സേവനകാലയളവിൽ ആർജ്ജിച്ച ലീവ്. 300 ദിവസം വരെ സ്വരൂപിക്കാം, വിരമിക്കുമ്പോഴോ എൽ.ടി.സിയിലോ പണമാക്കി മാറ്റാം.',
    ruleNotice: 'Deduction: 1.0 Day EL/PL · Accumulation up to 300 days · Encashable.',
  },
  HPL: {
    code: 'HPL',
    nameEn: 'Half Pay Leave (HPL)',
    nameMl: 'ഹാഫ് പേ ലീവ് (HPL)',
    badgeShort: 'HPL',
    quota: '20 Days / Year',
    balanceDefault: 16,
    maxAnnual: 20,
    colorBorder: 'border-indigo-400',
    colorBg: 'bg-[#151a38]',
    colorText: 'text-indigo-300',
    tileBg: 'bg-indigo-300 hover:bg-indigo-400',
    tileBorder: 'border-indigo-400',
    tileText: 'text-slate-950 font-black',
    badgeClass: 'bg-indigo-950/90 text-indigo-300 border-indigo-400',
    descriptionEn: 'Half Pay Leave credited to employee account (20 half-pay days credited per year).',
    descriptionMl: 'അർദ്ധവേതന അവധി (Half Pay Leave). പ്രതിവർഷം 20 ദിവസത്തെ അർദ്ധവേതന അവധി അനുവദിക്കപ്പെടുന്നു.',
    ruleNotice: 'Deduction: 1.0 Day HPL credited as Half Pay Leave.',
  },
  SCL: {
    code: 'SCL',
    nameEn: 'Special Leave (Special Casual Leave)',
    nameMl: 'സ്പെഷ്യൽ ലീവ് (പ്രത്യേക ലീവ്)',
    badgeShort: 'SCL',
    quota: 'Maternity: 180d · Paternity: 15d · Blood: 1d',
    balanceDefault: 15,
    maxAnnual: 180,
    colorBorder: 'border-purple-400',
    colorBg: 'bg-[#220d30]',
    colorText: 'text-purple-300',
    tileBg: 'bg-purple-300 hover:bg-purple-400',
    tileBorder: 'border-purple-400',
    tileText: 'text-slate-950 font-black',
    badgeClass: 'bg-purple-950/90 text-purple-300 border-purple-400',
    descriptionEn: 'Special occasion leave: Maternity, Paternity, voluntary blood donation, or authorized shipyard sports representation.',
    descriptionMl: 'പ്രസവാവധി (180 ദിവസം), പിതൃത്വ അവധി (15 ദിവസം), രക്തദാനം, സ്പോർട്സ് പ്രതിനിധ്യം എന്നിവയ്ക്കുള്ള ലീവ്.',
    ruleNotice: 'Special Sanctioned Leave · Granted as per specific qualifying occasion.',
  },
  ML: {
    code: 'ML',
    nameEn: 'Medical Leave (ML)',
    nameMl: 'മെഡിക്കൽ ലീവ് (ML)',
    badgeShort: 'ML',
    quota: 'Deducted from EL Quota',
    balanceDefault: 30,
    maxAnnual: 30,
    colorBorder: 'border-rose-400',
    colorBg: 'bg-[#250a14]',
    colorText: 'text-rose-300',
    tileBg: 'bg-rose-400 hover:bg-rose-500',
    tileBorder: 'border-rose-400',
    tileText: 'text-slate-950 font-black',
    badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-400',
    descriptionEn: 'Medical Leave taken for illness/treatment. As per rule, this leave is deducted directly from Earned Leave (EL) quota.',
    descriptionMl: 'രോഗാവസ്ഥയ്ക്കും ചികിത്സയ്ക്കുമായി എടുക്കുന്ന മെഡിക്കൽ അവധി. ഇത് EL (Earned Leave) ക്വാട്ടയിൽ നിന്നാണ് കുറയുന്നത്.',
    ruleNotice: 'Deduction: 1.0 Day debited directly from EL (Earned Leave) quota against Medical Certificate · മെഡിക്കൽ ലീവ് എടുക്കുമ്പോൾ EL ക്വാട്ടയിൽ നിന്നാണ് കുറയുന്നത്.',
  },
  RH: {
    code: 'RH',
    nameEn: 'Restricted Holiday',
    nameMl: 'റെസ്ട്രിക്റ്റഡ് ഹോളിഡേ (നിയന്ത്രിത അവധി)',
    badgeShort: 'RH',
    quota: '2 Days / Year',
    balanceDefault: 2,
    maxAnnual: 2,
    colorBorder: 'border-rose-400',
    colorBg: 'bg-[#250a12]',
    colorText: 'text-rose-300',
    tileBg: 'bg-rose-300 hover:bg-rose-400',
    tileBorder: 'border-rose-400',
    tileText: 'text-slate-950 font-black',
    badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-400',
    descriptionEn: 'Employees may choose any 2 festival dates from the 7 approved CSL Restricted Holidays.',
    descriptionMl: 'സി.എസ്.എൽ അംഗീകരിച്ച ഉത്സവങ്ങളിൽ നിന്ന് സ്വന്തം ഇഷ്ടപ്രകാരം തിരഞ്ഞെടുക്കാവുന്ന 2 പ്രത്യേക അവധികൾ.',
    ruleNotice: 'Chosen from 7 official CSL festival dates · Non-cumulative.',
  },
  'C-OFF': {
    code: 'C-OFF',
    nameEn: 'Compensatory Off',
    nameMl: 'കോമ്പൻസേറ്ററി ഓഫ്',
    badgeShort: 'C-OFF',
    quota: 'As Earned on Sundays / Closed Holidays',
    balanceDefault: 3,
    maxAnnual: 10,
    colorBorder: 'border-emerald-400',
    colorBg: 'bg-[#062420]',
    colorText: 'text-emerald-300',
    tileBg: 'bg-emerald-300 hover:bg-emerald-400',
    tileBorder: 'border-emerald-400',
    tileText: 'text-slate-950 font-black',
    badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-400',
    descriptionEn: 'Granted for performing urgent dry dock or emergency ship repair duty on Sunday or closed holiday.',
    descriptionMl: 'ഞായറാഴ്ചകളിലോ അവധി ദിവസങ്ങളിലോ ഡ്രൈ ഡോക്ക് / ഷിപ്പ് അടിയന്തര ഡ്യൂട്ടി ചെയ്ത ജീവനക്കാർക്ക് നൽകുന്ന ലീവ്.',
    ruleNotice: 'Earned duty compensatory off · Must be availed within 30 days.',
  },
};

export const CslCalendarView: React.FC<CslCalendarViewProps> = ({
  language,
  currentUser,
  onBackToQuickAccess,
  onEditProfile,
  onOpenAttendance,
  onOpenSalary,
}) => {
  const isMl = language === 'ml';
  const isContract = currentUser?.category === 'contract' || 
    (typeof window !== 'undefined' && localStorage.getItem('csl_employee_category') === 'contract');
  // Current month state (Automatically synced to current IST month - e.g. November 2026)
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    ensureMonthlyRolloverAndArchive();
    return getIstDate().getMonth();
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => getIstDate().getFullYear());
  const [activeTab, setActiveTab] = useState<'wall' | 'months' | 'holidays'>('wall');
  const [dayFilter, setDayFilter] = useState<'all' | 'duty' | 'leaves' | 'holidays'>('all');

  const presentStorageKey = `csl_calendar_present_days_${selectedYear}_${selectedMonth}`;
  const shiftsStorageKey = `csl_calendar_day_shifts_${selectedYear}_${selectedMonth}`;
  const leavesStorageKey = `csl_calendar_leave_records_${selectedYear}_${selectedMonth}`;
  const legacyLeavesStorageKey = `csl_calendar_leave_days_${selectedYear}_${selectedMonth}`;
  const monthLogsKey = getAttendanceLogsKey(selectedYear, selectedMonth);

  // Active CSL Shift for current user (A2, B2, C1, C2)
  // When active shift is A2 or B2, weekly rotation is enabled and scheduled shifts appear in advance on calendar days.
  // When active shift is C1 (General Shift), rotation is off and shift codes are not shown on calendar days.
  const [activeShift, setActiveShift] = useState<CslShiftCode>(() => {
    const today = getIstDate();
    if (today.getDay() === 0) return 'C1';
    return getSyncedActiveShiftForToday(today);
  });

  const isA2B2Shift = activeShift === 'A2' || activeShift === 'B2';

  useEffect(() => {
    const handleShiftSync = (e?: any) => {
      try {
        const explicitShift = typeof e?.detail === 'string' ? e.detail : e?.detail?.shift;
        if (explicitShift && (CSL_SHIFT_CODES as string[]).includes(explicitShift)) {
          setActiveShift(explicitShift as CslShiftCode);
          return;
        }
        setActiveShift(getSyncedActiveShiftForToday(getIstDate()));
      } catch {}
    };
    window.addEventListener('csl-shift-changed', handleShiftSync);
    window.addEventListener('csl-shift-rotation-changed', handleShiftSync);
    window.addEventListener('csl-calendar-shifts-updated', handleShiftSync);
    window.addEventListener('storage', handleShiftSync);
    return () => {
      window.removeEventListener('csl-shift-changed', handleShiftSync);
      window.removeEventListener('csl-shift-rotation-changed', handleShiftSync);
      window.removeEventListener('csl-calendar-shifts-updated', handleShiftSync);
      window.removeEventListener('storage', handleShiftSync);
    };
  }, []);

  const handleSwitchActiveShift = (shift: CslShiftCode) => {
    setActiveShift(shift);
    const targetDate = selectedDate
      ? new Date(selectedYear, selectedMonth, selectedDate)
      : getIstDate();
    syncShiftFromCalendarEverywhere(shift, targetDate, true);
    setDayShifts(loadMonthDayShifts(selectedYear, selectedMonth));
    setSyncTick(t => t + 1);
  };

  // Dark maritime shipyard glassmorphic theme matching Previous Page
  const isWhiteWall = false;
  
  // Live system date ticker in IST (updates every 30s so midnight month/day transition occurs automatically)
  const [currentSystemDate, setCurrentSystemDate] = useState(() => getIstDate());
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIst = getIstDate();
      setCurrentSystemDate((prev) => {
        if (prev.getMonth() !== nextIst.getMonth() || prev.getDate() !== nextIst.getDate()) {
          ensureMonthlyRolloverAndArchive();
          setSelectedMonth(nextIst.getMonth());
          setSelectedYear(nextIst.getFullYear());
          setSelectedDate(nextIst.getDate());
        }
        return nextIst;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Default selected date dynamically to today's IST date (e.g. 1 for Nov 1)
  const [selectedDate, setSelectedDate] = useState<number | null>(() => {
    return getIstDate().getDate();
  });
  const [showMusterSlip, setShowMusterSlip] = useState(false);
  const [showInAppPdfViewer, setShowInAppPdfViewer] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloadSuccess, setPdfDownloadSuccess] = useState(false);
  const [preparedPdf, setPreparedPdf] = useState<{ downloadUrl: string; viewUrl: string; fileName: string } | null>(null);

  // Next Month OT Modal & Download states
  const [showNextMonthOtModal, setShowNextMonthOtModal] = useState(false);
  const [showInAppOtPdfViewer, setShowInAppOtPdfViewer] = useState(false);
  const [isDownloadingOtPdf, setIsDownloadingOtPdf] = useState(false);
  const [otDownloadSuccess, setOtDownloadSuccess] = useState(false);
  const [holidayCategoryFilter, setHolidayCategoryFilter] = useState<'all' | 'national' | 'gazetted' | 'csl_leaves' | 'rh'>('all');
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');

  // Half Day WhatsApp Modal state
  const [isHalfDayCalendarModalOpen, setHalfDayCalendarModalOpen] = useState(false);

  const loadMonthPresentDays = (year: number, month: number): number[] => {
    try {
      const today = getIstDate();
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
      const todayDay = today.getDate();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      const hasPunchedToday =
        localStorage.getItem('csl_actual_punched_today') === 'true' &&
        localStorage.getItem('csl_today_punched_date') === todayKey;

      const key = `csl_calendar_present_days_${year}_${month}`;
      const saved = localStorage.getItem(key);
      let list: number[] = saved ? JSON.parse(saved) : [];

      if (month === 9 && year === 2026) {
        list = list.filter((d) => d !== 21 && d !== 2);
      }

      try {
        const leaveSaved = localStorage.getItem(`csl_calendar_leave_records_${year}_${month}`);
        if (leaveSaved) {
          const lRecords = JSON.parse(leaveSaved);
          Object.keys(lRecords).forEach((d) => {
            const num = Number(d);
            list = list.filter((p) => p !== num);
          });
        }
        if (month === 9 && year === 2026 && localStorage.getItem('csl_oct_20_ml_entered') === 'true') {
          list = list.filter((p) => p !== 20);
        }
      } catch {}

      if (isCurrentMonth) {
        if (!hasPunchedToday) {
          list = list.filter((d) => d !== todayDay);
        } else {
          if (!list.includes(todayDay)) list.push(todayDay);
        }
      }

      list.sort((a, b) => a - b);
      if (saved) {
        localStorage.setItem(key, JSON.stringify(list));
      }
      return list;
    } catch {
      return [];
    }
  };

  const loadMonthDayShifts = (year: number, month: number): Record<number, CslShiftCode> => {
    try {
      const saved = localStorage.getItem(`csl_calendar_day_shifts_${year}_${month}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  };

  const loadMonthLeaveRecords = (year: number, month: number): Record<number, DayLeaveDetails> => {
    try {
      const key = `csl_calendar_leave_records_${year}_${month}`;
      const saved = localStorage.getItem(key);
      let records: Record<number, DayLeaveDetails> = saved ? JSON.parse(saved) : {};

      if (!saved) {
        const legacySaved = localStorage.getItem(`csl_calendar_leave_days_${year}_${month}`);
        if (legacySaved) {
          const days: number[] = JSON.parse(legacySaved);
          days.forEach((d) => {
            records[d] = {
              type: 'CL',
              duration: 'Full Day',
              reason: 'Casual Leave (ആകസ്മിക അവധി)',
              appliedDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            };
          });
        }
      }

      if (
        month === 9 &&
        year === 2026 &&
        !records[20] &&
        (records[19]?.type === 'ML' || localStorage.getItem('csl_oct_20_ml_entered') === 'true')
      ) {
        records[20] = {
          type: 'ML',
          duration: 'Full Day',
          reason: 'Medical Leave with Doctor Certificate (മെഡിക്കൽ അവധി)',
          appliedDate: '2026-10-20',
          medicalCert: true,
        };
        try {
          localStorage.setItem(key, JSON.stringify(records));
          localStorage.setItem('csl_oct_20_ml_entered', 'true');
        } catch {}
      }

      return records;
    } catch {}
    return {};
  };

  // Attendance state for selected month (persisted in localStorage per month and synced with Biometric Punch)
  const [presentDays, setPresentDays] = useState<number[]>(() =>
    loadMonthPresentDays(selectedYear, selectedMonth)
  );

  // Track CSL Shift assigned to each day (A2, B2, C2, C1) per month
  const [dayShifts, setDayShifts] = useState<Record<number, CslShiftCode>>(() =>
    loadMonthDayShifts(selectedYear, selectedMonth)
  );

  // Detailed leave records per day: day -> DayLeaveDetails (CL, EL, HPL, SCL, ML) per month
  const [leaveRecords, setLeaveRecords] = useState<Record<number, DayLeaveDetails>>(() =>
    loadMonthLeaveRecords(selectedYear, selectedMonth)
  );

  // Reload month-specific attendance, shifts, and leaves whenever selectedMonth or selectedYear changes
  useEffect(() => {
    setPresentDays(loadMonthPresentDays(selectedYear, selectedMonth));
    setDayShifts(loadMonthDayShifts(selectedYear, selectedMonth));
    setLeaveRecords(loadMonthLeaveRecords(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  // Real-time synchronization when user punches in/out from QuickAccess or Attendance view
  const [, setSyncTick] = useState(0);
  useEffect(() => {
    const handleSync = () => {
      try {
        setPresentDays(loadMonthPresentDays(selectedYear, selectedMonth));
        setDayShifts(loadMonthDayShifts(selectedYear, selectedMonth));
        setSyncTick((t) => t + 1);
      } catch (e) {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('csl-attendance-updated', handleSync);
    window.addEventListener('csl-shift-changed', handleSync);
    window.addEventListener('csl-shift-rotation-changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('csl-attendance-updated', handleSync);
      window.removeEventListener('csl-shift-changed', handleSync);
      window.removeEventListener('csl-shift-rotation-changed', handleSync);
    };
  }, [selectedYear, selectedMonth]);

  const handleSetDayShift = (day: number, shift: CslShiftCode) => {
    const targetDate = new Date(selectedYear, selectedMonth, day);
    const effectiveShift: CslShiftCode = targetDate.getDay() === 0 ? 'C1' : shift;
    setActiveShift(effectiveShift);
    syncShiftFromCalendarEverywhere(effectiveShift, targetDate, true);
    setDayShifts(loadMonthDayShifts(selectedYear, selectedMonth));
    setSyncTick((t) => t + 1);
  };

  const leaveDays = Object.keys(leaveRecords).map(Number).sort((a, b) => a - b);

  // Leave Form Input States for adding/editing leave on selected day
  const [formLeaveType, setFormLeaveType] = useState<CslLeaveType>('CL');
  const [formLeaveDuration, setFormLeaveDuration] = useState<'Full Day' | 'Half Day (FN)' | 'Half Day (AN)'>('Full Day');
  const [formLeaveReason, setFormLeaveReason] = useState<string>('');
  const [formMedicalCert, setFormMedicalCert] = useState<boolean>(false);
  const [formSpecialOccasion, setFormSpecialOccasion] = useState<string>('Blood Donation / Special Camp');
  const [showLeaveForm, setShowLeaveForm] = useState<boolean>(false);

  // Leave Balances state synchronized with CSL Leave ledger
  const [leaveBalances, setLeaveBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('csl_leave_balances_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      cl: 12,
      clTotal: 12,
      el: 30,
      elTotal: 30,
      hpl: 20,
      hplTotal: 20,
      specialLeave: 15,
      specialLeaveTotal: 15,
      mlTaken: 0,
      rh: 2,
      rhTotal: 2,
    };
  });

  useEffect(() => {
    const syncBalances = (e?: any) => {
      try {
        if (e?.detail) {
          setLeaveBalances(e.detail);
          return;
        }
        const saved = localStorage.getItem('csl_leave_balances_v2');
        if (saved) setLeaveBalances(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('csl-leave-balances-updated', syncBalances);
    window.addEventListener('storage', syncBalances);
    return () => {
      window.removeEventListener('csl-leave-balances-updated', syncBalances);
      window.removeEventListener('storage', syncBalances);
    };
  }, []);

  // Real-time synchronization when leave is updated externally
  useEffect(() => {
    const handleLeaveSync = (e?: any) => {
      try {
        if (e?.detail?.records) {
          setLeaveRecords(e.detail.records);
          return;
        }
        const saved = localStorage.getItem(leavesStorageKey);
        if (saved) {
          setLeaveRecords(JSON.parse(saved));
        }
      } catch (err) {}
    };
    window.addEventListener('csl-calendar-leaves-updated', handleLeaveSync);
    window.addEventListener('storage', handleLeaveSync);
    return () => {
      window.removeEventListener('csl-calendar-leaves-updated', handleLeaveSync);
      window.removeEventListener('storage', handleLeaveSync);
    };
  }, [leavesStorageKey]);

  // Leave count metrics
  const clDaysCount = Object.values(leaveRecords).filter((r) => r.type === 'CL').length;
  const elDaysCount = Object.values(leaveRecords).filter((r) => r.type === 'EL').length;
  const mlDaysCount = Object.values(leaveRecords).filter((r) => r.type === 'ML').length;
  const hplDaysCount = Object.values(leaveRecords).filter((r) => r.type === 'HPL').length;
  const sclDaysCount = Object.values(leaveRecords).filter((r) => r.type === 'SCL').length;
  const totalLeavesCount = leaveDays.length;

  // Monthly Leave Hours Calculation (CSL Standard Duty: 8.0 hrs/day; Full Day = 8h, Half Day = 4h)
  const getCategoryMonthlyStats = (catType: CslLeaveType) => {
    let takenDays = 0;
    let takenHours = 0;
    Object.values(leaveRecords).forEach((rec) => {
      if (rec.type === catType) {
        const isHalf = rec.duration?.includes('Half');
        takenDays += isHalf ? 0.5 : 1.0;
        takenHours += isHalf ? 4.0 : 8.0;
      }
    });
    return { takenDays, takenHours };
  };

  const clStats = getCategoryMonthlyStats('CL');
  const elStats = getCategoryMonthlyStats('EL');
  const hplStats = getCategoryMonthlyStats('HPL');
  const sclStats = getCategoryMonthlyStats('SCL');

  // Balances in hours (1 Day = 8.0 Hours)
  const clBalDays = leaveBalances.cl ?? Math.max(0, 12 - clStats.takenDays);
  const clBalHours = clBalDays * 8.0;
  const clQuotaDays = leaveBalances.clTotal ?? 12;
  const clQuotaHours = clQuotaDays * 8.0;

  const elBalDays = leaveBalances.el ?? Math.max(0, 30 - elStats.takenDays);
  const elBalHours = elBalDays * 8.0;
  const elQuotaDays = leaveBalances.elTotal ?? 30;
  const elQuotaHours = elQuotaDays * 8.0;

  const hplBalDays = leaveBalances.hpl ?? Math.max(0, 20 - hplStats.takenDays);
  const hplBalHours = hplBalDays * 8.0;
  const hplQuotaDays = leaveBalances.hplTotal ?? 20;
  const hplQuotaHours = hplQuotaDays * 8.0;

  const sclBalDays = leaveBalances.specialLeave ?? Math.max(0, 15 - sclStats.takenDays);
  const sclBalHours = sclBalDays * 8.0;
  const sclQuotaDays = leaveBalances.specialLeaveTotal ?? 15;
  const sclQuotaHours = sclQuotaDays * 8.0;

  const totalMonthlyTakenHours = clStats.takenHours + elStats.takenHours + hplStats.takenHours + sclStats.takenHours;
  const totalMonthlyTakenDays = clStats.takenDays + elStats.takenDays + hplStats.takenDays + sclStats.takenDays;
  const totalBalDays = clBalDays + elBalDays + hplBalDays + sclBalDays;
  const totalBalHours = clBalHours + elBalHours + hplBalHours + sclBalHours;
  const totalQuotaDays = clQuotaDays + elQuotaDays + hplQuotaDays + sclQuotaDays;
  const totalQuotaHours = clQuotaHours + elQuotaHours + hplQuotaHours + sclQuotaHours;

  const [isSummaryTableCollapsed, setIsSummaryTableCollapsed] = useState<boolean>(false);

  // Sync leaveRecords helper & live deduction from balances (ML deducts from EL!)
  const saveLeaveRecords = (newRecords: Record<number, DayLeaveDetails>) => {
    setLeaveRecords(newRecords);
    const days = Object.keys(newRecords).map(Number).sort((a, b) => a - b);
    try {
      localStorage.setItem(leavesStorageKey, JSON.stringify(newRecords));
      localStorage.setItem(legacyLeavesStorageKey, JSON.stringify(days));
      if (selectedMonth === 9 && selectedYear === 2026) {
        if (newRecords[20]?.type === 'ML') {
          localStorage.setItem('csl_oct_20_ml_entered', 'true');
        } else if (!newRecords[20]) {
          localStorage.removeItem('csl_oct_20_ml_entered');
        }
      }
      window.dispatchEvent(new CustomEvent('csl-calendar-leaves-updated', { detail: { records: newRecords, days } }));

      // Live deduction from balances: ML is deducted directly from EL (Earned Leave)
      const currentBalancesRaw = localStorage.getItem('csl_leave_balances_v2');
      if (currentBalancesRaw) {
        const curBalances = JSON.parse(currentBalancesRaw);
        // Support 0.5 half-day leaves for CL, EL, ML, HPL, SCL
        const clCount = Object.values(newRecords).reduce((acc, r) => {
          if (r.type === 'CL') {
            return acc + (r.duration && r.duration.startsWith('Half Day') ? 0.5 : 1);
          }
          return acc;
        }, 0);
        const elCount = Object.values(newRecords).reduce((acc, r) => {
          if (r.type === 'EL') {
            return acc + (r.duration && r.duration.startsWith('Half Day') ? 0.5 : 1);
          }
          return acc;
        }, 0);
        const mlCount = Object.values(newRecords).reduce((acc, r) => {
          if (r.type === 'ML') {
            return acc + (r.duration && r.duration.startsWith('Half Day') ? 0.5 : 1);
          }
          return acc;
        }, 0);
        const hplCount = Object.values(newRecords).reduce((acc, r) => {
          if (r.type === 'HPL') {
            return acc + (r.duration && r.duration.startsWith('Half Day') ? 0.5 : 1);
          }
          return acc;
        }, 0);
        const sclCount = Object.values(newRecords).reduce((acc, r) => {
          if (r.type === 'SCL') {
            return acc + (r.duration && r.duration.startsWith('Half Day') ? 0.5 : 1);
          }
          return acc;
        }, 0);

        const p1Total = curBalances.clPhase1Total !== undefined ? curBalances.clPhase1Total : (curBalances.clPhase1 !== undefined ? curBalances.clPhase1 : 6);
        const p2Total = curBalances.clPhase2Total !== undefined ? curBalances.clPhase2Total : (curBalances.clPhase2 !== undefined ? curBalances.clPhase2 : 6);
        const clTotal = curBalances.clTotal !== undefined ? curBalances.clTotal : (p1Total + p2Total);
        const elTotal = curBalances.elTotal ?? 30;
        const hplTotal = curBalances.hplTotal ?? 20;
        const sclTotal = curBalances.specialLeaveTotal ?? 15;

        // Phase 1 decreases first from p1Total down to 0; Phase 2 decreases after Phase 1 is exhausted
        const p1Remaining = Math.max(0, Math.round((p1Total - clCount) * 10) / 10);
        const p2Taken = Math.max(0, Math.round((clCount - p1Total) * 10) / 10);
        const p2Remaining = Math.max(0, Math.round((p2Total - p2Taken) * 10) / 10);

        // Medical Leave (ML) deducts directly from Earned Leave (EL) quota as requested!
        const nextBalances = {
          ...curBalances,
          cl: Math.max(0, Math.round((clTotal - clCount) * 10) / 10),
          clTotal: clTotal,
          clPhase1: p1Remaining,
          clPhase1Total: p1Total,
          clPhase2: p2Remaining,
          clPhase2Total: p2Total,
          el: Math.max(0, Math.round((elTotal - (elCount + mlCount)) * 10) / 10), // EL reduced by both EL and ML!
          hpl: Math.max(0, Math.round((hplTotal - hplCount) * 10) / 10),
          specialLeave: Math.max(0, Math.round((sclTotal - sclCount) * 10) / 10),
          mlTaken: mlCount,
        };
        localStorage.setItem('csl_leave_balances_v2', JSON.stringify(nextBalances));
        window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: nextBalances }));
      }
    } catch (e) {}
  };

  const [dayNotes, setDayNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('csl_calendar_day_notes_2026');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [editingNote, setEditingNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Dedicated Day Work Details state (Synchronized with Attendance View & Biometric Logs)
  const [dayWorks, setDayWorks] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('csl_calendar_day_works_2026');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });
  const [editingWork, setEditingWork] = useState('');
  const [showWorkInput, setShowWorkInput] = useState(false);

  // Sync dayWorks in real time across components & localStorage
  useEffect(() => {
    const handleWorksSync = (e?: any) => {
      try {
        const saved = localStorage.getItem('csl_calendar_day_works_2026');
        if (saved) setDayWorks(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('csl-calendar-works-updated', handleWorksSync);
    window.addEventListener('csl-attendance-updated', handleWorksSync);
    window.addEventListener('storage', handleWorksSync);
    return () => {
      window.removeEventListener('csl-calendar-works-updated', handleWorksSync);
      window.removeEventListener('csl-attendance-updated', handleWorksSync);
      window.removeEventListener('storage', handleWorksSync);
    };
  }, []);

  const currentMonthConfig = cslMonthsConfig[selectedMonth] || cslMonthsConfig[9];

  // Dynamic day status functions across all months (Oct 2026, Nov 2026, etc.)
  const isPresentDay = (day: number) => {
    // Official CSL Gazetted Holidays (e.g. 21 Oct Vijayadasami, 2 Oct Gandhi Jayanthi, 25 Dec Christmas) are never working present days
    if (selectedMonth === 9 && selectedYear === 2026 && (day === 21 || day === 2)) {
      return false;
    }
    if (selectedMonth === 11 && selectedYear === 2026 && day === 25) {
      return false;
    }
    if (cslOfficial12Holidays2026.some((h) => h.monthIndex === selectedMonth && parseInt(h.date, 10) === day)) {
      return false;
    }
    if (leaveRecords[day]) return false;
    return presentDays.includes(day);
  };

  const isLeaveDay = (day: number) => {
    return !!leaveRecords[day];
  };

  const getDayLeave = (day: number): DayLeaveDetails | null => {
    return leaveRecords[day] || null;
  };

  const handleApplyLeave = (
    day: number,
    type: CslLeaveType = formLeaveType,
    duration: 'Full Day' | 'Half Day (FN)' | 'Half Day (AN)' = formLeaveDuration,
    reason: string = formLeaveReason,
    medicalCert: boolean = formMedicalCert,
    specialOccasion: string = formSpecialOccasion
  ) => {
    const defaultReason = reason.trim() || (
      type === 'CL' ? 'Casual Leave (ആകസ്മിക അവധി)' :
      type === 'EL' ? 'Earned Leave (പ്രിവിലേജ് അവധി)' :
      type === 'ML' ? (isContract ? 'Medical Leave with Doctor Certificate (മെഡിക്കൽ അവധി)' : 'Medical Leave with Doctor Certificate (മെഡിക്കൽ അവധി - EL-ൽ നിന്ന് കുറയ്ക്കുന്നു)') :
      type === 'HPL' ? 'Half Pay Leave (ഹാഫ് പേ ലീവ്)' :
      type === 'SCL' ? `Special Leave - ${specialOccasion}` :
      'Sanctioned Leave'
    );

    const record: DayLeaveDetails = {
      type,
      duration,
      reason: defaultReason,
      appliedDate: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      medicalCert: type === 'ML',
      specialOccasion: type === 'SCL' ? specialOccasion : undefined,
    };

    const nextRecords = { ...leaveRecords, [day]: record };
    saveLeaveRecords(nextRecords);

    // If day was marked present, remove present status
    setPresentDays((prev) => {
      const next = prev.filter((d) => d !== day);
      try {
        localStorage.setItem(presentStorageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setShowLeaveForm(false);
    setFormLeaveReason('');
  };

  const handleQuickAddLeave = (day: number, type: CslLeaveType) => {
    handleApplyLeave(day, type, 'Full Day', '', false, 'Sanctioned Special Occasion');
  };

  const handleRemoveLeave = (day: number) => {
    const nextRecords = { ...leaveRecords };
    delete nextRecords[day];
    saveLeaveRecords(nextRecords);
  };

  const isSunday = (day: number) => {
    const d = new Date(selectedYear, selectedMonth, day);
    return d.getDay() === 0;
  };

  const isSaturdayOff = (day: number) => {
    const d = new Date(selectedYear, selectedMonth, day);
    if (d.getDay() !== 6) return false;
    // 2nd Saturday (day 8-14) or 4th Saturday (day 22-28)
    return (day >= 8 && day <= 14) || (day >= 22 && day <= 28);
  };

  const isCslHoliday = (day: number) => {
    if (selectedMonth === 9 && selectedYear === 2026) {
      return [2, 21].includes(day);
    }
    return cslOfficial12Holidays2026.some(
      (h) => h.monthIndex === selectedMonth && parseInt(h.date, 10) === day
    );
  };

  const isOffDay = (day: number) => isSunday(day) || isSaturdayOff(day) || isCslHoliday(day);

  const togglePresent = (day: number) => {
    setPresentDays((prev) => {
      const today = getIstDate();
      const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;
      const todayDay = today.getDate();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

      let next: number[];
      const willBePresent = !prev.includes(day);
      if (!willBePresent) {
        next = prev.filter((d) => d !== day);
        if (isCurrentMonth && day === todayDay) {
          try {
            localStorage.removeItem('csl_today_punched_date');
            localStorage.removeItem('csl_actual_punched_today');
            localStorage.removeItem('csl_today_punch_in_time');
            localStorage.removeItem('csl_today_punch_out_time');
            localStorage.setItem('csl_punch_state', 'out');
          } catch (e) {}
        }
      } else {
        next = [...prev, day].sort((a, b) => a - b);
        if (isCurrentMonth && day === todayDay) {
          try {
            localStorage.setItem('csl_today_punched_date', todayKey);
            localStorage.setItem('csl_actual_punched_today', 'true');
            localStorage.setItem('csl_punch_state', 'in');
            const nowTime = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date());
            localStorage.setItem('csl_last_punch_time', nowTime);
            localStorage.setItem('csl_today_punch_in_time', nowTime);
          } catch (e) {}
        }
        // Remove leave on this day if any
        if (leaveRecords[day]) {
          const nextRecords = { ...leaveRecords };
          delete nextRecords[day];
          saveLeaveRecords(nextRecords);
        }
      }

      // Sync with month-specific attendance logs and csl_attendance_daily_logs_v2
      try {
        const isSun = isSunday(day);
        const holInfo = isCslHolidayDate(new Date(selectedYear, selectedMonth, day), selectedMonth);
        const isHolidayDay = isSun || holInfo.isHoliday;
        const currentShift: CslShiftCode = getEffectiveShiftForDate(
          new Date(selectedYear, selectedMonth, day),
          dayShifts[day]
        );
        const def = CSL_SHIFTS[currentShift] || CSL_SHIFTS['A2'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[new Date(selectedYear, selectedMonth, day).getDay()];
        const monthShort = MONTH_SHORT_NAMES[selectedMonth] || 'Nov';

        const savedLogs = localStorage.getItem(monthLogsKey) || (isCurrentMonth ? localStorage.getItem('csl_attendance_daily_logs_v2') : null);
        let logs: any[] = savedLogs ? JSON.parse(savedLogs) : [];
        const existingIdx = logs.findIndex((r: any) => r.dayNum === day);

        if (willBePresent) {
          const shiftDisplay = isSun 
            ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` 
            : (isHolidayDay ? `${currentShift} · ഹോളിഡേ ഡ്യൂട്ടി` : `${currentShift} (${def.inTime.replace(' ', '')} - ${def.outTime.replace(' ', '')})`);
          const noteText = isHolidayDay 
            ? (isSun ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)' : `${holInfo.holidayNameMl || 'ഹോളിഡേ'} ഡ്യൂട്ടി · മുഴുവൻ സമയവും സ്പെഷ്യൽ OT`)
            : (isMl ? 'ഡ്യൂട്ടി ഹാജർ രേഖപ്പെടുത്തി' : 'Duty Attended & Verified');

          if (existingIdx >= 0) {
            logs[existingIdx] = {
              ...logs[existingIdx],
              dateStr: `${day} ${monthShort} ${selectedYear}`,
              month: selectedMonth,
              status: isHolidayDay ? 'Holiday Duty' : 'Present',
              shift: shiftDisplay,
              shiftCode: currentShift,
              inTime: logs[existingIdx].inTime && logs[existingIdx].inTime !== '—' ? logs[existingIdx].inTime : def.inTime,
              outTime: logs[existingIdx].outTime && logs[existingIdx].outTime !== '—' ? logs[existingIdx].outTime : def.outTime,
              workHours: '8h 20m',
              otHours: isHolidayDay ? 8 : (logs[existingIdx].otHours || 0),
              notes: logs[existingIdx].notes || noteText,
            };
          } else {
            logs.push({
              id: `d-${selectedMonth}-${day}`,
              dateStr: `${day} ${monthShort} ${selectedYear}`,
              month: selectedMonth,
              dayName,
              dayNum: day,
              shift: shiftDisplay,
              shiftCode: currentShift,
              inTime: def.inTime,
              outTime: def.outTime,
              workHours: '8h 20m',
              otHours: isHolidayDay ? 8 : 0,
              terminal: 'Gate 4 Turnstile #02',
              status: isHolidayDay ? 'Holiday Duty' : 'Present',
              notes: noteText,
            });
          }
        } else {
          if (existingIdx >= 0) {
            logs = logs.filter((r: any) => r.dayNum !== day);
          }
        }
        logs.sort((a, b) => b.dayNum - a.dayNum);
        localStorage.setItem(monthLogsKey, JSON.stringify(logs));
        if (isCurrentMonth) {
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(logs));
        }
      } catch (e) {}

      try {
        localStorage.setItem(presentStorageKey, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('csl-attendance-updated', { detail: { day, month: selectedMonth, present: willBePresent } }));
      } catch (e) {}
      return next;
    });
  };

  // Dedicated Duty Punch Modal state from Calendar
  const [calendarDutyModalOpen, setCalendarDutyModalOpen] = useState(false);
  const [calendarPunchDateStr, setCalendarPunchDateStr] = useState<string>('');
  const [calendarPunchShift, setCalendarPunchShift] = useState<CslShiftCode>('A2');
  const [calendarPunchIn, setCalendarPunchIn] = useState<string>('07:00 AM');
  const [calendarPunchOut, setCalendarPunchOut] = useState<string>('03:20 PM');
  const [calendarPunchOt, setCalendarPunchOt] = useState<string>('');
  const [calendarPunchNotes, setCalendarPunchNotes] = useState<string>('');

  const handleOpenCalendarDutyPunch = (day: number) => {
    let dayLog: any = null;
    try {
      const saved = localStorage.getItem(monthLogsKey) || localStorage.getItem('csl_attendance_daily_logs_v2');
      if (saved) {
        const logs = JSON.parse(saved);
        dayLog = logs.find((r: any) => r.dayNum === day);
      }
    } catch {}

    const isSun = isSunday(day);
    const assignedShift = getEffectiveShiftForDate(
      new Date(selectedYear, selectedMonth, day),
      dayShifts[day]
    );
    const sDef = CSL_SHIFTS[assignedShift] || CSL_SHIFTS['A2'];
    const monthShort = MONTH_SHORT_NAMES[selectedMonth] || 'Nov';

    setCalendarPunchDateStr(`${day} ${monthShort} ${selectedYear}`);
    setCalendarPunchShift(assignedShift);
    setCalendarPunchIn(dayLog?.inTime && dayLog.inTime !== '—' ? dayLog.inTime : sDef.inTime);
    setCalendarPunchOut(dayLog?.outTime && dayLog.outTime !== '—' && dayLog.outTime !== 'On Duty' ? dayLog.outTime : sDef.outTime);
    setCalendarPunchOt(dayLog?.otHours && dayLog.otHours > 0 ? `0${dayLog.otHours}:00`.slice(-5) : '');
    setCalendarPunchNotes(dayLog?.notes || '');
    setCalendarDutyModalOpen(true);
  };

  const handleSaveCalendarDutyPunch = (data: DutyPunchData) => {
    let dayNumber = getIstDate().getDate();
    const isoMatch = data.dateStr ? data.dateStr.match(/\d{4}-\d{1,2}-(\d{1,2})/) : null;
    const startMatch = data.dateStr ? data.dateStr.match(/^(\d{1,2})/) : null;
    if (isoMatch) {
      dayNumber = parseInt(isoMatch[1], 10);
    } else if (startMatch) {
      dayNumber = parseInt(startMatch[1], 10);
    }

    const isSun = isSunday(dayNumber);
    const hInfo = isCslHolidayDate(new Date(selectedYear, selectedMonth, dayNumber), selectedMonth);
    const isHolidayDay = isSun || hInfo.isHoliday;
    const finalShift: CslShiftCode = isSun ? 'C1' : data.shift;
    const finalDef = CSL_SHIFTS[finalShift] || CSL_SHIFTS['C1'];
    const monthShort = MONTH_SHORT_NAMES[selectedMonth] || 'Nov';

    let otNum = 0;
    if (data.leave === 'None' && data.ot) {
      const parts = data.ot.split(':');
      if (parts.length === 2) {
        otNum = parseInt(parts[0], 10) || 0;
      } else {
        otNum = Math.floor(parseFloat(data.ot) || 0);
      }
    }

    if (isHolidayDay && data.leave === 'None' && data.inTime && data.inTime !== '—') {
      if (otNum <= 0) {
        const calc = calculateDutyAndOT(data.inTime, data.outTime, finalShift, true, new Date(selectedYear, selectedMonth, dayNumber));
        otNum = calc.otHours > 0 ? Math.floor(calc.otHours) : 8;
      }
    }

    const defaultHolidayNote = isSun
      ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് (08:00 - 16:20) · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)'
      : `${hInfo.holidayNameMl || 'ഹോളിഡേ'} ഡ്യൂട്ടി (Holiday Duty · മുഴുവൻ സമയവും സ്പെഷ്യൽ OT അർഹതയുണ്ട്)`;

    const noteText = data.notes
      ? data.notes
      : (isHolidayDay && data.leave === 'None' && data.inTime && data.inTime !== '—'
          ? defaultHolidayNote
          : (otNum > 0 ? `${otNum} hrs Overtime (OT)` : (data.graceApplied ? (isMl ? '5m ഗ്രേസ് ടൈം' : '5m Grace Applied') : (isMl ? 'ഡ്യൂട്ടി സേവ് ചെയ്തു' : 'Duty Punch Saved'))));

    const shiftDisplay = isSun 
      ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` 
      : (isHolidayDay ? `${finalShift} · ഹോളിഡേ ഡ്യൂട്ടി` : `${finalShift} (${finalDef.inTime.replace(' ', '')} - ${finalDef.outTime.replace(' ', '')})`);

    const newStatus = data.leave !== 'None'
      ? (data.leave.includes('Casual') ? 'Casual Leave' : 'Earned Leave')
      : (isHolidayDay && data.inTime && data.inTime !== '—' ? 'Holiday Duty' : 'Present');

    const calc = (data.leave === 'None' && data.inTime && data.inTime !== '—' && data.outTime && data.outTime !== '—' && data.outTime !== 'On Duty')
      ? calculateDutyAndOT(data.inTime, data.outTime, finalShift, true, new Date(selectedYear, selectedMonth, dayNumber))
      : null;

    const workHoursDisplay = data.leave !== 'None' 
      ? '0h' 
      : (calc ? calc.workHours : (data.outTime && data.outTime !== '—' && data.outTime !== 'On Duty' ? '8h 20m' : 'On Duty'));

    try {
      const today = getIstDate();
      const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;
      const savedLogs = localStorage.getItem(monthLogsKey) || (isCurrentMonth ? localStorage.getItem('csl_attendance_daily_logs_v2') : null);
      let logs: any[] = savedLogs ? JSON.parse(savedLogs) : [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[new Date(selectedYear, selectedMonth, dayNumber).getDay()];

      const existingIdx = logs.findIndex((r: any) => r.dayNum === dayNumber);
      const updatedItem = {
        id: `d-${selectedMonth}-${dayNumber}`,
        dateStr: `${dayNumber} ${monthShort} ${selectedYear}`,
        month: selectedMonth,
        dayName,
        dayNum: dayNumber,
        shift: shiftDisplay,
        shiftCode: finalShift,
        inTime: data.leave !== 'None' ? '—' : data.inTime,
        outTime: data.leave !== 'None' ? '—' : data.outTime,
        workHours: workHoursDisplay,
        otHours: otNum,
        terminal: 'Gate 4 Turnstile #02',
        status: newStatus,
        notes: noteText,
        userEdited: true,
      };

      if (existingIdx >= 0) {
        logs[existingIdx] = updatedItem;
      } else {
        logs.push(updatedItem);
      }
      logs.sort((a: any, b: any) => b.dayNum - a.dayNum);
      localStorage.setItem(monthLogsKey, JSON.stringify(logs));
      if (isCurrentMonth) {
        localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(logs));
      }

      // Save shift assigned to this day and sync everywhere (Calendar, CSL Duty Shift, Attendance)
      setActiveShift(finalShift);
      syncShiftFromCalendarEverywhere(
        finalShift,
        new Date(selectedYear, selectedMonth, dayNumber),
        finalShift === 'A2' || finalShift === 'B2'
      );
      setDayShifts(loadMonthDayShifts(selectedYear, selectedMonth));

      // Save present status
      const savedPres = localStorage.getItem(presentStorageKey);
      let presentList: number[] = savedPres ? JSON.parse(savedPres) : [];
      const isOctHoliday = selectedMonth === 9 && (dayNumber === 21 || dayNumber === 2);
      if (data.leave === 'None') {
        if (!presentList.includes(dayNumber) && !isOctHoliday) {
          presentList.push(dayNumber);
        }
      } else {
        presentList = presentList.filter(d => d !== dayNumber);
      }
      presentList.sort((a, b) => a - b);
      localStorage.setItem(presentStorageKey, JSON.stringify(presentList));
      setPresentDays(presentList);

      const todayDay = today.getDate();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      if (isCurrentMonth && dayNumber === todayDay) {
        const isPunchedOut = Boolean(data.outTime && data.outTime !== '—' && data.outTime !== 'On Duty');
        localStorage.setItem('csl_today_punched_date', todayKey);
        localStorage.setItem('csl_actual_punched_today', data.leave === 'None' ? 'true' : 'false');
        localStorage.setItem('csl_today_punch_in_time', data.inTime);
        localStorage.setItem('csl_today_punch_out_time', data.outTime);
        localStorage.setItem('csl_punch_state', isPunchedOut ? 'out' : 'in');
        localStorage.setItem('csl_last_punch_time', isPunchedOut ? data.outTime : data.inTime);

        if (isPunchedOut && data.leave === 'None') {
          const summaryData = {
            dateKey: todayKey,
            shift: finalShift,
            inTime: data.inTime,
            outTime: data.outTime,
            totalHours: workHoursDisplay,
            regularHours: finalDef.duration,
            otHours: otNum,
            graceApplied: calc?.graceApplied || false,
            inGraceApplied: calc?.inGraceApplied || false,
            outGraceApplied: calc?.outGraceApplied || false,
            graceNote: calc?.graceNote,
            recordedAt: data.outTime,
          };
          localStorage.setItem('csl_completed_duty_summary', JSON.stringify(summaryData));
        } else {
          localStorage.removeItem('csl_completed_duty_summary');
        }
      }

      window.dispatchEvent(new CustomEvent('csl-attendance-updated', {
        detail: {
          day: dayNumber,
          present: data.leave === 'None',
          punchInTime: data.inTime,
          punchOutTime: data.outTime,
          shift: finalShift,
          otHours: otNum,
          totalHours: workHoursDisplay
        }
      }));
      setSyncTick(t => t + 1);
    } catch {}

    setCalendarDutyModalOpen(false);
  };

  const toggleLeave = (day: number, type: CslLeaveType = 'CL') => {
    if (leaveRecords[day]) {
      handleRemoveLeave(day);
    } else {
      handleQuickAddLeave(day, type);
    }
  };

  const handleSaveNote = (day: number) => {
    const key = `${selectedYear}-${selectedMonth}-${day}`;
    const nextNotes = { ...dayNotes, [key]: editingNote.trim() };
    setDayNotes(nextNotes);
    try {
      localStorage.setItem('csl_calendar_day_notes_2026', JSON.stringify(nextNotes));
    } catch (e) {}
    setShowNoteInput(false);
  };

  const handleSaveWork = (day: number, customWork?: string) => {
    const textWork = (customWork !== undefined ? customWork : editingWork).trim();
    const key = `${selectedYear}-${selectedMonth}-${day}`;
    const altKey1 = `2026-9-${day}`;
    const altKey2 = `2026-10-${day}`;

    const nextWorks = { ...dayWorks };
    if (textWork) {
      nextWorks[key] = textWork;
      nextWorks[altKey1] = textWork;
      nextWorks[altKey2] = textWork;
    } else {
      delete nextWorks[key];
      delete nextWorks[altKey1];
      delete nextWorks[altKey2];
    }
    setDayWorks(nextWorks);
    try {
      localStorage.setItem('csl_calendar_day_works_2026', JSON.stringify(nextWorks));
    } catch {}

    // Synchronize into month-specific logs and csl_attendance_daily_logs_v2 as well
    try {
      const savedLogs = localStorage.getItem(monthLogsKey) || localStorage.getItem('csl_attendance_daily_logs_v2');
      if (savedLogs) {
        const logs: any[] = JSON.parse(savedLogs);
        const targetIdx = logs.findIndex((r: any) => r.dayNum === day);
        if (targetIdx >= 0) {
          logs[targetIdx] = {
            ...logs[targetIdx],
            work: textWork || undefined,
          };
          localStorage.setItem(monthLogsKey, JSON.stringify(logs));
          if (selectedMonth === getIstDate().getMonth()) {
            localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(logs));
          }
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('csl-calendar-works-updated', { detail: { day, work: textWork } }));
    window.dispatchEvent(new CustomEvent('csl-attendance-updated', { detail: { day, work: textWork } }));
    setShowWorkInput(false);
  };

  // Month start offset & days count
  const firstDayOffset = currentMonthConfig.startDay;
  const daysInMonth = currentMonthConfig.days;

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev > 0 ? prev - 1 : 11));
    setSelectedDate(1);
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev < 11 ? prev + 1 : 0));
    setSelectedDate(1);
  };

  // Mini calendar calculations for previous & next month
  const prevMonthIndex = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevConfig = cslMonthsConfig[prevMonthIndex];

  const nextMonthIndex = selectedMonth === 11 ? 0 : selectedMonth + 1;
  const nextMonthYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
  const nextConfig = cslMonthsConfig[nextMonthIndex];

  // Specific day details helper
  const getDayDetails = (day: number) => {
    const d = new Date(selectedYear, selectedMonth, day);
    const dayOfWeek = d.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesMl = ['ഞായറാഴ്ച', 'തിങ്കളാഴ്ച', 'ചൊവ്വാഴ്ച', 'ബുധനാഴ്ച', 'വ്യാഴാഴ്ച', 'വെള്ളിയാഴ്ച', 'ശനിയാഴ്ച'];
    const nameEn = dayNames[dayOfWeek];
    const nameMl = dayNamesMl[dayOfWeek];
    const currentDay = currentSystemDate.getDate();
    const currentMonth = currentSystemDate.getMonth();
    const currentYear = currentSystemDate.getFullYear();
    const isToday = selectedYear === currentYear && selectedMonth === currentMonth && day === currentDay;
    const isPresent = isPresentDay(day);
    const isLeave = isLeaveDay(day);
    const isSun = dayOfWeek === 0;
    const is2ndSat = dayOfWeek === 6 && day >= 8 && day <= 14;
    const is4thSat = dayOfWeek === 6 && day >= 22 && day <= 28;
    const isSatOff = is2ndSat || is4thSat;

    // Check specific holiday
    let holidayInfo: {
      name: string;
      malayalamName: string;
      hindiName?: string;
      category: string;
      badge: string;
      isNational: boolean;
      significance: string;
      yardNotice: string;
      events: string[];
    } | null = null;

    if (selectedMonth === 9) {
      if (day === 2) {
        holidayInfo = {
          name: 'Gandhi Jayanthi',
          malayalamName: 'ഗാന്ധി ജയന്തി',
          hindiName: 'गांधी जयंती',
          category: 'National Holiday',
          badge: 'National Closed Holiday',
          isNational: true,
          significance: '157th Birth Anniversary of Mahatma Gandhi · Father of the Nation (രാഷ്ട്രപിതാവ് മഹാത്മാ ഗാന്ധിയുടെ ജന്മദിനാഘോഷം)',
          yardNotice: 'Cochin Shipyard Fully Closed · All production docks, engineering workshops & administrative offices closed. Paid gazetted holiday for all permanent and contract workforce.',
          events: [
            '08:30 AM: Floral Tributes & Garlanding (ഗാന്ധി സ്മൃതി പുഷ്പാർച്ചന) at CSL Administrative Complex statue with CMD & senior officers.',
            'Swachhata Hi Seva (സ്വച്ഛത ഹി സേവ): Special voluntary dockyard cleanliness & green environment drive.',
            'Production Operations Closed: Hull shops, dry docks, and workshop machinery fully closed.',
            'Essential Standby: Emergency fire & safety, yard security, and essential dry dock drainage teams on active duty.'
          ]
        };
      } else if (day === 21) {
        holidayInfo = {
          name: 'Vijayadasami / Mahanavami',
          malayalamName: 'വിജയദശമി',
          hindiName: 'विजयादशमी / महानवमी',
          category: 'CSL Gazetted Holiday',
          badge: 'CSL Gazetted',
          isNational: false,
          significance: 'Vijayadasami official CSL Gazetted closed holiday (വിജയദശമി).',
          yardNotice: 'Shipyard Closed Holiday for all production shifts and administrative offices.',
          events: [
            'Official PSU Gazetted closed holiday across Cochin Shipyard Limited.'
          ]
        };
      }
    } else if (selectedMonth === 11 && selectedYear === 2026 && day === 25) {
      holidayInfo = {
        name: 'Christmas',
        malayalamName: 'ക്രിസ്മസ് (Christmas Day)',
        hindiName: 'क्रिसमस',
        category: 'CSL Gazetted Holiday',
        badge: 'CSL Gazetted Holiday',
        isNational: false,
        significance: 'Feast of the Nativity of Jesus Christ (ക്രിസ്മസ്) · Official CSL Gazetted Closed Holiday across all shipyard workshops and docks.',
        yardNotice: 'Cochin Shipyard Fully Closed · All production workshops, building docks, ISRF & admin offices closed. Special holiday OT applicable only for emergency standby teams.',
        events: [
          '25 December 2026 (Friday) - Official CSL Gazetted Closed Holiday.',
          'Shipyard dry docks and workshops closed in celebration of Christmas.',
          'Essential Standby: Emergency dock dewatering, fire & safety teams on duty.'
        ]
      };
    } else {
      const hol = cslOfficial12Holidays2026.find(
        (h) => h.monthIndex === selectedMonth && parseInt(h.date, 10) === day
      );
      if (hol) {
        holidayInfo = {
          name: hol.name,
          malayalamName: hol.malayalamName || hol.name,
          hindiName: hol.hindiName,
          category: hol.category,
          badge: hol.badge,
          isNational: hol.category === 'National',
          significance: hol.description,
          yardNotice: 'Official Closed Gazetted Holiday across all Cochin Shipyard Limited units.',
          events: [
            `${hol.fullDate} (${hol.dayOfWeek}) - Gazetted Closed Holiday.`,
            `Location: ${hol.location}.`
          ]
        };
      }
    }

    const noteKey = `${selectedYear}-${selectedMonth}-${day}`;
    const workKey = `${selectedYear}-${selectedMonth}-${day}`;
    const leaveDetails = getDayLeave(day);
    const dayAttendanceRecord = getDayAttendanceRecord(day);
    
    // Explicit saved work from user/attendance edits for this specific month/day
    const customWork = dayWorks[workKey] || (dayAttendanceRecord?.work ? String(dayAttendanceRecord.work) : '');

    // Authentic CSL Shipyard duty work description if not explicitly customized
    let defaultWork = '';
    const deptName = currentUser?.department || 'Assembly Shop';
    if (isPresent) {
      if (isSun) {
        defaultWork = isMl
          ? `${deptName} · ഞായറാഴ്ച C1 സ്പെഷ്യൽ ഓവർടൈം വർക്ക് · ഡ്രൈ ഡോക്ക് ഹൾ ഫാബ്രിക്കേഷൻ & പ്ലേറ്റ് അലൈൻമെന്റ് (Dock #2)`
          : `${deptName} · Sunday C1 Special OT Duty · Dry Dock Hull Fabrication & Alignment (Dock #2)`;
      } else if (holidayInfo) {
        defaultWork = isMl
          ? `${deptName} · ${holidayInfo.malayalamName || holidayInfo.name} സ്പെഷ്യൽ ഓവർടൈം വർക്ക് · എമർജൻസി ഷിപ്പ് റിപ്പയർ`
          : `${deptName} · ${holidayInfo.name} Special OT Duty · Emergency Ship Repair & Maintenance`;
      } else {
        defaultWork = isMl
          ? `${deptName} · ഷിപ്പ് കൺസ്ട്രക്ഷൻ & വെസൽ ഫാബ്രിക്കേഷൻ വർക്ക് (Building Dock 1 & Dry Dock #2)`
          : `${deptName} · Ship Construction & Vessel Fabrication Work (Building Dock 1 & Dry Dock #2)`;
      }
    } else if (isLeave) {
      const lType = leaveDetails?.type || 'CL';
      defaultWork = isMl
        ? `${lType} ലീവ് (Leave Approved) · എച്ച്.ഒ.ഡി / സൂപ്പർവൈസർ സാങ്ഷൻ ചെയ്തത്`
        : `${lType} Leave (Leave Approved) · Sanctioned by Dept HOD / Yard Supervisor`;
    } else if (isSun) {
      defaultWork = isMl
        ? 'ഞായറാഴ്ച പ്രതിവാര വിശ്രമം (Sunday Weekly Off) · ഷെഡ്യൂൾ ചെയ്ത വർക്ക് ഇല്ല'
        : 'Sunday Weekly Off · No Scheduled Yard Production Duty';
    } else if (isSatOff) {
      defaultWork = isMl
        ? 'സി.എസ്.എൽ രണ്ടാം/നാലാം ശനി പ്രതിമാസ അവധി (CSL Saturday Off) · ഷെഡ്യൂൾ ചെയ്ത വർക്ക് ഇല്ല'
        : 'CSL 2nd/4th Saturday Off · No Scheduled Yard Production Duty';
    } else if (holidayInfo) {
      defaultWork = isMl
        ? `${holidayInfo.malayalamName || holidayInfo.name} · സി.എസ്.എൽ ഒഫീഷ്യൽ ഗസറ്റഡ് അവധി ദിനം (Closed Holiday)`
        : `${holidayInfo.name} · Official CSL Gazetted Closed Holiday (No Scheduled Work)`;
    } else {
      defaultWork = isMl
        ? `${deptName} · ജനറൽ പ്രൊഡക്ഷൻ & ഷിപ്പ് റിപ്പയർ ഡ്യൂട്ടി (ഡ്യൂട്ടി അറ്റൻഡ് ചെയ്തിട്ടില്ല)`
        : `${deptName} · General Production & Ship Repair Duty (Off-Duty / Not Punched)`;
    }

    const work = customWork || defaultWork;
    const isCustomWork = Boolean(customWork);

    const panchangam = getMalayalamPanchangam(selectedMonth, day, dayOfWeek);
    const cellDate = new Date(selectedYear, selectedMonth, day);
    const todayDate = new Date(currentSystemDate.getFullYear(), currentSystemDate.getMonth(), currentSystemDate.getDate());
    const isPast = cellDate.getTime() < todayDate.getTime();
    const isFuture = cellDate.getTime() > todayDate.getTime();
    const shiftRotation = getWeeklyShiftForDate(cellDate);

    return {
      day,
      nameEn,
      nameMl,
      isToday,
      isPast,
      isFuture,
      shiftRotation,
      isPresent,
      isLeave,
      leaveDetails,
      isSun,
      isSatOff,
      isSecondSat: is2ndSat,
      isFourthSat: is4thSat,
      holidayInfo,
      note: dayNotes[noteKey] || '',
      work,
      isCustomWork,
      defaultWork,
      panchangam,
    };
  };

  // Helper to read daily attendance log for OT & punch time showcase
  const getDayAttendanceRecord = (dayNum: number) => {
    try {
      const saved = localStorage.getItem(monthLogsKey) || (selectedMonth === getIstDate().getMonth() ? localStorage.getItem('csl_attendance_daily_logs_v2') : null);
      if (saved) {
        const logs: any[] = JSON.parse(saved);
        return logs.find((r: any) => {
          if (r.dayNum !== dayNum) return false;
          if (r.month !== undefined && r.month !== null) return r.month === selectedMonth;
          return true;
        }) || null;
      }
    } catch {}
    return null;
  };

  const filtered12Holidays = cslOfficial12Holidays2026.filter((h) => {
    if (holidayCategoryFilter === 'national' && h.category !== 'National') return false;
    if (holidayCategoryFilter === 'gazetted' && h.category !== 'CSL Gazetted') return false;
    if (holidaySearchQuery.trim()) {
      const q = holidaySearchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.fullDate.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.malayalamName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const [calendarLogoClicks, setCalendarLogoClicks] = useState(0);
  const calendarLogoClicksRef = React.useRef(0);
  const handleCalendarLogoClick = () => {
    calendarLogoClicksRef.current += 1;
    const current = calendarLogoClicksRef.current;
    setCalendarLogoClicks(current);
    if (current >= 3) {
      calendarLogoClicksRef.current = 0;
      setCalendarLogoClicks(0);
      window.dispatchEvent(new CustomEvent('csl_open_admin_modal'));
      return;
    }
    setTimeout(() => {
      calendarLogoClicksRef.current = 0;
      setCalendarLogoClicks(0);
    }, 1800);
  };


  const prepareMonthlyPdfData = (): MonthlyPdfData => {
    let storedLogs: any[] = [];
    try {
      const saved = localStorage.getItem(monthLogsKey) || (selectedMonth === getIstDate().getMonth() ? localStorage.getItem('csl_attendance_daily_logs_v2') : null);
      if (saved) storedLogs = JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse stored logs', e);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyLogs: MonthlyPdfData['dailyLogs'] = [];

    for (let d = 1; d <= currentMonthConfig.days; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const dayName = dayNames[dateObj.getDay()];
      const dateStr = `${String(d).padStart(2, '0')} ${currentMonthConfig.name.slice(0, 3)} ${selectedYear} (${dayName})`;
      const isSun = dateObj.getDay() === 0;
      const holInfo = isCslHolidayDate(dateObj, selectedMonth);
      const leave = leaveRecords[d];
      const isPres = presentDays.includes(d);
      const shiftCode: CslShiftCode = getEffectiveShiftForDate(dateObj, dayShifts[d]);
      const shiftDef = CSL_SHIFTS[shiftCode] || CSL_SHIFTS['A2'];
      const matchedLog = storedLogs.find((l: any) => l.dayNum === d);

      if (leave) {
        dailyLogs.push({
          dayNumber: d,
          dateStr,
          dayName,
          shift: shiftCode,
          status: 'LEAVE',
          statusLabel: `${leave.type} - ${leave.duration || 'Full Day'} (${leave.reason || 'Leave'})`,
          inTime: '—',
          outTime: '—',
        });
      } else if (isPres) {
        const inT = matchedLog && matchedLog.inTime && matchedLog.inTime !== '—' ? matchedLog.inTime : (isSun ? '08:00 AM' : shiftDef.inTime);
        const outT = matchedLog && matchedLog.outTime && matchedLog.outTime !== '—' ? matchedLog.outTime : (isSun ? '04:20 PM' : shiftDef.outTime);
        const ot = matchedLog && matchedLog.otHours ? `${matchedLog.otHours} hrs` : (isSun ? '8.0 hrs' : (holInfo.isHoliday ? '8.0 hrs' : undefined));
        const label = isSun
          ? 'Sunday Duty (C1 OT)'
          : (holInfo.isHoliday ? `${holInfo.holidayName || 'Holiday'} (Holiday Duty)` : 'Duty Attended (Present)');
        dailyLogs.push({
          dayNumber: d,
          dateStr,
          dayName,
          shift: isSun ? 'C1' : shiftCode,
          status: 'PRESENT',
          statusLabel: label,
          inTime: inT,
          outTime: outT,
          otHours: ot,
        });
      } else if (holInfo.isHoliday) {
        dailyLogs.push({
          dayNumber: d,
          dateStr,
          dayName,
          shift: 'OFF',
          status: 'HOLIDAY',
          statusLabel: `${holInfo.holidayName || 'Official Holiday'} (CSL Holiday)`,
          inTime: '—',
          outTime: '—',
        });
      } else if (isSun) {
        dailyLogs.push({
          dayNumber: d,
          dateStr,
          dayName,
          shift: 'OFF',
          status: 'WEEKLY_OFF',
          statusLabel: 'Weekly Off (Sunday)',
          inTime: '—',
          outTime: '—',
        });
      } else {
        dailyLogs.push({
          dayNumber: d,
          dateStr,
          dayName,
          shift: shiftCode,
          status: 'OFF',
          statusLabel: 'Off Duty',
          inTime: '—',
          outTime: '—',
        });
      }
    }

    return {
      employeeName: currentUser?.name || 'Prathyush Mohan K',
      tokenNumber: currentUser?.token || '5312',
      department: currentUser?.department || 'Hull Errection',
      category: isContract ? 'Company on Contract Employee (CSL)' : 'Permanent Employee (CSL)',
      monthName: currentMonthConfig.name,
      monthYear: selectedYear,
      totalDays: currentMonthConfig.days,
      attendedDays: presentDays.length,
      leavesCount: totalLeavesCount,
      leaveBreakdown: {
        cl: clDaysCount,
        el: elDaysCount,
        hpl: hplDaysCount,
        ml: mlDaysCount,
        special: sclDaysCount,
      },
      offsCount: currentMonthConfig.weeklyOffs + currentMonthConfig.holidaysCount,
      dailyLogs,
    };
  };

  const handleDownloadMonthlyPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const pdfData = prepareMonthlyPdfData();
      const ok = await generateAndDownloadMonthlyPdf(pdfData);
      if (ok) {
        setPdfDownloadSuccess(true);
        setTimeout(() => setPdfDownloadSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleShareMonthlyPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const pdfData = prepareMonthlyPdfData();
      const res = await shareMonthlyPdf(pdfData);
      if (res.success) {
        setPdfDownloadSuccess(true);
        setTimeout(() => setPdfDownloadSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error sharing PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };


  useEffect(() => {
    if (showMusterSlip) {
      try {
        const data = prepareMonthlyPdfData();
        prepareMonthlyPdf(data).then((res) => {
          setPreparedPdf({
            downloadUrl: res.downloadUrl,
            viewUrl: res.viewUrl,
            fileName: res.fileName,
          });
        }).catch(err => {
          console.warn("Auto prepare PDF notice:", err);
        });
      } catch (e) {
        console.warn("prepareMonthlyPdf error:", e);
      }
    } else {
      setPreparedPdf(null);
    }
  }, [showMusterSlip]);

  const handleWhatsAppQuickShare = () => {
    try {
      const data = prepareMonthlyPdfData();
      const text = `*COCHIN SHIPYARD LIMITED*\n*Official Biometric Duty & Attendance Register*\n\n` +
        `👤 *Employee:* ${data.employeeName} (${data.tokenNumber})\n` +
        `🏢 *Department:* ${data.department}\n` +
        `📅 *Month:* ${data.monthName} ${data.monthYear}\n\n` +
        `📊 *Summary:*\n` +
        `• Total Days: ${data.totalDays}\n` +
        `• Attended (Present): ${data.attendedDays} Days\n` +
        `• Leaves Taken: ${data.leavesCount} Days (CL:${data.leaveBreakdown?.cl || 0}, EL:${data.leaveBreakdown?.el || 0}, HPL:${data.leaveBreakdown?.hpl || 0})\n` +
        `• Offs & Holidays: ${data.offsCount} Days\n\n` +
        `✓ System Verified CSL Attendance Portal`;

      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error('WhatsApp quick share error:', e);
    }
  };

  const handleOpenMonthlyPdf = () => {
    setShowInAppPdfViewer(true);
  };
  const _origOpen = () => {
    try {
      const pdfData = prepareMonthlyPdfData();
      openMonthlyPdfInNewTab(pdfData);
    } catch (err) {
      console.error('Error opening PDF in new tab:', err);
    }
  };

  /**
  /**
   * Prepares Next Month OT PDF data.
   * CSL OVERTIME PAYROLL CUTOFF CYCLE:
   * For Month M+1 (e.g. November disbursement):
   * Strictly calculated from 20th of previous month (Sep 20) to 19th of current month (Oct 19).
   * Dates after 19th (e.g. Oct 27, Oct 25) are strictly excluded from November and belong to December cycle!
   * STRICT REQUIREMENT: Only dates with OT > 0 are included. Days without OT are completely omitted.
   */
  const prepareNextMonthOtPdfData = (): NextMonthOtPdfData => {
    // Upcoming Monthly Salary is NOVEMBER 2026
    // CSL OT Billing Cycle for November Salary: 20 October 2026 – 19 November 2026
    const isUpcomingNovSalary = selectedMonth === 10 || selectedMonth === 9;
    const targetCutoffMonth = isUpcomingNovSalary ? 10 : selectedMonth; // 10 = November (cutoff 19 Nov for Nov Salary)
    const targetCutoffYear = selectedYear;
    const targetCutoffMonthConfig = cslMonthsConfig[targetCutoffMonth] || currentMonthConfig;

    let storedLogs: any[] = [];
    try {
      const octLogsRaw = localStorage.getItem('csl_attendance_daily_logs_2026_9');
      if (octLogsRaw) {
        const parsedOct = JSON.parse(octLogsRaw);
        if (Array.isArray(parsedOct)) {
          parsedOct.forEach((item: any) => {
            storedLogs.push({ ...item, month: item.month ?? 9 });
          });
        }
      }
      const novLogsRaw = localStorage.getItem('csl_attendance_daily_logs_2026_10');
      if (novLogsRaw) {
        const parsedNov = JSON.parse(novLogsRaw);
        if (Array.isArray(parsedNov)) {
          parsedNov.forEach((item: any) => {
            const exists = storedLogs.some(
              (existing) => existing.dayNum === item.dayNum && (existing.month ?? 10) === (item.month ?? 10)
            );
            if (!exists) storedLogs.push({ ...item, month: item.month ?? 10 });
          });
        }
      }
      const saved = localStorage.getItem('csl_attendance_daily_logs_v2');
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        if (Array.isArray(parsedSaved)) {
          parsedSaved.forEach((item: any) => {
            const exists = storedLogs.some(
              (existing) => existing.dayNum === item.dayNum && existing.month === item.month && existing.dateStr === item.dateStr
            );
            if (!exists) storedLogs.push(item);
          });
        }
      }
    } catch {}

    // Load saved previous month (October, index 9) calendar state for Part 1 (20 Oct – 31 Oct)
    const prevMonthDate = new Date(targetCutoffYear, targetCutoffMonth - 1, 1);
    const prevMonthIndex = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();

    let prevPresentDays: number[] = selectedMonth === prevMonthIndex ? presentDays : [];
    let prevShifts: Record<number, CslShiftCode> = selectedMonth === prevMonthIndex ? dayShifts : {};
    let prevLeaves: typeof leaveRecords = selectedMonth === prevMonthIndex ? leaveRecords : {};

    if (selectedMonth !== prevMonthIndex) {
      try {
        const savedPres = localStorage.getItem(`csl_calendar_present_days_${prevMonthYear}_${prevMonthIndex}`);
        if (savedPres) prevPresentDays = JSON.parse(savedPres);
        const savedShf = localStorage.getItem(`csl_calendar_shifts_${prevMonthYear}_${prevMonthIndex}`);
        if (savedShf) prevShifts = JSON.parse(savedShf);
        const savedLvs = localStorage.getItem(`csl_calendar_leaves_${prevMonthYear}_${prevMonthIndex}`);
        if (savedLvs) prevLeaves = JSON.parse(savedLvs);
      } catch {}
    }

    // Load target cutoff month (November, index 10) calendar state for Part 2 (1 Nov – 19 Nov)
    let cyclePresentDays: number[] = selectedMonth === targetCutoffMonth ? presentDays : [];
    let cycleShifts: Record<number, CslShiftCode> = selectedMonth === targetCutoffMonth ? dayShifts : {};
    let cycleLeaves: typeof leaveRecords = selectedMonth === targetCutoffMonth ? leaveRecords : {};

    if (selectedMonth !== targetCutoffMonth) {
      try {
        const savedPres = localStorage.getItem(`csl_calendar_present_days_${targetCutoffYear}_${targetCutoffMonth}`);
        if (savedPres) cyclePresentDays = JSON.parse(savedPres);
        const savedShf = localStorage.getItem(`csl_calendar_shifts_${targetCutoffYear}_${targetCutoffMonth}`);
        if (savedShf) cycleShifts = JSON.parse(savedShf);
        const savedLvs = localStorage.getItem(`csl_calendar_leaves_${targetCutoffYear}_${targetCutoffMonth}`);
        if (savedLvs) cycleLeaves = JSON.parse(savedLvs);
      } catch {}
    }

    const otLogs: NextMonthOtItem[] = [];
    let sl = 1;

    // Salary Month Name & Year (November 2026 for 20 Oct – 19 Nov cycle)
    const nextMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nextMonthName = nextMonthNames[targetCutoffMonth];
    const nextMonthYear = targetCutoffYear;

    // CSL Overtime Cutoff Cycle: 20th of (targetCutoffMonth - 1) to 19th of targetCutoffMonth
    // For November 2026 Monthly Salary: 20 October 2026 to 19 November 2026
    const prevMonthName = nextMonthNames[prevMonthIndex];
    const prevMonthShort = prevMonthName.slice(0, 3);
    const currentMonthShort = targetCutoffMonthConfig.name.slice(0, 3);

    // Number of days in previous month (31 days in October)
    const prevMonthDays = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();
    const cyclePeriod = `20 ${prevMonthShort} ${prevMonthYear} – 19 ${currentMonthShort} ${targetCutoffYear}`;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // -------------------------------------------------------------
    // PART 1: PREVIOUS MONTH WINDOW (Day 20 to end of previous month, e.g. 20-31 Oct)
    // -------------------------------------------------------------
    for (let d = 20; d <= prevMonthDays; d++) {
      const dateObj = new Date(prevMonthYear, prevMonthIndex, d);
      const dayName = dayNames[dateObj.getDay()];
      const isSun = dateObj.getDay() === 0;
      const holInfo = isCslHolidayDate(dateObj, prevMonthIndex);
      const leave = prevLeaves[d];
      const isPres = prevPresentDays.includes(d);
      const shiftCode: CslShiftCode = getEffectiveShiftForDate(dateObj, prevShifts[d]);

      if (leave) continue;

      // Find any saved log for this previous month date
      const matchedLog = storedLogs.find((l: any) => {
        if (l.dayNum !== d) return false;
        if (l.month !== undefined && l.month !== null) return l.month === prevMonthIndex;
        if (l.dateStr) {
          const s = String(l.dateStr).toLowerCase();
          return s.includes(prevMonthShort.toLowerCase()) || s.includes(prevMonthName.toLowerCase());
        }
        return false;
      });

      let otHoursVal = 0;
      let remarks = '';

      if (matchedLog && matchedLog.otHours !== undefined && matchedLog.otHours !== null) {
        if (typeof matchedLog.otHours === 'number') {
          otHoursVal = matchedLog.otHours;
        } else {
          const parts = String(matchedLog.otHours).split(':');
          otHoursVal = parts.length === 2 ? parseInt(parts[0], 10) : parseFloat(String(matchedLog.otHours)) || 0;
        }
        if (matchedLog.notes) remarks = matchedLog.notes;
      }

      // Sundays in CSL: Sunday C1 Shift carries 8.0 hrs Holiday Overtime if attended/present
      if (isSun && otHoursVal === 0 && (isPres || (matchedLog && matchedLog.status === 'Present'))) {
        otHoursVal = 8.0;
        remarks = 'Sunday C1 Overtime Duty';
      }

      // Holiday duty ONLY if attended/present
      if (isPres && holInfo.isHoliday && otHoursVal === 0) {
        otHoursVal = 8.0;
        remarks = `${holInfo.holidayName} Holiday OT`;
      }

      if (otHoursVal > 0 && (isPres || (matchedLog && matchedLog.status === 'Present') || (matchedLog && matchedLog.userEdited) || matchedLog)) {
        otLogs.push({
          slNo: sl++,
          dayNumber: d,
          dateStr: `${String(d).padStart(2, '0')} ${prevMonthShort} ${prevMonthYear}`,
          dayName,
          shift: isSun ? 'C1 (08:00 - 16:20)' : (matchedLog?.shiftCode || shiftCode),
          otHours: otHoursVal,
          otHoursFormatted: `${otHoursVal.toFixed(1)} hrs`,
          remarks: remarks || `Overtime Duty`,
        });
      }
    }

    // -------------------------------------------------------------
    // PART 2: CUTOFF MONTH WINDOW (Day 1 to Day 19 STRICTLY; e.g. 01-19 Nov)
    // -------------------------------------------------------------
    const currentMonthCutoffDay = Math.min(19, targetCutoffMonthConfig.days);

    for (let d = 1; d <= currentMonthCutoffDay; d++) {
      const dateObj = new Date(targetCutoffYear, targetCutoffMonth, d);
      const dayName = dayNames[dateObj.getDay()];
      const isSun = dateObj.getDay() === 0;
      const holInfo = isCslHolidayDate(dateObj, targetCutoffMonth);
      const leave = cycleLeaves[d];
      const isPres = cyclePresentDays.includes(d);
      const shiftCode: CslShiftCode = getEffectiveShiftForDate(dateObj, cycleShifts[d]);

      // If on leave, no OT
      if (leave) continue;

      // Find log in storedLogs for targetCutoffMonth
      const matchedLog = storedLogs.find((l: any) => {
        if (l.dayNum !== d) return false;
        if (l.month !== undefined && l.month !== null) return l.month === targetCutoffMonth;
        if (l.dateStr) {
          const s = String(l.dateStr).toLowerCase();
          // Exclude if it mentions previous month
          if (s.includes(prevMonthShort.toLowerCase()) || s.includes(prevMonthName.toLowerCase())) return false;
          return s.includes(currentMonthShort.toLowerCase()) || s.includes(targetCutoffMonthConfig.name.toLowerCase());
        }
        return false;
      });

      let otHoursVal = 0;
      let remarks = '';

      if (matchedLog && matchedLog.otHours !== undefined && matchedLog.otHours !== null) {
        if (typeof matchedLog.otHours === 'number') {
          otHoursVal = matchedLog.otHours;
        } else {
          const parts = String(matchedLog.otHours).split(':');
          otHoursVal = parts.length === 2 ? parseInt(parts[0], 10) : parseFloat(String(matchedLog.otHours)) || 0;
        }
        if (matchedLog.notes) remarks = matchedLog.notes;
      }

      // Sundays in CSL: Sunday C1 Shift carries 8.0 hrs Holiday Overtime ONLY if attended/present!
      if (isSun && otHoursVal === 0) {
        if (isPres) {
          otHoursVal = 8.0;
          remarks = 'Sunday C1 Overtime Duty';
        }
      }

      // Holiday duty ONLY if attended/present
      if (isPres && holInfo.isHoliday && otHoursVal === 0) {
        otHoursVal = 8.0;
        remarks = `${holInfo.holidayName} Holiday OT`;
      }

      // STRICT USER RULE: "OT ഇല്ലാത്ത ദിവസ മൊന്നും വേണ്ട" - Only include if otHoursVal > 0!
      if (otHoursVal > 0 && (isPres || (matchedLog && matchedLog.status === 'Present') || (matchedLog && matchedLog.userEdited) || matchedLog)) {
        otLogs.push({
          slNo: sl++,
          dayNumber: d,
          dateStr: `${String(d).padStart(2, '0')} ${currentMonthShort} ${targetCutoffYear}`,
          dayName,
          shift: isSun ? 'C1 (08:00 - 16:20)' : (matchedLog?.shiftCode || shiftCode),
          otHours: otHoursVal,
          otHoursFormatted: `${otHoursVal.toFixed(1)} hrs`,
          remarks: remarks || `${shiftCode} Overtime`,
        });
      }
    }

    // Also include any OT recorded on days 20..31 of the currently selected month if not already in otLogs,
    // so if the user recorded OT on any day of the selected month, the OT sheet is never empty!
    for (let d = 20; d <= currentMonthConfig.days; d++) {
      const matchedLog = storedLogs.find((l: any) => l.dayNum === d && (l.month === undefined || l.month === selectedMonth));
      if (matchedLog) {
        const rawOt = typeof matchedLog.otHours === 'number' ? matchedLog.otHours : parseFloat(String(matchedLog.otHours || '0')) || 0;
        if (rawOt > 0) {
          const dStr = `${String(d).padStart(2, '0')} ${currentMonthConfig.name.slice(0, 3)} ${selectedYear}`;
          if (!otLogs.some((existing) => existing.dateStr === dStr)) {
            const dateObj = new Date(selectedYear, selectedMonth, d);
            otLogs.push({
              slNo: sl++,
              dayNumber: d,
              dateStr: dStr,
              dayName: dayNames[dateObj.getDay()],
              shift: matchedLog.shiftCode || matchedLog.shift || 'A2',
              otHours: rawOt,
              otHoursFormatted: `${rawOt.toFixed(1)} hrs`,
              remarks: matchedLog.notes || 'Overtime Duty',
            });
          }
        }
      }
    }

    const totalOtHours = otLogs.reduce((acc, row) => acc + row.otHours, 0);

    return {
      employeeName: currentUser?.name || 'Prathyush Mohan K',
      tokenNumber: currentUser?.token || '5312',
      department: currentUser?.department || 'Hull Errection',
      category: isContract ? 'Company on Contract Employee (CSL)' : 'Permanent Employee (CSL)',
      currentMonthName: targetCutoffMonthConfig.name,
      currentMonthYear: targetCutoffYear,
      nextMonthName,
      nextMonthYear,
      cyclePeriod,
      totalOtHours,
      totalOtDays: otLogs.length,
      otLogs,
    };
  };

  const handleDownloadNextMonthOtPdf = async () => {
    setIsDownloadingOtPdf(true);
    try {
      const data = prepareNextMonthOtPdfData();
      const ok = await generateAndDownloadNextMonthOtPdf(data);
      if (ok) {
        setOtDownloadSuccess(true);
        setTimeout(() => setOtDownloadSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error downloading Next Month OT PDF:', err);
    } finally {
      setIsDownloadingOtPdf(false);
    }
  };

  const handleShareNextMonthOtPdf = async () => {
    setIsDownloadingOtPdf(true);
    try {
      const data = prepareNextMonthOtPdfData();
      const res = await shareNextMonthOtPdf(data);
      if (res.success) {
        setOtDownloadSuccess(true);
        setTimeout(() => setOtDownloadSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error sharing Next Month OT PDF:', err);
    } finally {
      setIsDownloadingOtPdf(false);
    }
  };

  const handleWhatsAppNextMonthOtShare = () => {
    // Open the exact visual register sheet where it is shared directly as a PHOTO to WhatsApp (no text words)
    setShowInAppOtPdfViewer(true);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col justify-start overflow-hidden bg-radial from-[#041d2e] via-[#03131f] to-[#010911] text-white">
      {/* Background Tugboat & Shipyard maritime atmosphere matching Previous Page */}
      <CslTugBackground />

      {/* Main Foreground Container */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-5 sm:py-7 flex flex-col justify-start">
        {/* Top Brand Header with CSL Emblem & Back Pill Button (Matching Previous Page) */}
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleCalendarLogoClick}
              className="cursor-pointer active:scale-95 transition-transform shrink-0"
              title="CSL Emblem"
              aria-label="CSL Crest"
            >
              <div className="p-0.5 rounded-full ring-2 ring-amber-500/70 bg-[#061522] shadow-[0_0_14px_rgba(245,158,11,0.25)]">
                <CslLogo size={44} />
              </div>
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate leading-snug">
                Cochin Shipyard Limited
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-300/80 tracking-wider uppercase truncate mt-0.5">
                A GOVERNMENT OF INDIA UNDERTAKING
              </p>
            </div>
          </div>

          {/* Top Right Action Group: Duty Register & Cyan Pill Back Button (Matching Previous Page) */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAttendance && (
              <button
                type="button"
                onClick={onOpenAttendance}
                className="px-3 py-1.5 rounded-full bg-[#06242e]/90 border border-teal-500/50 hover:bg-[#0a3543] text-teal-200 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
                <span className="hidden sm:inline">Duty</span> Log
              </button>
            )}

            <button
              type="button"
              onClick={onBackToQuickAccess}
              className="px-3.5 py-1.5 rounded-full bg-[#092a3a]/80 border border-cyan-500/60 text-white hover:bg-cyan-900/40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              title="Back to Quick Access"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Section Kicker with Amber Bar & Token Row */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-[3px] bg-amber-500 rounded-full shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
              {isMl ? 'സി.എസ്.എൽ വാൾ കലണ്ടർ · 2026' : `OFFICIAL WALL CALENDAR · ${selectedYear}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>{currentUser?.token || 'CSL'}</span>
            <span>·</span>
            <button
              type="button"
              onClick={onEditProfile || onBackToQuickAccess}
              className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer"
            >
              {isMl ? 'മാറ്റുക' : 'Change'}
            </button>
          </div>
        </div>

        {/* Dark Glassmorphic User Profile Badge Card (Matching Previous Page) */}
        <div className="bg-[#061825]/90 rounded-2xl p-3.5 sm:p-4 border border-[#0f354c] shadow-xl flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
              {(currentUser?.name || (isMl ? 'CSL ജീവനക്കാരൻ' : 'CSL Employee')).trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-white text-base sm:text-lg truncate">
                {currentUser?.name || (isMl ? 'CSL ജീവനക്കാരൻ' : 'CSL Employee')}
              </div>
              <div className="text-xs text-cyan-200/80 font-mono mt-0.5 truncate">
                {isMl ? 'കോഡ് നമ്പർ' : 'Code No'}: {currentUser?.token || 'CSL'} · {currentUser?.department || 'Hull & Outfitting Engineering'}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <span className="px-3 py-1 rounded-full bg-[#082a36] text-cyan-300 text-[11px] font-bold uppercase tracking-wider border border-cyan-500/40 shadow-xs">
              CALENDAR
            </span>
          </div>
        </div>

        {/* Hero Heading: Calendar. (Matching QuickAccess. exactly) */}
        <div className="mb-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-1 font-display">
            Calendar.
          </h2>
          <p className="text-slate-300/80 text-sm font-normal">
            {isMl 
              ? 'ഔദ്യോഗിക കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് വാൾ കലണ്ടർ, അവധികൾ & ഷിഫ്റ്റുകൾ.'
              : 'Official CSL Shipyard 2026 Wall Calendar & Shifts.'}
          </p>
        </div>

        {/* Dynamic Shift Rotation / C1 Fixed Mode Indicator Banner */}
        {isA2B2Shift ? (
          <div className="mb-3.5 bg-[#061825]/90 rounded-2xl p-3 sm:p-3.5 border border-cyan-500/40 shadow-xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 flex items-center justify-center shrink-0 font-bold font-mono text-xs shadow-xs">
                {activeShift}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {isMl ? 'A2 ⇄ B2 പ്രതിവാര റൊട്ടേഷൻ ആക്റ്റീവ്' : 'A2 ⇄ B2 Weekly Rotation Active'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {isMl ? 'അഡ്വാൻസ് കലണ്ടർ' : 'ADVANCE SCHEDULE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5 truncate">
                  {isMl
                    ? `കലണ്ടറിൽ ഓരോ ദിവസത്തെയും ഷിഫ്റ്റ് (A2, B2) അഡ്വാൻസായി രേഖപ്പെടുത്തിയിരിക്കുന്നു.`
                    : `Each working day shows scheduled rotation shift (A2/B2) in advance.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchActiveShift(activeShift === 'A2' ? 'B2' : 'A2')}
                className="px-2.5 py-1 rounded-lg bg-[#092a3a] hover:bg-cyan-900/50 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold cursor-pointer transition-all active:scale-95"
              >
                {activeShift === 'A2' ? 'Switch to B2' : 'Switch to A2'}
              </button>
              <button
                type="button"
                onClick={() => handleSwitchActiveShift('C1')}
                className="px-2.5 py-1 rounded-lg bg-[#041622] hover:bg-[#072437] border border-slate-600/60 text-slate-300 text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
                title="C1 ജനറൽ ഷിഫ്റ്റ്"
              >
                {isMl ? 'C1 ജനറൽ' : 'C1 General'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3.5 bg-[#061825]/90 rounded-2xl p-3 sm:p-3.5 border border-[#0f354c] shadow-xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center justify-center shrink-0 font-bold font-mono text-xs shadow-xs">
                C1
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {isMl ? 'C1 ജനറൽ ഷിഫ്റ്റ് (08:00 AM – 04:20 PM)' : 'C1 General Shift (08:00 AM – 04:20 PM)'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {isMl ? 'റൊട്ടേഷൻ ഇല്ല' : 'NO ROTATION'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5 truncate">
                  {isMl
                    ? 'ജനറൽ ഷിഫ്റ്റ് ആയതിനാൽ കലണ്ടറിൽ ഷിഫ്റ്റ് ചിഹ്നങ്ങൾ ഒഴിവാക്കിയിരിക്കുന്നു.'
                    : 'Fixed general shift: shift tags hidden from calendar dates.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchActiveShift('A2')}
                className="px-2.5 py-1 rounded-lg bg-[#00a8cc] hover:bg-[#0094b3] text-white text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                {isMl ? 'A2/B2 റൊട്ടേഷൻ ആക്കുക' : 'Enable A2/B2 Rotation'}
              </button>
            </div>
          </div>
        )}


        {/* 3 Main View Tabs Bar in Dark Glassmorphic Style */}
        <div className="rounded-2xl p-1.5 bg-[#061825]/90 border border-[#0f354c] shadow-lg mb-4 flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('wall')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'wall'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Wall Calendar (വാൾ കലണ്ടർ)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('months')}
              className={`px-2.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'months'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>12 Months</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('holidays')}
              className={`px-2.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'holidays'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>12 Holidays & Leaves</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-teal-300 px-2 py-1">
            {currentMonthConfig.name} {selectedYear}
          </div>
        </div>

        {/* Tab 1: Wall Calendar View (Authentic, Prestigious CSL 12-Page Wall Calendar) */}
        {activeTab === 'wall' && (
          <div className="space-y-0">
            {/* 1. Horizontal Month Carousel with Holidays Counter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {cslMonthsConfig.map((m, idx) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(idx);
                    setSelectedDate(idx === currentSystemDate.getMonth() ? currentSystemDate.getDate() : 1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedMonth === idx
                      ? 'bg-amber-500 text-slate-950 shadow-lg scale-105 font-black ring-2 ring-amber-400/50'
                      : isWhiteWall
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                      : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42] hover:text-white'
                  }`}
                >
                  <span>{m.name.slice(0, 3)}</span>
                  <span className="text-[10px] opacity-80">({m.malayalam.slice(0, 3)})</span>
                  {m.holidaysCount > 0 && (
                    <span className={`w-4 h-4 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                      selectedMonth === idx
                        ? 'bg-slate-950 text-amber-400'
                        : isWhiteWall
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                    }`}>
                      {m.holidaysCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 2. Sleek Month Header & Quick Navigation */}
            <div className={`rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border flex items-center justify-between gap-2.5 mb-3 shadow-md ${
              isWhiteWall
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#061825]/95 border-amber-500/40 backdrop-blur-md text-white'
            }`}>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isWhiteWall
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-[#092a3a]/90 hover:bg-[#0f3d53] border border-cyan-500/40 text-cyan-300'
                  }`}
                  title="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isWhiteWall
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-[#092a3a]/90 hover:bg-[#0f3d53] border border-cyan-500/40 text-cyan-300'
                  }`}
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center min-w-0 flex-1">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h3 className={`font-black text-base sm:text-lg tracking-wide uppercase ${
                    isWhiteWall ? 'text-slate-900' : 'text-white'
                  }`}>
                    {currentMonthConfig.name} {selectedYear}
                  </h3>
                  <span className={`font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full border ${
                    isWhiteWall
                      ? 'text-blue-700 bg-blue-50 border-blue-200'
                      : 'text-cyan-300 bg-cyan-950/80 border-cyan-500/30'
                  }`}>
                    {currentMonthConfig.malayalam} · {currentMonthConfig.hindi}
                  </span>
                </div>
                <div className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate ${
                  isWhiteWall ? 'text-amber-800' : 'text-amber-400'
                }`}>
                  കൊല്ലവർഷം {currentMonthConfig.kollavarshamEra} · {currentMonthConfig.workingDays} പ്രവൃത്തി ദിനങ്ങൾ · {currentMonthConfig.holidaysCount} അവധികൾ
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(currentSystemDate.getMonth());
                  setSelectedDate(currentSystemDate.getDate());
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 ${
                  isWhiteWall
                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700'
                    : 'bg-[#082a3a]/90 hover:bg-cyan-950 border border-cyan-400/50 text-cyan-300'
                }`}
                title="Jump to Today"
              >
                <span className={`w-2 h-2 rounded-full animate-ping shrink-0 ${isWhiteWall ? 'bg-blue-600' : 'bg-cyan-400'}`} />
                <span className="hidden sm:inline">ഇന്ന്</span>
                <span>Today ({currentSystemDate.getDate()})</span>
              </button>
            </div>

            {/* 3. Compact 1-Line Month Metrics Bar */}
            <div className={`rounded-xl px-3 py-2 border mb-3 flex items-center justify-between gap-1 overflow-x-auto text-[11px] ${
              isWhiteWall ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#071f30]/90 border-[#103a55] text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5 shrink-0 px-1.5">
                <span className="text-slate-400">{isMl ? 'ആകെ ദിനങ്ങൾ' : 'Days'}:</span>
                <span className={`font-extrabold ${isWhiteWall ? 'text-slate-900' : 'text-white'}`}>{currentMonthConfig.days}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-700/50 shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0 px-1.5">
                <span className={isWhiteWall ? 'text-emerald-700' : 'text-emerald-400'}>{isMl ? 'പ്രവൃത്തി' : 'Working'}:</span>
                <span className="font-extrabold text-emerald-400">{currentMonthConfig.workingDays}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-700/50 shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0 px-1.5">
                <span className={isWhiteWall ? 'text-emerald-700' : 'text-emerald-400'}>{isMl ? 'ഡ്യൂട്ടി' : 'Duty'}:</span>
                <span className="font-extrabold text-emerald-300">{presentDays.length}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-700/50 shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0 px-1.5">
                <span className={isWhiteWall ? 'text-amber-700' : 'text-amber-400'}>{isMl ? 'ലീവുകൾ' : 'Leaves'}:</span>
                <span className="font-extrabold text-amber-300">{totalLeavesCount}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-700/50 shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0 px-1.5">
                <span className={isWhiteWall ? 'text-rose-700' : 'text-rose-400'}>{isMl ? 'ഓഫുകൾ' : 'Offs'}:</span>
                <span className="font-extrabold text-rose-300">{currentMonthConfig.weeklyOffs}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-700/50 shrink-0" />
              <div 
                onClick={() => {
                  setActiveTab('holidays');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1 shrink-0 px-1.5 cursor-pointer hover:underline text-rose-400 font-bold"
                title="Click to view all 12 Gazetted Holidays"
              >
                <span>{isMl ? 'അവധി' : 'Holidays'}:</span>
                <span>{currentMonthConfig.holidaysCount}/12 ↗</span>
              </div>
            </div>

            {/* 4. Streamlined Filter Buttons & Legend Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 text-xs overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setDayFilter('all')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg font-bold text-center transition-all cursor-pointer shrink-0 ${
                    dayFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : isWhiteWall
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                  }`}
                >
                  All ({currentMonthConfig.days})
                </button>
                <button
                  type="button"
                  onClick={() => setDayFilter('duty')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg font-bold text-center transition-all cursor-pointer shrink-0 ${
                    dayFilter === 'duty'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : isWhiteWall
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                  }`}
                >
                  Duty ({presentDays.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDayFilter('leaves')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg font-bold text-center transition-all cursor-pointer shrink-0 ${
                    dayFilter === 'leaves'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : isWhiteWall
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                  }`}
                >
                  Leaves ({totalLeavesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDayFilter('holidays')}
                  className={`py-1.5 px-2.5 sm:px-3 rounded-lg font-bold text-center transition-all cursor-pointer shrink-0 ${
                    dayFilter === 'holidays'
                      ? 'bg-rose-600 text-white font-black shadow-xs'
                      : isWhiteWall
                      ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                  }`}
                >
                  Offs & Holidays
                </button>
              </div>

              {/* Compact Legend Dots */}
              <div className={`flex items-center gap-2 text-[10px] sm:text-[11px] flex-wrap ${
                isWhiteWall ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  <span>{isMl ? 'ഹാജർ' : 'Duty'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>CL</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                  <span>EL</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                  <span>HPL</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                  <span>Special</span>
                </span>
                <span className={`flex items-center gap-1 font-bold ${isWhiteWall ? 'text-rose-600' : 'text-rose-400'}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>{isMl ? 'അവധി' : 'Holiday'}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>⚡ {isMl ? 'OT മണിക്കൂർ' : 'OT Hours'}</span>
                </span>
                {isA2B2Shift && (
                  <>
                    <span className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      <span>A2 (07:00 AM)</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                      <span>B2 (01:40 PM)</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Monthly Calendar Grid Container */}
            <div className={`rounded-2xl sm:rounded-3xl p-3 sm:p-4 border mb-4 ${
              isWhiteWall
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-[#061825]/95 border-[#0f354c] shadow-xl backdrop-blur-md'
            }`}>
              {/* Day of Week Headers */}
              <div className={`grid grid-cols-7 text-center font-bold text-xs mb-2 ${
                isWhiteWall ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <span className="text-rose-600 font-extrabold">SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-sm">
                {/* Empty cells before start of month */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className={`min-h-[50px] sm:min-h-[54px] rounded-xl border ${
                    isWhiteWall ? 'bg-slate-50/70 border-slate-100' : 'bg-white/[0.03] border-white/5'
                  }`} />
                ))}

                {/* Calendar Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isPresent = isPresentDay(dayNum);
                  const isLeave = isLeaveDay(dayNum);
                  const dayLeave = isLeave ? getDayLeave(dayNum) : null;
                  const leaveType = dayLeave?.type || 'CL';
                  const leaveCfg = CSL_LEAVE_TYPES_MAP[leaveType] || CSL_LEAVE_TYPES_MAP.CL;
                  const isSun = isSunday(dayNum);
                  const isSatOff = isSaturdayOff(dayNum);
                  const isOff = isSun || isSatOff || isCslHoliday(dayNum);
                  const isSelected = selectedDate === dayNum;
                  const currentDay = currentSystemDate.getDate();
                  const currentMonth = currentSystemDate.getMonth();
                  const currentYear = currentSystemDate.getFullYear();
                  const isToday = selectedYear === currentYear && selectedMonth === currentMonth && dayNum === currentDay;
                  const hasHoliday = (selectedMonth === 9 && [2, 21].includes(dayNum)) || 
                    cslOfficial12Holidays2026.some(h => h.monthIndex === selectedMonth && parseInt(h.date, 10) === dayNum);

                  const cellDate = new Date(selectedYear, selectedMonth, dayNum);
                  const todayMidnight = new Date(currentYear, currentMonth, currentDay);
                  const isPast = cellDate.getTime() < todayMidnight.getTime();
                  const scheduledShift = getEffectiveShiftForDate(cellDate, dayShifts[dayNum]);

                  // Day attendance & Overtime (OT) lookup
                  // STRICT RULE: Overtime (OT) is ONLY applicable and displayed when the employee was actually present on duty (isPresent === true).
                  // If not present (holiday off, Sunday off, leave, or unworked day), dayOtHours is ALWAYS 0!
                  let dayOtHours = 0;
                  if (isPresent) {
                    const dayRecord = getDayAttendanceRecord(dayNum);
                    if (dayRecord && dayRecord.otHours !== undefined && dayRecord.otHours !== null) {
                      if (typeof dayRecord.otHours === 'number') {
                        dayOtHours = dayRecord.otHours;
                      } else {
                        dayOtHours = parseFloat(String(dayRecord.otHours)) || 0;
                      }
                    }

                    // When attended / marked present on Sunday or Holiday without custom OT hours, 8.0 hrs Holiday OT
                    if ((isSun || hasHoliday) && dayOtHours === 0) {
                      dayOtHours = 8.0;
                    }
                  }

                  // Apply filter visibility
                  let isDimmed = false;
                  if (dayFilter === 'duty' && !isPresent) isDimmed = true;
                  if (dayFilter === 'leaves' && !isLeave) isDimmed = true;
                  if (dayFilter === 'holidays' && !isOff) isDimmed = true;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dayNum);
                        setShowNoteInput(false);
                        setShowWorkInput(false);
                      }}
                      className={`min-h-[50px] sm:min-h-[54px] rounded-xl flex items-center justify-center font-bold text-sm sm:text-base transition-all cursor-pointer relative select-none py-1 ${
                        isDimmed ? 'opacity-20' : ''
                      } ${
                        isSelected
                          ? isWhiteWall
                            ? 'ring-2 ring-slate-900 ring-offset-2 ring-offset-white z-10 scale-105 shadow-md'
                            : 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#061825] z-10 scale-105 shadow-xl'
                          : ''
                      } ${
                        isPresent
                          ? 'bg-[#86efac] text-emerald-950 font-black shadow-md hover:bg-[#6ee7b7] border border-emerald-400'
                          : isLeave
                          ? `${leaveCfg.tileBg} ${leaveCfg.tileText} shadow-md border ${leaveCfg.tileBorder}`
                          : isSun || hasHoliday
                          ? isWhiteWall
                            ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 font-black border border-rose-200'
                            : 'text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 font-black border border-rose-800/40'
                          : isSatOff
                          ? isWhiteWall
                            ? 'text-rose-600 bg-rose-50/60 hover:bg-rose-100 font-bold border border-rose-200'
                            : 'text-rose-200 bg-rose-950/25 hover:bg-rose-900/40 font-bold border border-rose-800/30'
                          : isWhiteWall
                          ? 'text-slate-800 bg-slate-50 hover:bg-slate-100 font-bold border border-slate-200 shadow-2xs'
                          : 'text-slate-200 bg-[#082235]/70 hover:bg-[#0e334d] font-semibold border border-[#0e3046]/40'
                      } ${
                        isToday && !isPresent && !isLeave
                          ? isWhiteWall
                            ? 'border-2 border-blue-500 shadow-sm font-black text-blue-700 ring-2 ring-blue-300/60 bg-blue-50/50'
                            : 'border-2 border-cyan-400 shadow-md font-black text-cyan-300 ring-1 ring-cyan-300'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center leading-none w-full px-0.5">
                        <span className={isPresent && dayOtHours > 0 ? 'text-xs sm:text-sm font-black' : ''}>{dayNum}</span>
                        {isPresent && dayOtHours > 0 ? (
                          <div className="flex items-center justify-center mt-0.5 leading-none">
                            <span className="text-[7px] sm:text-[7.5px] font-black font-mono px-1 py-0.5 rounded shadow-2xs flex items-center gap-0.5 bg-amber-400 text-slate-950 font-black">
                              <span>⚡</span>
                              <span>{dayOtHours}h OT</span>
                            </span>
                          </div>
                        ) : isLeave ? (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="text-[7.5px] font-black tracking-tight leading-none opacity-90">
                              {leaveType}{dayLeave?.duration?.includes('Half') ? '½' : ''}
                            </span>
                          </div>
                        ) : isA2B2Shift && !isPast && !isSun && !isSatOff && !hasHoliday ? (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <span className={`text-[7px] sm:text-[7.5px] font-black font-mono leading-none tracking-tight px-1 py-0.2 rounded ${
                              isPresent
                                ? 'bg-emerald-950/25 text-emerald-950'
                                : scheduledShift === 'A2'
                                ? 'text-amber-300 bg-amber-950/50 border border-amber-500/30'
                                : 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/30'
                            }`}>
                              {scheduledShift}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      {isToday && (
                        <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full animate-ping ${
                          isWhiteWall ? 'bg-blue-600' : 'bg-cyan-400'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          {/* Selected Day Full Activity & Details Log (Requested by user) */}
          {selectedDate && (() => {
            const details = getDayDetails(selectedDate);
            const isOct2 = selectedMonth === 9 && selectedDate === 2;

            return (
              <div className="bg-[#061825]/95 rounded-3xl p-4 sm:p-5 border border-[#0f354c] shadow-2xl mb-4 space-y-3.5 transition-all backdrop-blur-md text-white">
                {/* 1. Header with Full Date, Malayalam Day, & Status Badges */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#0f354c] flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-white tracking-tight">
                        {details.day} {currentMonthConfig.name} {selectedYear}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-teal-300">
                        · {details.nameEn} ({details.nameMl})
                      </span>
                      {details.isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wide">
                          🔵 TODAY (ഇന്ന്)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Cochin Shipyard Limited · Official Daily Register & Activity Log
                    </p>
                  </div>

                  {/* Primary Status Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {details.isPresent ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-black flex items-center gap-1 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{isMl ? 'ഹാജർ' : 'PRESENT'}</span>
                      </span>
                    ) : details.isLeave ? (() => {
                      const dayLeave = details.leaveDetails || getDayLeave(details.day);
                      const lType = dayLeave?.type || 'CL';
                      const cfg = CSL_LEAVE_TYPES_MAP[lType] || CSL_LEAVE_TYPES_MAP.CL;
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md border ${cfg.badgeClass}`}>
                          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>LEAVE ({cfg.badgeShort}{dayLeave?.duration?.includes('Half') ? ' · ½' : ''})</span>
                        </span>
                      );
                    })() : details.holidayInfo ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-md ${
                        details.holidayInfo.isNational
                          ? 'bg-amber-950/80 border border-amber-400 text-amber-300'
                          : 'bg-rose-950/80 border border-rose-400 text-rose-300'
                      }`}>
                        <Flag className="w-3.5 h-3.5" />
                        <span>{details.holidayInfo.badge}</span>
                      </span>
                    ) : details.isSun ? (
                      <span className="px-3 py-1 rounded-full bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-bold shadow-md">
                        ☀️ SUNDAY OFF
                      </span>
                    ) : details.isSatOff ? (
                      <span className="px-3 py-1 rounded-full bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-bold shadow-md">
                        🏢 {details.isSecondSat ? '2nd' : '4th'} SATURDAY OFF
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-[#092233] border border-[#144766] text-slate-300 text-xs font-bold shadow-md">
                        ⚪ NOT MARKED
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Special Holiday Spotlight Banner (Specifying October 2 Gandhi Jayanthi in detail!) */}
                {details.holidayInfo && (
                  <div className={`rounded-2xl p-3.5 sm:p-4 border shadow-md ${
                    details.holidayInfo.isNational
                      ? 'bg-gradient-to-br from-[#1d1203] via-[#150d03] to-[#0a0702] border-amber-500/50 text-amber-200'
                      : 'bg-gradient-to-br from-[#240a12] via-[#1a070d] to-[#0d0306] border-rose-500/50 text-rose-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md text-lg ${
                        details.holidayInfo.isNational ? 'bg-amber-400 text-amber-950 font-black' : 'bg-rose-500 text-white'
                      }`}>
                        {isOct2 ? '🇮🇳' : '🎉'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                            {details.holidayInfo.name}
                          </h4>
                          <span className="text-xs sm:text-sm font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md">
                            ({details.holidayInfo.malayalamName})
                          </span>
                          {details.holidayInfo.hindiName && (
                            <span className="text-[11px] font-semibold text-slate-400">
                              [{details.holidayInfo.hindiName}]
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-semibold mt-1">
                          {details.holidayInfo.significance}
                        </p>
                        <div className="mt-2.5 text-xs bg-[#061825]/90 rounded-xl p-3 border border-[#0f354c] text-slate-200 space-y-2">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>CSL Shipyard Circular & Operational Status:</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {details.holidayInfo.yardNotice}
                          </p>
                          {details.holidayInfo.events.length > 0 && (
                            <div className="pt-2 border-t border-[#0f354c]">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                                അന്നത്തെ പ്രധാന സംഭവങ്ങൾ & പരിപാടികൾ (Day Schedule & Highlights):
                              </span>
                              <ul className="space-y-1.5 text-[11px] text-slate-300">
                                {details.holidayInfo.events.map((ev, eIdx) => (
                                  <li key={eIdx} className="flex items-start gap-1.5">
                                    <span className="text-amber-400 font-black shrink-0">•</span>
                                    <span>{ev}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Sunday / Saturday Off Spotlight */}
                {(details.isSun || details.isSatOff) && !details.holidayInfo && (
                  <div className="rounded-2xl p-3 bg-rose-950/40 border border-rose-800/50 text-xs text-rose-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-100">
                        {details.isSun ? 'Sunday Weekly Off (ഞായറാഴ്ച പ്രതിവാര അവധി)' : 'CSL 2nd/4th Saturday Off (പ്രതിമാസ ശനിയാഴ്ച അവധി)'}
                      </div>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">
                        ഷിപ്പ്‌യാർഡ് ജനറൽ ഷിഫ്റ്റുകൾക്ക് അവധിയാണ്. ഡ്രൈ ഡോക്ക് ക്രൂ, ഫയർ & സേഫ്റ്റി, സെക്യൂരിറ്റി ഒഴികെയുള്ള ജീവനക്കാർക്ക് വിശ്രമദിനം.
                      </p>
                    </div>
                  </div>
                )}



                {/* 4. Attendance & Duty Log Section */}
                <div className="rounded-2xl p-3.5 sm:p-4 bg-[#082030]/90 border border-[#113e5e] text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isMl ? 'ഹാജർ & ഷിഫ്റ്റ് വിവരങ്ങൾ' : 'Attendance & Shift Duty'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {isMl ? 'കോഡ് നമ്പർ' : 'Code No'}: {currentUser?.token || 'CSL'}
                    </span>
                  </div>

                  {/* If Marked Present */}
                  {details.isPresent && (() => {
                    const isSun = isSundayDate(new Date(selectedYear, selectedMonth, details.day));
                    const holInfo = isCslHolidayDate(new Date(selectedYear, selectedMonth, details.day));
                    const isHol = isSun || holInfo.isHoliday;
                    // Rule 1: Every Sunday, if there is work, the shift is C1 (08:00 AM - 04:20 PM)
                    const currentShift = getEffectiveShiftForDate(
                      new Date(selectedYear, selectedMonth, details.day),
                      dayShifts[details.day]
                    );
                    const def = CSL_SHIFTS[currentShift];

                    return (
                      <div className="bg-[#052621]/90 rounded-xl p-3 border border-emerald-500/40 space-y-2.5">
                        {/* Sunday C1 Shift Rule / Holiday Overtime Alert Banner */}
                        {isSun && (
                          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/50 text-amber-200 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300">
                              <span className="text-sm">⚡</span>
                              <span>{isMl ? 'എല്ലാ ഞായറാഴ്ചയും വർക്ക് C1 ഷിഫ്റ്റ് (08:00 AM - 04:20 PM) ആയിരിക്കും' : 'Sunday Work: Shift C1 (08:00 AM - 04:20 PM)'}</span>
                            </div>
                            <p className="text-[10px] text-amber-100/90 leading-tight">
                              {isMl 
                                ? 'മാത്രമല്ല ഞായറാഴ്ച / ഹോളിഡേ വർക്ക് ചെയ്താൽ മുഴുവൻ സമയവും ഓവർടൈം (Holiday OT) ആയിരിക്കും.' 
                                : 'Working on Sunday/Holiday is credited completely as Overtime (Holiday OT).'}
                            </p>
                          </div>
                        )}

                        {holInfo.isHoliday && !isSun && (
                          <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-rose-500/20 border border-rose-400/50 text-rose-200 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-rose-300">
                              <span className="text-sm">🏖️</span>
                              <span>{holInfo.holidayNameMl || holInfo.holidayName} · {isMl ? 'ഹോളിഡേ ഡ്യൂട്ടി' : 'Holiday Duty'}</span>
                            </div>
                            <p className="text-[10px] text-rose-100/90 leading-tight">
                              {isMl 
                                ? 'ഹോളിഡേ വർക്ക് ചെയ്താൽ മുഴുവൻ സമയവും ഓവർടൈം (Holiday OT) ആയി കണക്കാക്കും.' 
                                : 'Holiday work is credited completely as Overtime (Holiday OT).'}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{isMl ? (isHol ? 'ഹോളിഡേ ഡ്യൂട്ടി പ്രസന്റ്' : 'ഡ്യൂട്ടി പ്രസന്റ്') : (isHol ? 'Holiday Duty Present' : 'Duty Attended & Verified')}</span>
                          </span>
                          <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-200 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono">
                            {def.name} ({def.inTime} – {def.outTime})
                          </span>
                        </div>

                        {/* CSL Shift Selector Pills for this day */}
                        <div className="pt-1">
                          <div className="text-[10px] font-bold text-slate-300 mb-1">
                            {isMl ? 'CSL ഷിഫ്റ്റ് മാറ്റുക:' : 'Switch CSL Shift:'}
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {CSL_SHIFT_CODES.map((code) => {
                              const sDef = CSL_SHIFTS[code];
                              const isCur = currentShift === code;
                              return (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => handleSetDayShift(details.day, code)}
                                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center border cursor-pointer ${
                                    isCur
                                      ? 'bg-emerald-600 text-slate-950 font-black border-emerald-400 shadow-md'
                                      : 'bg-[#061825]/90 hover:bg-[#0c2e42] text-slate-300 border-[#0f354c]'
                                  }`}
                                  title={`${sDef.name}: ${sDef.inTime} - ${sDef.outTime}`}
                                >
                                  <span className="block">{code}</span>
                                  <span className="text-[8px] font-mono block opacity-90 truncate">{sDef.inTime.replace(' ', '')}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Biometric Punch In / Out details */}
                        {(() => {
                          let dayRecord: any = null;
                          try {
                            const saved = localStorage.getItem(monthLogsKey) || (selectedMonth === getIstDate().getMonth() ? localStorage.getItem('csl_attendance_daily_logs_v2') : null);
                            if (saved) {
                              const logs = JSON.parse(saved);
                              dayRecord = logs.find((r: any) => r.dayNum === details.day);
                            }
                          } catch {}

                          const isPunchedToday = details.isToday && localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(details.day).padStart(2, '0')}`;
                          const punchStateNow = localStorage.getItem('csl_punch_state');
                          const todayInTime = localStorage.getItem('csl_today_punch_in_time') || localStorage.getItem('csl_last_punch_time');
                          const todayOutTime = localStorage.getItem('csl_today_punch_out_time');

                          let dayOtHours = 0;
                          if (dayRecord && dayRecord.otHours !== undefined && dayRecord.otHours !== null) {
                            if (typeof dayRecord.otHours === 'number') {
                              dayOtHours = dayRecord.otHours;
                            } else {
                              dayOtHours = parseFloat(String(dayRecord.otHours)) || 0;
                            }
                          }
                          if (isSun && dayOtHours === 0) dayOtHours = 8.0;
                          if (holInfo.isHoliday && dayOtHours === 0) dayOtHours = 8.0;

                          const inTimeDisplay = dayRecord?.inTime && dayRecord.inTime !== '—'
                            ? dayRecord.inTime
                            : (details.isToday
                                ? (isPunchedToday ? (todayInTime && todayInTime !== '—' ? todayInTime : def.inTime) : def.inTime)
                                : def.inTime);

                          let outTimeDisplay = dayRecord?.outTime && dayRecord.outTime !== '—'
                            ? dayRecord.outTime
                            : (details.isToday
                                ? (punchStateNow === 'in'
                                    ? '● On Duty'
                                    : todayOutTime || (isMl ? '— (ഡ്യൂട്ടി കഴിഞ്ഞു പഞ്ച് ചെയ്യുക)' : '— (Pending Punch Out)'))
                                : (isSun ? '04:20 PM' : (details.day < 16 ? def.outTime : '—')));

                          if (dayOtHours > 0 && (!outTimeDisplay || outTimeDisplay === '—' || outTimeDisplay === '— (Pending Punch Out)')) {
                            if (isSun) {
                              outTimeDisplay = '04:20 PM';
                            } else {
                              outTimeDisplay = '05:20 PM';
                            }
                          }

                          return (
                            <div className="space-y-2.5 pt-1">
                              {/* ⚡ Overtime (OT) Hours Showcase Banner (User Request: OT hours only) */}
                              {dayOtHours > 0 && (
                                <div className="rounded-xl p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/15 border-2 border-amber-400/80 shadow-lg">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                                        ⚡
                                      </span>
                                      <div>
                                        <span className="text-xs sm:text-sm font-black text-amber-300 tracking-tight block">
                                          {isMl ? 'ഓവർടൈം (OT) മണിക്കൂറുകൾ' : 'Overtime (OT) Hours'}
                                        </span>
                                        <span className="text-[10px] text-amber-200/90 font-medium">
                                          {isSun
                                            ? (isMl ? 'ഞായറാഴ്ച ഫുൾ ഡ്യൂട്ടി ഹോളിഡേ OT' : 'Sunday Full Duty Holiday Overtime')
                                            : (isMl ? 'അംഗീകരിച്ച ആകെ OT ക്ലെയിം' : 'Authorized Overtime Claim')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs sm:text-sm font-black font-mono shadow-md">
                                        ⚡ {dayOtHours.toFixed(1)} hrs OT
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                <div className="bg-[#061825]/90 rounded-lg p-2 border border-[#0f354c]">
                                  <span className="text-slate-400 text-[10px] block font-bold">{isMl ? 'പഞ്ച്-ഇൻ' : 'Punch In'}</span>
                                  <span className="font-bold text-white font-mono">
                                    {inTimeDisplay}
                                  </span>
                                  <span className="text-[9px] text-teal-300 block truncate">
                                    {isMl ? `ഗ്രേസ്: ${def.graceDeadline} വരെ (+5m)` : `Grace: up to ${def.graceDeadline} (+5m)`}
                                  </span>
                                </div>
                                <div className={`rounded-lg p-2 border ${
                                  dayOtHours > 0
                                    ? 'bg-amber-950/40 border-amber-400/80 ring-1 ring-amber-400/50'
                                    : 'bg-[#061825]/90 border-[#0f354c]'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-[10px] block font-bold">{isMl ? 'പഞ്ച്-ഔട്ട്' : 'Punch Out'}</span>
                                    {dayOtHours > 0 && (
                                      <span className="text-[8px] font-black text-amber-300 bg-amber-950 px-1 py-0.2 rounded font-mono border border-amber-500/50">
                                        +{dayOtHours}h OT
                                      </span>
                                    )}
                                  </div>
                                  <span className={`font-bold font-mono text-xs sm:text-sm ${dayOtHours > 0 ? 'text-amber-200 font-black' : 'text-white'}`}>
                                    {outTimeDisplay}
                                  </span>
                                  <span className="text-[9px] text-amber-300 block truncate font-medium">
                                    {dayOtHours > 0 ? `+${dayOtHours.toFixed(1)}h OT ക്രെഡിറ്റ്` : (details.isToday && todayOutTime 
                                      ? 'Recorded Biometric' 
                                      : dayRecord?.notes 
                                      ? dayRecord.notes 
                                      : (isMl ? `ഗ്രേസ്: ${def.earlyOutGraceTime} മുതൽ (-5m)` : `Grace: from ${def.earlyOutGraceTime} (-5m)`))}
                                  </span>
                                </div>
                                <div className="bg-[#061825]/90 rounded-lg p-2 border border-[#0f354c]">
                                  <span className="text-slate-400 text-[10px] block font-bold">Shift Duration</span>
                                  <span className="font-bold text-teal-300 font-mono">{def.duration}</span>
                                  <span className="text-[9px] text-emerald-400 block font-semibold">CSL Scheduled</span>
                                </div>
                                <div className="bg-[#061825]/90 rounded-lg p-2 border border-[#0f354c]">
                                  <span className="text-slate-400 text-[10px] block font-bold">BAS Status</span>
                                  <span className="font-bold text-emerald-400 font-mono">VERIFIED</span>
                                  <span className="text-[9px] text-slate-400 block">UIDAI Aadhaar</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Permanent Employee 5-Minute Grace Time Notice (In & Out Grace) */}
                        <div className="p-2.5 rounded-xl bg-teal-950/70 border border-teal-500/40 text-xs text-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="font-bold">പെർമനന്റ് ജീവനക്കാർക്ക് 5 മിനിറ്റ് ഗ്രേസ് ടൈം (Permanent Grace):</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                            <span className="font-bold text-emerald-200 bg-teal-900 px-2 py-0.5 rounded-md border border-teal-600/50">
                              ഇൻ: {def.graceDeadline} വരെ (+5m)
                            </span>
                            <span className="font-bold text-teal-200 bg-teal-900 px-2 py-0.5 rounded-md border border-teal-600/50">
                              ഔട്ട്: {def.earlyOutGraceTime} മുതൽ (-5m നേരത്തെ)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                          <div className="flex items-center gap-3 flex-wrap">
                            {onOpenAttendance && (
                              <button
                                type="button"
                                onClick={onOpenAttendance}
                                className="text-[10px] font-bold text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <ClipboardCheck className="w-3 h-3 text-cyan-400" />
                                <span>{isMl ? 'ബയോമെട്രിക് രജിസ്റ്ററിൽ കാണുക' : 'View in Biometric Register'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenCalendarDutyPunch(details.day)}
                              className="text-[10px] font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3 text-amber-400" />
                              <span>{isMl ? 'സമയം തിരുത്തുക (Edit Punch)' : 'Edit Punch Times'}</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePresent(details.day)}
                            className="text-[10px] font-bold text-rose-300 hover:text-rose-100 flex items-center gap-1 cursor-pointer bg-[#240a12] px-2.5 py-1 rounded-lg border border-rose-700/50 shadow-md ml-auto"
                          >
                            <X className="w-3 h-3" />
                            <span>{isMl ? 'ഹാജർ ഒഴിവാക്കുക' : 'Remove Present Status'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* If Marked Leave (CL, EL, HPL, Special Leave) */}
                  {details.isLeave && (() => {
                    const dayLeave = details.leaveDetails || getDayLeave(details.day);
                    const lType: CslLeaveType = dayLeave?.type || 'CL';
                    const cfg = CSL_LEAVE_TYPES_MAP[lType] || CSL_LEAVE_TYPES_MAP.CL;

                    return (
                      <div className={`rounded-2xl p-3.5 sm:p-4 border shadow-xl space-y-3 ${cfg.colorBg} ${cfg.colorBorder} transition-all`}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md border ${cfg.badgeClass}`}>
                              {lType}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-black text-sm sm:text-base ${cfg.colorText}`}>
                                  {isMl ? cfg.nameMl : cfg.nameEn}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/50 text-white border border-white/20">
                                  {dayLeave?.duration || 'Full Day'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 font-medium">
                                {isMl ? `${cfg.nameEn} രേഖപ്പെടുത്തി` : `Official ${cfg.nameEn} Recorded`}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>CSL Sanctioned</span>
                          </span>
                        </div>

                        {/* Leave quota deduction & rule explanation */}
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs">
                          <div className="text-[11px] font-bold text-slate-200 leading-relaxed">
                            {cfg.ruleNotice}
                          </div>
                          {dayLeave?.reason && (
                            <div className="text-[11px] text-amber-200/90 italic pt-0.5 flex items-start gap-1">
                              <span className="font-semibold not-italic text-slate-400">{isMl ? 'കാരണം:' : 'Reason:'}</span>
                              <span>"{dayLeave.reason}"</span>
                            </div>
                          )}
                          {dayLeave?.medicalCert && (
                            <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 pt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{isMl ? 'മെഡിക്കൽ സർട്ടിഫിക്കറ്റ് അറ്റാച്ച് ചെയ്തിട്ടുണ്ട് (Commuted to Full Pay)' : 'Medical Certificate Attached (Commuted to Full Pay)'}</span>
                            </div>
                          )}
                          {dayLeave?.specialOccasion && lType === 'SCL' && (
                            <div className="text-[10px] text-purple-300 font-bold flex items-center gap-1 pt-0.5">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>{isMl ? `പ്രത്യേക അവസരം: ${dayLeave.specialOccasion}` : `Occasion: ${dayLeave.specialOccasion}`}</span>
                            </div>
                          )}
                        </div>

                        {/* Switch Leave Type or Cancel */}
                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-bold">{isMl ? 'തരം മാറ്റുക:' : 'Change Type:'}</span>
                            {((isContract ? ['CL', 'ML'] : ['CL', 'EL', 'HPL', 'ML', 'SCL']) as CslLeaveType[]).map((tCode) => {
                              if (tCode === lType) return null;
                              const c = CSL_LEAVE_TYPES_MAP[tCode];
                              return (
                                <button
                                  key={tCode}
                                  type="button"
                                  onClick={() => handleApplyLeave(details.day, tCode, dayLeave?.duration, dayLeave?.reason, dayLeave?.medicalCert, dayLeave?.specialOccasion)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer hover:scale-105 active:scale-95 ${c.badgeClass}`}
                                  title={tCode === 'ML' ? (isContract ? 'Medical Leave' : 'Medical Leave (Deducted from EL)') : c.nameEn}
                                >
                                  {c.badgeShort}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLeave(details.day)}
                            className="text-[10px] font-bold text-rose-300 hover:text-white flex items-center gap-1 cursor-pointer bg-rose-950/80 hover:bg-rose-900 px-3 py-1.5 rounded-lg border border-rose-500/50 shadow-md ml-auto active:scale-95 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{isMl ? 'ലീവ് ഒഴിവാക്കുക' : 'Cancel Leave'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* If NOT marked */}
                  {!details.isPresent && !details.isLeave && (
                    <div className="space-y-3">
                      {details.isToday && (
                        <div className="bg-cyan-950/40 rounded-xl p-3 border border-cyan-500/40 text-cyan-200 space-y-1">
                          <div className="font-bold text-cyan-100 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>{isMl ? `ഇന്ന് ${details.day} ${currentMonthConfig.name} ${selectedYear} (Today) · പഞ്ചിങ് ചെയ്തിട്ടില്ല` : `Today ${details.day} ${currentMonthConfig.name} ${selectedYear} · Not Punched In`}</span>
                          </div>
                          <p className="text-[11px] text-cyan-300/90 leading-relaxed">
                            {isMl ? 'താങ്കൾ ഇന്ന് ഇതുവരെ പഞ്ചിങ് ചെയ്തിട്ടില്ല. പഞ്ചിങ് ചെയ്യുമ്പോൾ മാത്രമേ കലണ്ടറിൽ പച്ച കളർ (Green) കാണിക്കൂ. ഹാജർ രേഖപ്പെടുത്താൻ താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്ത് പഞ്ച്-ഇൻ ചെയ്യാം:' : 'You have not punched in today yet. Calendar highlights green once attendance is recorded. Click below to punch in:'}
                          </p>
                        </div>
                      )}

                      {!details.isToday && !details.holidayInfo && !details.isSun && !details.isSatOff && (
                        <p className="text-[11px] text-slate-400">
                          {details.isPast
                            ? (isMl ? 'കഴിഞ്ഞ ജോലി ദിവസം · ഇതുവരെ ഹാജർ രേഖപ്പെടുത്തിയിട്ടില്ല.' : 'Past Working Day · Attendance not recorded.')
                            : (isMl ? 'ജോലി ദിവസം · ഇതുവരെ ഹാജർ രേഖപ്പെടുത്തിയിട്ടില്ല.' : 'Working Day · Attendance not yet recorded.')}
                        </p>
                      )}

                      {/* Current Scheduled Shift & 1-Tap Shift Corrector (Syncs Calendar + CSL Duty Shift + Attendance) */}
                      {(() => {
                        const dayDateObj = new Date(selectedYear, selectedMonth, details.day);
                        const dayScheduledShift = getEffectiveShiftForDate(dayDateObj, dayShifts[details.day]);
                        const dayShiftDef = CSL_SHIFTS[dayScheduledShift] || CSL_SHIFTS['A2'];
                        return (
                          <div className="p-3 rounded-xl bg-[#051d2d] border border-cyan-500/40 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>
                                  {isMl
                                    ? 'കലണ്ടർ ഷിഫ്റ്റ് (CSL Duty Shift & Attendance-ലേക്കും ഒരേപോലെ സിങ്ക് ആകും):'
                                    : 'Calendar Shift (Syncs to CSL Duty Shift & Attendance):'}
                                </span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[10px]">
                                {dayShiftDef.name} ({dayShiftDef.inTime} – {dayShiftDef.outTime})
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {CSL_SHIFT_CODES.map((code) => {
                                const sDef = CSL_SHIFTS[code];
                                const isCur = dayScheduledShift === code;
                                return (
                                  <button
                                    key={code}
                                    type="button"
                                    onClick={() => handleSetDayShift(details.day, code)}
                                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center border cursor-pointer ${
                                      isCur
                                        ? 'bg-emerald-500 text-slate-950 font-black border-emerald-300 shadow-md'
                                        : 'bg-[#061825]/90 hover:bg-[#0c2e42] text-slate-300 border-[#0f354c]'
                                    }`}
                                    title={`${sDef.name}: ${sDef.inTime} - ${sDef.outTime}`}
                                  >
                                    <span className="block">{code}</span>
                                    <span className="text-[8px] font-mono block opacity-90 truncate">
                                      {sDef.inTime.replace(' ', '')}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Primary Duty Punch / Present Button */}
                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        {details.isToday ? (
                          <button
                            type="button"
                            onClick={() => togglePresent(details.day)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                          >
                            <Fingerprint className="w-4 h-4 stroke-[2.2]" />
                            <span>{isMl ? 'പഞ്ചിങ് ചെയ്യുക (Punch In)' : 'Punch In Now'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => togglePresent(details.day)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{isMl ? 'ഹാജർ രേഖപ്പെടുത്തുക' : 'Mark as Present'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setHalfDayCalendarModalOpen(true)}
                          className="px-3 py-2 rounded-xl bg-[#093542] hover:bg-[#0e4859] text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-400/50 shadow-md cursor-pointer active:scale-95 transition-all"
                          title="ഹാഫ് ഡേ ഇൻ / ഔട്ട് പഞ്ച് ചെയ്ത് വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>{isMl ? 'ഹാഫ് ഡേ പഞ്ച് & വാട്സ്ആപ്പ്' : 'Half Day & WhatsApp'}</span>
                        </button>
                      </div>

                      {/* Dedicated Leave Options Header & 4 Quick Buttons */}
                      <div className="pt-2 border-t border-[#0f354c] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isMl ? 'ലീവ് രേഖപ്പെടുത്തുക (Apply CSL Leave):' : 'Record CSL Leave Entry:'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowLeaveForm(!showLeaveForm)}
                            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer bg-[#092233] px-2.5 py-1 rounded-lg border border-[#144766] transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>{showLeaveForm ? (isMl ? 'ഫോം ചുരുക്കുക' : 'Close Form') : (isMl ? 'ലീവ് ഫോം പൂരിപ്പിക്കുക' : 'Open Leave Form')}</span>
                          </button>
                        </div>

                        {/* Dedicated Direct 1-Click Leave Buttons (Only CL & ML for On Contract) */}
                        {isContract ? (
                          <div className="grid grid-cols-2 gap-2">
                            {/* 1. CL Button */}
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(details.day, 'CL')}
                              className="p-3 rounded-xl bg-[#241706] hover:bg-amber-950 border border-amber-500/50 text-amber-300 text-left transition-all cursor-pointer active:scale-95 shadow-md group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-sm">CL Leave</span>
                                <span className="text-[10px] font-mono text-amber-400">12d/yr</span>
                              </div>
                              <div className="text-[11px] text-amber-200/90 truncate mt-1">
                                {isMl ? 'കാഷ്വൽ ലീവ്' : 'Casual Leave'}
                              </div>
                            </button>

                            {/* 2. ML Button (Medical Leave) */}
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(details.day, 'ML')}
                              className="p-3 rounded-xl bg-[#250a14] hover:bg-rose-950 border border-rose-500/50 text-rose-300 text-left transition-all cursor-pointer active:scale-95 shadow-md group"
                              title={isMl ? 'മെഡിക്കൽ ലീവ്' : 'Medical Leave'}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-sm">ML Leave</span>
                                <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/40">Medical</span>
                              </div>
                              <div className="text-[11px] text-rose-200/90 truncate mt-1 font-bold">
                                {isMl ? 'മെഡിക്കൽ ലീവ്' : 'Medical Leave'}
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {/* 1. CL Button */}
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(details.day, 'CL')}
                              className="p-2.5 rounded-xl bg-[#241706] hover:bg-amber-950 border border-amber-500/50 text-amber-300 text-left transition-all cursor-pointer active:scale-95 shadow-md group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs">CL Leave</span>
                                <span className="text-[10px] font-mono text-amber-400">12d/yr</span>
                              </div>
                              <div className="text-[10px] text-amber-200/80 truncate mt-0.5">
                                {isMl ? 'കാഷ്വൽ ലീവ്' : 'Casual Leave'}
                              </div>
                            </button>

                            {/* 2. EL Button */}
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(details.day, 'EL')}
                              className="p-2.5 rounded-xl bg-[#052621] hover:bg-teal-950 border border-teal-500/50 text-teal-300 text-left transition-all cursor-pointer active:scale-95 shadow-md group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs">EL Leave</span>
                                <span className="text-[10px] font-mono text-teal-400">30d/yr</span>
                              </div>
                              <div className="text-[10px] text-teal-200/80 truncate mt-0.5">
                                {isMl ? 'ഏൺഡ് ലീവ്' : 'Earned Leave'}
                              </div>
                            </button>

                            {/* 3. ML Button (Medical Leave - Deducted from EL) */}
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(details.day, 'ML')}
                              className="p-2.5 rounded-xl bg-[#250a14] hover:bg-rose-950 border border-rose-500/50 text-rose-300 text-left transition-all cursor-pointer active:scale-95 shadow-md group"
                              title="Medical Leave (Deducted from EL quota)"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs">ML Leave</span>
                                <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-950 px-1 py-0.5 rounded border border-rose-500/40">From EL</span>
                              </div>
                              <div className="text-[10px] text-rose-200/90 truncate mt-0.5 font-bold">
                                {isMl ? 'മെഡിക്കൽ ലീവ്' : 'Medical Leave'}
                              </div>
                            </button>

                            {/* 4. HPL Button */}
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(details.day, 'HPL')}
                              className="p-2.5 rounded-xl bg-[#151a38] hover:bg-indigo-950 border border-indigo-500/50 text-indigo-300 text-left transition-all cursor-pointer active:scale-95 shadow-md group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs">HPL Leave</span>
                                <span className="text-[10px] font-mono text-indigo-400">20d/yr</span>
                              </div>
                              <div className="text-[10px] text-indigo-200/80 truncate mt-0.5">
                                {isMl ? 'ഹാഫ് പേ ലീവ്' : 'Half Pay Leave'}
                              </div>
                            </button>

                            {/* 5. Special Leave Button */}
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(details.day, 'SCL')}
                              className="p-2.5 rounded-xl bg-[#220d30] hover:bg-purple-950 border border-purple-500/50 text-purple-300 text-left transition-all cursor-pointer active:scale-95 shadow-md group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs">Special</span>
                                <span className="text-[10px] font-mono text-purple-400">Sanctioned</span>
                              </div>
                              <div className="text-[10px] text-purple-200/80 truncate mt-0.5">
                                {isMl ? 'സ്പെഷ്യൽ ലീവ്' : 'Special Leave'}
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Dedicated Input Form for Leave with Reason, Type, & Half Day Portion */}
                      {showLeaveForm && (
                        <div className="bg-[#051c2c] p-3.5 sm:p-4 rounded-2xl border border-[#005f73] space-y-3 shadow-xl transition-all">
                          <div className="flex items-center justify-between pb-2 border-b border-[#0f354c]">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-cyan-400" />
                              <span className="font-extrabold text-xs sm:text-sm text-white">
                                {isMl ? `${details.day} ${currentMonthConfig.malayalam} ${selectedYear} - അവധി അപേക്ഷ സമർപ്പിക്കുക` : `Apply Leave for ${details.day} ${currentMonthConfig.name} ${selectedYear}`}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-cyan-300 font-mono">
                              Day {details.day}
                            </span>
                          </div>

                          {/* Leave Type Selector (Only CL & ML for On Contract, 5 Types for Permanent) */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-300 block">
                              {isMl ? 'ലീവ് തരം തിരഞ്ഞെടുക്കുക (Leave Type):' : 'Select Leave Category:'}
                            </label>
                            <div className={isContract ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"}>
                              {((isContract ? ['CL', 'ML'] : ['CL', 'EL', 'HPL', 'ML', 'SCL']) as CslLeaveType[]).map((tCode) => {
                                const c = CSL_LEAVE_TYPES_MAP[tCode];
                                const isSelected = formLeaveType === tCode;
                                return (
                                  <button
                                    key={tCode}
                                    type="button"
                                    onClick={() => setFormLeaveType(tCode)}
                                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                      isSelected
                                        ? `${c.colorBg} ${c.colorBorder} ring-2 ring-cyan-400 text-white font-bold`
                                        : 'bg-[#082235] border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs font-black ${isSelected ? c.colorText : 'text-white'}`}>
                                        {c.badgeShort}
                                      </span>
                                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                        isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'
                                      }`}>
                                        {isSelected && <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-semibold truncate mt-1">
                                      {isMl ? c.nameMl : c.nameEn}
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                      {isContract && tCode === 'ML' ? 'Medical' : c.quota}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {formLeaveType === 'ML' && (
                              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 mt-2">
                                <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                                <span className="leading-tight">
                                  {isContract 
                                    ? (isMl 
                                        ? 'ശ്രദ്ധിക്കുക: മെഡിക്കൽ സർട്ടിഫിക്കറ്റ് സഹിതം സമർപ്പിക്കേണ്ട മെഡിക്കൽ അവധി (Medical Leave).' 
                                        : 'Notice: Medical Leave (ML) to be availed against valid Medical Certificate.')
                                    : (isMl 
                                        ? 'ശ്രദ്ധിക്കുക: മെഡിക്കൽ ലീവ് (ML) അനുവദിക്കുമ്പോൾ അത് നിങ്ങളുടെ Earned Leave (EL) ക്വാട്ടയിൽ നിന്നാണ് കുറയുന്നത് (Deducted from EL).' 
                                        : 'Notice: Medical Leave (ML) is debited directly from your Earned Leave (EL) quota.')
                                  }
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Duration Portion Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-300 block">
                              {isMl ? 'അവധിയുടെ സമയം (Duration Portion):' : 'Duration / Session:'}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'Full Day', label: isMl ? 'പൂർണ്ണ ദിവസം (1.0d)' : 'Full Day (1.0d)' },
                                { id: 'Half Day (FN)', label: isMl ? 'അർദ്ധദിനം (FN രാവിലത്തെ)' : 'Half Day (FN)' },
                                { id: 'Half Day (AN)', label: isMl ? 'അർദ്ധദിനം (AN ഉച്ചയ്ക്ക് ശേഷമുള്ള)' : 'Half Day (AN)' },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setFormLeaveDuration(opt.id as any)}
                                  className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                                    formLeaveDuration === opt.id
                                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                                      : 'bg-[#082235] border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Half Pay Leave (HPL) Pure Notice - Never shown as medical leave */}
                          {formLeaveType === 'HPL' && (
                            <div className="bg-[#151a38]/80 p-2.5 rounded-xl border border-indigo-500/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                                <div>
                                  <div className="text-xs font-bold text-indigo-200">
                                    {isMl ? 'ഹാഫ് പേ ലീവ് (HPL) · അർദ്ധവേതന അവധി' : 'Half Pay Leave (HPL) · 20 Days/Year'}
                                  </div>
                                  <div className="text-[10px] text-indigo-300/80">
                                    {isMl ? 'പ്രതിവർഷം 20 ദിവസത്തെ അർദ്ധവേതന അവധി ലഭിക്കുന്നു. (മെഡിക്കൽ ലീവ് അല്ല).' : '20 Half Pay days credited per year to employee leave account.'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Medical Leave (ML) Doctor Certificate Option */}
                          {formLeaveType === 'ML' && (
                            <div className="bg-rose-950/80 p-2.5 rounded-xl border border-rose-500/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                                <div>
                                  <div className="text-xs font-bold text-rose-200">
                                    {isMl ? 'ഡോക്ടറുടെ മെഡിക്കൽ സർട്ടിഫിക്കറ്റ്' : 'Doctor Medical Certificate'}
                                  </div>
                                  <div className="text-[10px] text-rose-300/80">
                                    {isMl ? 'മെഡിക്കൽ ലീവ് EL (Earned Leave) ക്വാട്ടയിൽ നിന്നാണ് കുറയുന്നത്.' : 'Medical Leave is debited directly from your Earned Leave (EL) quota.'}
                                  </div>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={formMedicalCert}
                                onChange={(e) => setFormMedicalCert(e.target.checked)}
                                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                              />
                            </div>
                          )}

                          {/* Special Leave Occasion Presets */}
                          {formLeaveType === 'SCL' && (
                            <div className="bg-[#220d30]/80 p-2.5 rounded-xl border border-purple-500/40 space-y-2">
                              <label className="text-[11px] font-bold text-purple-200 block">
                                {isMl ? 'പ്രത്യേക അവസരം തിരഞ്ഞെടുക്കുക (Special Occasion):' : 'Select Special Occasion:'}
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  'Voluntary Blood Donation (1 Day)',
                                  'Maternity / Paternity Leave',
                                  'Shipyard Sports / Deputation',
                                  'Family Urgent Matter'
                                ].map((occ) => (
                                  <button
                                    key={occ}
                                    type="button"
                                    onClick={() => setFormSpecialOccasion(occ)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                      formSpecialOccasion === occ
                                        ? 'bg-purple-900 border-purple-400 text-purple-100 ring-1 ring-purple-400'
                                        : 'bg-[#12071a] border-purple-900/60 text-purple-300 hover:bg-purple-950'
                                    }`}
                                  >
                                    {occ}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reason / Remarks text input field */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-300 block">
                              {isMl ? 'കാരണം അല്ലെങ്കിൽ കുറിപ്പ് (Reason / Remarks):' : 'Reason / Remarks (Optional):'}
                            </label>
                            <input
                              type="text"
                              value={formLeaveReason}
                              onChange={(e) => setFormLeaveReason(e.target.value)}
                              placeholder={
                                formLeaveType === 'CL' ? 'ഉദാ: പെട്ടെന്നുള്ള ആവശ്യങ്ങൾക്കായി (Urgent personal work)...' :
                                formLeaveType === 'EL' ? 'ഉദാ: കുടുംബ സമേതം യാത്ര / വാർഷിക അവധി (Annual family vacation)...' :
                                formLeaveType === 'HPL' ? 'ഉദാ: സി.എസ്.എൽ ഡിസ്പെൻസറി പരിശോധന (Dispensary checkup / rest)...' :
                                'ഉദാ: പ്രത്യേക പരിപാടി / സന്ദർശനം...'
                              }
                              className="w-full p-2.5 bg-[#061825] rounded-xl border border-[#0f354c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#0f354c]">
                            <button
                              type="button"
                              onClick={() => setShowLeaveForm(false)}
                              className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-white/10 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyLeave(details.day)}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{isMl ? 'അവധി ഉറപ്പുവരുത്തുക (Sanction Leave)' : 'Sanction & Apply Leave'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Dedicated Work Details & Daily Tasks Section */}
                <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-[#062024]/95 via-[#04191d]/95 to-[#021013]/95 border border-teal-500/50 shadow-xl space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-teal-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shadow-inner">
                        <Briefcase className="w-4 h-4 text-teal-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-white tracking-tight">
                            {isMl ? 'വർക്ക് ഡീറ്റെയിൽസ് (Work Details)' : 'Work Details & Daily Tasks'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-950/80 text-teal-300 border border-teal-600/40 font-bold">
                            {currentUser?.department || 'Assembly Shop'}
                          </span>
                        </div>
                        <span className="text-[10px] text-teal-300/80 font-mono">
                          {isMl ? 'സി.എസ്.എൽ ഡ്യൂട്ടി & പ്രൊഡക്ഷൻ ടാസ്ക് വിവരങ്ങൾ' : 'CSL Production, Repair & Yard Operations'}
                        </span>
                      </div>
                    </div>

                    {!showWorkInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWork(details.work);
                          setShowWorkInput(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/40 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 ml-auto"
                      >
                        <Pencil className="w-3 h-3 text-teal-300" />
                        <span>{details.isCustomWork ? (isMl ? 'തിരുത്തുക (Edit Work)' : 'Edit Work') : (isMl ? '+ ചേർക്കുക / തിരുത്തുക' : '+ Add / Edit Work')}</span>
                      </button>
                    )}
                  </div>

                  {showWorkInput ? (
                    <div className="bg-[#031518] p-3 rounded-xl border border-teal-500/40 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-teal-300 flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-teal-400" />
                          <span>{isMl ? 'ഈ ദിവസത്തെ ജോലി വിവരങ്ങൾ രേഖപ്പെടുത്തുക:' : 'Enter Shipyard Work Description:'}</span>
                        </span>
                        {editingWork && (
                          <button
                            type="button"
                            onClick={() => setEditingWork('')}
                            className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <textarea
                        value={editingWork}
                        onChange={(e) => setEditingWork(e.target.value)}
                        placeholder={isMl ? 'അന്നത്തെ ജോലി / വർക്ക് വിവരങ്ങൾ ടൈപ്പ് ചെയ്യുക (ഉദാ: ബിൽഡിംഗ് ഡോക്ക് യാർഡ് വർക്ക്, ഹൾ ഫാബ്രിക്കേഷൻ)...' : 'Enter work details (e.g. Building Dock Yard Work, Hull Fabrication, Plate Alignment)...'}
                        rows={2}
                        className="w-full p-2.5 bg-[#020d10] rounded-xl border border-teal-600/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                      />

                      {/* Quick 1-Touch Presets for fast entry */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {isMl ? 'പെട്ടെന്ന് തിരഞ്ഞെടുക്കാം (Quick Presets):' : 'Quick Shipyard Presets:'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { label: isMl ? '⚓ യാർഡ് വർക്ക്' : '⚓ Yard Work', text: isMl ? 'ബിൽഡിംഗ് ഡോക്ക് യാർഡ് വർക്ക് & ഫാബ്രിക്കേഷൻ (Building Dock Yard Work & Fabrication)' : 'Building Dock Yard Work & Fabrication' },
                            { label: isMl ? '🔧 ഹൾ വെൽഡിംഗ്' : '🔧 Hull Welding', text: isMl ? 'ഹൾ ഫാബ്രിക്കേഷൻ, വെൽഡിംഗ് & പ്ലേറ്റ് അലൈൻമെന്റ് (Hull Fabrication, Plate Alignment & Welding)' : 'Hull Fabrication, Plate Alignment & Welding' },
                            { label: isMl ? '🚢 ഡ്രൈ ഡോക്ക്' : '🚢 Dry Dock', text: isMl ? 'ഡ്രൈ ഡോക്ക് ഷിപ്പ് റിപ്പയർ & സർവേ വർക്ക് (Dry Dock Ship Repair & Survey Work)' : 'Dry Dock Ship Repair & Survey Work' },
                            { label: isMl ? '⚙️ മെയിന്റനൻസ്' : '⚙️ Maintenance', text: isMl ? 'മെഷിനറി & എൻജിൻ മെയിന്റനൻസ് വർക്ക് (Machinery & Engine Maintenance)' : 'Machinery & Engine Maintenance' },
                            { label: isMl ? '🔍 ക്വാളിറ്റി ചെക്ക്' : '🔍 Quality Check', text: isMl ? 'എൻ.ഡി.ടി & ക്വാളിറ്റി ടെസ്റ്റിംഗ് ഇൻസ്പെക്ഷൻ (NDT & Quality Testing Inspection)' : 'NDT & Quality Testing Inspection' },
                          ].map((chip) => (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => setEditingWork(chip.text)}
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-teal-950/70 hover:bg-teal-900/90 text-teal-200 border border-teal-500/40 cursor-pointer transition-colors"
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-900/60">
                        <button
                          type="button"
                          onClick={() => setShowWorkInput(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveWork(details.day)}
                          className="px-4 py-1.5 text-xs font-black bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{isMl ? 'വർക്ക് സേവ് ചെയ്യുക' : 'Save Work'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#031518]/90 p-3 rounded-xl border border-teal-500/30 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-lg shrink-0 mt-0.5">
                            {details.isPresent ? '⚓' : details.isLeave ? '📋' : details.isSun || details.holidayInfo ? '🏖️' : '🔧'}
                          </span>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-teal-100 leading-relaxed break-words">
                              {details.work}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-teal-300/80">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                                {details.isCustomWork 
                                  ? (isMl ? 'യൂസർ രേഖപ്പെടുത്തിയത് (Custom Log)' : 'User Logged Task') 
                                  : (isMl ? 'സി.എസ്.എൽ ഷിപ്പ്‌യാർഡ് അസൈൻമെന്റ്' : 'CSL Yard Scheduled Task')}
                              </span>
                              <span>•</span>
                              <span>ടോക്കൺ / കോഡ്: {currentUser?.token || '9012'}</span>
                            </div>
                          </div>
                        </div>

                        {details.isCustomWork && (
                          <button
                            type="button"
                            onClick={() => handleSaveWork(details.day, '')}
                            className="text-[10px] text-slate-400 hover:text-rose-400 shrink-0 cursor-pointer p-1"
                            title={isMl ? 'കസ്റ്റം വർക്ക് ഒഴിവാക്കി ഡിഫോൾട്ട് ആക്കുക' : 'Reset to default work description'}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Notes & Remarks for this Day */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isMl ? 'വ്യക്തിഗത കുറിപ്പുകൾ (Personal Notes & Remarks):' : 'Personal Notes & Remarks:'}</span>
                    </span>
                    {!showNoteInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNote(details.note);
                          setShowNoteInput(true);
                        }}
                        className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{details.note ? 'Edit Note' : '+ Add Note'}</span>
                      </button>
                    )}
                  </div>

                  {showNoteInput ? (
                    <div className="bg-[#082030] p-2.5 rounded-xl border border-[#113e5e] space-y-2">
                      <textarea
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        placeholder="ഈ തീയതിയിലെ പ്രത്യേക വ്യക്തിഗത കുറിപ്പുകൾ എഴുതുക..."
                        rows={2}
                        className="w-full p-2 bg-[#061825] rounded-lg border border-[#0f354c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowNoteInput(false)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:bg-white/10 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNote(details.day)}
                          className="px-3 py-1 text-xs font-bold bg-[#005f73] text-white rounded-lg hover:bg-teal-700 cursor-pointer shadow-md"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : details.note ? (
                    <div className="bg-[#241706]/90 p-2.5 rounded-xl border border-amber-500/40 text-xs text-amber-200 italic">
                      "{details.note}"
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      പ്രത്യേക കുറിപ്പുകൾ ഒന്നും ചേർത്തിട്ടില്ല (No personal notes recorded).
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Side-by-Side Mini Calendars: Previous & Next Month (Matching Authentic CSL Wall Calendar Sheet) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
            {/* Left: Previous Month Mini Calendar */}
            <div 
              onClick={handlePrevMonth}
              className={`${
                isWhiteWall
                  ? 'bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-md hover:border-blue-400'
                  : 'bg-[#061825]/90 rounded-2xl p-3 sm:p-3.5 border border-[#0f354c] shadow-md hover:border-cyan-400'
              } cursor-pointer transition-all select-none`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1 ${
                  isWhiteWall ? 'text-slate-900' : 'text-white'
                }`}>
                  <span>‹</span>
                  <span>{prevConfig.name.toUpperCase()} {prevMonthYear}</span>
                </span>
                <span className={`text-[10px] font-bold font-mono ${
                  isWhiteWall ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {prevConfig.days} D
                </span>
              </div>

              <div className={`grid grid-cols-7 text-center text-[10px] font-black mb-1 ${
                isWhiteWall ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <span className={isWhiteWall ? 'text-rose-600' : 'text-rose-400'}>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span className={isWhiteWall ? 'text-slate-600' : 'text-slate-400'}>S</span>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] gap-y-1">
                {Array.from({ length: prevConfig.startDay }).map((_, idx) => (
                  <span key={`empty-prev-${idx}`} className="h-5" />
                ))}
                {Array.from({ length: prevConfig.days }).map((_, idx) => {
                  const day = idx + 1;
                  const dayOfWeek = (prevConfig.startDay + idx) % 7;
                  const isSun = dayOfWeek === 0;
                  const isSatOff = dayOfWeek === 6 && ((day >= 8 && day <= 14) || (day >= 22 && day <= 28));
                  const isRed = isSun || isSatOff;

                  return (
                    <span
                      key={`prev-day-${day}`}
                      className={`h-5 flex items-center justify-center ${
                        isRed
                          ? isWhiteWall
                            ? 'text-rose-600 font-bold'
                            : 'text-rose-400 font-bold'
                          : isWhiteWall
                          ? 'text-slate-700 font-medium'
                          : 'text-slate-300 font-medium'
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Right: Next Month Mini Calendar */}
            <div 
              onClick={handleNextMonth}
              className={`${
                isWhiteWall
                  ? 'bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-md hover:border-blue-400'
                  : 'bg-[#061825]/90 rounded-2xl p-3 sm:p-3.5 border border-[#0f354c] shadow-md hover:border-cyan-400'
              } cursor-pointer transition-all select-none`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1 ${
                  isWhiteWall ? 'text-slate-900' : 'text-white'
                }`}>
                  <span>{nextConfig.name.toUpperCase()} {nextMonthYear}</span>
                  <span>›</span>
                </span>
                <span className={`text-[10px] font-bold font-mono ${
                  isWhiteWall ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {nextConfig.days} D
                </span>
              </div>

              <div className={`grid grid-cols-7 text-center text-[10px] font-black mb-1 ${
                isWhiteWall ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <span className={isWhiteWall ? 'text-rose-600' : 'text-rose-400'}>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span className={isWhiteWall ? 'text-slate-600' : 'text-slate-400'}>S</span>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] gap-y-1">
                {Array.from({ length: nextConfig.startDay }).map((_, idx) => (
                  <span key={`empty-next-${idx}`} className="h-5" />
                ))}
                {Array.from({ length: nextConfig.days }).map((_, idx) => {
                  const day = idx + 1;
                  const dayOfWeek = (nextConfig.startDay + idx) % 7;
                  const isSun = dayOfWeek === 0;
                  const isSatOff = dayOfWeek === 6 && ((day >= 8 && day <= 14) || (day >= 22 && day <= 28));
                  const isRed = isSun || isSatOff;

                  return (
                    <span
                      key={`next-day-${day}`}
                      className={`h-5 flex items-center justify-center ${
                        isRed
                          ? isWhiteWall
                            ? 'text-rose-600 font-bold'
                            : 'text-rose-400 font-bold'
                          : isWhiteWall
                          ? 'text-slate-700 font-medium'
                          : 'text-slate-300 font-medium'
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Official CSL Gazetted Holidays List for Selected Month */}
          <div className={`${
            isWhiteWall
              ? 'bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xl mb-4 text-slate-900'
              : 'bg-[#061825]/95 rounded-3xl p-4 sm:p-5 border border-[#0f354c] shadow-xl mb-4 text-white'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flag className={`w-4 h-4 ${isWhiteWall ? 'text-rose-600' : 'text-rose-400'}`} />
                <h4 className={`font-extrabold text-sm ${isWhiteWall ? 'text-slate-900' : 'text-white'}`}>
                  Gazetted Closed Holidays in {currentMonthConfig.name} 2026
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('holidays');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  isWhiteWall ? 'text-blue-600 hover:text-blue-700' : 'text-cyan-300 hover:text-cyan-200'
                }`}
              >
                <span>View All 12</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedMonth === 9 ? (
              <div className="space-y-2">
                <div className={`p-3 rounded-2xl flex items-start gap-3 ${
                  isWhiteWall
                    ? 'bg-amber-50/90 border border-amber-300 shadow-sm'
                    : 'bg-[#1d1203]/90 border border-amber-500/40'
                }`}>
                  <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center shrink-0 ${
                    isWhiteWall ? 'bg-amber-500 text-amber-950 shadow-sm' : 'bg-amber-400 text-amber-950'
                  }`}>
                    02
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-extrabold text-xs ${isWhiteWall ? 'text-slate-900' : 'text-white'}`}>
                        Gandhi Jayanthi (ഗാന്ധി ജയന്തി)
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-black">
                        National
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isWhiteWall ? 'text-slate-600' : 'text-slate-300'}`}>
                      02 October 2026 (Friday) · Birth Anniversary of Mahatma Gandhi · Paid Closed Holiday across all CSL yards.
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl flex items-start gap-3 ${
                  isWhiteWall
                    ? 'bg-rose-50/90 border border-rose-300 shadow-sm'
                    : 'bg-[#240a12]/90 border border-rose-500/40'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white font-black flex items-center justify-center shrink-0 shadow-sm">
                    21
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-extrabold text-xs ${isWhiteWall ? 'text-slate-900' : 'text-white'}`}>
                        Vijayadasami / Mahanavami (വിജയദശമി)
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[9px] font-black">
                        CSL Gazetted
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isWhiteWall ? 'text-slate-600' : 'text-slate-300'}`}>
                      21 October 2026 (Wednesday) · Official CSL Gazetted Closed Holiday across all shipyard establishments.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {cslOfficial12Holidays2026
                  .filter((h) => h.monthIndex === selectedMonth)
                  .map((h) => (
                    <div
                      key={h.id}
                      className={`p-3 rounded-2xl flex items-start gap-3 ${
                        isWhiteWall
                          ? 'bg-slate-50 border border-slate-200 shadow-sm'
                          : 'bg-[#082030] border border-[#113e5e]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#005f73] text-white font-black flex items-center justify-center shrink-0 shadow-sm">
                        {h.date}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-extrabold text-xs ${isWhiteWall ? 'text-slate-900' : 'text-white'}`}>
                            {h.name}
                          </span>
                          <span className={
                            isWhiteWall
                              ? 'px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 border border-cyan-300 text-[9px] font-black'
                              : 'px-1.5 py-0.2 rounded bg-[#0b2d42] text-cyan-300 border border-cyan-500/40 text-[9px] font-black'
                          }>
                            {h.badge}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${isWhiteWall ? 'text-slate-600' : 'text-slate-300'}`}>
                          {h.fullDate} ({h.dayOfWeek}) · {h.description}
                        </p>
                      </div>
                    </div>
                  ))}

                {cslOfficial12Holidays2026.filter((h) => h.monthIndex === selectedMonth).length === 0 && (
                  <p className={`text-xs italic p-2 ${isWhiteWall ? 'text-slate-500' : 'text-slate-400'}`}>
                    No closed gazetted holidays in this month. Normal working schedule.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: 12 Holidays & CSL Leaves Dedicated Interface */}
      {activeTab === 'holidays' && (
        <div className="space-y-3.5 mb-4">
          {/* Hero Header Card */}
          <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-br from-[#1d070e] via-[#14050a] to-[#0a0205] p-4 sm:p-5 shadow-xl text-white">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl select-none" role="img" aria-label="Celebration">🎉</span>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-rose-300 tracking-tight truncate">
                    CSL Holidays & Leave Schedule · 2026
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium truncate">
                    Cochin Shipyard Limited · Gazetted Holidays & Employee Leave Entitlements
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('wall');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-full bg-[#240a12] border border-rose-500/40 hover:bg-rose-950 text-rose-200 text-xs font-bold flex items-center gap-1 shadow-md transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Wall Calendar</span>
              </button>
            </div>

            {/* 4 Summary Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-[#240a12]/90 rounded-2xl p-2.5 border border-rose-500/40 shadow-md">
                <div className="text-base font-black text-rose-300">{cslOfficial12Holidays2026.length}</div>
                <div className="text-[10px] text-rose-400 font-semibold mt-0.5">Closed Holidays (അവധികൾ)</div>
              </div>
              <div className="bg-[#240a12]/90 rounded-2xl p-2.5 border border-rose-500/40 shadow-md">
                <div className="text-base font-black text-rose-300">{cslOfficial12Holidays2026.filter(h => h.category === 'CSL Gazetted').length}</div>
                <div className="text-[10px] text-rose-400 font-semibold mt-0.5">CSL Gazetted (ഗസറ്റഡ്)</div>
              </div>
              <div className="bg-[#241706]/90 rounded-2xl p-2.5 border border-amber-500/40 shadow-md">
                <div className="text-base font-black text-amber-300">{cslOfficial12Holidays2026.filter(h => h.category === 'National').length}</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-0.5">National Days (ദേശീയ)</div>
              </div>
              <div className="bg-[#052621]/90 rounded-2xl p-2.5 border border-teal-500/40 shadow-md">
                <div className="text-base font-black text-teal-300">62+</div>
                <div className="text-[10px] text-teal-400 font-semibold mt-0.5">CSL Leaves/Yr (CL+EL+HPL)</div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setHolidayCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                  holidayCategoryFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                }`}
              >
                All Holidays ({cslOfficial12Holidays2026.length})
              </button>
              <button
                type="button"
                onClick={() => setHolidayCategoryFilter('gazetted')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                  holidayCategoryFilter === 'gazetted'
                    ? 'bg-rose-600 text-white font-black shadow-md'
                    : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                }`}
              >
                CSL Gazetted ({cslOfficial12Holidays2026.filter(h => h.category === 'CSL Gazetted').length})
              </button>
              <button
                type="button"
                onClick={() => setHolidayCategoryFilter('national')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                  holidayCategoryFilter === 'national'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                }`}
              >
                National ({cslOfficial12Holidays2026.filter(h => h.category === 'National').length})
              </button>
              <button
                type="button"
                onClick={() => setHolidayCategoryFilter('csl_leaves')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                  holidayCategoryFilter === 'csl_leaves'
                    ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                }`}
              >
                CSL Leaves (CL/EL/HPL)
              </button>
              <button
                type="button"
                onClick={() => setHolidayCategoryFilter('rh')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                  holidayCategoryFilter === 'rh'
                    ? 'bg-purple-600 text-white font-black shadow-md'
                    : 'bg-[#061825]/90 border border-[#0f354c] text-slate-300 hover:bg-[#0c2e42]'
                }`}
              >
                Restricted Leaves (RH)
              </button>
            </div>

            {/* Search Input (Only when viewing holidays) */}
            {holidayCategoryFilter !== 'csl_leaves' && holidayCategoryFilter !== 'rh' && (
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  placeholder="Search holiday..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#061825] border border-[#0f354c] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
                {holidaySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHolidaySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* VIEW MODE 1: CSL Employee Service Leaves (CL, EL, HPL, RH, C-OFF) */}
          {holidayCategoryFilter === 'csl_leaves' && (
            <div className="space-y-3">
              <div className="bg-[#022735] text-white rounded-3xl p-4 sm:p-5 border border-teal-900/80 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      സി.എസ്.എൽ സർവീസ് ലീവ് ചട്ടങ്ങൾ (CSL Service Leave Rules)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-800 text-teal-200 border border-teal-700">
                    DPE / PSU Norms
                  </span>
                </div>
                <p className="text-xs text-teal-100/90 leading-relaxed">
                  {isContract 
                    ? (isMl ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ലിമിറ്റഡിലെ ഓൺ കോൺട്രാക്ട് ജീവനക്കാർക്ക് ബാധകമായ ലീവ് വിവരങ്ങൾ (CL & ML):' : 'CSL On Contract Employee Leave Entitlements (CL & ML):')
                    : (isMl ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ലിമിറ്റഡിലെ ജീവനക്കാർക്ക് ലഭിക്കുന്ന വാർഷിക ലീവ് ആനുകൂല്യങ്ങളും അവയുടെ അർഹതകളും താഴെ നൽകിയിരിക്കുന്നു:' : 'CSL Employee Annual Leave Entitlements & Policy Schedule:')
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(isContract 
                  ? cslLeaveEntitlements.filter(l => l.code === 'CL' || l.code === 'ML') 
                  : cslLeaveEntitlements).map((leave) => (
                  <div
                    key={leave.id}
                    className="bg-[#061825]/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#0f354c] shadow-xl hover:border-cyan-400 transition-all space-y-3 text-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${leave.badgeColor}`}>
                          {leave.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-white text-sm sm:text-base">
                              {leave.name}
                            </h4>
                            <span className="text-xs font-semibold text-slate-400">
                              ({leave.malayalamName})
                            </span>
                          </div>
                          <p className="text-xs font-bold text-teal-300 mt-0.5">
                            {leave.daysPerYear}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-cyan-300 bg-[#092a3a] px-2 py-1 rounded-lg shrink-0 border border-cyan-500/30">
                        {leave.maxAccumulation}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#092233] border border-[#144766] text-xs text-slate-200 leading-relaxed">
                      <span className="font-bold text-white">വിവരണം: </span>
                      {leave.description}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        പ്രധാന നിബന്ധനകൾ (Key Rules):
                      </div>
                      <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-300">
                        {leave.rules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-[#0f354c] flex items-center justify-between text-[11px] text-slate-400">
                      <span>ക്രെഡിറ്റ് രീതി: <strong className="text-slate-200">{leave.credited}</strong></span>
                      <span className="text-teal-300 font-semibold">{leave.maxAccumulation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: CSL Restricted Holidays (RH - 2 Days) */}
          {holidayCategoryFilter === 'rh' && (
            <div className="space-y-3">
              <div className="bg-[#1f1938] text-white rounded-3xl p-4 sm:p-5 border border-purple-900/80 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-purple-300" />
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      സി.എസ്.എൽ റെസ്ട്രിക്റ്റഡ് ലീവ് പട്ടിക 2026 (Restricted Holidays)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900 text-purple-200 border border-purple-700">
                    ഏതെങ്കിലും 2 എണ്ണം
                  </span>
                </div>
                <p className="text-xs text-purple-100/90 leading-relaxed">
                  താഴെ നൽകിയിരിക്കുന്ന 7 പ്രത്യേക ഉത്സവ ദിനങ്ങളിൽ നിന്ന് സി.എസ്.എൽ ജീവനക്കാർക്ക് തങ്ങളുടെ ഇഷ്ടപ്രകാരം ഏതെങ്കിലും <strong>2 റെസ്ട്രിക്റ്റഡ് അവധികൾ (2 RH)</strong> തിരഞ്ഞെടുക്കാവുന്നതാണ്:
                </p>
              </div>

              <div className="space-y-2.5">
                {cslRestrictedHolidays2026.map((rh, idx) => (
                  <div
                    key={rh.id}
                    className="bg-[#061825]/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-[#0f354c] shadow-xl hover:border-purple-400 flex items-center justify-between gap-3 text-white"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-black">RH</span>
                        <span className="text-[10px] font-bold">#{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-white text-sm truncate">
                            {rh.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-400">
                            ({rh.mlName})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {rh.occasion}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-white text-xs font-mono">{rh.date}</div>
                      <div className="text-[10px] text-purple-300 font-semibold">{rh.day}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Closed Gazetted Holidays Cards List (All / National / Gazetted) */}
          {holidayCategoryFilter !== 'csl_leaves' && holidayCategoryFilter !== 'rh' && (
            <div className="space-y-2.5">
              {filtered12Holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="bg-[#061825]/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-[#0f354c] shadow-xl hover:border-cyan-400 transition-all flex items-center justify-between gap-3 group text-white"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Left Date Block */}
                    <div className={`w-14 sm:w-16 py-2 px-1 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 border shadow-md ${
                      holiday.category === 'National'
                        ? 'bg-[#241706] border-amber-500/50 text-amber-300'
                        : 'bg-[#240a12] border-rose-500/50 text-rose-300'
                    }`}>
                      <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                        {holiday.month}
                      </span>
                      <span className="text-xl sm:text-2xl font-black leading-none my-1 tracking-tight">
                        {holiday.date}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase leading-none opacity-80">
                        {holiday.dayOfWeek.slice(0, 3)}
                      </span>
                    </div>

                    {/* Center Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-white text-sm sm:text-base leading-snug truncate">
                          {holiday.name}
                        </h4>
                        {holiday.malayalamName && (
                          <span className="text-[10px] font-semibold text-slate-400 truncate">
                            ({holiday.malayalamName})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{holiday.fullDate}</span>
                        <span>·</span>
                        <span className="text-teal-300 font-semibold">{holiday.dayOfWeek}</span>
                        {holiday.isWeekend && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                            Weekend
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {holiday.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Badges & Jump Action */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-tight shadow-md ${
                      holiday.category === 'National'
                        ? 'bg-[#241706] text-amber-300 border border-amber-500/50'
                        : 'bg-[#240a12] text-rose-300 border border-rose-500/50'
                    }`}>
                      {holiday.badge}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonth(holiday.monthIndex);
                        setSelectedDate(parseInt(holiday.date, 10));
                        setActiveTab('wall');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[10px] font-bold text-cyan-300 hover:text-cyan-100 flex items-center gap-0.5 mt-0.5 cursor-pointer transition-colors"
                    >
                      <span>View in Month</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {filtered12Holidays.length === 0 && (
                <div className="bg-[#061825]/90 rounded-3xl p-6 text-center text-slate-400 text-xs border border-[#0f354c]">
                  No holidays found matching your filter or search query.
                </div>
              )}

              {/* Integrated CSL Service Leaves Card at the bottom of the holiday list */}
              <div className="mt-4 bg-gradient-to-br from-[#061825] via-[#092233] to-[#04131d] rounded-3xl p-4 sm:p-5 text-white border border-[#0f354c] shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      സി.എസ്.എൽ സർവീസ് ലീവുകൾ (CSL Leave Entitlements)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHolidayCategoryFilter('csl_leaves')}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>മുഴുവൻ വിവരങ്ങളും കാണുക</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs text-teal-100/80 leading-relaxed">
                  കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ലിമിറ്റഡിലെ ജീവനക്കാർക്ക് ലഭിക്കുന്ന ഔദ്യോഗിക ലീവ് അർഹതകൾ:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1 text-center">
                  <div 
                    onClick={() => setHolidayCategoryFilter('csl_leaves')}
                    className="bg-[#241706]/80 hover:bg-[#2e1d08] rounded-2xl p-2.5 border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <div className="text-base font-black text-amber-300">12 Days</div>
                    <div className="text-[10px] text-slate-300 font-semibold mt-0.5">Casual Leave (CL)</div>
                    <div className="text-[9px] text-amber-400 font-mono mt-0.5">Used: {clDaysCount}d · Bal: {Math.max(0, 12 - clDaysCount)}d</div>
                  </div>
                  <div 
                    onClick={() => setHolidayCategoryFilter('csl_leaves')}
                    className="bg-[#052621]/80 hover:bg-[#07362e] rounded-2xl p-2.5 border border-teal-500/40 transition-colors cursor-pointer"
                  >
                    <div className="text-base font-black text-teal-300">30 Days</div>
                    <div className="text-[10px] text-slate-300 font-semibold mt-0.5">Earned Leave (EL)</div>
                    <div className="text-[9px] text-teal-400 font-mono mt-0.5">Used: {elDaysCount + mlDaysCount}d · Bal: {Math.max(0, 30 - (elDaysCount + mlDaysCount))}d</div>
                  </div>
                  <div 
                    onClick={() => setHolidayCategoryFilter('csl_leaves')}
                    className="bg-[#250a14]/80 hover:bg-[#340d1c] rounded-2xl p-2.5 border border-rose-500/40 transition-colors cursor-pointer"
                  >
                    <div className="text-base font-black text-rose-300">From EL</div>
                    <div className="text-[10px] text-slate-300 font-semibold mt-0.5">Medical Leave (ML)</div>
                    <div className="text-[9px] text-rose-400 font-mono mt-0.5">Taken: {mlDaysCount}d (Debited from EL)</div>
                  </div>
                  <div 
                    onClick={() => setHolidayCategoryFilter('csl_leaves')}
                    className="bg-[#121c35]/80 hover:bg-[#1a294d] rounded-2xl p-2.5 border border-indigo-500/40 transition-colors cursor-pointer"
                  >
                    <div className="text-base font-black text-indigo-300">20 Days</div>
                    <div className="text-[10px] text-slate-300 font-semibold mt-0.5">Half Pay (HPL)</div>
                    <div className="text-[9px] text-indigo-400 font-mono mt-0.5">Used: {hplDaysCount}d · Bal: {Math.max(0, 20 - hplDaysCount)}d</div>
                  </div>
                  <div 
                    onClick={() => setHolidayCategoryFilter('csl_leaves')}
                    className="bg-[#220d30]/80 hover:bg-[#2d113f] rounded-2xl p-2.5 border border-purple-500/40 transition-colors cursor-pointer"
                  >
                    <div className="text-base font-black text-purple-300">Special</div>
                    <div className="text-[10px] text-slate-300 font-semibold mt-0.5">Special Leave (SCL)</div>
                    <div className="text-[9px] text-purple-400 font-mono mt-0.5">Used: {sclDaysCount}d Recorded</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: 12 Months Grid */}
      {activeTab === 'months' && (
        <div className="space-y-4 mb-4">
          <div className="bg-[#061825]/95 rounded-3xl p-4 sm:p-5 border border-[#0f354c] shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  CSL All 12 Months Wall Sheets · {selectedYear}
                </h3>
                <p className="text-xs text-slate-400">
                  Select any month to jump directly into its official wall calendar page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('wall');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-full bg-[#092a3a] hover:bg-[#0f3d53] text-cyan-300 border border-[#144766] text-xs font-bold cursor-pointer"
              >
                Wall Calendar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cslMonthsConfig.map((m, idx) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(idx);
                    setSelectedDate(idx === currentSystemDate.getMonth() ? currentSystemDate.getDate() : 1);
                    setActiveTab('wall');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedMonth === idx
                      ? 'bg-[#052621] border-teal-400 ring-2 ring-teal-500/40 text-white'
                      : 'bg-[#071f30]/90 border-[#103a55] hover:bg-[#0c2e42] hover:border-cyan-400 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm">{m.name} 2026</span>
                      <span className="text-xs text-cyan-300 ml-1.5">({m.hindi})</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{m.days} Days</span>
                  </div>

                  <div className="text-[11px] font-bold text-teal-300 mt-1 line-clamp-1">
                    {m.vesselName}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {m.vesselNameMl}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#0f354c] flex items-center justify-between text-[10px]">
                    <span className="text-slate-300 font-medium">{m.kollavarshamEra}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full ${
                      m.holidaysCount > 0 ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'bg-[#082235] text-slate-400'
                    }`}>
                      {m.holidaysCount} Holidays
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Employee Dock Card (Matching Previous Page) */}
      <div className="bg-[#061825]/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#0f354c] shadow-xl mt-4 text-white">
        {/* Top Row: User initial badge, Name, and (Token) */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shrink-0 shadow-md">
            {currentUser?.name?.trim().charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-white text-base truncate">
              {currentUser?.name || (isMl ? 'CSL ജീവനക്കാരൻ' : 'CSL Employee')}
            </span>
            <span className="text-cyan-300 font-semibold text-sm font-mono shrink-0">
              {currentUser?.token ? `(${isMl ? 'കോഡ്' : 'Code'} ${currentUser.token})` : ''}
            </span>
          </div>
        </div>

        {/* Action Buttons Row: Calendar (Active), Attendance, Salary, Edit Profile, Download Monthly Details PDF */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('wall');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all ${
              activeTab === 'wall'
                ? 'border-2 border-amber-500 bg-amber-500/20 text-amber-300'
                : 'border border-[#0f354c] bg-[#061825]/90 hover:bg-[#0c2e42] text-slate-300'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            <span>Calendar</span>
          </button>

          {onOpenAttendance && (
            <button
              type="button"
              onClick={onOpenAttendance}
              className="px-4 py-2 rounded-2xl border border-emerald-500/40 bg-[#052621]/90 hover:bg-[#07362e] text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
              <span>Attendance</span>
            </button>
          )}

          {onOpenSalary && (
            <button
              type="button"
              onClick={onOpenSalary}
              className="px-4 py-2 rounded-2xl border border-teal-500/40 bg-[#072430]/90 hover:bg-[#0b3344] text-teal-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <IndianRupee className="w-4 h-4 text-amber-400 stroke-[2.2]" />
              <span>Salary</span>
            </button>
          )}

          <button
            type="button"
            onClick={onEditProfile || onBackToQuickAccess}
            className="px-4 py-2 rounded-2xl border border-[#0f354c] bg-[#092a3a]/80 hover:bg-cyan-900/40 text-cyan-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer active:scale-95 shadow-md"
          >
            <Pencil className="w-4 h-4 text-cyan-400 stroke-[2.2]" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNextMonthOtModal(true)}
            className="px-4 py-2 rounded-2xl border-2 border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-amber-950/40"
            title="Next month OT details download PDF"
          >
            <Download className="w-4 h-4 text-amber-400 stroke-[2.4]" />
            <span>Next month OT details download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMusterSlip(true)}
            className="px-3.5 py-2 rounded-2xl border border-cyan-500/30 bg-[#072430]/80 hover:bg-[#0b3344] text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-md"
            title="Download Monthly Details PDF"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400 stroke-[2]" />
            <span>Monthly Details PDF</span>
          </button>
        </div>
      </div>

      {/* Bottom Green Notice Box matching Screenshot 1 from QuickAccess */}
      <div className="bg-[#06242a]/80 border border-[#0f4b55] rounded-2xl p-4 text-xs text-slate-200 flex items-center gap-3 relative overflow-hidden shadow-lg mt-5 mb-4">
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
        </div>
        <div className="pr-8 text-slate-300 font-medium leading-relaxed">
          {isMl 
            ? (isContract
                ? 'ഔദ്യോഗിക സി.എസ്.എൽ കമ്പനി ഓൺ കോൺട്രാക്ട് എംപ്ലോയി കലണ്ടർ · ഷിപ്പ്‌യാർഡ് ഷിഫ്റ്റുകൾ, ഗസറ്റഡ് അവധികൾ & ബയോമെട്രിക് ഹാജർ വിവരങ്ങൾ.'
                : 'ഔദ്യോഗിക സി.എസ്.എൽ പെർമനന്റ് എംപ്ലോയി കലണ്ടർ · ഷിപ്പ്‌യാർഡ് ഷിഫ്റ്റുകൾ, ഗസറ്റഡ് അവധികൾ & ബയോമെട്രിക് ഹാജർ വിവരങ്ങൾ.')
            : (isContract
                ? 'Official CSL Company on Contract Employee Calendar · Shipyard Shifts, Gazetted Holidays & Bas Biometric Roster.'
                : 'Official CSL Permanent Employee Calendar · Shipyard Shifts, Gazetted Holidays & Bas Biometric Roster.')}
        </div>
        
        {/* Subtle glowing star in corner */}
        <div className="absolute -bottom-2 -right-2 w-10 h-10 pointer-events-none opacity-40">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M 50 0 Q 52 48 100 50 Q 52 52 50 100 Q 48 52 0 50 Q 48 48 50 0 Z" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      {/* Bottom Quick Links in Cyan matching QuickAccess */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-1 mb-6 text-xs sm:text-sm font-bold text-cyan-400">
        <button
          type="button"
          onClick={onBackToQuickAccess}
          className="hover:text-cyan-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Quick Access</span>
          <span>→</span>
        </button>

        <span className="text-slate-600">·</span>

        <button
          type="button"
          onClick={onOpenSalary}
          className="hover:text-cyan-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <IndianRupee className="w-3.5 h-3.5 text-teal-400" />
          <span>Salary</span>
          <span>→</span>
        </button>

        <span className="text-slate-600">·</span>

        <button
          type="button"
          onClick={onOpenAttendance}
          className="hover:text-cyan-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Attendance</span>
          <span>→</span>
        </button>
      </div>

      {/* Next Month OT Details PDF Modal */}
      {showNextMonthOtModal && (() => {
        const otData = prepareNextMonthOtPdfData();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-[#061825] rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-amber-500/40 text-white max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#0f354c] mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-400 stroke-[2.4]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm sm:text-base">
                      {isMl ? 'വരാനിരിക്കുന്ന നവംബർ ശമ്പളത്തിലെ OT വിവരങ്ങൾ' : 'Upcoming November Salary OT Details'}
                    </h3>
                    <p className="text-[10px] text-amber-300 font-mono">
                      {isMl 
                        ? `ശമ്പള മാസം: ${otData.nextMonthName} ${otData.nextMonthYear} · ${otData.cyclePeriod}` 
                        : `Monthly Salary: ${otData.nextMonthName.toUpperCase()} ${otData.nextMonthYear} · ${otData.cyclePeriod}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNextMonthOtModal(false)}
                  className="w-8 h-8 rounded-full bg-[#092a3a] hover:bg-[#0f354c] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                {/* Employee Particulars */}
                <div className="p-3 rounded-2xl bg-[#071f30] border border-[#103a55] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Employee Name:</span>
                    <span className="font-bold text-white">{otData.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">{isMl ? 'സി.എസ്.എൽ കോഡ് നമ്പർ:' : 'CSL Code Number:'}</span>
                    <span className="font-bold text-cyan-300 font-mono">{otData.tokenNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Department:</span>
                    <span className="font-bold text-slate-200">{otData.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Category:</span>
                    <span className="font-bold text-emerald-400">{otData.category}</span>
                  </div>
                </div>

                {/* Overtime Highlight Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#251705] border border-amber-500/50">
                    <div className="text-[10px] text-amber-300 font-bold tracking-wider uppercase">
                      {isMl ? 'ആകെ OT മണിക്കൂറുകൾ' : 'TOTAL OT HOURS'}
                    </div>
                    <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                      {otData.totalOtHours.toFixed(1)} hrs
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#072430] border border-cyan-500/40">
                    <div className="text-[10px] text-cyan-300 font-bold tracking-wider uppercase">
                      {isMl ? 'ആകെ OT ദിവസങ്ങൾ' : 'TOTAL OT DAYS'}
                    </div>
                    <div className="text-lg font-black text-cyan-200 font-mono mt-0.5">
                      {otData.totalOtDays} Days
                    </div>
                  </div>
                </div>

                {/* Filter Notice Banner: Cycle Period & Only Dates and OT Hours */}
                <div className="p-2.5 rounded-xl bg-[#0a2333] border border-cyan-500/40 text-[10.5px] text-cyan-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-amber-300">
                      {isMl
                        ? `CSL OT സൈക്കിൾ: ${otData.cyclePeriod}`
                        : `CSL OT Cycle: ${otData.cyclePeriod}`}
                    </div>
                    <div>
                      {isMl 
                        ? 'ഒക്ടോബർ 20 മുതൽ നവംബർ 19 വരെയുള്ള OT മാത്രമാണ് നവംബർ ശമ്പളത്തിൽ ഉൾപ്പെടുത്തിയിട്ടുള്ളത്. നവംബർ 19-ന് ശേഷമുള്ള OT അടുത്ത മാസത്തെ ശമ്പളത്തിൽ ലഭിക്കും.'
                        : 'Overtime between 20 Oct and 19 Nov is included in the November salary. Any OT on or after 20 Nov moves to the next payroll cycle.'}
                    </div>
                  </div>
                </div>

                {/* Verified OT Dates & Hours Table (Strictly only dates with OT!) */}
                <div className="p-3 rounded-2xl bg-[#071f30] border border-[#103a55] space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#0f354c]">
                    <span className="font-sans font-bold text-white text-xs">
                      {isMl ? 'തീയതിയും OT മണിക്കൂറുകളും' : 'Dates & OT Hours'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-sans font-bold">
                      {otData.otLogs.length} {isMl ? 'ദിവസങ്ങൾ' : 'Days'}
                    </span>
                  </div>

                  {otData.otLogs.length === 0 ? (
                    <div className="py-3 text-center text-slate-400 font-sans text-xs">
                      {isMl ? 'ഈ മാസത്തിൽ OT ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല' : 'No overtime hours recorded for this month'}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {otData.otLogs.map((row) => (
                        <div key={row.dayNumber} className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#051824] border border-[#0f354c]/60">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[10px] w-4">#{row.slNo}</span>
                            <span className="text-slate-100 font-bold">{row.dateStr}</span>
                            <span className="text-slate-400 text-[10px]">({row.dayName.slice(0, 3)})</span>
                          </div>
                          <span className="font-black text-amber-400 text-xs font-mono">
                            {row.otHoursFormatted}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download Success Notice */}
                {otDownloadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex flex-col gap-1.5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="text-emerald-300 font-extrabold">{isMl ? 'ഡൗൺലോഡ് വിജയകരമായി പൂർത്തിയായി!' : 'Download Complete!'}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-normal">
                      {isMl
                        ? `ഫോണിന്റെ നോട്ടിഫിക്കേഷൻ ബാറിലും Downloads ഫോൾഡറിലും CSL_Next_Month_OT_Details_${otData.nextMonthName}_${otData.tokenNumber}.pdf കാണാം.`
                        : `File saved as CSL_Next_Month_OT_Details_${otData.nextMonthName}_${otData.tokenNumber}.pdf in your Downloads.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowInAppOtPdfViewer(true)}
                      className="mt-1 w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] text-center cursor-pointer active:scale-95 transition-all"
                    >
                      {isMl ? 'ഇവിടെ നേരിട്ട് തുറന്നു കാണുക' : 'Open & View Here Directly'}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons: View, WhatsApp, Download, Print */}
              <div className="pt-3 border-t border-[#0f354c] flex flex-col gap-2.5 mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 1. View Full PDF */}
                  <button
                    type="button"
                    onClick={() => setShowInAppOtPdfViewer(true)}
                    className="px-2.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                    title="View Full Next Month OT PDF inside App"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isMl ? 'തുറന്നു കാണുക' : 'View Full PDF'}</span>
                  </button>

                  {/* 2. WhatsApp (JPG) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowInAppOtPdfViewer(true);
                    }}
                    className="px-2.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                    title="Share as JPG Image to WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>WhatsApp (JPG)</span>
                  </button>

                  {/* 3. Download */}
                  <button
                    type="button"
                    onClick={handleDownloadNextMonthOtPdf}
                    disabled={isDownloadingOtPdf}
                    className="px-2.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60"
                    title="Download Next Month OT PDF"
                  >
                    {isDownloadingOtPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : otDownloadSuccess ? (
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{otDownloadSuccess ? (isMl ? 'സേവ് ആയി!' : 'Saved!') : (isMl ? 'ഡൗൺലോഡ്' : 'Download')}</span>
                  </button>

                  {/* 4. Print / PDF */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2.5 py-2.5 rounded-xl bg-[#0f354c] hover:bg-[#164e72] active:bg-[#1a5b85] text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 border border-[#1b5b85]"
                    title="Print or Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isMl ? 'പ്രിന്റ് / സേവ്' : 'Print / PDF'}</span>
                  </button>
                </div>

                {/* Close Button & Mobile Tip */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[10px] text-amber-300 leading-tight">
                    {isMl ? '💡 "തുറന്നു കാണുക" വഴി ആപ്പിൽ നേരിട്ട് PDF കാണാം' : '💡 Use "View Full PDF" to see clean register or "Download"'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNextMonthOtModal(false)}
                    className="shrink-0 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer transition-all active:scale-95"
                  >
                    {isMl ? 'അടയ്ക്കുക' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dedicated Next Month OT Viewer Modal */}
      <CslNextMonthOtViewerModal
        isOpen={showInAppOtPdfViewer}
        onClose={() => setShowInAppOtPdfViewer(false)}
        data={prepareNextMonthOtPdfData()}
        language={language}
      />

      {/* Monthly Details PDF Modal */}
      {showMusterSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#061825] rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-[#0f354c] text-white max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#0f354c] mb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">Download Monthly Details PDF</h3>
                  <p className="text-[10px] text-cyan-300 font-mono">Month: {currentMonthConfig.name.toUpperCase()} 2026</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMusterSlip(false)}
                className="w-8 h-8 rounded-full bg-[#092a3a] flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              {/* Employee Summary Card */}
              <div className="p-3 rounded-2xl bg-[#071f30] border border-[#103a55] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Employee Name:</span>
                  <span className="font-bold text-white">{currentUser?.name || (isMl ? 'CSL ജീവനക്കാരൻ' : 'CSL Employee')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">{isMl ? 'സി.എസ്.എൽ കോഡ് നമ്പർ:' : 'CSL Code Number:'}</span>
                  <span className="font-bold text-cyan-300 font-mono">{currentUser?.token || '5312'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Department:</span>
                  <span className="font-bold text-slate-200">{currentUser?.department || 'Hull Errection'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Category:</span>
                  <span className="font-bold text-emerald-400">
                    {isContract ? 'Company on Contract Employee (CSL)' : 'Permanent Employee (CSL)'}
                  </span>
                </div>
              </div>

              {/* Attendance Statistics */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#082235] border border-[#0f354c]">
                  <div className="text-[10px] text-slate-400 font-bold">TOTAL</div>
                  <div className="text-base font-extrabold text-white">{currentMonthConfig.days}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#052621] border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 font-bold">ATTENDED</div>
                  <div className="text-base font-extrabold text-emerald-300">
                    {presentDays.length}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#241706] border border-amber-500/40">
                  <div className="text-[10px] text-amber-400 font-bold">LEAVES</div>
                  <div className="text-base font-extrabold text-amber-300">
                    {totalLeavesCount}
                  </div>
                  <div className="text-[7.5px] font-mono text-slate-300 mt-0.5 leading-tight">
                    CL:{clDaysCount} EL:{elDaysCount} HPL:{hplDaysCount}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#240a12] border border-rose-500/40">
                  <div className="text-[10px] text-rose-400 font-bold">OFFS</div>
                  <div className="text-base font-extrabold text-rose-300">
                    {currentMonthConfig.weeklyOffs + currentMonthConfig.holidaysCount}
                  </div>
                </div>
              </div>

              {/* Verified Duty Logs */}
              <div className="p-3 rounded-2xl bg-[#071f30] border border-[#103a55] space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans font-bold text-white text-xs">
                    {isMl ? 'ബയോമെട്രിക് ഹാജർ വിവരങ്ങൾ' : 'Biometric Attendance Logs'}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-sans">
                    {isMl ? 'മുഴുവൻ മാസവും PDF-ൽ' : `Complete ${currentMonthConfig.days}-Day Register in PDF`}
                  </span>
                </div>
                {(() => {
                  let storedLogs = [];
                  try {
                    const saved = localStorage.getItem(monthLogsKey) || (selectedMonth === getIstDate().getMonth() ? localStorage.getItem('csl_attendance_daily_logs_v2') : null);
                    if (saved) storedLogs = JSON.parse(saved);
                  } catch {}

                  const daysToShow = [];
                  for (let d = currentMonthConfig.days; d >= 1; d--) {
                    const dateObj = new Date(selectedYear, selectedMonth, d);
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayName = dayNames[dateObj.getDay()];
                    const dateStr = `${String(d).padStart(2, '0')} ${currentMonthConfig.name.slice(0, 3)} (${dayName})`;
                    const holInfo = isCslHolidayDate(dateObj, selectedMonth);
                    const leave = leaveRecords[d];
                    const isPres = presentDays.includes(d);
                    const matchedLog = storedLogs.find((l: any) => l.dayNum === d);

                    if (leave) {
                      daysToShow.push({
                        day: d,
                        label: dateStr,
                        detail: `${leave.type} · ${leave.duration || 'Full Day'} (${leave.reason || 'Leave'})`,
                        color: 'text-amber-400',
                      });
                    } else if (isPres) {
                      const inT = matchedLog && matchedLog.inTime && matchedLog.inTime !== '—' ? matchedLog.inTime : '07:00 AM';
                      const outT = matchedLog && matchedLog.outTime && matchedLog.outTime !== '—' ? matchedLog.outTime : '03:20 PM';
                      daysToShow.push({
                        day: d,
                        label: dateStr,
                        detail: `IN: ${inT} · OUT: ${outT}`,
                        color: 'text-emerald-400',
                      });
                    } else if (holInfo.isHoliday) {
                      daysToShow.push({
                        day: d,
                        label: dateStr,
                        detail: `${holInfo.holidayName || 'Holiday'} (Holiday)`,
                        color: 'text-rose-400',
                      });
                    }
                  }

                  if (daysToShow.length === 0) {
                    return (
                      <div className="py-2 text-center text-slate-400 font-sans text-xs">
                        {isMl ? 'രേഖപ്പെടുത്തിയ വിവരങ്ങൾ ലഭ്യമല്ല' : 'No biometric logs recorded yet for this month'}
                      </div>
                    );
                  }

                  return daysToShow.slice(0, 6).map((item, idx) => (
                    <div key={item.day} className={`flex justify-between py-1 ${idx < Math.min(daysToShow.length, 6) - 1 ? 'border-b border-[#0f354c]' : ''}`}>
                      <span className="text-slate-300">{item.label}:</span>
                      <span className={`font-bold ${item.color} truncate max-w-[200px] text-right`}>{item.detail}</span>
                    </div>
                  ));
                })()}
              </div>

              {pdfDownloadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex flex-col gap-1.5 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-emerald-300 font-extrabold">{isMl ? 'ഡൗൺലോഡ് വിജയകരമായി പൂർത്തിയായി!' : 'Download Complete!'}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-normal">
                    {isMl
                      ? 'ഫോണിന്റെ നോട്ടിഫിക്കേഷൻ ബാറിലും "Files / Downloads" ഫോൾഡറിലും CSL_Attendance_October_2026_5312.pdf കാണാം.'
                      : 'File saved as CSL_Attendance_October_2026_5312.pdf in your Downloads folder.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowInAppPdfViewer(true)}
                    className="mt-1 w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] text-center cursor-pointer active:scale-95 transition-all"
                  >
                    {isMl ? 'ഇവിടെ നേരിട്ട് തുറന്നു കാണുക' : 'Open & View Here Directly'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions: 4 Dedicated Reliable Options for Mobile & PWA */}
            <div className="pt-3 border-t border-[#0f354c] flex flex-col gap-2.5 mt-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. In-App Direct Full View (Works 100% in PWA & Mobile without new tab) */}
                <button
                  type="button"
                  onClick={() => setShowInAppPdfViewer(true)}
                  className="px-2.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  title="View Full Attendance Document inside App"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isMl ? 'തുറന്നു കാണുക' : 'View Full PDF'}</span>
                </button>

                {/* 2. Direct WhatsApp Share */}
                <button
                  type="button"
                  onClick={handleWhatsAppQuickShare}
                  className="px-2.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  title="Share Full Register Details to WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* 3. Direct Download */}
                <button
                  type="button"
                  onClick={handleDownloadMonthlyPdf}
                  disabled={isDownloadingPdf}
                  className="px-2.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60"
                  title="Download PDF File"
                >
                  {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (pdfDownloadSuccess ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Download className="w-3.5 h-3.5" />)}
                  <span>{pdfDownloadSuccess ? (isMl ? 'സേവ് ആയി!' : 'Saved!') : (isMl ? 'ഡൗൺലോഡ്' : 'Download')}</span>
                </button>

                {/* 4. Print / Native Save as PDF */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-2.5 rounded-xl bg-[#0f354c] hover:bg-[#164e72] active:bg-[#1a5b85] text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 border border-[#1b5b85]"
                  title="Print or Save as PDF via Android System"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isMl ? 'പ്രിന്റ് / സേവ്' : 'Print / PDF'}</span>
                </button>
              </div>

              {/* Close Button & Mobile Tip */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-cyan-300 leading-tight">
                  {isMl ? '💡 ഫോണിൽ നേരിട്ട് കാണാൻ "തുറന്നു കാണുക" അല്ലെങ്കിൽ WhatsApp ഉപയോഗിക്കുക' : '💡 Use "View Full PDF" to see report or "WhatsApp" to share'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowMusterSlip(false)}
                  className="shrink-0 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer transition-all active:scale-95"
                >
                  {isMl ? 'അടയ്ക്കുക' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Dedicated In-App PDF & Document Muster Viewer Modal */}
      <CslMonthlyPdfViewerModal
        isOpen={showInAppPdfViewer}
        onClose={() => setShowInAppPdfViewer(false)}
        data={prepareMonthlyPdfData()}
        language={language}
      />

      {/* Half Day WhatsApp Share Modal */}
      <HalfDayWhatsAppShareModal
        isOpen={isHalfDayCalendarModalOpen}
        onClose={() => setHalfDayCalendarModalOpen(false)}
        language={language}
        defaultPunchType="IN"
        defaultDate={selectedDate ? `${selectedDate} ${currentMonthConfig.name} ${selectedYear}` : undefined}
        defaultShift={(selectedDate ? dayShifts[selectedDate] : undefined) || 'A2'}
        defaultSession="First Half"
        currentUser={currentUser}
        onPunchRecorded={(params) => {
          const dayToMark = selectedDate || new Date().getDate();
          if (!presentDays.includes(dayToMark)) {
            togglePresent(dayToMark);
          }
          if (params.dutyCategory === 'full_day_ot' && (Number(params.otHours) || 0) > 0) {
            const otH = Number(params.otHours) || 1;
            const shf = (params.shiftCode as CslShiftCode) || dayShifts[dayToMark] || 'A2';
            const sDef = CSL_SHIFTS[shf] || CSL_SHIFTS['A2'];
            handleSaveCalendarDutyPunch({
              dateStr: `${dayToMark} ${currentMonthConfig.name.slice(0, 3)} ${selectedYear}`,
              shift: shf,
              inTime: sDef.inTime,
              outTime: params.time || sDef.outTime,
              ot: `0${otH}:00`.slice(-5),
              leave: 'None',
              halfDay: 'No',
              notes: `${otH} hrs Overtime (OT)`,
            });
          }
        }}
      />
      {/* Duty Punch & Punch Time Edit Modal from Calendar */}
      <DutyPunchModal
        isOpen={calendarDutyModalOpen}
        onClose={() => setCalendarDutyModalOpen(false)}
        onSave={handleSaveCalendarDutyPunch}
        initialDate={calendarPunchDateStr}
        initialShift={calendarPunchShift}
        initialInTime={calendarPunchIn}
        initialOutTime={calendarPunchOut}
        initialOt={calendarPunchOt}
        initialNotes={calendarPunchNotes}
        language={language}
        currentUser={currentUser}
      />
      </div>
    </div>
  );
};
