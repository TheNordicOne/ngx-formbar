import { NgxFbForm } from '@ngx-formbar/core';
import { FormControls } from '../helper/form.type';

// Groups may be absent at runtime when hidden with hideStrategy: 'remove',
// so every group (and its fields) is optional.
type MaintenanceFormType = {
  costs?: {
    hourlyRate?: number;
    laborHours?: number;
    materialCosts?: number;
    currency?: string;
  };
  details?: {
    urgency?: string;
    category?: string;
    description?: string;
    peopleAffected?: number;
  };
  sla?: {
    targetDays?: number;
  };
  scheduling?: {
    preferredDate?: string;
    downtimeMinutes?: number;
  };
  requester?: {
    fullName?: string;
    email?: string;
  };
  location?: {
    building?: string;
    room?: string;
  };
};

export const complexMaintenanceForm: NgxFbForm<FormControls> = {
  content: {
    // --- Context banner ------------------------------------------------------
    introNote: {
      isControl: false,
      type: 'note',
      message:
        'Submit a maintenance request for a single location and category. Fields may appear based on your selections.',
      severity: 'info',
    },

    // --- Requester -----------------------------------------------------------
    requester: {
      type: 'group',
      legend: 'Requester',
      controls: {
        fullName: {
          type: 'text',
          label: 'Full Name',
          placeHolder: 'e.g., Emma Frost',
          validators: ['required', 'min2Characters'],
        },
        mailInfo: {
          type: 'note',
          isControl: false,
          severity: 'warn',
          message:
            "Only these domains are allowed: 'example.com', 'corp.local', 'intranet.company'",
        },
        email: {
          type: 'text',
          label: 'Email',
          placeHolder: 'name@example.com',
          validators: ['required', 'email'],
          asyncValidators: ['emailDomainAllowed'],
        },
        department: {
          type: 'dropdown',
          label: 'Department',
          hidden: 'true',
          hideStrategy: 'remove',
          options: [
            { id: 'dep-1', value: 'ops', label: 'Operations' },
            { id: 'dep-2', value: 'it', label: 'IT' },
            { id: 'dep-3', value: 'hr', label: 'HR' },
            { id: 'dep-4', value: 'fac', label: 'Facilities' },
            { id: 'dep-5', value: 'other', label: 'Other' },
          ],
        },
      },
    },

    // --- Location ------------------------------------------------------------
    location: {
      type: 'group',
      legend: 'Location',
      controls: {
        building: {
          type: 'dropdown',
          label: 'Building',
          validators: ['required'],
          options: [
            { id: 'b-a', value: 'A', label: 'A' },
            { id: 'b-b', value: 'B', label: 'B' },
            { id: 'b-c', value: 'C', label: 'C' },
          ],
        },
        floor: {
          type: 'text',
          label: 'Floor',
          hint: 'Use B1, G, 1, 2, …',
          validators: ['required', 'floorPattern'],
        },
        room: {
          type: 'text',
          label: 'Room / Area',
          placeHolder: 'e.g., A-310',
          validators: ['required', 'min2Characters'],
          asyncValidators: ['roomExists'],
        },
      },
    },

    // --- Details -------------------------------------------------------------
    details: {
      type: 'group',
      dynamicTitle:
        "'Issue Details' + (details && details.category ? ' — ' + details.category : '')",
      controls: {
        category: {
          type: 'dropdown',
          label: 'Category',
          validators: ['required'],
          options: [
            { id: 'cat-hvac', value: 'hvac', label: 'HVAC' },
            { id: 'cat-elec', value: 'electrical', label: 'Electrical' },
            { id: 'cat-plum', value: 'plumbing', label: 'Plumbing' },
            { id: 'cat-clean', value: 'cleaning', label: 'Cleaning' },
            { id: 'cat-sec', value: 'security', label: 'Security' },
            { id: 'cat-oth', value: 'other', label: 'Other' },
          ],
        },
        urgency: {
          type: 'radio',
          label: 'Urgency',
          validators: ['required'],
          options: [
            { id: 'urg-low', value: 'low', label: 'Low' },
            { id: 'urg-med', value: 'medium', label: 'Medium' },
            { id: 'urg-high', value: 'high', label: 'High' },
            { id: 'urg-crit', value: 'critical', label: 'Critical' },
          ],
        },
        affectedAsset: {
          type: 'dropdown',
          label: 'Affected Asset',
          options: [
            { id: 'as-ws', value: 'workstation', label: 'Workstation' },
            { id: 'as-light', value: 'lighting', label: 'Lighting' },
            { id: 'as-elev', value: 'elevator', label: 'Elevator' },
            { id: 'as-rest', value: 'restroom', label: 'Restroom' },
            { id: 'as-door', value: 'door', label: 'Door Access' },
            { id: 'as-other', value: 'other', label: 'Other' },
          ],
        },
        assetOther: {
          type: 'text',
          label: 'Asset (Other)',
          hidden: 'details.affectedAsset !== "other"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
        },
        description: {
          type: 'textarea',
          label: 'Description',
          placeHolder: 'Describe the issue with symptoms, location, timing…',
          validators: ['required', 'min20Characters'],
          updateOn: 'blur',
        },

        peopleAffected: {
          type: 'number',
          label: 'People Affected (estimate)',
          min: 0,
          max: 5000,
          validators: ['integer', 'min0'],
        },
        impactScore: {
          type: 'number',
          label: '',
          dynamicLabel:
            "'Impact Score' + (details && details.urgency === 'critical' ? ' (required)' : '')",
          min: 1,
          max: 10,
          validators: ['integer', 'range1to10', 'requiredWhenCritical'],
          updateOn: 'change',
        },
      },
    },

    // --- HVAC Details --------------------------
    hvacDetails: {
      type: 'group',
      legend: 'HVAC Details',
      hidden: 'details.category !== "hvac"',
      hideStrategy: 'remove',
      valueStrategy: 'reset',
      controls: {
        hvacMode: {
          type: 'radio',
          label: 'System',
          options: [
            { id: 'hv-heat', value: 'heating', label: 'Heating' },
            { id: 'hv-cool', value: 'cooling', label: 'Cooling' },
          ],
          validators: ['required'],
        },
        unitId: {
          type: 'text',
          label: 'Unit ID',
          hint: 'e.g., RTU-07',
          validators: ['required', 'alnumDash'],
          asyncValidators: ['unitKnownAtLocation'],
        },
      },
    },

    electricalDetails: {
      type: 'group',
      legend: 'Electrical Details',
      hidden: 'details.category !== "electrical"',
      hideStrategy: 'remove',
      valueStrategy: 'reset',
      controls: {
        circuit: {
          type: 'text',
          label: 'Circuit / Panel',
          hint: 'e.g., P12-C03',
          validators: ['required', 'circuitPattern'],
        },
        powerLoss: {
          type: 'checkbox',
          label: 'Power loss present',
        },
      },
    },

    plumbingDetails: {
      type: 'group',
      legend: 'Plumbing Details',
      hidden: 'details.category !== "plumbing"',
      hideStrategy: 'remove',
      valueStrategy: 'reset',
      controls: {
        shutoffNeeded: {
          type: 'checkbox',
          label: 'Water shutoff required',
        },
        leakSeverity: {
          type: 'radio',
          label: 'Leak Severity',
          options: [
            { id: 'ls-low', value: 'low', label: 'Low' },
            { id: 'ls-med', value: 'medium', label: 'Medium' },
            { id: 'ls-high', value: 'high', label: 'High' },
          ],
        },
      },
    },

    // --- Scheduling -----------------------------------------
    scheduling: {
      type: 'group',
      legend: 'Scheduling',
      controls: {
        preferredDate: {
          type: 'date',
          label: 'Preferred Date',
          minDate: 'today',
          validators: ['isoDate'],
          updateOn: 'change',
        },
        preferredSlot: {
          type: 'dropdown',
          label: 'Preferred Time Slot',
          options: [
            { id: 'sl-am', value: 'am', label: 'Morning' },
            { id: 'sl-pm', value: 'pm', label: 'Afternoon' },
            { id: 'sl-eve', value: 'eve', label: 'Evening' },
          ],
        },
        downtimeRequired: {
          type: 'checkbox',
          label: 'Area downtime required',
        },
        downtimeMinutes: {
          type: 'number',
          label: 'Expected Downtime (minutes)',
          min: 1,
          max: 480,
          hidden: '!scheduling.downtimeRequired',
          hideStrategy: 'remove',
          valueStrategy: 'reset',
          validators: ['requiredWhenVisible', 'integer', 'range1to480'],
        },
      },
    },

    // --- Approvals --------------------------------------------
    approvals: {
      type: 'group',
      dynamicTitle:
        "'Approvals' + (details && details.urgency ? ' — ' + details.urgency : '')",
      hidden: '!(details.urgency === "high" || details.urgency === "critical")',
      hideStrategy: 'remove',
      valueStrategy: 'reset',
      controls: {
        needsManager: {
          type: 'checkbox',
          label: 'Manager approval obtained',
          validators: ['requiredWhenCritical'],
        },
        approver: {
          type: 'dropdown',
          label: 'Approver',
          options: [
            { id: 'ap-ops1', value: 'ops_manager_1', label: 'Ops Manager 1' },
            { id: 'ap-ops2', value: 'ops_manager_2', label: 'Ops Manager 2' },
            {
              id: 'ap-fac1',
              value: 'facilities_lead',
              label: 'Facilities Lead',
            },
          ],
          disabled: '!approvals?.needsManager',
          validators: ['requiredWhenCriticalOrNeeded'],
          asyncValidators: ['approverActive'],
        },
        approvalNote: {
          type: 'text',
          label: 'Approval Note (optional)',
          placeHolder: 'Ticket reference or verbal approval details…',
          readonly: '!approvals?.needsManager',
        },
      },
    },

    // --- Costs ------------------------------------
    costs: {
      type: 'group',
      legend: 'Costs',
      dynamicTitle: "'Costs (' + ((costs && costs.currency) || 'EUR') + ')'",
      controls: {
        currency: {
          type: 'dropdown',
          label: 'Currency',
          options: [
            { id: 'cur-eur', value: 'EUR', label: 'EUR' },
            { id: 'cur-usd', value: 'USD', label: 'USD' },
            { id: 'cur-gbp', value: 'GBP', label: 'GBP' },
          ],
          validators: ['required'],
          updateOn: 'change',
        },
        hourlyRate: {
          type: 'number',
          label: 'Hourly Rate',
          min: 0,
          validators: ['min0'],
          updateOn: 'blur',
        },
        laborHours: {
          type: 'number',
          label: 'Labor Hours',
          min: 0,
          validators: ['min0'],
          updateOn: 'blur',
        },
        materialCosts: {
          type: 'number',
          label: 'Material Costs',
          min: 0,
          validators: ['min0'],
          updateOn: 'blur',
        },
        totalCost: {
          type: 'text',
          label: 'Estimated Total',
          readonly: true,
          computedValue: (v) => {
            const value = v as MaintenanceFormType;
            const rate = value.costs?.hourlyRate ?? 0;
            const hours = value.costs?.laborHours ?? 0;
            const materials = value.costs?.materialCosts ?? 0;
            const sum = rate * hours + materials;
            const cur = value.costs?.currency ?? 'EUR';
            return `${sum.toFixed(2)} ${cur}`;
          },
        },
      },
    },

    // --- SLA -------------------------
    sla: {
      type: 'group',
      legend: 'SLA',
      hidden:
        "!details || !(details.urgency === 'high' || details.urgency === 'critical')",
      hideStrategy: 'remove',
      valueStrategy: 'reset',
      dynamicTitle: "'SLA (' + (details && details.urgency || 'n/a') + ')'",
      controls: {
        targetDays: {
          type: 'number',
          label: 'Target (days)',
          min: 1,
          validators: ['integer', 'min1'],
          updateOn: 'blur',
        },
        deadline: {
          type: 'text',
          label: 'SLA Deadline (computed)',
          readonly: true,
          computedValue: (v) => {
            const value = v as MaintenanceFormType;
            const urgency = value.details?.urgency;
            const override = value.sla?.targetDays ?? 0;
            const days =
              override > 0
                ? override
                : urgency === 'critical'
                  ? 1
                  : urgency === 'high'
                    ? 2
                    : 5;
            const start = value.scheduling?.preferredDate ?? '';
            const base = start ? new Date(start) : new Date();
            base.setDate(base.getDate() + days);
            return base.toISOString().slice(0, 10);
          },
          updateOn: 'change',
        },
      },
    },

    // --- Attachments ----------------
    attachments: {
      type: 'group',
      legend: 'Attachments',
      controls: {
        files: {
          type: 'file',
          label: 'Attach images or PDFs',
          multiple: true,
          accept: ['image/*', 'application/pdf'],
          validators: ['maxFiles5', 'imagesOrPdf'],
          asyncValidators: ['totalSizeUnder10mb'],
          updateOn: 'change',
        },
        attachmentsNote: {
          type: 'note',
          isControl: false,
          severity: 'warn',
          message: 'Avoid sensitive data. Redact personally identifiable info.',
        },
      },
    },

    // --- Summary ------------
    summary: {
      type: 'group',
      legend: 'Summary',
      controls: {
        ticketPreview: {
          type: 'textarea',
          label: 'Request Summary (auto)',
          readonly: true,
          computedValue: (v) => {
            const value = v as MaintenanceFormType;
            const name = value.requester?.fullName ?? 'Unknown';
            const email = value.requester?.email ?? 'n/a';
            const bldg = value.location?.building ?? '?';
            const room = value.location?.room ?? '?';
            const cat = value.details?.category ?? 'unspecified';
            const descr = value.details?.description ?? '';
            return [
              `Requester: ${name} <${email}>`,
              `Location: Building ${bldg}, Room ${room}`,
              `Category: ${cat}`,
              `Description: ${descr}`,
            ].join('\n');
          },
          updateOn: 'change',
          rows: 6,
          maxLength: 2000,
        },
        priorityScore: {
          type: 'text',
          label: '',
          dynamicLabel:
            "'Priority Score' + (peopleAffected && peopleAffected > 50 ? ' (High impact)' : '')",
          readonly: true,
          computedValue: (v) => {
            const value = v as MaintenanceFormType;
            const urgency = value.details?.urgency ?? 'low';
            const people = value.details?.peopleAffected ?? 0;
            const dowMin = value.scheduling?.downtimeMinutes ?? 0;
            const u =
              urgency === 'critical'
                ? 5
                : urgency === 'high'
                  ? 4
                  : urgency === 'medium'
                    ? 3
                    : 1;
            const score =
              u * 10 +
              Math.min(50, Math.floor(people / 5)) +
              Math.min(20, Math.floor(dowMin / 15));
            return String(Math.min(100, score));
          },
          updateOn: 'change',
        },
      },
    },

    // --- Consent / Submission ------------------------------------------------
    privacyAck: {
      type: 'checkbox',
      label: 'I understand data handling and privacy policy',
      validators: ['requiredTrue'],
      updateOn: 'change',
    },
    privacyNote: {
      type: 'note',
      isControl: false,
      hidden: '!privacyAck',
      message:
        'Your request may be shared with service providers for resolution.',
      severity: 'info',
    },
    policyAccepted: {
      type: 'checkbox',
      label:
        'I confirm this request is accurate and complies with facility policy',
      validators: ['requiredTrue'],
    },
  },
} as const;
