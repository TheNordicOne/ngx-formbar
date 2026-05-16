// Component type interfaces
export type { TextControl } from './lib/types/text-control.type';
export type { NumberControl } from './lib/types/number-control.type';
export type { CheckboxControl } from './lib/types/checkbox-control.type';
export type { RadioControl } from './lib/types/radio-control.type';
export type { DropdownControl } from './lib/types/dropdown-control.type';
export type { GroupControl } from './lib/types/group-control.type';
export type { NoteControl } from './lib/types/note-control.type';
export type { TextareaControl } from './lib/types/textarea-control.type';
export type { DateControl } from './lib/types/date-control.type';
export type { FileControl } from './lib/types/file-control.type';
export type { ManualTextControl } from './lib/types/manual-text-control.type';

export type { ComponentRegistrations } from './lib/types/component-registrations.type';

// Union type
export type { ExampleControls } from './lib/types/form-controls.type';

// Form definitions
export { maintenanceForm } from './lib/forms/maintenance-form';
export { complexMaintenanceForm } from './lib/forms/complex-maintenance-form';
export { maintenanceFormLarge } from './lib/forms/maintenance-form-large';
export { highlyComputedForm } from './lib/forms/highly-computed-form';
export type {
  MaintenanceRequest,
  Department,
  YesNo,
  RequesterGroup,
  Site,
  AssetType,
  AssetGroup,
  Category,
  Urgency,
  BusinessImpact,
  NetworkScope,
  AppTier,
  SecurityType,
  DetailsGroup,
  ChangeWindow,
  PlanGroup,
  CostsGroup,
  ApprovalsGroup,
  DataSensitivity,
  PrivacyImpact,
  ComplianceGroup,
  LogisticsGroup,
  SummaryGroup,
  ConsentGroup,
} from './lib/forms/maintenance-request.type';

// Resolver
export { HybridComponentResolver } from './lib/resolvers/hybrid-component-resolver';

// Validation utilities
export { isEmpty, toNumber, getByPath } from './lib/validation/utilities';
