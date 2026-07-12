import { useMemo, useState } from "react"
import type { KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  suggestions?: string[]
  placeholder?: string
  id?: string
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  id,
}: TagInputProps) {
  const [draft, setDraft] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const filteredSuggestions = useMemo(() => {
    const query = draft.trim().toLowerCase()
    return suggestions
      .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
      .filter((s) => !query || s.toLowerCase().includes(query))
      .slice(0, 8)
  }, [suggestions, draft, value])

  const commitDraft = (raw: string) => {
    const tag = raw.trim()
    if (!tag) return
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setDraft("")
      return
    }
    onChange([...value, tag])
    setDraft("")
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((v) => v !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commitDraft(draft)
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Xoá ${tag}`}
              className="rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            commitDraft(draft)
            setTimeout(() => setIsFocused(false), 150)
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-24 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {isFocused && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitDraft(s)}
              className="flex w-full items-center px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
