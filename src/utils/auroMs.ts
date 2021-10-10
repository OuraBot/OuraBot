#!/usr/bin/env node

/**
 * [relativeTime Determines the relative time from miliseconds]
 * @param  {number}  ms   [miliseconds]
 * @param  {boolean} long [long string]
 * @return {string}       [string of the relative time]
 */
export function prettyTime(ms: number, long?: boolean) {
    let years, days, hours, minutes, seconds;
    seconds = Math.floor(ms / 1000);

    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    hours = Math.floor(minutes / 60);
    minutes = minutes % 60;

    days = Math.floor(hours / 24);
    hours = hours % 24;

    years = Math.floor(days / 365);
    days = days % 365;

    if (long) {
        let resultArr = [];

        if (years == 1) {
            years > 0 ? resultArr.push(years + ' year') : '';
        } else if (years > 1) {
            days > 0 ? resultArr.push(years + ' years') : '';
        }

        if (days == 1) {
            days > 0 ? resultArr.push(days + ' day') : '';
        } else if (days > 1) {
            days > 0 ? resultArr.push(days + ' days') : '';
        }

        if (hours == 1) {
            hours > 0 ? resultArr.push(hours + ' hour') : '';
        } else if (hours > 1) {
            hours > 0 ? resultArr.push(hours + ' hours') : '';
        }

        if (minutes == 1) {
            minutes > 0 ? resultArr.push(minutes + ' minute') : '';
        } else if (minutes > 1) {
            minutes > 0 ? resultArr.push(minutes + ' minutes') : '';
        }

        if (seconds == 1) {
            seconds > 0 ? resultArr.push(seconds + ' second') : '';
        } else if (seconds > 1) {
            seconds > 0 ? resultArr.push(seconds + ' seconds') : '';
        }

        // Check if there are only seconds
        if (years == 0 && days == 0 && hours == 0 && minutes == 0) {
            return resultArr[0];
        } else if (resultArr.length == 2) {
            return `${resultArr[0]} and ${resultArr[1]}`;
        } else {
            resultArr[resultArr.length - 1] = `and ${resultArr[resultArr.length - 1]}`;

            return resultArr.join(', ');
        }
    } else if (long == false) {
        let resultArr = [];

        if (years >= 1) {
            years > 0 ? resultArr.push(years + 'y') : '';
        }

        if (days >= 1) {
            days > 0 ? resultArr.push(days + 'd') : '';
        }

        if (hours >= 1) {
            hours > 0 ? resultArr.push(hours + 'h') : '';
        }

        if (minutes >= 1) {
            minutes > 0 ? resultArr.push(minutes + 'm') : '';
        }

        if (seconds >= 1) {
            seconds > 0 ? resultArr.push(seconds + 's') : '';
        }

        // Check if there are only seconds
        if (years == 0 && days == 0 && hours == 0 && minutes == 0) {
            return resultArr[0];
        } else if (resultArr.length == 2) {
            return `${resultArr[0]} and ${resultArr[1]}`;
        } else {
            resultArr[resultArr.length - 1] = `and ${resultArr[resultArr.length - 1]}`;

            return resultArr.join(', ');
        }
    }
}
