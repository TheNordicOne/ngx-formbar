import {NgxFbForm} from '@ngx-formbar/core';
import { FormControls } from '../helper/form.type';

export const highlyComputedForm: NgxFbForm<FormControls> = {
  content: {
    // --------- Seeds / Toggles ---------
    seed: {
      type: 'text',
      label: 'Seed',
      hint: 'Base string many fields will derive from.',
      defaultValue: 'alpha'
    },

    mode: {
      type: 'text',
      label: 'Mode (none | alpha | beta | gamma)',
      hint: 'Toggle visibility/readonly/disabled cascades by typing one of the keywords.',
      defaultValue: 'alpha'
    },

    // --------- Simple cascades at root ---------
    rootEcho: {
      type: 'text',
      label: '',
      readonly: 'true',
      computedValue: 'seed',
      dynamicLabel: '`Root Echo → ${seed ?? ""}`'
    },

    rootUpper: {
      type: 'text',
      label: 'Root Upper',
      readonly: 'true',
      computedValue: '(seed ?? "").toUpperCase()',
      hidden: 'mode === "none"'
    },

    rootDecorated: {
      type: 'text',
      label: 'Root Decorated',
      readonly: 'true',
      computedValue: '`«${(seed ?? "").trim() ? (seed ?? "").trim() : "—"}»`',
      disabled: 'mode === "beta"'
    },

    // --------- Chain group with deep cascades ---------
    chain: {
      type: 'group',
      legend: 'Chain (L1..L5)',
      dynamicTitle: '`Chain (seed="${seed ?? ""}", mode="${mode ?? ""}")`',
      controls: {
        l1: {
          type: 'text',
          label: 'L1',
          readonly: 'true',
          computedValue: '`L1:${seed ?? ""}`'
        },
        l2: {
          type: 'text',
          label: 'L2',
          readonly: 'true',
          computedValue: '`L2:${chain?.l1 ?? ""}`'
        },
        l3: {
          type: 'text',
          label: 'L3',
          readonly: 'true',
          computedValue: '`L3:${chain?.l2 ?? ""}`',
          hidden: 'mode === "none" || !(chain?.l2)'
        },
        l4: {
          type: 'text',
          label: 'L4',
          readonly: 'true',
          computedValue: '(chain?.l3 ?? "").toString().concat(":L4")',
          disabled: 'mode === "alpha"'
        },
        l5: {
          type: 'text',
          label: 'L5',
          readonly: 'true',
          computedValue: '`L5:${(chain?.l4 ?? "").slice(0, 20)}`',
          dynamicLabel: '`L5 (from "${chain?.l4 ?? ""}")`'
        },

        // Deep nested group showing member access + inheritance of states
        deep: {
          type: 'group',
          legend: 'Deep',
          dynamicTitle: '`Deep → ${chain?.l5 ?? ""}`',
          hidden: 'mode === "gamma" && (seed ?? "").length > 0',
          disabled: 'mode === "beta"',
          readonly: 'mode === "alpha"',
          controls: {
            l6: {
              type: 'text',
              label: 'L6',
              readonly: 'true',
              computedValue: '`L6:${chain?.l5 ?? ""}`'
            },
            l7: {
              type: 'text',
              label: 'L7',
              readonly: 'true',
              computedValue: '`L7:${(chain?.deep?.l6) ?? ""}`'
            },
            l8: {
              type: 'text',
              label: 'L8 (Upper)',
              readonly: 'true',
              computedValue: '(chain?.deep?.l7 ?? "").toUpperCase()'
            }
          }
        }
      }
    },

    // --------- Cross-group fan-out (multiple dependents from one source) ---------
    fanOut: {
      type: 'group',
      legend: 'Fan-Out',
      dynamicTitle: '`Fan-Out of "${seed ?? ""}"`',
      controls: {
        a: {
          type: 'text',
          label: 'A',
          readonly: 'true',
          computedValue: '`A:${seed ?? ""}`'
        },
        b: {
          type: 'text',
          label: 'B',
          readonly: 'true',
          computedValue: '`B:${seed ?? ""}`'
        },
        c: {
          type: 'text',
          label: 'C = A + B',
          readonly: 'true',
          computedValue: '`C:${fanOut?.a ?? ""}|${fanOut?.b ?? ""}`'
        },
        cMirror: {
          type: 'text',
          label: 'C Mirror (Lower)',
          readonly: 'true',
          computedValue: '(fanOut?.c ?? "").toLowerCase()'
        }
      }
    },

    // --------- Options-like string building to show arrow functions + array ops ---------
    derivedList: {
      type: 'text',
      label: 'Derived List (CSV)',
      hint: 'Demonstrates arrow function + Array ops in the evaluator.',
      readonly: 'true',
      computedValue:
        '(' +
        '[' +
        '(seed ?? "")' + ',' +
        '(chain?.l3 ?? "")' + ',' +
        '(chain?.l5 ?? "")' + ',' +
        '(chain?.deep?.l8 ?? "")' +
        ']' +
        ')' +
        '.join(",")'
    },

    // --------- Visibility/readonly/disabled matrix driven by mode ---------
    matrix: {
      type: 'group',
      legend: 'Matrix',
      controls: {
        hiddenWhenNone: {
          type: 'text',
          label: 'Hidden when mode=none',
          hidden: 'mode === "none"',
          computedValue: '`mode=${mode ?? ""}`',
          readonly: 'true'
        },
        disabledWhenBeta: {
          type: 'text',
          label: 'Disabled when mode=beta',
          disabled: 'mode === "beta"',
          computedValue: '`seed=${seed ?? ""}`',
          readonly: 'true'
        },
        readonlyWhenAlpha: {
          type: 'text',
          label: 'Readonly when mode=alpha',
          readonly: 'mode === "alpha"',
          computedValue: '`concat:${(seed ?? "") + "|" + (chain?.l1 ?? "")}`'
        }
      }
    },

    // --------- Summary (grand finale) ---------
    summary: {
      type: 'group',
      legend: 'Summary',
      controls: {
        flatSummary: {
          type: 'text',
          label: 'Flat Summary',
          readonly: 'true',
          computedValue:
            '`S:${seed ?? ""}; M:${mode ?? ""}; L5:${chain?.l5 ?? ""}; L8:${chain?.deep?.l8 ?? ""}`'
        },
        verboseSummary: {
          type: 'text',
          label: 'Verbose Summary',
          readonly: 'true',
          computedValue:
            '(' +
            '[' +
            '"seed=" + (seed ?? "")' + ',' +
            '"mode=" + (mode ?? "")' + ',' +
            '"l1=" + (chain?.l1 ?? "")' + ',' +
            '"l3=" + (chain?.l3 ?? "")' + ',' +
            '"l5=" + (chain?.l5 ?? "")' + ',' +
            '"l8=" + (chain?.deep?.l8 ?? "")' +
            ']' +
            ').join(" | ")'
        },
        submitReadyHint: {
          type: 'text',
          label: 'Submit Ready (informational)',
          readonly: 'true',
          computedValue:
            '(mode === "none") ? "Hidden parts skipped" : ' +
            '(mode === "beta") ? "Some disabled" : ' +
            '(mode === "alpha") ? "Readonly chain" : "Free form"'
        }
      }
    },

    // Echoes values across groups and mutates strings heavily.
    echoChamber: {
      type: 'group',
      legend: 'Echo Chamber',
      dynamicTitle: '`Echo(${seed ?? ""}) → mode=${mode ?? ""}`',
      controls: {
        e1: {
          type: 'text',
          label: 'E1 = L5 + A',
          readonly: 'true',
          computedValue: '`E1:${(chain?.l5 ?? "") + "|" + (fanOut?.a ?? "")}`'
        },
        e2: {
          type: 'text',
          label: 'E2 Upper Slice',
          readonly: 'true',
          computedValue: '((echoChamber?.e1 ?? "").toUpperCase()).slice(0, 16)'
        },
        e3: {
          type: 'text',
          label: 'E3 Decor',
          readonly: 'true',
          computedValue: '`(${(echoChamber?.e2 ?? "").replace("|", "⇄")})`'
        },
        e4: {
          type: 'text',
          label: 'E4 Seed Aware',
          readonly: 'true',
          computedValue:
            '(seed ?? "").includes("a") ? "contains-a:" + (echoChamber?.e3 ?? "") : "no-a:" + (echoChamber?.e3 ?? "")'
        }
      }
    },

    // Serial chain S1..S10, each depending on the previous, with cross-links to chain.deep.
    serial: {
      type: 'group',
      legend: 'Serial',
      dynamicTitle: '`Serial from "${seed ?? ""}"`',
      controls: {
        s1:  { type: 'text', label: 'S1', readonly: 'true', computedValue: '`S1:${seed ?? ""}`' },
        s2:  { type: 'text', label: 'S2', readonly: 'true', computedValue: '`S2:${serial?.s1 ?? ""}`' },
        s3:  { type: 'text', label: 'S3', readonly: 'true', computedValue: '`S3:${serial?.s2 ?? ""}`' },
        s4:  { type: 'text', label: 'S4', readonly: 'true', computedValue: '`S4:${serial?.s3 ?? ""}|${chain?.deep?.l8 ?? ""}`' },
        s5:  { type: 'text', label: 'S5', readonly: 'true', computedValue: '(serial?.s4 ?? "").toLowerCase()' },
        s6:  { type: 'text', label: 'S6', readonly: 'true', computedValue: '(serial?.s5 ?? "").replace("s4", "S4")' },
        s7:  { type: 'text', label: 'S7', readonly: 'true', computedValue: '(serial?.s6 ?? "").concat("|", (fanOut?.c ?? ""))' },
        s8:  { type: 'text', label: 'S8', readonly: 'true', computedValue: '(serial?.s7 ?? "").slice(0, 32)' },
        s9:  { type: 'text', label: 'S9', readonly: 'true', computedValue: '`S9:${serial?.s8 ?? ""}`' },
        s10: { type: 'text', label: 'S10', readonly: 'true', computedValue: '(serial?.s9 ?? "").toUpperCase()' }
      }
    },

    // Complex gating: hidden/disabled/readonly interact based on mixed conditions.
    gates: {
      type: 'group',
      legend: 'Gates',
      dynamicTitle: '`Gates(${mode ?? ""})`',
      hidden: '(mode ?? "") === "none" && (seed ?? "").trim().length === 0',
      disabled: '(mode ?? "") === "beta" && (fanOut?.c ?? "").length > 0',
      readonly: '(mode ?? "") === "alpha" || (chain?.l1 ?? "").includes("L1:")',
      controls: {
        g1: {
          type: 'text',
          label: 'G1 (Mode Echo)',
          readonly: 'true',
          computedValue: '`g1:${mode ?? ""}`'
        },
        g2: {
          type: 'text',
          label: 'G2 (Seed Len)',
          readonly: 'true',
          computedValue: '`len:${(seed ?? "").length}`'
        },
        g3: {
          type: 'text',
          label: 'G3 (Switch-ish)',
          readonly: 'true',
          computedValue:
            '(mode === "alpha") ? "α" : (mode === "beta") ? "β" : (mode === "gamma") ? "γ" : "∅"'
        },
        g4: {
          type: 'text',
          label: 'G4 (Cross Peek)',
          readonly: 'true',
          computedValue: '`peek:${(summary?.flatSummary ?? "").indexOf("L5:")}`'
        }
      }
    },

    // Cross-matrix: build a CSV overview by pulling from many places.
    crossMatrix: {
      type: 'group',
      legend: 'Cross Matrix',
      dynamicTitle: '`Cross Matrix of "${seed ?? ""}"`',
      controls: {
        m1: {
          type: 'text',
          label: 'M1 (CSV 1)',
          readonly: 'true',
          computedValue:
            '(' +
            '[' +
            '(rootEcho ?? "")' + ',' +
            '(fanOut?.a ?? "")' + ',' +
            '(chain?.l3 ?? "")' + ',' +
            '(chain?.deep?.l8 ?? "")' +
            ']' +
            ').join(";")'
        },
        m2: {
          type: 'text',
          label: 'M2 (CSV 2)',
          readonly: 'true',
          computedValue:
            '(' +
            '[' +
            '(serial?.s6 ?? "")' + ',' +
            '(echoChamber?.e4 ?? "")' + ',' +
            '(matrix?.readonlyWhenAlpha ?? "")' + ',' +
            '(summary?.verboseSummary ?? "")' +
            ']' +
            ').join("||")'
        }
      }
    },

    // String lab: aggressive transformations to showcase method coverage.
    stringLab: {
      type: 'group',
      legend: 'String Lab',
      dynamicTitle: '`String Lab on "${seed ?? ""}"`',
      controls: {
        t1: {
          type: 'text',
          label: 'T1 (Trim/Pad/Case)',
          readonly: 'true',
          computedValue:
            '(("[" + (seed ?? "").trim() + "]").toUpperCase()).concat("|", (mode ?? "").toLowerCase())'
        },
        t2: {
          type: 'text',
          label: 'T2 (Split/Join)',
          readonly: 'true',
          computedValue:
            '(' +
            '((fanOut?.c ?? "").replace("|", ",")).split(",")' +
            ').join("+")'
        },
        t3: {
          type: 'text',
          label: 'T3 (Find)',
          readonly: 'true',
          computedValue:
            '`L5@${(summary?.flatSummary ?? "").includes("L5:") ? "yes" : "no"}`'
        }
      }
    }
  }
} as const;
