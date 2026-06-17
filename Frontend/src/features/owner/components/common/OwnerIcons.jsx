function IconBase({ children, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function GridIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </IconBase>
  );
}

export function BuildingIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 21V4h12v17M4 21h16M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-5h4v5"
      />
    </IconBase>
  );
}

export function EyeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
      />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function PlusCircleIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v8M8 12h8" />
    </IconBase>
  );
}

export function MessageIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.3-4A8 8 0 1 1 21 12Z"
      />
    </IconBase>
  );
}

export function SettingsIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a8.8 8.8 0 0 0 .1-6l-2.1-.5-1-2-2 .8a9 9 0 0 0-5 0l-2-.8-1 2-2.1.5a8.8 8.8 0 0 0 .1 6l2 .5 1 2 2-.8a9 9 0 0 0 5 0l2 .8 1-2 2-.5Z"
      />
    </IconBase>
  );
}

export function UserIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </IconBase>
  );
}

export function CheckIcon({ className }) {
  return (
    <IconBase className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
    </IconBase>
  );
}

export function TrashIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
      />
    </IconBase>
  );
}
