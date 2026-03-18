"use client";

import { useState, useEffect, useRef } from "react";
import { User, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface UserSearchInputProps {
  value: string;
  onChange: (email: string) => void;
}

export function UserSearchInput({ value, onChange }: UserSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selected) return;
    if (!query || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  const handleSelect = (user: UserResult) => {
    setSelected(user);
    setQuery(user.email || "");
    onChange(user.email || "");
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    onChange("");
    setResults([]);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (selected) setSelected(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 focus-within:border-gray-300 dark:focus-within:border-gray-600 transition-colors bg-transparent">
        {selected ? (
          <Avatar className="w-4 h-4 flex-shrink-0">
            <AvatarImage src={selected.image || ""} />
            <AvatarFallback className="text-[8px]">
              {selected.name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
        ) : isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 animate-spin" />
        ) : (
          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}

        <input
          type="text"
          placeholder="Search name or type email..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="text-xs text-gray-600 dark:text-gray-300 outline-none bg-transparent flex-1 placeholder:text-gray-300 dark:placeholder:text-gray-600 min-w-0"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="text-xs">
                  {user.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                  {user.name || "Unknown"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </button>
          ))}

          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400">
              Not listed? Type their email directly.
            </p>
          </div>
        </div>
      )}

      {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No users found
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              You can still type their email directly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}