import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '../types/form-controls.type';

export const maintenanceForm: NgxFbForm<ExampleControls> = {
  content: {
    introNote: {
      isControl: false,
      type: 'note',
      message:
        'Submit a maintenance request for a single location and category. Fields may appear based on your selections.',
      severity: 'info',
    },

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

    details: {
      type: 'group',
      legend: 'Issue Details',
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
          hideStrategy: 'remove',
          valueStrategy: 'reset',
        },
        description: {
          type: 'text',
          label: 'Description',
          placeHolder:
            'Describe the issue with specific symptoms, locations, and times…',
          validators: ['required', 'min20Characters'],
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
          label: 'Impact Score (1–10)',
          min: 1,
          max: 10,
          validators: ['required', 'integer', 'range1to10'],
        },
      },
    },

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

    scheduling: {
      type: 'group',
      legend: 'Scheduling',
      controls: {
        preferredDate: {
          type: 'text',
          label: 'Preferred Date',
          placeHolder: 'YYYY-MM-DD',
          validators: ['isoDate'],
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

    approvals: {
      type: 'group',
      legend: 'Approvals',
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
          validators: ['requiredWhenCriticalOrNeeded'],
          asyncValidators: ['approverActive'],
        },
        approvalNote: {
          type: 'text',
          label: 'Approval Note (optional)',
          placeHolder: 'Ticket reference or verbal approval details…',
        },
      },
    },

    submitNote: {
      isControl: false,
      type: 'note',
      severity: 'danger',
      message:
        'Do not include sensitive personal data. The request and location may be shared with service providers.',
    },
    policyAccepted: {
      type: 'checkbox',
      label:
        'I confirm this request is accurate and complies with facility policy',
      validators: ['requiredTrue'],
    },
  },
};
