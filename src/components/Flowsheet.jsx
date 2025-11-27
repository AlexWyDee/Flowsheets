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
        cues: 'Neutral scapula, 3-count eccentrics with the red band.',
        sets: 3,
        reps: 5,
        weight: '10 lbs',
        status: 'todo',
      },
      {
        id: 'intervention-row-pattern',
        name: 'Resisted Row Pattern',
        cues: 'Slow, controlled scap retraction; avoid shrugging.',
        sets: 4,
        reps: 6,
        weight: '15 lbs',
        status: 'done',
      },
      {
        id: 'intervention-bridge',
        name: 'Hip Bridge with March',
        cues: 'Drive through heels and keep pelvis level.',
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
        cues: 'Track the ankle over the knee; eyes on fixed target.',
        sets: 2,
        reps: 30,
        weight: 'Bodyweight',
        status: 'todo',
      },
      {
        id: 'intervention-bosu-shifts',
        name: 'BOSU Pelvic Shifts',
        cues: 'Keep lumbar neutral while squeezing glutes.',
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
        cues: 'Keep elbows soft and reach into full overhead range.',
        sets: 3,
        reps: 5,
        weight: 'Red band',
        status: 'todo',
      },
      {
        id: 'intervention-gait',
        name: 'Step-up into Reverse Reach',
        cues: 'Slow eccentric and controlled trunk extension.',
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
  <svg aria-hidden="true" viewBox="0 0 24 24" role="img">
    <path
      d="M8.5 13.5a4 4 0 0 1 0-5.8l2.5-2.5a4 4 0 0 1 5.8 0l.8.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M15.5 10.5a4 4 0 0 1 0 5.8l-2.5 2.5a4 4 0 0 1-5.8 0l-.8-.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
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

const interventionLibrary = [
  { id: 'pt_bridge', name: 'Bridge', icon: 'fitness_center', color: '#ef4444' },
  { id: 'pt_clamshell', name: 'Clamshell', icon: 'accessibility', color: '#10b981' },
  { id: 'pt_heel_slide', name: 'Heel Slides', icon: 'directions_walk', color: '#3b82f6' },
  { id: 'pt_terminal', name: 'Terminal Knee Extension', icon: 'track_changes', color: '#8b5cf6' },
  { id: 'pt_balance', name: 'Single-Leg Balance', icon: 'balance', color: '#f97316' },
  { id: 'pt_bird_dog', name: 'Bird Dog', icon: 'sports_handball', color: '#6366f1' },
  { id: 'pt_wall_squat', name: 'Wall Squat', icon: 'stairs', color: '#0ea5e9' },
  { id: 'pt_row', name: 'Standing Row', icon: 'fitness_center', color: '#7c3aed' },
  { id: 'pt_hip_abduction', name: 'Sidelying Hip Abduction', icon: 'run_circle', color: '#14b8a6' },
  { id: 'pt_quadruped', name: 'Quadruped Rockback', icon: 'emoji_objects', color: '#22c55e' },
  { id: 'pt_towel_scrunch', name: 'Towel Scrunch', icon: 'pan_tool', color: '#ec4899' },
  { id: 'pt_ankle_pumps', name: 'Ankle Pumps', icon: 'accessible_forward', color: '#0f172a' },
  { id: 'pt_prone_ys', name: 'Prone Y’s', icon: 'accessibility_new', color: '#6366f1' },
  { id: 'pt_marching', name: 'Seated Marching', icon: 'directions_run', color: '#1d4ed8' },
  { id: 'pt_ball_rollout', name: 'Stability Ball Rollout', icon: 'sports_score', color: '#f97316' },
  { id: 'pt_mini_squat', name: 'Mini Squats', icon: 'fitness_center', color: '#0ea5e9' },
  { id: 'pt_pnf_d1', name: 'PNF Diagonal D1', icon: 'open_in_full', color: '#a855f7' },
  { id: 'pt_wall_angels', name: 'Wall Angels', icon: 'self_improvement', color: '#14b8a6' },
  { id: 'pt_eccentric_raise', name: 'Eccentric Heel Raise', icon: 'battery_charging_full', color: '#dc2626' },
  { id: 'pt_step_up', name: 'Lateral Step Ups', icon: 'terrain', color: '#0f172a' },
  { id: 'pt_glute_hold', name: 'Glute Bridge Hold', icon: 'self_improvement', color: '#2563eb' },
  { id: 'pt_reverse_lunge', name: 'Reverse Lunge', icon: 'fitness_center', color: '#f59e0b' },
  { id: 'pt_scap_pushup', name: 'Scapular Push Up', icon: 'fitness_center', color: '#0ea5e9' },
  { id: 'pt_high_plank', name: 'High Plank', icon: 'airline_seat_legroom_extra', color: '#0284c7' },
  { id: 'pt_supine_hamstring', name: 'Supine Hamstring Stretch', icon: 'accessibility', color: '#0f172a' },
  { id: 'pt_band_rows', name: 'Theraband Rows', icon: 'sensors', color: '#7c3aed' },
  { id: 'pt_cable_er', name: 'Cable External Rotation', icon: 'compare_arrows', color: '#22c55e' },
  { id: 'pt_bosu_squat', name: 'BOSU Squats', icon: 'terrain', color: '#f97316' },
  { id: 'pt_step_down', name: 'Step Down', icon: 'stairs', color: '#ef4444' },
  { id: 'pt_calf_stretch', name: 'Calf Stretch', icon: 'hot_tub', color: '#ec4899' },
  { id: 'pt_bridge_march', name: 'Bridge March', icon: 'fitness_center', color: '#0ea5e9' },
]

function IconMenuLink() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path
        d="M12 6.5a3.5 3.5 0 0 1 3.5 3.5h-2a1.5 1.5 0 1 0-1.5 1.5H9.5A3.5 3.5 0 0 1 6 8.5v0A3.5 3.5 0 0 1 9.5 5h0"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 17.5a3.5 3.5 0 0 1-3.5-3.5h2a1.5 1.5 0 0 0 1.5-1.5h2A3.5 3.5 0 0 1 18 15.5v0A3.5 3.5 0 0 1 14.5 19h0"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMenuConcurrent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <rect x="3.5" y="5" width="6" height="14" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
      <rect x="14.5" y="5" width="6" height="14" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
    </svg>
  )
}

