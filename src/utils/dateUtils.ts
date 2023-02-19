export const convertDateToStandardFormat = (dateString: string) => {
    const date = new Date(dateString).toISOString();
    // const options = { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'long' };

    console.log('formattedDate', date);
    return date;
}