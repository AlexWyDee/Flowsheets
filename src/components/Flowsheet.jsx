import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const flowsheetGroups = [
  {
    id: 'cpt-97110',
    label: 'CPT 97110 · Therapeutic Exercise',
    tag: 'Strength + Stability',
    interventions: [
      {
        id: 'intervention-shoulder-flex',
        name: 'Seated Shoulder Flexion',
        cues: '',
        sets: 3,
        reps: 5,
        weight: '10 lbs',
        status: 'todo',
      },
      {
        id: 'intervention-row-pattern',
        name: 'Resisted Row Pattern',
        cues: '',
        sets: 4,
        reps: 6,
        weight: '15 lbs',
        status: 'done',
      },
      {
        id: 'intervention-bridge',
        name: 'Hip Bridge with March',
        cues: '',
        sets: 3,
        reps: 8,
        weight: 'Bodyweight',
        status: 'in-progress',
      },
    ],
  },
  {
    id: 'cpt-97112',
    label: 'CPT 97112 · Neuromuscular Reeducation',
    tag: 'Motor control',
    interventions: [
      {
        id: 'intervention-single-leg',
        name: 'Single-leg Stance with Bands',
        cues: '',
        sets: 2,
        reps: 30,
        weight: 'Bodyweight',
        status: 'todo',
      },
      {
        id: 'intervention-bosu-shifts',
        name: 'BOSU Pelvic Shifts',
        cues: '',
        sets: 2,
        reps: 12,
        weight: 'Bodyweight',
        status: 'done',
      },
    ],
  },
  {
    id: 'cpt-97530',
    label: 'CPT 97530 · Therapeutic Activity',
    tag: 'Functional training',
    interventions: [
      {
        id: 'intervention-theraband-reach',
        name: 'Theraband Overhead Reach',
        cues: '',
        sets: 3,
        reps: 5,
        weight: 'Red band',
        status: 'todo',
      },
      {
        id: 'intervention-gait',
        name: 'Step-up into Reverse Reach',
        cues: '',
        sets: 3,
        reps: 6,
        weight: '10 lbs',
        status: 'in-progress',
      },
    ],
  },
]

const statusDefinitions = {
  todo: { label: 'To do today', className: 'status-chip--todo' },
  done: { label: 'Done', className: 'status-chip--done' },
  'in-progress': { label: 'In progress', className: 'status-chip--in-progress' },
}

const createInterventionId = () => `intervention-${Date.now()}-${Math.random().toString(36).slice(2)}`

const parseMinutesInput = (value) => {
  const numericPart = String(value ?? '').replace(/\D/g, '')
  const parsed = numericPart ? Number(numericPart) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

const calculateUnitsForMinutes = (minutes) => Math.floor(Math.max(0, minutes) / 5)

const IconPrint = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" role="img">
    <rect x="6" y="6" width="12" height="4" rx="1" fill="currentColor" />
    <path d="M6 10h12v6a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z" fill="currentColor" opacity="0.35" />
    <path d="M6 16v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
)

const IconEdit = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" role="img">
    <path
      d="M7 17.5v3.5h3.5l9.3-9.3a1 1 0 0 0 0-1.4L16.7 6.4a1 1 0 0 0-1.4 0L7 14.7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 19.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const IconLink = () => (
  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
)

const interventionMenuItems = [
  { key: 'link', label: 'Link to HEP', icon: IconMenuLink, action: 'link' },
  {
    key: 'concurrent',
    label: 'Mark as concurrent with...',
    icon: IconMenuConcurrent,
    trailingArrow: true,
    action: 'concurrent',
  },
  {
    key: 'delete',
    label: 'Delete Intervention',
    icon: IconMenuDelete,
    variant: 'danger',
    dividerBefore: true,
    action: 'delete',
  },
]

// Helper function to extract exercise ID from HEP2GO link
const extractExerciseId = (link) => {
  const match = link.match(/exId=(\d+)/)
  return match ? match[1] : null
}

// Helper function to get icon and color based on body region
const getRegionStyle = (bodyRegion) => {
  const region = bodyRegion.toLowerCase()
  if (region.includes('knee') || region.includes('quad')) {
    return { icon: 'fitness_center', color: '#3b82f6' }
  }
  if (region.includes('hip') || region.includes('glute')) {
    return { icon: 'run_circle', color: '#10b981' }
  }
  if (region.includes('shoulder') || region.includes('scapular') || region.includes('upper back')) {
    return { icon: 'accessibility_new', color: '#6366f1' }
  }
  if (region.includes('ankle') || region.includes('calf')) {
    return { icon: 'directions_walk', color: '#f97316' }
  }
  if (region.includes('wrist') || region.includes('elbow') || region.includes('bicep') || region.includes('tricep')) {
    return { icon: 'pan_tool', color: '#8b5cf6' }
  }
  if (region.includes('core') || region.includes('spine') || region.includes('back')) {
    return { icon: 'self_improvement', color: '#14b8a6' }
  }
  if (region.includes('neck') || region.includes('cervical')) {
    return { icon: 'headset_mic', color: '#0ea5e9' }
  }
  return { icon: 'fitness_center', color: '#ef4444' }
}

const interventionLibrary = [
  {
    id: 'hep_17392',
    name: 'Quad Set (Isometric)',
    description: 'Isometric quadriceps strengthening exercise performed by contracting the thigh muscles without moving the leg.',
    icon: getRegionStyle('Knee / Quads').icon,
    color: getRegionStyle('Knee / Quads').color,
    hep2goId: '17392',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/17392.jpg',
  },
  {
    id: 'hep_7501',
    name: 'Long Arc Quad (LAQ)',
    description: 'Quadriceps strengthening exercise performed by lifting the leg with the knee extended through a full range of motion.',
    icon: getRegionStyle('Knee / Quads').icon,
    color: getRegionStyle('Knee / Quads').color,
    hep2goId: '7501',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/7501.jpg',
  },
  {
    id: 'hep_392',
    name: 'Short Arc Quad (SAQ)',
    description: 'Quadriceps strengthening exercise performed by lifting the leg with the knee bent, focusing on the last 30 degrees of extension.',
    icon: getRegionStyle('Knee / Quads').icon,
    color: getRegionStyle('Knee / Quads').color,
    hep2goId: '392',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/392.jpg',
  },
  {
    id: 'hep_3891',
    name: 'Heel Slide',
    description: 'Knee range of motion exercise performed by sliding the heel along a surface to improve knee flexion.',
    icon: getRegionStyle('Knee / Hip ROM').icon,
    color: getRegionStyle('Knee / Hip ROM').color,
    hep2goId: '3891',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/3891.jpg',
  },
  {
    id: 'hep_3941',
    name: 'Straight Leg Raise (SLR) - Supine',
    description: 'Hip flexor and quadriceps strengthening exercise performed by lifting the leg straight up while lying on your back.',
    icon: getRegionStyle('Hip Flexor / Quads').icon,
    color: getRegionStyle('Hip Flexor / Quads').color,
    hep2goId: '3941',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/3941.jpg',
  },
  {
    id: 'hep_3948',
    name: 'Glute Bridge (Two Leg)',
    description: 'Glute and hamstring strengthening exercise performed by lifting the hips off the ground while lying on your back.',
    icon: getRegionStyle('Glutes / Hamstrings / Core').icon,
    color: getRegionStyle('Glutes / Hamstrings / Core').color,
    hep2goId: '3948',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/3948.jpg',
  },
  {
    id: 'hep_3883',
    name: 'Clamshell',
    icon: getRegionStyle('Hip Abductors / Glutes').icon,
    color: getRegionStyle('Hip Abductors / Glutes').color,
    hep2goId: '3883',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/3883.jpg',
  },
  {
    id: 'hep_3863',
    name: 'Hip Abduction - Side-lying',
    icon: getRegionStyle('Hip Abductors').icon,
    color: getRegionStyle('Hip Abductors').color,
    hep2goId: '3863',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/3863.jpg',
  },
  {
    id: 'hep_2163',
    name: 'Single Knee to Chest Stretch',
    icon: getRegionStyle('Low Back / Hip Flexors').icon,
    color: getRegionStyle('Low Back / Hip Flexors').color,
    hep2goId: '2163',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2163.jpg',
  },
  {
    id: 'hep_2372',
    name: 'Piriformis Stretch - Supine',
    icon: getRegionStyle('Glutes / Piriformis').icon,
    color: getRegionStyle('Glutes / Piriformis').color,
    hep2goId: '2372',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2372.jpg',
  },
  {
    id: 'hep_2148',
    name: 'Standing Calf Stretch (Gastroc)',
    icon: getRegionStyle('Calf / Ankle').icon,
    color: getRegionStyle('Calf / Ankle').color,
    hep2goId: '2148',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2148.jpg',
  },
  {
    id: 'hep_2149',
    name: 'Standing Soleus Stretch (Bent Knee)',
    icon: getRegionStyle('Calf / Ankle').icon,
    color: getRegionStyle('Calf / Ankle').color,
    hep2goId: '2149',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2149.jpg',
  },
  {
    id: 'hep_159',
    name: 'Ankle Pumps (DF/PF)',
    icon: getRegionStyle('Ankle / Circulation').icon,
    color: getRegionStyle('Ankle / Circulation').color,
    hep2goId: '159',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/159.jpg',
  },
  {
    id: 'hep_1130',
    name: 'Ankle Alphabet',
    icon: getRegionStyle('Ankle ROM').icon,
    color: getRegionStyle('Ankle ROM').color,
    hep2goId: '1130',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/1130.jpg',
  },
  {
    id: 'hep_162',
    name: "Shoulder Pendulum (Codman's)",
    icon: getRegionStyle('Shoulder ROM').icon,
    color: getRegionStyle('Shoulder ROM').color,
    hep2goId: '162',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/162.jpg',
  },
  {
    id: 'hep_545',
    name: 'Shoulder Flexion (Cane/AAROM)',
    icon: getRegionStyle('Shoulder ROM').icon,
    color: getRegionStyle('Shoulder ROM').color,
    hep2goId: '545',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/545.jpg',
  },
  {
    id: 'hep_544',
    name: 'Shoulder Abduction (Cane/AAROM)',
    icon: getRegionStyle('Shoulder ROM').icon,
    color: getRegionStyle('Shoulder ROM').color,
    hep2goId: '544',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/544.jpg',
  },
  {
    id: 'hep_1857',
    name: 'External Rotation (Theraband)',
    icon: getRegionStyle('Shoulder Strength (Rotator Cuff)').icon,
    color: getRegionStyle('Shoulder Strength (Rotator Cuff)').color,
    hep2goId: '1857',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/1857.jpg',
  },
  {
    id: 'hep_1858',
    name: 'Internal Rotation (Theraband)',
    icon: getRegionStyle('Shoulder Strength (Rotator Cuff)').icon,
    color: getRegionStyle('Shoulder Strength (Rotator Cuff)').color,
    hep2goId: '1858',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/1858.jpg',
  },
  {
    id: 'hep_550',
    name: 'Scapular Retraction (Squeeze)',
    icon: getRegionStyle('Upper Back / Posture').icon,
    color: getRegionStyle('Upper Back / Posture').color,
    hep2goId: '550',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/550.jpg',
  },
  {
    id: 'hep_611',
    name: 'Cervical Retraction (Chin Tuck)',
    icon: getRegionStyle('Neck / Posture').icon,
    color: getRegionStyle('Neck / Posture').color,
    hep2goId: '611',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/611.jpg',
  },
  {
    id: 'hep_1274',
    name: 'Wrist Flexion Stretch',
    icon: getRegionStyle('Wrist / Forearm').icon,
    color: getRegionStyle('Wrist / Forearm').color,
    hep2goId: '1274',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/1274.jpg',
  },
  {
    id: 'hep_1273',
    name: 'Wrist Extension Stretch',
    icon: getRegionStyle('Wrist / Forearm').icon,
    color: getRegionStyle('Wrist / Forearm').color,
    hep2goId: '1273',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/1273.jpg',
  },
  {
    id: 'hep_1543',
    name: 'Bicep Curl (Dumbbell/Theraband)',
    icon: getRegionStyle('Elbow / Biceps').icon,
    color: getRegionStyle('Elbow / Biceps').color,
    hep2goId: '1543',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/1543.jpg',
  },
  {
    id: 'hep_1557',
    name: 'Tricep Extension (Overhead/Standing)',
    icon: getRegionStyle('Elbow / Triceps').icon,
    color: getRegionStyle('Elbow / Triceps').color,
    hep2goId: '1557',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/1557.jpg',
  },
  {
    id: 'hep_2502',
    name: 'Cat-Cow Stretch',
    icon: getRegionStyle('Spine Mobility').icon,
    color: getRegionStyle('Spine Mobility').color,
    hep2goId: '2502',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2502.jpg',
  },
  {
    id: 'hep_2506',
    name: 'Bird Dog (Contralateral Limb Lift)',
    icon: getRegionStyle('Core Stability').icon,
    color: getRegionStyle('Core Stability').color,
    hep2goId: '2506',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2506.jpg',
  },
  {
    id: 'hep_2161',
    name: 'Abdominal Bracing (Transversus Abdominis)',
    icon: getRegionStyle('Core Stability').icon,
    color: getRegionStyle('Core Stability').color,
    hep2goId: '2161',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2161.jpg',
  },
  {
    id: 'hep_2159',
    name: 'Marching - Supine (Core)',
    icon: getRegionStyle('Core Stability / Hip Flexion').icon,
    color: getRegionStyle('Core Stability / Hip Flexion').color,
    hep2goId: '2159',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/2159.jpg',
  },
  {
    id: 'hep_4095',
    name: 'Mini Squat (Wall Slide)',
    icon: getRegionStyle('Knee / Quads / Glutes').icon,
    color: getRegionStyle('Knee / Quads / Glutes').color,
    hep2goId: '4095',
    thumbnailUrl: 'https://www.hep2go.com/images/exercises/4095.jpg',
  },
]