function IconMenuDelete() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path
        d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"
        fill="none"
        stroke="#d21714"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9 4h6" fill="none" stroke="#d21714" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 11v5" fill="none" stroke="#d21714" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 11v5" fill="none" stroke="#d21714" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const cptOptions = [
  { code: '97110', label: 'Therapeutic Exercise' },
  { code: '97112', label: 'Neuromuscular Reeducation' },
  { code: '97530', label: 'Therapeutic Activity' },
  { code: '97140', label: 'Manual Therapy Techniques' },
]

const cptPickerOptions = [
  { code: '97110', label: 'Therapeutic Exercise' },
  { code: '97112', label: 'Neuromuscular Reeducation' },
  { code: '97530', label: 'Therapeutic Activity' },
  { code: '97140', label: 'Manual Therapy Techniques' },
  { code: '97140', label: 'Manual Therapy Techniques' },
  { code: '97116', label: 'Gait Training' },
  { code: '97150', label: 'Therapeutic Procedure' },
  { code: '97161', label: 'PT Evaluation Low Complexity' },
  { code: '97164', label: 'PT Re-evaluation' },
  { code: '97542', label: 'Wheelchair Management Training' },
]

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
  const match = groupLabel.match(/(\d{5})/)
  return match ? match[0] : cptOptions[0].code
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
}) {
  const isDone = status === 'done'
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const nameInputRef = useRef(null)
  const slashMenuRef = useRef(null)
  const [isSlashMenuOpen, setSlashMenuOpen] = useState(false)
  const [selectedSlashOptions, setSelectedSlashOptions] = useState([])
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
    if (isSlashMenuOpen) {
      setSelectedSlashOptions([])
    }
  }, [isSlashMenuOpen])

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
      }`}
      draggable
      onDragStart={(event) => onRowDragStart(event, groupId, rowIndex, intervention.id)}
      onDragEnd={onRowDragEnd}
      onDragOver={(event) => onRowDragOver(event, groupId, rowIndex)}
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
            className="intervention-input intervention-input--primary"
            type="text"
            value={intervention.name}
            placeholder='Type intervention, or "/" to search HEP2GO'
            aria-label="Intervention name"
            onChange={(event) => onNameChange(groupId, intervention.id, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === '/' && !isSlashMenuOpen) {
                event.preventDefault()
                setSlashMenuOpen(true)
                onNameChange(groupId, intervention.id, '')
              }
              if (event.key === 'Escape' && isSlashMenuOpen) {
                closeSlashMenu()
              }
            }}
            onBlur={(event) => onNameBlur?.(groupId, intervention.id, event.target.value)}
          />
          {isSlashMenuOpen && (
            <div ref={slashMenuRef} className="slash-menu">
              {filteredSlashOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`slash-menu-item ${
                    selectedSlashOptions.some((item) => item.id === option.id)
                      ? 'is-selected'
                      : ''
                  }`}
                  onClick={() => toggleSlashOption(option)}
                >
                  <div
                    className="slash-menu-thumb"
                    style={{ backgroundColor: option.color }}
                  >
                    <span className="material-symbols-outlined">{option.icon}</span>
                  </div>
                  <span className="slash-menu-name">{option.name}</span>
                </button>
              ))}
              {!filteredSlashOptions.length && (
                <div className="slash-menu-empty">No matching interventions</div>
              )}
            </div>
          )}
        </div>
        <input
          className="intervention-input intervention-input--details"
          type="text"
          value={intervention.cues}
          placeholder="Add details..."
          aria-label="Intervention details"
          onChange={(event) => onDetailsChange(groupId, intervention.id, event.target.value)}
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
      <span>Type intervention or "/" to search</span>
    </div>
  )
}

function EmptyFlowsheetState({ onAddCpt, onManualTherapy }) {
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
        <button type="button" className="ghost-pill" onClick={onManualTherapy}>
          Add Manual Therapy
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

  const toggleCheckbox = (id) => {
    setCheckboxMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const [menuOpenId, setMenuOpenId] = useState(null)
  const [isCptPickerOpen, setCptPickerOpen] = useState(false)
  const [cptSearch, setCptSearch] = useState('')
  const [selectedCptOptions, setSelectedCptOptions] = useState([])
  const cptPickerRef = useRef(null)
  const [headerMenuOpenId, setHeaderMenuOpenId] = useState(null)

  const filteredCptOptions = useMemo(() => {
    if (!cptSearch) return cptPickerOptions
    const lower = cptSearch.toLowerCase()
    return cptPickerOptions.filter(
      (option) =>
        option.code.toLowerCase().includes(lower) ||
        option.label.toLowerCase().includes(lower),
    )
  }, [cptSearch])

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
    if (!headerMenuOpenId) return undefined
    const handler = (event) => {
      if (event.target.closest('.header-menu')) return
      if (event.target.closest('.header-more-button')) return
      setHeaderMenuOpenId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [headerMenuOpenId])

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

      const [movedItem] = fromGroup.interventions.splice(fromIndex, 1)
      if (!movedItem) return prev

      let insertIndex = toIndex != null ? toIndex : toGroup.interventions.length
      if (fromGroupId === toGroupId && insertIndex > fromIndex) {
        insertIndex = Math.max(0, insertIndex - 1)
      }
      toGroup.interventions.splice(insertIndex, 0, movedItem)
      return groupsCopy
    })
  }

  const addCptGroup = (option, options = {}) => {
    const { closePicker = true } = options
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
      setCptPickerOpen(false)
      setCptSearch('')
      setSelectedCptOptions([])
    }
  }

  const toggleCptOptionSelection = (optionCode) => {
    setSelectedCptOptions((prev) =>
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

  const handleResetFlowsheet = () => {
    setGroupsData([])
    setStatusMap({})
    setCheckboxMap({})
    setHeaderState({})
    setCollapsedGroups({})
    setFocusInterventionId(null)
    setSelectedCptOptions([])
  }

  const handleDropOnRow = (event, targetGroupId, targetIndex) => {
    event.preventDefault()
    if (!draggingInfo) return
    const resolvedIndex =
      dropLocation && dropLocation.groupId === targetGroupId
        ? dropLocation.index
        : targetIndex
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
    const rect = event.currentTarget.getBoundingClientRect()
    const midPoint = rect.height / 2
    const targetIndex = event.clientY - rect.top < midPoint ? index : index + 1
    setDropLocation({ groupId, index: targetIndex })
  }

  const handleRowDragEnter = (event, groupId, index) => {
    event.preventDefault()
    setDropLocation({ groupId, index })
  }

  const handleListDragOver = (event, groupId) => {
    event.preventDefault()
    const group = groupsData.find((g) => g.id === groupId)
    const index = group ? group.interventions.length : 0
    setDropLocation({ groupId, index })
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
              onClick={() => setCptPickerOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isCptPickerOpen}
            >
              + CPT
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
          <button className="ghost-pill">+ Manual Therapy</button>
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
          <button type="button" className="summary-link">
            Mark all Done
          </button>
        </div>

        {!groupsData.length && (
          <EmptyFlowsheetState
            onAddCpt={() => setCptPickerOpen(true)}
            onManualTherapy={() => {}}
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
                      <div className="select-wrapper select-wrapper--cpt">
                        <select
                          className="cpt-select"
                          value={headerSelection?.cpt ?? ''}
                          onChange={(event) => updateHeaderField(group.id, 'cpt', event.target.value)}
                        >
                          {cptOptions.map((option) => (
                            <option key={option.code} value={option.code}>
                              {option.code} • {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="select-wrapper select-wrapper--modifier">
                        <select
                          className="modifier-select"
                          value={headerSelection?.modifier ?? ''}
                          onChange={(event) => updateHeaderField(group.id, 'modifier', event.target.value)}
                        >
                          <option value="">Mod</option>
                          {modifierOptions.map((option) => (
                            <option key={option.code} value={option.code}>
                              {option.code} • {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="numeric-wrapper">
                        <input
                          type="text"
                          className="numeric-input"
                          placeholder="0"
                          value={headerSelection?.quantity ?? ''}
                          onChange={(event) => updateHeaderField(group.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <span className="min-label">Min</span>
                      <div className="units-pill">
                        <span>{`${groupUnits} Units`}</span>
                      </div>
                    </div>
                    <div className="provider-wrapper">
                      <div className="select-wrapper select-wrapper--provider">
                        <select
                          className={`provider-select ${headerSelection?.provider ? 'has-value' : ''}`}
                          value={headerSelection?.provider ?? ''}
                          onChange={(event) => updateHeaderField(group.id, 'provider', event.target.value)}
                        >
                          <option value="">Select provider</option>
                          {providerOptions.map((provider) => (
                            <option key={provider} value={provider}>
                              {provider}
                            </option>
                          ))}
                        </select>
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
          <div className="legend-link">
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

