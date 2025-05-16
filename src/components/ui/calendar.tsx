"use client"

import * as React from "react"
import Calendar from "react-calendar"
import { cn } from "@/lib/utils"

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface CalendarProps {
  mode?: "single" | "range"
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  className?: string
  disabled?: boolean
}

function CustomCalendar({
  mode = "single",
  selected,
  onSelect,
  className,
  disabled = false,
  ...props
}: CalendarProps) {
  const handleChange = (value: Value) => {
    if (!onSelect) return;
    
    if (Array.isArray(value)) {
      // Handle range selection if needed
      onSelect(value[0]);
    } else {
      onSelect(value);
    }
  };

  return (
    <Calendar
      value={selected}
      onChange={handleChange}
      className={cn(
        "p-3 react-calendar",
        "border-0 rounded-md shadow-sm bg-white",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
}

// Add required CSS for react-calendar
const styles = `
.react-calendar {
  width: 350px;
  max-width: 100%;
  background: white;
  font-family: inherit;
  line-height: 1.125em;
}
.react-calendar--doubleView {
  width: 700px;
}
.react-calendar--doubleView .react-calendar__viewContainer {
  display: flex;
  margin: -0.5em;
}
.react-calendar--doubleView .react-calendar__viewContainer > * {
  width: 50%;
  margin: 0.5em;
}
.react-calendar button {
  margin: 0;
  border: 0;
  outline: none;
  border-radius: 0.375rem;
}
.react-calendar button:enabled:hover {
  cursor: pointer;
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
.react-calendar__navigation {
  display: flex;
  height: 44px;
  margin-bottom: 1em;
}
.react-calendar__navigation button {
  min-width: 44px;
  background: none;
}
.react-calendar__navigation button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.react-calendar__navigation button:enabled:hover,
.react-calendar__navigation button:enabled:focus {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
.react-calendar__month-view__weekdays {
  text-align: center;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 0.75em;
  color: hsl(var(--muted-foreground));
}
.react-calendar__month-view__weekdays__weekday {
  padding: 0.5em;
}
.react-calendar__month-view__weekNumbers .react-calendar__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75em;
  font-weight: bold;
}
.react-calendar__month-view__days__day--weekend {
  color: hsl(var(--destructive));
}
.react-calendar__month-view__days__day--neighboringMonth {
  color: hsl(var(--muted-foreground));
}
.react-calendar__year-view .react-calendar__tile,
.react-calendar__decade-view .react-calendar__tile,
.react-calendar__century-view .react-calendar__tile {
  padding: 2em 0.5em;
}
.react-calendar__tile {
  max-width: 100%;
  padding: 10px 6.6667px;
  background: none;
  text-align: center;
  line-height: 16px;
}
.react-calendar__tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: hsl(var(--muted));
}
.react-calendar__tile:enabled:hover,
.react-calendar__tile:enabled:focus {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
.react-calendar__tile--now {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
.react-calendar__tile--hasActive {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
.react-calendar__tile--hasActive:enabled:hover,
.react-calendar__tile--hasActive:enabled:focus {
  background-color: hsl(var(--primary));
}
.react-calendar__tile--active {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
.react-calendar__tile--active:enabled:hover,
.react-calendar__tile--active:enabled:focus {
  background-color: hsl(var(--primary));
}
.react-calendar--selectRange .react-calendar__tile--hover {
  background-color: hsl(var(--accent));
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export { CustomCalendar as Calendar }
