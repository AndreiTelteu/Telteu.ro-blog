import { Component, For } from "solid-js";
import moment from "moment";
// import "moment/dist/locale/ro"; // if you need to change the locale
// moment.locale("ro");

const FullCalendar: Component = () => {
  const weekdays = moment.weekdaysMin();
  const months = moment.months();
  const fullYear = Object.fromEntries(
    months.map((monthName, monthIndex) => {
      return [
        monthName,
        new Array(6).fill(1).map((i, rowIndex) => {
          return weekdays.map((dayName, colIndex) => {
            const day = moment()
              // .year(2024) // if you need to change the year
              .month(monthIndex)
              .date(rowIndex * 7)
              .weekday(colIndex);
            return day.month() == monthIndex ? day.format("D") : "";
          });
        }),
      ];
    })
  );

  return (
    <div class="solidcalendar-container">
      <For each={Object.keys(fullYear)}>
        {(monthName) => (
          <div class="solidcalendar-month">
            <div class="solidcalendar-monthname">{monthName}</div>
            <div class="solidcalendar-weekdays">
              <For each={weekdays}>
                {(weekDayName) => (
                  <div class="solidcalendar-weekday solidcalendar-column">
                    {weekDayName}
                  </div>
                )}
              </For>
            </div>
            
            <For each={fullYear[monthName]}>
              {(days) => (
                <div class="solidcalendar-week">
                  <For each={days}>
                    {(day) => (
                      <div class="solidcalendar-weekday solidcalendar-column">
                        {day}
                      </div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
};

export default FullCalendar;