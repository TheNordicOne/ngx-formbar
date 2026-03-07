/*
 * Public API Surface of examples
 */

// Components
export { TextControlComponent } from './lib/components/text/text-control.component';
export { NumberControlComponent } from './lib/components/number/number-control.component';
export { CheckboxControlComponent } from './lib/components/checkbox/checkbox-control.component';
export { RadioControlComponent } from './lib/components/radio/radio-control.component';
export { DropdownControlComponent } from './lib/components/dropdown/dropdown-control.component';
export { GroupControlComponent } from './lib/components/group/group-control.component';
export { NoteControlComponent } from './lib/components/note/note-control.component';
export { TextareaControlComponent } from './lib/components/textarea/textarea-control.component';
export { DateControlComponent } from './lib/components/date/date-control.component';
export { FileControlComponent } from './lib/components/file/file-control.component';

// Component type interfaces
export type { TextControl } from './lib/components/text/text-control.type';
export type { NumberControl } from './lib/components/number/number-control.type';
export type { CheckboxControl } from './lib/components/checkbox/checkbox-control.type';
export type { RadioControl } from './lib/components/radio/radio-control.type';
export type { DropdownControl } from './lib/components/dropdown/dropdown-control.type';
export type { GroupControl } from './lib/components/group/group-control.type';
export type { NoteControl } from './lib/components/note/note-control.type';
export type { TextareaControl } from './lib/components/textarea/textarea-control.type';
export type { DateControl } from './lib/components/date/date-control.type';
export type { FileControl } from './lib/components/file/file-control.type';

// Union type
export type { ExampleControls } from './lib/types/form-controls.type';

// Provider
export { provideExamples } from './lib/provide-examples';

// Registrations
export {
  componentRegistrations,
  validatorRegistrations,
  asyncValidatorRegistrations,
} from './lib/registrations';

// Sync validators
export {
  integer,
  min0,
  range1to10,
  range1to480,
  minLen,
  floorPattern,
  alnumDash,
  circuitPattern,
  isoDate,
  requiredWhenVisible,
  requiredWhenCritical,
  requiredWhenCriticalOrNeeded,
  letterValidator,
  noDuplicateValuesValidator,
  forbiddenLetterAValidator,
} from './lib/validation/sync.validators';

// Async validators
export {
  emailDomainAllowed,
  roomExists,
  unitKnownAtLocation,
  approverActive,
  asyncValidator,
  asyncGroupValidator,
} from './lib/validation/async.validators';

// Validation utilities
export { isEmpty, toNumber, getByPath } from './lib/validation/utilities';

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

// Helpers (view providers, host directive configs)
export {
  viewProviders,
  ngxfbControlHostDirective,
  ngxfbGroupHostDirective,
  ngxfbBlockHostDirective,
} from './lib/helpers';

// Resolver
export { HybridComponentResolver } from './lib/resolvers/hybrid-component-resolver';
