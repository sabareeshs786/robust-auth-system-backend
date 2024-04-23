function isvalidInputData(dataObject) {
    for (const prop in dataObject) {
        if (dataObject.hasOwnProperty(prop)) {
            const value = dataObject[prop];
            if (!Boolean(value)) {
                return false;
            }
        }
    }
    return true;
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidPhoneNumber(phoneNumber) {
    const phoneRegex = /^\+\d{1,3}\s\d{4,}$/;
    return phoneRegex.test(phoneNumber);
}

function isValidName(name) {
    const nameRegex = /^[A-Za-z\s]{1,30}$/;
    return nameRegex.test(name);
}

function isValidAddress(address) {
    const addressRegex = /^[A-Za-z0-9\s,.'\-/]{1,100}$/;
    return addressRegex.test(address);
}

function isValidCode(code){
    const codeRegex = /^[0-9]{6}$/;
    return codeRegex.test(code);
}

const getNumVal = (s) => {
    if (s === undefined || s === null || s === '')
        return null;
    const num = Number(s);
    if (Number.isNaN(num))
        return null;
    return num;
}

const getIntVal = (s, d) => {
    if (s === undefined || s === null || s === '')
        return null;
    const num = Number(s);
    if (Number.isNaN(num) || !Number.isInteger(num))
        return null;
    return num;
}

const removeEmptyFields = (fields) => {
    for (const key of Object.keys(fields)) {
        let value = fields[key];
        if (typeof value === 'object' && value !== null) {
            let retObj = removeEmptyFields(value);
            if (Object.keys(retObj).length === 0)
                delete fields[key]
        }
        else if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                if (typeof value[i] === 'object' && value[i] !== null) {
                    value[i] = removeEmptyFields(value[i]);
                    if (Object.keys(value[i]).length === 0)
                        value.splice(i, 1);
                }
                else {
                    if (!value[i])
                        value.splice(i, 1);
                }
            }

        }
        else {
            if (value === undefined || value === null)
                delete fields[key];
        }
    }
    return fields;
}

const strValToNumVal = (obj) => {
    Object.entries(obj).forEach(([key, val]) => {
        obj[key] = val === '' || val === undefined || val === null ? null : Number(val);
    });
    return Object.fromEntries(Object.entries(obj).filter(([key, value]) => !Number.isNaN(value) || value === null));
};

const strValToNumArr = (str) => {
    const strArr = str.split(',');
    let numArr = strArr.map((s) => Number(s));
    numArr = numArr.filter((num) => !Number.isNaN(num) && num !== 0);
    return numArr.map((n) => Number.parseInt(n, 10));
}

const generateVerificationCode = () => {
    const min = 100000;
    const max = 999999;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

const getField = (emailPhno) => {
    if(isValidEmail(emailPhno)){
        return "email";
    }
    else if(isValidPhoneNumber(emailPhno)){
        return "phno";
    }
    else
        return null;
}

module.exports = { isvalidInputData, removeEmptyFields, 
    strValToNumVal, strValToNumArr, isValidPhoneNumber, 
    isValidName, getNumVal, getIntVal, isValidAddress,
    generateVerificationCode, isValidEmail, getField, 
    isValidCode };