function IconMenuLink() {
  return <span className="material-symbols-outlined" style={{ fontSize: '20px', width: '20px', height: '20px' }}>link</span>
}

function IconMenuConcurrent() {
  return <span className="material-symbols-outlined" style={{ fontSize: '20px', width: '20px', height: '20px' }}>flip_to_front</span>
}

function IconMenuDelete() {
  return <span className="material-symbols-outlined" style={{ fontSize: '20px', width: '20px', height: '20px' }}>delete</span>
}

// Evaluative CPT codes (shown in Eval Procedure dropdown)
const evaluativeCptOptions = [
  { code: '97161', label: 'PT Low Complexity Evaluation' },
  { code: '97162', label: 'PT Moderate Complexity Evaluation' },
  { code: '97163', label: 'PT High Complexity Evaluation' },
  { code: '97164', label: 'PT Re-evaluation' },
]

// All other CPT codes (shown in main CPT dropdown)
const cptPickerOptions = [
  { code: '97110', label: 'Therapeutic Exercise' },
  { code: '97112', label: 'Neuromuscular Reeducation' },
  { code: '97116', label: 'Gait Training' },
  { code: '97140', label: 'Manual Therapy' },
  { code: '97530', label: 'Therapeutic Activities' },
  { code: '97535', label: 'Self-Care/Home Training' },
  { code: '97542', label: 'Wheelchair Management' },
  { code: '97750', label: 'Physical Performance Test' },
  { code: '97760', label: 'Orthotic(s) mgmt & training (initial)' },
  { code: '97761', label: 'Prosthetic mgmt & training (initial)' },
  { code: '97762', label: 'Orthotic/Prosthetic mgmt follow-up' },
  { code: '97010', label: 'Hot/cold packs' },
  { code: '97012', label: 'Mechanical traction' },
  { code: '97014', label: 'Electrical stimulation (unattended)' },
  { code: '97016', label: 'Vasopneumatic device' },
  { code: '97018', label: 'Paraffin' },
  { code: '97022', label: 'Whirlpool' },
  { code: '97024', label: 'Diathermy' },
  { code: '97026', label: 'Infrared' },
  { code: '97028', label: 'Ultraviolet' },
  { code: '97032', label: 'Electrical stimulation (manual)' },
  { code: '97033', label: 'Iontophoresis' },
  { code: '97034', label: 'Contrast baths' },
  { code: '97035', label: 'Ultrasound' },
  { code: '97036', label: 'Hubbard tank' },
  { code: '29075', label: 'Short arm cast' },
  { code: '29085', label: 'Long arm cast' },
  { code: '29125', label: 'Short arm splint' },
  { code: '29126', label: 'Long arm splint' },
  { code: '29200', label: 'Strapping thorax' },
  { code: '29240', label: 'Strapping pelvis/hip' },
  { code: '29540', label: 'Strapping ankle/foot' },
  { code: '29550', label: 'Short leg cast' },
  { code: '29580', label: 'Unna boot' },
  { code: '29799', label: 'Casting/splinting procedure (unspecified)' },
  { code: 'A4466', label: 'Garment/device for compression' },
  { code: 'L1902', label: 'AFO, prefabricated' },
  { code: 'L3020', label: 'Foot insert, molded' },
  { code: 'L3000', label: 'Foot insert, custom' },
  { code: 'L4386', label: 'Walking boot' },
  { code: 'L4396', label: 'Night splint' },
  { code: 'E0114', label: 'Crutches' },
  { code: 'E0110', label: 'Forearm crutches' },
  { code: 'E0100', label: 'Cane' },
  { code: 'E0143', label: 'Standard walker' },
  { code: '97597', label: 'Selective wound debridement ≤20 sq cm' },
  { code: '97598', label: 'Selective wound debridement >20 sq cm' },
  { code: '97602', label: 'Non-selective wound debridement' },
  { code: '97605', label: 'Negative pressure wound therapy ≤50 sq cm' },
  { code: '97606', label: 'Negative pressure wound therapy >50 sq cm' },
  { code: '97129', label: 'Cognitive function intervention' },
  { code: '97130', label: 'Each additional 15 min cognitive function' },
  { code: '97537', label: 'Community mobility' },
  { code: '97546', label: 'Work hardening/conditioning (initial)' },
  { code: '97545', label: 'Work hardening/conditioning (subsequent)' },
  { code: '97532', label: 'Development of cognitive skills' },
  { code: '97533', label: 'Sensory integration techniques' },
  { code: '97755', label: 'Assistive technology assessment' },
  { code: '96127', label: 'Brief emotional/behavioral assessment' },
  { code: '95851', label: 'ROM measurement' },
  { code: '95852', label: 'Multiple joint ROM' },
  { code: '95831', label: 'Muscle testing, manual' },
  { code: '95832', label: 'Manual muscle test—hand' },
  { code: '95833', label: 'Manual muscle test—body' },
  { code: '95834', label: 'Manual muscle test—extra muscle groups' },
  { code: '96105', label: 'Aphasia language eval' },
  { code: '96125', label: 'Cognitive functioning assessment' },
  { code: '97113', label: 'Aquatic therapy' },
  { code: '97150', label: 'Group therapy' },
  { code: '97799', label: 'Unlisted physical medicine procedure' },
  { code: 'A4556', label: 'Electrodes (supplies)' },
  { code: 'A4557', label: 'Electrodes, re-use' },
  { code: 'A4450', label: 'Tape' },
  { code: 'A4452', label: 'Tape, specialized' },
  { code: 'A9270', label: 'Non-covered medical equipment' },
  { code: '93797', label: 'Cardiac rehab' },
  { code: '93798', label: 'Cardiac rehab with monitoring' },
  { code: '97124', label: 'Massage therapy' },
  { code: '97763', label: 'Orthotic/prosthetic training follow-up' },
  { code: '97139', label: 'Unlisted therapeutic procedure' },
  { code: '92540', label: 'Vestibular function with recording' },
  { code: '92541', label: 'Gaze testing' },
  { code: '92542', label: 'Positional nystagmus testing' },
  { code: '92544', label: 'Optokinetic nystagmus' },
  { code: '92545', label: 'Oscillating tracking' },
  { code: '92546', label: 'Sinusoidal tracking' },
  { code: '92547', label: 'Caloric vestibular test' },
  { code: '92548', label: 'Computerized dynamic posturography' },
  { code: '94667', label: 'Chest physiotherapy' },
]

// Combined list of all CPT codes for the dropdown selector in CPT groups
// This includes both therapeutic and evaluative codes
const cptOptions = [...cptPickerOptions, ...evaluativeCptOptions]

const modifierOptions = [
  { code: '59', label: 'Distinct Procedural Service' },
  { code: '25', label: 'Significant Separately Identifiable E/M' },
  { code: 'LT', label: 'Left Side' },
  { code: 'RT', label: 'Right Side' },
]

const providerOptions = [
  'Dr. Firstname Lastname',
  'Dr. Alexandra Rivera',
  'Dr. Jordan Kim',
  'Dr. Priya Patel',
]

function extractDefaultCpt(groupLabel) {
  // Match CPT codes: 5 digits (97110) or letter followed by digits (A4466, L1902, E0114)
  const match = groupLabel.match(/(\d{5}|[A-Z]\d{3,4})/)
  return match ? match[0] : cptOptions[0]?.code || ''
}

