"use client";

import { useState, useEffect, useRef } from "react";
import { User, X, Search, Loader2 } from "lucide-react";
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
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Debounced search
  useEffect(() => {
    if (selected) return;
    if (!query || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
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

    return () => clearTimeout(debounceRef.current);
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
      {/* Input */}
      <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2 focus-within:border-gray-300 transition-colors">
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
          className="text-xs text-gray-600 outline-none bg-transparent flex-1 placeholder:text-gray-300 min-w-0"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-300 hover:text-gray-500 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="text-xs">
                  {user.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {user.name || "Unknown"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </button>
          ))}

          {/* Manual email hint */}
          <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              Not listed? Type their email directly.
            </p>
          </div>
        </div>
      )}

      {/* No results state */}
      {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-gray-500">No users found</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              You can still type their email directly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}