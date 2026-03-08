import { AbstractControl, ValidationErrors } from '@angular/forms';
import { getByPath, isEmpty } from '@ngx-formbar/examples';
import { map, Observable, of, timer } from 'rxjs';

// ---------------------------------------------------------------------------
// Docs async validators
// ---------------------------------------------------------------------------
export function emailDomainAllowed(c: AbstractControl) {
  const v = c.value as unknown;
  if (isEmpty(v)) {
    return of(null);
  }
  if (typeof v !== 'string' || !v.includes('@')) {
    return of(null);
  }

  const allowed = ['example.com', 'corp.local', 'intranet.company'];
  const domain = v.split('@').pop() ?? '';

  return timer(350).pipe(
    map(() => {
      if (allowed.includes(domain)) {
        return null;
      }
      return { emailDomainAllowed: { allowed, domain } };
    }),
  );
}

export function roomExists(c: AbstractControl) {
  const buildingCtrl = getByPath(c, 'location.building');
  const floorCtrl = getByPath(c, 'location.floor');
  const roomCtrl = getByPath(c, 'location.room');

  const building: unknown = buildingCtrl ? buildingCtrl.value : undefined;
  const floor: unknown = floorCtrl ? floorCtrl.value : undefined;
  const room: unknown = roomCtrl ? roomCtrl.value : undefined;

  if (isEmpty(building) || isEmpty(floor) || isEmpty(room)) {
    return of(null);
  }

  // Mock directory of rooms
  const knownRooms: Record<string, string[]> = {
    'A-3': ['A-310', 'A-311', 'A-315'],
    'A-G': ['A-G12', 'A-G14'],
    'B-2': ['B-201', 'B-205'],
    'C-1': ['C-101', 'C-110'],
  };

  const key = String(building) + '-' + String(floor);

  return timer(400).pipe(
    map(() => {
      const exists =
        key in knownRooms && knownRooms[key].includes(String(room));
      if (exists) {
        return null;
      }
      return { roomExists: { building, floor, room } };
    }),
  );
}

export function unitKnownAtLocation(c: AbstractControl) {
  const v = c.value as unknown;
  if (isEmpty(v)) {
    return of(null);
  }

  const buildingCtrl = getByPath(c, 'location.building');
  const building: unknown = buildingCtrl ? buildingCtrl.value : undefined;

  if (isEmpty(building)) {
    return of(null);
  }

  // Mock inventory by building
  const inventory: Record<string, string[]> = {
    A: ['RTU-01', 'RTU-07', 'AHU-02'],
    B: ['RTU-03', 'VAV-12'],
    C: ['RTU-05', 'AHU-01'],
  };

  return timer(450).pipe(
    map(() => {
      const list = inventory[String(building)] ?? [];
      if (list.includes(String(v))) {
        return null;
      }
      return { unitKnownAtLocation: { building, unitId: String(v) } };
    }),
  );
}

export function approverActive(c: AbstractControl) {
  const v = c.value as unknown;
  if (isEmpty(v)) {
    return of(null);
  }

  // Mock HR directory status
  const activeIds = new Set([
    'ops_manager_1',
    'ops_manager_2',
    'facilities_lead',
  ]);
  const suspendedIds = new Set(['ops_manager_0']);
  const onLeaveIds = new Set(['facilities_backup']);

  return timer(300).pipe(
    map(() => {
      const id = String(v);
      if (activeIds.has(id)) {
        return null;
      }
      if (suspendedIds.has(id)) {
        return { approverActive: { status: 'suspended', id } };
      }
      if (onLeaveIds.has(id)) {
        return { approverActive: { status: 'onLeave', id } };
      }
      return { approverActive: { status: 'unknown', id } };
    }),
  );
}

// ---------------------------------------------------------------------------
// Test async validators (from reactive-forms test suite)
// ---------------------------------------------------------------------------
export function asyncValidator(
  control: AbstractControl<string | undefined | null>,
): Observable<ValidationErrors | null> {
  const value = control.value;
  if (containsText(value, 'async')) {
    return of(null);
  }
  return of({ async: { value } });
}

export function asyncGroupValidator(
  control: AbstractControl<unknown>,
): Observable<ValidationErrors | null> {
  const value = control.value;
  if (!value) {
    return of(null);
  }
  if (typeof value !== 'object') {
    const includesAsync = containsText(value, 'sync');
    return includesAsync ? of(null) : of({ async: { value } });
  }

  const values = Object.values(value);
  const someValueIncludesAsync = values.some((v) => containsText(v, 'sync'));
  return someValueIncludesAsync ? of(null) : of({ async: { value } });
}

function containsText(value: unknown, text: string) {
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase().includes(text);
}
