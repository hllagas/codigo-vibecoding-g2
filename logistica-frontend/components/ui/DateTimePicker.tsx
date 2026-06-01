"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: string        // YYYY-MM-DDTHH:MM
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({ value, onChange, placeholder = "Selecciona fecha y hora", disabled, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const datePart = value ? value.slice(0, 10) : ""
  const timePart = value ? (value.slice(11, 16) || "00:00") : "00:00"

  const date = React.useMemo(() => {
    if (!datePart) return undefined
    const parsed = parse(datePart, "yyyy-MM-dd", new Date())
    return isValid(parsed) ? parsed : undefined
  }, [datePart])

  function handleSelectDate(selected: Date | undefined) {
    const newDate = selected ? format(selected, "yyyy-MM-dd") : ""
    if (newDate) {
      onChange?.(`${newDate}T${timePart}`)
    } else {
      onChange?.("")
    }
    setOpen(false)
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTime = e.target.value
    if (datePart) {
      onChange?.(`${datePart}T${newTime}`)
    }
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "flex-1 justify-start text-left font-normal h-8",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelectDate}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={timePart}
        onChange={handleTimeChange}
        disabled={disabled || !datePart}
        className="w-32 h-8"
      />
    </div>
  )
}
