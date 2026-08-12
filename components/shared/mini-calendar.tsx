import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { dateKey } from "@/lib/academics";
import { DAY_NAMES_SHORT } from "@/lib/academics";

export interface CalendarEventItem {
  date: string;
  type: string;
  color: string;
  title: string;
}

interface MiniCalendarProps {
  events?: CalendarEventItem[];
  onSelect?: (date: Date) => void;
  highlightToday?: boolean;
}

export function MiniCalendar({
  events = [],
  onSelect,
  highlightToday = true,
}: MiniCalendarProps) {
  const today = new Date();
  const [view, setView] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    setView(new Date(today.getFullYear(), today.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  const prevMonth = () => setView(new Date(year, month - 1, 1));
  const nextMonth = () => setView(new Date(year, month + 1, 1));

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(view);

  const eventMap = new Map<string, CalendarEventItem[]>();
  for (const event of events) {
    const key = event.date;
    const list = eventMap.get(key) ?? [];
    list.push(event);
    eventMap.set(key, list);
  }

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="text-muted-foreground hover:bg-muted rounded-md px-2 py-1 text-sm"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="text-muted-foreground hover:bg-muted rounded-md px-2 py-1 text-sm"
          aria-label="Bulan berikutnya"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES_SHORT.map((day) => (
          <div
            key={day}
            className="text-muted-foreground py-1 text-[10px] font-semibold uppercase"
          >
            {day}
          </div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const key = dateKey(date);
          const dayEvents = eventMap.get(key) ?? [];
          const isToday =
            highlightToday &&
            dateKey(today) === key;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect?.(date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors",
                isToday
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted"
              )}
            >
              <span>{day}</span>
              {dayEvents.length > 0 && !isToday && (
                <span className="mt-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <span
                      key={idx}
                      className="size-1 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
