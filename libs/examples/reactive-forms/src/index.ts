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
export { ArrayControlComponent } from './lib/components/array/array-control.component';

// Provider
export { provideReactiveFormsExamples } from './lib/provide-reactive-forms-examples';

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