const createHeaderDefaults = () =>
  flowsheetGroups.reduce((acc, group) => {
    acc[group.id] = {
      cpt: extractDefaultCpt(group.label),
      modifier: '',
      quantity: '',
      provider: '',
    }
    return acc
  }, {})

function InterventionRow({
  intervention,
  status,
  onToggle,
  onMenuToggle,
  isMenuOpen,
  isChecked,
  onCheckboxToggle,
  groupId,
  rowIndex,
  onRowDragStart,
  onRowDragOver,
  onRowDragEnter,
  onRowDrop,
  onRowDragEnd,
  isDragging,
  isNewlyAdded,
  isRemoving,
  onMenuAction,
  onNameChange,
  onDetailsChange,
  slashOptions,
  onSlashSelectionComplete,
  autoFocus,
  onAutoFocusHandled,
  onNameBlur,
  onUnlink,
  onOpenLink,
  isToDoToday,
  onDoubleClick,
  isHighlighted,
  onAddNewRow,
}) {
  const isDone = status === 'done'
  const isHep2GoLinked = !!intervention.hep2goId
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const nameInputRef = useRef(null)
  const detailsTextareaRef = useRef(null)
  const slashMenuRef = useRef(null)
  const linkTooltipRef = useRef(null)
  const [isSlashMenuOpen, setSlashMenuOpen] = useState(false)
  const [selectedSlashOptions, setSelectedSlashOptions] = useState([])
  const [isLinkTooltipOpen, setLinkTooltipOpen] = useState(false)
  const linkTooltipTimeoutRef = useRef(null)
  const [hoveredInterventionId, setHoveredInterventionId] = useState(null)
  const [showInterventionTooltip, setShowInterventionTooltip] = useState(false)
  const interventionTooltipTimeoutRef = useRef(null)
  const interventionTooltipRef = useRef(null)
  const [focusedSlashIndex, setFocusedSlashIndex] = useState(-1)
  const focusedSlashItemRef = useRef(null)
  const filteredSlashOptions = useMemo(() => {
    const searchTerm = (intervention.name ?? '').toLowerCase()
    return (slashOptions ?? interventionLibrary).filter((option) =>
      option.name.toLowerCase().includes(searchTerm),
    )
  }, [intervention.name, slashOptions])

  const closeSlashMenu = useCallback(() => {
    if (selectedSlashOptions.length) {
      onSlashSelectionComplete?.(
        groupId,
        intervention.id,
        rowIndex,
        selectedSlashOptions,
      )
    }
    setSlashMenuOpen(false)
    setSelectedSlashOptions([])
  }, [
    selectedSlashOptions,
    onSlashSelectionComplete,
    groupId,
    intervention.id,
    rowIndex,
  ])

  const toggleSlashOption = (option) => {
    setSelectedSlashOptions((prev) => {
      if (prev.some((item) => item.id === option.id)) {
        return prev.filter((item) => item.id !== option.id)
      }
      return [...prev, option]
    })
  }

  useEffect(() => {
    if (!isMenuOpen) return undefined

    const handleClickOutside = (event) => {
      const target = event.target
      if (
        menuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return
      }
      onMenuToggle(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen, onMenuToggle])

  useEffect(() => {
    if (!isSlashMenuOpen) return undefined

    const handler = (event) => {
      const target = event.target
      if (
        slashMenuRef.current?.contains(target) ||
        nameInputRef.current?.contains(target)
      ) {
        return
      }
      closeSlashMenu()
    }

    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [isSlashMenuOpen, closeSlashMenu])

  useEffect(() => {
    if (!isLinkTooltipOpen) return undefined

    const handler = (event) => {
      const target = event.target
      if (linkTooltipRef.current?.contains(target)) return
      // Close on click outside, but allow hover transitions
      if (event.type === 'mousedown') {
        setLinkTooltipOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [isLinkTooltipOpen])

  // Auto-resize textarea up to 5 lines
  useEffect(() => {
    if (detailsTextareaRef.current) {
      detailsTextareaRef.current.style.height = 'auto'
      const scrollHeight = detailsTextareaRef.current.scrollHeight
      const maxHeight = 114 // 5 lines: (5 * 22px line-height) + 4px padding
      detailsTextareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [intervention.cues])

  const handleLinkIconMouseEnter = () => {
    if (linkTooltipTimeoutRef.current) {
      clearTimeout(linkTooltipTimeoutRef.current)
      linkTooltipTimeoutRef.current = null
    }
    setLinkTooltipOpen(true)
  }

  const handleLinkIconMouseLeave = () => {
    // Small delay before closing to allow mouse to move to tooltip
    linkTooltipTimeoutRef.current = setTimeout(() => {
      setLinkTooltipOpen(false)
    }, 100)
  }

  const handleTooltipMouseEnter = () => {
    if (linkTooltipTimeoutRef.current) {
      clearTimeout(linkTooltipTimeoutRef.current)
      linkTooltipTimeoutRef.current = null
    }
    setLinkTooltipOpen(true)
  }

  const handleTooltipMouseLeave = () => {
    setLinkTooltipOpen(false)
  }

  useEffect(() => {
    return () => {
      if (linkTooltipTimeoutRef.current) {
        clearTimeout(linkTooltipTimeoutRef.current)
      }
      if (interventionTooltipTimeoutRef.current) {
        clearTimeout(interventionTooltipTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isSlashMenuOpen) {
      setSelectedSlashOptions([])
      setFocusedSlashIndex(0) // Focus first item when menu opens
    } else {
      setFocusedSlashIndex(-1)
    }
  }, [isSlashMenuOpen])

  useEffect(() => {
    if (!isSlashMenuOpen) return

    const handleKeyDown = (event) => {
      const columns = 3
      const totalItems = filteredSlashOptions.length
      
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setFocusedSlashIndex((prev) => {
          if (prev < 0) return 0
          // Move right: if at end of row, wrap to next row
          const currentRow = Math.floor(prev / columns)
          const currentCol = prev % columns
          if (currentCol < columns - 1) {
            // Not at end of row, move right
            const next = prev + 1
            return next < totalItems ? next : prev
          } else {
            // At end of row, move to first item of next row
            const next = (currentRow + 1) * columns
            return next < totalItems ? next : prev
          }
        })
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setFocusedSlashIndex((prev) => {
          if (prev < 0) return 0
          // Move left: if at start of row, wrap to previous row
          const currentRow = Math.floor(prev / columns)
          const currentCol = prev % columns
          if (currentCol > 0) {
            // Not at start of row, move left
            return prev - 1
          } else {
            // At start of row, move to last item of previous row
            const prevRow = currentRow - 1
            if (prevRow < 0) return prev
            const itemsInPrevRow = Math.min(columns, totalItems - prevRow * columns)
            return prevRow * columns + itemsInPrevRow - 1
          }
        })
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setFocusedSlashIndex((prev) => {
          if (prev < 0) return 0
          // Move down: same column, next row
          const next = prev + columns
          if (next < totalItems) {
            return next
          }
          // If at bottom, wrap to top of same column
          const currentCol = prev % columns
          return currentCol < totalItems ? currentCol : prev
        })
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setFocusedSlashIndex((prev) => {
          if (prev < 0) return totalItems - 1
          // Move up: same column, previous row
          if (prev >= columns) {
            return prev - columns
          }
          // If at top, wrap to bottom of same column
          const currentCol = prev % columns
          const lastRow = Math.floor((totalItems - 1) / columns)
          const bottomIndex = lastRow * columns + currentCol
          return bottomIndex < totalItems ? bottomIndex : prev
        })
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (selectedSlashOptions.length > 0) {
          // Add all selected items
          onSlashSelectionComplete?.(
            groupId,
            intervention.id,
            rowIndex,
            selectedSlashOptions,
          )
          setSlashMenuOpen(false)
          setSelectedSlashOptions([])
        } else if (focusedSlashIndex >= 0 && focusedSlashIndex < totalItems) {
          // Add the focused item
          const focusedOption = filteredSlashOptions[focusedSlashIndex]
          onSlashSelectionComplete?.(
            groupId,
            intervention.id,
            rowIndex,
            [focusedOption],
          )
          setSlashMenuOpen(false)
          setSelectedSlashOptions([])
        }
      } else if (event.key === 'Escape') {
        event.preventDefault()
        if (selectedSlashOptions.length) {
          onSlashSelectionComplete?.(
            groupId,
            intervention.id,
            rowIndex,
            selectedSlashOptions,
          )
        }
        setSlashMenuOpen(false)
        setSelectedSlashOptions([])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSlashMenuOpen, focusedSlashIndex, filteredSlashOptions, selectedSlashOptions, onSlashSelectionComplete, groupId, intervention.id, rowIndex])

  useEffect(() => {
    if (focusedSlashItemRef.current && isSlashMenuOpen && focusedSlashIndex >= 0) {
      focusedSlashItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [focusedSlashIndex, isSlashMenuOpen])

  useEffect(() => {
    if (!showInterventionTooltip || !interventionTooltipRef.current || !hoveredInterventionId) return

    const tooltip = interventionTooltipRef.current
    const itemWrapper = tooltip.closest('.slash-menu-item-wrapper')
    if (!itemWrapper) return

    const updateTooltipPosition = () => {
      const itemRect = itemWrapper.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      
      // Use fixed positioning to avoid clipping
      tooltip.style.position = 'fixed'
      tooltip.style.transform = 'translateX(-50%)'
      
      // Default: position above
      let top = itemRect.top - tooltipRect.height - 8
      let arrowPosition = 'top'
      
      // Check if there's not enough space above, position below instead
      if (top < 8) {
        top = itemRect.bottom + 8
        arrowPosition = 'bottom'
      }
      
      tooltip.style.top = `${top}px`
      tooltip.style.left = `${itemRect.left + itemRect.width / 2}px`
      tooltip.setAttribute('data-position', arrowPosition)
      
      // Ensure tooltip doesn't go off screen horizontally
      const tooltipLeft = itemRect.left + itemRect.width / 2 - tooltipRect.width / 2
      const tooltipRight = tooltipLeft + tooltipRect.width
      const viewportWidth = window.innerWidth
      
      if (tooltipLeft < 8) {
        tooltip.style.left = `${8 + tooltipRect.width / 2}px`
      } else if (tooltipRight > viewportWidth - 8) {
        tooltip.style.left = `${viewportWidth - 8 - tooltipRect.width / 2}px`
      }
    }

    // Use requestAnimationFrame to ensure tooltip is rendered and measured
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        updateTooltipPosition()
      })
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [showInterventionTooltip, hoveredInterventionId])

  useEffect(() => {
    if (!autoFocus) {
      return
    }

    nameInputRef.current?.focus()
    onAutoFocusHandled?.()
  }, [autoFocus, onAutoFocusHandled])

  return (
    <article
      className={`intervention-row ${isDone ? 'intervention-row--done' : ''} ${
        isDragging ? 'is-dragging' : ''
      } ${isNewlyAdded ? 'intervention-row--new' : ''} ${
        isRemoving ? 'intervention-row--removing' : ''
      } ${isToDoToday ? 'intervention-row--to-do-today' : ''} ${
        isHighlighted ? 'intervention-row--highlighted' : ''
      }`}
      draggable
      onDragStart={(event) => onRowDragStart(event, groupId, rowIndex, intervention.id)}
      onDragEnd={onRowDragEnd}
      onDragOver={(event) => onRowDragOver(event, groupId, rowIndex)}
      onDoubleClick={onDoubleClick}
      onDragEnter={(event) => onRowDragEnter(event, groupId, rowIndex)}
      onDrop={(event) => onRowDrop(event, groupId, rowIndex)}
    >
      <div className="drag-handle" aria-hidden="true">
        <span className="material-symbols-outlined">drag_indicator</span>
      </div>
      <div className="intervention-fields">
        <div className="intervention-input-wrapper">
          <input
            ref={nameInputRef}
            className={`intervention-input intervention-input--primary ${isHep2GoLinked ? 'intervention-input--linked' : ''}`}
            type="text"
            value={intervention.name}
            placeholder='Type intervention, or "/" to search HEP2GO'
            aria-label="Intervention name"
            readOnly={isHep2GoLinked}
            onChange={(event) => onNameChange(groupId, intervention.id, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === '/' && !isSlashMenuOpen && !isHep2GoLinked) {
                event.preventDefault()
                setSlashMenuOpen(true)
                onNameChange(groupId, intervention.id, '')
              }
              if (event.key === 'Escape' && isSlashMenuOpen) {
                closeSlashMenu()
              }
              if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault()
                onAddNewRow?.(groupId)
              }
            }}
            onBlur={(event) => onNameBlur?.(groupId, intervention.id, event.target.value)}
          />
          {isHep2GoLinked && (
            <div className="intervention-link-wrapper">
              <button
                type="button"
                className="intervention-link-icon"
                onMouseEnter={handleLinkIconMouseEnter}
                onMouseLeave={handleLinkIconMouseLeave}
                aria-label="HEP2GO link options"
              >
                <span className="material-symbols-outlined">link</span>
              </button>
              {isLinkTooltipOpen && (
                <div
                  ref={linkTooltipRef}
                  className="intervention-link-tooltip"
                  onMouseEnter={handleTooltipMouseEnter}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <button
                    type="button"
                    className="intervention-link-tooltip-item"
                    onClick={() => {
                      onUnlink?.(groupId, intervention.id)
                      setLinkTooltipOpen(false)
                    }}
                  >
                    Unlink from HEP2GO
                  </button>
                  <button
                    type="button"
                    className="intervention-link-tooltip-item"
                    onClick={() => {
                      onOpenLink?.(intervention.hep2goLink)
                      setLinkTooltipOpen(false)
                    }}
                  >
                    Open HEP2GO link
                  </button>
                </div>
              )}
            </div>
          )}
          {isSlashMenuOpen && (
            <div ref={slashMenuRef} className="slash-menu">
              {filteredSlashOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="slash-menu-item-wrapper"
                  onMouseEnter={() => {
                    if (interventionTooltipTimeoutRef.current) {
                      clearTimeout(interventionTooltipTimeoutRef.current)
                    }
                    setHoveredInterventionId(option.id)
                    setFocusedSlashIndex(index)
                    interventionTooltipTimeoutRef.current = window.setTimeout(() => {
                      setShowInterventionTooltip(true)
                    }, 500)
                  }}
                  onMouseLeave={() => {
                    if (interventionTooltipTimeoutRef.current) {
                      clearTimeout(interventionTooltipTimeoutRef.current)
                      interventionTooltipTimeoutRef.current = null
                    }
                    setHoveredInterventionId(null)
                    setShowInterventionTooltip(false)
                  }}
                >
                  <button
                    type="button"
                    ref={index === focusedSlashIndex ? focusedSlashItemRef : null}
                    className={`slash-menu-item ${
                      selectedSlashOptions.some((item) => item.id === option.id)
                        ? 'is-selected'
                        : ''
                    } ${
                      index === focusedSlashIndex ? 'is-focused' : ''
                    }`}
                    onClick={() => toggleSlashOption(option)}
                  >
                    <div
                      className="slash-menu-thumb"
                      style={{ backgroundColor: option.color }}
                    >
                      {selectedSlashOptions.some((item) => item.id === option.id) && (
                        <div className="slash-menu-thumb-checkbox checkbox checkbox--checked" />
                      )}
                      {option.thumbnailUrl ? (
                        <img
                          src={option.thumbnailUrl}
                          alt={option.name}
                          className="slash-menu-thumb-image"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.target.style.display = 'none'
                            const icon = e.target.parentElement.querySelector('.material-symbols-outlined')
                            if (icon) icon.style.display = 'inline-flex'
                          }}
                        />
                      ) : null}
                      <span
                        className="material-symbols-outlined"
                        style={{ display: option.thumbnailUrl ? 'none' : 'inline-flex' }}
                      >
                        {option.icon}
                      </span>
                    </div>
                    <span className="slash-menu-name">{option.name}</span>
                  </button>
                  {hoveredInterventionId === option.id && showInterventionTooltip && option.description && (
                    <div ref={interventionTooltipRef} className="intervention-item-tooltip">
                      {option.description}
                    </div>
                  )}
                </div>
              ))}
              {!filteredSlashOptions.length && (
                <div className="slash-menu-empty">No matching interventions</div>
              )}
            </div>
          )}
        </div>
        <textarea
          ref={detailsTextareaRef}
          className="intervention-input intervention-input--details"
          value={intervention.cues}
          placeholder="Add details..."
          aria-label="Intervention details"
          onChange={(event) => {
            onDetailsChange(groupId, intervention.id, event.target.value)
            // Auto-resize on change
            if (detailsTextareaRef.current) {
              detailsTextareaRef.current.style.height = 'auto'
              const scrollHeight = detailsTextareaRef.current.scrollHeight
              const maxHeight = 114 // 5 lines: (5 * 22px line-height) + 4px padding
              detailsTextareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
            }
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
              event.preventDefault()
              onAddNewRow?.(groupId)
            }
          }}
          rows={1}
        />
      </div>
      <div className="intervention-actions">
        <button
          type="button"
          className={`action-button action-button--toggle ${isDone ? 'is-active' : ''}`}
          onClick={() => onToggle(intervention.id)}
          aria-pressed={isDone}
        >
          <span className="material-symbols-outlined">
            {isDone ? 'check' : 'add'}
          </span>
        </button>
        <button
          type="button"
          className={`checkbox ${isChecked ? 'checkbox--checked' : ''}`}
          onClick={() => onCheckboxToggle(intervention.id)}
          aria-label="Toggle checkbox"
        />
        <div className="more-menu-wrapper">
          <button
            ref={menuButtonRef}
            type="button"
            className={`action-button action-button--ghost ${isMenuOpen ? 'menu-active' : ''}`}
            onClick={() => onMenuToggle(intervention.id)}
            aria-label="Open intervention menu"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          {isMenuOpen && (
            <div ref={menuRef} className="intervention-menu" role="menu">
              {interventionMenuItems.map((item) => (
                <Fragment key={item.key}>
                  {item.dividerBefore && <div className="menu-divider" />}
          <button
            type="button"
            className={`intervention-menu-item ${item.variant === 'danger' ? 'menu-item-danger' : ''}`}
            onClick={() => {
              onMenuAction?.(groupId, intervention.id, item.action)
            }}
          >
                    <span className="menu-icon" aria-hidden="true">
                      <item.icon />
                    </span>
                    <span className="menu-label">{item.label}</span>
                    {item.trailingArrow && <span className="menu-chevron">›</span>}
                  </button>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function NewInterventionRow({ onCreate }) {
  return (
    <div className="new-intervention-row" role="button" onClick={onCreate}>
      <span className="material-symbols-outlined">add</span>
      <span>Add Intervention <span className="new-intervention-hint">(type ctrl+n when typing above)</span></span>
    </div>
  )
}

function EmptyFlowsheetState({ onAddCpt, onAddEval }) {
  return (
    <div className="flowsheet-empty-state">
      <div className="flowsheet-empty-copy">
        <p className="flowsheet-empty-subtitle">
          Start by adding therapeutic CPTs, then add interventions.
        </p>
      </div>
      <div className="flowsheet-empty-actions">
        <button type="button" className="ghost-pill" onClick={onAddCpt}>
          Add CPT
        </button>
        <button type="button" className="ghost-pill" onClick={onAddEval}>
          Add Eval Procedure
        </button>
      </div>
    </div>
  )
}

export default function Flowsheet() {
  const defaultStatusMap = useMemo(() => {
    const map = {}
    flowsheetGroups.forEach((group) => {
      group.interventions.forEach((intervention) => {
        map[intervention.id] = intervention.status
      })
    })
    return map
  }, [])

  const [statusMap, setStatusMap] = useState(defaultStatusMap)

  const [groupsData, setGroupsData] = useState(flowsheetGroups)
  const [draggingInfo, setDraggingInfo] = useState(null)
  const [dropLocation, setDropLocation] = useState(null)
  const [isHoveringLinkedLegend, setIsHoveringLinkedLegend] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState(() =>
    flowsheetGroups.reduce((acc, group) => {
      acc[group.id] = false
      return acc
    }, {}),
  )
  const [focusInterventionId, setFocusInterventionId] = useState(null)
  const [newRowAnimationIds, setNewRowAnimationIds] = useState([])
  const [removingRowIds, setRemovingRowIds] = useState([])
  const createdRowsRef = useRef(new Set())
  const newRowAnimationTimers = useRef({})
  const removalTimers = useRef({})

  useEffect(() => {
    return () => {
      Object.values(newRowAnimationTimers.current).forEach((timer) => clearTimeout(timer))
      Object.values(removalTimers.current).forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const cycleStatus = (currentStatus) => {
    if (currentStatus === 'todo') return 'done'
    if (currentStatus === 'done') return 'todo'
    return 'todo'
  }

  const handleToggle = (id) => {
    setStatusMap((prev) => ({
      ...prev,
      [id]: cycleStatus(prev[id]),
    }))
  }

  const defaultCheckboxMap = useMemo(() => {
    const map = {}
    flowsheetGroups.forEach((group) => {
      group.interventions.forEach((intervention) => {
        map[intervention.id] = false
      })
    })
    return map
  }, [])

  const [checkboxMap, setCheckboxMap] = useState(defaultCheckboxMap)
  const [toDoTodayMap, setToDoTodayMap] = useState({})

  const toggleCheckbox = (id) => {
    setCheckboxMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const areAllCheckboxesChecked = useMemo(() => {
    const allInterventionIds = groupsData.flatMap((group) =>
      group.interventions.map((intervention) => intervention.id),
    )
    if (allInterventionIds.length === 0) return false
    return allInterventionIds.every((id) => checkboxMap[id] === true)
  }, [groupsData, checkboxMap])

  const handleMarkAllDone = () => {
    const allInterventionIds = groupsData.flatMap((group) =>
      group.interventions.map((intervention) => intervention.id),
    )
    if (areAllCheckboxesChecked) {
      // Uncheck all
      setCheckboxMap((prev) => {
        const next = { ...prev }
        allInterventionIds.forEach((id) => {
          next[id] = false
        })
        return next
      })
    } else {
      // Check all
      setCheckboxMap((prev) => {
        const next = { ...prev }
        allInterventionIds.forEach((id) => {
          next[id] = true
        })
        return next
      })
    }
  }

  const handleDoubleClickToDo = (interventionId) => {
    setToDoTodayMap((prev) => ({
      ...prev,
      [interventionId]: !prev[interventionId],
    }))
  }

  const [menuOpenId, setMenuOpenId] = useState(null)
  const [isCptPickerOpen, setCptPickerOpen] = useState(false)
  const [isEvalPickerOpen, setEvalPickerOpen] = useState(false)
  const [cptSearch, setCptSearch] = useState('')
  const [evalSearch, setEvalSearch] = useState('')
  const [hoveredMinutesGroupId, setHoveredMinutesGroupId] = useState(null)
  const [selectedCptOptions, setSelectedCptOptions] = useState([])
  const [selectedEvalOptions, setSelectedEvalOptions] = useState([])
  const cptPickerRef = useRef(null)
  const evalPickerRef = useRef(null)
  const [headerMenuOpenId, setHeaderMenuOpenId] = useState(null)
  const [openCptAutocompleteId, setOpenCptAutocompleteId] = useState(null)
  const [cptAutocompleteSearch, setCptAutocompleteSearch] = useState({})
  const cptAutocompleteRefs = useRef({})
  const [openModifierAutocompleteId, setOpenModifierAutocompleteId] = useState(null)
  const [modifierAutocompleteSearch, setModifierAutocompleteSearch] = useState({})
  const modifierAutocompleteRefs = useRef({})
  const [openProviderAutocompleteId, setOpenProviderAutocompleteId] = useState(null)
  const [providerAutocompleteSearch, setProviderAutocompleteSearch] = useState({})
  const providerAutocompleteRefs = useRef({})


  const filteredCptOptions = useMemo(() => {
    if (!cptSearch) return cptPickerOptions
    const lower = cptSearch.toLowerCase()
    return cptPickerOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(lower) ||
        option.label.toLowerCase().includes(lower),
    )
  }, [cptSearch])

  const filteredEvalOptions = useMemo(() => {
    if (!evalSearch) return evaluativeCptOptions
    const lower = evalSearch.toLowerCase()
    return evaluativeCptOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(lower) ||
        option.label.toLowerCase().includes(lower),
    )
  }, [evalSearch, evaluativeCptOptions])

  const getFilteredCptOptionsForGroup = useCallback((groupId) => {
    const searchTerm = cptAutocompleteSearch[groupId] || ''
    if (!searchTerm) return cptOptions
    const lower = searchTerm.toLowerCase()
    return cptOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(lower) ||
        option.label.toLowerCase().includes(lower),
    )
  }, [cptAutocompleteSearch])

  const getFilteredModifierOptionsForGroup = useCallback((groupId) => {
    const searchTerm = modifierAutocompleteSearch[groupId] || ''
    if (!searchTerm) return modifierOptions
    const lower = searchTerm.toLowerCase()
    return modifierOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(lower) ||
        option.label.toLowerCase().includes(lower),
    )
  }, [modifierAutocompleteSearch])

  const getFilteredProviderOptionsForGroup = useCallback((groupId) => {
    const searchTerm = providerAutocompleteSearch[groupId] || ''
    if (!searchTerm) return providerOptions
    const lower = searchTerm.toLowerCase()
    return providerOptions.filter((provider) => provider.toLowerCase().includes(lower))
  }, [providerAutocompleteSearch])

  const handleMenuToggle = (id) => {
    setMenuOpenId((prev) => (prev === id ? null : id))
  }

  const handleMenuAction = (groupId, interventionId, actionKey) => {
    setMenuOpenId(null)
    if (actionKey === 'delete') {
      removeIntervention(groupId, interventionId)
    }
  }

  const handleHeaderMenuAction = (groupId, actionKey) => {
    setHeaderMenuOpenId(null)
    if (actionKey === 'markDone') {
      setStatusMap((prev) => {
        const next = { ...prev }
        const group = groupsData.find((g) => g.id === groupId)
        group?.interventions.forEach((intervention) => {
          next[intervention.id] = 'done'
        })
        return next
      })
      setCheckboxMap((prev) => {
        const next = { ...prev }
        const group = groupsData.find((g) => g.id === groupId)
        group?.interventions.forEach((intervention) => {
          next[intervention.id] = true
        })
        return next
      })
    }
    if (actionKey === 'addToHep') {
      setCheckboxMap((prev) => {
        const next = { ...prev }
        const group = groupsData.find((g) => g.id === groupId)
        group?.interventions.forEach((intervention) => {
          next[intervention.id] = true
        })
        return next
      })
    }
    if (actionKey === 'remove') {
      setGroupsData((prev) => prev.filter((group) => group.id !== groupId))
      setHeaderState((prev) => {
        const next = { ...prev }
        delete next[groupId]
        return next
      })
      setCollapsedGroups((prev) => {
        const next = { ...prev }
        delete next[groupId]
        return next
      })
    }
  }

  useEffect(() => {
    if (!isCptPickerOpen) return undefined
    const handleClickOutside = (event) => {
      if (cptPickerRef.current?.contains(event.target)) return
      setCptPickerOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCptPickerOpen])

  useEffect(() => {
    if (!isCptPickerOpen) {
      setSelectedCptOptions([])
    }
  }, [isCptPickerOpen])

  useEffect(() => {
    if (!isEvalPickerOpen) return undefined
    const handleClickOutside = (event) => {
      if (evalPickerRef.current?.contains(event.target)) return
      setEvalPickerOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEvalPickerOpen])

  useEffect(() => {
    if (!isEvalPickerOpen) {
      setSelectedEvalOptions([])
    }
  }, [isEvalPickerOpen])

  useEffect(() => {
    if (!headerMenuOpenId) return undefined
    const handler = (event) => {
      if (event.target.closest('.header-menu')) return
      if (event.target.closest('.header-more-button')) return
      setHeaderMenuOpenId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [headerMenuOpenId])

  useEffect(() => {
    if (!openCptAutocompleteId) return undefined
    const handler = (event) => {
      const ref = cptAutocompleteRefs.current[openCptAutocompleteId]
      if (ref?.contains(event.target)) return
      // Restore the previous value when clicking away without selection
      setOpenCptAutocompleteId(null)
      setCptAutocompleteSearch((prev) => {
        const next = { ...prev }
        delete next[openCptAutocompleteId]
        return next
      })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openCptAutocompleteId])

  useEffect(() => {
    if (!openModifierAutocompleteId) return undefined
    const handler = (event) => {
      const ref = modifierAutocompleteRefs.current[openModifierAutocompleteId]
      if (ref?.contains(event.target)) return
      setOpenModifierAutocompleteId(null)
      setModifierAutocompleteSearch((prev) => {
        const next = { ...prev }
        delete next[openModifierAutocompleteId]
        return next
      })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openModifierAutocompleteId])

  useEffect(() => {
    if (!openProviderAutocompleteId) return undefined
    const handler = (event) => {
      const ref = providerAutocompleteRefs.current[openProviderAutocompleteId]
      if (ref?.contains(event.target)) return
      setOpenProviderAutocompleteId(null)
      setProviderAutocompleteSearch((prev) => {
        const next = { ...prev }
        delete next[openProviderAutocompleteId]
        return next
      })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openProviderAutocompleteId])

  const defaultHeaderState = useMemo(() => createHeaderDefaults(), [])
  const [headerState, setHeaderState] = useState(defaultHeaderState)

  const updateHeaderField = (groupId, field, value) => {
    setHeaderState((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [field]: value,
      },
    }))
  }

  const addIntervention = (groupId) => {
    const newId = createInterventionId()
    setGroupsData((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              interventions: [
                ...group.interventions,
                {
                  id: newId,
                  name: '',
                  cues: '',
                  sets: 0,
                  reps: 0,
                  weight: '',
                  status: 'todo',
                },
              ],
            }
          : group,
      ),
    )
    createdRowsRef.current.add(newId)
    setFocusInterventionId(newId)
    setNewRowAnimationIds((prev) => [...prev, newId])
    if (newRowAnimationTimers.current[newId]) {
      clearTimeout(newRowAnimationTimers.current[newId])
    }
    newRowAnimationTimers.current[newId] = window.setTimeout(() => {
      setNewRowAnimationIds((prev) => prev.filter((id) => id !== newId))
      delete newRowAnimationTimers.current[newId]
    }, 420)
  }

  const performImmediateRemoval = (groupId, interventionId) => {
    createdRowsRef.current.delete(interventionId)
    if (newRowAnimationTimers.current[interventionId]) {
      clearTimeout(newRowAnimationTimers.current[interventionId])
      delete newRowAnimationTimers.current[interventionId]
    }
    if (removalTimers.current[interventionId]) {
      clearTimeout(removalTimers.current[interventionId])
      delete removalTimers.current[interventionId]
    }
    setNewRowAnimationIds((prev) => prev.filter((id) => id !== interventionId))
    setRemovingRowIds((prev) => prev.filter((id) => id !== interventionId))
    setGroupsData((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              interventions: group.interventions.filter((i) => i.id !== interventionId),
            }
          : group,
      ),
    )
  }

  const removeIntervention = (groupId, interventionId, options = {}) => {
    const { animate = false } = options
    if (animate) {
      if (removalTimers.current[interventionId]) {
        return
      }
      setRemovingRowIds((prev) =>
        prev.includes(interventionId) ? prev : [...prev, interventionId],
      )
      removalTimers.current[interventionId] = window.setTimeout(() => {
        removalTimers.current[interventionId] = null
        performImmediateRemoval(groupId, interventionId)
      }, 250)
      return
    }
    performImmediateRemoval(groupId, interventionId)
  }

  const updateInterventionField = (groupId, interventionId, field, value) => {
    setGroupsData((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              interventions: group.interventions.map((intervention) =>
                intervention.id === interventionId
                  ? {
                      ...intervention,
                      [field]: value,
                    }
                  : intervention,
              ),
            }
          : group,
      ),
    )
  }

  const handleInterventionNameChange = (groupId, interventionId, value) => {
    if (value?.trim()) {
      createdRowsRef.current.delete(interventionId)
    }
    updateInterventionField(groupId, interventionId, 'name', value)
  }

  const handleUnlinkIntervention = (groupId, interventionId) => {
    updateInterventionField(groupId, interventionId, 'hep2goId', null)
    updateInterventionField(groupId, interventionId, 'hep2goLink', null)
  }

  const handleOpenHep2GoLink = (link) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  const handleInterventionDetailsChange = (groupId, interventionId, value) =>
    updateInterventionField(groupId, interventionId, 'cues', value)

  const handleAutoAddedRowBlur = (groupId, interventionId, value) => {
    if (!createdRowsRef.current.has(interventionId)) {
      return
    }

    if (value?.trim()) {
      createdRowsRef.current.delete(interventionId)
    }
  }

  const moveInterventionItem = (fromGroupId, toGroupId, fromIndex, toIndex) => {
    setGroupsData((prev) => {
      const groupsCopy = prev.map((group) => ({
        ...group,
        interventions: [...group.interventions],
      }))

      const fromGroup = groupsCopy.find((g) => g.id === fromGroupId)
      const toGroup = groupsCopy.find((g) => g.id === toGroupId)
      if (!fromGroup || !toGroup) return prev

      // Validate indices
      if (fromIndex < 0 || fromIndex >= fromGroup.interventions.length) return prev
      if (toIndex < 0 || toIndex > toGroup.interventions.length) return prev

      const [movedItem] = fromGroup.interventions.splice(fromIndex, 1)
      if (!movedItem) return prev

      // Calculate the correct insert index
      let insertIndex = toIndex
      if (fromGroupId === toGroupId) {
        // When moving within the same group, adjust the index
        if (toIndex > fromIndex) {
          // Moving down: the index needs to be decremented because we removed an item
          insertIndex = toIndex - 1
        }
        // When moving up, the index is already correct
      }

      // Ensure insertIndex is within bounds
      insertIndex = Math.max(0, Math.min(insertIndex, toGroup.interventions.length))
      
      toGroup.interventions.splice(insertIndex, 0, movedItem)
      return groupsCopy
    })
  }

  const addCptGroup = (option, options = {}) => {
    const { closePicker = true, pickerType = 'cpt' } = options
    const newGroupId = `cpt-${Date.now()}-${option.code}`
    setGroupsData((prev) => [
      ...prev,
      {
        id: newGroupId,
        label: `${option.code} · ${option.label}`,
        tag: 'Custom',
        interventions: [],
      },
    ])
    setHeaderState((prev) => ({
      ...prev,
      [newGroupId]: {
        cpt: option.code,
        modifier: '',
        quantity: '',
        provider: '',
      },
    }))
    setCollapsedGroups((prev) => ({
      ...prev,
      [newGroupId]: false,
    }))
    if (closePicker) {
      if (pickerType === 'eval') {
        setEvalPickerOpen(false)
        setEvalSearch('')
        setSelectedEvalOptions([])
      } else {
        setCptPickerOpen(false)
        setCptSearch('')
        setSelectedCptOptions([])
      }
    }
  }

  const toggleCptOptionSelection = (optionCode) => {
    setSelectedCptOptions((prev) =>
      prev.includes(optionCode)
        ? prev.filter((code) => code !== optionCode)
        : [...prev, optionCode],
    )
  }

  const toggleEvalOptionSelection = (optionCode) => {
    setSelectedEvalOptions((prev) =>
      prev.includes(optionCode)
        ? prev.filter((code) => code !== optionCode)
        : [...prev, optionCode],
    )
  }

  const addSelectedCptGroups = () => {
    selectedCptOptions.forEach((code) => {
      const option = cptPickerOptions.find((item) => item.code === code)
      if (option) {
        addCptGroup(option, { closePicker: false })
      }
    })
    setSelectedCptOptions([])
    setCptPickerOpen(false)
    setCptSearch('')
  }

  const addSelectedEvalGroups = () => {
    selectedEvalOptions.forEach((code) => {
      const option = evaluativeCptOptions.find((item) => item.code === code)
      if (option) {
        addCptGroup(option, { closePicker: false, pickerType: 'eval' })
      }
    })
    setSelectedEvalOptions([])
    setEvalPickerOpen(false)
    setEvalSearch('')
  }

  const handleResetFlowsheet = () => {
    setGroupsData([])
    setStatusMap({})
    setCheckboxMap({})
    setHeaderState({})
    setCollapsedGroups({})
    setFocusInterventionId(null)
    setSelectedCptOptions([])
    setSelectedEvalOptions([])
    setCptPickerOpen(false)
    setEvalPickerOpen(false)
  }

  const handleDropOnRow = (event, targetGroupId, targetIndex) => {
    event.preventDefault()
    event.stopPropagation()
    if (!draggingInfo) return
    
    // Use dropLocation if available and valid, otherwise use targetIndex
    let resolvedIndex = targetIndex
    if (dropLocation && dropLocation.groupId === targetGroupId) {
      resolvedIndex = dropLocation.index
    }
    
    // Ensure we don't drop on itself
    if (draggingInfo.groupId === targetGroupId && draggingInfo.index === resolvedIndex) {
      setDraggingInfo(null)
      setDropLocation(null)
      return
    }
    
    moveInterventionItem(
      draggingInfo.groupId,
      targetGroupId,
      draggingInfo.index,
      resolvedIndex,
    )
    setDraggingInfo(null)
    setDropLocation(null)
  }

  const handleDropOnList = (event, targetGroupId) => {
    event.preventDefault()
    if (!draggingInfo) return
    const resolvedIndex =
      dropLocation && dropLocation.groupId === targetGroupId
        ? dropLocation.index
        : groupsData.find((group) => group.id === targetGroupId)?.interventions.length
    moveInterventionItem(
      draggingInfo.groupId,
      targetGroupId,
      draggingInfo.index,
      resolvedIndex,
    )
    setDraggingInfo(null)
    setDropLocation(null)
  }

  const handleSlashSelectionComplete = (
    groupId,
    interventionId,
    rowIndex,
    selectedOptions,
  ) => {
    if (!selectedOptions?.length) return

    const newInterventionIds = []

    setGroupsData((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        const interventions = [...group.interventions]
        const targetIndex = interventions.findIndex(
          (item) => item.id === interventionId,
        )
        const targetRow =
          targetIndex >= 0 ? interventions[targetIndex] : null
        const shouldPopulateRow = targetRow && !targetRow.name
        const baseOptions = shouldPopulateRow
          ? selectedOptions.slice(1)
          : selectedOptions

        const updatedInterventions = interventions.map((intervention) =>
          intervention.id === interventionId && shouldPopulateRow
            ? {
                ...intervention,
                name: selectedOptions[0]?.name ?? intervention.name,
                hep2goId: selectedOptions[0]?.hep2goId || null,
                hep2goLink: selectedOptions[0]?.hep2goId
                  ? `https://www.hep2go.com/exercise_editor.php?exId=${selectedOptions[0].hep2goId}`
                  : null,
              }
            : intervention,
        )

        const rawInsertionIndex =
          targetIndex >= 0
            ? targetIndex + 1
            : Math.min(rowIndex + 1, updatedInterventions.length)
        const insertionIndex = Math.min(
          rawInsertionIndex,
          updatedInterventions.length,
        )

        const newInterventions = baseOptions.map((option) => {
          const newIntervention = {
            id: createInterventionId(),
            name: option.name,
            cues: '',
            sets: 0,
            reps: 0,
            weight: '',
            status: 'todo',
            hep2goId: option.hep2goId || null,
            hep2goLink: option.hep2goId
              ? `https://www.hep2go.com/exercise_editor.php?exId=${option.hep2goId}`
              : null,
          }
          newInterventionIds.push(newIntervention.id)
          return newIntervention
        })

        if (!newInterventions.length) {
          return {
            ...group,
            interventions: updatedInterventions,
          }
        }

        return {
          ...group,
          interventions: [
            ...updatedInterventions.slice(0, insertionIndex),
            ...newInterventions,
            ...updatedInterventions.slice(insertionIndex),
          ],
        }
      }),
    )

    if (newInterventionIds.length) {
      setStatusMap((prev) => {
        const next = { ...prev }
        newInterventionIds.forEach((id) => {
          next[id] = 'todo'
        })
        return next
      })
      setCheckboxMap((prev) => {
        const next = { ...prev }
        newInterventionIds.forEach((id) => {
          next[id] = false
        })
        return next
      })
    }
  }

  const handleDragStart = (event, groupId, index, interventionId) => {
    setDraggingInfo({ groupId, index, id: interventionId })
    event.dataTransfer?.setData('text/plain', interventionId)
    event.dataTransfer?.setDragImage(new Image(), 0, 0)
  }

  const handleDragEnd = () => {
    setDraggingInfo(null)
  }

  const handleRowDragOver = (event, groupId, index) => {
    event.preventDefault()
    event.stopPropagation()
    if (!draggingInfo) return
    
    // Don't allow dropping on itself
    if (draggingInfo.groupId === groupId && draggingInfo.index === index) {
      return
    }
    
    const rect = event.currentTarget.getBoundingClientRect()
    const midPoint = rect.height / 2
    const relativeY = event.clientY - rect.top
    
    // Add a threshold zone (15px) around the midpoint to reduce jitter
    const threshold = 15
    const upperThreshold = midPoint - threshold
    const lowerThreshold = midPoint + threshold
    
    let targetIndex
    if (relativeY < upperThreshold) {
      // Clearly in the upper half
      targetIndex = index
    } else if (relativeY > lowerThreshold) {
      // Clearly in the lower half
      targetIndex = index + 1
    } else {
      // In the threshold zone - keep the current drop location if it exists and is valid
      if (dropLocation && dropLocation.groupId === groupId) {
        // Check if current drop location is for this row or adjacent
        if (dropLocation.index === index || dropLocation.index === index + 1) {
          return // Don't change if we're in the threshold zone
        }
      }
      // Default to lower half when in threshold
      targetIndex = index + 1
    }
    
    // Adjust index if dragging within the same group and moving down
    let adjustedIndex = targetIndex
    if (draggingInfo.groupId === groupId) {
      if (draggingInfo.index < targetIndex) {
        adjustedIndex = targetIndex - 1
      }
    }
    
    // Only update if the drop location actually changed
    if (!dropLocation || dropLocation.groupId !== groupId || dropLocation.index !== adjustedIndex) {
      setDropLocation({ groupId, index: adjustedIndex })
    }
  }

  const handleRowDragEnter = (event, groupId, index) => {
    event.preventDefault()
    if (!draggingInfo) return
    
    // Don't allow dropping on itself
    if (draggingInfo.groupId === groupId && draggingInfo.index === index) {
      return
    }
    
    // Use the same logic as dragOver for consistency
    const rect = event.currentTarget.getBoundingClientRect()
    const midPoint = rect.height / 2
    const relativeY = event.clientY - rect.top
    
    // Add a threshold zone (15px) around the midpoint to reduce jitter
    const threshold = 15
    const upperThreshold = midPoint - threshold
    const lowerThreshold = midPoint + threshold
    
    let targetIndex
    if (relativeY < upperThreshold) {
      targetIndex = index
    } else if (relativeY > lowerThreshold) {
      targetIndex = index + 1
    } else {
      // In threshold zone - keep current or default to lower
      if (dropLocation && dropLocation.groupId === groupId) {
        if (dropLocation.index === index || dropLocation.index === index + 1) {
          return
        }
      }
      targetIndex = index + 1
    }
    
    // Adjust index if dragging within the same group and moving down
    let adjustedIndex = targetIndex
    if (draggingInfo.groupId === groupId) {
      if (draggingInfo.index < targetIndex) {
        adjustedIndex = targetIndex - 1
      }
    }
    
    // Only update if the drop location actually changed
    if (!dropLocation || dropLocation.groupId !== groupId || dropLocation.index !== adjustedIndex) {
      setDropLocation({ groupId, index: adjustedIndex })
    }
  }

  const handleListDragOver = (event, groupId) => {
    event.preventDefault()
    event.stopPropagation()
    if (!draggingInfo) return
    
    const group = groupsData.find((g) => g.id === groupId)
    if (!group) return
    
    let targetIndex = group.interventions.length
    
    // If dragging within the same group, don't allow dropping at the end if it's the same position
    if (draggingInfo.groupId === groupId) {
      // Only set to end if we're not already at the end
      if (draggingInfo.index < group.interventions.length - 1) {
        targetIndex = group.interventions.length
      } else {
        return // Already at the end, don't update
      }
    }
    
    // Only update if the drop location actually changed
    if (!dropLocation || dropLocation.groupId !== groupId || dropLocation.index !== targetIndex) {
      setDropLocation({ groupId, index: targetIndex })
    }
  }

  const toggleGroupVisibility = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const totalMinutes = useMemo(
    () =>
      Object.values(headerState).reduce(
        (sum, group) => sum + parseMinutesInput(group.quantity),
        0,
      ),
    [headerState],
  )

  const totalUnits = useMemo(
    () =>
      Object.values(headerState).reduce(
        (sum, group) => sum + calculateUnitsForMinutes(parseMinutesInput(group.quantity)),
        0,
      ),
    [headerState],
  )

  return (
    <article className="flowsheet-card">
      <header className="flowsheet-header">
        <div className="tab-menu">
          <button className="tab active">Flowsheet</button>
          <button className="tab">Intervention Progress</button>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Print flowsheet">
            <span className="material-symbols-outlined">print</span>
          </button>
          <button className="icon-button" aria-label="Edit flowsheet">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <div className="cpt-picker">
            <button
              type="button"
              className="ghost-pill"
              onClick={() => {
                setCptPickerOpen((prev) => !prev)
                if (!isCptPickerOpen) setEvalPickerOpen(false)
              }}
              aria-haspopup="true"
              aria-expanded={isCptPickerOpen}
            >
              <span className="material-symbols-outlined">add</span>
              CPT
            </button>
            {isCptPickerOpen && (
              <div className="cpt-picker-popover" ref={cptPickerRef}>
                <input
                  type="text"
                  className="cpt-picker-search"
                  placeholder="Search CPT"
                  value={cptSearch}
                  onChange={(event) => setCptSearch(event.target.value)}
                />
                <div className="cpt-picker-list">
                  {filteredCptOptions.map((option) => (
                    <button
                      key={`${option.code}-${option.label}`}
                      type="button"
                      className={`cpt-picker-item ${
                        selectedCptOptions.includes(option.code) ? 'is-selected' : ''
                      }`}
                      onClick={() => toggleCptOptionSelection(option.code)}
                    >
                      {option.code} · {option.label}
                    </button>
                  ))}
                </div>
                <div className="cpt-picker-footer">
                  <button
                    type="button"
                    className="ghost-pill"
                    onClick={addSelectedCptGroups}
                    disabled={!selectedCptOptions.length}
                  >
                    Add selected ({selectedCptOptions.length})
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="cpt-picker">
            <button
              type="button"
              className="ghost-pill"
              onClick={() => {
                setEvalPickerOpen((prev) => !prev)
                if (!isEvalPickerOpen) setCptPickerOpen(false)
              }}
              aria-haspopup="true"
              aria-expanded={isEvalPickerOpen}
            >
              <span className="material-symbols-outlined">add</span>
              Eval Procedure
            </button>
            {isEvalPickerOpen && (
              <div className="cpt-picker-popover" ref={evalPickerRef}>
                <input
                  type="text"
                  className="cpt-picker-search"
                  placeholder="Search CPT"
                  value={evalSearch}
                  onChange={(event) => setEvalSearch(event.target.value)}
                />
                <div className="cpt-picker-list">
                  {filteredEvalOptions.map((option) => (
                    <button
                      key={`${option.code}-${option.label}`}
                      type="button"
                      className={`cpt-picker-item ${
                        selectedEvalOptions.includes(option.code) ? 'is-selected' : ''
                      }`}
                      onClick={() => toggleEvalOptionSelection(option.code)}
                    >
                      {option.code} · {option.label}
                    </button>
                  ))}
                </div>
                <div className="cpt-picker-footer">
                  <button
                    type="button"
                    className="ghost-pill"
                    onClick={addSelectedEvalGroups}
                    disabled={!selectedEvalOptions.length}
                  >
                    Add selected ({selectedEvalOptions.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="flowsheet-content">
        <div className="flowsheet-summary-bar">
          <div className="summary-values">
            <div className="summary-label-value">
              <span className="summary-label">Total Treatment Time:</span>
              <span className="summary-value">{`${totalMinutes}m`}</span>
            </div>
            <div className="summary-label-value">
              <span className="summary-label">Total Units:</span>
              <span className="summary-value">{totalUnits}</span>
            </div>
          </div>
          <button type="button" className="summary-link" onClick={handleMarkAllDone}>
            {areAllCheckboxesChecked ? 'Uncheck All' : 'Mark all Done'}
          </button>
        </div>

        {!groupsData.length && (
          <EmptyFlowsheetState
            onAddCpt={() => setCptPickerOpen(true)}
            onAddEval={() => setEvalPickerOpen(true)}
          />
        )}

        {groupsData.map((group) => {
          const headerSelection = headerState[group.id] ?? defaultHeaderState[group.id]
          const minutesValue = parseMinutesInput(headerSelection?.quantity ?? '')
          const groupUnits = calculateUnitsForMinutes(minutesValue)

          return (
            <div key={group.id} className="group-card">
              <div className="cpt-group-header">
                <div className="cpt-header-controls">
                  <button
                    type="button"
                    className="header-collapse-toggle"
                    onClick={() => toggleGroupVisibility(group.id)}
                    aria-expanded={!collapsedGroups[group.id]}
                  >
                    <span className="material-symbols-outlined">
                      {collapsedGroups[group.id] ? 'keyboard_arrow_right' : 'keyboard_arrow_down'}
                    </span>
                  </button>
                  <div className="cpt-inputs-row">
                    <div className="cpt-primary-controls">
                      <div className="select-wrapper select-wrapper--cpt cpt-autocomplete-wrapper">
                        <input
                          type="text"
                          className="cpt-select cpt-autocomplete-input"
                          value={
                            openCptAutocompleteId === group.id
                              ? cptAutocompleteSearch[group.id] || ''
                              : (() => {
                                  const selected = cptOptions.find(
                                    (opt) => opt.code === headerSelection?.cpt,
                                  )
                                  return selected
                                    ? `${selected.code} • ${selected.label}`
                                    : headerSelection?.cpt || ''
                                })()
                          }
                          onChange={(event) => {
                            setCptAutocompleteSearch((prev) => ({
                              ...prev,
                              [group.id]: event.target.value,
                            }))
                            if (!openCptAutocompleteId || openCptAutocompleteId !== group.id) {
                              setOpenCptAutocompleteId(group.id)
                            }
                          }}
                          onFocus={() => {
                            setOpenCptAutocompleteId(group.id)
                            // Clear the search when opening so all options are shown
                            setCptAutocompleteSearch((prev) => ({
                              ...prev,
                              [group.id]: '',
                            }))
                          }}
                          placeholder="Select CPT"
                        />
                        <span className="cpt-autocomplete-arrow material-symbols-outlined">keyboard_arrow_down</span>
                        {openCptAutocompleteId === group.id && (
                          <div
                            className="cpt-autocomplete-menu"
                            ref={(el) => {
                              if (el) {
                                cptAutocompleteRefs.current[group.id] = el
                              }
                            }}
                          >
                            <div className="cpt-autocomplete-list">
                              {getFilteredCptOptionsForGroup(group.id).map((option) => (
                                <button
                                  key={option.code}
                                  type="button"
                                  className={`cpt-autocomplete-item ${
                                    headerSelection?.cpt === option.code ? 'is-selected' : ''
                                  }`}
                                  onClick={() => {
                                    updateHeaderField(group.id, 'cpt', option.code)
                                    setOpenCptAutocompleteId(null)
                                    setCptAutocompleteSearch((prev) => {
                                      const next = { ...prev }
                                      delete next[group.id]
                                      return next
                                    })
                                  }}
                                >
                                  {option.code} · {option.label}
                                </button>
                              ))}
                              {getFilteredCptOptionsForGroup(group.id).length === 0 && (
                                <div className="cpt-autocomplete-empty">No matching CPTs</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="select-wrapper select-wrapper--modifier modifier-autocomplete-wrapper">
                        <input
                          type="text"
                          className="modifier-select modifier-autocomplete-input"
                          value={
                            openModifierAutocompleteId === group.id
                              ? modifierAutocompleteSearch[group.id] || ''
                              : (() => {
                                  const selected = modifierOptions.find(
                                    (opt) => opt.code === headerSelection?.modifier,
                                  )
                                  return selected
                                    ? `${selected.code} • ${selected.label}`
                                    : headerSelection?.modifier || ''
                                })()
                          }
                          onChange={(event) => {
                            setModifierAutocompleteSearch((prev) => ({
                              ...prev,
                              [group.id]: event.target.value,
                            }))
                            if (!openModifierAutocompleteId || openModifierAutocompleteId !== group.id) {
                              setOpenModifierAutocompleteId(group.id)
                            }
                          }}
                          onFocus={() => {
                            setOpenModifierAutocompleteId(group.id)
                            // Clear the search when opening so all options are shown
                            setModifierAutocompleteSearch((prev) => ({
                              ...prev,
                              [group.id]: '',
                            }))
                          }}
                          placeholder="Mod"
                        />
                        <span className="modifier-autocomplete-arrow material-symbols-outlined">keyboard_arrow_down</span>
                        {openModifierAutocompleteId === group.id && (
                          <div
                            className="modifier-autocomplete-menu"
                            ref={(el) => {
                              if (el) {
                                modifierAutocompleteRefs.current[group.id] = el
                              }
                            }}
                          >
                            <div className="modifier-autocomplete-list">
                              <button
                                type="button"
                                className={`modifier-autocomplete-item ${
                                  !headerSelection?.modifier ? 'is-selected' : ''
                                }`}
                                onClick={() => {
                                  updateHeaderField(group.id, 'modifier', '')
                                  setOpenModifierAutocompleteId(null)
                                  setModifierAutocompleteSearch((prev) => {
                                    const next = { ...prev }
                                    delete next[group.id]
                                    return next
                                  })
                                }}
                              >
                                Mod
                              </button>
                              {getFilteredModifierOptionsForGroup(group.id).map((option) => (
                                <button
                                  key={option.code}
                                  type="button"
                                  className={`modifier-autocomplete-item ${
                                    headerSelection?.modifier === option.code ? 'is-selected' : ''
                                  }`}
                                  onClick={() => {
                                    updateHeaderField(group.id, 'modifier', option.code)
                                    setOpenModifierAutocompleteId(null)
                                    setModifierAutocompleteSearch((prev) => {
                                      const next = { ...prev }
                                      delete next[group.id]
                                      return next
                                    })
                                  }}
                                >
                                  {option.code} · {option.label}
                                </button>
                              ))}
                              {getFilteredModifierOptionsForGroup(group.id).length === 0 && (
                                <div className="modifier-autocomplete-empty">No matching modifiers</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div 
                        className="numeric-wrapper"
                        onMouseEnter={() => setHoveredMinutesGroupId(group.id)}
                        onMouseLeave={() => setHoveredMinutesGroupId(null)}
                      >
                        <input
                          type="text"
                          className="numeric-input"
                          placeholder="0"
                          value={headerSelection?.quantity ?? ''}
                          onChange={(event) => updateHeaderField(group.id, 'quantity', event.target.value)}
                        />
                        {hoveredMinutesGroupId === group.id && (
                          <div className="minutes-tooltip">
                            12m (2 units) last visit
                          </div>
                        )}
                      </div>
                      <span className="min-label">Min</span>
                      <div className="units-pill">
                        <span>{`${groupUnits} Units`}</span>
                      </div>
                    </div>
                    <div className="provider-wrapper">
                      <div className="select-wrapper select-wrapper--provider provider-autocomplete-wrapper">
                        <input
                          type="text"
                          className={`provider-select provider-autocomplete-input ${headerSelection?.provider ? 'has-value' : ''}`}
                          value={
                            openProviderAutocompleteId === group.id
                              ? providerAutocompleteSearch[group.id] || ''
                              : headerSelection?.provider || ''
                          }
                          onChange={(event) => {
                            setProviderAutocompleteSearch((prev) => ({
                              ...prev,
                              [group.id]: event.target.value,
                            }))
                            if (!openProviderAutocompleteId || openProviderAutocompleteId !== group.id) {
                              setOpenProviderAutocompleteId(group.id)
                            }
                          }}
                          onFocus={() => {
                            setOpenProviderAutocompleteId(group.id)
                            // Clear the search when opening so all options are shown
                            setProviderAutocompleteSearch((prev) => ({
                              ...prev,
                              [group.id]: '',
                            }))
                          }}
                          placeholder="Select provider"
                        />
                        <span className="provider-autocomplete-arrow material-symbols-outlined">keyboard_arrow_down</span>
                        {openProviderAutocompleteId === group.id && (
                          <div
                            className="provider-autocomplete-menu"
                            ref={(el) => {
                              if (el) {
                                providerAutocompleteRefs.current[group.id] = el
                              }
                            }}
                          >
                            <div className="provider-autocomplete-list">
                              <button
                                type="button"
                                className={`provider-autocomplete-item ${
                                  !headerSelection?.provider ? 'is-selected' : ''
                                }`}
                                onClick={() => {
                                  updateHeaderField(group.id, 'provider', '')
                                  setOpenProviderAutocompleteId(null)
                                  setProviderAutocompleteSearch((prev) => {
                                    const next = { ...prev }
                                    delete next[group.id]
                                    return next
                                  })
                                }}
                              >
                                Select provider
                              </button>
                              {getFilteredProviderOptionsForGroup(group.id).map((provider) => (
                                <button
                                  key={provider}
                                  type="button"
                                  className={`provider-autocomplete-item ${
                                    headerSelection?.provider === provider ? 'is-selected' : ''
                                  }`}
                                  onClick={() => {
                                    updateHeaderField(group.id, 'provider', provider)
                                    setOpenProviderAutocompleteId(null)
                                    setProviderAutocompleteSearch((prev) => {
                                      const next = { ...prev }
                                      delete next[group.id]
                                      return next
                                    })
                                  }}
                                >
                                  {provider}
                                </button>
                              ))}
                              {getFilteredProviderOptionsForGroup(group.id).length === 0 && (
                                <div className="provider-autocomplete-empty">No matching providers</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cpt-group-column-headers">
                  <span>HEP</span>
                  <span>Done</span>
                  <div className="header-more">
                    <button
                      type="button"
                      className="action-button action-button--ghost header-more-button"
                      onClick={() =>
                        setHeaderMenuOpenId((prev) => (prev === group.id ? null : group.id))
                      }
                      aria-haspopup="true"
                      aria-expanded={headerMenuOpenId === group.id}
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {headerMenuOpenId === group.id && (
                      <div className="header-menu">
                        <button
                          type="button"
                          className="header-menu-item"
                          onClick={() => handleHeaderMenuAction(group.id, 'markDone')}
                        >
                          Mark all interventions as done
                        </button>
                        <button
                          type="button"
                          className="header-menu-item"
                          onClick={() => handleHeaderMenuAction(group.id, 'addToHep')}
                        >
                          Add all interventions to HEP
                        </button>
                        <button
                          type="button"
                          className="header-menu-item header-menu-item--danger"
                          onClick={() => handleHeaderMenuAction(group.id, 'remove')}
                        >
                          Remove CPT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!collapsedGroups[group.id] && (
                <div
                  className="intervention-list"
                  onDragOver={(event) => handleListDragOver(event, group.id)}
                  onDrop={(event) => handleDropOnList(event, group.id)}
                >
                  {(() => {
                    const rows = []
                    group.interventions.forEach((intervention, index) => {
                      if (
                        dropLocation &&
                        dropLocation.groupId === group.id &&
                        dropLocation.index === index
                      ) {
                        rows.push(
                          <div
                            key={`${group.id}-indicator-${index}`}
                            className="drop-indicator"
                          />,
                        )
                      }
                      rows.push(
                        <InterventionRow
                          key={intervention.id}
                          intervention={intervention}
                          status={statusMap[intervention.id]}
                          onToggle={handleToggle}
                          onMenuToggle={handleMenuToggle}
                          isMenuOpen={menuOpenId === intervention.id}
                          isChecked={checkboxMap[intervention.id]}
                          onCheckboxToggle={toggleCheckbox}
                          onMenuAction={(groupId, interventionId, actionKey) =>
                            handleMenuAction(groupId, interventionId, actionKey)
                          }
                          groupId={group.id}
                          rowIndex={index}
                          onRowDragStart={handleDragStart}
                          onRowDragOver={handleRowDragOver}
                          onRowDragEnter={handleRowDragEnter}
                          onRowDrop={handleDropOnRow}
                          onRowDragEnd={handleDragEnd}
                        isDragging={draggingInfo?.id === intervention.id}
                        isNewlyAdded={newRowAnimationIds.includes(intervention.id)}
                        isRemoving={removingRowIds.includes(intervention.id)}
                        autoFocus={focusInterventionId === intervention.id}
                        onAutoFocusHandled={() => setFocusInterventionId(null)}
                        onNameBlur={handleAutoAddedRowBlur}
                        onNameChange={handleInterventionNameChange}
                        onDetailsChange={handleInterventionDetailsChange}
                        slashOptions={interventionLibrary}
                        onSlashSelectionComplete={handleSlashSelectionComplete}
                        onUnlink={handleUnlinkIntervention}
                        onOpenLink={handleOpenHep2GoLink}
                        isToDoToday={toDoTodayMap[intervention.id]}
                        onDoubleClick={() => handleDoubleClickToDo(intervention.id)}
                        isHighlighted={isHoveringLinkedLegend && !!intervention.hep2goId}
                        onAddNewRow={addIntervention}
                        />,
                      )
                    })
                    if (
                      dropLocation &&
                      dropLocation.groupId === group.id &&
                      dropLocation.index === group.interventions.length
                    ) {
                      rows.push(
                        <div key={`${group.id}-indicator-end`} className="drop-indicator" />,
                      )
                    }
                    rows.push(
                      <NewInterventionRow
                        key={`${group.id}-add`}
                        onCreate={() => addIntervention(group.id)}
                      />,
                    )
                    return rows
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </section>

      <footer className="flowsheet-footer">
        <div className="legend">
          <span className="legend-dot" role="presentation" />
          <p>To do today (double-click to mark as ‘to do’)</p>
          <span className="legend-divider" />
          <div 
            className="legend-link"
            onMouseEnter={() => setIsHoveringLinkedLegend(true)}
            onMouseLeave={() => setIsHoveringLinkedLegend(false)}
          >
            <IconLink />
            <p>Linked HEP2GO</p>
          </div>
        </div>
        <div className="footer-actions">
          <button className="ghost-pill">Email HEP</button>
          <button className="ghost-pill" onClick={handleResetFlowsheet}>
            Reset
          </button>
        </div>
      </footer>
    </article>
  )
}

