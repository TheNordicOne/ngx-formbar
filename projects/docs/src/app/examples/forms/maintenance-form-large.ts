import {NgxFbForm} from '@ngx-formbar/core';
import { FormControls } from '../helper/form.type';
import { MaintenanceRequest } from './maintenance-request.type';


export const maintenanceFormLarge: NgxFbForm<FormControls> = {
  content: {
    // ---------- Intro & Guidance ----------
    intro: {
      type: 'note',
      isControl: false,
      severity: 'info',
      message:
        'Complete the request step by step. Visibility, readonly, and disabled states change as you fill in details.',
    },

    // ---------- Requester ----------
    requester: {
      type: 'group',
      legend: 'Requester',
      dynamicTitle:
        "'Requester' + (requester && requester.fullName ? ' — ' + requester.fullName : '')",
      controls: {
        fullName: {
          type: 'text',
          label: 'Full name',
          validators: ['required'],
          updateOn: 'blur',
        },
        email: {
          type: 'text',
          label: 'Work email',
          validators: ['required', 'email'],
          updateOn: 'blur',
          dynamicLabel: "'Work email' + (email && email.endsWith('@example.com') ? ' (internal)' : '')",
        },
        department: {
          type: 'dropdown',
          label: 'Department',
          validators: ['required'],
          options: [
            { id: 'dep-it', value: 'IT', label: 'IT' },
            { id: 'dep-fac', value: 'Facilities', label: 'Facilities' },
            { id: 'dep-ops', value: 'Operations', label: 'Operations' },
            { id: 'dep-fin', value: 'Finance', label: 'Finance' },
            { id: 'dep-hr', value: 'HR', label: 'HR' },
          ],
          updateOn: 'change',
        },
        isOnsite: {
          type: 'radio',
          label: 'Are you on-site today?',
          options: [
            { id: 'on-yes', value: 'yes', label: 'Yes' },
            { id: 'on-no', value: 'no', label: 'No' },
          ],
          validators: ['required'],
        },
        contactNumber: {
          type: 'text',
          label: 'Contact number',
          hidden: "requester && requester.isOnsite === 'no'",
          hideStrategy: 'keep', // keep for summaries even if hidden
        },
      },
    },

    // ---------- Asset / Location ----------
    asset: {
      type: 'group',
      legend: 'Asset & Location',
      controls: {
        site: {
          type: 'dropdown',
          label: 'Site',
          validators: ['required'],
          options: [
            { id: 's-hq', value: 'HQ', label: 'HQ' },
            { id: 's-dc', value: 'DC-01', label: 'Datacenter 01' },
            { id: 's-mfg', value: 'MFG', label: 'Manufacturing' },
          ],
        },
        building: {
          type: 'text',
          label: 'Building',
          hidden: "!asset || asset.site === 'DC-01'",
        },
        room: {
          type: 'text',
          label: 'Room / Rack',
          dynamicLabel:
            "asset && asset.site === 'DC-01' ? 'Rack' : 'Room'",
        },
        assetType: {
          type: 'dropdown',
          label: 'Asset type',
          options: [
            { id: 'at-elec', value: 'Electrical', label: 'Electrical' },
            { id: 'at-hvac', value: 'HVAC', label: 'HVAC' },
            { id: 'at-net', value: 'Network', label: 'Network' },
            { id: 'at-app', value: 'Application', label: 'Application' },
            { id: 'at-other', value: 'Other', label: 'Other' },
          ],
          validators: ['required'],
        },
        assetId: {
          type: 'text',
          label: 'Asset ID / Hostname',
          readonly:
            "asset && (asset.assetType === 'Application' || asset.assetType === 'Network') && !asset.room",
        },
        assetDetailsNote: {
          type: 'note',
          isControl: false,
          severity: 'warn',
          hidden:
            "!asset || !(asset.assetType === 'Electrical' || asset.assetType === 'HVAC')",
          message:
            'For Electrical/HVAC issues, add meter readings and last service date in the Details section.',
        },
      },
    },

    // ---------- Details ----------
    details: {
      type: 'group',
      legend: 'Details',
      dynamicTitle:
        "'Details' + (details && details.category ? ' — ' + details.category : '')",
      controls: {
        category: {
          type: 'dropdown',
          label: 'Category',
          validators: ['required'],
          options: [
            { id: 'c-power', value: 'Power', label: 'Power' },
            { id: 'c-cooling', value: 'Cooling', label: 'Cooling' },
            { id: 'c-network', value: 'Network', label: 'Network' },
            { id: 'c-app', value: 'Application', label: 'Application' },
            { id: 'c-security', value: 'Security', label: 'Security' },
            { id: 'c-other', value: 'Other', label: 'Other' },
          ],
        },
        urgency: {
          type: 'radio',
          label: 'Urgency',
          validators: ['required'],
          options: [
            { id: 'u-low', value: 'low', label: 'Low' },
            { id: 'u-med', value: 'medium', label: 'Medium' },
            { id: 'u-hi', value: 'high', label: 'High' },
            { id: 'u-crit', value: 'critical', label: 'Critical' },
          ],
        },
        description: {
          type: 'text',
          label: 'Short description',
          validators: ['required', 'minLength5'],
          updateOn: 'blur',
        },
        peopleAffected: {
          type: 'number',
          label: 'People affected',
          validators: ['integer', 'min0'],
          dynamicLabel:
            "'People affected' + (details && details.urgency === 'critical' ? ' (estimate required)' : '')",
        },
        businessImpact: {
          type: 'radio',
          label: 'Business impact',
          validators: ['required'],
          options: [
            { id: 'bi-none', value: 'none', label: 'None' },
            { id: 'bi-minor', value: 'minor', label: 'Minor' },
            { id: 'bi-major', value: 'major', label: 'Major' },
            { id: 'bi-sev', value: 'severe', label: 'Severe' },
          ],
        },

        // Conditional sub-areas per category
        powerVoltage: {
          type: 'number',
          label: 'Voltage reading (V)',
          hidden: "!details || details.category !== 'Power'",
          validators: ['min0'],
          updateOn: 'blur',
        },
        coolingTemp: {
          type: 'number',
          label: 'Cooling inlet temp (°C)',
          hidden: "!details || details.category !== 'Cooling'",
          validators: ['min0'],
        },
        networkScope: {
          type: 'dropdown',
          label: 'Network scope',
          hidden: "!details || details.category !== 'Network'",
          options: [
            { id: 'ns-edge', value: 'Edge', label: 'Edge' },
            { id: 'ns-core', value: 'Core', label: 'Core' },
            { id: 'ns-access', value: 'Access', label: 'Access' },
          ],
        },
        appTier: {
          type: 'dropdown',
          label: 'Application tier',
          hidden: "!details || details.category !== 'Application'",
          options: [
            { id: 't-front', value: 'Frontend', label: 'Frontend' },
            { id: 't-back', value: 'Backend', label: 'Backend' },
            { id: 't-db', value: 'Database', label: 'Database' },
          ],
        },
        securityType: {
          type: 'dropdown',
          label: 'Security incident type',
          hidden: "!details || details.category !== 'Security'",
          options: [
            { id: 'si-access', value: 'Access', label: 'Access' },
            { id: 'si-mal', value: 'Malware', label: 'Malware' },
            { id: 'si-phy', value: 'Physical', label: 'Physical' },
          ],
        },

        // Computed severity score
        severityScore: {
          type: 'text',
          label: 'Computed severity score',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const u = value.details?.urgency;
            const people = value.details?.peopleAffected ?? 0;
            const impact = value.details?.businessImpact;

            let uScore = 1;
            switch (u) {
              case 'critical': uScore = 5; break;
              case 'high': uScore = 4; break;
              case 'medium': uScore = 3; break;
              default: uScore = 1; break;
            }

            let bScore = 0;
            switch (impact) {
              case 'severe': bScore = 5; break;
              case 'major': bScore = 3; break;
              case 'minor': bScore = 1; break;
              default: bScore = 0; break;
            }

            const pScore = Math.min(5, Math.floor(people / 10));
            const score = uScore * 10 + bScore * 5 + pScore;
            return String(Math.min(100, score));
          },
        },
      },
    },

    // ---------- Work Plan ----------
    plan: {
      type: 'group',
      legend: 'Work Plan',
      hidden: "!details || !details.category",
      hideStrategy: 'keep',
      valueStrategy: 'last',
      controls: {
        requiresDowntime: {
          type: 'checkbox',
          label: 'Requires downtime',
        },
        downtimeMinutes: {
          type: 'number',
          label: 'Downtime (minutes)',
          hidden: "!plan || !plan.requiresDowntime",
          validators: ['integer', 'min0'],
        },
        changeWindow: {
          type: 'dropdown',
          label: 'Preferred change window',
          options: [
            { id: 'cw-am', value: 'AM', label: 'Morning (06:00–12:00)' },
            { id: 'cw-pm', value: 'PM', label: 'Afternoon (12:00–18:00)' },
            { id: 'cw-night', value: 'Night', label: 'Night (18:00–06:00)' },
          ],
          disabled: "!plan || !plan.requiresDowntime",
        },
        rollbackReady: {
          type: 'checkbox',
          label: 'Rollback plan ready',
          hidden: "!plan || !plan.requiresDowntime",
        },

        // Computed change complexity label
        changeComplexity: {
          type: 'text',
          readonly: true,
          label: '',
          dynamicLabel:
            "'Change complexity' + (plan && plan.requiresDowntime ? ' (downtime)' : '')",
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const rt = !!value.plan?.requiresDowntime;
            const mins = value.plan?.downtimeMinutes ?? 0;
            const sev = Number(value.details?.severityScore ?? 0);

            if (!rt && sev < 20) {
              return 'Low';
            }

            if (rt && mins > 120) {
              return 'High';
            }

            if (sev >= 60) {
              return 'High';
            }

            return 'Medium';
          },
        },
      },
    },

    // ---------- Materials & Costs ----------
    costs: {
      type: 'group',
      legend: 'Materials & Costs',
      hidden: "!details",
      controls: {
        materialCost: {
          type: 'number',
          label: 'Materials (currency units)',
          validators: ['min0'],
        },
        laborHours: {
          type: 'number',
          label: 'Labor hours',
          validators: ['min0'],
        },
        hourlyRate: {
          type: 'number',
          label: 'Hourly rate',
          validators: ['min0'],
        },
        discountEligible: {
          type: 'checkbox',
          label: 'Eligible for discount',
          hidden: "!requester || requester.department !== 'Finance'",
        },
        discountPercent: {
          type: 'number',
          label: 'Discount %',
          hidden: "!costs || !costs.discountEligible",
          validators: ['min0', 'max100'],
        },

        // Computed totals
        subtotal: {
          type: 'text',
          label: 'Subtotal',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const m = value.costs?.materialCost ?? 0;
            const h = value.costs?.laborHours ?? 0;
            const r = value.costs?.hourlyRate ?? 0;
            const sum = m + h * r;
            return sum.toFixed(2);
          },
        },
        totalDue: {
          type: 'text',
          label: 'Estimated total (after discount)',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const sub = Number(value.costs?.subtotal ?? 0);
            const eligible = !!value.costs?.discountEligible;
            const pct = value.costs?.discountPercent ?? 0;

            if (!eligible || pct <= 0) {
              return sub.toFixed(2);
            }

            const capped = Math.min(100, Math.max(0, pct));
            const total = sub * (1 - capped / 100);
            return total.toFixed(2);
          },
        },
      },
    },

    // ---------- Approvals ----------
    approvals: {
      type: 'group',
      legend: 'Approvals',
      dynamicTitle:
        "'Approvals' + (details && details.urgency ? ' — ' + details.urgency : '')",
      controls: {
        managerApprovalNeeded: {
          type: 'checkbox',
          label: 'Manager approval required',
          readonly:
            "details && (details.urgency === 'high' || details.urgency === 'critical')",
        },
        managerApproved: {
          type: 'checkbox',
          label: 'Manager has approved',
          hidden:
            "!approvals || !(approvals.managerApprovalNeeded || details && (details.urgency === 'high' || details.urgency === 'critical'))",
        },
        financeApprovalNeeded: {
          type: 'checkbox',
          label: 'Finance approval required',
          hidden: "!costs || (+(costs.totalDue ?? 0) <= 5000)",
        },
        financeApproved: {
          type: 'checkbox',
          label: 'Finance has approved',
          hidden:
            "!approvals || !approvals.financeApprovalNeeded",
          disabled:
            "!approvals || !approvals.financeApprovalNeeded",
        },
      },
    },

    // ---------- Risk & Compliance ----------
    compliance: {
      type: 'group',
      legend: 'Risk & Compliance',
      hidden: "!details",
      controls: {
        dataSensitivity: {
          type: 'dropdown',
          label: 'Data sensitivity involved',
          options: [
            { id: 'ds-none', value: 'none', label: 'None' },
            { id: 'ds-internal', value: 'internal', label: 'Internal' },
            { id: 'ds-conf', value: 'confidential', label: 'Confidential' },
            { id: 'ds-pii', value: 'pii', label: 'PII' },
          ],
        },
        privacyImpact: {
          type: 'radio',
          label: 'Privacy impact assessment needed',
          options: [
            { id: 'pia-no', value: 'no', label: 'No' },
            { id: 'pia-yes', value: 'yes', label: 'Yes' },
          ],
          hidden: "!compliance || compliance.dataSensitivity === 'none'",
        },
        securityOpsNotified: {
          type: 'checkbox',
          label: 'Security operations notified',
          hidden:
            "!details || details.category !== 'Security'",
        },
        exportRestricted: {
          type: 'checkbox',
          label: 'Export restrictions apply',
          hidden:
            "!compliance || (compliance.dataSensitivity !== 'confidential' && compliance.dataSensitivity !== 'pii')",
        },
        // Computed compliance flag
        complianceFlag: {
          type: 'text',
          label: 'Compliance flag',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const sens = value.compliance?.dataSensitivity;
            const sec = !!value.details && value.details.category === 'Security';
            const pia = value.compliance?.privacyImpact === 'yes';

            if (sens === 'pii' || pia || sec) {
              return 'Requires review';
            }

            if (sens === 'confidential') {
              return 'Check policy';
            }

            return 'OK';
          },
        },
      },
    },

    // ---------- Logistics ----------
    logistics: {
      type: 'group',
      legend: 'Logistics',
      hidden: "!requester",
      controls: {
        accessRequired: {
          type: 'checkbox',
          label: 'Special access required',
        },
        escortRequired: {
          type: 'checkbox',
          label: 'Escort required',
          hidden: "!logistics || !logistics.accessRequired",
        },
        siteContact: {
          type: 'text',
          label: 'On-site contact',
          hidden: "!logistics || !logistics.accessRequired",
        },
        sparePartsAvailable: {
          type: 'checkbox',
          label: 'Spare parts available on site',
        },
        vendorInvolved: {
          type: 'checkbox',
          label: 'External vendor involved',
        },
        vendorName: {
          type: 'text',
          label: 'Vendor name',
          hidden: "!logistics || !logistics.vendorInvolved",
        },
        vendorTicket: {
          type: 'text',
          label: 'Vendor ticket/reference',
          hidden: "!logistics || !logistics.vendorInvolved",
          readonly: "!logistics || !logistics.vendorInvolved",
        },
      },
    },

    // ---------- Derived Summary ----------
    summary: {
      type: 'group',
      legend: 'Summary',
      controls: {
        ticketTitle: {
          type: 'text',
          label: 'Ticket title (auto)',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const dep = value.requester?.department ?? 'Dept';
            const cat = value.details?.category ?? 'General';
            const site = value.asset?.site ?? 'Site';
            return `${dep} / ${cat} @ ${site}`;
          },
        },
        shortRef: {
          type: 'text',
          label: 'Short reference (auto)',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const name = value.requester?.fullName ?? 'Unknown';
            const score = value.details?.severityScore ?? '0';
            const cat = value.details?.category ?? 'GEN';
            const clean = name.split(' ').map(s => s[0]).join('').toUpperCase();
            return `${clean}-${cat}-${score}`;
          },
        },
        readyToSubmit: {
          type: 'text',
          label: 'Ready to submit?',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            const reqOk = !!value.requester?.fullName && !!value.requester.email;
            const detOk = !!value.details?.category && !!value.details.urgency;
            const apprNeed =
              !!value.approvals?.managerApprovalNeeded ||
              (!!value.approvals && (value.details?.urgency === 'high' || value.details?.urgency === 'critical'));
            const apprOk = apprNeed ? !!value.approvals?.managerApproved : true;

            if (!reqOk || !detOk) {
              return 'No — missing required fields';
            }

            return apprOk ? 'Yes' : 'No — pending approvals';
          },
        },
      },
    },

    // ---------- Consent / Final ----------
    consent: {
      type: 'group',
      legend: 'Consent & Final Checks',
      controls: {
        acknowledgePolicies: {
          type: 'checkbox',
          label: 'I acknowledge operational and privacy policies',
          validators: ['requiredTrue'],
        },
        submitterNote: {
          type: 'note',
          isControl: false,
          hidden: "!consent || !consent.acknowledgePolicies",
          hideStrategy: 'keep',
          message:
            'Once submitted, the request is routed automatically. Ensure contact details are accurate.',
          severity: 'info',
        },
        finalHash: {
          type: 'text',
          label: 'Submission fingerprint (auto)',
          readonly: true,
          computedValue: (v) => {
            const value = v as unknown as MaintenanceRequest;
            // Lightweight, deterministic "hash-like" derivation for demo
            const a = value.requester?.fullName ?? '';
            const b = value.requester?.email ?? '';
            const c = value.details?.category ?? '';
            const d = value.summary?.shortRef ?? '';
            const s = `${a}|${b}|${c}|${d}`;
            let acc = 0;
            for (let i = 0; i < s.length; i++) {
              acc = ((acc << 5) - acc) + s.charCodeAt(i);
              acc |= 0;
            }
            const hex = Math.abs(acc).toString(16).padStart(8, '0');
            return hex.toUpperCase();
          },
        },
      },
    },
  },
} as const;
