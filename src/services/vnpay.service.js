const config = require('../config/config');
const vnpay = require('../config/vnpay');
const moment = require('moment');

const createPaymentURL = async (paymentId, payemntData) => {
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');

    const { amount, ipAddr, bankCode, lang } = payemntData
    const returnUrl = config.vnpay.vnp_ReturnUrl
    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: amount,
        vnp_IpAddr: ipAddr,
        vnp_ReturnUrl: returnUrl,
        vnp_BankCode: bankCode,
        vnp_Locale: lang || 'vn',
        vnp_OrderInfo: `Thanh toán học phí tháng ${payemntData.month}/${payemntData.year}`,
        vnp_TxnRef: `${paymentId}.${createDate}`,
    })
    return (paymentUrl)
}

const verifyReturnURL = async (url_query) => {
    const verify = vnpay.verifyReturnUrl(url_query)
    if (verify.isSuccess) {
        return verify
    } else {
        console.log(`❌ Thanh toán ${paymentId} thất bại:`, verify.message);
    }
}

const verifyIPN = async (url_query) => {
    const verify = vnpay.verifyIpnCall(url_query)
    if (verify.isSuccess) {
        return verify
    } else {
        console.log(`❌ Thanh toán ${paymentId} thất bại:`, verify.message);
    }
}

module.exports = {
    createPaymentURL,
    verifyReturnURL,
    verifyIPN
}