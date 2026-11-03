export type Language = 'en' | 'ml' | 'hi';

export type EmployeeCategory = 
  | 'permanent'
  | 'contract'
  | 'apprentice'
  | 'vendor';

export interface UserProfile {
  name: string;
  nameMl: string;
  id: string;
  department: string;
  departmentMl: string;
  designation: string;
  designationMl: string;
  category: EmployeeCategory;
  email: string;
  phone: string;
  bloodGroup: string;
  validUntil: string;
  gateAccess: string[];
  safetyCertNo: string;
}

export interface StructuralComponent {
  componentId?: string;
  name: string;
  category: string;
  steelGrade: string;
  thicknessOrProfile: string;
  dimensionsMm?: string;
  quantity?: string;
  locationOrFrame?: string;
  weightEstKg?: string;
  notes?: string;
}

export interface WeldingJoint {
  jointId?: string;
  jointType: string;
  weldType: string;
  throatThickness?: string;
  ndtTesting?: string;
  specification?: string;
}

export interface PenetrationItem {
  location?: string;
  purpose?: string;
  dimensionMm?: string;
  reinforcementOrCollar?: string;
}

export interface DrawingAnalysisResult {
  drawingInfo: {
    drawingNumber: string;
    drawingTitle: string;
    vesselTypeOrProject?: string;
    yardBlock?: string;
    revision?: string;
    classificationSociety?: string;
    scale?: string;
    date?: string;
    approvedBy?: string;
  };
  executiveSummary: string;
  structuralComponents: StructuralComponent[];
  weldingAndJoints?: WeldingJoint[];
  penetrationsAndAccess?: PenetrationItem[];
  qualityAndSafetyChecks: string[];
  extractedConfidenceScore?: number;
}
