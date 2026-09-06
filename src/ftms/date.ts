import { any } from "bluebird";

export class DateFormatter {

    private monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    private monthNames = ["January", "February", "March", "April", "May",
        "June", "July", "August", "September", "October", "November", "December"
    ];

    public pretty(dateStr: string | Date): string {
        const date = new Date(dateStr);
        const d = date.getDate();
        const m = this.monthNamesShort[date.getMonth()];
        const y = date.getFullYear();
        return m + ' ' + d + ', ' + y;
    }

    public ymd(dateStr: string | Date): string {
        const date = new Date(dateStr);
        const months = date.getMonth() + 1;
        const d = ('0' + date.getDate()).slice(-2);
        const m = ('0' + months).slice(-2);
        const y = date.getFullYear();
        return y + '-' + m + '-' + d;
    }

    public time(dateStr: string | Date): string {
        const date = new Date(dateStr);
        let hours: any = date.getHours();
        let minutes: any = date.getMinutes();
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (hours < 10) {
            hours = '0' + hours;
        }
        return hours + ':' + minutes;
    }


    public dateTime(dateStr: string | Date): string {
        const date = new Date(dateStr);
        const months = date.getMonth() + 1;
        const d = ('0' + date.getDate()).slice(-2);
        const m = ('0' + months).slice(-2);
        const y = date.getFullYear();
        let hours = date.getHours();
        let minutes: any = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return d + '-' + m + '-' + y + ' ' + hours + ':' + minutes + ' ' + ampm
    }


    public Time12(dateStr: string | Date): string {
        const date = new Date(dateStr);
        const months = date.getMonth() + 1;
        let hours = date.getHours();
        let minutes: any = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm
    }



    public timeDifference(toDate: number, fromDate: number): any {
        if (fromDate > toDate) {
            return "Invalid";
        }
        let s = toDate - fromDate;
        const ms = s % 1000;
        s = (s - ms) / 1000;
        const secs = s % 60;
        s = (s - secs) / 60;
        const mins = s % 60;
        const hrs = (s - mins) / 60;
        // return hrs + 'H' + mins + ':' + secs + '.' + ms;
        return hrs + ':' + mins + ' hour(s)';
    }


    public msToHour(time: number): any {
        let s = time;
        const ms = s % 1000;
        s = (s - ms) / 1000;
        const secs = s % 60;
        s = (s - secs) / 60;
        const mins = s % 60;
        const hrs = (s - mins) / 60;
        return hrs + ':' + mins + ' hour(s)';
    }

    public my(dateStr: string | Date, short: boolean = false): string {
        const date = new Date(dateStr);
        let m;
        if (short)
            m = this.monthNamesShort[date.getMonth()];
        else
            m = this.monthNames[date.getMonth()];
        const y = date.getFullYear();
        return `${m}, ${y}`;
    }

    public nextMonth(date: Date): Date {
        let current;
        if (date.getMonth() === 11) {
            current = new Date(date.getFullYear() + 1, 0, date.getDate());
        } else {
            current = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
        }
        return current;
    }

    public now(): Date {
        return new Date();
    }

    public formatDateTime(dateTimeStr: any) {
        const [datePart, timePart, ampm] = dateTimeStr.split(' ');
        const [month, day, year] = datePart.split('/');
        let [hours, minutes] = timePart.split(':');

        // Convert to 24-hour format
        hours = parseInt(hours, 10);
        if (ampm.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
        } else if (ampm.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }

        // Pad hours, minutes with leading zeros if necessary
        hours = hours.toString().padStart(2, '0');
        minutes = minutes.padStart(2, '0');

        // Format the date and time in the required format
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hours}:${minutes}:00`;
    }
}

export const dateFormatter = new DateFormatter();