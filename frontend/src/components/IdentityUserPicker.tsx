import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { identityUsersApi } from "@/lib/identity-users-api"
import { ApiError } from "@/lib/api"
import type { IdentityUserDto } from "@/types/identityUser"

interface IdentityUserPickerProps {
  value: string | null
  onChange: (identityUserId: string, user: IdentityUserDto) => void
  disabled?: boolean
}

function displayName(user: IdentityUserDto): string {
  return user.name?.trim() || user.userName
}

export function IdentityUserPicker({ value, onChange, disabled }: IdentityUserPickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<IdentityUserDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IdentityUserDto | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestQueryRef = useRef("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const runSearch = async (filter: string) => {
    setIsLoading(true)
    try {
      const users = await identityUsersApi.search(filter)
      // Ignore stale responses if the user has typed something else since this
      // request was issued.
      if (latestQueryRef.current !== filter) return
      setResults(users)
    } catch (err) {
      if (latestQueryRef.current !== filter) return
      toast.error(err instanceof ApiError ? err.message : "Không tìm được tài khoản")
    } finally {
      if (latestQueryRef.current === filter) setIsLoading(false)
    }
  }

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
    setSelectedUser(null)
    setIsOpen(true)
    latestQueryRef.current = newQuery
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(newQuery), 300)
  }

  const handleSelect = (user: IdentityUserDto) => {
    setSelectedUser(user)
    setQuery(displayName(user))
    setResults([])
    setIsOpen(false)
    onChange(user.id, user)
  }

  const showResults = isOpen && results.length > 0 && !selectedUser

  return (
    <div className="grid gap-2">
      <Label htmlFor="identityUserSearch">Tìm tài khoản (tên hoặc email)</Label>
      <div className="relative" ref={containerRef}>
        <Input
          id="identityUserSearch"
          placeholder="Nhập để tìm..."
          value={query}
          disabled={disabled}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        {showResults && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            {isLoading ? (
              <div className="p-2">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <ul className="max-h-56 overflow-auto p-1">
                {results.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSelect(user)}
                    >
                      <div className="font-medium">{displayName(user)}</div>
                      {user.email && (
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {value && !selectedUser && (
        <p className="text-xs text-muted-foreground">Đã chọn tài khoản (ID: {value})</p>
      )}
    </div>
  )
}
