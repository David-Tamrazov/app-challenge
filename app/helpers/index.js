/* 

    Change the format of the date:
        if toClient == true, it takes a date string of the format "2017-06-05" and turns it to "05/06/2017"
        else, it takes a date string of the format "05/06/2017" and turns it to "2017-06-5"

*/
var reverseDateString = (date, toClient) => {

    var splitter = toClient ? '-' : '/';
    var joiner = toClient ? '/' : '-';
    var splitDate = date.split(splitter);

    return splitDate[2] + joiner + splitDate[1] + joiner + splitDate[0]

}

/*
    Create a payperiod string out of a Date object.
    Returns a string of the format: "dd/mm/yyyy - dd/mm/yyyy"
*/
var getPayPeriod = (date) => {

    // get the individual date attributes in UTC to avoid any date parsing issues with local time vs daylight savings vs global time
    var day = date.getUTCDate();
    var month = date.getUTCMonth() + 1;
    var year = date.getUTCFullYear();

    // figure out the start and end of the pay period based on simple boolean checks 
    var payPeriodStart = day > 15 ? 16 : 1;

    // UTC months start from 0, so we add + 1 to make getPayPeriodEnd function more readable
    var payPeriodEnd = day > 15 ? getPayPeriodEnd(month, year) : 15;

    return payPeriodStart + "/" + month + "/" + year + " - " + payPeriodEnd + "/" + month + "/" + year;

}

/*
    Return a different end-of-the-month date based on the given month
        Jan/March/May/July/Aug/Oct/Dec == 31
        Feb == 29 if leap year, 28 otherwise
        All others == 30
*/
var getPayPeriodEnd = (month, year) => {

    switch (month) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
            return 31;
        case 2:
            if (leapYear(year)) return 29;
            return 28;
        default:
            return 30;
    }

}

/*
    Boolean expression to determine whether a given year is a leap year
*/
var leapYear = (year) => {
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}

module.exports = {
    leapYear,
    getPayPeriodEnd, 
    getPayPeriod,
    reverseDateString
}
    