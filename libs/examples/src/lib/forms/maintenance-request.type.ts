// Groups may be absent at runtime when hidden with hideStrategy: 'remove',
// so every group is optional.
export type MaintenanceRequest = {
  requester?: Partial<RequesterGroup>;
  asset?: Partial<AssetGroup>;
  details?: Partial<DetailsGroup>;
  plan?: Partial<PlanGroup>;
  costs?: Partial<CostsGroup>;
  approvals?: Partial<ApprovalsGroup>;
  compliance?: Partial<ComplianceGroup>;
  logistics?: Partial<LogisticsGroup>;
  summary?: Partial<SummaryGroup>;
  consent?: Partial<ConsentGroup>;
};

/* -------------------- Requester -------------------- */
export type Department =
  | 'IT'
  | 'Facilities'
  | 'Operations'
  | 'Finance'
  | 'HR';

export type YesNo = 'yes' | 'no';

export interface RequesterGroup {
  fullName: string;
  email: string;
  department: Department;
  isOnsite: YesNo;
  contactNumber: string;
}

/* ---------------------- Asset ---------------------- */
export type Site = 'HQ' | 'DC-01' | 'MFG';
export type AssetType = 'Electrical' | 'HVAC' | 'Network' | 'Application' | 'Other';

export interface AssetGroup {
  site: Site;
  building: string;
  room: string;       // "Rack" label dynamically when DC-01
  assetType: AssetType;
  assetId: string;    // may be readonly in UI in some cases
}

/* --------------------- Details --------------------- */
export type Category = 'Power' | 'Cooling' | 'Network' | 'Application' | 'Security' | 'Other';
export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type BusinessImpact = 'none' | 'minor' | 'major' | 'severe';
export type NetworkScope = 'Edge' | 'Core' | 'Access';
export type AppTier = 'Frontend' | 'Backend' | 'Database';
export type SecurityType = 'Access' | 'Malware' | 'Physical';

export interface DetailsGroup {
  category: Category;
  urgency: Urgency;
  description: string;
  peopleAffected: number;
  businessImpact: BusinessImpact;

  // Category-specific (conditionally shown)
  powerVoltage?: number;                          // when category === 'Power'
  coolingTemp?: number;                           // when category === 'Cooling'
  networkScope?: NetworkScope;                    // when category === 'Network'
  appTier?: AppTier;                              // when category === 'Application'
  securityType?: SecurityType;                    // when category === 'Security'

  // Computed control (text)
  severityScore: string;                          // 'Low/Medium/High' numeric string in example
}

/* ---------------------- Plan ----------------------- */
export type ChangeWindow = 'AM' | 'PM' | 'Night';

export interface PlanGroup {
  requiresDowntime: boolean;
  downtimeMinutes?: number;                       // only when requiresDowntime
  changeWindow?: ChangeWindow;                    // only when requiresDowntime
  rollbackReady?: boolean;                        // only when requiresDowntime
  changeComplexity: string;                       // computed ('Low' | 'Medium' | 'High' text)
}

/* ---------------------- Costs ---------------------- */
export interface CostsGroup {
  materialCost: number;
  laborHours: number;
  hourlyRate: number;
  discountEligible?: boolean;                     // only for Finance dept
  discountPercent?: number;                       // only when discountEligible

  // Computed controls (text numbers)
  subtotal: string;                               // e.g., "123.45"
  totalDue: string;                               // e.g., "98.76"
}

/* -------------------- Approvals -------------------- */
export interface ApprovalsGroup {
  managerApprovalNeeded: boolean;                 // can be readonly in UI based on urgency
  managerApproved?: boolean;                      // only when needed
  financeApprovalNeeded?: boolean;                // when totalDue > threshold
  financeApproved?: boolean;                      // only when financeApprovalNeeded
}

/* ------------------- Compliance -------------------- */
export type DataSensitivity = 'none' | 'internal' | 'confidential' | 'pii';
export type PrivacyImpact = 'no' | 'yes';

export interface ComplianceGroup {
  dataSensitivity: DataSensitivity;
  privacyImpact?: PrivacyImpact;                  // hidden when dataSensitivity === 'none'
  securityOpsNotified?: boolean;                  // only for Security category
  exportRestricted?: boolean;                     // for confidential/pii
  complianceFlag: string;                         // computed ('OK' | 'Check policy' | 'Requires review')
}

/* -------------------- Logistics -------------------- */
export interface LogisticsGroup {
  accessRequired: boolean;
  escortRequired?: boolean;                       // only when accessRequired
  siteContact?: string;                           // only when accessRequired
  sparePartsAvailable: boolean;
  vendorInvolved: boolean;
  vendorName?: string;                            // only when vendorInvolved
  vendorTicket?: string;                          // only when vendorInvolved
}

/* --------------------- Summary --------------------- */
export interface SummaryGroup {
  ticketTitle: string;                            // computed
  shortRef: string;                               // computed
  readyToSubmit: string;                          // computed
}

/* ---------------------- Consent -------------------- */
export interface ConsentGroup {
  acknowledgePolicies: boolean;
  finalHash: string;                              // computed
}
